import express from 'express';
import pool from './db.js';

const router = express.Router();

// ── Helper: generate kode_penelitian otomatis, format PN-{tahun}-{urutan 3 digit} ──
async function generateKodePenelitian(tahun_anggaran) {
    const [rows] = await pool.query(
        'SELECT COUNT(*) AS total FROM penelitian WHERE tahun_anggaran = ?',
        [tahun_anggaran]
    );
    const urutan = (rows[0].total || 0) + 1;
    return `PN-${tahun_anggaran}-${String(urutan).padStart(3, '0')}`;
}

// ── Helper: format tanggal 'YYYY-MM-DD' -> 'DD Mon YYYY' (konsisten dgn tabel cashflow lama) ──
function formatTanggalToStr(dateStr) {
    if (!dateStr) return dateStr;
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return `${String(d.getDate()).padStart(2,'0')} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// GET all penelitian
router.get('/', async (req, res) => {
    try {
        const { user_id, role, tahun } = req.query;

        let query;
        let params = [];

        if (role === 'admin') {
            query = `SELECT * FROM penelitian`;
            if (tahun) {
                query += ` WHERE tahun_anggaran = ?`;
                params = [tahun];
            }
            query += ` ORDER BY id DESC`;
        } else if (user_id) {
            query = `SELECT * FROM penelitian WHERE user_id = ?`;
            params = [user_id];
            if (tahun) {
                query += ` AND tahun_anggaran = ?`;
                params.push(tahun);
            }
            query += ` ORDER BY id DESC`;
        } else {
            return res.json([]);
        }

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('Gagal mengambil data penelitian:', err.message);
        res.status(500).json({ error: 'Gagal mengambil data penelitian' });
    }
});

// GET dashboard stats — HARUS di atas '/:id' agar 'stats' tidak tertangkap sebagai id
router.get('/stats', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT COUNT(*) AS total FROM penelitian');
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create penelitian — menerima seluruh field dari form "Tambah Penelitian"
// termasuk rincian_rab (-> tabel cashflow) dan kegiatan (-> tabel kegiatan)
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const {
            nama_penelitian,
            ketua_penelitian,
            unit_kerja,
            tanggal_mulai,
            tanggal_selesai,
            durasi_bulan,
            bidang_penelitian,
            skema_penelitian,
            sumber_pendanaan,
            tahun_anggaran,
            total_anggaran,
            progress_rata_rata,
            rincian_rab,   // array dari section B form
            kegiatan,      // array dari section C form
            user_id,       // opsional, kalau ada sistem login per-user
        } = req.body;

        if (!nama_penelitian || !ketua_penelitian) {
            return res.status(400).json({ error: 'Nama penelitian dan ketua peneliti wajib diisi' });
        }

        await connection.beginTransaction();

        const kode_penelitian = await generateKodePenelitian(tahun_anggaran);

        const [result] = await connection.query(
            `INSERT INTO penelitian
                (kode_penelitian, nama_penelitian, ketua_penelitian, unit_kerja,
                 tanggal_mulai, tanggal_selesai, durasi_bulan, bidang_penelitian,
                 skema_penelitian, sumber_pendanaan, tahun_anggaran, total_anggaran,
                 realisasi_anggaran, progress_rata_rata, status_penelitian, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'Berjalan', ?)`,
            [
                kode_penelitian,
                nama_penelitian,
                ketua_penelitian,
                unit_kerja || null,
                tanggal_mulai || null,
                tanggal_selesai || null,
                durasi_bulan || null,
                bidang_penelitian || null,
                skema_penelitian || null,
                sumber_pendanaan || null,
                tahun_anggaran || null,
                total_anggaran || 0,
                progress_rata_rata || 0,
                user_id || null,
            ]
        );

        const penelitian_id = result.insertId;

        // Simpan rincian kegiatan (dipakai untuk Kurva S / progress per-langkah)
        if (Array.isArray(kegiatan) && kegiatan.length > 0) {
            for (const k of kegiatan) {
                if (!k.nama_kegiatan) continue;
                await connection.query(
                    `INSERT INTO kegiatan
                        (penelitian_id, nama_kegiatan, bobot, progress, tanggal_mulai, tanggal_selesai)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        penelitian_id,
                        k.nama_kegiatan,
                        k.bobot || 0,
                        k.progress || 0,
                        k.tanggal_mulai || null,
                        k.tanggal_selesai || null,
                    ]
                );
            }
        }

        // Simpan rincian RAB sebagai transaksi cashflow awal
        if (Array.isArray(rincian_rab) && rincian_rab.length > 0) {
            for (const r of rincian_rab) {
                if (!r.uraian) continue;
                await connection.query(
                    `INSERT INTO cashflow
                        (penelitian_id, tanggal, uraian, jenis_belanja, nominal)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        penelitian_id,
                        formatTanggalToStr(r.tanggal),
                        r.uraian,
                        r.jenis_belanja || 'Alat',
                        r.nominal || 0,
                    ]
                );
            }
        }

        await connection.commit();
        res.json({ id: penelitian_id, kode_penelitian, message: 'Penelitian berhasil ditambahkan' });
    } catch (err) {
        await connection.rollback();
        console.error('Gagal menyimpan penelitian:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// GET single penelitian by id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM penelitian WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Penelitian tidak ditemukan' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Gagal mengambil detail penelitian:', err.message);
        res.status(500).json({ error: 'Gagal mengambil detail penelitian' });
    }
});

// PUT update penelitian (dipakai untuk update status_penelitian dari Dashboard, dll)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;

        const keys = Object.keys(fields);
        if (keys.length === 0) {
            return res.status(400).json({ error: 'Tidak ada data untuk diupdate' });
        }

        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = keys.map(key => fields[key]);

        const [result] = await pool.query(
            `UPDATE penelitian SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Penelitian tidak ditemukan' });
        }

        res.json({ message: 'Berhasil diupdate' });
    } catch (err) {
        console.error('Gagal update penelitian:', err.message);
        res.status(500).json({ error: 'Gagal mengupdate data penelitian' });
    }
});

// DELETE penelitian
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM penelitian WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Penelitian tidak ditemukan' });
        }

        res.json({ message: 'Berhasil dihapus' });
    } catch (err) {
        console.error('Gagal menghapus penelitian:', err.message);
        res.status(500).json({ error: 'Gagal menghapus data penelitian' });
    }
});

export default router;
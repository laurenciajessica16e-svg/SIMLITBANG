import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import penelitianRoutes from './penelitianRoutes.js';
import authRoutes from './authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// =========================================================================
// ROUTE DASHBOARD PROGRESS
// Tabel: dashboard_progress (id, name, progress, tahun)
// =========================================================================
app.get('/api/dashboard-progress', async (req, res) => {
    const { tahun } = req.query;
    try {
        let query = "SELECT id, name, progress, tahun FROM dashboard_progress ORDER BY id ASC";
        let params = [];

        if (tahun) {
            query = "SELECT id, name, progress, tahun FROM dashboard_progress WHERE tahun = ? ORDER BY id ASC";
            params = [tahun];
        }

        const [results] = await pool.query(query, params);
        res.json(results);
    } catch (err) {
        console.error("Gagal mengambil data trend dashboard:", err.message);
        res.status(500).json({ error: 'Gagal mengambil data dari database' });
    }
});

// Routes utama penelitian (CRUD penelitian)
app.use('/api/penelitian', penelitianRoutes);

// =========================================================================
// ROUTE KEGIATAN
// Tabel: kegiatan (id, penelitian_id, nama_kegiatan, bobot, progress, tanggal_mulai, tanggal_selesai)
// CATATAN: Kolom 'status' sudah di-DROP, 'bulan' sudah di-DROP
//          tanggal_mulai dan tanggal_selesai adalah DATE NULL
// =========================================================================

// GET - Ambil semua kegiatan berdasarkan penelitian_id
app.get('/api/kegiatan', async (req, res) => {
    const { penelitian_id } = req.query;
    if (!penelitian_id) {
        return res.status(400).json({ error: "Parameter penelitian_id wajib disertakan!" });
    }
    try {
        const [results] = await pool.query(
            `SELECT 
                id,
                penelitian_id,
                nama_kegiatan,
                bobot,
                progress,
                DATE_FORMAT(tanggal_mulai, '%Y-%m-%d') AS tanggal_mulai,
                DATE_FORMAT(tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai
            FROM kegiatan 
            WHERE penelitian_id = ? 
            ORDER BY id ASC`,
            [penelitian_id]
        );
        res.json(results);
    } catch (err) {
        console.error("Gagal mengambil list kegiatan:", err.message);
        res.status(500).json({ error: "Gagal memuat data kegiatan dari database" });
    }
});

// POST - Tambah kegiatan baru
// Bobot dihitung otomatis di frontend berdasarkan durasi hari
app.post('/api/kegiatan', async (req, res) => {
    const { nama_kegiatan, bobot, progress, tanggal_mulai, tanggal_selesai, penelitian_id } = req.body;

    if (!nama_kegiatan || !nama_kegiatan.trim()) {
        return res.status(400).json({ error: "Nama kegiatan wajib diisi!" });
    }
    if (!tanggal_mulai || !tanggal_selesai) {
        return res.status(400).json({ error: "Tanggal mulai dan tanggal selesai wajib diisi!" });
    }
    if (!penelitian_id) {
        return res.status(400).json({ error: "penelitian_id wajib disertakan!" });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO kegiatan 
                (penelitian_id, nama_kegiatan, bobot, progress, tanggal_mulai, tanggal_selesai) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                penelitian_id,
                nama_kegiatan.trim(),
                bobot || 0,
                progress || 0,
                tanggal_mulai,
                tanggal_selesai
            ]
        );

        // Setelah insert, recalculate dan update bobot semua kegiatan milik penelitian ini
        await recalculateBobot(penelitian_id, pool);

        res.status(201).json({
            success: true,
            message: "Kegiatan berhasil ditambahkan!",
            id: result.insertId
        });
    } catch (err) {
        console.error("Gagal menambah kegiatan:", err.message);
        res.status(500).json({ error: "Gagal menyimpan kegiatan ke database" });
    }
});

// PUT - Update progress kegiatan (dan recalculate progress_rata_rata penelitian)
app.put('/api/kegiatan/:id', async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress === null) {
        return res.status(400).json({ error: "Field 'progress' wajib disertakan!" });
    }
    if (progress < 0 || progress > 100) {
        return res.status(400).json({ error: "Progress harus antara 0 dan 100!" });
    }

    try {
        // Update progress kegiatan
        const [updateResult] = await pool.query(
            "UPDATE kegiatan SET progress = ? WHERE id = ?",
            [progress, id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "Kegiatan tidak ditemukan!" });
        }

        // Ambil penelitian_id dari kegiatan ini untuk recalculate progress_rata_rata
        const [kegiatanRow] = await pool.query(
            "SELECT penelitian_id FROM kegiatan WHERE id = ?",
            [id]
        );

        if (kegiatanRow.length > 0) {
            const penelitian_id = kegiatanRow[0].penelitian_id;
            await recalculateProgressPenelitian(penelitian_id, pool);
        }

        res.json({ success: true, message: "Progress kegiatan berhasil diupdate!" });
    } catch (err) {
        console.error("Gagal update progress kegiatan:", err.message);
        res.status(500).json({ error: "Gagal mengupdate progress ke database" });
    }
});

// DELETE - Hapus kegiatan
app.delete('/api/kegiatan/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Ambil penelitian_id sebelum hapus untuk recalculate setelahnya
        const [kegiatanRow] = await pool.query(
            "SELECT penelitian_id FROM kegiatan WHERE id = ?",
            [id]
        );

        const [result] = await pool.query("DELETE FROM kegiatan WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Kegiatan tidak ditemukan!" });
        }

        // Recalculate bobot dan progress setelah delete
        if (kegiatanRow.length > 0) {
            const penelitian_id = kegiatanRow[0].penelitian_id;
            await recalculateBobot(penelitian_id, pool);
            await recalculateProgressPenelitian(penelitian_id, pool);
        }

        res.json({ success: true, message: "Kegiatan berhasil dihapus!" });
    } catch (err) {
        console.error("Gagal menghapus kegiatan:", err.message);
        res.status(500).json({ error: "Gagal menghapus kegiatan dari database" });
    }
});

// =========================================================================
// ROUTE CASHFLOW
// Tabel: cashflow (id, penelitian_id, tanggal VARCHAR, uraian, jenis_belanja, nominal)
// CATATAN: Kolom 'tanggal' adalah VARCHAR (bukan DATE), sesuai struktur DB asli
// =========================================================================

// GET - Ambil cashflow berdasarkan penelitian_id
app.get('/api/cashflow', async (req, res) => {
    const { penelitian_id } = req.query;
    if (!penelitian_id) {
        return res.status(400).json({ error: "Parameter penelitian_id wajib disertakan!" });
    }
    try {
        const [results] = await pool.query(
            `SELECT id, tanggal, uraian, jenis_belanja, nominal, penelitian_id 
            FROM cashflow 
            WHERE penelitian_id = ? 
            ORDER BY id ASC`,
            [penelitian_id]
        );
        res.json(results);
    } catch (err) {
        console.error("Gagal mengambil list cashflow:", err.message);
        res.status(500).json({ error: "Gagal memuat data cashflow dari database" });
    }
});

// POST - Tambah transaksi cashflow baru
app.post('/api/cashflow', async (req, res) => {
    const { tanggal, uraian, jenis_belanja, nominal, penelitian_id } = req.body;

    if (!tanggal || !uraian) {
        return res.status(400).json({ error: "Tanggal dan uraian wajib diisi!" });
    }
    if (!penelitian_id) {
        return res.status(400).json({ error: "penelitian_id wajib disertakan!" });
    }

    try {
        // Format tanggal dari 'YYYY-MM-DD' (input date HTML) ke 'DD Mon YYYY'
        // agar konsisten dengan data lama di DB (e.g. '15 Jan 2025')
        const tanggalFormatted = formatTanggalToStr(tanggal);

        const [result] = await pool.query(
            `INSERT INTO cashflow (penelitian_id, tanggal, uraian, jenis_belanja, nominal) 
            VALUES (?, ?, ?, ?, ?)`,
            [penelitian_id, tanggalFormatted, uraian.trim(), jenis_belanja || 'Alat', nominal || 0]
        );

        // Update realisasi_anggaran di tabel penelitian
        await recalculateRealisasi(penelitian_id, pool);

        res.status(201).json({
            success: true,
            message: "Transaksi cashflow berhasil dicatat!",
            id: result.insertId
        });
    } catch (err) {
        console.error("Gagal menambah cashflow:", err.message);
        res.status(500).json({ error: "Gagal menyimpan transaksi ke database" });
    }
});

// DELETE - Hapus transaksi cashflow
app.delete('/api/cashflow/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Ambil penelitian_id sebelum hapus
        const [cashflowRow] = await pool.query(
            "SELECT penelitian_id FROM cashflow WHERE id = ?",
            [id]
        );

        const [result] = await pool.query("DELETE FROM cashflow WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Transaksi tidak ditemukan!" });
        }

        // Recalculate realisasi setelah delete
        if (cashflowRow.length > 0) {
            await recalculateRealisasi(cashflowRow[0].penelitian_id, pool);
        }

        res.json({ success: true, message: "Transaksi cashflow berhasil dihapus!" });
    } catch (err) {
        console.error("Gagal menghapus cashflow:", err.message);
        res.status(500).json({ error: "Gagal menghapus riwayat transaksi dari database" });
    }
});

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Recalculate bobot semua kegiatan dalam 1 penelitian berdasarkan durasi hari
 * Bobot = (durasi_kegiatan / total_durasi_semua_kegiatan) * 100
 */
async function recalculateBobot(penelitian_id, pool) {
    try {
        const [kegiatan] = await pool.query(
            "SELECT id, tanggal_mulai, tanggal_selesai FROM kegiatan WHERE penelitian_id = ?",
            [penelitian_id]
        );

        if (kegiatan.length === 0) return;

        // Hitung total hari semua kegiatan
        const totalHari = kegiatan.reduce((total, k) => {
            if (!k.tanggal_mulai || !k.tanggal_selesai) return total;
            const durasi = Math.ceil(
                (new Date(k.tanggal_selesai) - new Date(k.tanggal_mulai)) / 86400000
            ) + 1;
            return total + Math.max(durasi, 0);
        }, 0);

        if (totalHari === 0) return;

        // Update bobot masing-masing kegiatan
        for (const k of kegiatan) {
            if (!k.tanggal_mulai || !k.tanggal_selesai) continue;
            const durasi = Math.ceil(
                (new Date(k.tanggal_selesai) - new Date(k.tanggal_mulai)) / 86400000
            ) + 1;
            const bobot = parseFloat(((Math.max(durasi, 0) / totalHari) * 100).toFixed(2));
            await pool.query("UPDATE kegiatan SET bobot = ? WHERE id = ?", [bobot, k.id]);
        }
    } catch (err) {
        console.error("Gagal recalculate bobot:", err.message);
    }
}

/**
 * Recalculate progress_rata_rata penelitian berdasarkan bobot & progress kegiatan
 * progress_rata_rata = SUM(bobot * progress / 100)
 */
async function recalculateProgressPenelitian(penelitian_id, pool) {
    try {
        const [kegiatan] = await pool.query(
            "SELECT bobot, progress FROM kegiatan WHERE penelitian_id = ?",
            [penelitian_id]
        );

        if (kegiatan.length === 0) return;

        const progressRata = kegiatan.reduce((total, k) => {
            return total + ((k.bobot || 0) * (k.progress || 0) / 100);
        }, 0);

        await pool.query(
            "UPDATE penelitian SET progress_rata_rata = ? WHERE id = ?",
            [Math.round(progressRata), penelitian_id]
        );
    } catch (err) {
        console.error("Gagal recalculate progress penelitian:", err.message);
    }
}

/**
 * Recalculate realisasi_anggaran penelitian dari total cashflow
 */
async function recalculateRealisasi(penelitian_id, pool) {
    try {
        const [result] = await pool.query(
            "SELECT COALESCE(SUM(nominal), 0) AS total FROM cashflow WHERE penelitian_id = ?",
            [penelitian_id]
        );
        const total = result[0].total || 0;
        await pool.query(
            "UPDATE penelitian SET realisasi_anggaran = ? WHERE id = ?",
            [total, penelitian_id]
        );
    } catch (err) {
        console.error("Gagal recalculate realisasi:", err.message);
    }
}

/**
 * Format tanggal dari 'YYYY-MM-DD' (HTML date input) ke 'DD Mon YYYY'
 * Contoh: '2025-01-15' → '15 Jan 2025'
 * Konsisten dengan format VARCHAR di tabel cashflow lama
 */
function formatTanggalToStr(dateStr) {
    if (!dateStr) return dateStr;
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr; // Kalau sudah dalam format string lain, kembalikan apa adanya
    return `${String(d.getDate()).padStart(2,'0')} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

// Jalankan Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 API ready at http://localhost:${PORT}/api`);
});

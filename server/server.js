import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import pool from './db.js';
import penelitianRoutes from './penelitianRoutes.js';
import authRoutes from './authRoutes.js';
import { addSubscription, getVapidPublicKey, sendPushToAll } from './pushSender.js';
import { startReminderScheduler, runReminderCheck } from './reminderScheduler.js';
// import { startReminderScheduler } from './reminderScheduler.js';
// import { initWhatsApp } from './emailSender.js';


dotenv.config();

// __dirname tidak tersedia langsung di ESM ("import"), jadi direkonstruksi manual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================================
// CORS
// Daftar origin yang diizinkan diambil dari .env (ALLOWED_ORIGINS, pisahkan
// dengan koma), supaya bisa akses dari luar RDP tanpa perlu edit & redeploy
// kode setiap kali ada origin baru (IP server, domain production, dst).
//
// Contoh isi .env:
//   ALLOWED_ORIGINS=http://localhost:5173,http://10.12.200.79:5173,https://app-kamu.com
// =========================================================================
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // origin undefined -> request dari Postman/curl/server-to-server, izinkan
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked origin: ${origin}`);
            callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRoutes);

// =========================================================================
// SETUP GOOGLE SHEETS (fitur "Monitoring Jadwal" — tambahan dari project
// terpisah, digabung ke sini supaya cukup 1 server yang jalan)
// Autentikasi pakai Service Account (bukan API key), karena API key murni
// tidak bisa dipakai untuk MENULIS ke Google Sheets.
// =========================================================================
const SHEET_SPREADSHEET_ID = process.env.SHEET_SPREADSHEET_ID;
const SHEET_KEY_FILE = path.join(__dirname, 'service-account.json');

const SHEET_BULAN_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const SHEET_KEGIATAN_START_ROW = 3; // data mulai baris ke-3
const SHEET_KEGIATAN_LAST_COL = 'M'; // A..M

let sheetsClient = null;
if (SHEET_SPREADSHEET_ID) {
    const sheetAuth = new google.auth.GoogleAuth({
        keyFile: SHEET_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    sheetsClient = google.sheets({ version: 'v4', auth: sheetAuth });
} else {
    console.warn('⚠️  SHEET_SPREADSHEET_ID belum diisi di .env — fitur Monitoring Jadwal (Sheets) nonaktif.');
}

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
                total_anggaran,
                realisasi_anggaran,
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
    const { nama_kegiatan, bobot, progress, tanggal_mulai, tanggal_selesai, total_anggaran, realisasi_anggaran, penelitian_id } = req.body;

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
                (penelitian_id, nama_kegiatan, bobot, progress, tanggal_mulai, tanggal_selesai, total_anggaran, realisasi_anggaran) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                penelitian_id,
                nama_kegiatan.trim(),
                // Bobot diinput MANUAL oleh user (bukan lagi dihitung otomatis dari durasi hari).
                // Math.round karena kolom `bobot` bertipe INT di database.
                Math.round(Number(bobot) || 0),
                progress || 0,
                tanggal_mulai,
                tanggal_selesai,
                total_anggaran || 0,
                realisasi_anggaran || 0
            ]
        );

        // CATATAN: recalculateBobot() SENGAJA TIDAK dipanggil lagi di sini.
        // Fungsi itu dulu menimpa bobot semua kegiatan dengan hitungan rasio durasi hari,
        // padahal sekarang bobot harus murni hasil input manual user (divalidasi total=100%
        // dari sisi frontend). Recalculate progress penelitian tetap perlu dijalankan.
        await recalculateProgressPenelitian(penelitian_id, pool);
        await recalculateRealisasi(penelitian_id, pool);   // realisasi_anggaran ikut kegiatan

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
// PUT - Update kegiatan (mendukung update parsial: hanya progress saja, hanya bobot saja,
// atau update penuh nama/tanggal/bobot/progress/total_anggaran sekaligus dari fitur "Simpan" massal)
app.put('/api/kegiatan/:id', async (req, res) => {
    const { id } = req.params;
    const { nama_kegiatan, tanggal_mulai, tanggal_selesai, bobot, progress, total_anggaran, realisasi_anggaran } = req.body;

    // Kolom yang boleh diupdate, whitelist supaya tidak ada field asing yang bisa disuntikkan ke query
    const fieldMap = { nama_kegiatan, tanggal_mulai, tanggal_selesai, bobot, progress, total_anggaran, realisasi_anggaran };
    const keys = Object.keys(fieldMap).filter(k => fieldMap[k] !== undefined);

    if (keys.length === 0) {
        return res.status(400).json({ error: "Tidak ada field yang dikirim untuk diupdate!" });
    }
    if (progress !== undefined && (progress < 0 || progress > 100)) {
        return res.status(400).json({ error: "Progress harus antara 0 dan 100!" });
    }

    try {
        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => (k === 'bobot' ? Math.round(Number(fieldMap[k]) || 0) : fieldMap[k]));

        const [updateResult] = await pool.query(
            `UPDATE kegiatan SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: "Kegiatan tidak ditemukan!" });
        }

        // progress/bobot ikut berubah -> progress_rata_rata penelitian perlu dihitung ulang
        const [kegiatanRow] = await pool.query(
            "SELECT penelitian_id FROM kegiatan WHERE id = ?",
            [id]
        );
        if (kegiatanRow.length > 0) {
            const penelitianIdForRecalc = kegiatanRow[0].penelitian_id;
            await recalculateProgressPenelitian(penelitianIdForRecalc, pool);
            await recalculateRealisasi(penelitianIdForRecalc, pool);   // realisasi_anggaran ikut kegiatan
        }
        res.json({ success: true, message: "Kegiatan berhasil diupdate!" });
    } catch (err) {
        console.error("Gagal update kegiatan:", err.message);
        res.status(500).json({ error: "Gagal mengupdate kegiatan ke database" });
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
            const penelitianIdForRecalc = kegiatanRow[0].penelitian_id;
            await recalculateProgressPenelitian(penelitianIdForRecalc, pool);
            await recalculateRealisasi(penelitianIdForRecalc, pool);   // realisasi_anggaran ikut kegiatan
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
            `SELECT id, tanggal, uraian, jenis_belanja, jumlah, harga_satuan, nominal, penelitian_id 
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
    const { tanggal, uraian, jenis_belanja, jumlah, harga_satuan, nominal, penelitian_id } = req.body;

    if (!tanggal || !uraian) {
        return res.status(400).json({ error: "Tanggal dan uraian wajib diisi!" });
    }
    if (!penelitian_id) {
        return res.status(400).json({ error: "penelitian_id wajib disertakan!" });
    }

    try {
        const tanggalFormatted = formatTanggalToStr(tanggal);
        const jumlahVal = Number(jumlah) || 1;
        const hargaSatuanVal = Number(harga_satuan) || 0;
        // Hitung ulang nominal di backend (jumlah × harga_satuan) sebagai sumber kebenaran,
        // fallback ke `nominal` yang dikirim frontend kalau jumlah/harga_satuan tidak ada.
        const nominalVal = (jumlahVal && hargaSatuanVal) ? jumlahVal * hargaSatuanVal : (Number(nominal) || 0);

        const [result] = await pool.query(
            `INSERT INTO cashflow (penelitian_id, tanggal, uraian, jenis_belanja, jumlah, harga_satuan, nominal) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [penelitian_id, tanggalFormatted, uraian.trim(), jenis_belanja || 'Alat', jumlahVal, hargaSatuanVal, nominalVal]
        );

        await recalculateTotalAnggaran(penelitian_id, pool); // cashflow = RAB, bukan realisasi

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
            await recalculateTotalAnggaran(cashflowRow[0].penelitian_id, pool);
        }

        res.json({ success: true, message: "Transaksi cashflow berhasil dihapus!" });
    } catch (err) {
        console.error("Gagal menghapus cashflow:", err.message);
        res.status(500).json({ error: "Gagal menghapus riwayat transaksi dari database" });
    }
});

// =========================================================================
// ROUTE MONITORING JADWAL (Google Sheets — fitur tambahan, terpisah dari MySQL)
// Struktur sheet: 1 tab per bulan, data mulai baris 3, kolom A..M:
//   A:No B:Kegiatan C:Minggu ke D:Tgl Mulai E:Tgl Selesai F:Jam Mulai
//   G:Jam Selesai H:PIC I:Tempat J:Keterangan K:Hasil L:Tanggapan1 M:Tanggapan2
// =========================================================================

// GET - ambil data 1 bulan sekaligus (team, kegiatan, availableBulan, bulanAktif)
app.get('/api/monitoring-jadwal', async (req, res) => {
    if (!sheetsClient) {
        return res.status(503).json({ error: 'Fitur Monitoring Jadwal belum dikonfigurasi (SHEET_SPREADSHEET_ID kosong).' });
    }
    try {
        const availableBulan = await sheetGetMonthNames();
        let bulan = req.query.bulan || '';
        if (!bulan || availableBulan.indexOf(bulan) === -1) {
            bulan = sheetDefaultBulan(availableBulan);
        }
        const kegiatan = await sheetReadKegiatan(bulan);
        const team = sheetBuildTeam(kegiatan);
        res.json({ team, kegiatan, availableBulan, bulanAktif: bulan });
    } catch (err) {
        console.error('Gagal mengambil data Monitoring Jadwal:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST - aksi tulis: addTask, saveHasil, addTanggapan
app.post('/api/monitoring-jadwal', async (req, res) => {
    if (!sheetsClient) {
        return res.status(503).json({ error: 'Fitur Monitoring Jadwal belum dikonfigurasi (SHEET_SPREADSHEET_ID kosong).' });
    }
    try {
        const body = req.body;
        const action = body.action;
        const bulan = body.bulan;
        if (!bulan) throw new Error('Parameter "bulan" wajib diisi.');

        const availableBulan = await sheetGetMonthNames();
        if (availableBulan.indexOf(bulan) === -1) {
            throw new Error('Sheet bulan "' + bulan + '" tidak ditemukan.');
        }

        let result = {};

        switch (action) {
            case 'addTask': {
                const nextNo = await sheetGetNextNo(bulan);
                const row = [
                    nextNo,
                    body.nama || '',
                    body.minggu || '',
                    sheetNormalizeDateInput(body.tanggal_mulai),
                    sheetNormalizeDateInput(body.tanggal_selesai),
                    body.jam_mulai || '',
                    body.jam_selesai || '',
                    body.pic || '',
                    body.tempat || '',
                    body.keterangan || '',
                ];
                const appendRes = await sheetsClient.spreadsheets.values.append({
                    spreadsheetId: SHEET_SPREADSHEET_ID,
                    range: `${bulan}!A${SHEET_KEGIATAN_START_ROW}:J`,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values: [row] },
                });
                // updatedRange contoh: "Januari!A15:J15" → ambil nomor barisnya
                const updatedRange = appendRes.data.updates.updatedRange;
                const match = updatedRange.match(/![A-Z]+(\d+):/);
                result = { id: match ? Number(match[1]) : null };
                break;
            }
            case 'saveHasil': {
                const row = Number(body.id);
                if (!row) throw new Error('id tidak valid.');
                await sheetsClient.spreadsheets.values.update({
                    spreadsheetId: SHEET_SPREADSHEET_ID,
                    range: `${bulan}!K${row}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [[body.hasil_laporan || '']] },
                });
                break;
            }
            case 'addTanggapan': {
                const row = Number(body.kegiatan_id);
                if (!row) throw new Error('kegiatan_id tidak valid.');
                const col = Number(body.slot) === 2 ? 'M' : 'L'; // L=Tanggapan1, M=Tanggapan2
                await sheetsClient.spreadsheets.values.update({
                    spreadsheetId: SHEET_SPREADSHEET_ID,
                    range: `${bulan}!${col}${row}`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [[body.text || '']] },
                });
                break;
            }
            default:
                return res.json({ error: 'Unknown action: ' + action });
        }

        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Gagal memproses aksi Monitoring Jadwal:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// TAMBAHKAN BLOK INI KE server.js (taruh dekat route /api/monitoring-jadwal
// yang sudah ada — memakai `sheetsClient` yang sama, jadi TIDAK perlu bikin
// service account/koneksi baru. Cukup tambahkan env var di bawah, lalu
// share spreadsheet "Monitoring Simlitbang" ke email service account yang
// SAMA dengan yang sudah dipakai untuk Monitoring Jadwal.)
// =========================================================================

// =========================================================================
// TAMBAHKAN BLOK INI KE server.js (taruh dekat route /api/monitoring-jadwal
// yang sudah ada — memakai `sheetsClient` yang sama, jadi TIDAK perlu bikin
// service account/koneksi baru. Cukup tambahkan env var di bawah, lalu
// share spreadsheet "Monitoring Simlitbang" ke email service account yang
// SAMA dengan yang sudah dipakai untuk Monitoring Jadwal.)
// =========================================================================

// .env — tambahkan baris ini:
//   SIMLITBANG_SHEET_ID=104rdX5ajcdhYNOEnlcnUooy0_0sXttjp-6EwGyDEgbI
//   SIMLITBANG_SHEET_GID=0
const SIMLITBANG_SHEET_ID = process.env.SIMLITBANG_SHEET_ID;
const SIMLITBANG_SHEET_GID = process.env.SIMLITBANG_SHEET_GID || '0'; // gid tab utama (daftar penelitian)

if (!SIMLITBANG_SHEET_ID) {
    console.warn('⚠️  SIMLITBANG_SHEET_ID belum diisi di .env — fitur Tambah Data Penelitian (Simlitbang) nonaktif.');
}

// Resolve nama tab dari gid — Sheets API append butuh NAMA tab di dalam
// string range, bukan gid.
async function simlitbangResolveSheetName(gid) {
    const meta = await sheetsClient.spreadsheets.get({ spreadsheetId: SIMLITBANG_SHEET_ID });
    const sheet = meta.data.sheets.find(s => String(s.properties.sheetId) === String(gid));
    if (!sheet) throw new Error(`Sheet dengan gid ${gid} tidak ditemukan di spreadsheet Simlitbang`);
    return sheet.properties.title;
}

// Hitung "No" berikutnya dari kolom A tab tertentu, mulai dari startRow
// (dipakai untuk auto-nomor baris baru, sama seperti sheetGetNextNo yang
// sudah ada di Monitoring Jadwal).
async function simlitbangGetNextNo(sheetName, startRow) {
    try {
        const res = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SIMLITBANG_SHEET_ID,
            range: `${sheetName}!A${startRow}:A`,
            valueRenderOption: 'UNFORMATTED_VALUE',
        });
        const values = (res.data.values || []).flat()
            .filter(v => v !== '' && v !== null && v !== undefined)
            .map(Number)
            .filter(v => !isNaN(v));
        return values.length ? Math.max(...values) + 1 : 1;
    } catch (err) {
        return 1;
    }
}

// POST - aksi tulis ke Sheets Simlitbang:
//   action="addPenelitian" → tambah baris baru di tab utama (daftar penelitian)
//   action="addProgres"    → tambah baris isu/progres baru di tab "PP 2026-N"
app.post('/api/monitoring-penelitian', async (req, res) => {
    if (!sheetsClient || !SIMLITBANG_SHEET_ID) {
        return res.status(503).json({ error: 'Fitur ini belum dikonfigurasi (SIMLITBANG_SHEET_ID kosong).' });
    }
    try {
        const body = req.body;
        const action = body.action;

        switch (action) {
            // ── Tambah baris penelitian baru di tab utama ──────────────────
            case 'addPenelitian': {
                const sheetName = await simlitbangResolveSheetName(SIMLITBANG_SHEET_GID);
                const nextNo = await simlitbangGetNextNo(sheetName, 4); // data mulai baris ke-4

                // Urutan HARUS sama persis dengan kolom A→P di tab utama
                const row = [
                    nextNo,
                    body.judul_penelitian || '',
                    body.judul_sub_penelitian || '',
                    body.cluster || '',
                    body.mitra || '',
                    body.pic || '',
                    body.status || '',
                    body.lingkup || '',
                    body.luaran || '',
                    Number(body.rab) || 0,
                    body.core_hub ? 'v' : '',
                    body.ptb ? 'v' : '',
                    body.catatan_implementasi_2026 ? 'v' : '',
                    body.wbs_2026 || '',
                    body.kategori || '',
                    body.link_pp || '',
                ];

                await sheetsClient.spreadsheets.values.append({
                    spreadsheetId: SIMLITBANG_SHEET_ID,
                    range: `${sheetName}!A:A`,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values: [row] },
                });

                return res.json({ success: true, no: nextNo });
            }

            // ── Tambah baris isu/progres baru di tab "PP 2026-N" ───────────
            case 'addProgres': {
                if (!body.gid) throw new Error('gid tab PP 2026-N wajib disertakan.');
                const sheetName = await simlitbangResolveSheetName(body.gid);
                const nextNo = await simlitbangGetNextNo(sheetName, 6); // data isu mulai baris ke-6

                // Urutan sesuai struktur tab PP 2026-N:
                // A:No C:Tanggal D:Isu E:WBS F:Progres G:Risiko H:Mitigasi I:Target J:PIC
                const row = [
                    nextNo,
                    '', // kolom B memang kosong di struktur tab ini
                    body.tanggal || '',
                    body.isu || '',
                    body.wbs || '',
                    Number(body.progres) || 0,
                    body.risiko || '',
                    body.mitigasi || '',
                    body.target || '',
                    body.pic || '',
                ];

                await sheetsClient.spreadsheets.values.append({
                    spreadsheetId: SIMLITBANG_SHEET_ID,
                    range: `${sheetName}!A:A`,
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                    requestBody: { values: [row] },
                });

                return res.json({ success: true, no: nextNo });
            }

            default:
                return res.status(400).json({ error: 'Unknown action: ' + action });
        }
    } catch (err) {
        console.error('Gagal memproses aksi Monitoring Penelitian Sheet:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── TAMBAHKAN ROUTE INI KE server.js ─────────────────────────────────────
// (taruh dekat route /api/monitoring-jadwal yang sudah ada)

// GET - frontend perlu VAPID public key buat subscribe
app.get('/api/push/vapid-public-key', (req, res) => {
    const key = getVapidPublicKey();
    if (!key) return res.status(503).json({ error: 'Web Push belum dikonfigurasi di server.' });
    res.json({ publicKey: key });
});

// POST - simpan subscription baru dari browser
app.post('/api/push/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Data subscription tidak valid.' });
    }
    addSubscription(subscription);
    res.json({ success: true });
});

// POST - kirim push tes manual (buat verifikasi cepat dari browser/Postman)
app.post('/api/push/test', async (req, res) => {
    await sendPushToAll('🔔 Tes Notifikasi', 'Kalau kamu lihat ini, Web Push sudah berfungsi!', '/');
    res.json({ success: true });
});

// ── Helpers khusus Monitoring Jadwal (Google Sheets) ────────────────────

// input dari <input type="date"> "yyyy-mm-dd" → "dd/mm/yyyy" (konsisten dengan sheet)
function sheetNormalizeDateInput(str) {
    if (!str) return '';
    const parts = String(str).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
}

function sheetDefaultBulan(list) {
    if (!list.length) return '';
    const now = new Date();
    const currentName = `${SHEET_BULAN_ID[now.getMonth()]} ${now.getFullYear()}`;
    return list.indexOf(currentName) !== -1 ? currentName : list[0];
}

// Nama-nama sheet bulan yang benar-benar ada, urut sesuai kalender.
// Format tab sheet sekarang: "<NamaBulan> <Tahun>", contoh "Juni 2026".
// Dicocokkan lintas beberapa tahun (tahun sekarang -1 s/d +1) supaya
// otomatis kebaca saat pergantian tahun tanpa perlu ubah kode tiap tahun.
async function sheetGetMonthNames() {
    const meta = await sheetsClient.spreadsheets.get({ spreadsheetId: SHEET_SPREADSHEET_ID });
    const existing = meta.data.sheets.map(s => s.properties.title);

    const nowYear = new Date().getFullYear();
    const candidates = [];
    for (const year of [nowYear - 1, nowYear, nowYear + 1]) {
        for (const bulan of SHEET_BULAN_ID) {
            candidates.push(`${bulan} ${year}`);
        }
    }
    return candidates.filter(name => existing.indexOf(name) !== -1);
}

// Baca semua baris kegiatan dari 1 sheet bulan
async function sheetReadKegiatan(sheetName) {
    const range = `${sheetName}!A${SHEET_KEGIATAN_START_ROW}:${SHEET_KEGIATAN_LAST_COL}`;
    let values = [];
    try {
        const res = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SHEET_SPREADSHEET_ID,
            range,
            valueRenderOption: 'FORMATTED_VALUE',
        });
        values = res.data.values || [];
    } catch (err) {
        return []; // sheet tidak ditemukan / kosong
    }

    const result = [];
    values.forEach((row, i) => {
        const nama = row[1];
        if (nama === '' || nama === undefined || nama === null) return; // skip baris kosong
        result.push({
            id: SHEET_KEGIATAN_START_ROW + i,
            no: row[0] ?? '',
            nama: nama,
            minggu: row[2] ?? '',
            tanggal_mulai: row[3] ?? '',
            tanggal_selesai: row[4] ?? '',
            jam_mulai: row[5] ?? '',
            jam_selesai: row[6] ?? '',
            pic: row[7] ?? '',
            tempat: row[8] ?? '',
            keterangan: row[9] ?? '',
            hasil_laporan: row[10] ?? '',
            tanggapan1: row[11] ?? '',
            tanggapan2: row[12] ?? '',
        });
    });
    return result;
}

// Hitung beban kerja per PIC dari data kegiatan yang sudah dibaca
function sheetBuildTeam(kegiatan) {
    const map = {};
    kegiatan.forEach(k => {
        const names = String(k.pic || '')
            .split(/\n|,/)
            .map(s => s.trim())
            .filter(Boolean);
        names.forEach(n => { map[n] = (map[n] || 0) + 1; });
    });
    return Object.keys(map).map(nama => ({ nama, jumlah_kegiatan: map[nama] }));
}

// Hitung "No" berikutnya dari kolom A yang sudah terisi
async function sheetGetNextNo(sheetName) {
    try {
        const res = await sheetsClient.spreadsheets.values.get({
            spreadsheetId: SHEET_SPREADSHEET_ID,
            range: `${sheetName}!A${SHEET_KEGIATAN_START_ROW}:A`,
            valueRenderOption: 'UNFORMATTED_VALUE',
        });
        const values = (res.data.values || []).flat()
            .filter(v => v !== '' && v !== null && v !== undefined)
            .map(Number)
            .filter(v => !isNaN(v));
        return values.length ? Math.max(...values) + 1 : 1;
    } catch (err) {
        return 1;
    }
}

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
 * Recalculate realisasi_anggaran penelitian dari total realisasi_anggaran
 * SEMUA kegiatan (field yang diisi manual per kegiatan di kartu Progress
 * Kegiatan) — konsisten dengan sumber AC di Earned Value Analysis frontend.
 */
async function recalculateRealisasi(penelitian_id, pool) {
    try {
        const [result] = await pool.query(
            "SELECT COALESCE(SUM(realisasi_anggaran), 0) AS total FROM kegiatan WHERE penelitian_id = ?",
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
 * Recalculate total_anggaran penelitian dari total anggaran semua kegiatan
 * (bukan nilai statis dari form awal — selalu ikut berubah saat kegiatan berubah)
 */
/**
 * Recalculate total_anggaran penelitian dari total transaksi RAB (cashflow).
 * Tabel `cashflow` merepresentasikan RENCANA anggaran (RAB), bukan realisasi
 * — jadi ini yang jadi sumber "Total RAB"/"Total Anggaran" di Dashboard.
 */
async function recalculateTotalAnggaran(penelitian_id, pool) {
    try {
        const [result] = await pool.query(
            "SELECT COALESCE(SUM(nominal), 0) AS total FROM cashflow WHERE penelitian_id = ?",
            [penelitian_id]
        );
        const total = result[0].total || 0;
        await pool.query(
            "UPDATE penelitian SET total_anggaran = ? WHERE id = ?",
            [total, penelitian_id]
        );
    } catch (err) {
        console.error("Gagal recalculate total anggaran:", err.message);
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

// if (sheetsClient && process.env.FONNTE_TOKEN && process.env.FONNTE_TARGET) {
//     startReminderScheduler({
//         getKegiatanUntukTanggal: async (dateObj) => {
//             const bulanNama = `${SHEET_BULAN_ID[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
//             const availableBulan = await sheetGetMonthNames();
//             if (availableBulan.indexOf(bulanNama) === -1) return []; // sheet bulan itu belum dibuat
//             return sheetReadKegiatan(bulanNama);
//         },
//         cronTime: '0 7 * * *',
//     });
// } else {
//     console.warn('⚠️  Reminder WA nonaktif — cek SHEET_SPREADSHEET_ID / FONNTE_TOKEN / FONNTE_TARGET di .env.');
// }

const getKegiatanUntukTanggalForReminder = async (dateObj) => {
    const bulanNama = `${SHEET_BULAN_ID[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    const availableBulan = await sheetGetMonthNames();
    if (availableBulan.indexOf(bulanNama) === -1) return []; // sheet bulan itu belum dibuat
    return sheetReadKegiatan(bulanNama);
};

if (sheetsClient && process.env.FONNTE_TOKEN && process.env.FONNTE_TARGET) {
    startReminderScheduler({
        getKegiatanUntukTanggal: getKegiatanUntukTanggalForReminder,
        cronTime: '0 7 * * *',
    });

    // Endpoint test manual — panggil ini kapan saja untuk verifikasi tanpa
    // perlu menunggu jam 7 pagi ATAU menunggu ada kegiatan yang jatuh hari ini.
    //
    // Contoh test pakai tanggal SEKARANG (default):
    //   curl -X POST http://localhost:5000/api/reminder/test
    //
    // Contoh test pakai tanggal TERTENTU (misal tanggal yang kamu tahu ada
    // kegiatannya di sheet, format YYYY-MM-DD):
    //   curl -X POST "http://localhost:5000/api/reminder/test?tanggal=2026-07-09"
    app.post('/api/reminder/test', async (req, res) => {
        let baseDate = new Date();
        if (req.query.tanggal) {
            const parsed = new Date(req.query.tanggal);
            if (isNaN(parsed)) {
                return res.status(400).json({ error: 'Format tanggal tidak valid, pakai YYYY-MM-DD.' });
            }
            baseDate = parsed;
        }
        const result = await runReminderCheck(getKegiatanUntukTanggalForReminder, baseDate);
        res.json(result);
    });
} else {
    console.warn('⚠️  Reminder WA nonaktif — cek SHEET_SPREADSHEET_ID / FONNTE_TOKEN / FONNTE_TARGET di .env.');
}

// =========================================================================
// ROUTE REALISASI RAB
// Tabel: realisasi_rab (id, penelitian_id, kegiatan_id, rab_id, nominal, tanggal, keterangan)
// Mencatat pengeluaran NYATA per item RAB untuk tiap kegiatan (dipakai di
// tab "Input Realisasi RAB" pada Analisis Kurva S / Earned Value).
// =========================================================================

// GET - Ambil semua realisasi RAB berdasarkan penelitian_id
app.get('/api/realisasi-rab', async (req, res) => {
    const { penelitian_id } = req.query;
    if (!penelitian_id) {
        return res.status(400).json({ error: "Parameter penelitian_id wajib disertakan!" });
    }
    try {
        const [results] = await pool.query(
            `SELECT
                id,
                penelitian_id,
                kegiatan_id,
                rab_id,
                nominal,
                DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal,
                keterangan
            FROM realisasi_rab
            WHERE penelitian_id = ?
            ORDER BY tanggal DESC, id DESC`,
            [penelitian_id]
        );
        res.json(results);
    } catch (err) {
        console.error("Gagal mengambil list realisasi RAB:", err.message);
        res.status(500).json({ error: "Gagal memuat data realisasi RAB dari database" });
    }
});

// POST - Tambah entri realisasi RAB baru
app.post('/api/realisasi-rab', async (req, res) => {
    const { penelitian_id, kegiatan_id, rab_id, nominal, tanggal, keterangan } = req.body;

    if (!penelitian_id) return res.status(400).json({ error: "penelitian_id wajib disertakan!" });
    if (!kegiatan_id) return res.status(400).json({ error: "Kegiatan wajib dipilih!" });
    if (!rab_id) return res.status(400).json({ error: "Item RAB wajib dipilih!" });
    if (!nominal || Number(nominal) <= 0) return res.status(400).json({ error: "Nominal realisasi harus lebih dari 0!" });
    if (!tanggal) return res.status(400).json({ error: "Tanggal realisasi wajib diisi!" });

    try {
        const [result] = await pool.query(
            `INSERT INTO realisasi_rab (penelitian_id, kegiatan_id, rab_id, nominal, tanggal, keterangan)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [penelitian_id, kegiatan_id, rab_id, Number(nominal), tanggal, (keterangan || '').trim()]
        );

        res.status(201).json({
            success: true,
            message: "Realisasi RAB berhasil dicatat!",
            id: result.insertId
        });
    } catch (err) {
        console.error("Gagal menambah realisasi RAB:", err.message);
        res.status(500).json({ error: "Gagal menyimpan realisasi RAB ke database" });
    }
});

// DELETE - Hapus entri realisasi RAB
app.delete('/api/realisasi-rab/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM realisasi_rab WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Data realisasi RAB tidak ditemukan!" });
        }
        res.json({ success: true, message: "Realisasi RAB berhasil dihapus!" });
    } catch (err) {
        console.error("Gagal menghapus realisasi RAB:", err.message);
        res.status(500).json({ error: "Gagal menghapus realisasi RAB dari database" });
    }
});

// // ── ENDPOINT SEKALI PAKAI: backfill total_anggaran & realisasi_anggaran
// // untuk semua penelitian yang sudah ada di database (data lama yang belum
// // sempat ter-recalculate karena dibuat sebelum fix diterapkan).
// // Panggil sekali lewat browser/Postman: GET http://localhost:5000/api/admin/recalculate-all
// // Setelah selesai dipakai, boleh dihapus lagi dari kode.
// app.get('/api/admin/recalculate-all', async (req, res) => {
//     try {
//         const [penelitianList] = await pool.query("SELECT id FROM penelitian");
//         for (const p of penelitianList) {
//             await recalculateTotalAnggaran(p.id, pool);
//             await recalculateRealisasi(p.id, pool);
//             await recalculateProgressPenelitian(p.id, pool);
//         }
//         res.json({ success: true, message: `Berhasil recalculate ${penelitianList.length} penelitian.` });
//     } catch (err) {
//         console.error("Gagal recalculate semua penelitian:", err.message);
//         res.status(500).json({ error: err.message });
//     }
// });

// =========================================================================
// Jalankan Server
// Bind ke 0.0.0.0 (bukan 127.0.0.1) supaya bisa diakses dari luar RDP,
// misalnya lewat IP server (contoh: http://10.12.200.79:5000/api).
// Pastikan juga:
//   1) Windows Firewall / security group sudah buka inbound port ini (PORT).
//   2) ALLOWED_ORIGINS di .env sudah memuat origin frontend yang mengakses.
// =========================================================================
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 API ready at http://localhost:${PORT}/api`);
    console.log(`📡 API juga bisa diakses dari luar lewat http://<IP-SERVER>:${PORT}/api`);
    console.log(`🌐 Allowed CORS origins: ${ALLOWED_ORIGINS.join(', ')}`);
    console.log(sheetsClient
        ? `📄 Monitoring Jadwal (Sheets) aktif di http://localhost:${PORT}/api/monitoring-jadwal`
        : `⚠️  Monitoring Jadwal (Sheets) nonaktif — isi SHEET_SPREADSHEET_ID di .env untuk mengaktifkan`);
});
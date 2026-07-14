import express from 'express';
import bcrypt from 'bcryptjs';
import pool from './db.js';
import { kirimPesanKeNomor } from './fonnteSender.js';


const router = express.Router();

// ================= LOGIN ================= (tidak berubah)
router.post('/login', async (req, res) => {
    try {
        const { nip, password } = req.body;

        if (!nip || !password) {
            return res.status(400).json({ success: false, message: 'NIP dan password wajib diisi' });
        }

        const nipTrimmed = String(nip).trim();
        const passwordTrimmed = String(password).trim();

        if (nipTrimmed === '' || passwordTrimmed === '') {
            return res.status(400).json({ success: false, message: 'NIP dan password wajib diisi' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE nip = ?', [nipTrimmed]);

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(401).json({ success: false, message: 'NIP tidak ditemukan' });
        }

        const user = users[0];

        if (!user.password) {
            return res.status(401).json({ success: false, message: 'Akun tidak valid' });
        }

        const isPasswordValid = await bcrypt.compare(passwordTrimmed, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Password salah' });
        }

        res.json({
            success: true,
            user: { id: user.id, nip: user.nip, nama: user.nama, role: user.role }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ================= REGISTER ================= (tidak berubah, tetap ada untuk 1 user manual)
router.post('/register', async (req, res) => {
    try {
        const { nip, nama, password, role, no_hp } = req.body;

        if (!nip || !nama || !password) {
            return res.status(400).json({ success: false, message: 'NIP, nama, dan password wajib diisi' });
        }

        const nipTrimmed = String(nip).trim();
        const namaTrimmed = String(nama).trim();
        const passwordTrimmed = String(password).trim();

        if (nipTrimmed === '' || namaTrimmed === '' || passwordTrimmed === '') {
            return res.status(400).json({ success: false, message: 'NIP, nama, dan password wajib diisi' });
        }

        const validRoles = ['admin', 'user'];
        const roleFinal = validRoles.includes(role) ? role : 'user';

        const [existing] = await pool.query('SELECT id FROM users WHERE nip = ?', [nipTrimmed]);

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'NIP sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(passwordTrimmed, 10);

        const [result] = await pool.query(
            'INSERT INTO users (nip, nama, password, role, no_hp) VALUES (?, ?, ?, ?, ?)',
            [nipTrimmed, namaTrimmed, hashedPassword, roleFinal, no_hp || null]
        );

        res.status(201).json({
            success: true,
            message: 'User berhasil didaftarkan',
            user: { id: result.insertId, nip: nipTrimmed, nama: namaTrimmed, role: roleFinal }
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ================= BULK IMPORT NIP =================
// Input: array of { nip, nama, no_hp, role? }
// Password awal = NIP itu sendiri (di-hash). Kalau NIP sudah ada, dilewati (tidak menimpa).
router.post('/bulk-register', async (req, res) => {
    try {
        const { users } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ success: false, message: 'Kirim array "users" berisi minimal 1 data.' });
        }

        const hasil = { berhasil: [], dilewati: [], gagal: [] };

        for (const u of users) {
            const nip = String(u.nip || '').trim();
            const nama = String(u.nama || '').trim();
            const no_hp = u.no_hp ? String(u.no_hp).trim() : null;
            const role = ['admin', 'user'].includes(u.role) ? u.role : 'user';

            if (!nip || !nama) {
                hasil.gagal.push({ nip: nip || '(kosong)', alasan: 'NIP/nama kosong' });
                continue;
            }

            try {
                const [existing] = await pool.query('SELECT id FROM users WHERE nip = ?', [nip]);
                if (existing.length > 0) {
                    hasil.dilewati.push(nip);
                    continue;
                }

                // Password awal = NIP itu sendiri
                const hashedPassword = await bcrypt.hash(nip, 10);

                await pool.query(
                    'INSERT INTO users (nip, nama, password, role, no_hp) VALUES (?, ?, ?, ?, ?)',
                    [nip, nama, hashedPassword, role, no_hp]
                );
                hasil.berhasil.push(nip);
            } catch (err) {
                hasil.gagal.push({ nip, alasan: err.message });
            }
        }

        res.status(201).json({
            success: true,
            message: `${hasil.berhasil.length} user berhasil dibuat, ${hasil.dilewati.length} dilewati (sudah ada), ${hasil.gagal.length} gagal.`,
            detail: hasil
        });

    } catch (err) {
        console.error('Bulk register error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ================= LUPA PASSWORD — STEP 1: minta OTP =================
// Simpan OTP sementara di memori (cukup untuk skala kecil; kalau server sering
// restart / multi-instance, pindahkan ke tabel DB atau Redis).
const otpStore = new Map(); // nip -> { otp, expiresAt, attempts, requestedAt }
const OTP_TTL_MS = 5 * 60 * 1000;      // OTP berlaku 5 menit
const OTP_COOLDOWN_MS = 60 * 1000;     // jeda antar-request OTP 60 detik
const OTP_MAX_ATTEMPTS = 5;            // maksimal 5x salah input OTP

function maskNomor(nomor) {
    if (!nomor || nomor.length < 4) return '****';
    return `${'*'.repeat(nomor.length - 4)}${nomor.slice(-4)}`;
}

router.post('/forgot-password/request', async (req, res) => {
    try {
        const { nip } = req.body;
        if (!nip) {
            return res.status(400).json({ success: false, message: 'NIP wajib diisi' });
        }
        const nipTrimmed = String(nip).trim();

        const [users] = await pool.query('SELECT id, nip, no_hp FROM users WHERE nip = ?', [nipTrimmed]);
        if (users.length === 0) {
            // Jangan bocorkan apakah NIP terdaftar atau tidak — respons generik
            return res.status(200).json({ success: true, message: 'Jika NIP terdaftar, OTP akan dikirim ke WhatsApp terkait.' });
        }
        const user = users[0];

        if (!user.no_hp) {
            return res.status(400).json({ success: false, message: 'Nomor WhatsApp untuk NIP ini belum terdaftar. Hubungi admin.' });
        }

        const existing = otpStore.get(nipTrimmed);
        if (existing && (Date.now() - existing.requestedAt) < OTP_COOLDOWN_MS) {
            const sisaDetik = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - existing.requestedAt)) / 1000);
            return res.status(429).json({ success: false, message: `Tunggu ${sisaDetik} detik sebelum minta OTP lagi.` });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digit
        otpStore.set(nipTrimmed, {
            otp,
            expiresAt: Date.now() + OTP_TTL_MS,
            attempts: 0,
            requestedAt: Date.now(),
        });

        await kirimPesanKeNomor(
            user.no_hp,
            `🔐 *Kode OTP Reset Password*\n\nKode kamu: *${otp}*\nBerlaku 5 menit. Jangan bagikan kode ini ke siapapun.`
        );

        res.json({
            success: true,
            message: `OTP telah dikirim ke WhatsApp ${maskNomor(user.no_hp)}.`
        });

    } catch (err) {
        console.error('Forgot password request error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ================= LUPA PASSWORD — STEP 2: verifikasi OTP + set password baru =================
router.post('/forgot-password/verify', async (req, res) => {
    try {
        const { nip, otp, password_baru } = req.body;
        if (!nip || !otp || !password_baru) {
            return res.status(400).json({ success: false, message: 'NIP, OTP, dan password baru wajib diisi' });
        }
        const nipTrimmed = String(nip).trim();
        const otpTrimmed = String(otp).trim();
        const passwordBaruTrimmed = String(password_baru).trim();

        if (passwordBaruTrimmed.length < 6) {
            return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
        }

        const entry = otpStore.get(nipTrimmed);
        if (!entry) {
            return res.status(400).json({ success: false, message: 'OTP tidak ditemukan atau sudah kadaluarsa. Minta OTP baru.' });
        }
        if (Date.now() > entry.expiresAt) {
            otpStore.delete(nipTrimmed);
            return res.status(400).json({ success: false, message: 'OTP sudah kadaluarsa. Minta OTP baru.' });
        }
        if (entry.attempts >= OTP_MAX_ATTEMPTS) {
            otpStore.delete(nipTrimmed);
            return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan salah. Minta OTP baru.' });
        }
        if (entry.otp !== otpTrimmed) {
            entry.attempts += 1;
            return res.status(400).json({ success: false, message: `OTP salah. Sisa percobaan: ${OTP_MAX_ATTEMPTS - entry.attempts}` });
        }

        // OTP valid → update password
        const hashedPassword = await bcrypt.hash(passwordBaruTrimmed, 10);
        const [result] = await pool.query('UPDATE users SET password = ? WHERE nip = ?', [hashedPassword, nipTrimmed]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        otpStore.delete(nipTrimmed); // OTP terpakai, hapus supaya tidak bisa dipakai ulang

        res.json({ success: true, message: 'Password berhasil diubah. Silakan login dengan password baru.' });

    } catch (err) {
        console.error('Forgot password verify error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

// ================= UPDATE PROFIL =================
router.put('/update-profile', async (req, res) => {
    try {
        const { user_id, nama, no_hp } = req.body;

        if (!user_id) return res.status(400).json({ success: false, message: 'user_id wajib disertakan.' });

        const namaTrimmed = String(nama || '').trim();
        if (!namaTrimmed) return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });

        const [result] = await pool.query(
            'UPDATE users SET nama = ?, no_hp = ? WHERE id = ?',
            [namaTrimmed, no_hp ? String(no_hp).trim() : null, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }

        res.json({ success: true, message: 'Profil berhasil diperbarui.' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
});

export default router;
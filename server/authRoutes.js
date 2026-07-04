import express from 'express';
import bcrypt from 'bcryptjs';
import pool from './db.js';

const router = express.Router();

// ================= LOGIN =================
router.post('/login', async (req, res) => {
    try {
        const { nip, password } = req.body;

        if (!nip || !password) {
            return res.status(400).json({
                success: false,
                message: 'NIP dan password wajib diisi'
            });
        }

        const nipTrimmed = String(nip).trim();
        const passwordTrimmed = String(password).trim();

        if (nipTrimmed === '' || passwordTrimmed === '') {
            return res.status(400).json({
                success: false,
                message: 'NIP dan password wajib diisi'
            });
        }

        const [users] = await pool.query(
            'SELECT * FROM users WHERE nip = ?',
            [nipTrimmed]
        );

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'NIP tidak ditemukan'
            });
        }

        const user = users[0];

        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: 'Akun tidak valid'
            });
        }

        const isPasswordValid = await bcrypt.compare(passwordTrimmed, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Password salah'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                nip: user.nip,
                nama: user.nama,
                role: user.role
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// ================= REGISTER =================
router.post('/register', async (req, res) => {
    try {
        const { nip, nama, password, role } = req.body;

        if (!nip || !nama || !password) {
            return res.status(400).json({
                success: false,
                message: 'NIP, nama, dan password wajib diisi'
            });
        }

        const nipTrimmed = String(nip).trim();
        const namaTrimmed = String(nama).trim();
        const passwordTrimmed = String(password).trim();

        if (nipTrimmed === '' || namaTrimmed === '' || passwordTrimmed === '') {
            return res.status(400).json({
                success: false,
                message: 'NIP, nama, dan password wajib diisi'
            });
        }

        const validRoles = ['admin', 'user'];
        const roleFinal = validRoles.includes(role) ? role : 'user';

        const [existing] = await pool.query(
            'SELECT id FROM users WHERE nip = ?',
            [nipTrimmed]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'NIP sudah terdaftar'
            });
        }

        const hashedPassword = await bcrypt.hash(passwordTrimmed, 10);

        const [result] = await pool.query(
            'INSERT INTO users (nip, nama, password, role) VALUES (?, ?, ?, ?)',
            [nipTrimmed, namaTrimmed, hashedPassword, roleFinal]
        );

        res.status(201).json({
            success: true,
            message: 'User berhasil didaftarkan',
            user: {
                id: result.insertId,
                nip: nipTrimmed,
                nama: namaTrimmed,
                role: roleFinal
            }
        });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

export default router;
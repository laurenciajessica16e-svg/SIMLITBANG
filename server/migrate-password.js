import bcrypt from 'bcrypt';
import pool from './db.js';

async function migratePasswords() {
    try {
        const [users] = await pool.query('SELECT id, nip, password FROM users');

        for (const user of users) {
            // Skip kalau password sudah berupa hash bcrypt
            if (/^\$2[aby]\$/.test(user.password)) {
                console.log(`User ${user.nip} sudah di-hash, skip.`);
                continue;
            }

            const hashed = await bcrypt.hash(user.password, 10);

            await pool.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashed, user.id]
            );

            console.log(`User ${user.nip} berhasil di-hash.`);
        }

        console.log('Migrasi selesai.');
        process.exit(0);
    } catch (err) {
        console.error('Migrasi gagal:', err);
        process.exit(1);
    }
}

migratePasswords();
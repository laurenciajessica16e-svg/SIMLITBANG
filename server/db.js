import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Memastikan file .env dibaca dengan benar oleh Node.js
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    // Menggunakan string kosong "" jika DB_PASSWORD di .env tidak terdeteksi atau kosong
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'simlitbang_db',
    port: Number(process.env.DB_PORT) || 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Sistem pengecekan koneksi agar nodemon TIDAK CRASH jika koneksi gagal
try {
    const connection = await pool.getConnection();
    console.log('✅ KONEKSI KE MYSQL WORKBENCH BERHASIL!');
    connection.release();
} catch (error) {
    console.error('❌ KONEKSI DATABASE GAGAL! Periksa kembali MySQL Server Anda.');
    console.error('Detail Eror:', error.message);
}

export default pool;


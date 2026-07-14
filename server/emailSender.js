// // emailSender.js
// // Modul kirim notifikasi reminder lewat Email (Gmail SMTP), pakai Nodemailer.
// // Gratis, resmi, tidak ada risiko akun kena banned/restricted.
// //
// // Instalasi dulu:
// //   npm install nodemailer
// //
// // Setup Gmail App Password (wajib, password biasa TIDAK bisa dipakai):
// //   1. Aktifkan 2-Step Verification di akun Google kamu
// //   2. Buka myaccount.google.com/apppasswords
// //   3. Buat App Password baru, copy kode 16 digitnya (tanpa spasi)
// //   4. Taruh di .env:
// //        EMAIL_USER=emailkamu@gmail.com
// //        EMAIL_APP_PASSWORD=16digitkodenya
// //        EMAIL_TO=emailtujuan@gmail.com   (boleh sama dengan EMAIL_USER kalau kirim ke diri sendiri)

// import nodemailer from 'nodemailer';

// let transporter = null;

// function getTransporter() {
//     if (transporter) return transporter;

//     const user = process.env.EMAIL_USER;
//     const pass = process.env.EMAIL_APP_PASSWORD;

//     if (!user || !pass) {
//         console.warn('⚠️  EMAIL_USER / EMAIL_APP_PASSWORD belum diisi di .env.');
//         return null;
//     }

//     transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: { user, pass },
//     });

//     return transporter;
// }

// /**
//  * Kirim email notifikasi.
//  * @param {string} subject - judul email
//  * @param {string} htmlBody - isi email dalam HTML (bisa juga teks biasa)
//  * @returns {Promise<boolean>} true kalau berhasil terkirim
//  */
// export async function sendEmailNotification(subject, htmlBody) {
//     const t = getTransporter();
//     if (!t) return false;

//     const to = process.env.EMAIL_TO;
//     if (!to) {
//         console.warn('⚠️  EMAIL_TO belum diisi di .env, email tidak terkirim.');
//         return false;
//     }

//     try {
//         await t.sendMail({
//             from: `"Monitoring Jadwal" <${process.env.EMAIL_USER}>`,
//             to,
//             subject,
//             html: htmlBody,
//         });
//         return true;
//     } catch (err) {
//         console.error('❌ Gagal mengirim email:', err.message);
//         return false;
//     }
// }
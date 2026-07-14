// test-email.js
// Script buat TES doang — jalankan manual untuk mastiin konfigurasi
// EMAIL_USER / EMAIL_APP_PASSWORD / EMAIL_TO kamu benar dan email
// beneran bisa terkirim.
//
// Cara pakai:
//   1. Taruh file ini sejajar dengan emailSender.js (folder server/)
//   2. Pastikan .env sudah ada EMAIL_USER, EMAIL_APP_PASSWORD, EMAIL_TO
//   3. Jalankan: node test-email.js
//   4. Cek inbox email kamu — kalau masuk, berarti konfigurasi sudah benar

import dotenv from 'dotenv';
import { sendEmailNotification } from './emailSender.js';

dotenv.config();

if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error('❌ EMAIL_USER / EMAIL_APP_PASSWORD belum diisi di .env.');
    process.exit(1);
}
if (!process.env.EMAIL_TO) {
    console.error('❌ EMAIL_TO belum diisi di .env.');
    process.exit(1);
}

console.log(`📤 Mengirim email tes ke ${process.env.EMAIL_TO}...`);

const ok = await sendEmailNotification(
    '✅ Tes Reminder Monitoring Jadwal',
    `<p>Ini email percobaan dari sistem reminder Monitoring Jadwal.</p><p>Waktu: ${new Date().toLocaleString('id-ID')}</p>`
);

if (ok) {
    console.log('✅ BERHASIL — cek inbox email kamu, pesan tes seharusnya sudah masuk (cek juga folder Spam kalau belum kelihatan).');
} else {
    console.log('❌ GAGAL mengirim. Cek lagi EMAIL_USER, EMAIL_APP_PASSWORD (harus App Password 16 digit, bukan password akun biasa), dan EMAIL_TO.');
}
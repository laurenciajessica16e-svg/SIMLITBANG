// reminderScheduler.js (v2 — tambah runReminderCheck yang bisa dipanggil manual)
import cron from 'node-cron';
import { kirimNotifKegiatan } from './fonnteSender.js';

// PENTING: format tanggal di sheet ternyata M/D/YYYY (bulan duluan, gaya AS),
// BUKAN D/M/YYYY (tanggal duluan) seperti asumsi awal — konfirmasi dari data
// asli: "7/13/2026" hanya masuk akal kalau posisi kedua (13) adalah TANGGAL,
// karena tidak ada bulan ke-13. Jadi urutannya month/day/year.
function parseTanggalSheet(str) {
    if (!str) return null;
    const [m, d, y] = String(str).split('/').map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
}

function isSameDate(a, b) {
    return a && b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

// ── BARU: logic pengecekan diekstrak jadi fungsi tersendiri, supaya bisa
// dipanggil dari 2 tempat — dari jadwal cron OTOMATIS, dan dari endpoint
// test MANUAL (POST /api/reminder/test) tanpa perlu menunggu jam 7 pagi.
// baseDate: tanggal yang dianggap "hari ini" — default tanggal asli sekarang,
// tapi bisa di-override buat testing (lihat endpoint /api/reminder/test?tanggal=...)
export async function runReminderCheck(getKegiatanUntukTanggal, baseDate = new Date()) {
    console.log('⏰ Menjalankan pengecekan reminder kegiatan...');

    const today = new Date(baseDate);
    today.setHours(0, 0, 0, 0);
    const besok = new Date(today);
    besok.setDate(today.getDate() + 1);

    let terkirim = 0;
    let dilewati = 0;

    try {
        const kegiatanHariIni = await getKegiatanUntukTanggal(today);
        const kegiatanBesok = await getKegiatanUntukTanggal(besok);

        for (const k of kegiatanHariIni) {
            const tgl = parseTanggalSheet(k.tanggal_mulai);
            if (isSameDate(tgl, today)) {
                const hasil = await kirimNotifKegiatan(k, 'Kegiatan Hari Ini');
                if (hasil && hasil.status) terkirim++; else dilewati++;
            }
        }
        for (const k of kegiatanBesok) {
            const tgl = parseTanggalSheet(k.tanggal_mulai);
            if (isSameDate(tgl, besok)) {
                const hasil = await kirimNotifKegiatan(k, 'Pengingat H-1');
                if (hasil && hasil.status) terkirim++; else dilewati++;
            }
        }

        console.log(`✅ Pengecekan reminder selesai — ${terkirim} pesan terkirim, ${dilewati} dilewati/gagal.`);
        return { success: true, terkirim, dilewati };
    } catch (err) {
        console.error('Gagal menjalankan reminder scheduler:', err.message);
        return { success: false, error: err.message };
    }
}

// getKegiatanUntukTanggal: fungsi async yang mengembalikan array kegiatan
// untuk sheet bulan yang bersangkutan dengan tanggal yang diberikan.
export function startReminderScheduler({ getKegiatanUntukTanggal, cronTime = '0 7 * * *' }) {
    cron.schedule(cronTime, () => runReminderCheck(getKegiatanUntukTanggal));
    console.log(`🔔 Reminder scheduler WA aktif (cron: ${cronTime})`);
}
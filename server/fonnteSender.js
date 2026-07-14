// fonnteSender.js
import axios from 'axios';

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const FONNTE_TARGET = process.env.FONNTE_TARGET;

const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_INDO = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Sheet nyimpen tanggal dalam format M/D/YYYY (bulan duluan) — sudah
// dikonfirmasi sebelumnya lewat data asli (contoh "7/13/2026" cuma masuk
// akal kalau posisi kedua = tanggal, karena tidak ada bulan ke-13).
function parseTanggalSheet(str) {
    if (!str) return null;
    const [m, d, y] = String(str).split('/').map(Number);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
}

// "7/9/2026" -> "Kamis, 9 Juli 2026"
function formatTanggalIndo(str) {
    const d = parseTanggalSheet(str);
    if (!d) return str || '-';
    return `${HARI_INDO[d.getDay()]}, ${d.getDate()} ${BULAN_INDO[d.getMonth()]} ${d.getFullYear()}`;
}

function formatPesanKegiatan(k, label) {
    const tglMulaiFormatted = formatTanggalIndo(k.tanggal_mulai);
    const tglSelesaiFormatted = formatTanggalIndo(k.tanggal_selesai);

    const tanggal = k.tanggal_mulai && k.tanggal_selesai && k.tanggal_mulai !== k.tanggal_selesai
        ? `${tglMulaiFormatted} s/d ${tglSelesaiFormatted}`
        : tglMulaiFormatted;

    const jam = k.jam_mulai && k.jam_selesai
        ? `${k.jam_mulai} - ${k.jam_selesai}`
        : (k.jam_mulai || '-');

    // Header pesan sekarang otomatis mengikuti tanggal kegiatan itu sendiri,
    // contoh: "Jadwal Senin, 13 Juli 2026" — bukan lagi teks statis
    // "Kegiatan Hari Ini". Kalau `label` dioper secara eksplisit dari
    // pemanggil, itu tetap dipakai (supaya fleksibel untuk kasus lain,
    // misal reminder H-1 dengan teks berbeda); kalau tidak, default ke
    // "Jadwal {tanggal_mulai}".
    const headerLabel = label || `Jadwal ${tglMulaiFormatted}`;

    return `📌 *${headerLabel}*\n\n` +
        `*Kegiatan:* ${k.nama}\n` +
        `*Minggu:* ${k.minggu || '-'}\n` +
        `*Tanggal:* ${tanggal}\n` +
        `*Jam:* ${jam}\n` +
        `*PIC:* ${k.pic || '-'}\n` +
        `*Tempat:* ${k.tempat || '-'}` +
        (k.keterangan ? `\n*Keterangan:* ${k.keterangan}` : '');
}

export async function kirimNotifKegiatan(kegiatan, label) {
    if (!FONNTE_TOKEN || !FONNTE_TARGET) {
        console.warn('⚠️  FONNTE_TOKEN/FONNTE_TARGET belum diisi — notifikasi WA dilewati.');
        return;
    }
    const pesan = formatPesanKegiatan(kegiatan, label);
    try {
        const res = await axios.post(
            'https://api.fonnte.com/send',
            new URLSearchParams({ target: FONNTE_TARGET, message: pesan }),
            { headers: { Authorization: FONNTE_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        if (!res.data.status) {
            console.error('Gagal kirim Fonnte:', res.data);
        }
        return res.data;
    } catch (err) {
        console.error('Error kirim Fonnte:', err.message);
    }
}

/**
 * Kirim pesan WA bebas ke SATU nomor tertentu (beda dari kirimNotifKegiatan
 * yang selalu broadcast ke FONNTE_TARGET). Dipakai untuk OTP personal.
 */
export async function kirimPesanKeNomor(nomor, pesan) {
    if (!FONNTE_TOKEN) {
        console.warn('⚠️  FONNTE_TOKEN belum diisi — kirim pesan WA dilewati.');
        return { status: false, reason: 'token kosong' };
    }
    if (!nomor) {
        console.warn('⚠️  Nomor tujuan kosong — kirim pesan WA dilewati.');
        return { status: false, reason: 'nomor kosong' };
    }
    try {
        const res = await axios.post(
            'https://api.fonnte.com/send',
            new URLSearchParams({ target: nomor, message: pesan }),
            { headers: { Authorization: FONNTE_TOKEN, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        if (!res.data.status) console.error('Gagal kirim Fonnte (personal):', res.data);
        return res.data;
    } catch (err) {
        console.error('Error kirim Fonnte (personal):', err.message);
        return { status: false, reason: err.message };
    }
}
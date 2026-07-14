// dateHelpers.js
// Data di sheet kamu punya 2 format tanggal berbeda, jadi perlu parser
// yang bisa handle keduanya:
//   Format 1: "6/8/2026"   -> M/D/YYYY (bulan/tanggal/tahun, dari <input type="date">)
//   Format 2: "8 Jun 2026" -> D Mon YYYY (dari input manual / formatTanggalToStr)

const BULAN_SINGKAT = {
    jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
    jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11,
};

const SHEET_BULAN_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Parse string tanggal dari sheet ke objek Date (jam di-set ke tengah malam lokal).
 * Return null kalau tidak bisa di-parse.
 */
export function parseSheetDate(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.trim();

    // Format "6/8/2026" -> M/D/YYYY
    if (s.includes('/')) {
        const parts = s.split('/').map(p => p.trim());
        if (parts.length === 3) {
            const [m, d, y] = parts.map(Number);
            if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
                const dt = new Date(y, m - 1, d);
                if (!isNaN(dt.getTime())) return dt;
            }
        }
    }

    // Format "8 Jun 2026" -> D Mon YYYY
    const match = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
    if (match) {
        const [, dStr, monStr, yStr] = match;
        const monKey = monStr.slice(0, 3).toLowerCase();
        if (monKey in BULAN_SINGKAT) {
            const dt = new Date(Number(yStr), BULAN_SINGKAT[monKey], Number(dStr));
            if (!isNaN(dt.getTime())) return dt;
        }
    }

    return null;
}

/** Bandingkan apakah 2 tanggal jatuh di hari kalender yang sama (abaikan jam) */
export function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

/** Nama tab sheet ("Juni 2026") untuk sebuah objek Date */
export function sheetNameForDate(date) {
    return `${SHEET_BULAN_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** Tanggal hari ini, jam di-nolkan (dipakai buat perbandingan H-1 / hari-H) */
export function todayMidnight() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

/** Tanggal besok, jam di-nolkan */
export function tomorrowMidnight() {
    const d = todayMidnight();
    d.setDate(d.getDate() + 1);
    return d;
}
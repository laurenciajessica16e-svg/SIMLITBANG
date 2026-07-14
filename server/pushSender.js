// pushSender.js
// Modul kirim notifikasi lewat Web Push API (notifikasi asli dari website,
// tetap muncul walau tab/browser ditutup — selama browser masih terinstall
// di device dan OS-nya tidak dimatikan total).
//
// Instalasi dulu:
//   npm install web-push
//
// Generate VAPID keys (SEKALI SAJA, simpan hasilnya, jangan generate ulang
// karena subscription lama jadi tidak valid kalau key berubah):
//   npx web-push generate-vapid-keys
//
// Taruh hasilnya di .env:
//   VAPID_PUBLIC_KEY=xxxxx
//   VAPID_PRIVATE_KEY=xxxxx
//   VAPID_SUBJECT=mailto:emailkamu@gmail.com

import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Subscription (info "alamat" push tiap browser/device yang izinkan notifikasi)
// disimpan di file JSON kecil ini. Cukup untuk pemakaian personal;
// kalau nanti butuh multi-user beneran, pindahkan ke tabel database.
const SUBSCRIPTIONS_PATH = path.join(__dirname, 'push-subscriptions.json');

let vapidConfigured = false;

function ensureVapidConfigured() {
    if (vapidConfigured) return true;
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
        console.warn('⚠️  VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT belum diisi di .env — Web Push nonaktif.');
        return false;
    }
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
}

function loadSubscriptions() {
    try {
        return JSON.parse(fs.readFileSync(SUBSCRIPTIONS_PATH, 'utf-8'));
    } catch {
        return [];
    }
}

function saveSubscriptions(list) {
    fs.writeFileSync(SUBSCRIPTIONS_PATH, JSON.stringify(list, null, 2));
}

/** Simpan subscription baru dari browser (dipanggil dari endpoint POST /api/push/subscribe) */
export function addSubscription(subscription) {
    const list = loadSubscriptions();
    // Hindari duplikat berdasarkan endpoint (1 browser/device = 1 endpoint unik)
    const exists = list.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
        list.push(subscription);
        saveSubscriptions(list);
    }
    return true;
}

/** Ambil VAPID public key (dipanggil dari endpoint GET /api/push/vapid-public-key) */
export function getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Kirim push notification ke SEMUA subscription tersimpan.
 * @param {string} title - judul notifikasi
 * @param {string} body - isi notifikasi
 * @param {string} [url] - URL yang dibuka kalau notifikasi diklik
 */
export async function sendPushToAll(title, body, url = '/') {
    if (!ensureVapidConfigured()) return;

    const list = loadSubscriptions();
    if (list.length === 0) {
        console.log('ℹ️  Belum ada subscription push tersimpan, lewati kirim push.');
        return;
    }

    const payload = JSON.stringify({ title, body, url });
    const stillValid = [];

    for (const sub of list) {
        try {
            await webpush.sendNotification(sub, payload);
            stillValid.push(sub);
        } catch (err) {
            // Status 410/404 artinya subscription sudah tidak valid (user
            // uninstall browser, clear data, dll) -> buang dari daftar
            if (err.statusCode === 410 || err.statusCode === 404) {
                console.log('🗑️  Subscription tidak valid lagi, dihapus dari daftar.');
            } else {
                console.error('❌ Gagal kirim push ke satu subscriber:', err.message);
                stillValid.push(sub); // simpan lagi, mungkin cuma error sementara
            }
        }
    }

    saveSubscriptions(stillValid);
}
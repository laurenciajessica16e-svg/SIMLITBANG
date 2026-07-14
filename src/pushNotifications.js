// pushNotifications.js
// TARUH FILE INI DI FOLDER src/ project React kamu, sejajar dengan file
// komponen lain (misal src/pushNotifications.js)

// Ganti sesuai SHEET_API_URL kamu di JadwalMonitoring.jsx (base URL yang sama)
const API_BASE = 'http://localhost:5000';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

/**
 * Minta izin notifikasi ke user & daftarkan subscription ke backend.
 * Panggil ini dari useEffect sekali saat komponen utama pertama kali mount,
 * idealnya di belakang tombol/toggle "Aktifkan Notifikasi" (browser modern
 * memblokir prompt izin yang muncul otomatis tanpa interaksi user).
 */
export async function enablePushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Browser kamu tidak mendukung notifikasi push.');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert('Izin notifikasi ditolak. Aktifkan lewat pengaturan browser kalau berubah pikiran.');
            return false;
        }

        const registration = await navigator.serviceWorker.register('/service-worker.js');
        await navigator.serviceWorker.ready;

        const keyRes = await fetch(`${API_BASE}/api/push/vapid-public-key`);
        const { publicKey } = await keyRes.json();

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
        }

        await fetch(`${API_BASE}/api/push/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
        });

        return true;
    } catch (err) {
        console.error('Gagal mengaktifkan push notification:', err);
        return false;
    }
}

/** Cek apakah user sudah pernah kasih izin & subscribe sebelumnya */
export async function isPushEnabled() {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription) && Notification.permission === 'granted';
}
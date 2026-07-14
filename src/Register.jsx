import React, { useState } from 'react';
import { Icon } from './theme';
import logoPLN from './assets/logoPLN.png';

// CEK INI: sesuaikan kalau base URL API kamu beda
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PRIMARY = '#0082CA';

const inputWrap = {
  display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0',
  borderRadius: 12, padding: '13px 16px', background: '#fff',
};
const inputEl = {
  border: 'none', outline: 'none', fontSize: 14, width: '100%', color: '#0b1c30', background: 'transparent',
};
const labelEl = { fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8, display: 'block' };
const fieldWrap = { marginBottom: 18 };

// Normalisasi nomor HP: buang spasi/tanda hubung, ubah awalan 0 -> 62 supaya
// konsisten dengan format yang dipakai Fonnte / backend WA (sama seperti di
// ForgotPassword.jsx).
function normalizeNoHp(raw) {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return digits;
}

export default function Register({ onBackToLogin, onRegisterSuccess }) {
  const [form, setForm] = useState({ nip: '', nama: '', no_hp: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.nip.trim()) return 'NIP wajib diisi.';
    if (!form.nama.trim()) return 'Nama lengkap wajib diisi.';
    if (!form.no_hp.trim()) return 'No. WhatsApp wajib diisi.';
    if (normalizeNoHp(form.no_hp).length < 9) return 'No. WhatsApp tidak valid.';
    if (!form.password) return 'Password wajib diisi.';
    if (form.password.length < 6) return 'Password minimal 6 karakter.';
    if (form.password !== form.confirmPassword) return 'Konfirmasi password tidak cocok.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: form.nip.trim(),
          nama: form.nama.trim(),
          password: form.password,
          no_hp: normalizeNoHp(form.no_hp),
          role: 'user', // HARDCODE — jangan pernah ambil role dari input user di sini
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Gagal membuat akun.');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={pageWrap}>
        <div style={cardWrap}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Icon name="check_circle" size={34} style={{ color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0b1c30', margin: '0 0 8px' }}>Akun Berhasil Dibuat</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6 }}>
              Akun dengan NIP <strong>{form.nip}</strong> sudah terdaftar. Silakan login menggunakan NIP dan password yang baru saja kamu buat.
            </p>
            <button onClick={onBackToLogin} style={primaryBtn}>
              Ke Halaman Login <Icon name="arrow_forward" size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, overflow: 'hidden', background: '#fff', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
          boxShadow: '0 4px 14px rgba(11,28,48,0.08)',
        }}>
          <img src={logoPLN} alt="Logo PLN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: PRIMARY, letterSpacing: '-0.02em' }}>SIMPRO</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', letterSpacing: '0.12em', marginTop: 4 }}>
          RESEARCH &amp; DEVELOPMENT MANAGEMENT
        </div>
      </div>

      <div style={cardWrap}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0b1c30', margin: '0 0 4px', textAlign: 'center' }}>Buat Akun Baru</h2>
        <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 24px', textAlign: 'center' }}>
          Daftar untuk mendapatkan akses ke SIMPRO
        </p>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, marginBottom: 18, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldWrap}>
            <label style={labelEl}>NIP *</label>
            <div style={inputWrap}>
              <Icon name="badge" size={18} style={{ color: '#94a3b8' }} />
              <input
                style={inputEl}
                value={form.nip}
                onChange={e => update('nip', e.target.value)}
                placeholder="Masukkan NIP Anda"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelEl}>Nama Lengkap *</label>
            <div style={inputWrap}>
              <Icon name="person" size={18} style={{ color: '#94a3b8' }} />
              <input
                style={inputEl}
                value={form.nama}
                onChange={e => update('nama', e.target.value)}
                placeholder="Masukkan nama lengkap"
                disabled={loading}
              />
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelEl}>
              No. WhatsApp *{' '}
              <span style={{ fontWeight: 500, color: '#94a3b8' }}>(dipakai untuk lupa password)</span>
            </label>
            <div style={inputWrap}>
              <Icon name="call" size={18} style={{ color: '#94a3b8' }} />
              <input
                style={inputEl}
                value={form.no_hp}
                onChange={e => update('no_hp', e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Contoh: 081234567890"
                inputMode="numeric"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelEl}>Password *</label>
            <div style={inputWrap}>
              <Icon name="lock" size={18} style={{ color: '#94a3b8' }} />
              <input
                style={inputEl}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="Minimal 6 karakter"
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={eyeBtn}>
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} style={{ color: '#94a3b8' }} />
              </button>
            </div>
          </div>

          <div style={fieldWrap}>
            <label style={labelEl}>Konfirmasi Password *</label>
            <div style={inputWrap}>
              <Icon name="lock" size={18} style={{ color: '#94a3b8' }} />
              <input
                style={inputEl}
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                placeholder="Ulangi password"
                disabled={loading}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} style={eyeBtn}>
                <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={18} style={{ color: '#94a3b8' }} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...primaryBtn, width: '100%', marginTop: 6, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Mendaftarkan...' : (<>DAFTAR <Icon name="arrow_forward" size={18} /></>)}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>Sudah punya akun? </span>
          <button onClick={onBackToLogin} style={linkBtn}>Login di sini</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#94a3b8', letterSpacing: '0.02em' }}>
        © 2024 PT PLN (PERSERO) PUSAT PENELITIAN DAN PENGEMBANGAN
      </div>
    </div>
  );
}

const pageWrap = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: '40px 20px',
  background: 'linear-gradient(180deg, #eef4fb 0%, #f8fafc 100%)',
};
const cardWrap = {
  background: '#fff', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 420,
  boxShadow: '0 20px 50px -20px rgba(11,28,48,0.18)',
};
const primaryBtn = {
  background: PRIMARY, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 20px',
  fontSize: 14, fontWeight: 800, letterSpacing: '0.03em', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 6px 16px rgba(0,130,202,0.28)',
};
const eyeBtn = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 };
const linkBtn = {
  background: 'none', border: 'none', color: PRIMARY, fontWeight: 800, fontSize: 13, cursor: 'pointer', padding: 0,
}; 
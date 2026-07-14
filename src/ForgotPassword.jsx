import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoPLN from './assets/logoPLN.png';
import { theme, COLORS, Icon } from './theme';

// Sesuaikan dengan base URL backend kamu (sama dengan yang dipakai di LoginScreen/App.jsx)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_S = 60; // samakan dengan OTP_COOLDOWN_MS di backend (60 detik)

// ── Input bertema ikon kiri, sama persis gaya field NIP/Password di LoginScreen ──
const IconInput = ({ icon, label, rightSlot, ...props }) => {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: focus ? COLORS.primary : theme.textLabel, display: 'block', marginBottom: 5 }}>
          {label}
        </label>
      )}
      {icon && (
        <span style={{ position: 'absolute', left: 14, top: label ? 38 : 12, color: theme.textLabel, display: 'flex', pointerEvents: 'none' }}>
          <Icon name={icon} size={18} />
        </span>
      )}
      <input
        {...props}
        onFocus={e => { setFocus(true); props.onFocus?.(e); }}
        onBlur={e => { setFocus(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '11px 14px', paddingLeft: icon ? 40 : 14, paddingRight: rightSlot ? 38 : 14,
          borderRadius: 12, border: focus ? '1.5px solid #0082CA' : `1.5px solid ${theme.cardBorder}`,
          fontSize: 13, fontFamily: 'inherit', color: theme.text, background: '#ffffff80', outline: 'none',
          boxSizing: 'border-box', boxShadow: focus ? '0 0 0 4px rgba(0,130,202,0.12)' : 'none',
          transition: 'all 0.2s ease',
        }}
      />
      {rightSlot && <span style={{ position: 'absolute', right: 10, top: label ? 33 : 10 }}>{rightSlot}</span>}
    </div>
  );
};

const Btn = ({ children, onClick, type = 'button', variant = 'primary', disabled }) => {
  if (variant === 'primary') {
    return (
      <button type={type} onClick={onClick} disabled={disabled}
        style={{
          background: disabled ? theme.input : '#0082CA',
          color: disabled ? theme.textLabel : '#fff', border: 'none',
          padding: '15px 0', borderRadius: 12, fontSize: 14, fontWeight: 800,
          cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: disabled ? 'none' : '0 6px 18px rgba(0,130,202,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
          transition: 'all 0.2s ease',
        }}>
        {children}
      </button>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        background: theme.input, color: theme.text, border: `1px solid ${theme.borderLight}`,
        padding: '13px 0', borderRadius: 12, fontSize: 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
        transition: 'all 0.2s ease',
      }}>
      {children}
    </button>
  );
};

const AlertBox = ({ type = 'error', children }) => {
  if (!children) return null;
  const isError = type === 'error';
  return (
    <div style={{
      background: isError ? theme.errorBg : 'rgba(22,163,74,0.08)',
      border: `1px solid ${isError ? theme.errorBorder : 'rgba(22,163,74,0.3)'}`,
      borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600,
      color: isError ? COLORS.danger : '#16a34a',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <Icon name={isError ? 'error' : 'check_circle'} size={16} /> {children}
    </div>
  );
};

// ── FORGOT PASSWORD SCREEN — visual language sama persis dengan LoginScreen ──
// Props: onBack (kembali ke layar login), onSuccess (dipanggil setelah password berhasil diubah)
export default function ForgotPassword({ onBack, onSuccess }) {
  // step 1 = input NIP & minta OTP, step 2 = input OTP + password baru
  const [step, setStep] = useState(1);
  const [nip, setNip] = useState('');
  const [otp, setOtp] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const cooldownRef = useRef(null);
  useEffect(() => () => clearInterval(cooldownRef.current), []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_S);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg(''); setInfoMsg('');

    if (!nip.trim()) { setErrorMsg('NIP wajib diisi.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: nip.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Gagal mengirim OTP. Coba lagi.');
        return;
      }

      setInfoMsg(data.message || 'OTP telah dikirim ke WhatsApp terdaftar.');
      setStep(2);
      startCooldown();
    } catch (err) {
      console.error('Request OTP error:', err);
      setErrorMsg('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setOtp('');
    await handleRequestOtp();
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg(''); setInfoMsg('');

    if (otp.trim().length !== OTP_LENGTH) { setErrorMsg(`Kode OTP harus ${OTP_LENGTH} digit.`); return; }
    if (passwordBaru.length < 6) { setErrorMsg('Password baru minimal 6 karakter.'); return; }
    if (passwordBaru !== confirmPassword) { setErrorMsg('Konfirmasi password tidak cocok.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: nip.trim(), otp: otp.trim(), password_baru: passwordBaru }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Verifikasi gagal. Periksa kembali kode OTP.');
        return;
      }

      setInfoMsg('Password berhasil diubah! Mengarahkan ke halaman login...');
      setTimeout(() => { onSuccess ? onSuccess() : onBack?.(); }, 1500);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setErrorMsg('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontFamily: "'Inter', sans-serif", background: theme.bg, padding: '24px 0' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: theme.bgGradient }} />
      <div style={{ position: 'fixed', top: -120, left: -120, width: 380, height: 380, background: 'rgba(0,130,202,0.10)', borderRadius: '50%', filter: 'blur(100px)' }} />
      <div style={{ position: 'fixed', bottom: -120, right: -120, width: 380, height: 380, background: 'rgba(255,215,0,0.10)', borderRadius: '50%', filter: 'blur(100px)' }} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="simlit-login-wrap"
        style={{ position: 'relative', zIndex: 2, width: 420, maxWidth: '100%', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.12)', background: '#fff', flexShrink: 0 }}>
              <img src={logoPLN} alt="Logo PLN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800, color: '#0082CA', margin: 0, letterSpacing: '-0.02em' }}>SIMLITBANG</h1>
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: theme.textLabel, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>Research &amp; Development Management</p>
        </div>

        <div className="simlit-login-card" style={{ background: theme.card, backdropFilter: 'blur(14px)', borderRadius: 24, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 10px 30px -5px rgba(0,96,151,0.10)', padding: '40px 36px', boxSizing: 'border-box' }}>

          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              {step === 1 ? 'Lupa Password' : 'Verifikasi OTP'}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.text, margin: 0 }}>
              {step === 1 ? 'Reset Password Kamu' : 'Masukkan Kode OTP'}
            </h2>
            <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 6, lineHeight: 1.6 }}>
              {step === 1
                ? 'Masukkan NIP kamu, kode OTP akan dikirim lewat WhatsApp terdaftar.'
                : `Kode 6 digit dikirim ke WhatsApp terdaftar untuk NIP ${nip}.`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}
                onSubmit={handleRequestOtp}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <IconInput icon="person" label="NIP" type="text" placeholder="Masukkan NIP Anda" value={nip} onChange={e => setNip(e.target.value)} disabled={loading} />

                {errorMsg && <AlertBox type="error">{errorMsg}</AlertBox>}
                {infoMsg && <AlertBox type="success">{infoMsg}</AlertBox>}

                <Btn type="submit" disabled={loading}>
                  {loading ? 'MENGIRIM OTP...' : <>KIRIM KODE OTP <Icon name="arrow_forward" size={18} /></>}
                </Btn>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}
                onSubmit={handleVerifyOtp}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: theme.textLabel, display: 'block', marginBottom: 5 }}>
                    Kode OTP ({OTP_LENGTH} digit)
                  </label>
                  <input
                    type="text" inputMode="numeric" placeholder="••••••"
                    value={otp} onChange={handleOtpChange} disabled={loading}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${theme.cardBorder}`,
                      fontSize: 20, fontWeight: 800, letterSpacing: '0.5em', textAlign: 'center',
                      color: '#0082CA', background: '#ffffff80', outline: 'none', boxSizing: 'border-box',
                    }} />
                </div>

                <IconInput
                  icon="lock" label="Password Baru" type={showPass ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter" value={passwordBaru} onChange={e => setPasswordBaru(e.target.value)}
                  disabled={loading}
                  rightSlot={
                    <button type="button" onClick={() => setShowPass(s => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLabel, display: 'flex' }}>
                      <Icon name={showPass ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  } />

                <IconInput icon="lock" label="Konfirmasi Password Baru" type={showPass ? 'text' : 'password'} placeholder="Ulangi password baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} />

                {errorMsg && <AlertBox type="error">{errorMsg}</AlertBox>}
                {infoMsg && <AlertBox type="success">{infoMsg}</AlertBox>}

                <Btn type="submit" disabled={loading}>
                  {loading ? 'MEMVERIFIKASI...' : <>UBAH PASSWORD <Icon name="lock_reset" size={18} /></>}
                </Btn>

                <div style={{ textAlign: 'center', fontSize: 11.5, color: theme.textLabel }}>
                  Tidak menerima kode?{' '}
                  {cooldown > 0 ? (
                    <span style={{ fontWeight: 700 }}>Kirim ulang dalam {cooldown}s</span>
                  ) : (
                    <a onClick={handleResendOtp} style={{ color: '#0082CA', fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
                      Kirim ulang
                    </a>
                  )}
                </div>

                <Btn variant="ghost" onClick={() => { setStep(1); setOtp(''); setErrorMsg(''); setInfoMsg(''); }} disabled={loading}>
                  <Icon name="arrow_back" size={16} /> Ganti NIP
                </Btn>
              </motion.form>
            )}
          </AnimatePresence>

          <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: `1px solid ${theme.borderLight}`, fontSize: 12, color: theme.textFaint }}>
            <a onClick={onBack} style={{ color: '#0082CA', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>← Kembali ke Login</a>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 10.5, color: theme.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          © 2024 PT PLN (Persero) Pusat Penelitian dan Pengembangan
        </p>
      </motion.div>
    </div>
  );
}
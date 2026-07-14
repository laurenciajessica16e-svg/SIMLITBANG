import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import logoPLN from "./assets/logoPLN.png";
import KurvaSAnalysis from "./KurvaSAnalysis";
import JadwalMonitoring from "./JadwalMonitoring";
import MonitoringPenelitian from "./MonitoringPenelitian"; 
import ForgotPassword from './ForgotPassword';
import Register from './Register';

// import { useNavigate } from 'react-router-dom';
// theme/COLORS/Icon now live in their own module (theme.js) to avoid a
// circular import: App.jsx imports KurvaSAnalysis.jsx, so KurvaSAnalysis.jsx
// can no longer import these values back from './App' (that caused
// "Cannot access 'theme' before initialization"). Re-exported below so any
// other file still doing `import { theme } from './App'` keeps working.
import { theme, COLORS, Icon } from './theme';
export { theme, COLORS, Icon };

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SHEET_API_URL = 'http://localhost:5000/api/monitoring-jadwal'; // sama seperti di JadwalMonitoring.js

// ── FONTS (Inter + Material Symbols Outlined) + RESPONSIVE GLOBAL CSS ──────
const useDesignFonts = () => {
  useEffect(() => {
    const ids = ['simlitbang-inter-font', 'simlitbang-symbols-font'];
    const hrefs = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap',
    ];
    ids.forEach((id, i) => {
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id; link.rel = 'stylesheet'; link.href = hrefs[i];
        document.head.appendChild(link);
      }
    });
    if (!document.getElementById('simlitbang-symbol-style')) {
      const style = document.createElement('style');
      style.id = 'simlitbang-symbol-style';
      style.innerHTML = `html,body,#root{margin:0;padding:0;width:100%;min-height:100%;background:#f8f9ff;box-sizing:border-box;}
      *{box-sizing:border-box;}
      .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;line-height:1;display:inline-flex;}
      ::-webkit-scrollbar{width:8px;height:8px}
      ::-webkit-scrollbar-track{background:#eff4ff}
      ::-webkit-scrollbar-thumb{background:#0082CA55;border-radius:10px}
      ::-webkit-scrollbar-thumb:hover{background:#0082CA88}

      /* ── 3D / DEPTH SYSTEM ──────────────────────────────────────── */
      .simlit-3d-tilt{
        perspective: 1400px;
      }
      .simlit-3d-tilt .simlit-3d-inner{
        transform: rotateX(3deg);
        transform-origin: top center;
        transition: transform .35s ease;
      }
      .simlit-3d-tilt:hover .simlit-3d-inner{
        transform: rotateX(0deg) translateY(-2px);
      }
      .simlit-3d-card{
        box-shadow:
          0 1px 0 rgba(255,255,255,0.7) inset,
          0 18px 34px -14px rgba(11,28,48,0.22),
          0 4px 10px rgba(11,28,48,0.08);
      }
      .simlit-3d-card:hover{
        box-shadow:
          0 1px 0 rgba(255,255,255,0.8) inset,
          0 26px 46px -14px rgba(11,28,48,0.28),
          0 6px 14px rgba(11,28,48,0.10);
      }
      .simlit-avatar-btn{ transition: transform .2s ease, box-shadow .2s ease; }
      .simlit-avatar-btn:hover{ transform: translateY(-2px) scale(1.04); }
      .simlit-avatar-btn:active{ transform: translateY(0) scale(0.98); }
      .simlit-menu-item{ transition: background .15s ease, transform .15s ease; }
      .simlit-menu-item:hover{ background: #eff4ff; transform: translateX(2px); }

      /* ── RESPONSIVE OVERRIDES ───────────────────────────────────── */
      .simlit-sidebar{ transition: transform .28s cubic-bezier(.4,0,.2,1); }
      .simlit-overlay{ display:none; }

      @media (max-width: 1024px){
        .simlit-stats-4{ grid-template-columns: repeat(2,1fr) !important; }
        .simlit-two-col{ grid-template-columns: 1fr !important; }
        .simlit-ev-3{ grid-template-columns: repeat(2,1fr) !important; }
      }

      @media (max-width: 768px){
        .simlit-sidebar{ transform: translateX(-100%); width: 250px !important; }
        .simlit-sidebar.simlit-open{ transform: translateX(0); box-shadow: 8px 0 28px rgba(11,28,48,0.18); }
        .simlit-main{ margin-left: 0 !important; }
        .simlit-header{ padding: 0 14px !important; }
        .simlit-header-crumb{ display:none !important; }
        .simlit-hamburger{ display:inline-flex !important; }
        .simlit-body-pad{ padding: 16px 14px !important; }
        .simlit-stats-4{ grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        .simlit-mini-4{ grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
        .simlit-two-col{ grid-template-columns: 1fr !important; gap: 14px !important; }
        .simlit-ev-3{ grid-template-columns: 1fr !important; }
        .simlit-detail-grid{ grid-template-columns: 1fr !important; }
        .simlit-form-grid{ grid-template-columns: 1fr !important; }
        .simlit-page-title{ font-size: 19px !important; }
        .simlit-page-actions{ flex-direction: column !important; align-items: stretch !important; gap: 8px !important; width: 100%; }
        .simlit-page-actions button{ width: 100%; justify-content: center; }
        .simlit-user-name-col{ display:none !important; }
        .simlit-overlay{ display:block !important; position:fixed; inset:0; background:rgba(11,28,48,0.45); z-index:45; backdrop-filter: blur(2px); }
        .simlit-login-card{ padding: 28px 22px !important; }
        .simlit-login-wrap{ width: 100% !important; padding: 0 16px; }
        .simlit-status-select{ width: 100% !important; }
        .simlit-section-header{ flex-direction: column !important; align-items: flex-start !important; }
        .simlit-section-header button{ width: 100%; justify-content: center; }
        .simlit-user-menu{ right: 14px !important; }
        .simlit-list-title{ font-size: 12px !important; white-space: normal !important; }
        .simlit-list-header{ padding: 14px 16px !important; }
        .simlit-list-pagination{ flex-wrap: wrap !important; }
      }
      `;
      document.head.appendChild(style);
    }
  }, []);
};

// ── HELPER COMPONENTS ──────────────────────────────────────────────────────
const Avatar = ({ name = 'A', size = 36, gradient }) => {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: gradient || 'linear-gradient(135deg, #0082CA, #00A8E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,130,202,0.35), inset 0 1px 1px rgba(255,255,255,0.4)' }}>
      <Icon name="person" fill size={size * 0.6} />
    </div>
  );
};

// Ikon outline kustom bertema anggaran/keuangan — dipakai menggantikan
// Material Symbol "payments" di kartu Total Anggaran supaya terasa lebih
// khas & tidak semata icon-font generik. Warna mengikuti `currentColor`,
// jadi otomatis menyesuaikan warna badge (COLORS.accent) tempat ia dipasang.
const IconBudgetOutline = ({ size = 20, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
  >
    {/* bingkai hexagon — motif konsisten dengan identitas visual perusahaan */}
    <polygon points="12,2.6 20.1,7.3 20.1,16.7 12,21.4 3.9,16.7 3.9,7.3" />
    {/* dompet dengan flap terlipat */}
    <path d="M7.6 10.4 9.3 7.6 14.7 7.6 16.4 10.4" />
    <rect x="7.4" y="10.4" width="9.2" height="5.6" rx="1.1" />
    {/* kancing/koin di tengah dompet */}
    <circle cx="12" cy="13.2" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const StatCard = ({ icon, customIcon, label, value, sub, color }) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="simlit-3d-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, padding: '20px 22px',
        border: `1px solid ${theme.cardBorder}`, transition: 'all 0.25s ease', cursor: 'pointer',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `4px solid ${color}`, minWidth: 0,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: `linear-gradient(145deg, ${color}2e, ${color}12)`, color, flexShrink: 0, boxShadow: `0 4px 10px ${color}33, inset 0 1px 1px rgba(255,255,255,0.5)` }}>
          {customIcon ? customIcon : <Icon name={icon} fill size={20} />}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
};

const STATUS_OPTIONS = ['Berjalan', 'Selesai', 'Tertunda', 'Belum Mulai'];

const statusColor = (status) => ({
  'Berjalan': { bg: 'rgba(0,130,202,0.10)', color: '#0082CA' },
  'Selesai': { bg: 'rgba(34,197,94,0.10)', color: '#16a34a' },
  'Tertunda': { bg: 'rgba(255,215,0,0.18)', color: '#8a6d00' },
  'Belum Mulai': { bg: 'rgba(100,116,139,0.10)', color: '#64748B' },
}[status] || { bg: 'rgba(100,116,139,0.10)', color: '#64748B' });

// Cek apakah rentang tanggal kegiatan (mulai–selesai) melingkupi hari ini.
// Tahan terhadap format "YYYY-MM-DD" maupun ISO datetime lengkap.
const isOverlappingToday = (mulai, selesai) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endToday = new Date(today);
  endToday.setHours(23, 59, 59, 999);

  const startDate = new Date(mulai);
  const endDate = new Date(selesai);

  return startDate <= endToday && endDate >= today;
};

const Badge = ({ status }) => {
  const cfg = statusColor(status);
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
      {status || 'Berjalan'}
    </span>
  );
};

// Editable status "badge" — lets the user change status_penelitian directly from the table.
const StatusSelect = ({ value, onChange, disabled }) => {
  const cfg = statusColor(value);

  // Compatibility fix: on iOS Safari / some Android WebViews, a *disabled*
  // <select> ignores appearance:none and paints a native diagonal-stripe
  // "disabled" texture over our custom background, garbling the text.
  // Avoid the native disabled state entirely by rendering a static badge instead.
  if (disabled) {
    return (
      <span style={{
        display: 'inline-block', background: cfg.bg, color: cfg.color,
        borderRadius: 999, padding: '5px 12px', fontSize: 11, fontWeight: 700,
        whiteSpace: 'nowrap', border: `1px solid ${cfg.color}33`,
      }}>
        {value || 'Berjalan'}
      </span>
    );
  }

  return (
    <select
      className="simlit-status-select"
      value={value || 'Berjalan'}
      onClick={e => e.stopPropagation()}
      onChange={e => onChange(e.target.value)}
      style={{
        backgroundColor: cfg.bg,
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='${encodeURIComponent(cfg.color)}' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '10px 6px',
        color: cfg.color, borderRadius: 999, padding: '5px 26px 5px 12px',
        fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${cfg.color}33`,
        cursor: 'pointer', outline: 'none', appearance: 'none',
        WebkitAppearance: 'none', MozAppearance: 'none',
        colorScheme: 'light',
        forcedColorAdjust: 'none',
        WebkitTextFillColor: cfg.color,
      }}>
      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
};

// 3D-style progress bar — glassy gradient fill + top gloss highlight + deep
// inset track shadow, so it reads as an extruded capsule rather than a flat
// bar (mirrors the reference design's rounded gradient progress pill).
const ProgressBar = ({ value, color = COLORS.primary, height = 9 }) => {
  const [width, setWidth] = React.useState(0);
  const safeValue = Math.min(Math.max(value || 0, 0), 100);
  React.useEffect(() => { setTimeout(() => setWidth(safeValue), 100); }, [safeValue]);
  return (
    <div style={{
      position: 'relative', background: 'linear-gradient(180deg, #dbe6fb, #eef3ff)', borderRadius: 99,
      height, overflow: 'hidden', width: '100%',
      boxShadow: 'inset 0 2px 4px rgba(11,28,48,0.20), inset 0 -1px 0 rgba(255,255,255,0.6)',
    }}>
      <div style={{
        position: 'relative', width: `${width}%`, height: '100%',
        background: `linear-gradient(180deg, ${color}ff 0%, ${color}e6 45%, ${color}cc 100%)`,
        borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: `0 1px 3px ${color}88, 0 0 10px ${color}55, inset 0 1px 0 rgba(255,255,255,0.55)`,
      }}>
        {/* glossy highlight strip to fake a cylindrical / 3D bar */}
        <div style={{ position: 'absolute', top: 1, left: 2, right: 2, height: '38%', borderRadius: 99, background: 'linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0))' }} />
      </div>
    </div>
  );
};

const SectionCard = ({ title, children, action, centerTitle }) => (
  <div className="simlit-3d-card" style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, overflow: 'hidden' }}>
    {centerTitle ? (
      // Grid layout with two equal (1fr) side columns keeps the title
      // visually centered at any viewport width — desktop or mobile —
      // without needing separate responsive overrides.
      <div className="simlit-list-header" style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
        <span />
        <span className="simlit-list-title" style={{ fontWeight: 800, fontSize: 13, color: theme.text, textAlign: 'center', whiteSpace: 'nowrap' }}>{title}</span>
        <span style={{ display: 'flex', justifyContent: 'flex-end' }}>{action}</span>
      </div>
    ) : (
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>{title}</span>
        {action}
      </div>
    )}
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = 'primary', size = 'sm', type = 'button', disabled }) => {
  const styles = {
    primary: { background: '#0082CA', color: '#fff', border: 'none', boxShadow: '0 3px 10px rgba(0,130,202,0.25)' },
    secondary: { background: 'rgba(0,130,202,0.08)', color: '#0082CA', border: '1px solid rgba(0,130,202,0.25)' },
    danger: { background: 'rgba(186,26,26,0.08)', color: '#BA1A1A', border: '1px solid rgba(186,26,26,0.25)' },
    success: { background: '#16a34a', color: '#fff', border: 'none' },
    ghost: { background: theme.input, color: theme.text, border: `1px solid ${theme.borderLight}` },
  }[variant];
  const pad = size === 'sm' ? '7px 14px' : '11px 22px';
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...styles, padding: pad, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease', opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
      {children}
    </button>
  );
};

const Input = ({ label, ...props }) => {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: focus ? COLORS.primary : theme.textLabel }}>{label}</label>}
      <input {...props}
        onFocus={e => { setFocus(true); props.onFocus?.(e); }}
        onBlur={e => { setFocus(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 12,
          border: focus ? '1.5px solid #0082CA' : `1.5px solid ${theme.cardBorder}`,
          fontSize: 13, fontFamily: 'inherit', color: theme.text,
          background: '#ffffff80', outline: 'none', boxSizing: 'border-box',
          boxShadow: focus ? '0 0 0 4px rgba(0,130,202,0.12)' : 'none',
          transition: 'all 0.2s ease', ...props.style,
        }} />
    </div>
  );
};

const Select = ({ label, children, ...props }) => {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: focus ? COLORS.primary : theme.textLabel }}>{label}</label>}
      <select {...props}
        onFocus={e => { setFocus(true); props.onFocus?.(e); }}
        onBlur={e => { setFocus(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '11px 14px', borderRadius: 12,
          border: focus ? '1.5px solid #0082CA' : `1.5px solid ${theme.cardBorder}`,
          fontSize: 13, fontFamily: 'inherit', color: theme.text,
          background: theme.selectBg, outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
          boxShadow: focus ? '0 0 0 4px rgba(0,130,202,0.12)' : 'none', transition: 'all 0.2s ease', ...props.style,
        }}>
        {children}
      </select>
    </div>
  );
};

const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 48, gap: 16 }}>
    <div style={{ width: 36, height: 36, border: `3px solid ${theme.spinnerTrack}`, borderTop: '3px solid #0082CA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600, letterSpacing: '0.06em' }}>Memuat data...</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── NAV ITEM (matches sidebar in design system: border-l-4, bg-primary/10 active) ──
const NavItem = ({ icon, label, active, onClick, badge }) => (
  <a
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', cursor: 'pointer',
      fontWeight: active ? 700 : 500, fontSize: 13.5, transition: 'all 0.15s ease',
      background: active ? theme.navActive : 'transparent',
      borderLeft: active ? `4px solid ${theme.navActiveBorder}` : '4px solid transparent',
      color: active ? COLORS.primary : theme.textLabel,
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.navHover; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
    <Icon name={icon} fill={active} />
    <span style={{ flex: 1 }}>{label}</span>
    {badge && <span style={{ background: '#0082CA', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999 }}>{badge}</span>}
  </a>
);

// ── USER MENU (dropdown from header avatar: Profil / Pengaturan / Keluar) ──
const UserMenu = ({ user, onNavigate, onLogout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="simlit-avatar-btn"
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="simlit-user-name-col" style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>{user.name}</div>
          <div style={{ fontSize: 10.5, color: theme.textLabel, fontWeight: 600 }}>NIP: {user.nip || '—'}</div>
        </div>
        <Avatar name={user.name} size={40} />
        <Icon name={open ? 'expand_less' : 'expand_more'} size={18} style={{ color: theme.textLabel }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="simlit-user-menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: 240, zIndex: 100,
              background: theme.card, backdropFilter: 'blur(16px)', borderRadius: 16,
              border: `1px solid ${theme.cardBorder}`,
              boxShadow: '0 20px 44px -12px rgba(11,28,48,0.28), 0 4px 12px rgba(11,28,48,0.10)',
              overflow: 'hidden',
            }}>
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(0,130,202,0.08), rgba(255,215,0,0.08))', borderBottom: `1px solid ${theme.borderLight}` }}>
              <Avatar name={user.name} size={44} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 10.5, color: theme.textLabel }}>NIP: {user.nip || '—'}</div>
              </div>
            </div>
            <div style={{ padding: 6 }}>
              <a className="simlit-menu-item" onClick={() => { setOpen(false); onNavigate('profile'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: theme.text }}>
                <Icon name="person" size={18} style={{ color: '#0082CA' }} /> Profil Saya
              </a>
              <a className="simlit-menu-item" onClick={() => { setOpen(false); onNavigate('settings'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: theme.text }}>
                <Icon name="settings" size={18} style={{ color: '#0082CA' }} /> Pengaturan
              </a>
              <div style={{ height: 1, background: theme.borderLight, margin: '6px 4px' }} />
              <a className="simlit-menu-item" onClick={() => { setOpen(false); onLogout(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: COLORS.danger }}>
                <Icon name="logout" size={18} /> Keluar
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── NOTIFICATION BELL (dropdown berisi kegiatan yang overlap hari ini, lintas semua penelitian) ──
const NotificationBell = ({ dataPenelitian, onOpenPenelitian, onOpenJadwal }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [fetched, setFetched] = useState(false);
  const [jadwalHariIni, setJadwalHariIni] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchJadwalHariIni = async () => {
    setLoading(true);
  
    try {
      // ── Sumber 1: kegiatan penelitian (database) ──────────────────
      const resultsPenelitian = await Promise.all(
        (dataPenelitian || []).map(async (p) => {
          const res = await fetch(`${API}/kegiatan?penelitian_id=${p.id}`);
          const data = await res.json();
          return data
            .filter(k => isOverlappingToday(k.tanggal_mulai, k.tanggal_selesai))
            .map(k => ({
              id: `pen-${k.id}`,
              nama_kegiatan: k.nama_kegiatan,
              nama_penelitian: p.nama_penelitian,
              penelitian_id: p.id,
              source: 'penelitian',
            }));
        })
      );
  
      // ── Sumber 2: kegiatan dari Monitoring Jadwal (Google Sheet) ──
      let jadwalSheet = [];
      try {
        const resSheet = await fetch(SHEET_API_URL);
        if (resSheet.ok) {
          const dataSheet = await resSheet.json();
          jadwalSheet = (dataSheet.kegiatan || [])
          .filter(k => isOverlappingToday(k.tanggal_mulai, k.tanggal_selesai))
          .map(k => ({
            id: `sheet-${k.id}`,
            kegiatan_id: k.id,          // ← id asli untuk navigasi
            nama_kegiatan: k.nama,
            nama_penelitian: k.tempat ? `Monitoring Jadwal · ${k.tempat}` : 'Monitoring Jadwal',
            source: 'sheet',
          }));
        }
      } catch (errSheet) {
        console.log('Gagal memuat jadwal dari sheet:', errSheet);
      }
  
      setJadwalHariIni([...resultsPenelitian.flat(), ...jadwalSheet]);
  
    } catch (err) {
      console.log(err);
      setJadwalHariIni([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);

    if (next) {
        fetchJadwalHariIni();
    }
};

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={handleToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLabel, display: 'flex', position: 'relative' }}>
        <Icon name="notifications" />
        {jadwalHariIni.length > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%',
            background: COLORS.danger, border: '2px solid #fff',
          }} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute', top: 'calc(100% + 12px)', right: -8, width: 320, maxWidth: '90vw', zIndex: 100,
              background: theme.card, backdropFilter: 'blur(16px)', borderRadius: 16,
              border: `1px solid ${theme.cardBorder}`,
              boxShadow: '0 20px 44px -12px rgba(11,28,48,0.28), 0 4px 12px rgba(11,28,48,0.10)',
              overflow: 'hidden',
            }}>
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(0,130,202,0.08), rgba(255,215,0,0.08))', borderBottom: `1px solid ${theme.borderLight}` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>Jadwal Hari Ini</div>
              <div style={{ fontSize: 11, color: theme.textLabel, marginTop: 2, textTransform: 'capitalize' }}>{todayLabel}</div>
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: theme.textLabel, fontSize: 12 }}>Memuat jadwal...</div>
              ) : jadwalHariIni.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: theme.textLabel, fontSize: 12 }}>
                  <Icon name="event_available" size={22} style={{ color: theme.textFaint, marginBottom: 6 }} />
                  <div>Tidak ada kegiatan yang berjalan hari ini.</div>
                </div>
              ) : (
                <div style={{ padding: 6 }}>
                {jadwalHariIni.map((k, idx) => (
                  <a key={k.id ?? idx} className="simlit-menu-item"
                    onClick={() => {
                      setOpen(false);
                      if (k.source === 'sheet') {
                        onOpenJadwal?.(k.kegiatan_id);
                      } else {
                        onOpenPenelitian?.(k.penelitian_id);
                      }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 12px', borderRadius: 10, cursor: 'pointer' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0082CA' }}>{k.nama_kegiatan}</div>
                    <div style={{ fontSize: 11, color: theme.textLabel }}>{k.nama_penelitian}</div>
                  </a>
                ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── LOGIN SCREEN (matches PLN login design) ─────────────────────────────────
const LoginScreen = ({ onLogin, onForgotPassword, onGoRegister }) => {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nip.trim() || !password.trim()) {
      setError('NIP dan Password wajib diisi.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip: nip.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user); // data.user berisi id, nip, nama, role dari backend
      } else {
        setError(data.message || 'NIP atau password salah.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

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
            <h1 style={{ fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800, color: '#0082CA', margin: 0, letterSpacing: '-0.02em' }}>SIMPRO</h1>
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: theme.textLabel, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>Research &amp; Development Management</p>
        </div>

        <div className="simlit-login-card" style={{ background: theme.card, backdropFilter: 'blur(14px)', borderRadius: 24, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 10px 30px -5px rgba(0,96,151,0.10)', padding: '40px 36px', boxSizing: 'border-box' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 38, color: theme.textLabel, display: 'flex' }}><Icon name="person" size={18} /></span>
              <Input label="NIP" type="text" placeholder="Masukkan NIP Anda" value={nip} onChange={e => setNip(e.target.value)} style={{ paddingLeft: 40 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: 38, color: theme.textLabel, display: 'flex' }}><Icon name="lock" size={18} /></span>
              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: 40, paddingRight: 38 }} />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 10, top: 33, background: 'none', border: 'none', cursor: 'pointer', color: theme.textLabel, display: 'flex' }}>
                <Icon name={showPass ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>

            {error && (
              <div style={{ background: theme.errorBg, border: `1px solid ${theme.errorBorder}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: COLORS.danger, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="error" size={16} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.textLabel, fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#0082CA' }} /> Ingat saya
              </label>
              <a onClick={(e) => { e.preventDefault(); onForgotPassword?.(); }}
                  href="#"
                  style={{ color: '#0082CA', fontWeight: 700, textDecoration: 'none', fontSize: 11.5, cursor: 'pointer' }}
              >
                  Lupa Password?
              </a>
            </div>

            <button type="submit" disabled={loading}
              style={{
                background: loading ? theme.input : '#0082CA',
                color: loading ? theme.textLabel : '#fff', border: 'none',
                padding: '15px 0', borderRadius: 12, fontSize: 14, fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 6px 18px rgba(0,130,202,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? 'MEMPROSES...' : <>LOGIN <Icon name="arrow_forward" size={18} /></>}
            </button>
          </form>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20, paddingTop: 20, borderTop: `1px solid ${theme.borderLight}` }}>
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={onGoRegister}
              style={{ background: 'none', border: 'none', color: '#0082CA', fontWeight: 800, cursor: 'pointer', padding: 0 }}
            >
              Buat Akun
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 10.5, color: theme.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          © 2026 PT PLN (Persero) Pusat Penelitian dan Pengembangan
        </p>
      </motion.div>
    </div>
  );
};

// ── PROFILE PAGE ─────────────────────────────────────────────────────────
const ProfilePage = ({ user, onBack, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nama: user.name || user.nama || '',
    no_hp: user.no_hp || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSave = async () => {
    if (!form.nama.trim()) return setMsg({ type: 'error', text: 'Nama lengkap wajib diisi.' });
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Gagal menyimpan profil');
      onUpdateUser({ ...user, name: form.nama, nama: form.nama, no_hp: form.no_hp });
      setIsEditing(false);
      setMsg({ type: 'success', text: 'Profil berhasil diperbarui.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ nama: user.name || user.nama || '', no_hp: user.no_hp || '' });
    setIsEditing(false);
    setMsg(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="simlit-page-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>AKUN SAYA</div>
          <h1 className="simlit-page-title" style={{ fontSize: 22, fontWeight: 600, color: theme.text, margin: 0 }}>Profil Pengguna</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isEditing && <Btn variant="primary" onClick={() => setIsEditing(true)}><Icon name="edit" size={16} /> Edit Profil</Btn>}
          <Btn variant="ghost" onClick={onBack}><Icon name="arrow_back" size={16} /> Kembali</Btn>
        </div>
      </div>

      <div className="simlit-3d-card" style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 20, border: `1px solid ${theme.cardBorder}`, overflow: 'hidden' }}>
        <div style={{ padding: '36px 32px', background: 'linear-gradient(135deg, rgba(0,130,202,0.14), rgba(255,215,0,0.10))', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <Avatar name={form.nama || user.name} size={84} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>{form.nama || user.name}</div>
            <div style={{ fontSize: 13, color: theme.textLabel, fontWeight: 600, marginTop: 4 }}>NIP: {user.nip || '—'}</div>
            <div style={{ marginTop: 10 }}><Badge status="Berjalan" /></div>
          </div>
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {msg && (
            <div style={{
              background: msg.type === 'success' ? 'rgba(34,197,94,0.10)' : theme.errorBg,
              border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : theme.errorBorder}`,
              borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600,
              color: msg.type === 'success' ? '#16a34a' : COLORS.danger,
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
            }}>
              <Icon name={msg.type === 'success' ? 'check_circle' : 'error'} size={16} /> {msg.text}
            </div>
          )}

          {/* Nama Lengkap — editable */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 6px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: theme.textLabel, fontWeight: 600 }}>Nama Lengkap</span>
            {isEditing ? (
              <input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 13, fontWeight: 700, color: theme.text, background: '#fff', textAlign: 'right', minWidth: 220, boxSizing: 'border-box' }} />
            ) : (
              <span style={{ color: theme.text, fontWeight: 700, textAlign: 'right' }}>{user.name}</span>
            )}
          </div>

          {/* NIP — readonly */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 6px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, gap: 12 }}>
            <span style={{ color: theme.textLabel, fontWeight: 600 }}>NIP</span>
            <span style={{ color: theme.text, fontWeight: 700 }}>{user.nip || '—'}</span>
          </div>

          {/* Jabatan — readonly */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 6px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, gap: 12 }}>
            <span style={{ color: theme.textLabel, fontWeight: 600 }}>Jabatan</span>
            <span style={{ color: theme.text, fontWeight: 700 }}>{user.role === 'admin' ? 'Administrator' : (user.role || 'Peneliti')}</span>
          </div>

          {/* No. WhatsApp — editable */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 6px', borderBottom: `1px solid ${theme.border}`, fontSize: 13, gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: theme.textLabel, fontWeight: 600 }}>No. WhatsApp</span>
            {isEditing ? (
              <input type="text" value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })}
                placeholder="cth. 6281234567890"
                style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 13, fontWeight: 700, color: theme.text, background: '#fff', textAlign: 'right', minWidth: 220, boxSizing: 'border-box' }} />
            ) : (
              <span style={{ color: theme.text, fontWeight: 700, textAlign: 'right' }}>{form.no_hp || '—'}</span>
            )}
          </div>

          {/* Status Akun — readonly */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 6px', fontSize: 13, gap: 12 }}>
            <span style={{ color: theme.textLabel, fontWeight: 600 }}>Status Akun</span>
            <span style={{ color: theme.text, fontWeight: 700 }}>Aktif</span>
          </div>

          {isEditing && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={handleCancel} disabled={saving}>Batal</Btn>
              <Btn variant="primary" onClick={handleSave} disabled={saving}>
                <Icon name="save" size={16} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── SETTINGS PAGE (info login + ganti password) ─────────────────────────
const SettingsPage = ({ user, onBack }) => {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!oldPass || !newPass || !confirmPass) return setMsg({ type: 'error', text: 'Semua kolom wajib diisi.' });
    if (newPass.length < 6) return setMsg({ type: 'error', text: 'Password baru minimal 6 karakter.' });
    if (newPass !== confirmPass) return setMsg({ type: 'error', text: 'Konfirmasi password tidak cocok.' });

    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, old_password: oldPass, new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || data.error || 'Gagal mengubah password');
      setMsg({ type: 'success', text: 'Password berhasil diperbarui.' });
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div className="simlit-page-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>AKUN SAYA</div>
          <h1 className="simlit-page-title" style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0 }}>Pengaturan</h1>
        </div>
        <Btn variant="ghost" onClick={onBack}><Icon name="arrow_back" size={16} /> Kembali</Btn>
      </div>

      {/* Info login */}
      <SectionCard title="Informasi Login">
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            ['NIP', user.nip || '—'],
            ['Nama', user.name],
            ['Role', user.role || 'user'],
            ['Terakhir Login', new Date().toLocaleString('id-ID')],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 6px', borderBottom: i < arr.length - 1 ? `1px solid ${theme.border}` : 'none', fontSize: 13 }}>
              <span style={{ color: theme.textLabel, fontWeight: 600 }}>{k}</span>
              <span style={{ color: theme.text, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Ganti password */}
      <SectionCard title="Ganti Password">
        <form onSubmit={handleChangePassword} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
          <Input label="Password Lama" type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="Masukkan password lama" />
          <Input label="Password Baru" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Minimal 6 karakter" />
          <Input label="Konfirmasi Password Baru" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Ulangi password baru" />

          {msg && (
            <div style={{
              background: msg.type === 'success' ? 'rgba(34,197,94,0.10)' : theme.errorBg,
              border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : theme.errorBorder}`,
              borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600,
              color: msg.type === 'success' ? '#16a34a' : COLORS.danger,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Icon name={msg.type === 'success' ? 'check_circle' : 'error'} size={16} /> {msg.text}
            </div>
          )}

          <div>
            <Btn type="submit" variant="primary" size="md" disabled={saving}>
              <Icon name="lock_reset" size={16} /> {saving ? 'Menyimpan...' : 'Simpan Password Baru'}
            </Btn>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};

// ── 3D-STYLE CHART HELPERS ────────────────────────────────────────────────
// Recharts has no native 3D, so depth is faked with layered "shadow" shapes,
// richer multi-stop gradients, and a subtle CSS perspective tilt on the
// chart's container (see .simlit-3d-tilt / .simlit-3d-inner above).
const Chart3DFrame = ({ children, height = 8 }) => (
  <div className="simlit-3d-tilt">
    <div className="simlit-3d-inner" style={{ position: 'relative' }}>
      {children}
      {/* base "floor" shadow to fake extrusion depth */}
      <div style={{ position: 'absolute', left: '4%', right: '4%', bottom: -height, height, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(11,28,48,0.16), transparent 75%)', filter: 'blur(2px)', pointerEvents: 'none' }} />
    </div>
  </div>
);

const renderPie3DShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const RAD = Math.PI / 180;
  const depth = 10;
  const sx = cx + outerRadius * Math.cos(-startAngle * RAD);
  const sy = cy + outerRadius * Math.sin(-startAngle * RAD);
  return (
    <g>
      {/* extruded "side wall" for pseudo-3D depth */}
      <path
        d={`M ${cx - outerRadius},${cy} A ${outerRadius},${outerRadius} 0 0,0 ${cx + outerRadius},${cy} L ${cx + outerRadius},${cy + depth} A ${outerRadius},${outerRadius} 0 0,1 ${cx - outerRadius},${cy + depth} Z`}
        fill={fill} opacity={0.55}
      />
    </g>
  );
};

// ── HELPER: NORMALISASI BOBOT KEGIATAN SECARA PROPORSIONAL ─────────────────
const normalizeBobotProportional = (items) => {
  if (!items || items.length === 0) return items;
  const total = items.reduce((s, r) => s + (Number(r.bobot) || 0), 0);

  if (total <= 0) {
    const equal = Math.round((100 / items.length) * 10) / 10;
    return items.map((r, i) => ({
      ...r,
      bobot: i === items.length - 1 ? Math.round((100 - equal * (items.length - 1)) * 10) / 10 : equal,
    }));
  }

  const scaled = items.map(r => ({ ...r, bobot: Math.round(((Number(r.bobot) || 0) / total) * 1000) / 10 }));
  const sumScaled = scaled.reduce((s, r) => s + r.bobot, 0);
  const diff = Math.round((100 - sumScaled) * 10) / 10;
  scaled[scaled.length - 1].bobot = Math.round((scaled[scaled.length - 1].bobot + diff) * 10) / 10;
  return scaled;
};

// ── KEGIATAN CARD (grid layout for "Progress Kegiatan") ────────────────────
const KegiatanCard = ({ item, index, isEditing, isNew, totalAnggaran, onFieldChange, onDelete, fmtDate, formatRp }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="simlit-3d-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16,
        border: `1px solid ${theme.cardBorder}`, padding: 18,
        display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0,
        transform: hover ? 'translateY(-3px)' : 'translateY(0)', transition: 'all 0.2s ease',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.06em',
          background: 'rgba(0,130,202,0.08)', padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
        }}>
          Kegiatan {index + 1}{isNew ? ' (baru)' : ''}
        </span>
        <button
          type="button"
          onClick={onDelete}
          title="Hapus kegiatan"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, display: 'inline-flex', flexShrink: 0 }}>
          <Icon name="delete" size={16} />
        </button>
      </div>

      {isEditing ? (
        <input
          type="text"
          value={item.nama_kegiatan}
          onChange={e => onFieldChange('nama_kegiatan', e.target.value)}
          placeholder="Nama kegiatan"
          style={{
            padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${theme.cardBorder}`,
            fontSize: 13, fontWeight: 700, color: theme.text, background: '#fff', width: '100%', boxSizing: 'border-box',
          }} />
      ) : (
        <div style={{
          fontSize: 14, fontWeight: 800, color: '#0082CA', lineHeight: 1.3, wordBreak: 'break-word',
          minHeight: 36.4, // ≈ 2 baris pada line-height 1.3 × font-size 14 — menyamakan tinggi judul antar kartu
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.nama_kegiatan || <span style={{ color: theme.textFaint, fontWeight: 600 }}>Tanpa nama</span>}
        </div>
      )}

      {isEditing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={item.tanggal_mulai} onChange={e => onFieldChange('tanggal_mulai', e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 11.5, background: '#fff', color: theme.text, width: '50%', boxSizing: 'border-box' }} />
          <input type="date" value={item.tanggal_selesai} onChange={e => onFieldChange('tanggal_selesai', e.target.value)}
            style={{ padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 11.5, background: '#fff', color: theme.text, width: '50%', boxSizing: 'border-box' }} />
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: theme.textLabel, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="calendar_today" size={13} style={{ color: theme.textFaint }} />
          {fmtDate(item.tanggal_mulai)} – {fmtDate(item.tanggal_selesai)}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Bobot (%)</span>
          <input
            type="number" min="0" max="100" step="0.1"
            value={item.bobot ?? 0}
            onChange={e => onFieldChange('bobot', e.target.value)}
            style={{
              padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`,
              fontSize: 13, fontWeight: 800, color: '#0082CA', background: '#fff', textAlign: 'center', width: '100%', boxSizing: 'border-box',
            }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Progress (%)</span>
          <input
            type="number" min="0" max="100"
            value={item.progress ?? 0}
            onChange={e => onFieldChange('progress', e.target.value)}
            style={{
              padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`,
              fontSize: 13, fontWeight: 800, color: theme.text, background: '#fff', textAlign: 'center', width: '100%', boxSizing: 'border-box',
            }} />
        </div>
      </div>

      {/* ── Anggaran & Realisasi kegiatan — di bawah garis pemisah ── */}
      <div style={{ borderTop: `1px solid ${theme.borderLight}`, paddingTop: 10, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, flexShrink: 0 }}>Total Anggaran</span>
          <input
            type="number" min="0"
            value={item.total_anggaran ?? 0}
            onChange={e => onFieldChange('total_anggaran', e.target.value)}
            style={{
              padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`,
              fontSize: 12, fontWeight: 800, color: theme.text, background: '#fff', textAlign: 'right', width: '55%', boxSizing: 'border-box',
            }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, flexShrink: 0 }}>Realisasi</span>
        <input
          type="number" min="0"
          value={item.realisasi_anggaran ?? 0}
          onChange={e => onFieldChange('realisasi_anggaran', e.target.value)}
          style={{
            padding: '6px 8px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`,
            fontSize: 12, fontWeight: 800, color: '#0082CA', background: '#fff', textAlign: 'right', width: '55%', boxSizing: 'border-box',
          }} />
      </div>
      </div>

      {/* <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, borderTop: `1px solid ${theme.borderLight}`, paddingTop: 10 }}>
        Total Anggaran: <strong style={{ color: theme.text }}>{formatRp(totalAnggaran)}</strong>
      </div> */}
    </div>
  );
};

const KegiatanAddCard = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: `2px dashed ${theme.cardBorder}`, borderRadius: 16, background: 'transparent',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '28px 16px', cursor: 'pointer', color: '#0082CA', minHeight: 160, width: '100%',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,130,202,0.04)'; e.currentTarget.style.borderColor = '#0082CA88'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.cardBorder; }}>
    <Icon name="add_circle" size={28} />
    <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>Klik untuk menambah item kegiatan baru</span>
  </button>
);

// ── CASHFLOW CARD (grid layout for "Rancangan Anggaran / RAB") ─────────────
const CashflowCard = ({ item, index, onDelete, fmtDate, formatRp }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="simlit-3d-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16,
        border: `1px solid ${theme.cardBorder}`, padding: 18,
        display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0,
        transform: hover ? 'translateY(-3px)' : 'translateY(0)', transition: 'all 0.2s ease',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.06em',
          background: 'rgba(0,130,202,0.08)', padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
        }}>
          Transaksi {index + 1}
        </span>
        <button
          type="button"
          onClick={onDelete}
          title="Hapus transaksi"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, display: 'inline-flex', flexShrink: 0 }}>
          <Icon name="delete" size={16} />
        </button>
      </div>

      <div style={{
        fontSize: 14, fontWeight: 800, color: '#0082CA', lineHeight: 1.3, wordBreak: 'break-word',
        minHeight: 36.4, // ≈ 2 baris pada line-height 1.3 × font-size 14 — menyamakan tinggi judul antar kartu
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {item.uraian || <span style={{ color: theme.textFaint, fontWeight: 600 }}>Tanpa uraian</span>}
      </div>

      <div>
        <span style={{
          background: 'rgba(0,130,202,0.08)', color: '#0082CA', padding: '3px 10px', borderRadius: 6,
          fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid rgba(0,130,202,0.2)',
        }}>
          {item.jenis_belanja}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Jumlah</span>
          <div style={{
            padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`,
            fontSize: 13, fontWeight: 800, color: theme.text, background: '#fff', textAlign: 'center',
          }}>
            {item.jumlah || 1}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Harga Satuan</span>
          <div style={{
            padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`,
            fontSize: 12, fontWeight: 800, color: theme.text, background: '#fff', textAlign: 'center', wordBreak: 'break-word',
          }}>
            {item.harga_satuan ? formatRp(item.harga_satuan) : '-'}
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${theme.borderLight}`, paddingTop: 10, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>Total</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>{formatRp(item.nominal)}</span>
      </div>
    </div>
  );
};

// ── CASHFLOW ADD CARD (kartu form untuk transaksi baru, menggantikan baris input di tabel) ──
const CashflowAddCard = ({ draft, onChange, onSave, onCancel }) => (
  <div
    className="simlit-3d-card"
    style={{
      background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16,
      border: '1.5px dashed #0082CA88', padding: 18,
      display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0,
    }}>
    <span style={{
      fontSize: 10, fontWeight: 800, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.06em',
      background: 'rgba(0,130,202,0.08)', padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', alignSelf: 'flex-start',
    }}>
      Transaksi Baru
    </span>

    <input
      type="text"
      placeholder="Uraian / deskripsi"
      value={draft.uraian}
      onChange={e => onChange('uraian', e.target.value)}
      style={{ padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${theme.cardBorder}`, fontSize: 13, fontWeight: 700, color: theme.text, background: '#fff', width: '100%', boxSizing: 'border-box' }} />

    <input
      type="date"
      value={draft.tanggal}
      onChange={e => onChange('tanggal', e.target.value)}
      style={{ padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 11.5, background: '#fff', color: theme.text, width: '100%', boxSizing: 'border-box' }} />

    <input
          type="text"
          placeholder="cth. Bahan & Komponen"
          value={draft.jenis_belanja}
          onChange={e => onChange('jenis_belanja', e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${theme.cardBorder}`, fontSize: 12, background: '#fff', color: theme.text, width: '100%', boxSizing: 'border-box' }} />

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Jumlah</span>
        <input
          type="number" min="1" placeholder="1"
          value={draft.jumlah || ''}
          onChange={e => onChange('jumlah', e.target.value)}
          style={{ padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 13, fontWeight: 800, color: theme.text, background: '#fff', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Harga Satuan</span>
        <input
          type="number" min="0" placeholder="0"
          value={draft.harga_satuan || ''}
          onChange={e => onChange('harga_satuan', e.target.value)}
          style={{ padding: '8px 6px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 12, fontWeight: 800, color: theme.text, background: '#fff', textAlign: 'center', width: '100%', boxSizing: 'border-box' }} />
      </div>
    </div>

    <div style={{ borderTop: `1px solid ${theme.borderLight}`, paddingTop: 10, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>Total</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Rp {Number(draft.nominal || 0).toLocaleString('id-ID')}</span>
    </div>

    <div style={{ display: 'flex', gap: 8 }}>
      <Btn variant="ghost" onClick={onCancel}>Batal</Btn>
      <Btn variant="success" onClick={onSave}>Simpan</Btn>
    </div>
  </div>
);

// ── CASHFLOW ADD PLACEHOLDER (dashed card pemicu, sama gaya dengan KegiatanAddCard) ──
const CashflowAddPlaceholderCard = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      border: `2px dashed ${theme.cardBorder}`, borderRadius: 16, background: 'transparent',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '28px 16px', cursor: 'pointer', color: '#0082CA', minHeight: 160, width: '100%',
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,130,202,0.04)'; e.currentTarget.style.borderColor = '#0082CA88'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = theme.cardBorder; }}>
    <Icon name="add_circle" size={28} />
    <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>Klik untuk menambah item transaksi baru</span>
  </button>
);

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  useDesignFonts();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showDetailPie, setShowDetailPie] = useState(false);
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [jadwalOpenTarget, setJadwalOpenTarget] = useState(null); // { kegiatanId } dari notifikasi sheet
  const [filterTahun, setFilterTahun] = useState('');
  const [selectedBulan, setSelectedBulan] = useState(null);

  const [dataPenelitian, setDataPenelitian] = useState([]);
  const [dashboardProgress, setDashboardProgress] = useState([]);
  const [listKegiatan, setListKegiatan] = useState([]);
  const [listCashflow, setListCashflow] = useState([]);
  const [listRealisasiRAB, setListRealisasiRAB] = useState([]);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [hoveredMiniCard, setHoveredMiniCard] = useState(null);
  const [hoveredInfoRow, setHoveredInfoRow] = useState(null);

  const fetchDashboard = useCallback(async (tahun = '') => {
    if (!user) return;
    setLoadingDashboard(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (tahun) params.append('tahun', tahun);
      params.append('role', user.role || 'user');
      params.append('user_id', user.id || '');

      const [resPenelitian, resProgress] = await Promise.all([
        fetch(`${API}/penelitian?${params.toString()}`),
        fetch(`${API}/dashboard-progress${tahun ? `?tahun=${tahun}` : ''}`)
      ]);
      if (!resPenelitian.ok) throw new Error('Gagal memuat data penelitian');
      if (!resProgress.ok) throw new Error('Gagal memuat data progress');
      const [penelitian, progress] = await Promise.all([resPenelitian.json(), resProgress.json()]);
      setDataPenelitian(penelitian);
      setDashboardProgress(progress);
    } catch (err) { setError(err.message); }
    finally { setLoadingDashboard(false); }
  }, [user]);

  const fetchDetail = useCallback(async (penelitian_id) => {
    setLoadingDetail(true);
    try {
      const [resKegiatan, resCashflow, resRealisasiRAB] = await Promise.all([
        fetch(`${API}/kegiatan?penelitian_id=${penelitian_id}`),
        fetch(`${API}/cashflow?penelitian_id=${penelitian_id}`),
        fetch(`${API}/realisasi-rab?penelitian_id=${penelitian_id}`)
      ]);
      if (!resKegiatan.ok) throw new Error('Gagal memuat kegiatan');
      if (!resCashflow.ok) throw new Error('Gagal memuat cashflow');
      if (!resRealisasiRAB.ok) throw new Error('Gagal memuat realisasi RAB');
      const [kegiatan, cashflow, realisasiRAB] = await Promise.all([
        resKegiatan.json(), resCashflow.json(), resRealisasiRAB.json()
      ]);
      setListKegiatan(kegiatan);
      setListCashflow(cashflow);
      setListRealisasiRAB(realisasiRAB);
    } catch (err) { setError(err.message); }
    finally { setLoadingDetail(false); }
  }, []);

  useEffect(() => { if (user) fetchDashboard(filterTahun); }, [user, fetchDashboard, filterTahun]);
  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId, fetchDetail]);
  useEffect(() => { setSidebarOpen(false); }, [view]);

  // const DETAIL_ITEMS_PER_PAGE = 3;
  const DETAIL_ITEMS_PER_PAGE = 3;
  const CASHFLOW_ITEMS_PER_PAGE = 5; // RAB: 4 kartu data per halaman, kartu "+" di luar hitungan
  const KEGIATAN_ITEMS_PER_PAGE = 5; // Progress Kegiatan: 4 kartu data per halaman, kartu "+" di luar hitungan
  const [kegiatanPage, setKegiatanPage] = useState(0);
  const [cashflowPage, setCashflowPage] = useState(0);

  useEffect(() => { setKegiatanPage(0); }, [selectedId, listKegiatan.length]);
  useEffect(() => { setCashflowPage(0); }, [selectedId, listCashflow.length]);

  const totalKegiatanPages = Math.max(1, Math.ceil(listKegiatan.length / DETAIL_ITEMS_PER_PAGE));
  const pagedKegiatan = listKegiatan.slice(kegiatanPage * DETAIL_ITEMS_PER_PAGE, kegiatanPage * DETAIL_ITEMS_PER_PAGE + DETAIL_ITEMS_PER_PAGE);

  const totalCashflowPages = Math.max(1, Math.ceil(listCashflow.length / CASHFLOW_ITEMS_PER_PAGE));
  const pagedCashflow = listCashflow.slice(cashflowPage * CASHFLOW_ITEMS_PER_PAGE, cashflowPage * CASHFLOW_ITEMS_PER_PAGE + CASHFLOW_ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const total = dataPenelitian.length;
    const avgProgress = total ? Math.round(dataPenelitian.reduce((a, c) => a + (c.progress_rata_rata || 0), 0) / total) : 0;
    const totalAnggaran = dataPenelitian.reduce((a, c) => a + Number(c.total_anggaran || 0), 0);
    const realisasi = dataPenelitian.reduce((a, c) => a + Number(c.realisasi_anggaran || 0), 0);
    return { totalPenelitian: total, rataRataProgress: avgProgress, totalAnggaran, realisasiAnggaran: realisasi };
  }, [dataPenelitian]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [tablePage, setTablePage] = useState(0);
  const ITEMS_PER_PAGE = 3;

  const sortedPenelitian = useMemo(() => {
    const arr = [...dataPenelitian];
    if (!sortConfig.key) return arr;
    const { key, direction } = sortConfig;
    arr.sort((a, b) => {
      let va = a[key], vb = b[key];
      if (key === 'nama_penelitian' || key === 'ketua_penelitian') {
        va = String(va || '').toLowerCase();
        vb = String(vb || '').toLowerCase();
        return direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      va = Number(va) || 0; vb = Number(vb) || 0;
      return direction === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [dataPenelitian, sortConfig]);

  const totalTablePages = Math.max(1, Math.ceil(sortedPenelitian.length / ITEMS_PER_PAGE));

  useEffect(() => { setTablePage(0); }, [dataPenelitian.length, filterTahun, sortConfig]);

  const pagedPenelitian = sortedPenelitian.slice(tablePage * ITEMS_PER_PAGE, tablePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const handleSort = (key) => {
    setSortConfig(prev => prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  };

  const handleUpdateStatus = async (id, status) => {
    const prevData = dataPenelitian;
    setDataPenelitian(prev => prev.map(p => p.id === id ? { ...p, status_penelitian: status } : p));
    try {
      const res = await fetch(`${API}/penelitian/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_penelitian: status }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal update status'); }
    } catch (err) {
      alert('❌ ' + err.message);
      setDataPenelitian(prevData);
    }
  };

  const targetPenelitian = dataPenelitian.find(p => p.id === selectedId);

  const hitungHari = (m, s) => {
    if (!m || !s) return 0;
    const a = new Date(m), b = new Date(s);
    if (isNaN(a) || isNaN(b)) return 0;
    return Math.ceil((b - a) / 86400000) + 1;
  };

  const isMultiTahun = (item) => {
    if (!item?.tanggal_mulai || !item?.tanggal_selesai) return false;
    const ys = new Date(item.tanggal_mulai).getFullYear();
    const ye = new Date(item.tanggal_selesai).getFullYear();
    return Boolean(ys) && Boolean(ye) && ys !== ye;
  };

  const getPieData = () => {
    let berjalan = 0, selesai = 0, tertunda = 0, belumMulai = 0;
    dataPenelitian.forEach(p => {
      if (p.status_penelitian === 'Selesai') selesai++;
      else if (p.status_penelitian === 'Tertunda') tertunda++;
      else if (p.status_penelitian === 'Belum Mulai') belumMulai++;
      else berjalan++;
    });
    return [
      { name: 'Berjalan', value: berjalan, color: COLORS.primary },
      { name: 'Selesai', value: selesai, color: COLORS.success },
      { name: 'Tertunda', value: tertunda, color: COLORS.accent },
      { name: 'Belum Mulai', value: belumMulai, color: COLORS.neutral },
    ].filter(d => d.value > 0);
  };

  const getKurvaSData = () => {
    if (!targetPenelitian?.tanggal_mulai || !targetPenelitian?.tanggal_selesai) return [];

    const bulanShort = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

    const dStart = new Date(targetPenelitian.tanggal_mulai);
    const dEnd = new Date(targetPenelitian.tanggal_selesai);
    if (isNaN(dStart) || isNaN(dEnd)) return [];
    const yStart = dStart.getFullYear(), mStart = dStart.getMonth() + 1;
    const yEnd = dEnd.getFullYear(), mEnd = dEnd.getMonth() + 1;

    if (!yStart || !mStart || !yEnd || !mEnd) return [];

    const startGlobal = yStart * 12 + (mStart - 1);
    const endGlobal = yEnd * 12 + (mEnd - 1);
    const totalMonths = endGlobal - startGlobal + 1;

    if (totalMonths <= 0) return [];

    const MAX_MONTHS = 60;
    const monthsToRender = Math.min(totalMonths, MAX_MONTHS);

    const now = new Date();
    const nowGlobal = now.getFullYear() * 12 + now.getMonth();

    const spanMultiYear = yStart !== yEnd;

    let accRencana = 0;
    let accRealisasi = 0;

    return Array.from({ length: monthsToRender }, (_, idx) => {
      const gi = startGlobal + idx;
      const tahunBulanIni = Math.floor(gi / 12);
      const bulanIni = gi % 12;
      const name = spanMultiYear
        ? `${bulanShort[bulanIni]} '${String(tahunBulanIni).slice(-2)}`
        : bulanShort[bulanIni];

      let rBulan = 0;
      let aBulan = 0;

      listKegiatan.forEach(k => {
        if (!k.tanggal_mulai || !k.tanggal_selesai) return;
        const dM = new Date(k.tanggal_mulai);
        const dS = new Date(k.tanggal_selesai);
        if (isNaN(dM) || isNaN(dS)) return;
        const yM = dM.getFullYear(), mM = dM.getMonth() + 1;
        const yS = dS.getFullYear(), mS = dS.getMonth() + 1;
      
        const gMulaiKegiatan = yM * 12 + (mM - 1);
        const gSelesaiKegiatan = yS * 12 + (mS - 1);
        const totalBulanKegiatan = gSelesaiKegiatan - gMulaiKegiatan + 1;
        const bobot = Number(k.bobot) || 0;

        if (gi >= gMulaiKegiatan && gi <= gSelesaiKegiatan) {
          const bobotPerBulan = bobot / (totalBulanKegiatan || 1);
          rBulan += bobotPerBulan;
          aBulan += bobotPerBulan * ((Number(k.progress) || 0) / 100);
        }
      });

      accRencana += rBulan;
      accRealisasi += aBulan;

      const isPast = gi <= nowGlobal;

      return {
        name,
        rencana: Math.min(Math.round(accRencana), 100),
        realisasi: isPast ? Math.min(Math.round(accRealisasi), 100) : null,
      };
    });
  };

  const kurvaSData = view === 'detail' ? getKurvaSData() : [];
  let kurvaSDeviation = 0;
  for (let i = kurvaSData.length - 1; i >= 0; i--) {
    if (kurvaSData[i].realisasi !== null) { kurvaSDeviation = kurvaSData[i].realisasi - kurvaSData[i].rencana; break; }
  }

  const [isEditingKegiatan, setIsEditingKegiatan] = useState(false);
  const [kegiatanDraft, setKegiatanDraft] = useState([]);
  const [kegiatanBaselineEmpty, setKegiatanBaselineEmpty] = useState(false);
  const [kegiatanDisplayPage, setKegiatanDisplayPage] = useState(0);

  useEffect(() => { setKegiatanDisplayPage(0); }, [selectedId, listKegiatan.length, isEditingKegiatan]);

  const handleTambahBarisKegiatan = () => {
    setKegiatanDraft(prev => {
      const base = isEditingKegiatan ? prev : listKegiatan.map(k => ({ ...k, isNew: false }));
      return [...base, {
        id: null, nama_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '',
        bobot: 0, progress: 0, total_anggaran: 0, realisasi_anggaran: 0, isNew: true,
      }];
    });
    if (!isEditingKegiatan) setKegiatanBaselineEmpty(listKegiatan.length === 0);
    setIsEditingKegiatan(true);
  };

  const handleUbahDraftKegiatan = (idx, field, value) => {
    setKegiatanDraft(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleHapusBarisDraft = (idx) => {
    setKegiatanDraft(prev => (prev[idx]?.isNew ? prev.filter((_, i) => i !== idx) : prev));
  };

  const handleBatalEditKegiatan = () => {
    setIsEditingKegiatan(false);
    setKegiatanDraft([]);
  };

  const totalBobotDraft = kegiatanDraft.reduce((s, r) => s + (Number(r.bobot) || 0), 0);
  const jumlahBarisBaruDraft = kegiatanDraft.filter(r => r.isNew).length;
  const bobotBolehBelumGenap = kegiatanBaselineEmpty && jumlahBarisBaruDraft === 1 && kegiatanDraft.length === 1;
  const bobotDraftValid = bobotBolehBelumGenap || Math.round(totalBobotDraft * 10) / 10 === 100;

  const handleSimpanSemuaKegiatan = async () => {
    for (const r of kegiatanDraft) {
      if (!r.nama_kegiatan?.trim()) return alert('Nama kegiatan tidak boleh kosong!');
      if (!r.tanggal_mulai || !r.tanggal_selesai) return alert('Tanggal wajib diisi!');
    }
    if (!bobotDraftValid) {
      return alert(`Total bobot harus tepat 100% sebelum bisa disimpan (saat ini ${totalBobotDraft.toFixed(1)}%).`);
    }

    setSaving(true);
    try {
      await Promise.all(kegiatanDraft.map(r => {
        const payload = {
          nama_kegiatan: r.nama_kegiatan,
          tanggal_mulai: r.tanggal_mulai,
          tanggal_selesai: r.tanggal_selesai,
          bobot: Number(r.bobot) || 0,
          progress: Number(r.progress) || 0,
          total_anggaran: Number(r.total_anggaran) || 0,
          realisasi_anggaran: Number(r.realisasi_anggaran) || 0,
        };
        if (r.isNew) {
          return fetch(`${API}/kegiatan`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, penelitian_id: selectedId }),
          }).then(async res => { if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Gagal menambah kegiatan'); } });
        }
        return fetch(`${API}/kegiatan/${r.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(async res => { if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Gagal menyimpan kegiatan'); } });
      }));
      setIsEditingKegiatan(false);
      setKegiatanDraft([]);
      await fetchDetail(selectedId);
      fetchDashboard(filterTahun);
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const [deletingPenelitianId, setDeletingPenelitianId] = useState(null);

  const handleHapusPenelitian = async (id, nama) => {
    if (!confirm(`Hapus penelitian "${nama}"? Semua data kegiatan, RAB, dan realisasi terkait akan ikut terhapus permanen. Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingPenelitianId(id);
    try {
      const res = await fetch(`${API}/penelitian/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal menghapus penelitian'); }
      setDataPenelitian(prev => prev.filter(p => p.id !== id));
      if (selectedId === id) { setSelectedId(null); if (view === 'detail') setView('dashboard'); }
      fetchDashboard(filterTahun);
    } catch (err) {
      alert('❌ ' + err.message);
    } finally {
      setDeletingPenelitianId(null);
    }
  };

  const totalBobotKegiatanDetail = listKegiatan.reduce((s, k) => s + (Number(k.bobot) || 0), 0);
  const totalAnggaranKegiatanDetail = listKegiatan.reduce((s, k) => s + (Number(k.total_anggaran) || 0), 0);
  const totalRealisasiKegiatanDetail = listKegiatan.reduce((s, k) => s + (Number(k.realisasi_anggaran) || 0), 0);
  // Total RAB sesungguhnya = SUM seluruh transaksi RAB (listCashflow), bukan
  // jumlah field total_anggaran per kegiatan — dua hal ini independen.
  const totalRABTransaksi = listCashflow.reduce((s, c) => s + (Number(c.nominal) || 0), 0);

  const handleUpdateProgress = async (id, val) => {
    setListKegiatan(prev => prev.map(k => k.id === id ? { ...k, progress: Number(val) } : k));
    try {
      const res = await fetch(`${API}/kegiatan/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: Number(val) }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal update progress'); }
      fetchDashboard(filterTahun);
    } catch (err) { alert('❌ ' + err.message); await fetchDetail(selectedId); }
  };

  const handleUpdateBobot = async (id, val) => {
    setListKegiatan(prev => prev.map(k => k.id === id ? { ...k, bobot: Number(val) } : k));
    try {
      const res = await fetch(`${API}/kegiatan/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bobot: Number(val) }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal update bobot'); }
      fetchDashboard(filterTahun);
    } catch (err) { alert('❌ ' + err.message); await fetchDetail(selectedId); }
  };

  const handleUpdateAnggaranKegiatan = async (id, field, val) => {
    setListKegiatan(prev => prev.map(k => k.id === id ? { ...k, [field]: Number(val) } : k));
    try {
      const res = await fetch(`${API}/kegiatan/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: Number(val) }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || `Gagal update ${field}`); }
      fetchDashboard(filterTahun);
    } catch (err) { alert('❌ ' + err.message); await fetchDetail(selectedId); }
  };

  const handleNormalizeBobot = async () => {
    if (listKegiatan.length === 0) return;
    const normalized = normalizeBobotProportional(listKegiatan);
    const prevKegiatan = listKegiatan;
    setListKegiatan(normalized);
    try {
      await Promise.all(normalized.map(k =>
        fetch(`${API}/kegiatan/${k.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bobot: k.bobot }),
        }).then(async res => {
          if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal update bobot'); }
        })
      ));
      fetchDashboard(filterTahun);
    } catch (err) {
      alert('❌ Gagal menyamakan bobot ke 100%: ' + err.message);
      setListKegiatan(prevKegiatan);
      await fetchDetail(selectedId);
    }
  };

  const handleHapusKegiatan = async (id) => {
    if (!confirm('Hapus kegiatan ini?')) return;
    try {
      const res = await fetch(`${API}/kegiatan/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal menghapus kegiatan'); }
      await fetchDetail(selectedId);
    } catch (err) { alert('❌ ' + err.message); }
  };

  const [cashflowBaru, setCashflowBaru] = useState({ tanggal: '', uraian: '', jenis_belanja: 'Alat', nominal: 0 });
  const [isAddingCashflow, setIsAddingCashflow] = useState(false);

  const handleSaveCashflow = async () => {
    if (!cashflowBaru.tanggal || !cashflowBaru.uraian) return alert('Tanggal dan Uraian wajib diisi!');
    try {
      const res = await fetch(`${API}/cashflow`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...cashflowBaru, penelitian_id: selectedId }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal menyimpan transaksi'); }
  
      const newIndexPage = Math.floor(listCashflow.length / CASHFLOW_ITEMS_PER_PAGE);
  
      setCashflowBaru({ tanggal: '', uraian: '', jenis_belanja: 'Alat', nominal: 0 });
      setIsAddingCashflow(false);
      await fetchDetail(selectedId);
      fetchDashboard(filterTahun);
  
      setCashflowPage(newIndexPage);
    } catch (err) { alert('❌ ' + err.message); }
  };

  const handleHapusCashflow = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      const res = await fetch(`${API}/cashflow/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal menghapus transaksi'); }
      await fetchDetail(selectedId);
      fetchDashboard(filterTahun);
    } catch (err) { alert('❌ ' + err.message); }
  };

  const handleAddRealisasiRAB = async (entry) => {
    const res = await fetch(`${API}/realisasi-rab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, penelitian_id: selectedId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menyimpan realisasi RAB');
    await fetchDetail(selectedId);
  };
  
  const handleHapusRealisasiRAB = async (id) => {
    const res = await fetch(`${API}/realisasi-rab/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menghapus realisasi RAB');
    await fetchDetail(selectedId);
  };

  const [formData, setFormData] = useState({
    nama_penelitian: '', kode_penelitian: '', ketua_penelitian: '', unit_kerja: '', tanggal_mulai: '',
    tanggal_selesai: '', durasi_bulan: 7, bidang_penelitian: '', skema_penelitian: '',
    sumber_pendanaan: '', tahun_anggaran: 2025, total_anggaran: 0,
  });
  const [rincianRab, setRincianRab] = useState([{ tanggal: '', uraian: '', jenis_belanja: 'Alat', jumlah: 1, harga_satuan: 0, nominal: 0 }]);
  const [rincianKegiatan, setRincianKegiatan] = useState([{ nama_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '', bobot: 0, progress: 0, total_anggaran: 0, realisasi_anggaran: 0 }]);

  const handleRabChange = (index, field, value) => {
    const updated = [...rincianRab];
    updated[index][field] = (field === 'nominal' || field === 'jumlah' || field === 'harga_satuan') ? Number(value) : value;
    if (field === 'jumlah' || field === 'harga_satuan') {
      updated[index].nominal = (Number(updated[index].jumlah) || 0) * (Number(updated[index].harga_satuan) || 0);
    }
    setRincianRab(updated);
    setFormData(p => ({ ...p, total_anggaran: updated.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0) }));
  };

  const handleKegiatanChange = (index, field, value) => {
    const updated = [...rincianKegiatan];
    updated[index][field] = value;
    setRincianKegiatan(updated);
  };

  const totalBobotKegiatan = rincianKegiatan.reduce((s, r) => s + (Number(r.bobot) || 0), 0);
  const weightedProgressAwal = rincianKegiatan.reduce((s, r) => s + ((Number(r.bobot) || 0) * (Number(r.progress) || 0) / 100), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Math.round(totalBobotKegiatan * 10) / 10 !== 100) {
      if (!confirm(`Total bobot kegiatan saat ini ${totalBobotKegiatan.toFixed(1)}%, tidak sama dengan 100%. Tetap simpan?`)) return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/penelitian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rincian_rab: rincianRab,
          kegiatan: rincianKegiatan.map(k => ({
            ...k,
            bobot: Number(k.bobot) || 0,
            progress: Number(k.progress) || 0,
            total_anggaran: Number(k.total_anggaran) || 0,
            realisasi_anggaran: Number(k.realisasi_anggaran) || 0,
          })),
          progress_rata_rata: Math.round(weightedProgressAwal),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan penelitian');
      alert(`✅ ${data.message}`);
      setFormData({ nama_penelitian: '', kode_penelitian: '', ketua_penelitian: '', unit_kerja: '', tanggal_mulai: '', tanggal_selesai: '', durasi_bulan: 7, bidang_penelitian: '', skema_penelitian: '', sumber_pendanaan: '', tahun_anggaran: 2025, total_anggaran: 0 });
      setRincianRab([{ tanggal: '', uraian: '', jenis_belanja: 'Alat', jumlah: 1, harga_satuan: 0, nominal: 0 }]);
      setRincianKegiatan([{ nama_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '', bobot: 0, progress: 0, total_anggaran: 0, realisasi_anggaran: 0 }]);
      await fetchDashboard(filterTahun);
      setView('dashboard');
    } catch (err) { alert('❌ ' + err.message); }
    finally { setSaving(false); }
  };

  const hitungDurasiBulan = (mulai, selesai) => {
    if (!mulai || !selesai) return 0;
    const a = new Date(mulai), b = new Date(selesai);
    if (isNaN(a) || isNaN(b)) return 0;
    let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate()) months -= 1;
    return Math.max(months, 0);
  };

  const formatRp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
  const fmtDate = (s) => {
    if (!s) return '-';
    // Terima baik format "YYYY-MM-DD" polos maupun ISO datetime lengkap "YYYY-MM-DDTHH:mm:ss.sssZ"
    const d = new Date(s);
    if (isNaN(d)) return s; // benar-benar bukan tanggal valid → tampilkan apa adanya
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${String(d.getDate()).padStart(2,'0')} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  };

  // ── INLINE STYLES ──────────────────────────────────────────────────────
  const inlineInput = { padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 12, background: '#fff', color: theme.text, boxSizing: 'border-box' };
  const inlineSelect = { padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 12, background: theme.selectBg, color: theme.text, width: '100%' };
  const thStyle = { padding: '12px 14px', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#eff4ff' };
  const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: 12 };
  const tooltipStyle = { contentStyle: { borderRadius: 12, border: `1px solid ${theme.cardBorder}`, background: theme.tooltipBg, color: theme.text, fontSize: 12, backdropFilter: 'blur(16px)' } };
  const axisLabelStyle = { fontSize: 11, fontWeight: 700, fill: theme.textLabel };

  // ── GATE: LOGIN / LUPA PASSWORD ──────────────────────────────────────────
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot-password'

  // SESUDAH
  if (!user) {
      if (authView === 'forgot-password') {
          return <ForgotPassword onBack={() => setAuthView('login')} onSuccess={() => setAuthView('login')} />;
      }
      if (authView === 'register') {
          return <Register onBackToLogin={() => setAuthView('login')} />;
      }
      return (
        <LoginScreen
          onLogin={(u) => setUser(u)}
          onForgotPassword={() => setAuthView('forgot-password')}
          onGoRegister={() => setAuthView('register')}
        />
      );
  }
  
  const pageTitle = view === 'dashboard' ? 'Dashboard Monitoring'
  : view === 'tambah' ? 'Tambah Penelitian'
  : view === 'kurvas' ? 'Analisis Kurva S'
  : view === 'kurvas-fisik' ? 'Detail Kurva S'
  : view === 'profile' ? 'Profil Saya'
  : view === 'settings' ? 'Pengaturan'
  : 'Detail Kegiatan & Anggaran';

  const kurvaSDataForChart = getKurvaSData();
  const kurvaSXAxisAngled = kurvaSDataForChart.length > 12;

  const kegiatanTampil = isEditingKegiatan ? kegiatanDraft : listKegiatan;
  const totalBobotTampil = isEditingKegiatan ? totalBobotDraft : totalBobotKegiatanDetail;
  
  const totalKegiatanDisplayPages = Math.max(1, Math.ceil(kegiatanTampil.length / KEGIATAN_ITEMS_PER_PAGE));
  const pagedKegiatanTampil = kegiatanTampil.slice(
    kegiatanDisplayPage * KEGIATAN_ITEMS_PER_PAGE,
    kegiatanDisplayPage * KEGIATAN_ITEMS_PER_PAGE + KEGIATAN_ITEMS_PER_PAGE
  );

  const getBreadcrumbs = () => {
    const goDashboard = () => setView('dashboard');
    const goDetail = () => { if (selectedId) setView('detail'); };
  
    switch (view) {
      case 'dashboard':
        return [{ label: 'Dashboard' }];
      case 'tambah':
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Tambah Penelitian' },
        ];
      case 'detail':
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Detail Penelitian' },
        ];
      case 'kurvas':
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Detail Penelitian', onClick: goDetail },
          { label: 'Analisis Kurva S' },
        ];
      case 'kurvas-fisik':
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Detail Penelitian', onClick: goDetail },
          { label: 'Detail Kurva S' },
        ];
      case 'profile':
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Profil Saya' },
        ];
      case 'settings':
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Pengaturan' },
        ];
      case 'jadwal':
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Monitoring Jadwal' },
        ];
      case 'monitoring-penelitian':                       // ← tambahkan blok ini
        return [
          { label: 'Dashboard', onClick: goDashboard },
          { label: 'Monitoring Penelitian' },
        ];
      default:
        return [{ label: 'Dashboard', onClick: goDashboard }, { label: pageTitle }];
    }
  };
  
  const breadcrumbs = getBreadcrumbs();
  
  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%', fontFamily: "'Inter', sans-serif", color: theme.text, background: theme.bg }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: theme.bgGradient }} />

      {/* MOBILE OVERLAY */}
      {sidebarOpen && <div className="simlit-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR (fixed 260px desktop, slide-in drawer on mobile) ── */}
      <aside className={`simlit-sidebar${sidebarOpen ? ' simlit-open' : ''}`} style={{
        position: 'fixed', left: 0, top: 0, height: '100%', width: 260, zIndex: 50,
        background: theme.sidebar, borderRight: `1px solid ${theme.sidebarBorder}`,
        boxShadow: '2px 0 12px rgba(11,28,48,0.04)',
        display: 'flex', flexDirection: 'column', paddingTop: 24, paddingBottom: 24,
      }}>
        <div style={{ padding: '0 24px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#fff', border: `1px solid ${theme.borderLight}` }}>
            <img src={logoPLN} alt="Logo PLN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 600, color: '#16a34a', margin: 0, lineHeight: 1.2, letterSpacing: '0.01em', textAlign: '-webkit-left' }}>SIMPRO</h1>
            <p style={{ fontSize: 10, color: theme.textLabel, margin: 0 }}>Research Portal</p>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem icon="dashboard" label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon="biotech" label="Tambah Penelitian" active={view === 'tambah'} onClick={() => setView('tambah')} />
          {view === 'detail' && <NavItem icon="description" label="Detail Penelitian" active onClick={() => {}} />}
          {view === 'kurvas-fisik' && <NavItem icon="query_stats" label="Detail Kurva S" active onClick={() => {}} />}
          <div style={{ height: 1, background: theme.borderLight, margin: '12px 24px' }} />
          <NavItem icon="event_available" label="Monitoring Jadwal" active={view === 'jadwal'} onClick={() => setView('jadwal')} />
          <NavItem icon="science" label="Monitoring Penelitian" active={view === 'monitoring-penelitian'} onClick={() => setView('monitoring-penelitian')} />
          {view === 'rab' && <RABActivityCards />}
        </nav>

        <div style={{ padding: '12px 24px 0' }}>
          <div style={{ height: 1, background: theme.borderLight, marginBottom: 12 }} />
            <a
            className="simlit-menu-item"
            onClick={() => { if (confirm('Yakin ingin keluar?')) setUser(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
              cursor: 'pointer', fontWeight: 700, fontSize: 13.5,
              color: COLORS.danger, borderRadius: 10,
            }}
          >
            <Icon name="logout" size={20} />
            <span>Keluar</span>
          </a>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="simlit-main" style={{ marginLeft: 260, position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', width: 'auto' }}>

        {/* TOP BAR */}
        <header className="simlit-header" style={{
          position: 'sticky', top: 0, zIndex: 40, background: theme.header, backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${theme.sidebarBorder}`, padding: '0 32px', height: 68,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button className="simlit-hamburger" onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: theme.text, flexShrink: 0, padding: 4 }}>
              <Icon name="menu" size={24} />
            </button>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              const clickable = !isLast && !!crumb.onClick;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <Icon name="chevron_right" size={16} className="simlit-header-crumb" style={{ color: '#0082CA', flexShrink: 0 }} />
                  )}
                  <span
                    className={isLast ? undefined : 'simlit-header-crumb'}
                    onClick={clickable ? crumb.onClick : undefined}
                    style={{
                      fontSize: isLast ? 13.5 : 12,
                      fontWeight: isLast ? 800 : 600,
                      color: isLast ? theme.text : (clickable ? '#0082CA' : theme.textLabel),
                      cursor: clickable ? 'pointer' : 'default',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={e => { if (clickable) e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
                  >
                    {crumb.label}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <NotificationBell
              dataPenelitian={dataPenelitian}
              onOpenPenelitian={(id) => { setSelectedId(id); setView('detail'); }}
              onOpenJadwal={(kegiatanId) => {
                setJadwalOpenTarget({ kegiatanId });
                setView('jadwal');
              }}
            />
            <div className="simlit-user-name-col" style={{ width: 1, height: 30, background: theme.borderLight }} />
            <UserMenu user={user} onNavigate={setView} onLogout={() => setUser(null)} />
          </div>
        </header>

        {/* ERROR BANNER */}
        {error && (
          <div style={{ background: theme.errorBg, border: `1px solid ${theme.errorBorder}`, borderRadius: 12, margin: '16px 32px 0', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: COLORS.danger, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="error" size={18} /> {error}</span>
            <button onClick={() => { setError(null); fetchDashboard(filterTahun); }} style={{ background: 'rgba(186,26,26,0.10)', color: COLORS.danger, border: `1px solid rgba(186,26,26,0.3)`, padding: '4px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Coba Lagi</button>
          </div>
        )}

        {/* SCROLL BODY */}
        <div className="simlit-body-pad" style={{ flex: 1, padding: '32px 32px 48px', minWidth: 0 }}>

          {/* ── VIEW: PROFILE ── */}
          {view === 'profile' && (
            <ProfilePage
              user={user}
              onBack={() => setView('dashboard')}
              onUpdateUser={(updatedUser) => setUser(updatedUser)}
            />
          )}

          {/* ── VIEW: SETTINGS ── */}
          {view === 'settings' && <SettingsPage user={user} onBack={() => setView('dashboard')} />}

          {/* ── VIEW: DASHBOARD ── */}
          {view === 'dashboard' && (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

              <div className="simlit-page-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, textAlign: '-webkit-left' }}>OVERVIEW</div>
                  <h1 className="simlit-page-title" style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: '-0.01em', textAlign: '-webkit-left'}}>Dashboard Penelitian</h1>
                  <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0', fontWeight: 500, textAlign: '-webkit-left' }}>Monitoring progress, anggaran, dan status penelitian secara menyeluruh.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: theme.textLabel, fontWeight: 700 }}>Tahun</span>
                  <select value={filterTahun} onChange={e => setFilterTahun(e.target.value)}
                    style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${theme.cardBorder}`, fontSize: 13, fontWeight: 700, color: theme.text, background: '#fff', outline: 'none', cursor: 'pointer' }}>
                    <option value="">Semua</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
              </div>

              {loadingDashboard ? <Spinner /> : (
                <>
                  <div className="simlit-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
                    <StatCard icon="folder" label="Total Penelitian" value={stats.totalPenelitian} sub="Data dari database" color={COLORS.primary} />
                    <StatCard icon="trending_up" label="Rata-rata Progress" value={`${stats.rataRataProgress}%`} sub="Update real-time" color={COLORS.success} />
                    <StatCard customIcon={<IconBudgetOutline size={20} />} label="Total Anggaran" value={`Rp ${(stats.totalAnggaran / 1e9).toFixed(2)}M`} sub={formatRp(stats.totalAnggaran)} color={COLORS.accent === '#FFD700' ? '#b8930a' : COLORS.accent} />
                    <StatCard icon="account_balance_wallet" label="Realisasi Anggaran" value={`Rp ${(stats.realisasiAnggaran / 1e9).toFixed(2)}M`} sub={`${stats.totalAnggaran > 0 ? Math.round((stats.realisasiAnggaran / stats.totalAnggaran) * 100) : 0}% dari anggaran`} color={COLORS.info} />
                  </div>

                  <div className="simlit-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                    {/* AREA CHART — restyled with a 3D perspective tilt + richer gradient + floor shadow */}
                    <div className="simlit-3d-card" style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: '26px 26px 34px', minWidth: 0 }}>
                      <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Rata-rata Progress Penelitian</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Akumulasi progress bulanan dari database</div>
                      </div>

                      {selectedBulan && (() => {
                        const bulanMap = { 'Jan':0,'Feb':1,'Mar':2,'Apr':3,'Mei':4,'Jun':5,'Jul':6,'Agu':7,'Sep':8,'Okt':9,'Nov':10,'Des':11 };
                        const targetIndex = bulanMap[selectedBulan];
                        const proyekRunning = dataPenelitian.filter(p => {
                          if (!p.tanggal_mulai || !p.tanggal_selesai) return p.status_penelitian === 'Berjalan';
                          const startDate = new Date(p.tanggal_mulai);
                          const endDate = new Date(p.tanggal_selesai);
                          const targetYear = startDate.getFullYear();
                          const targetMonthStart = new Date(targetYear, targetIndex, 1);
                          const targetMonthEnd = new Date(targetYear, targetIndex + 1, 0);
                          return startDate <= targetMonthEnd && endDate >= targetMonthStart && p.status_penelitian === 'Berjalan';
                        });
                        return (
                          <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
                            style={{ background: 'rgba(0,130,202,0.06)', border: '1px solid rgba(0,130,202,0.18)', borderRadius: 14, padding: 16, marginBottom: 22 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Icon name="bolt" size={16} style={{ color: '#0082CA' }} /> Proyek Running pada Bulan <span style={{ color: '#8a6d00' }}>{selectedBulan}</span> ({proyekRunning.length} Total)
                              </div>
                              <button onClick={() => setSelectedBulan(null)} style={{ background: 'transparent', border: 'none', color: theme.textLabel, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Tutup ✕</button>
                            </div>
                            {proyekRunning.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {proyekRunning.map((proyek, idx) => (
                                  <div key={proyek.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: 10, border: `1px solid ${theme.border}`, flexWrap: 'wrap', gap: 6 }}>
                                    <div>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{proyek.judul_penelitian}</div>
                                      <div style={{ fontSize: 11, color: theme.textLabel }}>{proyek.ketua_penelitian} • {proyek.bidang_penelitian || 'Ketenagalistrikan'}</div>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0082CA' }}>{proyek.progress_rata_rata || proyek.progress || 0}%</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: theme.textLabel, textAlign: 'center', padding: '10px 0' }}>Tidak ada proyek yang aktif berjalan khusus di bulan ini.</div>
                            )}
                          </motion.div>
                        );
                      })()}

                      <Chart3DFrame height={10}>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart 
                            data={dashboardProgress} 
                            margin={{ top: 5, right: 25, left: 20, bottom: 45 }}
                            onClick={(data) => { if (data?.activeLabel) setSelectedBulan(prev => prev === data.activeLabel ? null : data.activeLabel); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <defs>
                              <linearGradient id="gradProgress" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0082CA" stopOpacity={0.55} />
                                <stop offset="45%" stopColor="#0082CA" stopOpacity={0.22} />
                                <stop offset="100%" stopColor="#0082CA" stopOpacity={0.02} />
                              </linearGradient>
                              <linearGradient id="gradProgressLine" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#0060A6" />
                                <stop offset="100%" stopColor="#00A8E8" />
                              </linearGradient>
                              <filter id="lineShadow" x="-20%" y="-40%" width="140%" height="200%">
                                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#0082CA" floodOpacity="0.35" />
                              </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tickMargin={10} 
                              height={35}
                              style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }}
                              label={{ value: 'Bulan', position: 'insideBottom', offset: -12, style: axisLabelStyle }} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tickMargin={10} 
                              width={65} 
                              style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} 
                              domain={[0, 100]} 
                              unit="%"
                              label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft', offset: -10, style: { ...axisLabelStyle, textAnchor: 'middle' } }} 
                            />
                            <Tooltip {...tooltipStyle} />
                            <Area type="monotone" dataKey="progress" stroke="url(#gradProgressLine)" strokeWidth={3.5} fill="url(#gradProgress)" filter="url(#lineShadow)" dot={{ r: 5, fill: '#0082CA', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} connectNulls />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Chart3DFrame>
                    </div>

                    {/* PIE CHART — restyled as a pseudo-3D donut (extruded rim + tilt) */}
                    <div style={{ position: 'relative', width: '100%', minHeight: 320, flex: 1, minWidth: 0 }}>
                      <AnimatePresence mode="wait">
                        {!showDetailPie ? (
                          <motion.div key="pie-chart-panel"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            onClick={() => getPieData().length > 0 && setShowDetailPie(true)}
                            className="simlit-3d-card"
                            style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: '26px 26px 30px', cursor: getPieData().length > 0 ? 'pointer' : 'default', height: '100%', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Status Penelitian</div>
                              {getPieData().length > 0 && <span style={{ fontSize: 10, color: '#0082CA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Klik Detail ↗</span>}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 14 }}>Distribusi status aktif tiap penelitian (proporsi jumlah proyek per status)</div>
                            <Chart3DFrame height={8}>
                              <ResponsiveContainer width="100%" height={232}>
                                <PieChart margin={{ top: 12, right: 12, bottom: 0, left: 12 }}>
                                  <defs>
                                    {getPieData().map((entry, i) => (
                                      <radialGradient id={`pieGrad-${i}`} key={i} cx="35%" cy="35%" r="75%">
                                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.72} />
                                      </radialGradient>
                                    ))}
                                    <filter id="pieShadow" x="-30%" y="-30%" width="160%" height="180%">
                                      <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0B1C30" floodOpacity="0.22" />
                                    </filter>
                                  </defs>
                                  <Pie data={getPieData()} cx="50%" cy="50%" innerRadius={54} outerRadius={80} paddingAngle={5} dataKey="value" filter="url(#pieShadow)" stroke="#fff" strokeWidth={2}>
                                    {getPieData().map((entry, i) => <Cell key={i} fill={`url(#pieGrad-${i})`} />)}
                                  </Pie>
                                  <Tooltip {...tooltipStyle} />
                                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 14 }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </Chart3DFrame>
                          </motion.div>
                        ) : (
                          <motion.div key="pie-detail-panel"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            className="simlit-3d-card"
                            style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(0,130,202,0.25)', padding: 24, height: '100%', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Persentase Kontribusi</div>
                                <div style={{ fontSize: 11, color: theme.textLabel }}>Total: {dataPenelitian.length} Proyek</div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setShowDetailPie(false); }}
                                style={{ background: theme.input, border: `1px solid ${theme.cardBorder}`, color: theme.text, padding: '5px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                ✕ Kembali
                              </button>
                            </div>
                            <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              {getPieData().map((item, index) => {
                                const totalNilai = getPieData().reduce((sum, d) => sum + d.value, 0);
                                const persen = totalNilai > 0 ? Math.round((item.value / totalNilai) * 100) : 0;
                                return (
                                  <motion.div key={index} variants={{ initial: { opacity: 0, x: -15 }, animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } } }} style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                                      <span style={{ color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />{item.name}
                                      </span>
                                      <span style={{ color: theme.text }}>{item.value} Proyek ({persen}%)</span>
                                    </div>
                                    <div style={{ width: '100%', height: 8, background: '#e5eeff', borderRadius: 99, overflow: 'hidden' }}>
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${persen}%` }} transition={{ delay: 0.1 + index * 0.08, duration: 0.7, ease: "easeOut" }}
                                        style={{ height: '100%', background: item.color, borderRadius: 99 }} />
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* TABLE — centered title + "+" shortcut to Tambah Penelitian, sortable
                      columns, and pagination limited to 3 rows with prev/next arrows */}
                  <SectionCard
                    centerTitle
                    title={`Daftar Penelitian (${dataPenelitian.length} total)`}
                    action={
                      <button
                        onClick={() => setView('tambah')}
                        title="Tambah Penelitian"
                        style={{
                          width: 34, height: 34, borderRadius: 10, border: 'none', cursor: 'pointer',
                          background: '#0082CA', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,130,202,0.35)', flexShrink: 0, transition: 'transform .15s ease',
                        }}
                        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                        <Icon name="add" size={20} />
                      </button>
                    }>
                    {dataPenelitian.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>Belum ada data penelitian.</div>
                    ) : (
                      <>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: `2px solid #0082CA` }}>
                                {[
                                  { label: 'No', key: null },
                                  { label: 'Judul Penelitian', key: 'nama_penelitian' },
                                  { label: 'Ketua Peneliti', key: 'ketua_penelitian' },
                                  { label: 'Progress', key: 'progress_rata_rata' },
                                  { label: 'Anggaran', key: 'total_anggaran' },
                                  { label: 'Status', key: null },
                                  { label: '', key: null },
                                ].map((h) => (
                                  <th key={h.label || 'aksi'}
                                    onClick={() => h.key && handleSort(h.key)}
                                    style={{ ...thStyle, textAlign: 'center', cursor: h.key ? 'pointer' : 'default', userSelect: 'none' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center', color: sortConfig.key === h.key && h.key ? '#0082CA' : thStyle.color }}>
                                      {h.label}
                                      {h.key && (
                                        <Icon
                                          name={sortConfig.key === h.key ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}
                                          size={13}
                                        />
                                      )}
                                    </span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {pagedPenelitian.map((item, i) => {
                                const rowNumber = tablePage * ITEMS_PER_PAGE + i + 1;
                                return (
                                  <tr key={item.id}
                                    onMouseEnter={e => { e.currentTarget.style.background = theme.rowHover; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: theme.textFaint, fontSize: 12 }}>{String(rowNumber).padStart(2, '0')}</td>
                                    <td style={{ ...tdStyle, maxWidth: 320, textAlign: 'left' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <span 
                                        style={{ fontWeight: 700, color: '#0082CA', cursor: 'pointer', fontSize: 13, textAlign: 'justify' }} 
                                        onClick={() => { setSelectedId(item.id); setView('detail'); }}
                                      >
                                        {item.nama_penelitian}
                                      </span>
                                      
                                      {isMultiTahun(item) && (
                                        <span 
                                          title="Proyek ini melintasi lebih dari satu tahun anggaran, sehingga akan muncul di setiap tahun yang dilaluinya."
                                          style={{ 
                                            background: '#F1F5F9', 
                                            color: '#475569', 
                                            padding: '1px 6px', 
                                            borderRadius: 4, 
                                            fontSize: '9px', 
                                            fontWeight: 600, 
                                            letterSpacing: '0.3px',
                                            whiteSpace: 'nowrap', 
                                            border: '1px solid #E2E8F0',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            height: 'fit-content'
                                          }}
                                        >
                                          Multi-Tahun {new Date(item.tanggal_mulai).getFullYear()}–{new Date(item.tanggal_selesai).getFullYear()}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: theme.textLabel, marginTop: 4 }}>
                                      {item.bidang_penelitian} · {item.kode_penelitian}
                                    </div>
                                  </td>
                                    <td style={{ ...tdStyle, color: theme.textMuted, fontWeight: 600 }}>{item.ketua_penelitian}</td>
                                    <td style={{ ...tdStyle, minWidth: 140 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ flex: 1 }}><ProgressBar value={item.progress_rata_rata} /></div>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0082CA', minWidth: 32 }}>{item.progress_rata_rata}%</span>
                                      </div>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>{formatRp(item.total_anggaran)}</td>
                                    <td style={tdStyle}>
                                      <StatusSelect value={item.status_penelitian} onChange={(val) => handleUpdateStatus(item.id, val)} />
                                    </td>
                                    <td style={tdStyle}>
                                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                        <Btn variant="secondary" onClick={() => { setSelectedId(item.id); setView('detail'); }}>Detail <Icon name="arrow_forward" size={14} /></Btn>
                                        <button
                                          onClick={() => handleHapusPenelitian(item.id, item.nama_penelitian)}
                                          disabled={deletingPenelitianId === item.id}
                                          title="Hapus penelitian"
                                          style={{ background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.25)', borderRadius: 10, padding: '7px 10px', cursor: deletingPenelitianId === item.id ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', opacity: deletingPenelitianId === item.id ? 0.5 : 1 }}>
                                          <Icon name="delete" size={15} style={{ color: '#BA1A1A' }} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* PAGINATION — 3 baris per halaman, navigasi dengan panah kecil */}
                        {dataPenelitian.length > ITEMS_PER_PAGE && (
                          <div className="simlit-list-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: `1px solid ${theme.borderLight}` }}>
                            <button
                              onClick={() => setTablePage(p => Math.max(0, p - 1))}
                              disabled={tablePage === 0}
                              style={{
                                width: 30, height: 30, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                                background: tablePage === 0 ? theme.input : '#fff', color: tablePage === 0 ? theme.textFaint : '#0082CA',
                                cursor: tablePage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: tablePage === 0 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease',
                              }}>
                              <Icon name="chevron_left" size={18} />
                            </button>
                            <span style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                              Menampilkan {tablePage * ITEMS_PER_PAGE + 1}-{Math.min((tablePage + 1) * ITEMS_PER_PAGE, dataPenelitian.length)} dari {dataPenelitian.length} entri
                            </span>
                            <button
                              onClick={() => setTablePage(p => Math.min(totalTablePages - 1, p + 1))}
                              disabled={tablePage >= totalTablePages - 1}
                              style={{
                                width: 30, height: 30, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                                background: tablePage >= totalTablePages - 1 ? theme.input : '#fff', color: tablePage >= totalTablePages - 1 ? theme.textFaint : '#0082CA',
                                cursor: tablePage >= totalTablePages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: tablePage >= totalTablePages - 1 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease',
                              }}>
                              <Icon name="chevron_right" size={18} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </SectionCard>
                </>
              )}
            </div>
          )}

          {/* ── VIEW: DETAIL ── */}
          {view === 'detail' && (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div className="simlit-page-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8a6d00', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: 4 }}>PROYEK AKTIF</div>
                  <h1 className="simlit-page-title" style={{ fontSize: 20, fontWeight: 650, color: theme.text, margin: 0, maxWidth: 620, lineHeight: 1.3, letterSpacing: '0.1em' }}>{targetPenelitian?.nama_penelitian}</h1>
                  <p style={{ fontSize: 12, color: theme.textLabel, margin: '6px 0 0' }}>Ketua: <strong style={{ color: theme.textMuted }}>{targetPenelitian?.ketua_penelitian}</strong> · Skema: {targetPenelitian?.skema_penelitian} · Kode: {targetPenelitian?.kode_penelitian}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setView('dashboard')}><Icon name="arrow_back" size={16} /> Kembali</Btn>
                  <Btn variant="primary" onClick={() => { if (selectedId) setView('kurvas'); }}><Icon name="show_chart" size={20} /> Buka Analisis Kurva S</Btn>
                </div>
              </div>

              <div className="simlit-mini-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Progress Capaian', value: `${targetPenelitian?.progress_rata_rata || 0}%`, color: COLORS.primary, icon: 'trending_up', showBar: true },
                  { label: 'Total RAB', value: formatRp(totalRABTransaksi), color: '#8a6d00', icon: 'payments' },
                  { label: 'Realisasi Dana', value: formatRp(totalRealisasiKegiatanDetail), color: COLORS.success, icon: 'check_circle' },
                  {
                    label: 'Deviasi Kurva S',                    value: `${kurvaSDeviation > 0 ? '+' : ''}${kurvaSDeviation}%`,
                    color: kurvaSDeviation >= 0 ? COLORS.success : COLORS.danger,
                    icon: 'show_chart',
                    sub: kurvaSDeviation >= 0 ? 'Lebih cepat dari rencana' : 'Tertinggal dari rencana',
                    isDeviation: true,
                  },
                ].map((c, idx) => {
                  const isHov = hoveredMiniCard === idx;
                  const valueColor = c.isDeviation ? c.color : theme.text;
                  return (
                    <div key={c.label} className="simlit-3d-card" onMouseEnter={() => setHoveredMiniCard(idx)} onMouseLeave={() => setHoveredMiniCard(null)}
                      style={{
                        background: isHov ? theme.cardHover : theme.card, backdropFilter: 'blur(10px)',
                        borderRadius: 16, padding: '20px 22px', border: `1px solid ${theme.cardBorder}`, borderLeft: `4px solid ${c.color}`,
                        transform: isHov ? 'translateY(-4px)' : 'translateY(0)', transition: 'all 0.25s ease', cursor: 'default', minWidth: 0,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</span>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(145deg, ${c.color}2e, ${c.color}12)`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 10px ${c.color}33` }}>
                          {c.label === 'Total RAB' ? <IconBudgetOutline size={18} /> : <Icon name={c.icon} fill size={18} />}
                        </span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: valueColor, wordBreak: 'break-word' }}>{c.value}</div>
                      {c.showBar && <div style={{ marginTop: 8 }}><ProgressBar value={targetPenelitian?.progress_rata_rata || 0} color={c.color} height={6} /></div>}
                      {c.sub && <div style={{ marginTop: 8, fontSize: 10.5, color: c.isDeviation ? c.color : theme.textMuted, fontWeight: 600 }}>{c.sub}</div>}
                    </div>
                  );
                })}
              </div>

              {/* S-Curve + Info */}
              <div className="simlit-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
              <div className="simlit-3d-card" style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: '26px 26px 32px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'flex-start', gap: 10 }}>
                  <span />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Kurva S Kontrol Proyek</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, margin: '4px 0 6px' }}>Rencana Kerja vs Realisasi Fisik</div>
                    {kurvaSDataForChart.length > 0 && (
                      <div style={{ fontSize: 11, color: theme.textLabel, marginBottom: 16 }}>
                        Durasi proyek: <strong style={{ color: theme.text }}>{kurvaSDataForChart.length} bulan</strong>
                        {' '}({fmtDate(targetPenelitian?.tanggal_mulai)} → {fmtDate(targetPenelitian?.tanggal_selesai)})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Btn variant="secondary" onClick={() => { if (selectedId) setView('kurvas-fisik'); }}>
                      <Icon name="open_in_full" size={14} /> Detail Kurva S
                    </Btn>
                  </div>
                </div>
                  <Chart3DFrame height={10}>
                  <ResponsiveContainer width="100%" height={kurvaSXAxisAngled ? 360 : 320}>
                    <LineChart 
                      data={kurvaSDataForChart} 
                      margin={{ top: 10, right: 30, left: 20, bottom: kurvaSXAxisAngled ? 95 : 65 }}
                    >
                      <defs>
                        <filter id="lineShadowKurva" x="-20%" y="-40%" width="140%" height="200%">
                          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#16a34a" floodOpacity="0.30" />
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={12}
                        interval={kurvaSXAxisAngled ? Math.ceil(kurvaSDataForChart.length / 24) - 1 : 0}
                        angle={kurvaSXAxisAngled ? -45 : 0}
                        textAnchor={kurvaSXAxisAngled ? 'end' : 'middle'}
                        height={kurvaSXAxisAngled ? 60 : 35} 
                        style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }}
                        label={{ 
                          value: 'Bulan Berjalan Proyek', 
                          position: 'insideBottom', 
                          offset: kurvaSXAxisAngled ? -20 : -15, 
                          style: axisLabelStyle 
                        }}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        unit="%" 
                        axisLine={false} 
                        tickLine={false} 
                        tickMargin={10} 
                        width={65} 
                        style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }}
                        label={{ 
                          value: 'Progress Kumulatif (%)', 
                          angle: -90, 
                          position: 'insideLeft', 
                          offset: -10, 
                          style: { ...axisLabelStyle, textAnchor: 'middle' } 
                        }} 
                      />
                      <Tooltip {...tooltipStyle} />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ 
                          fontSize: 12, 
                          fontWeight: 600, 
                          color: theme.textMuted, 
                          paddingTop: 20 
                        }} 
                      />
                      <Line name="Rencana Kerja" type="monotone" dataKey="rencana" stroke="#0082CA" strokeWidth={2.5} dot={{ r: 3, fill: '#0082CA' }} />
                      <Line name="Realisasi Fisik" type="monotone" dataKey="realisasi" stroke={COLORS.success} strokeWidth={3.5} filter="url(#lineShadowKurva)" connectNulls dot={{ r: 5, fill: COLORS.success, stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Chart3DFrame>
                </div>

                <div className="simlit-3d-card" style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 650, color: theme.text, marginBottom: 1, paddingBottom: 1, borderBottom: `1px solid ${theme.borderLight}` }}>Informasi Penelitian</div>
                  {[
                    ['Kode', targetPenelitian?.kode_penelitian],
                    ['Unit Kerja', targetPenelitian?.unit_kerja],
                    ['Bidang', targetPenelitian?.bidang_penelitian],
                    ['Tahun Anggaran', targetPenelitian?.tahun_anggaran],
                    ['Durasi', `${targetPenelitian?.durasi_bulan} Bulan`],
                    ['Mulai', fmtDate(targetPenelitian?.tanggal_mulai)],
                    ['Selesai', fmtDate(targetPenelitian?.tanggal_selesai)],
                    ['Status', <Badge key="status" status={targetPenelitian?.status_penelitian} />],
                  ].map(([k, v], rowIdx) => {
                    const isRowHov = hoveredInfoRow === rowIdx;
                    return (
                      <div key={k} onMouseEnter={() => setHoveredInfoRow(rowIdx)} onMouseLeave={() => setHoveredInfoRow(null)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 8px', borderRadius: 8, borderBottom: `1px solid ${theme.border}`, fontSize: 12, background: isRowHov ? theme.infoRowHover : 'transparent', transform: isRowHov ? 'translateX(4px)' : 'translateX(0)', transition: 'all 0.2s ease', cursor: 'default', gap: 8 }}>
                        <span style={{ color: isRowHov ? '#0082CA' : theme.textLabel, fontWeight: 600 }}>{k}</span>
                        <span style={{ fontWeight: 700, color: theme.text, textAlign: 'right', maxWidth: 160 }}>{v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {loadingDetail ? <Spinner /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  {/* KEGIATAN — ditampilkan sebagai grid kartu (1 kegiatan = 1 kartu) */}
                  <SectionCard
                    title="Progress Kegiatan"
                    action={
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {!isEditingKegiatan && listKegiatan.length > 0 && Math.round(totalBobotKegiatanDetail * 10) / 10 !== 100 && (
                          <Btn variant="secondary" onClick={handleNormalizeBobot}><Icon name="balance" size={14} /> Samakan ke 100%</Btn>
                        )}
                        <Btn onClick={handleTambahBarisKegiatan} variant="primary"><Icon name="add" size={14} /> Tambah Kegiatan</Btn>
                        {isEditingKegiatan && (
                          <>
                            <Btn variant="ghost" onClick={handleBatalEditKegiatan}>Batal</Btn>
                            <Btn variant="primary" disabled={!bobotDraftValid || saving} onClick={handleSimpanSemuaKegiatan}>
                              {saving ? 'Menyimpan...' : 'Simpan'}
                            </Btn>
                          </>
                        )}
                      </div>
                    }>

                    {/* Ringkasan Proyek */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, background: 'rgba(0,130,202,0.04)' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,130,202,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0082CA', flexShrink: 0 }}>
                        <Icon name="insights" fill size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: '-webkit-left'}}>Ringkasan Proyek</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginTop: 2 }}>
                          {kegiatanTampil.length} rencana · Total bobot{' '}
                          <span style={{ color: Math.round(totalBobotTampil * 10) / 10 === 100 ? COLORS.success : '#0082CA' }}>{totalBobotTampil.toFixed(1)}%</span>
                          {' '}· Sisa{' '}
                          <span style={{ color: Math.round((100 - totalBobotTampil) * 10) / 10 === 0 ? COLORS.success : '#8a6d00' }}>{(100 - totalBobotTampil).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Grid kartu kegiatan (berpaginasi) */}
                    <div
                      className="simlit-ev-3"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, padding: 20 }}>
                      {pagedKegiatanTampil.map((k, pageIdx) => {
                        const realIdx = kegiatanDisplayPage * KEGIATAN_ITEMS_PER_PAGE + pageIdx;
                        return (
                          <KegiatanCard
                            key={k.id ?? `new-${realIdx}`}
                            item={k}
                            index={realIdx}
                            isEditing={isEditingKegiatan}
                            isNew={!!k.isNew}
                            totalAnggaran={targetPenelitian?.total_anggaran}
                            fmtDate={fmtDate}
                            formatRp={formatRp}
                            onFieldChange={(field, value) => {
                              if (isEditingKegiatan) handleUbahDraftKegiatan(realIdx, field, value);
                              else if (field === 'bobot') handleUpdateBobot(k.id, value);
                              else if (field === 'progress') handleUpdateProgress(k.id, value);
                              else if (field === 'total_anggaran' || field === 'realisasi_anggaran') handleUpdateAnggaranKegiatan(k.id, field, value);
                            }}
                            onDelete={() => {
                              if (isEditingKegiatan) handleHapusBarisDraft(realIdx);
                              else handleHapusKegiatan(k.id);
                            }}
                          />
                        );
                      })}

                      {/* Kartu "+" hanya muncul di halaman terakhir, di luar hitungan 4 */}
                      {kegiatanDisplayPage === totalKegiatanDisplayPages - 1 && (
                        <KegiatanAddCard onClick={() => {
                          handleTambahBarisKegiatan();
                          // setelah nambah baris baru, pindah ke halaman yang berisi kartu baru
                          setKegiatanDisplayPage(Math.floor(kegiatanTampil.length / KEGIATAN_ITEMS_PER_PAGE));
                        }} />
                      )}
                    </div>

                    {/* PAGINASI — sama gaya dengan RAB */}
                    {kegiatanTampil.length > KEGIATAN_ITEMS_PER_PAGE && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: `1px solid ${theme.borderLight}` }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                          Menampilkan {kegiatanDisplayPage * KEGIATAN_ITEMS_PER_PAGE + 1}-{Math.min((kegiatanDisplayPage + 1) * KEGIATAN_ITEMS_PER_PAGE, kegiatanTampil.length)} dari {kegiatanTampil.length} entri
                        </span>
                        <button
                          onClick={() => setKegiatanDisplayPage(p => Math.max(0, p - 1))}
                          disabled={kegiatanDisplayPage === 0}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                            background: kegiatanDisplayPage === 0 ? theme.input : '#fff', color: kegiatanDisplayPage === 0 ? theme.textFaint : '#0082CA',
                            cursor: kegiatanDisplayPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: kegiatanDisplayPage === 0 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease', flexShrink: 0,
                          }}>
                          <Icon name="chevron_left" size={16} />
                        </button>
                        <button
                          onClick={() => setKegiatanDisplayPage(p => Math.min(totalKegiatanDisplayPages - 1, p + 1))}
                          disabled={kegiatanDisplayPage >= totalKegiatanDisplayPages - 1}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                            background: kegiatanDisplayPage >= totalKegiatanDisplayPages - 1 ? theme.input : '#fff', color: kegiatanDisplayPage >= totalKegiatanDisplayPages - 1 ? theme.textFaint : '#0082CA',
                            cursor: kegiatanDisplayPage >= totalKegiatanDisplayPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: kegiatanDisplayPage >= totalKegiatanDisplayPages - 1 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease', flexShrink: 0,
                          }}>
                          <Icon name="chevron_right" size={16} />
                        </button>
                      </div>
                    )}

                    {isEditingKegiatan && !bobotDraftValid && (
                      <div style={{ padding: '10px 20px 18px', fontSize: 11.5, color: COLORS.danger, fontWeight: 600 }}>
                        Total bobot saat ini {totalBobotDraft.toFixed(1)}% — harus tepat 100% sebelum tombol "Simpan" aktif.
                      </div>
                    )}
                  </SectionCard>

                  {/* CASHFLOW / RAB — ditampilkan berbaris ke bawah (1 transaksi = 1 baris) */}
                  <SectionCard title="Rancangan Anggaran (RAB)"
                      action={<Btn onClick={() => setIsAddingCashflow(!isAddingCashflow)} variant={isAddingCashflow ? 'ghost' : 'primary'}>{isAddingCashflow ? 'Tutup' : <><Icon name="add" size={14} /> Tambah Transaksi</>}</Btn>}>

                      {/* Ringkasan RAB */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, background: 'rgba(0,130,202,0.04)' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,130,202,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0082CA', flexShrink: 0 }}>
                          <IconBudgetOutline size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: '-webkit-left' }}>Ringkasan RAB</div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginTop: 2 }}>
                            {listCashflow.length} transaksi · Total anggaran{' '}
                            <span style={{ color: '#0082CA' }}>{formatRp(listCashflow.reduce((s, c) => s + (Number(c.nominal) || 0), 0))}</span>
                          </div>
                        </div>
                      </div>

                      {listCashflow.length === 0 && !isAddingCashflow ? (
                        <div style={{ padding: 20 }}>
                          <div style={{ maxWidth: 280 }}>
                            <CashflowAddPlaceholderCard onClick={() => setIsAddingCashflow(true)} />
                          </div>
                        </div>
                      ) : (
                        <div
                          className="simlit-ev-3"
                          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, padding: 20 }}>

                          {pagedCashflow.map((c, idx) => (
                            <CashflowCard
                              key={c.id || idx}
                              item={c}
                              index={cashflowPage * DETAIL_ITEMS_PER_PAGE + idx}
                              onDelete={() => handleHapusCashflow(c.id)}
                              fmtDate={fmtDate}
                              formatRp={formatRp}
                            />
                          ))}

                          {/* Kartu terakhir: form tambah (kalau sedang aktif) atau dashed placeholder pemicu */}
                          {isAddingCashflow ? (
                            <CashflowAddCard
                              draft={cashflowBaru}
                              onChange={(field, value) => {
                                if (field === 'jumlah') {
                                  const val = Number(value);
                                  setCashflowBaru(p => ({ ...p, jumlah: val, nominal: val * (Number(p.harga_satuan) || 0) }));
                                } else if (field === 'harga_satuan') {
                                  const hrg = Number(value);
                                  setCashflowBaru(p => ({ ...p, harga_satuan: hrg, nominal: hrg * (Number(p.jumlah) || 0) }));
                                } else {
                                  setCashflowBaru(p => ({ ...p, [field]: value }));
                                }
                              }}
                              onSave={handleSaveCashflow}
                              onCancel={() => setIsAddingCashflow(false)}
                            />
                          ) : (
                            cashflowPage === totalCashflowPages - 1 && (
                              <CashflowAddPlaceholderCard onClick={() => setIsAddingCashflow(true)} />)
                          )}
                        </div>
                      )}

                    {/* PAGINASI — tetap membatasi jumlah kartu per halaman */}
                    {listCashflow.length > CASHFLOW_ITEMS_PER_PAGE && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: `1px solid ${theme.borderLight}` }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                          Menampilkan {cashflowPage * CASHFLOW_ITEMS_PER_PAGE + 1}-{Math.min((cashflowPage + 1) * CASHFLOW_ITEMS_PER_PAGE, listCashflow.length)} dari {listCashflow.length} entri
                        </span>
                        <button
                          onClick={() => setCashflowPage(p => Math.max(0, p - 1))}
                          disabled={cashflowPage === 0}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                            background: cashflowPage === 0 ? theme.input : '#fff', color: cashflowPage === 0 ? theme.textFaint : '#0082CA',
                            cursor: cashflowPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: cashflowPage === 0 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease', flexShrink: 0,
                          }}>
                          <Icon name="chevron_left" size={16} />
                        </button>
                        <button
                          onClick={() => setCashflowPage(p => Math.min(totalCashflowPages - 1, p + 1))}
                          disabled={cashflowPage >= totalCashflowPages - 1}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                            background: cashflowPage >= totalCashflowPages - 1 ? theme.input : '#fff', color: cashflowPage >= totalCashflowPages - 1 ? theme.textFaint : '#0082CA',
                            cursor: cashflowPage >= totalCashflowPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: cashflowPage >= totalCashflowPages - 1 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease', flexShrink: 0,
                          }}>
                          <Icon name="chevron_right" size={16} />
                        </button>
                      </div>
                    )}
                  </SectionCard>
                </div>
              )}
            </div>
          )}

          {/* ── VIEW: TAMBAH ── */}
          {view === 'tambah' && (
            <form onSubmit={handleSubmit} style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: `1px solid ${theme.borderLight}`, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, textAlign: 'justify' }}>FORM INPUT</div>
                  <h1 className="simlit-page-title" style={{ fontSize: 20, fontWeight: 700, color: theme.text, margin: 0, letterSpacing: '0.05em' }}>Tambah Penelitian Baru</h1>
                </div>
                <Btn type="button" variant="ghost" onClick={() => setView('dashboard')}><Icon name="arrow_back" size={16} /> Kembali</Btn>
              </div>

              {/* SECTION A ── semua input manual (diketik bebas), kecuali Tahun Anggaran tetap dropdown */}
              <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,130,202,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0082CA' }}><Icon name="description" fill size={18} /></div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>A. Informasi Penelitian</div>
                </div>
                <div className="simlit-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Input label="Nama Penelitian *" type="text" value={formData.nama_penelitian} onChange={e => setFormData({ ...formData, nama_penelitian: e.target.value })} placeholder="Masukkan nama penelitian" required />
                  <Input
                    label="Kode Penelitian"
                    type="text"
                    value={formData.kode_penelitian}
                    onChange={e => setFormData({ ...formData, kode_penelitian: e.target.value })}
                    placeholder="cth. PN-2026-001"
                  />
                  <Input label="Ketua Peneliti *" type="text" value={formData.ketua_penelitian} onChange={e => setFormData({ ...formData, ketua_penelitian: e.target.value })} placeholder="Masukkan nama ketua peneliti" required />
                  <Input label="Unit Kerja *" type="text" value={formData.unit_kerja} onChange={e => setFormData({ ...formData, unit_kerja: e.target.value })} placeholder="Masukkan unit kerja" required />
                  <Input label="Tanggal Mulai *" type="date" value={formData.tanggal_mulai}
                    onChange={e => {
                      const tanggal_mulai = e.target.value;
                      setFormData(p => ({ ...p, tanggal_mulai, durasi_bulan: hitungDurasiBulan(tanggal_mulai, p.tanggal_selesai) }));
                    }} required />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Tanggal Selesai *" type="date" value={formData.tanggal_selesai}
                      onChange={e => {
                        const tanggal_selesai = e.target.value;
                        setFormData(p => ({ ...p, tanggal_selesai, durasi_bulan: hitungDurasiBulan(p.tanggal_mulai, tanggal_selesai) }));
                      }} required />
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: theme.textLabel, display: 'block', marginBottom: 5 }}>Durasi (Bulan)</label>
                      <input disabled
                        value={formData.tanggal_mulai && formData.tanggal_selesai ? `${formData.durasi_bulan} Bulan` : 'Isi tanggal dahulu'}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 13, fontWeight: 700, color: theme.textMuted, background: theme.input, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <Input label="Cabang Penelitian *" type="text" value={formData.bidang_penelitian} onChange={e => setFormData({ ...formData, bidang_penelitian: e.target.value })} placeholder="Masukkan bidang penelitian" required />
                  <Input label="Skema Penelitian *" type="text" value={formData.skema_penelitian} onChange={e => setFormData({ ...formData, skema_penelitian: e.target.value })} placeholder="Masukkan skema penelitian" required />
                  <Input label="Sumber Pendanaan *" type="text" value={formData.sumber_pendanaan} onChange={e => setFormData({ ...formData, sumber_pendanaan: e.target.value })} placeholder="Masukkan sumber pendanaan" required />
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textLabel, display: 'block', marginBottom: 5 }}>Tahun Anggaran *</label>
                    <Select value={formData.tahun_anggaran} onChange={e => setFormData({ ...formData, tahun_anggaran: Number(e.target.value) })} required>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </Select>
           
                    {formData.tanggal_mulai && formData.tanggal_selesai && new Date(formData.tanggal_mulai).getFullYear() !== new Date(formData.tanggal_selesai).getFullYear() && (
                      <div style={{ fontSize: 10.5, color: '#8a6d00', marginTop: 6, lineHeight: 1.5 }}>
                        <Icon name="info" size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        Proyek ini melintasi <strong>{new Date(formData.tanggal_mulai).getFullYear()}–{new Date(formData.tanggal_selesai).getFullYear()}</strong> — nilai di atas hanya dipakai untuk penomoran kode & tampilan, tapi proyek akan tetap otomatis muncul di filter Dashboard untuk SEMUA tahun yang dilaluinya.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION B - RAB (Total dihitung otomatis dari rincian & tersinkron ke Dashboard) */}
              <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)' }}>
                <div className="simlit-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,130,202,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0082CA', flexShrink: 0 }}><IconBudgetOutline size={18} /></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, textAlign: 'left'  }}>B. Rincian RAB</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>Total: <strong style={{ color: theme.text }}>{formatRp(formData.total_anggaran)}</strong> <span style={{ color: theme.textLabel }}>(otomatis, langsung tampil di Dashboard)</span></div>
                    </div>
                  </div>
                  <Btn type="button" variant="secondary" onClick={() => setRincianRab([...rincianRab, { tanggal: '', uraian: '', jenis_belanja: 'Alat', jumlah: 1, harga_satuan: 0, nominal: 0 }])}><Icon name="add" size={14} /> Tambah Item</Btn>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 760 }}>
                    <thead>
                      <tr>
                        {['Uraian / Deskripsi','Jenis Kategori','Jumlah','Harga Satuan (Rp)','Total (Rp)',''].map(h => (
                          <th key={h} style={{ ...thStyle, textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rincianRab.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          {/* <td style={{ padding: '8px 10px' }}><input type="date" required value={row.tanggal} onChange={e => handleRabChange(i, 'tanggal', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td> */}
                          <td style={{ padding: '8px 10px' }}><input type="text" required placeholder="Deskripsi item..." value={row.uraian} onChange={e => handleRabChange(i, 'uraian', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}>
                            <input type="text" required placeholder="cth. Bahan & Komponen" value={row.jenis_belanja} onChange={e => handleRabChange(i, 'jenis_belanja', e.target.value)} style={{ ...inlineInput, width: '100%' }} />
                          </td>
                          <td style={{ padding: '8px 10px' }}><input type="number" required min="1" placeholder="1" value={row.jumlah || ''} onChange={e => handleRabChange(i, 'jumlah', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}><input type="number" required min="0" placeholder="0" value={row.harga_satuan || ''} onChange={e => handleRabChange(i, 'harga_satuan', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}><input type="number" readOnly value={row.nominal || ''} style={{ ...inlineInput, width: '100%', opacity: 0.6, cursor: 'not-allowed' }} /></td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button type="button" disabled={rincianRab.length === 1} onClick={() => {
                              const updated = rincianRab.filter((_, j) => j !== i);
                              setRincianRab(updated);
                              setFormData(p => ({ ...p, total_anggaran: updated.reduce((s, r) => s + (Number(r.nominal) || 0), 0) }));
                            }} style={{ background: 'none', border: 'none', cursor: rincianRab.length === 1 ? 'not-allowed' : 'pointer', color: rincianRab.length === 1 ? theme.textFaint : COLORS.danger, display: 'inline-flex' }}><Icon name="delete" size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION C - KEGIATAN & BOBOT KURVA S (+ Progress awal tiap langkah) */}
              <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)' }}>
                <div className="simlit-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,130,202,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0082CA', flexShrink: 0 }}><Icon name="insights" fill size={18} /></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: theme.text, textAlign: 'left' }}>C. Distribusi Kegiatan &amp; Bobot Kurva S</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3, textAlign: 'left' }}>
                        Total bobot:{' '}
                        <strong style={{ color: Math.round(totalBobotKegiatan * 10) / 10 === 100 ? COLORS.success : COLORS.danger }}>
                          {totalBobotKegiatan.toFixed(1)}%
                        </strong>
                        {' · '}Sisa:{' '}
                        <strong style={{ color: Math.round((100 - totalBobotKegiatan) * 10) / 10 === 0 ? COLORS.success : '#8a6d00' }}>
                          {(100 - totalBobotKegiatan).toFixed(1)}%
                        </strong>
                        {' · '}Progres keseluruhan penelitian:{' '}
                        <strong style={{ color: '#0082CA' }}>{weightedProgressAwal.toFixed(1)}%</strong>
                        {' · '}Total Anggaran:{' '}
                        <strong style={{ color: '#8a6d00' }}>{formatRp(formData.total_anggaran)}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {rincianKegiatan.length > 0 && Math.round(totalBobotKegiatan * 10) / 10 !== 100 && (
                      <Btn type="button" variant="secondary" onClick={() => setRincianKegiatan(normalizeBobotProportional(rincianKegiatan))}>
                        <Icon name="balance" size={14} /> Samakan ke 100%
                      </Btn>
                    )}
                    <Btn type="button" variant="secondary" onClick={() => setRincianKegiatan([...rincianKegiatan, { nama_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '', bobot: 0, progress: 0, total_anggaran: 0, realisasi_anggaran: 0 }])}><Icon name="add" size={14} /> Tambah Kegiatan</Btn>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
                    <thead>
                      <tr>
                      {['Nama Kegiatan','Tgl Mulai','Tgl Selesai','Bobot (%)','Progress Awal (%)','Total Anggaran (Rp)','Realisasi Anggaran (Rp)',''].map(h => (
                          <th key={h} style={{ ...thStyle, textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rincianKegiatan.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: '8px 10px' }}><input type="text" required placeholder="Nama kegiatan" value={row.nama_kegiatan} onChange={e => handleKegiatanChange(i, 'nama_kegiatan', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}><input type="date" required value={row.tanggal_mulai} onChange={e => handleKegiatanChange(i, 'tanggal_mulai', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}><input type="date" required value={row.tanggal_selesai} onChange={e => handleKegiatanChange(i, 'tanggal_selesai', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}>
                            <input type="number" required min="0" max="100" step="0.1" placeholder="0" value={row.bobot ?? ''} onChange={e => handleKegiatanChange(i, 'bobot', e.target.value)} style={{ ...inlineInput, width: '100%', textAlign: 'center', fontWeight: 700, color: '#0082CA' }} />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input type="number" min="0" placeholder="0" value={row.progress ?? ''} onChange={e => handleKegiatanChange(i, 'progress', e.target.value)} style={{ ...inlineInput, width: '100%', textAlign: 'center', fontWeight: 700, color: theme.textMuted }} />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input type="number" min="0" placeholder="0" value={row.total_anggaran ?? ''} onChange={e => handleKegiatanChange(i, 'total_anggaran', e.target.value)} style={{ ...inlineInput, width: '100%' }} />
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input type="number" min="0" placeholder="0" value={row.realisasi_anggaran ?? ''} onChange={e => handleKegiatanChange(i, 'realisasi_anggaran', e.target.value)} style={{ ...inlineInput, width: '100%' }} />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button type="button" onClick={() => setRincianKegiatan(rincianKegiatan.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, display: 'inline-flex' }}><Icon name="delete" size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 11, color: theme.textLabel, marginTop: 10, lineHeight: 1.5 }}>
                  <Icon name="info" size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  Progres keseluruhan penelitian dihitung otomatis dari akumulasi <strong>(bobot × progres)</strong> setiap langkah kegiatan — bukan progres satu langkah saja — sehingga angka yang tampil di Dashboard selalu mencerminkan progres proyek secara utuh.
                  {' '}Tombol <strong>"Samakan ke 100%"</strong> menskalakan bobot yang sudah kamu isi secara proporsional (bukan dibagi rata) agar totalnya tepat 100%, tanpa mengubah perbandingan besar-kecil antar kegiatan.
                </div>
              </div>

              <div style={{ paddingBottom: 8 }}>
                <button type="submit" disabled={saving}
                  style={{
                    background: saving ? theme.input : '#0082CA',
                    color: saving ? theme.textLabel : '#fff',
                    border: 'none',
                    padding: '14px 32px', borderRadius: 14, fontSize: 13, fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving ? 'none' : '0 4px 18px rgba(0,130,202,0.28)',
                    display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
                  }}>
                  <Icon name="save" size={18} /> {saving ? 'Menyimpan...' : 'Simpan Penelitian Baru'}
                </button>
              </div>
            </form>
          )}

          {/* ── VIEW: KURVA S (delegated to KurvaSAnalysis.jsx, restyled to match design system) ── */}
          {view === 'kurvas' && (
            targetPenelitian ? (
              <KurvaSAnalysis
                penelitian={targetPenelitian}
                kegiatan={listKegiatan}
                cashflow={listCashflow}
                realisasiRAB={listRealisasiRAB}
                onAddRealisasi={handleAddRealisasiRAB}
                onDeleteRealisasi={handleHapusRealisasiRAB}
                onBack={() => setView('detail')}
                allowedTabs={['input', 'cashflow', 'ev']}
                eyebrow="Analisis Kurva S"
              />
            ) : (
              <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <SectionCard title="Analisis Kurva S">
                  <div style={{ padding: 32, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>
                    Pilih penelitian terlebih dahulu dari Dashboard untuk melihat analisis Kurva S.
                  </div>
                </SectionCard>
              </div>
            )
          )}

          {view === 'kurvas-fisik' && (
            targetPenelitian ? (
              <KurvaSAnalysis
                penelitian={targetPenelitian}
                kegiatan={listKegiatan}
                cashflow={listCashflow}
                realisasiRAB={listRealisasiRAB}
                onAddRealisasi={handleAddRealisasiRAB}
                onDeleteRealisasi={handleHapusRealisasiRAB}
                onBack={() => setView('detail')}
                allowedTabs={['kurva', 'gantt', 'progress']}
                eyebrow="Detail Kurva S"
              />
            ) : (
              <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                <SectionCard title="Detail Kurva S">
                  <div style={{ padding: 32, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>
                    Pilih penelitian terlebih dahulu dari Dashboard untuk melihat detail Kurva S.
                  </div>
                </SectionCard>
              </div>
            )
          )}
          {view === 'jadwal' && (
            <JadwalMonitoring
              initialTab="monitoring"
              initialKegiatanId={jadwalOpenTarget?.kegiatanId}
            />
          )}
          {view === 'monitoring-penelitian' && <MonitoringPenelitian />} 
        </div>
      </div>
    </div>
  );
}
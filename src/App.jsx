import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import logoPLN from "./assets/logoPLN.jpg";
import KurvaSAnalysis from "./KurvaSAnalysis";
import JadwalMonitoring from "./JadwalMonitoring";

// theme/COLORS/Icon now live in their own module (theme.js) to avoid a
// circular import: App.jsx imports KurvaSAnalysis.jsx, so KurvaSAnalysis.jsx
// can no longer import these values back from './App' (that caused
// "Cannot access 'theme' before initialization"). Re-exported below so any
// other file still doing `import { theme } from './App'` keeps working.
import { theme, COLORS, Icon } from './theme';
export { theme, COLORS, Icon };

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      }
      `;
      document.head.appendChild(style);
    }
  }, []);
};

// ── HELPER COMPONENTS ──────────────────────────────────────────────────────
const Avatar = ({ name = 'A', size = 36 }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #0082CA, #FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
      {initials}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }) => {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, padding: '20px 22px',
        border: `1px solid ${theme.cardBorder}`, transition: 'all 0.25s ease', cursor: 'pointer',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hover ? '0 12px 28px rgba(11,28,48,0.10)' : '0 4px 12px rgba(11,28,48,0.05)',
        display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `4px solid ${color}`, minWidth: 0,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: `${color}1a`, color, flexShrink: 0 }}>
          <Icon name={icon} fill size={20} />
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

const Badge = ({ status }) => {
  const cfg = statusColor(status);
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
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
        background: cfg.bg, color: cfg.color, borderRadius: 999, padding: '5px 26px 5px 12px',
        fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${cfg.color}33`,
        cursor: 'pointer', outline: 'none', appearance: 'none',
        WebkitAppearance: 'none', MozAppearance: 'none',
        colorScheme: 'light',
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='${encodeURIComponent(cfg.color)}' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
      }}>
      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  );
};

const ProgressBar = ({ value, color = COLORS.primary, height = 6 }) => {
  const [width, setWidth] = React.useState(0);
  const safeValue = Math.min(Math.max(value || 0, 0), 100);
  React.useEffect(() => { setTimeout(() => setWidth(safeValue), 100); }, [safeValue]);
  return (
    <div style={{ background: '#e5eeff', borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${width}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
};

const SectionCard = ({ title, children, action }) => (
  <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 12px rgba(11,28,48,0.04)', overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <span style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>{title}</span>
      {action}
    </div>
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

// ── LOGIN SCREEN (matches PLN login design) ─────────────────────────────────
const LoginScreen = ({ onLogin }) => {
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
            <h1 style={{ fontSize: 'clamp(22px, 6vw, 30px)', fontWeight: 800, color: '#0082CA', margin: 0, letterSpacing: '-0.02em' }}>SIMLITBANG</h1>
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
              <a href="#" style={{ color: '#0082CA', fontWeight: 700, textDecoration: 'none', fontSize: 11.5 }}>Lupa Password?</a>
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

          <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: `1px solid ${theme.borderLight}`, fontSize: 12, color: theme.textFaint }}>
            Belum memiliki akses? <a href="#" style={{ color: '#0082CA', fontWeight: 700, textDecoration: 'none' }}>Hubungi Administrator</a>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 10.5, color: theme.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          © 2024 PT PLN (Persero) Pusat Penelitian dan Pengembangan
        </p>
      </motion.div>
    </div>
  );
};

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function App() {
  useDesignFonts();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showDetailPie, setShowDetailPie] = useState(false);
  const [view, setView] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);
  const [filterTahun, setFilterTahun] = useState('');
  const [selectedBulan, setSelectedBulan] = useState(null);

  const [dataPenelitian, setDataPenelitian] = useState([]);
  const [dashboardProgress, setDashboardProgress] = useState([]);
  const [listKegiatan, setListKegiatan] = useState([]);
  const [listCashflow, setListCashflow] = useState([]);

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [hoveredMiniCard, setHoveredMiniCard] = useState(null);
  const [hoveredInfoRow, setHoveredInfoRow] = useState(null);

  const fetchDashboard = useCallback(async (tahun = '') => {
    if (!user) return; // jangan fetch kalau belum login
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
      const [resKegiatan, resCashflow] = await Promise.all([
        fetch(`${API}/kegiatan?penelitian_id=${penelitian_id}`),
        fetch(`${API}/cashflow?penelitian_id=${penelitian_id}`)
      ]);
      if (!resKegiatan.ok) throw new Error('Gagal memuat kegiatan');
      if (!resCashflow.ok) throw new Error('Gagal memuat cashflow');
      const [kegiatan, cashflow] = await Promise.all([resKegiatan.json(), resCashflow.json()]);
      setListKegiatan(kegiatan);
      setListCashflow(cashflow);
    } catch (err) { setError(err.message); }
    finally { setLoadingDetail(false); }
  }, []);

  useEffect(() => { if (user) fetchDashboard(filterTahun); }, [user, fetchDashboard, filterTahun]);
  useEffect(() => { if (selectedId) fetchDetail(selectedId); }, [selectedId, fetchDetail]);
  useEffect(() => { setSidebarOpen(false); }, [view]);

  const stats = useMemo(() => {
    const total = dataPenelitian.length;
    const avgProgress = total ? Math.round(dataPenelitian.reduce((a, c) => a + (c.progress_rata_rata || 0), 0) / total) : 0;
    const totalAnggaran = dataPenelitian.reduce((a, c) => a + Number(c.total_anggaran || 0), 0);
    const realisasi = dataPenelitian.reduce((a, c) => a + Number(c.realisasi_anggaran || 0), 0);
    return { totalPenelitian: total, rataRataProgress: avgProgress, totalAnggaran, realisasiAnggaran: realisasi };
  }, [dataPenelitian]);

  // ── UPDATE STATUS PENELITIAN LANGSUNG DARI DASHBOARD ─────────────────────
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
      setDataPenelitian(prevData); // rollback optimistic update kalau gagal
    }
  };

  const targetPenelitian = dataPenelitian.find(p => p.id === selectedId);

  const hitungHari = (m, s) => {
    if (!m || !s) return 0;
    const a = new Date(m), b = new Date(s);
    if (isNaN(a) || isNaN(b)) return 0;
    return Math.ceil((b - a) / 86400000) + 1;
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
    const labels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    let accR = 0, accA = 0;
    const now = new Date();
    const nowMonth = now.getMonth();
    const nowYear = now.getFullYear();
    const tahunProyek = Number(targetPenelitian?.tahun_anggaran) || nowYear;
    return labels.map((name, i) => {
      let rBulan = 0, aBulan = 0;
      listKegiatan.forEach(k => {
        if (!k.tanggal_mulai || !k.tanggal_selesai) return;
        const [yM, mM] = k.tanggal_mulai.split('-').map(Number);
        const [yS, mS] = k.tanggal_selesai.split('-').map(Number);
        const bM = mM - 1, bS = mS - 1;
        const total = (yS - yM) * 12 + (bS - bM) + 1;
        const bobot = Number(k.bobot) || 0;
        const gi = (tahunProyek * 12) + i;
        const gMulai = (yM * 12) + bM;
        const gSelesai = (yS * 12) + bS;
        if (gi >= gMulai && gi <= gSelesai) {
          const b = bobot / (total || 1);
          rBulan += b;
          aBulan += b * ((Number(k.progress) || 0) / 100);
        }
      });
      accR += rBulan; accA += aBulan;
      const isPast = tahunProyek < nowYear || (tahunProyek === nowYear && i <= nowMonth);
      return { name, rencana: Math.min(Math.round(accR), 100), realisasi: isPast ? Math.min(Math.round(accA), 100) : null };
    });
  };

  // Deviasi kurva-S bulan terakhir yang sudah punya realisasi (dipakai di card ringkasan detail)
  const kurvaSData = view === 'detail' ? getKurvaSData() : [];
  let kurvaSDeviation = 0;
  for (let i = kurvaSData.length - 1; i >= 0; i--) {
    if (kurvaSData[i].realisasi !== null) { kurvaSDeviation = kurvaSData[i].realisasi - kurvaSData[i].rencana; break; }
  }

  const [kegiatanBaru, setKegiatanBaru] = useState({ nama_kegiatan: '', progress: 0, tanggal_mulai: '', tanggal_selesai: '', bobot: 0 });
  const [isAddingKegiatan, setIsAddingKegiatan] = useState(false);

  const handleSaveKegiatan = async () => {
    if (!kegiatanBaru.nama_kegiatan?.trim()) return alert('Nama kegiatan tidak boleh kosong!');
    if (!kegiatanBaru.tanggal_mulai || !kegiatanBaru.tanggal_selesai) return alert('Tanggal wajib diisi!');
    if (kegiatanBaru.bobot === '' || kegiatanBaru.bobot === null || kegiatanBaru.bobot === undefined || isNaN(Number(kegiatanBaru.bobot))) {
      return alert('Bobot wajib diisi!');
    }
    try {
      const res = await fetch(`${API}/kegiatan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...kegiatanBaru, bobot: Number(kegiatanBaru.bobot), penelitian_id: selectedId }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal menyimpan kegiatan'); }
      setKegiatanBaru({ nama_kegiatan: '', progress: 0, tanggal_mulai: '', tanggal_selesai: '', bobot: 0 });
      setIsAddingKegiatan(false);
      await fetchDetail(selectedId);
    } catch (err) { alert('❌ ' + err.message); }
  };

  const handleUpdateProgress = async (id, val) => {
    setListKegiatan(prev => prev.map(k => k.id === id ? { ...k, progress: Number(val) } : k));
    try {
      const res = await fetch(`${API}/kegiatan/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: Number(val) }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Gagal update progress'); }
      // progress per-langkah berubah → progres keseluruhan penelitian (weighted by bobot) ikut berubah,
      // jadi dashboard perlu di-refresh supaya progress_rata_rata (progres total proyek) ter-update.
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
      setCashflowBaru({ tanggal: '', uraian: '', jenis_belanja: 'Alat', nominal: 0 });
      setIsAddingCashflow(false);
      await fetchDetail(selectedId);
      fetchDashboard(filterTahun);
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

  const [formData, setFormData] = useState({
    nama_penelitian: '', ketua_penelitian: '', unit_kerja: '', tanggal_mulai: '',
    tanggal_selesai: '', durasi_bulan: 7, bidang_penelitian: '', skema_penelitian: '',
    sumber_pendanaan: '', tahun_anggaran: 2025, total_anggaran: 0,
  });
  const [rincianRab, setRincianRab] = useState([{ tanggal: '', uraian: '', jenis_belanja: 'Alat', jumlah: 1, harga_satuan: 0, nominal: 0 }]);
  // "progress" = progres awal tiap langkah kegiatan saat penelitian pertama kali dibuat.
  const [rincianKegiatan, setRincianKegiatan] = useState([{ nama_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '', bobot: 0, progress: 0 }]);

  const handleRabChange = (index, field, value) => {
    const updated = [...rincianRab];
    updated[index][field] = (field === 'nominal' || field === 'jumlah' || field === 'harga_satuan') ? Number(value) : value;
    if (field === 'jumlah' || field === 'harga_satuan') {
      updated[index].nominal = (Number(updated[index].jumlah) || 0) * (Number(updated[index].harga_satuan) || 0);
    }
    setRincianRab(updated);
    // Total RAB dihitung otomatis dari seluruh baris rincian, lalu ikut tersimpan sebagai
    // total_anggaran penelitian sehingga langsung terbaca di kartu & tabel Dashboard.
    setFormData(p => ({ ...p, total_anggaran: updated.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0) }));
  };

  const handleKegiatanChange = (index, field, value) => {
    const updated = [...rincianKegiatan];
    updated[index][field] = value;
    setRincianKegiatan(updated);
  };

  const totalBobotKegiatan = rincianKegiatan.reduce((s, r) => s + (Number(r.bobot) || 0), 0);
  // Progres keseluruhan penelitian = akumulasi (bobot × progres) tiap langkah kegiatan, BUKAN
  // progres satu langkah saja. Inilah nilai yang seharusnya tampil sebagai progress_rata_rata di Dashboard.
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
          kegiatan: rincianKegiatan.map(k => ({ ...k, bobot: Number(k.bobot) || 0, progress: Number(k.progress) || 0 })),
          // progress_rata_rata: progres KESELURUHAN penelitian (weighted-average dari semua langkah kegiatan),
          // dikirim supaya Dashboard langsung menampilkan angka yang benar sejak awal dibuat.
          progress_rata_rata: Math.round(weightedProgressAwal),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan penelitian');
      alert(`✅ ${data.message}`);
      setFormData({ nama_penelitian: '', ketua_penelitian: '', unit_kerja: '', tanggal_mulai: '', tanggal_selesai: '', durasi_bulan: 7, bidang_penelitian: '', skema_penelitian: '', sumber_pendanaan: '', tahun_anggaran: 2025, total_anggaran: 0 });
      setRincianRab([{ tanggal: '', uraian: '', jenis_belanja: 'Alat', jumlah: 1, harga_satuan: 0, nominal: 0 }]);
      setRincianKegiatan([{ nama_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '', bobot: 0, progress: 0 }]);
      await fetchDashboard(filterTahun);
      setView('dashboard');
    } catch (err) { alert('❌ ' + err.message); }
    finally { setSaving(false); }
  };

  const formatRp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
  const fmtDate = (s) => {
    if (!s) return '-';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (isNaN(d)) return s;
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return `${String(d.getDate()).padStart(2,'0')} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  };

  // ── INLINE STYLES ──────────────────────────────────────────────────────
  const inlineInput = { padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 12, background: '#fff', color: theme.text, boxSizing: 'border-box' };
  const inlineSelect = { padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${theme.cardBorder}`, fontSize: 12, background: theme.selectBg, color: theme.text, width: '100%' };
  const thStyle = { padding: '12px 14px', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#eff4ff' };
  const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: 12 };
  const tooltipStyle = { contentStyle: { borderRadius: 12, border: `1px solid ${theme.cardBorder}`, background: theme.tooltipBg, color: theme.text, fontSize: 12, backdropFilter: 'blur(16px)' } };

  // ── GATE: LOGIN ─────────────────────────────────────────────────────────
  if (!user) {
    return <LoginScreen onLogin={(u) => setUser(u)} />;
  }

  const pageTitle = view === 'dashboard' ? 'Dashboard Monitoring' : view === 'tambah' ? 'Tambah Penelitian' : view === 'kurvas' ? 'Analisis Kurva S' : 'Detail Kegiatan & Anggaran';

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
              <h1 style={{ fontSize: 17, fontWeight: 300, color: '#16a34a', margin: 0, lineHeight: 1.2, letterSpacing: '0.01em' }}>SIMLITBANG</h1>
              <p style={{ fontSize: 10, color: theme.textLabel, margin: 0 }}>Research Portal</p>
            </div>
          </div>
        <nav style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem icon="dashboard" label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <NavItem icon="biotech" label="Tambah Penelitian" active={view === 'tambah'} onClick={() => setView('tambah')} />
          {view === 'detail' && <NavItem icon="description" label="Detail Penelitian" active onClick={() => {}} />}
          {view === 'kurvas' && <NavItem icon="show_chart" label="Analisis Kurva S" active onClick={() => {}} />}
        <div style={{ height: 1, background: theme.borderLight, margin: '12px 24px' }} />
        <NavItem icon="event_available" label="Monitoring Jadwal" active={view === 'jadwal'} onClick={() => setView('jadwal')} />
        </nav>
        <div style={{ padding: '16px 16px 0', borderTop: `1px solid ${theme.borderLight}`, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 12, background: '#eff4ff' }}>
            <Avatar name={user.name} size={38} />
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ color: theme.text, fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ color: theme.textLabel, fontSize: 10.5 }}>NIP: {user.nip || '—'}</div>
            </div>
          </div>
          <button onClick={() => setUser(null)}
            style={{ width: '100%', marginTop: 10, background: 'transparent', border: `1px solid ${theme.borderLight}`, color: theme.textMuted, padding: '8px 0', borderRadius: 10, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="logout" size={16} /> Keluar
          </button>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9.5, color: theme.textFaint, fontWeight: 600 }}>v1.0.0 © SIMLITBANG</div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="simlit-main" style={{ marginLeft: 260, position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', width: 'auto' }}>

        {/* TOP BAR */}
        <header className="simlit-header" style={{
          position: 'sticky', top: 0, zIndex: 40, background: theme.header, backdropFilter: 'blur(14px)',
          borderBottom: `1px solid ${theme.sidebarBorder}`, padding: '0 32px', height: 64,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button className="simlit-hamburger" onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: theme.text, flexShrink: 0, padding: 4 }}>
              <Icon name="menu" size={24} />
            </button>
            <span className="simlit-header-crumb" style={{ fontSize: 12, color: theme.textLabel, fontWeight: 600 }}>Dashboard</span>
            <Icon name="chevron_right" size={16} className="simlit-header-crumb" style={{ color: '#0082CA' }} />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pageTitle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLabel, display: 'flex' }}><Icon name="notifications" /></button>
            <div className="simlit-user-name-col" style={{ width: 1, height: 28, background: theme.borderLight }} />
            <div className="simlit-user-name-col" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>{user.name}</div>
                <div style={{ fontSize: 10.5, color: theme.textLabel }}>Administrator</div>
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#eff4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textLabel, flexShrink: 0 }}>
              <Icon name="account_circle" size={26} />
            </div>
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
        <div className="simlit-body-pad" style={{ flex: 1, padding: '28px 32px', minWidth: 0 }}>

          {/* ── VIEW: DASHBOARD ── */}
          {view === 'dashboard' && (
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

              <div className="simlit-page-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>OVERVIEW</div>
                  <h1 className="simlit-page-title" style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: '-0.01em' }}>Dashboard Penelitian</h1>
                  <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0', fontWeight: 500 }}>Monitoring progress, anggaran, dan status penelitian secara menyeluruh.</p>
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
                    <StatCard icon="payments" label="Total Anggaran" value={`Rp ${(stats.totalAnggaran / 1e9).toFixed(2)}M`} sub={formatRp(stats.totalAnggaran)} color={COLORS.accent === '#FFD700' ? '#b8930a' : COLORS.accent} />
                    <StatCard icon="account_balance_wallet" label="Realisasi Anggaran" value={`Rp ${(stats.realisasiAnggaran / 1e9).toFixed(2)}M`} sub={`${stats.totalAnggaran > 0 ? Math.round((stats.realisasiAnggaran / stats.totalAnggaran) * 100) : 0}% dari anggaran`} color={COLORS.info} />
                  </div>

                  <div className="simlit-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
                    {/* AREA CHART */}
                    <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)', minWidth: 0 }}>
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Rata-rata Progress Penelitian</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>Akumulasi progress bulanan dari database</div>
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
                            style={{ background: 'rgba(0,130,202,0.06)', border: '1px solid rgba(0,130,202,0.18)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
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

                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={dashboardProgress} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                          onClick={(data) => { if (data?.activeLabel) setSelectedBulan(prev => prev === data.activeLabel ? null : data.activeLabel); }}
                          style={{ cursor: 'pointer' }}>
                          <defs>
                            <linearGradient id="gradProgress" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0082CA" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#0082CA" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} />
                          <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} domain={[0, 100]} unit="%" />
                          <Tooltip {...tooltipStyle} />
                          <Area type="monotone" dataKey="progress" stroke="#0082CA" strokeWidth={3} fill="url(#gradProgress)" dot={{ r: 5, fill: '#0082CA', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} connectNulls />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* PIE CHART */}
                    <div style={{ position: 'relative', width: '100%', minHeight: 286, flex: 1, minWidth: 0 }}>
                      <AnimatePresence mode="wait">
                        {!showDetailPie ? (
                          <motion.div key="pie-chart-panel"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            onClick={() => getPieData().length > 0 && setShowDetailPie(true)}
                            style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)', cursor: getPieData().length > 0 ? 'pointer' : 'default', height: '100%', boxSizing: 'border-box' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Status Penelitian</div>
                              {getPieData().length > 0 && <span style={{ fontSize: 10, color: '#0082CA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Klik Detail ↗</span>}
                            </div>
                            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 8 }}>Distribusi status aktif</div>
                            <ResponsiveContainer width="100%" height={190}>
                              <PieChart>
                                <Pie data={getPieData()} cx="50%" cy="50%" innerRadius={58} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {getPieData().map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip {...tooltipStyle} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </motion.div>
                        ) : (
                          <motion.div key="pie-detail-panel"
                            initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(0,130,202,0.25)', padding: 24, boxShadow: '0 8px 22px rgba(0,130,202,0.08)', height: '100%', boxSizing: 'border-box' }}>
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

                  {/* TABLE */}
                  <SectionCard title={`Daftar Penelitian (${dataPenelitian.length} total)`}>
                    {dataPenelitian.length === 0 ? (
                      <div style={{ padding: 32, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>Belum ada data penelitian.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: `2px solid #0082CA` }}>
                              {['No','Judul Penelitian','Ketua Peneliti','Progress','Anggaran','Status',''].map((h, idx) => (
                                <th key={h} style={{ ...thStyle, textAlign: idx === 0 ? 'center' : 'left' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dataPenelitian.map((item, i) => (
                              <tr key={item.id}
                                onMouseEnter={e => { e.currentTarget.style.background = theme.rowHover; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}>
                                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: theme.textFaint, fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</td>
                                <td style={{ ...tdStyle, maxWidth: 320 }}>
                                  <div style={{ fontWeight: 700, color: '#0082CA', cursor: 'pointer', fontSize: 13 }} onClick={() => { setSelectedId(item.id); setView('detail'); }}>
                                    {item.nama_penelitian}
                                  </div>
                                  <div style={{ fontSize: 11, color: theme.textLabel, marginTop: 2 }}>{item.bidang_penelitian} · {item.kode_penelitian}</div>
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
                                  {/* Status kini bisa langsung diganti dari Dashboard tanpa perlu masuk ke Detail */}
                                  <StatusSelect value={item.status_penelitian} onChange={(val) => handleUpdateStatus(item.id, val)} />
                                </td>
                                <td style={tdStyle}><Btn variant="secondary" onClick={() => { setSelectedId(item.id); setView('detail'); }}>Detail <Icon name="arrow_forward" size={14} /></Btn></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8a6d00', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>PROYEK AKTIF</div>
                  <h1 className="simlit-page-title" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: 0, maxWidth: 620, lineHeight: 1.3 }}>{targetPenelitian?.nama_penelitian}</h1>
                  <p style={{ fontSize: 12, color: theme.textLabel, margin: '6px 0 0' }}>Ketua: <strong style={{ color: theme.textMuted }}>{targetPenelitian?.ketua_penelitian}</strong> · Skema: {targetPenelitian?.skema_penelitian} · Kode: {targetPenelitian?.kode_penelitian}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setView('dashboard')}><Icon name="arrow_back" size={16} /> Kembali</Btn>
                  <Btn variant="primary" onClick={() => { if (selectedId) setView('kurvas'); }}><Icon name="show_chart" size={16} /> Buka Analisis Kurva S</Btn>
                </div>
              </div>

              {/* Mini stats */}
              <div className="simlit-mini-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[
                  { label: 'Progress Capaian', value: `${targetPenelitian?.progress_rata_rata || 0}%`, color: COLORS.primary, icon: 'trending_up', showBar: true },
                  { label: 'Total RAB', value: formatRp(targetPenelitian?.total_anggaran), color: '#8a6d00', icon: 'payments' },
                  { label: 'Realisasi Dana', value: formatRp(targetPenelitian?.realisasi_anggaran), color: COLORS.success, icon: 'check_circle' },
                  {
                    label: 'Deviasi Kurva S',
                    value: `${kurvaSDeviation > 0 ? '+' : ''}${kurvaSDeviation}%`,
                    color: kurvaSDeviation >= 0 ? COLORS.success : COLORS.danger,
                    icon: 'show_chart',
                    sub: kurvaSDeviation >= 0 ? 'Lebih cepat dari rencana' : 'Tertinggal dari rencana',
                  },
                ].map((c, idx) => {
                  const isHov = hoveredMiniCard === idx;
                  return (
                    <div key={c.label} onMouseEnter={() => setHoveredMiniCard(idx)} onMouseLeave={() => setHoveredMiniCard(null)}
                      style={{
                        background: isHov ? theme.cardHover : theme.card, backdropFilter: 'blur(10px)',
                        borderRadius: 16, padding: '20px 22px', border: `1px solid ${theme.cardBorder}`, borderLeft: `4px solid ${c.color}`,
                        boxShadow: isHov ? '0 12px 28px rgba(11,28,48,0.10)' : '0 4px 12px rgba(11,28,48,0.04)',
                        transform: isHov ? 'translateY(-4px)' : 'translateY(0)', transition: 'all 0.25s ease', cursor: 'default', minWidth: 0,
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</span>
                        <span style={{ width: 32, height: 32, borderRadius: 10, background: `${c.color}1a`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name={c.icon} fill size={18} />
                        </span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: c.color, wordBreak: 'break-word' }}>{c.value}</div>
                      {c.showBar && <div style={{ marginTop: 8 }}><ProgressBar value={targetPenelitian?.progress_rata_rata || 0} color={c.color} height={6} /></div>}
                      {c.sub && <div style={{ marginTop: 8, fontSize: 10.5, color: theme.textMuted, fontWeight: 600 }}>{c.sub}</div>}
                    </div>
                  );
                })}
              </div>

              {/* S-Curve + Info */}
              <div className="simlit-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
                <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)', minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: theme.text }}>Kurva S Kontrol Proyek</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, margin: '4px 0 20px' }}>Rencana Kerja vs Realisasi Fisik</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={getKurvaSData()} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} />
                      <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} />
                      <Tooltip {...tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted }} />
                      <Line name="Rencana Kerja" type="monotone" dataKey="rencana" stroke="#0082CA" strokeWidth={2.5} dot={{ r: 3, fill: '#0082CA' }} />
                      <Line name="Realisasi Fisik" type="monotone" dataKey="realisasi" stroke={COLORS.success} strokeWidth={3} connectNulls dot={{ r: 5, fill: COLORS.success, stroke: '#fff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)', minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: theme.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${theme.borderLight}` }}>Informasi Penelitian</div>
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
                <div className="simlit-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

                  {/* KEGIATAN */}
                  <SectionCard title={`Progress Kegiatan (${listKegiatan.length} rencana · Total bobot ${listKegiatan.reduce((s, k) => s + (Number(k.bobot) || 0), 0).toFixed(1)}%)`}
                    action={<Btn onClick={() => setIsAddingKegiatan(!isAddingKegiatan)} variant={isAddingKegiatan ? 'ghost' : 'primary'}>{isAddingKegiatan ? 'Tutup' : <><Icon name="add" size={14} /> Tambah Kegiatan</>}</Btn>}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr>
                            {['No','Nama Kegiatan','Rentang Waktu','Bobot (%)','Progress','Aksi'].map((h, idx) => (
                              <th key={h} style={{ ...thStyle, textAlign: idx === 0 || idx === 5 ? 'center' : 'left' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {isAddingKegiatan && (
                            <tr style={{ borderBottom: `1px solid ${theme.border}`, background: 'rgba(0,130,202,0.05)' }}>
                              <td style={{ padding: 8, textAlign: 'center', color: '#0082CA', fontWeight: 800 }}>*</td>
                              <td style={{ padding: 8 }}><input type="text" placeholder="Nama kegiatan..." value={kegiatanBaru.nama_kegiatan} onChange={e => setKegiatanBaru({ ...kegiatanBaru, nama_kegiatan: e.target.value })} style={{ ...inlineInput, width: '100%' }} /></td>
                              <td style={{ padding: 8 }}>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <input type="date" value={kegiatanBaru.tanggal_mulai} onChange={e => setKegiatanBaru({ ...kegiatanBaru, tanggal_mulai: e.target.value })} style={{ ...inlineInput, flex: 1 }} />
                                  <span style={{ color: theme.textLabel, fontSize: 10 }}>s/d</span>
                                  <input type="date" value={kegiatanBaru.tanggal_selesai} onChange={e => setKegiatanBaru({ ...kegiatanBaru, tanggal_selesai: e.target.value })} style={{ ...inlineInput, flex: 1 }} />
                                </div>
                              </td>
                              <td style={{ padding: 8 }}>
                                <input type="number" placeholder="0" min="0" max="100" step="0.1" value={kegiatanBaru.bobot ?? ''} onChange={e => setKegiatanBaru({ ...kegiatanBaru, bobot: e.target.value })} style={{ ...inlineInput, width: 64, textAlign: 'center' }} />
                              </td>
                              <td style={{ padding: 8 }}>
                                <input type="number" placeholder="0" min="0" max="100" value={kegiatanBaru.progress || ''} onChange={e => setKegiatanBaru({ ...kegiatanBaru, progress: Number(e.target.value) })} style={{ ...inlineInput, width: 56, textAlign: 'center' }} />
                              </td>
                              <td style={{ padding: 8, textAlign: 'center' }}><Btn variant="success" onClick={handleSaveKegiatan}>Simpan</Btn></td>
                            </tr>
                          )}
                          {listKegiatan.length === 0 && !isAddingKegiatan && (
                            <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: theme.textLabel, fontSize: 12, fontStyle: 'italic' }}>Belum ada data kegiatan.</td></tr>
                          )}
                          {listKegiatan.map((k, i) => (
                            <tr key={k.id} onMouseEnter={e => e.currentTarget.style.background = theme.rowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background .15s' }}>
                              <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: theme.textFaint, fontSize: 11 }}>{i + 1}</td>
                              <td style={{ ...tdStyle, fontWeight: 600, maxWidth: 140 }}>{k.nama_kegiatan}</td>
                              <td style={tdStyle}>
                                <span style={{ background: 'rgba(0,130,202,0.08)', color: '#0082CA', padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid rgba(0,130,202,0.2)' }}>
                                  {fmtDate(k.tanggal_mulai)} → {fmtDate(k.tanggal_selesai)}
                                </span>
                              </td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input type="number" min="0" max="100" step="0.1" value={k.bobot ?? 0} onChange={e => handleUpdateBobot(k.id, e.target.value)} style={{ ...inlineInput, width: 56, textAlign: 'center', fontWeight: 700, color: theme.textMuted }} />
                                  <span style={{ fontSize: 11, color: theme.textLabel }}>%</span>
                                </div>
                              </td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <input type="number" min="0" max="100" value={k.progress || 0} onChange={e => handleUpdateProgress(k.id, e.target.value)} style={{ ...inlineInput, width: 48, textAlign: 'center', fontWeight: 700, color: '#0082CA' }} />
                                  <span style={{ fontSize: 11, color: theme.textLabel }}>%</span>
                                </div>
                              </td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <button onClick={() => handleHapusKegiatan(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, display: 'inline-flex' }}><Icon name="delete" size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>

                  {/* CASHFLOW */}
                  <SectionCard title="Realisasi Anggaran / Cashflow"
                    action={<Btn onClick={() => setIsAddingCashflow(!isAddingCashflow)} variant={isAddingCashflow ? 'ghost' : 'primary'}>{isAddingCashflow ? 'Tutup' : <><Icon name="add" size={14} /> Tambah Transaksi</>}</Btn>}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr>
                            {['Tanggal','Uraian & Kategori','Jumlah','Harga Satuan','Total','Aksi'].map((h, idx) => (
                              <th key={h} style={{ ...thStyle, textAlign: idx === 5 ? 'center' : 'left' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {isAddingCashflow && (
                            <tr style={{ borderBottom: `1px solid ${theme.border}`, background: 'rgba(0,130,202,0.05)' }}>
                              <td style={{ padding: 8 }}><input type="date" value={cashflowBaru.tanggal} onChange={e => setCashflowBaru({ ...cashflowBaru, tanggal: e.target.value })} style={{ ...inlineInput, width: '100%' }} /></td>
                              <td style={{ padding: 8 }}>
                                <input type="text" placeholder="Uraian..." value={cashflowBaru.uraian} onChange={e => setCashflowBaru({ ...cashflowBaru, uraian: e.target.value })} style={{ ...inlineInput, width: '100%', marginBottom: 4 }} />
                                <select value={cashflowBaru.jenis_belanja} onChange={e => setCashflowBaru({ ...cashflowBaru, jenis_belanja: e.target.value })} style={inlineSelect}>
                                  <option value="Alat">Alat / Komponen</option>
                                  <option value="Operasional">Operasional</option>
                                  <option value="Honor">Honorarium</option>
                                  <option value="Perjalanan Dinas">Perjalanan Dinas</option>
                                  <option value="Jasa">Jasa</option>
                                </select>
                              </td>
                              <td style={{ padding: 8 }}>
                                <input type="number" min="1" placeholder="1" value={cashflowBaru.jumlah || ''}
                                  onChange={e => { const val = Number(e.target.value); const hrg = Number(cashflowBaru.harga_satuan) || 0; setCashflowBaru({ ...cashflowBaru, jumlah: val, nominal: val * hrg }); }}
                                  style={{ ...inlineInput, width: '100%' }} />
                              </td>
                              <td style={{ padding: 8 }}>
                                <input type="number" min="0" placeholder="Rp" value={cashflowBaru.harga_satuan || ''}
                                  onChange={e => { const hrg = Number(e.target.value); const jml = Number(cashflowBaru.jumlah) || 0; setCashflowBaru({ ...cashflowBaru, harga_satuan: hrg, nominal: jml * hrg }); }}
                                  style={{ ...inlineInput, width: '100%' }} />
                              </td>
                              <td style={{ padding: 8 }}>
                                <input type="number" placeholder="Rp" readOnly value={cashflowBaru.nominal || ''} style={{ ...inlineInput, width: '100%', opacity: 0.6, cursor: 'not-allowed' }} />
                              </td>
                              <td style={{ padding: 8, textAlign: 'center' }}><Btn variant="success" onClick={handleSaveCashflow}>Simpan</Btn></td>
                            </tr>
                          )}
                          {listCashflow.length === 0 && !isAddingCashflow && (
                            <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: theme.textLabel, fontSize: 12, fontStyle: 'italic' }}>Belum ada transaksi cashflow.</td></tr>
                          )}
                          {listCashflow.map((c, i) => (
                            <tr key={c.id || i} onMouseEnter={e => e.currentTarget.style.background = theme.rowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background .15s' }}>
                              <td style={{ ...tdStyle, color: theme.textMuted, fontSize: 11, whiteSpace: 'nowrap' }}>{c.tanggal}</td>
                              <td style={tdStyle}>
                                <div style={{ fontWeight: 600, color: theme.text }}>{c.uraian}</div>
                                <span style={{ background: 'rgba(0,130,202,0.08)', color: '#0082CA', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, display: 'inline-block', marginTop: 3, border: '1px solid rgba(0,130,202,0.2)' }}>{c.jenis_belanja}</span>
                              </td>
                              <td style={{ ...tdStyle, color: theme.text, textAlign: 'center' }}>{c.jumlah || 1}</td>
                              <td style={{ ...tdStyle, color: theme.text, whiteSpace: 'nowrap' }}>{c.harga_satuan ? formatRp(c.harga_satuan) : '-'}</td>
                              <td style={{ ...tdStyle, fontWeight: 800, color: theme.text, whiteSpace: 'nowrap' }}>{formatRp(c.nominal)}</td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <button onClick={() => handleHapusCashflow(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.danger, display: 'inline-flex' }}><Icon name="delete" size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>FORM INPUT</div>
                  <h1 className="simlit-page-title" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: 0 }}>Tambah Penelitian Baru</h1>
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
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textLabel, display: 'block', marginBottom: 5 }}>Kode Penelitian</label>
                    <input disabled placeholder="Dibuat otomatis (PN-TAHUN-XXX)" style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${theme.border}`, fontSize: 13, color: theme.textLabel, background: theme.input, boxSizing: 'border-box' }} />
                  </div>
                  <Input label="Ketua Peneliti *" type="text" value={formData.ketua_penelitian} onChange={e => setFormData({ ...formData, ketua_penelitian: e.target.value })} placeholder="Masukkan nama ketua peneliti" required />
                  <Input label="Unit Kerja *" type="text" value={formData.unit_kerja} onChange={e => setFormData({ ...formData, unit_kerja: e.target.value })} placeholder="Masukkan unit kerja" required />
                  <Input label="Tanggal Mulai *" type="date" value={formData.tanggal_mulai} onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })} required />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Tanggal Selesai *" type="date" value={formData.tanggal_selesai} onChange={e => setFormData({ ...formData, tanggal_selesai: e.target.value })} required />
                    <Input label="Durasi (Bulan)" type="number" value={formData.durasi_bulan} onChange={e => setFormData({ ...formData, durasi_bulan: Number(e.target.value) })} min="1" />
                  </div>
                  <Input label="Bidang Penelitian *" type="text" value={formData.bidang_penelitian} onChange={e => setFormData({ ...formData, bidang_penelitian: e.target.value })} placeholder="Masukkan bidang penelitian" required />
                  <Input label="Skema Penelitian *" type="text" value={formData.skema_penelitian} onChange={e => setFormData({ ...formData, skema_penelitian: e.target.value })} placeholder="Masukkan skema penelitian" required />
                  <Input label="Sumber Pendanaan *" type="text" value={formData.sumber_pendanaan} onChange={e => setFormData({ ...formData, sumber_pendanaan: e.target.value })} placeholder="Masukkan sumber pendanaan" required />
                  <Select label="Tahun Anggaran *" value={formData.tahun_anggaran} onChange={e => setFormData({ ...formData, tahun_anggaran: Number(e.target.value) })} required>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </Select>
                </div>
              </div>

              {/* SECTION B - RAB (Total dihitung otomatis dari rincian & tersinkron ke Dashboard) */}
              <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, padding: 24, boxShadow: '0 4px 12px rgba(11,28,48,0.04)' }}>
                <div className="simlit-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,130,202,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0082CA', flexShrink: 0 }}><Icon name="payments" fill size={18} /></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>B. Rincian RAB</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>Total: <strong style={{ color: theme.text }}>{formatRp(formData.total_anggaran)}</strong> <span style={{ color: theme.textLabel }}>(otomatis, langsung tampil di Dashboard)</span></div>
                    </div>
                  </div>
                  <Btn type="button" variant="secondary" onClick={() => setRincianRab([...rincianRab, { tanggal: '', uraian: '', jenis_belanja: 'Alat', jumlah: 1, harga_satuan: 0, nominal: 0 }])}><Icon name="add" size={14} /> Tambah Item</Btn>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 760 }}>
                    <thead>
                      <tr>
                        {['Estimasi Tanggal','Uraian / Deskripsi','Jenis Kategori','Jumlah','Harga Satuan (Rp)','Total (Rp)',''].map(h => (
                          <th key={h} style={{ ...thStyle, textAlign: 'left' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rincianRab.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: '8px 10px' }}><input type="date" required value={row.tanggal} onChange={e => handleRabChange(i, 'tanggal', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}><input type="text" required placeholder="Deskripsi item..." value={row.uraian} onChange={e => handleRabChange(i, 'uraian', e.target.value)} style={{ ...inlineInput, width: '100%' }} /></td>
                          <td style={{ padding: '8px 10px' }}>
                            <select value={row.jenis_belanja} onChange={e => handleRabChange(i, 'jenis_belanja', e.target.value)} style={inlineSelect}>
                              <option value="Alat">Bahan &amp; Komponen</option>
                              <option value="Operasional">Operasional</option>
                              <option value="Honor">Honorarium</option>
                              <option value="Perjalanan Dinas">Perjalanan Dinas</option>
                              <option value="Jasa">Jasa</option>
                            </select>
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
                      <div style={{ fontSize: 13, fontWeight: 800, color: theme.text }}>C. Distribusi Kegiatan &amp; Bobot Kurva S</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
                        Bobot: <strong style={{ color: '#0082CA' }}>Diisi manual per kegiatan</strong> · Total bobot:{' '}
                        <strong style={{ color: Math.round(totalBobotKegiatan * 10) / 10 === 100 ? COLORS.success : COLORS.danger }}>
                          {totalBobotKegiatan.toFixed(1)}%
                        </strong>{' '}
                        <span style={{ color: theme.textLabel }}>(idealnya 100%)</span>
                        {' · '}Progres keseluruhan penelitian:{' '}
                        <strong style={{ color: '#0082CA' }}>{weightedProgressAwal.toFixed(1)}%</strong>
                      </div>
                    </div>
                  </div>
                  <Btn type="button" variant="secondary" onClick={() => setRincianKegiatan([...rincianKegiatan, { nama_kegiatan: '', tanggal_mulai: '', tanggal_selesai: '', bobot: 0, progress: 0 }])}><Icon name="add" size={14} /> Tambah Kegiatan</Btn>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
                    <thead>
                      <tr>
                        {['Nama Kegiatan','Tgl Mulai','Tgl Selesai','Bobot (%)','Progress Awal (%)',''].map(h => (
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
                            <input type="number" min="0" max="100" placeholder="0" value={row.progress ?? ''} onChange={e => handleKegiatanChange(i, 'progress', e.target.value)} style={{ ...inlineInput, width: '100%', textAlign: 'center', fontWeight: 700, color: theme.textMuted }} />
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
                onBack={() => setView('detail')}
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
          {view === 'jadwal' && <JadwalMonitoring />}
        </div>
      </div>
    </div>
  );
}
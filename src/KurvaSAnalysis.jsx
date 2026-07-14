import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area,
  ComposedChart
} from 'recharts';
import { theme, COLORS, Icon } from './theme';

// ── HELPERS ───────────────────────────────────────────────────────────────
const fmtRp      = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const fmtRpShort = (n) => {
  const v = Number(n || 0);
  if (v >= 1e9) return `Rp ${(v / 1e9).toFixed(2)}M`;
  if (v >= 1e6) return `Rp ${(v / 1e6).toFixed(1)}Jt`;
  return fmtRp(v);
};
const fmtPct  = (n) => `${(+n || 0).toFixed(1)}%`;
const fmtDate = (s) => {
  if (!s) return '-';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
const daysBetween = (a, b) => {
  if (!a || !b) return 0;
  return Math.max(0, Math.ceil((new Date(b) - new Date(a)) / 86400000) + 1);
};
// Bobot kegiatan sebaiknya berbasis ANGGARAN (nilai_rencana / total BAC),
// sesuai standar EVM — bukan proporsi durasi hari. Proporsi durasi hanya
// dipakai sebagai fallback kalau kegiatan itu belum punya alokasi RAB sama
// sekali (nilai_rencana masih 0), supaya kurva tetap bisa digambar.
const bobotKegiatan = (k, BAC, totalDays) => {
  const nilaiRencana = Number(k.nilai_rencana) || 0;
  if (BAC > 0 && nilaiRencana > 0) return (nilaiRencana / BAC) * 100;
  const days = daysBetween(k.tanggal_mulai, k.tanggal_selesai);
  if (totalDays > 0) return (days / totalDays) * 100;
  return Number(k.bobot) || 0;
};

const GANTT_MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: `1px solid ${theme.cardBorder}`, background: theme.tooltipBg, color: theme.text, fontSize: 12, backdropFilter: 'blur(16px)', boxShadow: '0 12px 32px rgba(11,28,48,0.18)' },
  labelStyle: { color: theme.textMuted, fontWeight: 700, marginBottom: 4 },
  itemStyle: { color: theme.text, fontSize: 12 },
};

// ── GLASS TOKENS ─────────────────────────────────────────────────────────
const glass = {
  background: 'linear-gradient(180deg, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.38) 100%)',
  backdropFilter: 'blur(18px) saturate(180%)',
  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 8px 28px rgba(11,28,48,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
};
const glassHover = {
  boxShadow: '0 16px 36px rgba(11,28,48,0.13), inset 0 1px 0 rgba(255,255,255,0.7)',
};

// ── CHART DEFS: gradients + drop-shadow filters for a "3D" feel ───────────
// Satu blok <defs> dipakai ulang di tiap chart supaya bar/area/line terlihat
// punya kedalaman (highlight di atas, gradasi turun ke bawah, dan shadow
// lembut mengambang) — bukan flat-fill datar seperti sebelumnya.
const ChartDefs = () => (
  <defs>
    <linearGradient id="gradPrimary3d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#4FB6F5" stopOpacity={1} />
      <stop offset="55%" stopColor={COLORS.primary} stopOpacity={1} />
      <stop offset="100%" stopColor="#04527a" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="gradSuccess3d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#6EE7A8" stopOpacity={1} />
      <stop offset="55%" stopColor={COLORS.success} stopOpacity={1} />
      <stop offset="100%" stopColor="#0f7a3d" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="gradGold3d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f2d377" stopOpacity={1} />
      <stop offset="55%" stopColor="#b8930a" stopOpacity={1} />
      <stop offset="100%" stopColor="#7a5f05" stopOpacity={1} />
    </linearGradient>
    <linearGradient id="gradEVlight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.42} />
      <stop offset="60%" stopColor={COLORS.success} stopOpacity={0.12} />
      <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
    </linearGradient>
    <linearGradient id="gradPlanLight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.26} />
      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
    </linearGradient>
    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0B1C30" floodOpacity="0.22" />
    </filter>
    <filter id="lineGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0B1C30" floodOpacity="0.28" />
    </filter>
  </defs>
);

// ── SECTION CARD (glass + judul rata tengah & responsif) ───────────────────
const SectionCard = ({ title, sub, children, action }) => (
  <div style={{
    ...glass,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  }}>
    <div style={{
      padding: '18px 20px',
      borderBottom: `1px solid ${theme.borderLight}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 4,
      position: 'relative',
    }}>
      <span style={{
        fontWeight: 700,
        fontSize: 'clamp(12px, 1.4vw, 13.5px)',
        color: theme.text,
        letterSpacing: '0.02em',
      }}>{title}</span>
      {sub && (
        <div style={{
          fontSize: 'clamp(10.5px, 1.2vw, 11.5px)',
          color: theme.textMuted,
          fontWeight: 500,
          maxWidth: 560,
          lineHeight: 1.5,
        }}>{sub}</div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
    {children}
  </div>
);

// ── METRIC CARD (glass, konten rata tengah, mengisi penuh lebar sel grid) ──
const MetCard = ({ icon, label, value, sub, color, trend, status }) => {
  const [hover, setHover] = useState(false);
  // Aturan warna teks: hitam secara default. Hanya jadi hijau (baik/naik)
  // atau merah (buruk/turun) kalau kartu memang menandakan status kinerja
  // lewat prop `status`. Warna `color` tetap dipakai untuk aksen dekoratif
  // (garis atas & ikon), bukan untuk teks/angka.
  const valueColor = status === 'good' ? COLORS.success : status === 'bad' ? COLORS.danger : theme.text;
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        ...glass,
        ...(hover ? glassHover : {}),
        borderRadius: 18, padding: '20px 16px',
        transition: 'all 0.25s ease',
        cursor: 'default',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 7,
        borderTop: `3px solid ${color}`,
        minWidth: 0,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }}>
      <span style={{
        width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 11, background: `${color}1a`, color, flexShrink: 0,
        boxShadow: `inset 0 0 0 1px ${color}33`,
      }}>
        <Icon name={icon} fill size={19} />
      </span>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>{label}</span>
      <div style={{ fontSize: 19, fontWeight: 800, color: valueColor, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: theme.textMuted, fontWeight: 600 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: 10.5, fontWeight: 700, color: trend >= 0 ? COLORS.success : COLORS.danger }}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% {trend >= 0 ? 'lebih cepat' : 'terlambat'}
        </div>
      )}
    </div>
  );
};

// ── TAB BUTTON (matches App.jsx Btn / NavItem language) ────────────────────
const TabBtn = ({ id, label, icon, active, onClick }) => (
  <button onClick={onClick}
    style={{
      background: active ? theme.navActive : 'transparent',
      color: active ? COLORS.primary : theme.textLabel,
      border: active ? `1px solid rgba(0,130,202,0.30)` : `1px solid transparent`,
      padding: '8px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.navHover; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
    <Icon name={icon} size={15} fill={active} /> {label}
  </button>
);

const thStyle = { padding: '12px 14px', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: 'rgba(239,244,255,0.6)', textAlign: 'center' };
const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, textAlign: 'center' };
const tdLeftStyle = { ...tdStyle, textAlign: 'left' };

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${theme.border}`,
  background: 'rgba(255,255,255,0.7)', fontSize: 12.5, color: theme.text, boxSizing: 'border-box',
  outline: 'none',
};
const labelStyle = { fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };

// ── GANTT CHART ──────────────────────────────────────────────────────────
const GanttChart = ({ kegiatan, tahun, BAC }) => {
  const [hovRow, setHovRow] = useState(null);

  if (!kegiatan || kegiatan.length === 0) {
    return <div style={{ padding: 32, textAlign: 'center', color: theme.textLabel, fontSize: 13, fontStyle: 'italic' }}>Belum ada data kegiatan untuk ditampilkan.</div>;
  }

  const now = new Date();
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();
  const yr = Number(tahun) || nowYear;
  const totalDays = kegiatan.reduce((t, k) => t + daysBetween(k.tanggal_mulai, k.tanggal_selesai), 0);

  const rows = kegiatan.map((k, idx) => {
    const start = new Date(k.tanggal_mulai);
    const end = new Date(k.tanggal_selesai);
    const days = daysBetween(k.tanggal_mulai, k.tanggal_selesai);
    const bobot = bobotKegiatan(k, BAC, totalDays);
    const progress = Number(k.progress) || 0;
    const startMonth = start.getMonth() + (start.getFullYear() - yr) * 12;
    const endMonth = end.getMonth() + (end.getFullYear() - yr) * 12;
    const leftPct = Math.max(0, (startMonth / 12) * 100);
    const widthPct = Math.min(100 - leftPct, ((endMonth - startMonth + 1) / 12) * 100);
    const statusColor = progress === 100 ? COLORS.success : progress > 0 ? COLORS.primary : theme.textFaint;
    return { ...k, idx, bobot, progress, leftPct, widthPct, statusColor, days };
  });

  const todayLeftPct = yr === nowYear ? (nowMonth / 12) * 100 : -1;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 56px 56px 1fr', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 14px', borderBottom: `1px solid ${theme.borderLight}`, minWidth: 700, background: 'rgba(239,244,255,0.6)', textAlign: 'center' }}>
        <span>Nama Kegiatan</span>
        <span style={{ textAlign: 'center' }}>Bobot</span>
        <span style={{ textAlign: 'center' }}>Progress</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', paddingLeft: 8 }}>
          {GANTT_MONTHS.map(m => <span key={m} style={{ textAlign: 'center' }}>{m}</span>)}
        </div>
      </div>

      {rows.map((row) => (
        <div key={row.id || row.idx} onMouseEnter={() => setHovRow(row.idx)} onMouseLeave={() => setHovRow(null)}
          style={{ display: 'grid', gridTemplateColumns: '220px 56px 56px 1fr', alignItems: 'center', padding: '10px 14px', borderBottom: `1px solid ${theme.border}`, background: hovRow === row.idx ? theme.rowHover : 'transparent', transition: 'background 0.15s', minWidth: 700 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>{row.nama_kegiatan}</div>
            <div style={{ fontSize: 10, color: theme.textLabel, marginTop: 2 }}>{fmtDate(row.tanggal_mulai)} → {fmtDate(row.tanggal_selesai)} ({row.days} hari)</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#8a6d00' }}>{row.bobot.toFixed(1)}%</div>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 800, color: row.progress === 100 ? COLORS.success : row.progress > 0 ? COLORS.primary : theme.textLabel }}>{row.progress}%</div>
          <div style={{ position: 'relative', height: 26, marginLeft: 8 }}>
            {GANTT_MONTHS.map((_, i) => (
              <div key={i} style={{ position: 'absolute', left: `${(i / 12) * 100}%`, top: 0, bottom: 0, width: 1, background: i === 0 ? 'transparent' : theme.border }} />
            ))}
            {todayLeftPct >= 0 && todayLeftPct <= 100 && (
              <div style={{ position: 'absolute', left: `${todayLeftPct}%`, top: -2, bottom: -2, width: 1.5, background: COLORS.danger, zIndex: 5, opacity: 0.7 }} />
            )}
            {row.leftPct >= 0 && row.leftPct < 100 && (
              <div style={{ position: 'absolute', left: `${row.leftPct}%`, width: `${row.widthPct}%`, height: 16, top: 5, borderRadius: 99, background: theme.input, border: `1px solid ${theme.borderLight}` }} />
            )}
            {row.leftPct >= 0 && row.leftPct < 100 && row.progress > 0 && (
              <div style={{ position: 'absolute', left: `${row.leftPct}%`, width: `${row.widthPct * (row.progress / 100)}%`, height: 16, top: 5, borderRadius: 99, background: `linear-gradient(180deg, ${row.statusColor}, ${row.statusColor}cc)`, boxShadow: `0 2px 6px ${row.statusColor}66`, transition: 'width 0.8s ease' }} />
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 20, padding: '10px 14px', borderTop: `1px solid ${theme.borderLight}`, fontSize: 11, color: theme.textLabel, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, borderRadius: 4, background: theme.input, border: `1px solid ${theme.borderLight}`, display: 'inline-block' }} /> Rencana</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, borderRadius: 4, background: COLORS.primary, display: 'inline-block' }} /> Berjalan</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 18, height: 8, borderRadius: 4, background: COLORS.success, display: 'inline-block' }} /> Selesai</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 2, height: 14, background: COLORS.danger, display: 'inline-block' }} /> Hari ini</span>
      </div>
    </div>
  );
};

// ── KURVA S TOOLTIP ────────────────────────────────────────────────────────
const KurvaSTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${theme.cardBorder}`, background: theme.tooltipBg, color: theme.text, fontSize: 12, backdropFilter: 'blur(16px)', padding: '10px 14px', minWidth: 190, boxShadow: '0 12px 32px rgba(11,28,48,0.18)' }}>
      <div style={{ fontWeight: 800, marginBottom: 8, color: '#8a6d00', fontSize: 13, textAlign: 'center' }}>{label}</div>
      {payload.map((p, i) => p.value !== null && p.value !== undefined && (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
          <span style={{ color: theme.text, fontWeight: 800 }}>{fmtPct(p.value)}</span>
        </div>
      ))}
      {payload.length >= 2 && payload[0]?.value != null && payload[1]?.value != null && (
        <div style={{ borderTop: `1px solid ${theme.borderLight}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: theme.textLabel, fontSize: 11 }}>Deviasi</span>
          <span style={{ fontWeight: 800, fontSize: 12, color: (payload[1].value - payload[0].value) >= 0 ? COLORS.success : COLORS.danger }}>
            {(payload[1].value - payload[0].value) >= 0 ? '+' : ''}{fmtPct(payload[1].value - payload[0].value)}
          </span>
        </div>
      )}
    </div>
  );
};

// Small local progress bar (matches App.jsx ProgressBar visual language)
const ProgressBarLocal = ({ value, color = COLORS.primary, height = 6 }) => {
  const [width, setWidth] = React.useState(0);
  const safeValue = Math.min(Math.max(value || 0, 0), 130);
  React.useEffect(() => { const t = setTimeout(() => setWidth(safeValue), 80); return () => clearTimeout(t); }, [safeValue]);
  return (
    <div style={{ background: '#e5eeff', borderRadius: 99, height, overflow: 'hidden', width: '100%', boxShadow: 'inset 0 1px 2px rgba(11,28,48,0.12)' }}>
      <div style={{ width: `${Math.min(width, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 6px ${color}77` }} />
    </div>
  );
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────────
// Props:
//   cashflow      : daftar transaksi RAB dari App.jsx
//                   [{ id, tanggal, uraian, jenis_belanja, jumlah, harga_satuan, nominal }]
//   kegiatan      : membawa nilai bobot, progress, total_anggaran &
//                   realisasi_anggaran langsung dari DB
//   realisasiRAB  : daftar pengeluaran aktual per RAB per kegiatan, diambil
//                   LANGSUNG dari database oleh parent (App.jsx) —
//                   [{ id, rab_id, kegiatan_id, nominal, tanggal, keterangan }].
//                   Komponen ini TIDAK menyimpan salinan lokal dari data ini
//                   (fully controlled) supaya tidak ada risiko state lokal
//                   "basi"/tidak sinkron dengan database.
//   onAddRealisasi(entry) : async — dipanggil saat user submit form Tambah
//                   Realisasi. Parent bertanggung jawab POST ke API lalu
//                   refetch data (supaya `realisasiRAB` di atas ter-update).
//   onDeleteRealisasi(id) : async — dipanggil saat user hapus 1 entri
//                   realisasi. Parent bertanggung jawab DELETE ke API lalu
//                   refetch data.

export default function KurvaSAnalysis({
  penelitian, kegiatan = [], cashflow = [], rab: rabProp = [],
  realisasiRAB = [], onAddRealisasi, onDeleteRealisasi, onBack,
  allowedTabs = ['kurva', 'gantt', 'input', 'ev', 'cashflow', 'progress'],
  eyebrow = 'Analisis Kurva S',
}) {
  // Data RAB nyata di aplikasi ini dikirim dari App.jsx sebagai prop
  // `cashflow` (daftar transaksi: { id, tanggal, uraian, jenis_belanja,
  // jumlah, harga_satuan, nominal }) — bukan `rab`/`rabAlokasi` yang
  // dipakai versi lama komponen ini. Tidak ada tabel alokasi RAB per
  // kegiatan terpisah; setiap kegiatan punya field `total_anggaran` dan
  // `realisasi_anggaran` sendiri. Prop `rab` tetap diterima sebagai
  // fallback untuk kompatibilitas mundur.
  const rab = cashflow.length > 0 ? cashflow : rabProp;
  const [activeTab, setActiveTab] = useState(allowedTabs[0] || 'kurva');

  // form input realisasi
  const [formKegiatanId, setFormKegiatanId] = useState('');
  const [formRabId, setFormRabId] = useState('');
  const [formNominal, setFormNominal] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [filterKegiatanId, setFilterKegiatanId] = useState('all');
  const [formError, setFormError] = useState('');
  const [savingRealisasi, setSavingRealisasi] = useState(false);

  // `realisasiRAB` sekarang murni prop dari parent (sudah tersambung
  // database) — komponen ini hanya MEMINTA perubahan lewat onAddRealisasi /
  // onDeleteRealisasi, lalu menunggu parent refetch & mengirim prop baru.
  // Ini menghindari state lokal yang bisa "hilang" saat refresh (karena
  // sebelumnya tidak pernah benar-benar tersimpan ke DB).
  const handleAddRealisasi = async () => {
    if (!formKegiatanId) return setFormError('Pilih kegiatan terlebih dahulu.');
    if (!formRabId) return setFormError('Pilih item RAB terlebih dahulu.');
    const nominal = Number(formNominal);
    if (!nominal || nominal <= 0) return setFormError('Nominal realisasi harus lebih dari 0.');
    if (!formTanggal) return setFormError('Tanggal realisasi wajib diisi.');
    if (!onAddRealisasi) return setFormError('Fitur simpan realisasi belum terhubung ke server.');
    setFormError('');
    const entry = {
      kegiatan_id: formKegiatanId,
      rab_id: formRabId,
      nominal,
      tanggal: formTanggal,
      keterangan: formKeterangan.trim(),
    };
    setSavingRealisasi(true);
    try {
      await onAddRealisasi(entry);
      setFormNominal('');
      setFormKeterangan('');
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan realisasi ke server.');
    } finally {
      setSavingRealisasi(false);
    }
  };

  const handleDeleteRealisasi = async (id) => {
    if (!onDeleteRealisasi) return;
    try {
      await onDeleteRealisasi(id);
    } catch (err) {
      alert('❌ ' + (err.message || 'Gagal menghapus realisasi.'));
    }
  };

  // Data ini SELALU berasal dari input user (tidak ada lagi asumsi AC = EV
  // begitu setidaknya satu realisasi sudah diinput).
// AC sekarang dihitung dari total field `realisasi_anggaran` yang diisi
// langsung per kegiatan (di kartu Progress Kegiatan) — sumber utama yang
// user maksud sebagai "realisasi anggaran". Entri detail di tab "Input
// Realisasi RAB" (realisasiRAB) tetap dipakai untuk breakdown per-item RAB,
// tapi TIDAK lagi jadi sumber AC utama supaya kedua angka konsisten.
  const totalRealisasiKegiatan = useMemo(
    () => kegiatan.reduce((s, k) => s + Number(k.realisasi_anggaran || 0), 0),
    [kegiatan]
  );
  const hasRealActualData = totalRealisasiKegiatan > 0;
  const totalACActual = totalRealisasiKegiatan;

  const realisasiPerKegiatan = useMemo(() => {
    const map = {};
    realisasiRAB.forEach(r => {
      map[r.kegiatan_id] = (map[r.kegiatan_id] || 0) + Number(r.nominal || 0);
    });
    return map;
  }, [realisasiRAB]);

  const ev = useMemo(() => {
    const rabTotal = rab.reduce((s, r) => s + Number(r.nominal || 0), 0);
    const BAC = Number(penelitian?.total_anggaran || rabTotal || 0);
    const totalDays = kegiatan.reduce((t, k) => t + daysBetween(k.tanggal_mulai, k.tanggal_selesai), 0);
    let pvPct = 0, evPct = 0;
    const nowDate = new Date();

    kegiatan.forEach(k => {
      if (!k.tanggal_mulai || !k.tanggal_selesai) return;
      const days = daysBetween(k.tanggal_mulai, k.tanggal_selesai);
      const bobot = bobotKegiatan(k, BAC, totalDays);
      const prog = Number(k.progress) || 0;
      const start = new Date(k.tanggal_mulai);
      const end = new Date(k.tanggal_selesai);
      if (nowDate >= start) {
        if (nowDate >= end) pvPct += bobot;
        else {
          const elapsed = daysBetween(k.tanggal_mulai, nowDate.toISOString().slice(0, 10));
          pvPct += bobot * (elapsed / days);
        }
      }
      evPct += bobot * (prog / 100);
    });

    const PV = (pvPct / 100) * BAC;
    const EV = (evPct / 100) * BAC;

    // AC (Actual Cost): begitu user sudah menginput minimal satu realisasi
    // RAB per kegiatan, AC dihitung dari data input tersebut (nyata, bukan
    // asumsi). Selama belum ada input sama sekali, AC diestimasi = EV
    // supaya kurva tetap bisa ditampilkan, dengan catatan di UI.
    const AC = hasRealActualData ? totalACActual : EV;

    const SV = EV - PV;
    const CV = EV - AC;
    const SPI = PV > 0 ? EV / PV : 0;
    const CPI = AC > 0 ? EV / AC : 0;
    const EAC = CPI > 0 ? BAC / CPI : BAC;
    const ETC = EAC - AC;
    const VAC = BAC - EAC;
    const TCPI = (BAC - EV) > 0 ? (BAC - EV) / (BAC - AC) : 0;

    return { BAC, PV, EV, AC, SV, CV, SPI, CPI, EAC, ETC, VAC, TCPI, pvPct, evPct, acPct: BAC > 0 ? (AC / BAC) * 100 : 0 };
  }, [penelitian, kegiatan, rab, hasRealActualData, totalACActual]);

  const kurvaSData = useMemo(() => {
    const yr = Number(penelitian?.tahun_anggaran) || new Date().getFullYear();
    const nowDate = new Date();
    const nowMonth = nowDate.getMonth();
    const nowYear = nowDate.getFullYear();
    const totalDays = kegiatan.reduce((t, k) => t + daysBetween(k.tanggal_mulai, k.tanggal_selesai), 0);
    let accR = 0, accA = 0;

    return GANTT_MONTHS.map((name, i) => {
      let rBulan = 0, aBulan = 0;
      kegiatan.forEach(k => {
        if (!k.tanggal_mulai || !k.tanggal_selesai) return;
        const days = daysBetween(k.tanggal_mulai, k.tanggal_selesai);
        const bobot = bobotKegiatan(k, ev.BAC, totalDays);
        const prog = Number(k.progress) || 0;
        const start = new Date(k.tanggal_mulai);
        const end = new Date(k.tanggal_selesai);
        const sMonth = start.getMonth() + (start.getFullYear() - yr) * 12;
        const eMonth = end.getMonth() + (end.getFullYear() - yr) * 12;
        const totalM = (eMonth - sMonth) + 1;
        if (i >= sMonth && i <= eMonth && totalM > 0) {
          const share = bobot / totalM;
          rBulan += share;
          aBulan += share * (prog / 100);
        }
      });
      accR += rBulan; accA += aBulan;
      const isPast = yr < nowYear || (yr === nowYear && i <= nowMonth);
      return {
        name,
        rencana: Math.min(Math.round(accR * 10) / 10, 100),
        realisasi: isPast ? Math.min(Math.round(accA * 10) / 10, 100) : null,
        deviasi: isPast ? Math.min(Math.round((accA - accR) * 10) / 10, 100) : null,
      };
    });
  }, [penelitian, kegiatan, ev.BAC]);

  // Realisasi ANGGARAN bulanan: kalau user sudah menginput data realisasi
  // RAB nyata (dengan tanggal), pakai itu langsung — bukan estimasi lagi.
  // Kalau belum ada input sama sekali, jatuh ke estimasi lama (diturunkan
  // dari progres fisik) supaya grafik tetap informatif.
  const realisasiMonthly = useMemo(() => {
    const BAC = ev.BAC;
    const yr = Number(penelitian?.tahun_anggaran) || new Date().getFullYear();

    if (hasRealActualData) {
      const perMonth = Array(12).fill(0);
      realisasiRAB.forEach(r => {
        if (!r.tanggal) return;
        const d = new Date(r.tanggal);
        if (isNaN(d) || d.getFullYear() !== yr) return;
        perMonth[d.getMonth()] += Number(r.nominal || 0);
      });
      let kumulatif = 0;
      return GANTT_MONTHS.map((name, i) => {
        kumulatif += perMonth[i];
        return { name, realisasi: perMonth[i], kumulatif };
      });
    }

    let prevKum = 0;
    return kurvaSData.map(d => {
      const kumulatif = d.realisasi !== null ? (d.realisasi / 100) * BAC : prevKum;
      const bulanan = Math.max(kumulatif - prevKum, 0);
      prevKum = kumulatif;
      return { name: d.name, realisasi: bulanan, kumulatif };
    });
  }, [kurvaSData, ev.BAC, realisasiRAB, hasRealActualData, penelitian]);

  const progressData = useMemo(() => {
    const totalDays = kegiatan.reduce((t, k) => t + daysBetween(k.tanggal_mulai, k.tanggal_selesai), 0);
    return kegiatan.map(k => {
      const bobot = parseFloat(bobotKegiatan(k, ev.BAC, totalDays).toFixed(1));
      const prog = Number(k.progress) || 0;
      return {
        name: k.nama_kegiatan?.length > 22 ? k.nama_kegiatan.slice(0, 20) + '…' : k.nama_kegiatan,
        bobot, progress: prog,
        earned: parseFloat((bobot * prog / 100).toFixed(2)),
        gap: parseFloat((bobot - bobot * prog / 100).toFixed(2)),
      };
    });
  }, [kegiatan, ev.BAC]);

  // Breakdown DETAIL per item RAB (barang) → dipakai di kegiatan mana saja,
  // berapa realisasinya per kegiatan, dibandingkan dengan rencana (nominal
  // RAB item itu sendiri). Ini yang dipakai di tabel "Breakdown per Item RAB".
  const rabItemBreakdown = useMemo(() => {
    return rab.map(r => {
      const rencana = Number(r.nominal || 0);
      const entriesForItem = realisasiRAB.filter(e => e.rab_id === r.id);
      const perKegiatan = entriesForItem.reduce((acc, e) => {
        const kegNama = kegiatan.find(k => k.id === e.kegiatan_id)?.nama_kegiatan || '—';
        const key = e.kegiatan_id || '—';
        if (!acc[key]) acc[key] = { nama: kegNama, nominal: 0 };
        acc[key].nominal += Number(e.nominal || 0);
        return acc;
      }, {});
      const rincian = Object.values(perKegiatan).sort((a, b) => b.nominal - a.nominal);
      const totalRealisasi = rincian.reduce((s, x) => s + x.nominal, 0);
      const sisa = rencana - totalRealisasi;
      return { id: r.id, uraian: r.uraian || '—', kategori: r.jenis_belanja || 'Lainnya', rencana, rincian, totalRealisasi, sisa };
    }).sort((a, b) => b.rencana - a.rencana);
  }, [rab, realisasiRAB, kegiatan]);

  // Breakdown realisasi per KATEGORI (jenis_belanja). Kalau sudah ada input
  // realisasi nyata, dihitung langsung dari nominal yang diinput user (per
  // jenis_belanja item RAB-nya). Kalau belum, jatuh ke breakdown RAB
  // (cashflow) itu sendiri sebagai estimasi rencana per kategori.
  const kategoriBreakdown = useMemo(() => {
    const map = {};
    if (hasRealActualData) {
      realisasiRAB.forEach(r => {
        const rabItem = rab.find(x => x.id === r.rab_id);
        const kat = rabItem?.jenis_belanja || 'Lainnya';
        map[kat] = (map[kat] || 0) + Number(r.nominal || 0);
      });
      return map;
    }
    rab.forEach(r => {
      const kat = r.jenis_belanja || 'Lainnya';
      map[kat] = (map[kat] || 0) + Number(r.nominal || 0);
    });
    return map;
  }, [rab, realisasiRAB, hasRealActualData]);

  // Ringkasan rencana vs realisasi AKTUAL per kegiatan (untuk tab input).
  // "Rencana" diambil dari field total_anggaran milik kegiatan itu sendiri
  // (diisi di form Progress Kegiatan), karena tidak ada tabel alokasi RAB
  // per kegiatan yang terpisah di aplikasi ini.
// Ringkasan per kegiatan sekarang konsisten dengan AC: realisasi diambil
// dari field realisasi_anggaran yang diisi langsung di kartu Progress
// Kegiatan, bukan dari entri detail realisasiRAB.
  const ringkasanPerKegiatan = useMemo(() => {
    return kegiatan.map(k => {
      const rencana = Number(k.total_anggaran) || 0;
      const realisasi = Number(k.realisasi_anggaran) || 0;
      const sisa = rencana - realisasi;
      const pct = rencana > 0 ? (realisasi / rencana) * 100 : 0;
      return { id: k.id, nama: k.nama_kegiatan, progress: Number(k.progress) || 0, rencana, realisasi, sisa, pct };
    });
  }, [kegiatan]);

  // Opsi item RAB untuk form input: tampilkan semua transaksi RAB (cashflow)
  // yang ada, karena tidak ada relasi alokasi per kegiatan di data model ini.
  const rabOptionsForForm = useMemo(() => {
    return rab.map(r => ({ ...r, rencana: Number(r.nominal || 0) }));
  }, [rab]);

  const entriesForTable = useMemo(() => {
    const list = filterKegiatanId === 'all' ? realisasiRAB : realisasiRAB.filter(r => r.kegiatan_id === filterKegiatanId);
    return [...list].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [realisasiRAB, filterKegiatanId]);

  const evStatus = (val, threshold = 1) => val >= threshold ? COLORS.success : COLORS.danger;

  const kegiatanName = (id) => kegiatan.find(k => k.id === id)?.nama_kegiatan || '—';
  const rabName = (id) => rab.find(r => r.id === id)?.uraian || rab.find(r => r.id === id)?.jenis_belanja || '—';

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 22, boxSizing: 'border-box' }}>
      <style>{`
        @media (max-width: 680px) {
          .kurva-ev-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 420px) {
          .kurva-ev-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* HEADER (matches App.jsx 'detail' view header pattern) */}
      <div className="simlit-page-actions" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', gap: 12 }}>
        <span />
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{eyebrow}</div>
          <h1 className="simlit-page-title" style={{
            fontSize: 'clamp(17px, 2.6vw, 21px)',
            fontWeight: 600,
            color: theme.text,
            margin: 0,
            lineHeight: 1.45,
            letterSpacing: '0.015em',
          }}>{penelitian?.nama_penelitian}</h1>
          <p style={{ fontSize: 12, color: theme.textLabel, margin: '8px 0 0', letterSpacing: '0.01em' }}>Ketua: <strong style={{ color: theme.textMuted }}>{penelitian?.ketua_penelitian}</strong> · Kode: {penelitian?.kode_penelitian}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onBack}
            style={{ background: 'rgba(0,130,202,0.08)', color: '#0082CA', border: '1px solid rgba(0,130,202,0.25)', padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <Icon name="arrow_back" size={16} /> Kembali ke Detail
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION (glass) */}
      <div style={{ ...glass, borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto', justifyContent: 'center' }}>
        {allowedTabs.includes('kurva') && <TabBtn id="kurva" label="Kurva S Control" icon="show_chart" active={activeTab === 'kurva'} onClick={() => setActiveTab('kurva')} />}
        {allowedTabs.includes('gantt') && <TabBtn id="gantt" label="Gantt Chart" icon="calendar_month" active={activeTab === 'gantt'} onClick={() => setActiveTab('gantt')} />}
        {allowedTabs.includes('input') && <TabBtn id="input" label="Input Realisasi RAB" icon="edit_note" active={activeTab === 'input'} onClick={() => setActiveTab('input')} />}
        {allowedTabs.includes('ev') && <TabBtn id="ev" label="Earned Value Analysis" icon="insights" active={activeTab === 'ev'} onClick={() => setActiveTab('ev')} />}
        {allowedTabs.includes('cashflow') && <TabBtn id="cashflow" label="Realisasi Anggaran" icon="payments" active={activeTab === 'cashflow'} onClick={() => setActiveTab('cashflow')} />}
        {allowedTabs.includes('progress') && <TabBtn id="progress" label="Progress Kegiatan" icon="checklist" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />}
      </div>

      {!hasRealActualData && (
        <div style={{ ...glass, borderRadius: 12, padding: '10px 16px', fontSize: 11.5, color: theme.textMuted, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: 1, color: '#0082CA' }} />
          <span>Belum ada data realisasi RAB yang diinput. Semua nilai Actual Cost (AC) di bawah ini masih berupa <strong>estimasi</strong> (AC = EV). Buka tab <strong>"Input Realisasi RAB"</strong> untuk memasukkan pengeluaran nyata per kegiatan agar analisis biaya menjadi akurat.</span>
        </div>
      )}

      {/* ══════════════════ TAB: KURVA S ══════════════════ */}
      {activeTab === 'kurva' && (
        <>
          <div className="simlit-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          <MetCard icon="flag" label="Rencana Kumulatif" value={fmtPct(kurvaSData.findLast(d => d.rencana != null)?.rencana || 0)} color={COLORS.primary} sub="Target bobot s/d bulan ini" />
          <MetCard icon="task_alt" label="Realisasi Fisik" value={fmtPct(kurvaSData.findLast(d => d.realisasi != null)?.realisasi || 0)} color={COLORS.success} sub="Capaian fisik aktual" />
          <MetCard icon={ev.SV >= 0 ? 'trending_up' : 'trending_down'} label="Deviasi Kurva S" value={fmtPct(kurvaSData.findLast(d => d.deviasi != null)?.deviasi || 0)} color={ev.SV >= 0 ? COLORS.success : COLORS.danger} status={ev.SV >= 0 ? 'good' : 'bad'} sub={ev.SV >= 0 ? 'Lebih maju dari rencana' : 'Terlambat dari rencana'} />
          <MetCard icon="speed" label="SPI (Jadwal)" value={ev.SPI.toFixed(3)} color={evStatus(ev.SPI)} status={ev.SPI >= 1 ? 'good' : 'bad'} sub={ev.SPI >= 1 ? 'On/ahead of schedule' : 'Behind schedule'} trend={(ev.SPI - 1) * 100} />
          </div>

          <SectionCard title="Kurva S — Rencana vs Realisasi Fisik" sub="Perbandingan bobot kumulatif rencana kerja (berbasis alokasi RAB) dengan capaian fisik aktual per bulan">
            <div style={{ padding: 24 }}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={kurvaSData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <ChartDefs />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} />
                  <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} />
                  <Tooltip content={(props) => <KurvaSTooltip {...props} />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 12 }} />
                  <Area type="monotone" dataKey="rencana" name="Rencana Kerja (%)" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradPlanLight)" strokeDasharray="6 3" dot={false} connectNulls style={{ filter: 'url(#lineGlow)' }} />
                  <Area type="monotone" dataKey="realisasi" name="Realisasi Fisik (%)" stroke={COLORS.success} strokeWidth={3} fill="url(#gradEVlight)" dot={{ r: 5, fill: COLORS.success, stroke: '#fff', strokeWidth: 2 }} connectNulls style={{ filter: 'url(#softShadow)' }} />
                  <ReferenceLine y={100} stroke="#bfc7d2" strokeDasharray="4 4" label={{ value: '100%', fill: theme.textLabel, fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.textLabel, margin: '4px 0 10px', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>Tabel Deviasi Bulanan</div>
              <div style={{ overflowX: 'auto', borderRadius: 12, border: `1px solid ${theme.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['Bulan','Rencana (S)','Realisasi (A)','Deviasi','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {kurvaSData.filter(d => d.realisasi !== null).map((d, i) => {
                      const dev = (d.realisasi || 0) - d.rencana;
                      return (
                        <tr key={i} onMouseEnter={e => e.currentTarget.style.background = theme.rowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background .15s' }}>
                          <td style={{ ...tdStyle, fontWeight: 700 }}>{d.name}</td>
                          <td style={{ ...tdStyle, color: COLORS.primary, fontWeight: 700 }}>{fmtPct(d.rencana)}</td>
                          <td style={{ ...tdStyle, color: COLORS.success, fontWeight: 700 }}>{fmtPct(d.realisasi)}</td>
                          <td style={{ ...tdStyle, fontWeight: 800, color: dev >= 0 ? COLORS.success : COLORS.danger }}>{dev >= 0 ? '+' : ''}{fmtPct(dev)}</td>
                          <td style={tdStyle}>
                            <span style={{ background: dev >= 0 ? 'rgba(34,197,94,0.10)' : 'rgba(186,26,26,0.08)', color: dev >= 0 ? COLORS.success : COLORS.danger, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                              {dev >= 0 ? '▲ Ahead' : '▼ Behind'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </>
      )}

      {/* ══════════════════ TAB: GANTT ══════════════════ */}
      {activeTab === 'gantt' && (
        <SectionCard title="Gantt Chart — Jadwal Kegiatan" sub="Visualisasi timeline per kegiatan dengan bobot (berbasis alokasi RAB) dan capaian progress fisik">
          <GanttChart kegiatan={kegiatan} tahun={penelitian?.tahun_anggaran} BAC={ev.BAC} />
        </SectionCard>
      )}

      {/* ══════════════════ TAB: INPUT REALISASI RAB (baru) ══════════════════ */}
      {activeTab === 'input' && (
        <>
          <div className="simlit-ev-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          <MetCard icon="account_balance" label="Total Rencana RAB" value={fmtRpShort(ev.BAC)} color={COLORS.info} sub="Total anggaran RAB (dari transaksi)" />
          <MetCard icon="payments" label="Total Realisasi Diinput" value={fmtRpShort(totalACActual)} color="#b8930a" sub={`${realisasiRAB.length} entri realisasi`} />
          <MetCard icon="account_balance_wallet" label="Sisa Belum Direalisasikan" value={fmtRpShort(Math.max(ev.BAC - totalACActual, 0))} color={ev.BAC - totalACActual >= 0 ? COLORS.success : COLORS.danger} status={ev.BAC - totalACActual >= 0 ? 'good' : 'bad'} sub="Rencana − Realisasi" />
          </div>

          <SectionCard title="Input Realisasi Pengeluaran RAB" sub="Catat pengeluaran nyata per item RAB untuk tiap kegiatan.">
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', maxWidth: 860, margin: '0 auto' }}>
                {kegiatan.length === 0 && (
                  <div style={{ background: 'rgba(186,26,26,0.06)', border: `1px solid ${COLORS.danger}30`, borderRadius: 10, padding: '10px 14px', fontSize: 11.5, color: COLORS.danger, marginBottom: 16, textAlign: 'center' }}>
                    Belum ada data kegiatan. Tambahkan kegiatan terlebih dahulu di halaman detail penelitian sebelum menginput realisasi.
                  </div>
                )}
                {kegiatan.length > 0 && rab.length === 0 && (
                  <div style={{ background: 'rgba(186,26,26,0.06)', border: `1px solid ${COLORS.danger}30`, borderRadius: 10, padding: '10px 14px', fontSize: 11.5, color: COLORS.danger, marginBottom: 16, textAlign: 'center' }}>
                    Belum ada data RAB. Tambahkan item RAB terlebih dahulu sebelum menginput realisasi.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14, justifyItems: 'center' }}>
                  <div style={{ width: '100%' }}>
                    <label style={{ ...labelStyle, textAlign: 'center' }}>Kegiatan</label>
                    <select style={inputStyle} value={formKegiatanId} onChange={e => { setFormKegiatanId(e.target.value); setFormRabId(''); }}>
                      <option value="">— Pilih kegiatan —</option>
                      {kegiatan.map(k => <option key={k.id} value={k.id}>{k.nama_kegiatan}</option>)}
                    </select>
                  </div>
                  <div style={{ width: '100%' }}>
                    <label style={{ ...labelStyle, textAlign: 'center' }}>Item RAB</label>
                    <select style={inputStyle} value={formRabId} onChange={e => setFormRabId(e.target.value)}>
                      <option value="">— Pilih item RAB —</option>
                      {rabOptionsForForm.map(r => (
                        <option key={r.id} value={r.id}>{r.uraian || r.jenis_belanja} ({fmtRpShort(r.rencana)})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '100%' }}>
                    <label style={{ ...labelStyle, textAlign: 'center' }}>Nominal Realisasi (Rp)</label>
                    <input style={inputStyle} type="number" min="0" placeholder="cth. 2500000" value={formNominal} onChange={e => setFormNominal(e.target.value)} />
                  </div>
                  <div style={{ width: '100%' }}>
                    <label style={{ ...labelStyle, textAlign: 'center' }}>Tanggal</label>
                    <input style={inputStyle} type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', width: '100%' }}>
                    <label style={{ ...labelStyle, textAlign: 'center' }}>Keterangan (opsional)</label>
                    <input style={inputStyle} type="text" placeholder="cth. Pembelian bahan habis pakai tahap 1" value={formKeterangan} onChange={e => setFormKeterangan(e.target.value)} />
                  </div>
                </div>

                {formError && (
                  <div style={{ color: COLORS.danger, fontSize: 12, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>{formError}</div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={handleAddRealisasi} disabled={savingRealisasi}
                    style={{ background: savingRealisasi ? theme.input : COLORS.primary, color: savingRealisasi ? theme.textLabel : '#fff', border: 'none', padding: '10px 24px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: savingRealisasi ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: savingRealisasi ? 'none' : '0 6px 16px rgba(0,130,202,0.35)' }}>
                    <Icon name="add_circle" size={17} /> {savingRealisasi ? 'Menyimpan...' : 'Tambah Realisasi'}
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Rencana vs Realisasi per Kegiatan" sub="Sumber rencana dari alokasi RAB per kegiatan">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 620 }}>
                <thead><tr>{['Kegiatan','Rencana (Rp)','Realisasi (Rp)','Sisa (Rp)','% Serapan'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {ringkasanPerKegiatan.map(row => (
                    <tr key={row.id} onMouseEnter={e => e.currentTarget.style.background = theme.rowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background .15s' }}>
                      <td style={{ ...tdLeftStyle, fontWeight: 700 }}>{row.nama}</td>
                      <td style={{ ...tdStyle, color: COLORS.primary, fontWeight: 700 }}>{fmtRpShort(row.rencana)}</td>
                      <td style={{ ...tdStyle, color: '#b8930a', fontWeight: 700 }}>{fmtRpShort(row.realisasi)}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: row.sisa >= 0 ? theme.text : COLORS.danger }}>{fmtRpShort(row.sisa)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                          <div style={{ flex: 1, maxWidth: 90 }}><ProgressBarLocal value={row.pct} color={row.pct > 100 ? COLORS.danger : COLORS.success} /></div>
                          <span style={{ fontWeight: 800, color: theme.text, minWidth: 42 }}>{fmtPct(row.pct)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {ringkasanPerKegiatan.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: theme.textLabel, fontStyle: 'italic' }}>Belum ada data kegiatan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Riwayat Realisasi" action={
            <select style={{ ...inputStyle, width: 'auto', minWidth: 200 }} value={filterKegiatanId} onChange={e => setFilterKegiatanId(e.target.value)}>
              <option value="all">Semua kegiatan</option>
              {kegiatan.map(k => <option key={k.id} value={k.id}>{k.nama_kegiatan}</option>)}
            </select>
          }>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 720 }}>
                <thead><tr>{['Tanggal','Kegiatan','Item RAB','Nominal','Keterangan',''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {entriesForTable.map(r => (
                    <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = theme.rowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background .15s' }}>
                      <td style={{ ...tdStyle, color: theme.textMuted }}>{fmtDate(r.tanggal)}</td>
                      <td style={{ ...tdLeftStyle, fontWeight: 700 }}>{kegiatanName(r.kegiatan_id)}</td>
                      <td style={tdLeftStyle}>{rabName(r.rab_id)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: '#b8930a' }}>{fmtRpShort(r.nominal)}</td>
                      <td style={{ ...tdLeftStyle, color: theme.textMuted }}>{r.keterangan || '-'}</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleDeleteRealisasi(r.id)}
                          style={{ background: 'rgba(186,26,26,0.08)', color: COLORS.danger, border: 'none', borderRadius: 8, padding: '5px 9px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
                          <Icon name="delete" size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {entriesForTable.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: theme.textLabel, fontStyle: 'italic' }}>Belum ada realisasi yang diinput.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {/* ══════════════════ TAB: EARNED VALUE ══════════════════ */}
      {activeTab === 'ev' && (
        <>
          <div style={{ ...glass, borderRadius: 12, padding: '10px 16px', fontSize: 11.5, color: theme.textMuted, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: 1, color: '#0082CA' }} />
            <span>{hasRealActualData
              ? 'AC (Actual Cost) di bawah ini dihitung dari total realisasi RAB yang telah Anda input'
              : 'AC (Actual Cost) saat ini diestimasi setara dengan EV (progres fisik × bobot anggaran), karena belum ada realisasi RAB yang diinput. Input data di tab "Input Realisasi RAB" agar CV dan CPI mencerminkan biaya yang sesungguhnya.'}</span>
          </div>

          <div className="simlit-ev-3 kurva-ev-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          <MetCard icon="account_balance" label="BAC (Budget at Completion)" value={fmtRpShort(ev.BAC)} color={COLORS.info} sub="Total anggaran proyek (SUM RAB)" />
          <MetCard icon="flag" label="PV (Planned Value)" value={fmtRpShort(ev.PV)} color={COLORS.primary} sub={`${fmtPct(ev.pvPct)} rencana s/d sekarang`} />
          <MetCard icon="task_alt" label="EV (Earned Value)" value={fmtRpShort(ev.EV)} color="#8a6d00" sub={`${fmtPct(ev.evPct)} fisik berbobot`} />
          <MetCard icon="payments" label={hasRealActualData ? 'AC (Actual Cost)' : 'AC (Actual Cost, estimasi)'} value={fmtRpShort(ev.AC)} color="#b8930a" sub={`${fmtPct(ev.acPct)} dari BAC`} />
          <MetCard icon={ev.SV >= 0 ? 'trending_up' : 'trending_down'} label="SV (Schedule Variance)" value={fmtRpShort(Math.abs(ev.SV))} color={ev.SV >= 0 ? COLORS.success : COLORS.danger} status={ev.SV >= 0 ? 'good' : 'bad'} sub={ev.SV >= 0 ? 'Maju dari jadwal' : 'Terlambat dari jadwal'} />
          <MetCard icon={ev.CV >= 0 ? 'trending_up' : 'trending_down'} label="CV (Cost Variance)" value={fmtRpShort(Math.abs(ev.CV))} color={ev.CV >= 0 ? COLORS.success : COLORS.danger} status={hasRealActualData ? (ev.CV >= 0 ? 'good' : 'bad') : undefined} sub={hasRealActualData ? (ev.CV >= 0 ? 'Hemat dari anggaran' : 'Melebihi anggaran') : '0 selama AC = EV (estimasi)'} />
          </div>

          <div className="simlit-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            <SectionCard title="Indeks Kinerja (Performance Index)">
              <div style={{ padding: 22 }}>
                {[
                  { label: 'SPI (Schedule Performance Index)', value: ev.SPI, desc: 'SPI ≥ 1 = on/ahead schedule; SPI < 1 = behind schedule', formula: 'EV / PV' },
                  { label: 'CPI (Cost Performance Index)', value: ev.CPI, desc: hasRealActualData ? 'CPI ≥ 1 = biaya efisien; CPI < 1 = pengeluaran melebihi nilai kerja' : 'Selalu 1.000 selama AC = EV (estimasi, belum ada input realisasi)', formula: 'EV / AC' },
                  { label: 'TCPI (To-Complete Performance Index)', value: ev.TCPI, desc: 'Efisiensi yang diperlukan untuk menyelesaikan sisa pekerjaan', formula: '(BAC - EV) / (BAC - AC)' },
                ].map(({ label, value, desc, formula }) => (
                  <div key={label} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textSubtle }}>{label}</div>
                        <div style={{ fontSize: 10, color: theme.textFaint, fontFamily: 'monospace', marginTop: 1 }}>{formula}</div>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 900, color: evStatus(value), minWidth: 52, textAlign: 'right' }}>{value.toFixed(3)}</span>
                    </div>
                    <ProgressBarLocal value={Math.min(value * 100, 100)} color={evStatus(value)} />
                    <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 4 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Forecasting (Perkiraan Penyelesaian)">
              <div style={{ padding: 22 }}>
                {[
                  { label: 'EAC (Estimate at Completion)', value: fmtRpShort(ev.EAC), formula: 'BAC / CPI', desc: 'Perkiraan total biaya akhir berdasarkan kinerja saat ini', color: ev.EAC <= ev.BAC ? COLORS.success : COLORS.danger },
                  { label: 'ETC (Estimate to Complete)', value: fmtRpShort(ev.ETC), formula: 'EAC - AC', desc: 'Biaya yang masih diperlukan untuk menyelesaikan proyek', color: theme.text },
                  { label: 'VAC (Variance at Completion)', value: fmtRpShort(Math.abs(ev.VAC)), formula: 'BAC - EAC', desc: ev.VAC >= 0 ? 'Proyeksi penghematan anggaran' : 'Proyeksi pembengkakan anggaran', color: ev.VAC >= 0 ? COLORS.success : COLORS.danger },
                ].map(({ label, value, formula, desc, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: '14px 16px', marginBottom: 12, border: `1px solid ${color}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.textSubtle }}>{label}</span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: theme.textFaint }}>{formula}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 4, wordBreak: 'break-word' }}>{value}</div>
                    <div style={{ fontSize: 11, color: theme.textFaint }}>{desc}</div>
                  </div>
                ))}

                <div style={{ background: 'rgba(239,244,255,0.6)', borderRadius: 14, padding: '14px 16px', border: `1px solid ${theme.borderLight}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme.textSubtle, marginBottom: 8, textAlign: 'center' }}>EAC vs BAC</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}><ProgressBarLocal value={Math.min(ev.BAC > 0 ? (ev.EAC / ev.BAC) * 100 : 0, 130)} color={ev.EAC <= ev.BAC ? COLORS.success : COLORS.danger} height={10} /></div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: ev.EAC <= ev.BAC ? COLORS.success : COLORS.danger, minWidth: 52 }}>{ev.BAC > 0 ? fmtPct((ev.EAC / ev.BAC) * 100) : '0%'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6, fontWeight: 600, textAlign: 'center' }}>
                    {ev.EAC <= ev.BAC ? `Proyeksi hemat ${fmtRpShort(ev.VAC)}` : `Proyeksi overrun ${fmtRpShort(-ev.VAC)}`}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Perbandingan PV / EV / AC" sub="Visualisasi Earned Value components berdasarkan bulan">
            <div style={{ padding: 24 }}>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={GANTT_MONTHS.map((name, i) => ({
                  name,
                  PV: parseFloat((kurvaSData[i].rencana / 100 * ev.BAC / 1e6).toFixed(2)),
                  EV: kurvaSData[i].realisasi !== null ? parseFloat((kurvaSData[i].realisasi / 100 * ev.BAC / 1e6).toFixed(2)) : null,
                  AC: realisasiMonthly[i] ? parseFloat((realisasiMonthly[i].kumulatif / 1e6).toFixed(2)) : null,
                }))} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <ChartDefs />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} unit="Jt" />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [v !== null ? `Rp ${v}Jt` : '-', n]} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="PV" name="PV (Planned Value)" stroke={COLORS.primary} strokeWidth={2.5} dot={false} strokeDasharray="6 3" connectNulls style={{ filter: 'url(#lineGlow)' }} />
                  <Line type="monotone" dataKey="EV" name="EV (Earned Value)" stroke={COLORS.success} strokeWidth={3} dot={{ r: 4, fill: COLORS.success, stroke: '#fff', strokeWidth: 2 }} connectNulls style={{ filter: 'url(#softShadow)' }} />
                  <Line type="monotone" dataKey="AC" name={hasRealActualData ? 'AC (Actual Cost)' : 'AC (Actual Cost, estimasi)'} stroke="#b8930a" strokeWidth={2.5} dot={hasRealActualData ? { r: 4, fill: '#b8930a', stroke: '#fff', strokeWidth: 2 } : false} connectNulls style={{ filter: 'url(#softShadow)' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </>
      )}

      {/* ══════════════════ TAB: REALISASI ANGGARAN ══════════════════ */}
      {activeTab === 'cashflow' && (
        <>
          <div className="simlit-ev-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          <MetCard icon="payments" label={hasRealActualData ? 'Total Penyerapan' : 'Total Penyerapan (estimasi)'} value={fmtRpShort(ev.AC)} color="#b8930a" sub={`${fmtPct(ev.acPct)} dari total anggaran`} />
          <MetCard icon="account_balance_wallet" label="Sisa Anggaran" value={fmtRpShort(ev.BAC - ev.AC)} color={ev.BAC - ev.AC >= 0 ? COLORS.success : COLORS.danger} status={ev.BAC - ev.AC >= 0 ? 'good' : 'bad'} sub="BAC − AC" />
          <MetCard icon="speed" label="CPI (Cost)" value={ev.CPI.toFixed(3)} color={evStatus(ev.CPI)} status={ev.CPI >= 1 ? 'good' : 'bad'} sub={hasRealActualData ? 'Berdasarkan realisasi nyata' : 'Selalu 1.000 selama AC = EV'} />
          </div>

          <SectionCard title="Penyerapan Anggaran per Bulan" sub={hasRealActualData ? 'Realisasi bulanan & kumulatif berdasarkan input realisasi RAB Anda' : 'Estimasi realisasi bulanan & kumulatif, diturunkan dari progres fisik × bobot alokasi RAB'}>
            <div style={{ padding: 24 }}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={realisasiMonthly} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
                  <ChartDefs />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [fmtRpShort(v), n]} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 8 }} />
                  <Bar yAxisId="left" dataKey="realisasi" name="Penyerapan Bulanan" fill="url(#gradPrimary3d)" radius={[8,8,0,0]} maxBarSize={36} style={{ filter: 'url(#softShadow)' }} />
                  <Line yAxisId="right" type="monotone" dataKey="kumulatif" name="Kumulatif" stroke="#b8930a" strokeWidth={3} dot={{ r: 4, fill: '#b8930a', stroke: '#fff', strokeWidth: 2 }} connectNulls style={{ filter: 'url(#softShadow)' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Breakdown per Item RAB" sub="Rencana anggaran - Realisasi anggaran">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 760 }}>
                <thead>
                  <tr>{['Item RAB', 'Kategori', 'Rencana', 'Perincian per Kegiatan', 'Total Realisasi', 'Selisih'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rabItemBreakdown.map(item => (
                    <tr key={item.id} onMouseEnter={e => e.currentTarget.style.background = theme.rowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background .15s', verticalAlign: 'top' }}>
                      <td style={{ ...tdLeftStyle, fontWeight: 700, minWidth: 160 }}>{item.uraian}</td>
                      <td style={tdStyle}>
                        <span style={{ background: 'rgba(0,130,202,0.08)', color: COLORS.primary, padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{item.kategori}</span>
                      </td>
                      {/* Rencana ditampilkan sebagai "kartu" kecil (bukan angka polos) supaya
                          secara visual setara/senada dengan kolom Perincian Realisasi di
                          sebelahnya, meskipun datanya tetap nominal total (belum dipecah
                          per kegiatan karena data model saat ini tidak menyimpan alokasi
                          RAB per kegiatan per item). */}
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div style={{
                          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                          background: 'rgba(0,130,202,0.06)', border: `1px solid ${COLORS.primary}22`,
                          borderRadius: 10, padding: '8px 14px', minWidth: 100,
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.primary }}>{fmtRpShort(item.rencana)}</span>
                          <span style={{ fontSize: 9, color: theme.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Rencana</span>
                        </div>
                      </td>
                      <td style={{ ...tdLeftStyle, minWidth: 220 }}>
                        {item.rincian.length === 0 ? (
                          <span style={{ color: theme.textFaint, fontStyle: 'italic', fontSize: 11.5 }}>Belum ada realisasi diinput</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {item.rincian.map((r, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11.5 }}>
                                <span style={{ color: theme.textMuted, fontWeight: 600 }}>{r.nama}</span>
                                <span style={{ color: theme.text, fontWeight: 700, whiteSpace: 'nowrap' }}>{fmtRpShort(r.nominal)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: theme.text, whiteSpace: 'nowrap' }}>{fmtRpShort(item.totalRealisasi)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: item.sisa >= 0 ? COLORS.success : COLORS.danger, whiteSpace: 'nowrap' }}>
                        {item.sisa >= 0 ? '+' : ''}{fmtRpShort(item.sisa)}
                      </td>
                    </tr>
                  ))}
                  {rabItemBreakdown.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: theme.textLabel, fontStyle: 'italic' }}>Belum ada data RAB.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Breakdown per Kategori RAB" sub={hasRealActualData ? 'Berdasarkan realisasi nyata yang diinput per item RAB' : 'Estimasi dari alokasi RAB × progres fisik kegiatan'}>
            <div style={{ padding: 22 }}>
              {(() => {
                const total = Object.values(kategoriBreakdown).reduce((a, b) => a + b, 0);
                const colors = [COLORS.primary, COLORS.success, '#b8930a', COLORS.info, COLORS.neutral, COLORS.danger];
                const entries = Object.entries(kategoriBreakdown).sort((a, b) => b[1] - a[1]);
                if (entries.length === 0) return <div style={{ color: theme.textLabel, fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: 20 }}>Belum ada alokasi RAB.</div>;
                return entries.map(([kat, v], i) => (
                  <div key={kat} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: theme.text }}>{kat}</span>
                      <span style={{ color: theme.textMuted }}>{fmtRpShort(v)} <span style={{ color: colors[i % colors.length], fontWeight: 800 }}>({total > 0 ? fmtPct((v / total) * 100) : '0%'})</span></span>
                    </div>
                    <ProgressBarLocal value={total > 0 ? (v / total) * 100 : 0} color={colors[i % colors.length]} />
                  </div>
                ));
              })()}
            </div>
          </SectionCard>
        </>
      )}

      {/* ══════════════════ TAB: PROGRESS ══════════════════ */}
      {activeTab === 'progress' && (
        <>
          <div className="simlit-ev-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            <MetCard icon="task_alt" label="Bobot Total Terselesaikan" value={fmtPct(ev.evPct)} color={COLORS.success} sub="Earned Value fisik berbobot" />
            <MetCard icon="checklist" label="Jumlah Kegiatan" value={`${kegiatan.filter(k => Number(k.progress) === 100).length} / ${kegiatan.length}`} color={COLORS.primary} sub="Selesai / Total kegiatan" />
            <MetCard icon="trending_up" label="Rata-rata Progress" value={fmtPct(kegiatan.length > 0 ? kegiatan.reduce((a, k) => a + Number(k.progress || 0), 0) / kegiatan.length : 0)} color={COLORS.info} sub="Rata-rata per kegiatan" />
          </div>

          <SectionCard title="Bobot vs Progress per Kegiatan" sub="Bobot berbasis alokasi RAB (nilai_rencana / BAC) terhadap progres aktual tiap kegiatan">
            <div style={{ padding: 24, overflowX: 'auto' }}>
              <div style={{ minWidth: 320 }}>
                <ResponsiveContainer width="100%" height={Math.max(progressData.length * 50 + 60, 260)}>
                  <BarChart data={progressData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <ChartDefs />
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} />
                    <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textSubtle }} />
                    <Tooltip {...tooltipStyle} formatter={(v, n) => [fmtPct(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 8 }} />
                    <Bar dataKey="bobot" name="Bobot Rencana (%)" fill="#e5eeff" radius={[0,8,8,0]} />
                    <Bar dataKey="progress" name="Progress Aktual (%)" fill="url(#gradSuccess3d)" radius={[0,8,8,0]} style={{ filter: 'url(#softShadow)' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Detail Kegiatan & Earned Value">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
                <thead><tr>{['No','Kegiatan','Durasi','Bobot (%)','Progress (%)','Earned (%)','Status'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {progressData.map((row, i) => {
                    const status = kegiatan[i]?.progress === 100
                      ? { label: 'Selesai', bg: 'rgba(34,197,94,0.10)', color: COLORS.success }
                      : kegiatan[i]?.progress > 0
                        ? { label: 'Berjalan', bg: 'rgba(0,130,202,0.10)', color: COLORS.primary }
                        : { label: 'Belum Mulai', bg: theme.input, color: theme.textLabel };
                    const days = daysBetween(kegiatan[i]?.tanggal_mulai, kegiatan[i]?.tanggal_selesai);
                    return (
                      <tr key={i} onMouseEnter={e => e.currentTarget.style.background = theme.rowHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background .15s' }}>
                        <td style={{ ...tdStyle, color: theme.textFaint, fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ ...tdLeftStyle, fontWeight: 700 }}>{row.name}</td>
                        <td style={{ ...tdStyle, color: theme.textMuted }}>{days} hari</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: '#8a6d00' }}>{fmtPct(row.bobot)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <div style={{ flex: 1, maxWidth: 90 }}><ProgressBarLocal value={row.progress} color={row.progress === 100 ? COLORS.success : COLORS.primary} /></div>
                            <span style={{ fontWeight: 800, color: theme.text, minWidth: 30 }}>{row.progress}%</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: COLORS.success }}>{fmtPct(row.earned)}</td>
                        <td style={tdStyle}><span style={{ background: status.bg, color: status.color, padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'rgba(239,244,255,0.6)' }}>
                    <td colSpan={3} style={{ padding: '12px 14px', fontWeight: 800, color: theme.text, fontSize: 12, textAlign: 'center' }}>TOTAL</td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: '#8a6d00', textAlign: 'center' }}>{fmtPct(progressData.reduce((a, b) => a + b.bobot, 0))}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: COLORS.primary, textAlign: 'center' }}>{fmtPct(kegiatan.length > 0 ? kegiatan.reduce((a, k) => a + Number(k.progress || 0), 0) / kegiatan.length : 0)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: COLORS.success, textAlign: 'center' }}>{fmtPct(progressData.reduce((a, b) => a + b.earned, 0))}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
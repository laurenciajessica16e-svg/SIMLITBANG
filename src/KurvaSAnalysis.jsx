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
  contentStyle: { borderRadius: 12, border: `1px solid ${theme.cardBorder}`, background: theme.tooltipBg, color: theme.text, fontSize: 12, backdropFilter: 'blur(16px)' },
  labelStyle: { color: theme.textMuted, fontWeight: 700, marginBottom: 4 },
  itemStyle: { color: theme.text, fontSize: 12 },
};

// ── SECTION CARD (matches App.jsx SectionCard) ─────────────────────────────
const SectionCard = ({ title, sub, children, action }) => (
  <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 12px rgba(11,28,48,0.04)', overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <div>
        <span style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>{title}</span>
        {sub && <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 3, fontWeight: 500 }}>{sub}</div>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

// ── METRIC CARD (matches App.jsx StatCard) ─────────────────────────────────
const MetCard = ({ icon, label, value, sub, color, trend }) => {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, padding: '20px 22px',
        border: `1px solid ${theme.cardBorder}`, transition: 'all 0.25s ease', cursor: 'default',
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
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: 11, fontWeight: 700, color: trend >= 0 ? COLORS.success : COLORS.danger }}>
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
      padding: '8px 16px', borderRadius: 10, fontSize: 12.5, fontWeight: 700,
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.navHover; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
    <Icon name={icon} size={16} fill={active} /> {label}
  </button>
);

const thStyle = { padding: '12px 14px', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#eff4ff', textAlign: 'left' };
const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, color: theme.text, fontSize: 12 };

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
      <div style={{ display: 'grid', gridTemplateColumns: '220px 56px 56px 1fr', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 14px', borderBottom: `1px solid ${theme.borderLight}`, minWidth: 700, background: '#eff4ff' }}>
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
              <div style={{ position: 'absolute', left: `${row.leftPct}%`, width: `${row.widthPct * (row.progress / 100)}%`, height: 16, top: 5, borderRadius: 99, background: row.statusColor, transition: 'width 0.8s ease' }} />
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 20, padding: '10px 14px', borderTop: `1px solid ${theme.borderLight}`, fontSize: 11, color: theme.textLabel, flexWrap: 'wrap' }}>
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
    <div style={{ borderRadius: 12, border: `1px solid ${theme.cardBorder}`, background: theme.tooltipBg, color: theme.text, fontSize: 12, backdropFilter: 'blur(16px)', padding: '10px 14px', minWidth: 190, boxShadow: '0 8px 24px rgba(11,28,48,0.12)' }}>
      <div style={{ fontWeight: 800, marginBottom: 8, color: '#8a6d00', fontSize: 13 }}>{label}</div>
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

// ── MAIN COMPONENT ───────────────────────────────────────────────────────
// Props baru (menggantikan `cashflow`):
//   rab        : daftar item RAB [{ id, kategori, unsur_biaya, total, ... }]
//   rabAlokasi : daftar alokasi rinci [{ rab_id, kegiatan_id, persentase, nominal }]
//   kegiatan   : sudah membawa nilai_rencana & nilai_realisasi langsung dari DB
//                (hasil trigger di sisi database)
export default function KurvaSAnalysis({ penelitian, kegiatan = [], rab = [], rabAlokasi = [], onBack }) {
  const [activeTab, setActiveTab] = useState('kurva');

  const ev = useMemo(() => {
    const rabTotal = rab.reduce((s, r) => s + Number(r.total || 0), 0);
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

    // AC (Actual Cost) belum punya sumber transaksi riil (tidak ada tabel
    // cashflow lagi). Sesuai kesepakatan: AC diasumsikan = EV, artinya biaya
    // dianggap terserap proporsional terhadap progres fisik kegiatan.
    // Konsekuensinya CV akan selalu 0 dan CPI akan selalu 1 — ini WAJAR
    // selama sistem belum mencatat transaksi riil per tanggal.
    const acPct = evPct;

    const PV = (pvPct / 100) * BAC;
    const EV = (evPct / 100) * BAC;
    const AC = (acPct / 100) * BAC;
    const SV = EV - PV;
    const CV = EV - AC;
    const SPI = PV > 0 ? EV / PV : 0;
    const CPI = AC > 0 ? EV / AC : 0;
    const EAC = CPI > 0 ? BAC / CPI : BAC;
    const ETC = EAC - AC;
    const VAC = BAC - EAC;
    const TCPI = (BAC - EV) > 0 ? (BAC - EV) / (BAC - AC) : 0;

    return { BAC, PV, EV, AC, SV, CV, SPI, CPI, EAC, ETC, VAC, TCPI, pvPct, evPct, acPct: BAC > 0 ? (AC / BAC) * 100 : 0 };
  }, [penelitian, kegiatan, rab]);

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

  // AC = EV (lihat catatan di atas), jadi kurva realisasi biaya bulanan
  // diturunkan dari kurva realisasi fisik (kurvaSData) x BAC — bukan dari
  // transaksi tanggal-per-tanggal karena sumber datanya sudah tidak ada.
  const realisasiMonthly = useMemo(() => {
    const BAC = ev.BAC;
    let prevKum = 0;
    return kurvaSData.map(d => {
      const kumulatif = d.realisasi !== null ? (d.realisasi / 100) * BAC : prevKum;
      const bulanan = Math.max(kumulatif - prevKum, 0);
      prevKum = kumulatif;
      return { name: d.name, realisasi: bulanan, kumulatif };
    });
  }, [kurvaSData, ev.BAC]);

  const progressData = useMemo(() => {
    const totalDays = kegiatan.reduce((t, k) => t + daysBetween(k.tanggal_mulai, k.tanggal_selesai), 0);
    return kegiatan.map(k => {
      const days = daysBetween(k.tanggal_mulai, k.tanggal_selesai);
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

  // Breakdown realisasi per KATEGORI RAB (menggantikan breakdown per
  // jenis_belanja yang dulu diambil dari tabel cashflow). Realisasi tiap
  // item RAB dihitung dari alokasi ke kegiatan x progress kegiatan itu.
  const kategoriBreakdown = useMemo(() => {
    const map = {};
    (rabAlokasi || []).forEach(a => {
      const rabItem = rab.find(r => r.id === a.rab_id);
      const keg = kegiatan.find(k => k.id === a.kegiatan_id);
      if (!rabItem) return;
      const kat = rabItem.kategori || 'Lainnya';
      const progress = keg ? Number(keg.progress) || 0 : 0;
      const realisasi = Number(a.nominal || 0) * (progress / 100);
      map[kat] = (map[kat] || 0) + realisasi;
    });
    return map;
  }, [rab, rabAlokasi, kegiatan]);

  const evStatus = (val, threshold = 1) => val >= threshold ? COLORS.success : val >= 0.9 ? '#b8930a' : COLORS.danger;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* HEADER (matches App.jsx 'detail' view header pattern) */}
      <div className="simlit-page-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>ANALISIS KURVA S</div>
          <h1 className="simlit-page-title" style={{ fontSize: 20, fontWeight: 800, color: theme.text, margin: 0, maxWidth: 640, lineHeight: 1.3 }}>{penelitian?.nama_penelitian}</h1>
          <p style={{ fontSize: 12, color: theme.textLabel, margin: '6px 0 0' }}>Ketua: <strong style={{ color: theme.textMuted }}>{penelitian?.ketua_penelitian}</strong> · Kode: {penelitian?.kode_penelitian}</p>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(0,130,202,0.08)', color: '#0082CA', border: '1px solid rgba(0,130,202,0.25)', padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="arrow_back" size={16} /> Kembali ke Detail
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 12px rgba(11,28,48,0.04)', padding: '12px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto' }}>
        <TabBtn id="kurva"    label="Kurva S Control"       icon="show_chart"          active={activeTab === 'kurva'}    onClick={() => setActiveTab('kurva')} />
        <TabBtn id="gantt"    label="Gantt Chart"           icon="calendar_month"      active={activeTab === 'gantt'}    onClick={() => setActiveTab('gantt')} />
        <TabBtn id="ev"       label="Earned Value Analysis" icon="insights"            active={activeTab === 'ev'}       onClick={() => setActiveTab('ev')} />
        <TabBtn id="cashflow" label="Realisasi Anggaran"    icon="payments"            active={activeTab === 'cashflow'} onClick={() => setActiveTab('cashflow')} />
        <TabBtn id="progress" label="Progress Kegiatan"     icon="checklist"           active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
      </div>

      {/* ══════════════════ TAB: KURVA S ══════════════════ */}
      {activeTab === 'kurva' && (
        <>
          <div className="simlit-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <MetCard icon="flag" label="Rencana Kumulatif" value={fmtPct(kurvaSData.findLast(d => d.rencana != null)?.rencana || 0)} color={COLORS.primary} sub="Target bobot s/d bulan ini" />
            <MetCard icon="task_alt" label="Realisasi Fisik" value={fmtPct(kurvaSData.findLast(d => d.realisasi != null)?.realisasi || 0)} color={COLORS.success} sub="Capaian fisik aktual" />
            <MetCard icon={ev.SV >= 0 ? 'trending_up' : 'trending_down'} label="Deviasi Kurva S" value={fmtPct(kurvaSData.findLast(d => d.deviasi != null)?.deviasi || 0)} color={ev.SV >= 0 ? COLORS.success : COLORS.danger} sub={ev.SV >= 0 ? 'Lebih maju dari rencana' : 'Terlambat dari rencana'} />
            <MetCard icon="speed" label="SPI (Jadwal)" value={ev.SPI.toFixed(3)} color={evStatus(ev.SPI)} sub={ev.SPI >= 1 ? 'On/ahead of schedule' : 'Behind schedule'} trend={(ev.SPI - 1) * 100} />
          </div>

          <SectionCard title="Kurva S — Rencana vs Realisasi Fisik" sub="Perbandingan bobot kumulatif rencana kerja (berbasis alokasi RAB) dengan capaian fisik aktual per bulan">
            <div style={{ padding: 24 }}>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={kurvaSData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradEVlight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPlanLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.16} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} />
                  <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} style={{ fontSize: 11, fontWeight: 600, fill: theme.textLabel }} />
                  <Tooltip content={(props) => <KurvaSTooltip {...props} />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 12 }} />
                  <Area type="monotone" dataKey="rencana" name="Rencana Kerja (%)" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradPlanLight)" strokeDasharray="6 3" dot={false} connectNulls />
                  <Area type="monotone" dataKey="realisasi" name="Realisasi Fisik (%)" stroke={COLORS.success} strokeWidth={3} fill="url(#gradEVlight)" dot={{ r: 5, fill: COLORS.success, stroke: '#fff', strokeWidth: 2 }} connectNulls />
                  <ReferenceLine y={100} stroke="#bfc7d2" strokeDasharray="4 4" label={{ value: '100%', fill: theme.textLabel, fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.textLabel, margin: '4px 0 10px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tabel Deviasi Bulanan</div>
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

      {/* ══════════════════ TAB: EARNED VALUE ══════════════════ */}
      {activeTab === 'ev' && (
        <>
          <div style={{ background: 'rgba(0,130,202,0.06)', border: `1px solid rgba(0,130,202,0.18)`, borderRadius: 12, padding: '10px 16px', fontSize: 11.5, color: theme.textMuted, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: 1, color: '#0082CA' }} />
            <span>AC (Actual Cost) saat ini diestimasi setara dengan EV (progres fisik × bobot anggaran), karena sistem belum mencatat transaksi realisasi per tanggal. Karena itu CV akan selalu 0 dan CPI akan selalu 1 sampai ada pencatatan transaksi riil.</span>
          </div>

          <div className="simlit-ev-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <MetCard icon="account_balance" label="BAC (Budget at Completion)" value={fmtRpShort(ev.BAC)} color={COLORS.info} sub="Total anggaran proyek (SUM RAB)" />
            <MetCard icon="flag" label="PV (Planned Value)" value={fmtRpShort(ev.PV)} color={COLORS.primary} sub={`${fmtPct(ev.pvPct)} rencana s/d sekarang`} />
            <MetCard icon="task_alt" label="EV (Earned Value)" value={fmtRpShort(ev.EV)} color="#8a6d00" sub={`${fmtPct(ev.evPct)} fisik berbobot`} />
            <MetCard icon="payments" label="AC (Actual Cost, estimasi)" value={fmtRpShort(ev.AC)} color="#b8930a" sub={`${fmtPct(ev.acPct)} dari BAC`} />
            <MetCard icon={ev.SV >= 0 ? 'trending_up' : 'trending_down'} label="SV (Schedule Variance)" value={fmtRpShort(Math.abs(ev.SV))} color={ev.SV >= 0 ? COLORS.success : COLORS.danger} sub={ev.SV >= 0 ? 'Maju dari jadwal' : 'Terlambat dari jadwal'} />
            <MetCard icon={ev.CV >= 0 ? 'trending_up' : 'trending_down'} label="CV (Cost Variance)" value={fmtRpShort(Math.abs(ev.CV))} color={ev.CV >= 0 ? COLORS.success : COLORS.danger} sub="0 selama AC = EV (estimasi)" />
          </div>

          <div className="simlit-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <SectionCard title="Indeks Kinerja (Performance Index)">
              <div style={{ padding: 22 }}>
                {[
                  { label: 'SPI (Schedule Performance Index)', value: ev.SPI, desc: 'SPI ≥ 1 = on/ahead schedule; SPI < 1 = behind schedule', formula: 'EV / PV' },
                  { label: 'CPI (Cost Performance Index)', value: ev.CPI, desc: 'Selalu 1.000 selama AC = EV (estimasi, belum ada transaksi riil)', formula: 'EV / AC' },
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
                  { label: 'ETC (Estimate to Complete)', value: fmtRpShort(ev.ETC), formula: 'EAC - AC', desc: 'Biaya yang masih diperlukan untuk menyelesaikan proyek', color: COLORS.info },
                  { label: 'VAC (Variance at Completion)', value: fmtRpShort(Math.abs(ev.VAC)), formula: 'BAC - EAC', desc: ev.VAC >= 0 ? 'Proyeksi penghematan anggaran' : 'Proyeksi pembengkakan anggaran', color: ev.VAC >= 0 ? COLORS.success : COLORS.danger },
                ].map(({ label, value, formula, desc, color }) => (
                  <div key={label} style={{ background: theme.input, borderRadius: 14, padding: '14px 16px', marginBottom: 12, border: `1px solid ${color}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.textSubtle }}>{label}</span>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: theme.textFaint }}>{formula}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color, marginBottom: 4, wordBreak: 'break-word' }}>{value}</div>
                    <div style={{ fontSize: 11, color: theme.textFaint }}>{desc}</div>
                  </div>
                ))}

                <div style={{ background: '#eff4ff', borderRadius: 14, padding: '14px 16px', border: `1px solid ${theme.borderLight}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme.textSubtle, marginBottom: 8 }}>EAC vs BAC</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}><ProgressBarLocal value={Math.min(ev.BAC > 0 ? (ev.EAC / ev.BAC) * 100 : 0, 130)} color={ev.EAC <= ev.BAC ? COLORS.success : COLORS.danger} height={10} /></div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: ev.EAC <= ev.BAC ? COLORS.success : COLORS.danger, minWidth: 52 }}>{ev.BAC > 0 ? fmtPct((ev.EAC / ev.BAC) * 100) : '0%'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 6, fontWeight: 600 }}>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} />
                  <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} unit="Jt" />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [v !== null ? `Rp ${v}Jt` : '-', n]} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="PV" name="PV (Planned Value)" stroke={COLORS.primary} strokeWidth={2.5} dot={false} strokeDasharray="6 3" connectNulls />
                  <Line type="monotone" dataKey="EV" name="EV (Earned Value)" stroke={COLORS.success} strokeWidth={3} dot={{ r: 4, fill: COLORS.success, stroke: '#fff', strokeWidth: 2 }} connectNulls />
                  <Line type="monotone" dataKey="AC" name="AC (Actual Cost, estimasi)" stroke="#b8930a" strokeWidth={2.5} dot={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </>
      )}

      {/* ══════════════════ TAB: REALISASI ANGGARAN ══════════════════ */}
      {activeTab === 'cashflow' && (
        <>
          <div className="simlit-ev-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <MetCard icon="payments" label="Total Penyerapan (estimasi)" value={fmtRpShort(ev.AC)} color="#b8930a" sub={`${fmtPct(ev.acPct)} dari total anggaran`} />
            <MetCard icon="account_balance_wallet" label="Sisa Anggaran" value={fmtRpShort(ev.BAC - ev.AC)} color={ev.BAC - ev.AC >= 0 ? COLORS.success : COLORS.danger} sub="BAC − AC" />
            <MetCard icon="speed" label="CPI (Cost)" value={ev.CPI.toFixed(3)} color={evStatus(ev.CPI)} sub="Selalu 1.000 selama AC = EV" />
          </div>

          <SectionCard title="Penyerapan Anggaran per Bulan" sub="Estimasi realisasi bulanan & kumulatif, diturunkan dari progres fisik × bobot alokasi RAB">
            <div style={{ padding: 24 }}>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={realisasiMonthly} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} tickFormatter={v => `${(v/1e6).toFixed(0)}Jt`} />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [fmtRpShort(v), n]} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 8 }} />
                  <Bar yAxisId="left" dataKey="realisasi" name="Penyerapan Bulanan" fill={COLORS.primary} radius={[6,6,0,0]} maxBarSize={36} />
                  <Line yAxisId="right" type="monotone" dataKey="kumulatif" name="Kumulatif" stroke="#b8930a" strokeWidth={3} dot={{ r: 4, fill: '#b8930a', stroke: '#fff', strokeWidth: 2 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Breakdown per Kategori RAB">
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
          <div className="simlit-ev-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <MetCard icon="task_alt" label="Bobot Total Terselesaikan" value={fmtPct(ev.evPct)} color={COLORS.success} sub="Earned Value fisik berbobot" />
            <MetCard icon="checklist" label="Jumlah Kegiatan" value={`${kegiatan.filter(k => Number(k.progress) === 100).length} / ${kegiatan.length}`} color={COLORS.primary} sub="Selesai / Total kegiatan" />
            <MetCard icon="trending_up" label="Rata-rata Progress" value={fmtPct(kegiatan.length > 0 ? kegiatan.reduce((a, k) => a + Number(k.progress || 0), 0) / kegiatan.length : 0)} color={COLORS.info} sub="Rata-rata per kegiatan" />
          </div>

          <SectionCard title="Bobot vs Progress per Kegiatan" sub="Bobot berbasis alokasi RAB (nilai_rencana / BAC) terhadap progres aktual tiap kegiatan">
            <div style={{ padding: 24, overflowX: 'auto' }}>
              <div style={{ minWidth: 320 }}>
                <ResponsiveContainer width="100%" height={Math.max(progressData.length * 50 + 60, 260)}>
                  <BarChart data={progressData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textLabel }} />
                    <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} style={{ fontSize: 11, fill: theme.textSubtle }} />
                    <Tooltip {...tooltipStyle} formatter={(v, n) => [fmtPct(v), n]} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, paddingTop: 8 }} />
                    <Bar dataKey="bobot" name="Bobot Rencana (%)" fill="#e5eeff" radius={[0,6,6,0]} />
                    <Bar dataKey="progress" name="Progress Aktual (%)" fill={COLORS.success} radius={[0,6,6,0]} />
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
                        <td style={{ ...tdStyle, fontWeight: 700 }}>{row.name}</td>
                        <td style={{ ...tdStyle, color: theme.textMuted }}>{days} hari</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: '#8a6d00' }}>{fmtPct(row.bobot)}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1 }}><ProgressBarLocal value={row.progress} color={row.progress === 100 ? COLORS.success : COLORS.primary} /></div>
                            <span style={{ fontWeight: 800, color: theme.text, minWidth: 30 }}>{row.progress}%</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: COLORS.success }}>{fmtPct(row.earned)}</td>
                        <td style={tdStyle}><span style={{ background: status.bg, color: status.color, padding: '3px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>{status.label}</span></td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#eff4ff' }}>
                    <td colSpan={3} style={{ padding: '12px 14px', fontWeight: 800, color: theme.text, fontSize: 12 }}>TOTAL</td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: '#8a6d00' }}>{fmtPct(progressData.reduce((a, b) => a + b.bobot, 0))}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: COLORS.primary }}>{fmtPct(kegiatan.length > 0 ? kegiatan.reduce((a, k) => a + Number(k.progress || 0), 0) / kegiatan.length : 0)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 900, color: COLORS.success }}>{fmtPct(progressData.reduce((a, b) => a + b.earned, 0))}</td>
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

// Small local progress bar (matches App.jsx ProgressBar visual language)
const ProgressBarLocal = ({ value, color = COLORS.primary, height = 6 }) => {
  const [width, setWidth] = React.useState(0);
  const safeValue = Math.min(Math.max(value || 0, 0), 130);
  React.useEffect(() => { const t = setTimeout(() => setWidth(safeValue), 80); return () => clearTimeout(t); }, [safeValue]);
  return (
    <div style={{ background: '#e5eeff', borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${Math.min(width, 100)}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
};
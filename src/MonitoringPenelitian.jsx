import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { theme, COLORS, Icon } from './theme';
import DetailIsuMitigasi from './DetailIsuMitigasi';

// ── SUMBER DATA: Google Sheets "Monitoring Simlitbang" ──────────────────────
const SHEET_ID = '104rdX5ajcdhYNOEnlcnUooy0_0sXttjp-6EwGyDEgbI';
const SHEET_GID = '0';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// ── URL backend Express kamu (server.js) ────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SHEET_API_URL = `${API_BASE}/monitoring-penelitian`;
const POLL_INTERVAL_MS = 6000; // interval polling supaya perubahan di sheet ikut muncul di web

const DATA_START_INDEX = 3; // index 0-based → baris ke-4 di sheet

// ── PARSER CSV SEDERHANA (menangani koma & newline di dalam tanda kutip) ───
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') { field += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { field += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === ',') { row.push(field); field = ''; }
      else if (char === '\r') { /* skip */ }
      else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += char;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const toNumber = (s) => Number(String(s || '').replace(/[^\d.-]/g, '')) || 0;
const toBool = (s) => String(s || '').trim().toLowerCase() === 'v';

function rowsToData(rows) {
  return rows
    .slice(DATA_START_INDEX)
    .filter(r => r[0] && !isNaN(Number(r[0])))
    .map(r => ({
      id: Number(r[0]),
      no: Number(r[0]),
      judul_penelitian: r[1]?.trim() || '',
      judul_sub_penelitian: r[2]?.trim() || '',
      cluster: r[3]?.trim() || '',
      mitra: r[4]?.trim() || '',
      pic: r[5]?.trim() || '',
      status: r[6]?.trim() || '',
      lingkup: r[7]?.trim() || '',
      luaran: r[8]?.trim() || '',
      rab: toNumber(r[9]),
      core_hub: toBool(r[10]),
      ptb: toBool(r[11]),
      catatan_implementasi_2026: toBool(r[12]),
      wbs_2026: r[13]?.trim() || '',
      kategori: r[14]?.trim() || '',
      link_pp: r[15]?.trim() || '',
    }));
}

const PP_TAB_GID_MAP = {
  1: '1898601412', 2: '374523852', 3: '985201135', 4: '1315043083', 5: '1739683808',
  6: '1057431065', 7: '75978866', 8: '44743280', 9: '2002960205', 10: '623136718', 11: '2120763665',
};

function getPPGid(row) {
  const raw = (row.link_pp && row.link_pp.trim()) || PP_TAB_GID_MAP[row.no] || '';
  if (!raw) return null;
  const gid = /^https?:\/\//i.test(raw) ? (raw.match(/[?#]gid=(\d+)/)?.[1] || '') : raw.replace(/[^\d]/g, '');
  return gid || null;
}

const MOCK_DATA = [
  { id: 1, no: 1, judul_penelitian: 'Pengembangan Biosistem dan pengolahan Biomassa Sorgum Sebagai Pendukung Bioenergi', judul_sub_penelitian: 'Pengembangan Tanaman Energi : Kalianda dan Sorgum Sebagai Umpan Co-Firing dan Umpan Produksi Hidrogen Melalui Proses Gasifikasi Guna Mencapai Bauran Energi Baru – Terbarukan (EBT) Nasional', cluster: 'BIOENERGY', mitra: 'ITERA', pic: 'Intan Pamungkas', status: 'Final Approval', lingkup: 'Kajian potensi pengembangan agroforestri sorgum–kaliandra sebagai sumber biomassa bioenergi, evaluasi kualitas biomassa, analisis co-firing dan steam gasification produksi hidrogen, serta tekno-ekonomi dan LCA.', luaran: 'Dataset & peta kesesuaian lahan, model pertumbuhan biomassa, prototipe gasifier 2 kg/jam, produk gas hidrogen kemurnian ≥99,9%, tekno-ekonomi & LCA.', rab: 871000000, core_hub: true, ptb: false, catatan_implementasi_2026: false, wbs_2026: 'I.8101.26.15.1011.013.60', kategori: 'Technology Leader', link_pp: '' },
  { id: 2, no: 2, judul_penelitian: 'Model Optimasi Rantai Pasok Hidrogen Multi-Tujuan & Database Baseline 5', judul_sub_penelitian: 'Model Optimasi Rantai Pasok Hidrogen Multi-Tujuan & Database Baseline 5', cluster: 'HYDROGEN AND AMONIA UTILIZATION', mitra: 'MANDIRI', pic: 'Mujammil AR', status: 'Final Approval', lingkup: 'Pengembangan model optimasi jaringan sustainable supply chain hidrogen (H₂) dan amonia (NH₃) cofiring untuk sektor pembangkitan listrik di Indonesia.', luaran: 'Model optimasi sustainable supply chain hydrogen & ammonia cofiring, publikasi jurnal ilmiah.', rab: 100000000, core_hub: true, ptb: false, catatan_implementasi_2026: false, wbs_2026: 'I.8101.26.15.1011.001.60', kategori: 'Operational Excellence', link_pp: '' },
  { id: 3, no: 3, judul_penelitian: 'Kajian Desain dan Kelayakan Sistem Penangkapan Karbon Berbasis Microalga Menuju Skala Industri', judul_sub_penelitian: 'Kajian Desain dan Kelayakan Sistem Penangkapan Karbon Berbasis Microalga Menuju Skala Industri', cluster: 'CCUS/CLEAN AIR', mitra: 'UGM', pic: 'Meiri Triani', status: 'Final Approval', lingkup: 'Analisis karakteristik flue gas & daya dukung PLTU, perancangan sistem mikroalga (open pond + photobioreactor) untuk penyerapan CO₂, evaluasi kinerja, dan kajian pemanfaatan biomassa mikroalga.', luaran: 'Data karakteristik flue gas, desain & integrasi sistem CO2 berbasis mikroalga, basis data kinerja plant, rekomendasi pemanfaatan biomassa.', rab: 777313750, core_hub: true, ptb: false, catatan_implementasi_2026: true, wbs_2026: 'I.8101.26.15.1011.014.60', kategori: 'Patent Oriented', link_pp: '' },
  { id: 4, no: 4, judul_penelitian: 'Evaluasi Kinerja dan Energy Penalty Teknologi dalam rangka persiapan uji coba small scale CCS/CCUS pada PLTU batubara', judul_sub_penelitian: 'Evaluasi Kinerja dan Energy Penalty Teknologi dalam rangka persiapan uji coba small scale CCS/CCUS pada PLTU batubara', cluster: 'CCUS/CLEAN AIR', mitra: 'Mandiri', pic: 'Eko Haryostanto', status: 'Final Approval', lingkup: 'Identifikasi potensi penerapan CCS/CCUS pada PLTU, evaluasi teknis pada pembangkit eksisting, analisis kelayakan ekonomi & infrastruktur, serta rekomendasi awal pengembangan.', luaran: 'Dokumen kajian teknis, identifikasi teknologi carbon capture, analisis faktor pendukung implementasi, rekomendasi strategi pengembangan.', rab: 150000000, core_hub: true, ptb: false, catatan_implementasi_2026: false, wbs_2026: 'I.8101.26.15.1011.014.60', kategori: 'Technology Leader', link_pp: '' },
  { id: 5, no: 5, judul_penelitian: 'Pengembangan Model Rantai Pasok Biomassa Berbasis Komunitas untuk PLTBm Skala Kecil di Nusa Penida', judul_sub_penelitian: 'Pengembangan Model Rantai Pasok Biomassa Berbasis Komunitas untuk PLTBm Skala Kecil di Nusa Penida', cluster: 'BIOENERGY', mitra: 'ITB', pic: 'Andrew Cahyo Adi', status: 'Final Approval', lingkup: 'Pengembangan integrasi sektor energi, pertanian, dan peternakan, serta penyusunan skema bisnis dan rantai pasok biomassa untuk PLTBm berbasis gasifikasi.', luaran: 'Model insentif, dryer biomassa, data empiris operasional, evaluasi sosial-ekonomi, SOP & guideline implementasi.', rab: 1526375000, core_hub: true, ptb: false, catatan_implementasi_2026: true, wbs_2026: 'I.8101.26.15.1011.013.60', kategori: 'Operational Excellence', link_pp: '' },
  { id: 6, no: 6, judul_penelitian: 'Strategi Manajemen Energi pada Sistem Penyimpanan Baterai–Hidrogen Terintegrasi di Mikrogrid Green Hydrogen Hub (GHH) PLN Puslitbang', judul_sub_penelitian: 'Strategi Manajemen Energi pada Sistem Penyimpanan Baterai–Hidrogen Terintegrasi di Mikrogrid Green Hydrogen Hub (GHH) PLN Puslitbang', cluster: 'HYDROGEN AND AMONIA UTILIZATION', mitra: 'UI', pic: 'Handrea B Tambunan', status: 'Approval 2', lingkup: 'Operasi sistem Green Hydrogen Hub (GHH) mulai produksi hidrogen sampai utilisasi (end-to-end).', luaran: 'Model operasi end-to-end GHH, strategi operasi & EMS, evaluasi teknis/keselamatan/keandalan implementasi GHH.', rab: 150000000, core_hub: true, ptb: false, catatan_implementasi_2026: true, wbs_2026: 'I.8101.26.15.1011.001.60', kategori: 'Technology Leader', link_pp: '' },
  { id: 7, no: 7, judul_penelitian: 'Pengujian Kinerja dan Validasi Sistem PLTAL Berbasis Floater untuk Optimalisasi Performa Pada Lokasi Uji Terkendali', judul_sub_penelitian: 'Pengujian Kinerja dan Validasi Sistem PLTAL Berbasis Floater untuk Optimalisasi Performa Pada Lokasi Uji Terkendali', cluster: 'HYDRO & OCEAN ENERGY', mitra: 'Pusat Riset Hidrodinamika BRIN, UGM', pic: 'Rasgianti', status: 'Final Approval', lingkup: 'Analisis karakteristik seakeeping floater PLTAL secara numerik (ANSYS AQWA), serta validasi model melalui pengujian langsung di laut bebas.', luaran: 'Model numerik tervalidasi, dokumen pengujian.', rab: 981764000, core_hub: true, ptb: false, catatan_implementasi_2026: false, wbs_2026: 'I.8101.26.15.1011.010.60', kategori: 'Technology Leader', link_pp: '' },
  { id: 8, no: 8, judul_penelitian: 'Studi Komparatif Multi-Teknologi Baterai sebagai Sistem Penyimpanan Daya di sistem GHH Puslitbang dan EVCS Senayan', judul_sub_penelitian: 'Studi Komparatif Multi-Teknologi Baterai sebagai Sistem Penyimpanan Daya di sistem GHH Puslitbang dan EVCS Senayan', cluster: 'ENERGY STORAGE', mitra: 'UI', pic: 'Agussalim Syamsuddin', status: 'Final Approval', lingkup: 'Perbandingan performa baterai LFP dan VRFB berdasarkan data operasi aktual: efisiensi, respons dinamis, degradasi, dan keekonomian.', luaran: 'Karakteristik teknis baterai, kinerja aktual, ketahanan & degradasi, efisiensi energi, kesesuaian teknologi.', rab: 350000000, core_hub: true, ptb: false, catatan_implementasi_2026: true, wbs_2026: 'I.8101.26.15.1011.003.60', kategori: 'Technology Leader', link_pp: '' },
  { id: 9, no: 9, judul_penelitian: 'Analisa pembakaran dan risiko berbagai biomass co-firing menggunakan biomass burner', judul_sub_penelitian: 'Analisa pembakaran dan risiko berbagai biomass co-firing menggunakan biomass burner', cluster: 'BIOENERGY', mitra: 'UGM', pic: 'Nur Cahyo', status: 'Final Approval', lingkup: 'Karakterisasi & analisis TGA biomassa, modifikasi desain Horizontal Entrained Coal and Biomass Burner, pengembangan prototipe, dan pengujian performa pembakaran.', luaran: 'Kajian literatur desain venturi, hasil TGA, desain & modifikasi sistem, prototipe burner, publikasi & draft paten.', rab: 30000000, core_hub: true, ptb: false, catatan_implementasi_2026: false, wbs_2026: 'I.8101.26.15.1011.013.60', kategori: 'Operational Excellence', link_pp: '' },
  { id: 10, no: 10, judul_penelitian: 'Pemanfaatan Ketersediaan Energi untuk Mendorong Pertumbuhan Ekonomi Lokal di Gili Ketapang', judul_sub_penelitian: 'Pemanfaatan Ketersediaan Energi untuk Mendorong Pertumbuhan Ekonomi Lokal di Gili Ketapang', cluster: 'ENERGY POLICY & ECONOMY', mitra: 'UGM', pic: 'Intan Pamungkas', status: 'Final Approval', lingkup: 'Pemetaan profil kebutuhan & beban energi, penentuan model sinkronisasi ketersediaan energi dan sektor ekonomi prioritas, penyusunan desain kebijakan terintegrasi.', luaran: 'Rekomendasi strategis kebijakan & program energi produktif, model pengembangan GSTP yang dapat direplikasi.', rab: 661119600, core_hub: true, ptb: false, catatan_implementasi_2026: false, wbs_2026: 'I.8101.26.15.1011.006.60', kategori: 'Operational Excellence', link_pp: '' },
  { id: 11, no: 11, judul_penelitian: 'Pengujian Co-Firing Furnace for Solid Fuel Combustion', judul_sub_penelitian: 'Pengujian Co-Firing Furnace for Solid Fuel Combustion', cluster: 'BIOENERGY', mitra: 'UGM', pic: 'Nur Cahyo', status: 'Final Approval', lingkup: 'Pengembangan peralatan co-firing gas furnace, pengujian performa gas burner dengan berbagai bahan bakar gas, evaluasi efektivitas pembakaran bahan bakar padat.', luaran: 'Prototype burner, laporan hasil studi eksperimen pembakaran.', rab: 200000000, core_hub: true, ptb: false, catatan_implementasi_2026: false, wbs_2026: 'I.8101.26.15.1011.013.60', kategori: 'Operational Excellence', link_pp: '' },
];

const CLUSTER_OPTIONS = ['BIOENERGY', 'HYDROGEN AND AMONIA UTILIZATION', 'CCUS/CLEAN AIR', 'HYDRO & OCEAN ENERGY', 'ENERGY STORAGE', 'ENERGY POLICY & ECONOMY'];
const STATUS_OPTIONS = ['Final Approval', 'Approval 2', 'Review'];
const KATEGORI_OPTIONS = ['Technology Leader', 'Operational Excellence', 'Patent Oriented'];

const ITEMS_PER_PAGE = 6;
const NO_COL_WIDTH = 44;
const JUDUL_COL_WIDTH = 260;

const statusColor = (status) => ({
  'Final Approval': { bg: 'rgba(34,197,94,0.10)', color: '#16a34a' },
  'Approval 2': { bg: 'rgba(255,215,0,0.18)', color: '#8a6d00' },
  'Review': { bg: 'rgba(0,130,202,0.10)', color: '#0082CA' },
}[status] || { bg: 'rgba(100,116,139,0.10)', color: '#64748B' });

const StatusBadge = ({ status }) => {
  const cfg = statusColor(status);
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, borderRadius: 999, padding: '4px 12px',
      fontSize: 10.5, fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase',
      letterSpacing: '0.03em', border: `1px solid ${cfg.color}33`,
    }}>
      {status || '-'}
    </span>
  );
};

const clusterColorMap = {
  'BIOENERGY': '#0082CA',
  'HYDROGEN AND AMONIA UTILIZATION': '#00677d',
  'CCUS/CLEAN AIR': '#8a6d00',
  'HYDRO & OCEAN ENERGY': '#0a7ea4',
  'ENERGY STORAGE': '#7c3aed',
  'ENERGY POLICY & ECONOMY': '#b8930a',
};

const ClusterBadge = ({ cluster }) => {
  const color = clusterColorMap[cluster] || COLORS.neutral || '#64748B';
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800,
      color, background: `${color}18`, border: `1px solid ${color}33`, whiteSpace: 'nowrap',
    }}>
      {cluster || '-'}
    </span>
  );
};

const CheckDot = ({ value }) => (
  <Icon name={value ? 'check_circle' : 'remove'} size={17} style={{ color: value ? '#16a34a' : theme.textFaint }} />
);

const StatCard = ({ icon, label, value, sub, color }) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="simlit-3d-card" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, padding: '20px 22px',
        border: `1px solid ${theme.cardBorder}`, transition: 'all 0.25s ease', cursor: 'default',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex', flexDirection: 'column', gap: 8, borderLeft: `4px solid ${color}`, minWidth: 0,
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: `linear-gradient(145deg, ${color}2e, ${color}12)`, color, flexShrink: 0, boxShadow: `0 4px 10px ${color}33, inset 0 1px 1px rgba(255,255,255,0.5)` }}>
          <Icon name={icon} fill size={20} />
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
};

const Btn = ({ children, onClick, variant = 'secondary', disabled }) => {
  const styles = {
    primary: { background: '#0082CA', color: '#fff', border: 'none', boxShadow: '0 3px 10px rgba(0,130,202,0.25)' },
    secondary: { background: 'rgba(0,130,202,0.08)', color: '#0082CA', border: '1px solid rgba(0,130,202,0.25)' },
    ghost: { background: theme.input, color: theme.text, border: `1px solid ${theme.borderLight}` },
  }[variant];
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{ ...styles, padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease', opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
};

const SectionCard = ({ title, children, action }) => (
  <div className="simlit-3d-card" style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, overflow: 'hidden' }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
      <span style={{ fontWeight: 800, fontSize: 13, color: theme.text, textAlign: 'center' }}>{title}</span>
      {action && <div style={{ position: 'absolute', right: 20 }}>{action}</div>}
    </div>
    {children}
  </div>
);

const formatRp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

// Style input/select yang dipakai di baris "tambah data" langsung di dalam tabel
const rowInputStyle = { width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #0082CA55', fontSize: 12, color: '#0b1c30', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const rowSelectStyle = { ...rowInputStyle, cursor: 'pointer' };

const DetailModal = ({ item, onClose }) => {
  if (!item) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(11,28,48,0.45)',
      backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.card, backdropFilter: 'blur(16px)', borderRadius: 18, border: `1px solid ${theme.cardBorder}`,
        maxWidth: 720, width: '100%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 20px 44px -12px rgba(11,28,48,0.32)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, background: 'linear-gradient(135deg, rgba(0,130,202,0.08), rgba(255,215,0,0.06))' }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <ClusterBadge cluster={item.cluster} />
              <StatusBadge status={item.status} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.text, lineHeight: 1.4 }}>{item.judul_penelitian}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLabel, flexShrink: 0 }}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 12.5 }}>
          {[
            ['Judul Sub-Penelitian', item.judul_sub_penelitian],
            ['Mitra', item.mitra],
            ['PIC Peneliti', item.pic],
            ['WBS 2026', item.wbs_2026],
            ['Kategori', item.kategori],
            ['RAB', formatRp(item.rab)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, borderBottom: `1px solid ${theme.border}`, paddingBottom: 10 }}>
              <span style={{ color: theme.textLabel, fontWeight: 700, flexShrink: 0 }}>{k}</span>
              <span style={{ color: theme.text, fontWeight: 600, textAlign: 'right' }}>{v || '-'}</span>
            </div>
          ))}
          <div>
            <div style={{ color: theme.textLabel, fontWeight: 700, marginBottom: 6 }}>Lingkup Penelitian</div>
            <div style={{ color: theme.textMuted, lineHeight: 1.6 }}>{item.lingkup || '-'}</div>
          </div>
          <div>
            <div style={{ color: theme.textLabel, fontWeight: 700, marginBottom: 6 }}>Luaran Penelitian</div>
            <div style={{ color: theme.textMuted, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.luaran || '-'}</div>
          </div>
          <div style={{ display: 'flex', gap: 20, paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckDot value={item.core_hub} /><span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textMuted }}>CORE HUB</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckDot value={item.ptb} /><span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textMuted }}>PTB</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckDot value={item.catatan_implementasi_2026} /><span style={{ fontSize: 11.5, fontWeight: 700, color: theme.textMuted }}>Implementasi 2026</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function MonitoringPenelitian() {
  const [data, setData] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingLiveData, setUsingLiveData] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [ppDetailView, setPpDetailView] = useState(null);

  const [search, setSearch] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(0);

  const [hoverRowId, setHoverRowId] = useState(null);

  // ── State untuk fitur "Tambah Data" (baris kosong editable di bawah tabel) ──
  const emptyNewRow = {
    judul_penelitian: '', judul_sub_penelitian: '', cluster: CLUSTER_OPTIONS[0], mitra: '', pic: '',
    status: STATUS_OPTIONS[0], lingkup: '', luaran: '', rab: '', core_hub: false, ptb: false,
    catatan_implementasi_2026: false, wbs_2026: '', kategori: KATEGORI_OPTIONS[0], link_pp: '',
  };
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState(emptyNewRow);
  const [savingRow, setSavingRow] = useState(false);
  const [addRowError, setAddRowError] = useState(null);

  // silent=true dipakai untuk polling background — TIDAK menampilkan
  // "Memuat data..." (loading) supaya tabel tidak berkedip/reset tiap kali
  // polling jalan. silent=false hanya dipakai untuk load pertama kali dan
  // saat user klik tombol "Muat Ulang" manual.
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SHEET_CSV_URL}&_cb=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal mengambil data sheet');
      const text = await res.text();
      const rows = parseCSV(text);
      const parsed = rowsToData(rows);
      if (parsed.length === 0) throw new Error('Data sheet kosong / format berubah');
      setData(parsed);
      setUsingLiveData(true);
    } catch (err) {
      // Kalau polling silent gagal, JANGAN timpa data yang sudah tampil dengan
      // MOCK_DATA — biarkan data terakhir yang berhasil tetap terlihat, supaya
      // tidak "lompat" ke data cadangan cuma karena 1x fetch background gagal.
      if (!silent) {
        setData(MOCK_DATA);
        setUsingLiveData(false);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(false); }, [fetchData]);

  // Polling otomatis (silent) — tarik ulang data secara berkala biar perubahan
  // yang terjadi langsung di Google Sheets (atau ditambahkan user lain) ikut
  // muncul tanpa perlu klik "Muat Ulang" manual, dan TANPA mengganggu tampilan
  // tabel yang sedang dilihat (tidak ada "Memuat data..." berkedip). Dijeda
  // saat sedang mengisi form "Tambah Data" supaya tidak menimpa/reset input
  // yang sedang diketik user.
  useEffect(() => {
    if (isAddingRow) return;
    const interval = setInterval(() => { fetchData(true); }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData, isAddingRow]);

  const filtered = useMemo(() => {
    return data.filter(row => {
      if (search && !row.judul_penelitian?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCluster && row.cluster !== filterCluster) return false;
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterKategori && row.kategori !== filterKategori) return false;
      return true;
    });
  }, [data, search, filterCluster, filterStatus, filterKategori]);

  useEffect(() => { setPage(0); }, [search, filterCluster, filterStatus, filterKategori]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const total = data.length;
    const totalRab = data.reduce((s, r) => s + Number(r.rab || 0), 0);
    const approved = data.filter(r => r.status === 'Final Approval').length;
    const pending = total - approved;
    const coreHub = data.filter(r => r.core_hub).length;
    return {
      total, totalRab,
      approvedPct: total ? Math.round((approved / total) * 100) : 0,
      pendingPct: total ? Math.round((pending / total) * 100) : 0,
      coreHub,
    };
  }, [data]);

  const thStyle = { padding: '12px 14px', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#eff4ff', textAlign: 'left', borderBottom: `1px solid ${theme.cardBorder}`, borderRight: `1px solid ${theme.cardBorder}` };
  const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, verticalAlign: 'top', textAlign: 'left' };
  const inlineSelect = { padding: '9px 12px', borderRadius: 10, border: `1px solid ${theme.cardBorder}`, fontSize: 12, fontWeight: 600, color: theme.text, background: '#fff', outline: 'none', cursor: 'pointer' };

  // ── Handler untuk baris "Tambah Data" ──────────────────────────────────
  const handleNewRowChange = (field, value) => setNewRow(r => ({ ...r, [field]: value }));

  const resetNewRow = () => { setNewRow(emptyNewRow); setAddRowError(null); };

  const handleSaveNewRow = async () => {
    if (!newRow.judul_penelitian.trim()) { setAddRowError('Judul Penelitian wajib diisi.'); return; }

    setSavingRow(true); setAddRowError(null);

    try {
      let res;
      try {
        res = await fetch(SHEET_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addPenelitian',
            judul_penelitian: newRow.judul_penelitian,
            judul_sub_penelitian: newRow.judul_sub_penelitian,
            cluster: newRow.cluster,
            mitra: newRow.mitra,
            pic: newRow.pic,
            status: newRow.status,
            lingkup: newRow.lingkup,
            luaran: newRow.luaran,
            rab: toNumber(newRow.rab),
            core_hub: newRow.core_hub,
            ptb: newRow.ptb,
            catatan_implementasi_2026: newRow.catatan_implementasi_2026,
            wbs_2026: newRow.wbs_2026,
            kategori: newRow.kategori,
            link_pp: newRow.link_pp,
          }),
        });
      } catch (networkErr) {
        throw new Error(`Tidak bisa menghubungi server di ${SHEET_API_URL}. Pastikan server backend jalan dan VITE_API_URL sudah benar.`);
      }

      const result = await res.json().catch(() => ({}));
      if (!res.ok || result?.error) {
        throw new Error(result?.error || `Gagal menyimpan (status ${res.status})`);
      }

      setIsAddingRow(false);
      resetNewRow();
      await fetchData(false); // load penuh (bukan silent) biar user langsung lihat baris barunya
    } catch (err) {
      setAddRowError('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingRow(false);
    }
  };

  if (ppDetailView) {
    return (
      <DetailIsuMitigasi
        sheetId={SHEET_ID}
        gid={ppDetailView.gid}
        no={ppDetailView.no}
        fallbackTitle={ppDetailView.judul}
        fallbackPic={ppDetailView.pic}
        totalRab={ppDetailView.rab}
        onBack={() => setPpDetailView(null)}
      />
    );
  }

  const thStickyNo = {
    ...thStyle, textAlign: 'center', width: NO_COL_WIDTH, minWidth: NO_COL_WIDTH,
    position: 'sticky', left: 0, zIndex: 4, background: '#eff4ff', borderRight: `1px solid ${theme.cardBorder}`,
  };
  const thStickyJudul = {
    ...thStyle, textAlign: 'center', minWidth: JUDUL_COL_WIDTH, position: 'sticky', left: NO_COL_WIDTH,
    zIndex: 4, background: '#eff4ff', boxShadow: '2px 0 4px rgba(11,28,48,0.08)', borderRight: `1px solid ${theme.cardBorder}`,
  };
  const STICKY_BG = '#eff4ff';
  const STICKY_BG_HOVER = '#dfeaff';

  const tdStickyNo = (isHover) => ({
    ...tdStyle, textAlign: 'center', fontWeight: 700, color: theme.textFaint, position: 'sticky', left: 0,
    zIndex: 1, background: isHover ? STICKY_BG_HOVER : STICKY_BG, borderRight: `1px solid ${theme.border}`,
  });
  const tdStickyJudul = (isHover) => ({
    ...tdStyle, fontWeight: 700, color: theme.text, cursor: 'pointer', maxWidth: JUDUL_COL_WIDTH, minWidth: JUDUL_COL_WIDTH,
    position: 'sticky', left: NO_COL_WIDTH, zIndex: 1, background: isHover ? STICKY_BG_HOVER : STICKY_BG,
    boxShadow: '2px 0 4px rgba(11,28,48,0.08)', borderRight: `1px solid ${theme.border}`, textAlign: 'justify', textJustify: 'inter-word',
  });

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* HEADER */}
      <div className="simlit-page-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, textAlign: 'left' }}>RESEARCH & MONITORING</div>
          <h1 className="simlit-page-title" style={{ fontSize: 24, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: '-0.01em', textAlign: 'left' }}>Monitoring Penelitian</h1>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0', fontWeight: 500 }}>
            Rekap seluruh penelitian, cluster FRG, mitra, RAB, dan status Simlitbang — sinkron dari Google Sheets.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
            color: usingLiveData ? '#16a34a' : '#8a6d00',
            background: usingLiveData ? 'rgba(34,197,94,0.10)' : 'rgba(255,215,0,0.14)',
            padding: '6px 12px', borderRadius: 999, border: `1px solid ${usingLiveData ? 'rgba(34,197,94,0.3)' : 'rgba(255,215,0,0.35)'}`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: usingLiveData ? '#16a34a' : '#8a6d00' }} />
            {usingLiveData ? 'Data Live dari Spreadsheet' : 'Data Cadangan (Offline)'}
          </span>
          <Btn variant="secondary" onClick={() => fetchData(false)}><Icon name="refresh" size={16} /> Muat Ulang</Btn>
        </div>
      </div>

      {error && (
        <div style={{ background: theme.errorBg, border: `1px solid ${theme.errorBorder}`, borderRadius: 12, padding: '12px 16px', color: COLORS.danger, fontWeight: 600, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="simlit-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        <StatCard icon="folder" label="Total Proyek" value={stats.total} sub="Data dari Simlitbang" color={COLORS.primary} />
        <StatCard icon="account_balance_wallet" label="Total RAB" value={`Rp ${(stats.totalRab / 1e9).toFixed(2)}M`} sub={formatRp(stats.totalRab)} color={COLORS.accent === '#FFD700' ? '#b8930a' : COLORS.accent} />
        <StatCard icon="task_alt" label="Status Approval" value={`${stats.approvedPct}%`} sub={`${stats.pendingPct}% masih pending`} color={COLORS.success} />
        <StatCard icon="hub" label="Terhubung CORE HUB" value={stats.coreHub} sub={`dari ${stats.total} proyek`} color={COLORS.info || '#00677d'} />
      </div>

      {/* FILTERS */}
      <div style={{
        background: theme.card, backdropFilter: 'blur(10px)', border: `1px solid ${theme.cardBorder}`,
        borderRadius: 14, padding: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, background: '#fff',
          border: `1px solid ${theme.cardBorder}`, padding: '9px 14px', borderRadius: 10, minWidth: 240, flex: 1,
        }}>
          <Icon name="search" size={18} style={{ color: theme.textLabel }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari judul penelitian..."
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', color: theme.text, background: 'transparent' }} />
        </div>

        <select value={filterCluster} onChange={e => setFilterCluster(e.target.value)} style={inlineSelect}>
          <option value="">Semua Cluster</option>
          {CLUSTER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inlineSelect}>
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select value={filterKategori} onChange={e => setFilterKategori(e.target.value)} style={inlineSelect}>
          <option value="">Semua Kategori</option>
          {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <button
          onClick={() => { setSearch(''); setFilterCluster(''); setFilterStatus(''); setFilterKategori(''); }}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#0082CA', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="filter_alt_off" size={16} /> Hapus Filter
        </button>
      </div>

      {/* TABLE */}
      <SectionCard
        title={`Daftar Penelitian (${filtered.length} entri)`}
        action={
          <Btn variant="primary" onClick={() => { setIsAddingRow(v => !v); resetNewRow(); }}>
            <Icon name={isAddingRow ? 'close' : 'add'} size={16} /> {isAddingRow ? 'Batal Tambah' : 'Tambah Data'}
          </Btn>
        }
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>Memuat data...</div>
        ) : (filtered.length === 0 && !isAddingRow) ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>Tidak ada data yang cocok dengan filter.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 2000 }}>
                <thead>
                  <tr>
                    <th style={thStickyNo}>No</th>
                    <th style={thStickyJudul}>Judul Penelitian</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 260 }}>Judul Sub-Penelitian</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 170 }}>Cluster FRG</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 120 }}>Mitra</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 150 }}>PIC Peneliti</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 130 }}>Status Simlitbang</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 240 }}>Lingkup Penelitian</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 240 }}>Luaran Penelitian</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 140 }}>RAB</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 90 }}>CORE HUB</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 70 }}>PTB</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 130 }}>Implementasi 2026</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 190 }}>WBS 2026</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 160 }}>Kategori</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 110, borderRight: 'none' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, i) => {
                    const isHover = hoverRowId === row.id;
                    return (
                      <tr key={row.id}
                        onMouseEnter={() => setHoverRowId(row.id)}
                        onMouseLeave={() => setHoverRowId(null)}
                        style={{ transition: 'all 0.2s ease', background: isHover ? theme.rowHover : 'transparent' }}>
                        <td style={tdStickyNo(isHover)}>
                          {String(row.no ?? (page * ITEMS_PER_PAGE + i + 1)).padStart(2, '0')}
                        </td>
                        <td style={tdStickyJudul(isHover)}
                          onClick={() => setDetailItem(row)}>
                          {row.judul_penelitian || <span style={{ color: theme.textFaint, fontWeight: 500, fontStyle: 'italic' }}>Belum diisi</span>}
                        </td>
                        <td style={{ ...tdStyle, color: theme.textMuted, fontStyle: 'italic', maxWidth: 280 }}>
                          <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {row.judul_sub_penelitian}
                          </div>
                        </td>
                        <td style={tdStyle}><ClusterBadge cluster={row.cluster} /></td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{row.mitra}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #0082CA, #00A8E8)',
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0,
                            }}>
                              {row.pic?.split(' ').map(w => w[0]).slice(0, 2).join('')}
                            </div>
                            <span>{row.pic}</span>
                          </div>
                        </td>
                        <td style={tdStyle}><StatusBadge status={row.status} /></td>
                        <td style={{ ...tdStyle, color: theme.textMuted, maxWidth: 260 }}>
                          <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {row.lingkup}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, color: theme.textMuted, maxWidth: 260 }}>
                          <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {row.luaran}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>{formatRp(row.rab)}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}><CheckDot value={row.core_hub} /></td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}><CheckDot value={row.ptb} /></td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}><CheckDot value={row.catatan_implementasi_2026} /></td>
                        <td style={{ ...tdStyle, fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap' }}>{row.wbs_2026 || '-'}</td>
                        <td style={{ ...tdStyle, fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase' }}>{row.kategori}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', borderRight: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <button
                              title="Lihat ringkasan"
                              onClick={() => setDetailItem(row)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLabel, display: 'inline-flex' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#0082CA'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = theme.textLabel; }}>
                              <Icon name="visibility" size={18} />
                            </button>
                            {(() => {
                              const gid = getPPGid(row);
                              return gid ? (
                                <button
                                  title={`Buka detail Isu & Mitigasi PP 2026-${row.no}`}
                                  onClick={() => setPpDetailView({ no: row.no, gid, judul: row.judul_penelitian, pic: row.pic, rab: row.rab })}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textLabel, display: 'inline-flex' }}
                                  onMouseEnter={e => { e.currentTarget.style.color = '#0082CA'; }}
                                  onMouseLeave={e => { e.currentTarget.style.color = theme.textLabel; }}>
                                  <Icon name="open_in_new" size={18} />
                                </button>
                              ) : (
                                <span title={`Gid tab PP 2026-${row.no} belum diisi di PP_TAB_GID_MAP`}
                                  style={{ color: theme.textFaint, opacity: 0.35, display: 'inline-flex', cursor: 'not-allowed' }}>
                                  <Icon name="open_in_new" size={18} />
                                </span>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* ── BARIS KOSONG "TAMBAH DATA" — muncul di bawah data yang sudah ada ── */}
                  {isAddingRow && (
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ ...tdStickyNo(false), background: '#f8fafc', fontStyle: 'italic', color: '#0082CA' }}>Baru</td>
                      <td style={{ ...tdStickyJudul(false), background: '#f8fafc', cursor: 'default' }}>
                        <input value={newRow.judul_penelitian} onChange={e => handleNewRowChange('judul_penelitian', e.target.value)} placeholder="Judul penelitian... *" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.judul_sub_penelitian} onChange={e => handleNewRowChange('judul_sub_penelitian', e.target.value)} placeholder="Judul sub-penelitian" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <select value={newRow.cluster} onChange={e => handleNewRowChange('cluster', e.target.value)} style={rowSelectStyle} disabled={savingRow}>
                          {CLUSTER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.mitra} onChange={e => handleNewRowChange('mitra', e.target.value)} placeholder="Mitra" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.pic} onChange={e => handleNewRowChange('pic', e.target.value)} placeholder="Nama PIC" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <select value={newRow.status} onChange={e => handleNewRowChange('status', e.target.value)} style={rowSelectStyle} disabled={savingRow}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <textarea value={newRow.lingkup} onChange={e => handleNewRowChange('lingkup', e.target.value)} placeholder="Lingkup penelitian" style={{ ...rowInputStyle, minHeight: 54, resize: 'vertical' }} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <textarea value={newRow.luaran} onChange={e => handleNewRowChange('luaran', e.target.value)} placeholder="Luaran penelitian" style={{ ...rowInputStyle, minHeight: 54, resize: 'vertical' }} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input type="number" min={0} value={newRow.rab} onChange={e => handleNewRowChange('rab', e.target.value)} placeholder="0" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc', textAlign: 'center' }}>
                        <input type="checkbox" checked={newRow.core_hub} onChange={e => handleNewRowChange('core_hub', e.target.checked)} disabled={savingRow} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc', textAlign: 'center' }}>
                        <input type="checkbox" checked={newRow.ptb} onChange={e => handleNewRowChange('ptb', e.target.checked)} disabled={savingRow} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc', textAlign: 'center' }}>
                        <input type="checkbox" checked={newRow.catatan_implementasi_2026} onChange={e => handleNewRowChange('catatan_implementasi_2026', e.target.checked)} disabled={savingRow} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.wbs_2026} onChange={e => handleNewRowChange('wbs_2026', e.target.value)} placeholder="WBS 2026" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <select value={newRow.kategori} onChange={e => handleNewRowChange('kategori', e.target.value)} style={rowSelectStyle} disabled={savingRow}>
                          {KATEGORI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc', textAlign: 'center', borderRight: 'none' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            title="Simpan"
                            onClick={handleSaveNewRow}
                            disabled={savingRow}
                            style={{ background: '#0082CA', border: 'none', color: '#fff', borderRadius: 8, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: savingRow ? 'not-allowed' : 'pointer', opacity: savingRow ? 0.6 : 1 }}>
                            <Icon name={savingRow ? 'hourglass_empty' : 'save'} size={16} />
                          </button>
                          <button
                            title="Batal"
                            onClick={() => { setIsAddingRow(false); resetNewRow(); }}
                            disabled={savingRow}
                            style={{ background: '#fff', border: `1px solid ${theme.cardBorder}`, color: theme.textLabel, borderRadius: 8, width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: savingRow ? 'not-allowed' : 'pointer' }}>
                            <Icon name="close" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pesan error simpan (kalau ada), tampil di bawah tabel */}
            {addRowError && (
              <div style={{ padding: '10px 20px', color: COLORS.danger || '#ba1a1a', fontWeight: 600, fontSize: 12.5, borderTop: `1px solid ${theme.borderLight}`, background: 'rgba(186,26,26,0.04)' }}>
                {addRowError}
              </div>
            )}

            {/* PAGINATION */}
            {filtered.length > ITEMS_PER_PAGE && (
              <div className="simlit-list-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: `1px solid ${theme.borderLight}` }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                    background: page === 0 ? theme.input : '#fff', color: page === 0 ? theme.textFaint : '#0082CA',
                    cursor: page === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: page === 0 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease',
                  }}>
                  <Icon name="chevron_left" size={18} />
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, whiteSpace: 'nowrap' }}>
                  Menampilkan {page * ITEMS_PER_PAGE + 1}-{Math.min((page + 1) * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} entri
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', border: `1px solid ${theme.cardBorder}`,
                    background: page >= totalPages - 1 ? theme.input : '#fff', color: page >= totalPages - 1 ? theme.textFaint : '#0082CA',
                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: page >= totalPages - 1 ? 'none' : '0 2px 8px rgba(11,28,48,0.10)', transition: 'all .2s ease',
                  }}>
                  <Icon name="chevron_right" size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </SectionCard>

      <DetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </div>
  );
}
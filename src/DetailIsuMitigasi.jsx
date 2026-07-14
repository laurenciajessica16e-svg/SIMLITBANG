import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { theme, COLORS, Icon } from './theme';

// ── PARSER CSV (sama seperti di MonitoringPenelitian) ───────────────────────
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
const fmtRp = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

// ── DETEKSI KOLOM DINAMIS BERDASARKAN HEADER ────────────────────────────────
function findColIndex(headerRow, keywords, fallbackIndex) {
  if (!headerRow || headerRow.length === 0) return fallbackIndex;
  const idx = headerRow.findIndex(h =>
    keywords.some(k => (h || '').toLowerCase().includes(k))
  );
  return idx !== -1 ? idx : fallbackIndex;
}

// Struktur tab "PP 2026-N":
// Baris 1: A="Judul Penelitian"  C=nilai
// Baris 2: A="Ketua Tim"          C=nilai
// Baris 3: A="Anggota"            C=nilai (dipisah koma)
// Baris 4: A="Status"             C=nilai
// Baris 5: header tabel → A:No C:Tanggal D:Isu/Masalah E:WBS F:Progres(%)
//          G:RISIKO H:MITIGASI/TINDAK LANJUT I:Target J:PIC K:(-) L:Realisasi Anggaran
// Baris 6+: data isu, satu baris per isu
function rowsToIsuData(rows) {
  const meta = {
    judul: rows[0]?.[2]?.trim() || '',
    ketua_tim: rows[1]?.[2]?.trim() || '',
    anggota: rows[2]?.[2]?.trim() || '',
    status: rows[3]?.[2]?.trim() || '',
  };

  const headerRow = (rows[4] || []).map(h => (h || '').trim());

  const col = {
    no: findColIndex(headerRow, ['no'], 0),
    tanggal: findColIndex(headerRow, ['tanggal'], 2),
    isu: findColIndex(headerRow, ['isu', 'masalah'], 3),
    wbs: findColIndex(headerRow, ['wbs'], 4),
    progres: findColIndex(headerRow, ['progres', 'progress'], 5),
    risiko: findColIndex(headerRow, ['risiko', 'resiko', 'risk'], 6),
    mitigasi: findColIndex(headerRow, ['mitigasi', 'tindak lanjut'], 7),
    target: findColIndex(headerRow, ['target'], 8),
    pic: findColIndex(headerRow, ['pic'], 9),
    realisasi: findColIndex(headerRow, ['realisasi'], 11),
  };

  const issues = rows
    .slice(5)
    .filter(r => r[col.no] && !isNaN(Number(r[col.no])))
    .map((r, i) => ({
      id: i + 1,
      no: Number(r[col.no]),
      tanggal: r[col.tanggal]?.trim() || '',
      isu: r[col.isu]?.trim() || '',
      wbs: r[col.wbs]?.trim() || '',
      progres: toNumber(r[col.progres]),
      risiko: r[col.risiko]?.trim() || '',
      mitigasi: r[col.mitigasi]?.trim() || '',
      target: r[col.target]?.trim() || '',
      pic: r[col.pic]?.trim() || '',
      realisasi_anggaran: toNumber(r[col.realisasi]),
    }));

  return { meta, issues };
}

const ITEMS_PER_PAGE = 8;

// Warna progress bar mengikuti tema: merah (lambat) → kuning → biru primary (baik)
const progressColor = (pct) => {
  if (pct >= 70) return '#16a34a';
  if (pct >= 30) return '#8a6d00';
  return COLORS.danger || '#ba1a1a';
};

const StatusChip = ({ status }) => {
  const cfg = {
    'Approved': { bg: 'rgba(34,197,94,0.10)', color: '#16a34a' },
  }[status] || { bg: 'rgba(0,130,202,0.10)', color: '#0082CA' };
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

const PicAvatar = ({ name }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #0082CA, #00A8E8)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0,
    }}>
      {(name || '-').split(' ').map(w => w[0]).slice(0, 2).join('')}
    </div>
    <span style={{ whiteSpace: 'nowrap' }}>{name || '-'}</span>
  </div>
);

// ── STAT CARD (dipakai untuk Total RAB / Realisasi Anggaran / Sisa Dana) ──
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
      <div style={{ fontSize: 20, fontWeight: 800, color: theme.text, lineHeight: 1.1, wordBreak: 'break-word' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
};

const SectionCard = ({ title, children, action }) => (
  <div className="simlit-3d-card" style={{ background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16, border: `1px solid ${theme.cardBorder}`, overflow: 'hidden' }}>
    {title && (
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>{title}</span>
        {action}
      </div>
    )}
    {children}
  </div>
);

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

// Style input yang dipakai di baris "tambah data" langsung di dalam tabel
// (sama seperti pola inline-row di MonitoringPenelitian.jsx)
const rowInputStyle = { width: '100%', padding: '7px 9px', borderRadius: 7, border: '1px solid #0082CA55', fontSize: 12, color: '#0b1c30', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

// ── URL backend Express kamu (server.js) — konsisten dengan MonitoringPenelitian.jsx.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SHEET_API_URL = `${API_BASE}/monitoring-penelitian`;

/**
 * Halaman detail Isu & Mitigasi untuk satu proyek penelitian.
 * Data ditarik real-time dari tab "PP 2026-N" di Google Sheets sesuai `gid`
 * yang dioper dari halaman Monitoring Penelitian (mapping No → PP 2026-N).
 *
 * Props:
 * - sheetId    : ID Google Sheets induk (sama untuk semua tab)
 * - gid        : gid tab "PP 2026-N" spesifik untuk proyek ini (bisa null kalau belum diisi)
 * - no         : nomor urut proyek (dipakai untuk label "PP 2026-{no}")
 * - fallbackTitle / fallbackPic : dipakai sebagai info sementara sebelum data live datang,
 *                                 dan sebagai fallback kalau live fetch gagal
 * - totalRab   : total RAB proyek ini (dioper dari parent, dipakai di stat card)
 * - onBack     : callback tombol kembali ke daftar
 */
export default function DetailIsuMitigasi({ sheetId, gid, no, fallbackTitle, fallbackPic, totalRab, onBack }) {
  const [meta, setMeta] = useState({ judul: fallbackTitle || '', ketua_tim: fallbackPic || '', anggota: '', status: '' });
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingLiveData, setUsingLiveData] = useState(false);

  const [search, setSearch] = useState('');
  const [filterPic, setFilterPic] = useState('');
  const [page, setPage] = useState(0);

  // ── State untuk baris "Tambah Progres" (inline row di dalam tabel, persis
  // pola yang dipakai di MonitoringPenelitian.jsx) ───────────────────────
  const emptyNewRow = { tanggal: '', isu: '', wbs: '', progres: '', risiko: '', mitigasi: '', target: '', pic: '', realisasi_anggaran: '' };
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRow, setNewRow] = useState(emptyNewRow);
  const [savingRow, setSavingRow] = useState(false);
  const [addRowError, setAddRowError] = useState(null);

  const csvUrl = gid ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}` : null;
  const sheetOpenUrl = gid ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit?gid=${gid}#gid=${gid}` : null;

  const fetchData = useCallback(async () => {
    if (!csvUrl) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${csvUrl}&_cb=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal mengambil data tab PP 2026');
      const text = await res.text();
      const rows = parseCSV(text);
      const parsed = rowsToIsuData(rows);
      setMeta(m => ({ ...m, ...parsed.meta }));
      setIssues(parsed.issues);
      setUsingLiveData(true);
    } catch (err) {
      setError('Gagal menarik data live dari PP 2026-' + no + '. Menampilkan info dasar saja.');
      setUsingLiveData(false);
    } finally {
      setLoading(false);
    }
  }, [csvUrl, no]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const picOptions = useMemo(() => Array.from(new Set(issues.map(i => i.pic).filter(Boolean))), [issues]);

  // Total RAB, Realisasi, dan Sisa Dana KHUSUS untuk penelitian ini.
  const rabProyek = Number(totalRab || 0);
  const totalRealisasi = useMemo(
    () => issues.reduce((s, row) => s + Number(row.realisasi_anggaran || 0), 0),
    [issues]
  );
  const sisaDana = rabProyek - totalRealisasi;

  const filtered = useMemo(() => {
    return issues.filter(row => {
      if (search) {
        const q = search.toLowerCase();
        const hit = row.isu?.toLowerCase().includes(q) || row.mitigasi?.toLowerCase().includes(q) || row.risiko?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (filterPic && row.pic !== filterPic) return false;
      return true;
    });
  }, [issues, search, filterPic]);

  useEffect(() => { setPage(0); }, [search, filterPic]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  const thStyle = { padding: '12px 14px', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', background: '#eff4ff', textAlign: 'left', borderBottom: `1px solid ${theme.cardBorder}`, borderRight: `1px solid ${theme.cardBorder}` };
  const tdStyle = { padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, color: theme.text, fontSize: 12, verticalAlign: 'top', textAlign: 'left' };
  const inlineSelect = { padding: '9px 12px', borderRadius: 10, border: `1px solid ${theme.cardBorder}`, fontSize: 12, fontWeight: 600, color: theme.text, background: '#fff', outline: 'none', cursor: 'pointer' };

  // ── Handler untuk baris "Tambah Progres" ──────────────────────────────
  const handleNewRowChange = (field, value) => setNewRow(r => ({ ...r, [field]: value }));

  const resetNewRow = () => { setNewRow(emptyNewRow); setAddRowError(null); };

  const handleSaveNewRow = async () => {
    if (!newRow.isu.trim()) { setAddRowError('Isu/Masalah wajib diisi.'); return; }
    if (!gid) { setAddRowError('Gid tab belum diisi, tidak bisa menyimpan.'); return; }

    setSavingRow(true); setAddRowError(null);

    try {
      let res;
      try {
        res = await fetch(SHEET_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addProgres',
            gid,
            tanggal: newRow.tanggal || new Date().toLocaleDateString('id-ID'),
            isu: newRow.isu,
            wbs: newRow.wbs,
            progres: toNumber(newRow.progres),
            risiko: newRow.risiko,
            mitigasi: newRow.mitigasi,
            target: newRow.target,
            pic: newRow.pic,
            realisasi_anggaran: toNumber(newRow.realisasi_anggaran),
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
      await fetchData(); // tarik ulang biar tabel sinkron persis dengan isi Sheets terbaru
    } catch (err) {
      setAddRowError('Gagal menyimpan: ' + err.message);
    } finally {
      setSavingRow(false);
    }
  };

  return (
    <div style={{ maxWidth: 1500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* BREADCRUMB */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <span style={{ cursor: 'pointer', color: '#0082CA' }} onClick={onBack}>Monitoring Penelitian</span>
        <Icon name="chevron_right" size={14} style={{ color: theme.textFaint }} />
        <span style={{ color: theme.text }}>Detail Isu — PP 2026-{no}</span>
      </nav>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} title="Kembali" style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${theme.cardBorder}`, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.text, flexShrink: 0,
          }}>
            <Icon name="arrow_back" size={18} />
          </button>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>PP 2026-{no}</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: '-0.01em' }}>Monitoring Progress</h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
            color: usingLiveData ? '#16a34a' : '#8a6d00',
            background: usingLiveData ? 'rgba(34,197,94,0.10)' : 'rgba(255,215,0,0.14)',
            padding: '6px 12px', borderRadius: 999, border: `1px solid ${usingLiveData ? 'rgba(34,197,94,0.3)' : 'rgba(255,215,0,0.35)'}`,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: usingLiveData ? '#16a34a' : '#8a6d00' }} />
            {usingLiveData ? 'Data Live dari PP 2026-' + no : 'Belum tertarik / offline'}
          </span>
          <Btn variant="secondary" onClick={fetchData} disabled={!csvUrl}><Icon name="refresh" size={16} /> Muat Ulang</Btn>
          {sheetOpenUrl && (
            <Btn variant="ghost" onClick={() => window.open(sheetOpenUrl, '_blank', 'noopener,noreferrer')}>
              <Icon name="open_in_new" size={16} /> Buka di Sheets
            </Btn>
          )}
        </div>
      </div>

      {!gid && (
        <div style={{ background: theme.errorBg || 'rgba(186,26,26,0.06)', border: `1px solid ${theme.errorBorder || 'rgba(186,26,26,0.25)'}`, borderRadius: 12, padding: '12px 16px', color: COLORS.danger || '#ba1a1a', fontWeight: 600, fontSize: 13 }}>
          Gid untuk tab "PP 2026-{no}" belum diisi di <code>PP_TAB_GID_MAP</code>, jadi data belum bisa ditarik real-time. Lengkapi dulu di halaman Monitoring Penelitian.
        </div>
      )}
      {error && gid && (
        <div style={{ background: theme.errorBg || 'rgba(186,26,26,0.06)', border: `1px solid ${theme.errorBorder || 'rgba(186,26,26,0.25)'}`, borderRadius: 12, padding: '12px 16px', color: COLORS.danger || '#ba1a1a', fontWeight: 600, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* PROJECT INFO CARD */}
      <SectionCard>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Judul Penelitian</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, lineHeight: 1.4 }}>{meta.judul || '-'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Ketua Tim</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PicAvatar name={meta.ketua_tim} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status Project</div>
            <StatusChip status={meta.status} />
          </div>
          {meta.anggota && (
            <div style={{ gridColumn: 'span 4', paddingTop: 16, borderTop: `1px solid ${theme.borderLight}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Anggota Tim</div>
              <div style={{ fontSize: 12.5, color: theme.textMuted, fontWeight: 600 }}>{meta.anggota}</div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* STAT CARDS — RAB, Realisasi, dan Sisa Dana KHUSUS proyek ini */}
      <div className="simlit-stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        <StatCard
          icon="account_balance_wallet"
          label="Total RAB"
          value={fmtRp(rabProyek)}
          sub="Anggaran proyek ini"
          color={COLORS.accent === '#FFD700' ? '#b8930a' : (COLORS.accent || '#b8930a')}
        />
        <StatCard
          icon="payments"
          label="Realisasi Anggaran"
          value={fmtRp(totalRealisasi)}
          sub={rabProyek > 0 ? `${Math.round((totalRealisasi / rabProyek) * 100)}% dari RAB` : 'Belum ada RAB'}
          color={COLORS.primary}
        />
        <StatCard
          icon="account_balance"
          label="Sisa Dana"
          value={fmtRp(Math.abs(sisaDana))}
          sub={sisaDana >= 0 ? 'Anggaran − Realisasi' : 'Melebihi anggaran'}
          color={sisaDana >= 0 ? COLORS.success : (COLORS.danger || '#ba1a1a')}
        />
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
            placeholder="Cari isu, risiko, atau mitigasi..."
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', color: theme.text, background: 'transparent' }} />
        </div>
        <select value={filterPic} onChange={e => setFilterPic(e.target.value)} style={inlineSelect}>
          <option value="">Semua PIC</option>
          {picOptions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(search || filterPic) && (
          <button
            onClick={() => { setSearch(''); setFilterPic(''); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#0082CA', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="filter_alt_off" size={16} /> Hapus Filter
          </button>
        )}
      </div>

      {/* TABLE — tombol "Tambah Progres" ada di samping judul card, dan baris
          input baru muncul langsung di dalam tabel (bukan panel terpisah),
          persis pola yang dipakai di halaman Monitoring Penelitian. */}
      <SectionCard
        title={`List Progress (${filtered.length} entri)`}
        action={
          gid && (
            <Btn variant="primary" onClick={() => { setIsAddingRow(v => !v); resetNewRow(); }}>
              <Icon name={isAddingRow ? 'close' : 'add'} size={16} /> {isAddingRow ? 'Batal Tambah' : 'Tambah Data'}
            </Btn>
          )
        }
      >
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>Memuat data...</div>
        ) : !gid ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>Belum ada data — lengkapi gid tab terlebih dahulu.</div>
        ) : (filtered.length === 0 && !isAddingRow) ? (
          <div style={{ padding: 40, textAlign: 'center', color: theme.textLabel, fontSize: 13 }}>Belum ada isu yang tercatat untuk proyek ini.</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1500 }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'center', width: 44 }}>No</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 130 }}>Tanggal</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 220 }}>Isu/Masalah</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 150 }}>WBS</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 120 }}>Progres (%)</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 190 }}>Risiko</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 230 }}>Mitigasi / Tindak Lanjut</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 120 }}>Target</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 140 }}>PIC</th>
                    <th style={{ ...thStyle, textAlign: 'center', minWidth: 150, borderRight: 'none' }}>Realisasi Anggaran</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, i) => (
                    <tr key={row.id}
                      onMouseEnter={e => { e.currentTarget.style.background = theme.rowHover; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      style={{ transition: 'all 0.2s ease' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 700, color: theme.textFaint }}>
                        {String(row.no ?? (page * ITEMS_PER_PAGE + i + 1)).padStart(2, '0')}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, whiteSpace: 'nowrap' }}>{row.tanggal || '-'}</td>
                      <td style={{ ...tdStyle, maxWidth: 260, lineHeight: 1.6 }}>{row.isu || '-'}</td>
                      <td style={{ ...tdStyle, fontSize: 11, color: theme.textMuted, whiteSpace: 'nowrap' }}>{row.wbs || '-'}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: progressColor(row.progres) }}>{row.progres}%</span>
                          <div style={{ width: '100%', background: theme.input, borderRadius: 999, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, row.progres)}%`, background: progressColor(row.progres), height: '100%', borderRadius: 999 }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: theme.textMuted, lineHeight: 1.6, maxWidth: 220 }}>{row.risiko || '-'}</td>
                      <td style={{ ...tdStyle, lineHeight: 1.7, maxWidth: 260 }}>
                        {row.mitigasi
                          ? row.mitigasi.split('\n').filter(Boolean).map((line, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: idx === row.mitigasi.split('\n').length - 1 ? 0 : 4 }}>
                                <span style={{ color: '#0082CA', fontWeight: 800, flexShrink: 0 }}>{idx + 1}.</span>
                                <span>{line.replace(/^\d+[\.\)]\s*/, '')}</span>
                              </div>
                            ))
                          : '-'}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#0082CA', whiteSpace: 'nowrap' }}>{row.target || '-'}</td>
                      <td style={tdStyle}><PicAvatar name={row.pic} /></td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: '#0082CA', whiteSpace: 'nowrap', borderRight: 'none' }}>{fmtRp(row.realisasi_anggaran)}</td>
                    </tr>
                  ))}

                  {/* ── BARIS KOSONG "TAMBAH DATA" — inline langsung di dalam tabel ── */}
                  {isAddingRow && (
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontStyle: 'italic', color: '#0082CA' }}>Baru</td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input type="date" value={newRow.tanggal} onChange={e => handleNewRowChange('tanggal', e.target.value)} style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.isu} onChange={e => handleNewRowChange('isu', e.target.value)} placeholder="Deskripsi isu... *" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.wbs} onChange={e => handleNewRowChange('wbs', e.target.value)} placeholder="WBS" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input type="number" min={0} max={100} value={newRow.progres} onChange={e => handleNewRowChange('progres', e.target.value)} placeholder="0" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.risiko} onChange={e => handleNewRowChange('risiko', e.target.value)} placeholder="Risiko" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <textarea value={newRow.mitigasi} onChange={e => handleNewRowChange('mitigasi', e.target.value)} placeholder="Mitigasi / tindak lanjut" style={{ ...rowInputStyle, minHeight: 54, resize: 'vertical' }} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.target} onChange={e => handleNewRowChange('target', e.target.value)} placeholder="Target" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc' }}>
                        <input value={newRow.pic} onChange={e => handleNewRowChange('pic', e.target.value)} placeholder="Nama PIC" style={rowInputStyle} disabled={savingRow} />
                      </td>
                      <td style={{ ...tdStyle, background: '#f8fafc', borderRight: 'none' }}>
                        <input type="number" min={0} value={newRow.realisasi_anggaran} onChange={e => handleNewRowChange('realisasi_anggaran', e.target.value)} placeholder="0" style={rowInputStyle} disabled={savingRow} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tombol Simpan/Batal untuk baris baru */}
            {isAddingRow && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: `1px solid ${theme.borderLight}`, background: '#f8fafc' }}>
                {addRowError && <span style={{ color: COLORS.danger || '#ba1a1a', fontSize: 12, fontWeight: 600, marginRight: 'auto' }}>{addRowError}</span>}
                <Btn variant="ghost" onClick={() => { setIsAddingRow(false); resetNewRow(); }} disabled={savingRow}>Batal</Btn>
                <Btn variant="primary" onClick={handleSaveNewRow} disabled={savingRow}>
                  {savingRow ? 'Menyimpan...' : <><Icon name="save" size={16} /> Simpan</>}
                </Btn>
              </div>
            )}

            {/* PAGINATION */}
            {filtered.length > ITEMS_PER_PAGE && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: `1px solid ${theme.borderLight}` }}>
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
    </div>
  );
}

/*
────────────────────────────────────────────────────────────────────────────
CARA MENGAKTIFKAN PENYIMPANAN KE GOOGLE SHEETS
────────────────────────────────────────────────────────────────────────────
Komponen ini memanggil endpoint POST /api/monitoring-penelitian
(action: "addProgres") di backend Express kamu. Pastikan:
1. .env server sudah berisi SIMLITBANG_SHEET_ID (ID spreadsheet Simlitbang).
2. Spreadsheet Simlitbang sudah di-share sebagai Editor ke email service
   account yang sama dengan yang dipakai fitur Monitoring Jadwal.
3. Konstanta API_BASE di atas mengarah ke server backend kamu.
4. Origin app React ini sudah ada di ALLOWED_ORIGINS di .env server.
5. Handler "addProgres" di backend perlu menerima field baru
   `realisasi_anggaran` dan menuliskannya ke kolom "Realisasi Anggaran"
   di tab "PP 2026-N" terkait.
────────────────────────────────────────────────────────────────────────────
*/
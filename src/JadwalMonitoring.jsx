import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { theme, COLORS, Icon } from './theme';

const SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzd8laiguQEggrKxQ509H3X-DRnbyCAdBpys3raAyzABj44SBDWc9bPe3YxpXb4igKdmQ/exec';
const POLL_INTERVAL_MS = 6000;

const WEEK_OPTIONS = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5'];

const useResponsiveStyles = () => {
  useEffect(() => {
    if (document.getElementById('jdm-responsive-style')) return;
    const style = document.createElement('style');
    style.id = 'jdm-responsive-style';
    style.innerHTML = `
      .jdm-tabs{ overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
      .jdm-tabs::-webkit-scrollbar{ display:none; }
      .jdm-two-col{ display:grid; grid-template-columns:280px 1fr; gap:18px; }
      .jdm-stats-2{ display:grid; grid-template-columns:1fr 1fr; gap:16px; max-width:480px; }
      .jdm-header{ display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px; }
      .jdm-form-grid{ display:grid; grid-template-columns:repeat(4, 1fr); gap:14px; }
      .jdm-detail-header{ display:flex; gap:14px; align-items:center; }
      .jdm-tanggapan-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }

      .jdm-addtask-wrap{ max-width:820px; margin:0 auto; width:100%; }
      .jdm-addtask-grid{ display:grid; grid-template-columns:1fr 1fr; gap:16px 20px; }
      .jdm-addtask-grid .jdm-span-2{ grid-column: 1 / -1; }

      /* Tombol "Simpan ke Sheet" digeser ke tengah, tapi tetap ikut lebar grid */
      .jdm-submit-wrap{ grid-column: 1 / -1; display:flex; justify-content:center; margin-top:6px; }
      .jdm-submit-btn{ width:auto; min-width:260px; }

      @media (max-width: 900px){
        .jdm-two-col{ grid-template-columns:1fr; }
        .jdm-list-col{ order:2; }
        .jdm-detail-col{ order:1; }
        .jdm-form-grid{ grid-template-columns:1fr 1fr; }
      }
      @media (max-width: 640px){
        .jdm-stats-2{ max-width:100%; }
        .jdm-header{ align-items:flex-start; }
        .jdm-form-grid{ grid-template-columns:1fr 1fr; }
        .jdm-tanggapan-grid{ grid-template-columns:1fr; }
        .jdm-addtask-grid{ grid-template-columns:1fr; }
        .jdm-tab-label{ display:none; }
        .jdm-tab-btn{ padding:10px !important; }
        .jdm-detail-header{ align-items:flex-start; }
        .jdm-page-title{ font-size:19px !important; }
        .jdm-card-pad{ padding:16px !important; }
        /* Di layar kecil tombol kembali full width supaya mudah ditekan */
        .jdm-submit-btn{ width:100%; min-width:0; }
        /* Kartu detail kegiatan: rapikan spasi & bungkus teks panjang di HP */
        .jdm-info-row{ gap:8px !important; }
        .jdm-info-row svg{ width:15px !important; height:15px !important; }
      }
      @media (max-width: 420px){
        .jdm-detail-header{ flex-direction:column; align-items:flex-start; gap:10px; }
      }
    `;
    document.head.appendChild(style);
  }, []);
};

const card = {
  background: theme.card, backdropFilter: 'blur(10px)', borderRadius: 16,
  border: `1px solid ${theme.cardBorder}`, boxShadow: '0 4px 12px rgba(11,28,48,0.04)',
};

const Btn = ({ children, onClick, variant = 'primary', type = 'button', disabled, style }) => {
  const styles = {
    primary: { background: '#0082CA', color: '#fff', border: 'none', boxShadow: '0 3px 10px rgba(0,130,202,0.25)' },
    secondary: { background: 'rgba(0,130,202,0.08)', color: '#0082CA', border: '1px solid rgba(0,130,202,0.25)' },
    success: { background: '#16a34a', color: '#fff', border: 'none' },
    ghost: { background: theme.input, color: theme.text, border: `1px solid ${theme.borderLight}` },
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...styles, padding: '9px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease', opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap', ...style }}>
      {children}
    </button>
  );
};

const Field = ({ label, children, className }) => (
  <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: theme.textLabel }}>{label}</label>}
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: `1.5px solid ${theme.cardBorder}`, fontSize: 13, fontFamily: 'inherit',
  color: theme.text, background: '#ffffff80', outline: 'none', boxSizing: 'border-box',
};
const selectStyle = { ...inputStyle, background: theme.selectBg, cursor: 'pointer' };

const StatusPill = ({ children, color }) => (
  <span style={{ background: `${color}1f`, color, borderRadius: 999, padding: '4px 12px', fontSize: 10.5, fontWeight: 800, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
    {children}
  </span>
);

const Avatar = ({ name = 'A', size = 40 }) => {
  const firstName = (name || 'A').split(/\n|,/)[0].trim();
  const initials = firstName.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'A';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #0082CA, #FFD700)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.35, flexShrink: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
      {initials}
    </div>
  );
};

const Spinner = ({ small }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: small ? 16 : 48, gap: 12 }}>
    <div style={{ width: small ? 22 : 36, height: small ? 22 : 36, border: `3px solid ${theme.spinnerTrack || '#e5eeff'}`, borderTop: '3px solid #0082CA', borderRadius: '50%', animation: 'jdm-spin 0.8s linear infinite' }} />
    {!small && <span style={{ fontSize: 12, color: theme.textMuted, fontWeight: 600 }}>Memuat data dari spreadsheet...</span>}
    <style>{`@keyframes jdm-spin{ to{ transform:rotate(360deg); } }`}</style>
  </div>
);

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar_month' },
  { key: 'monitoring', label: 'Monitoring', icon: 'monitoring' },
  { key: 'addtask', label: 'Add Task', icon: 'add_circle' },
];

export default function JadwalMonitoring() {
  useResponsiveStyles();

  const apiReady = SHEET_API_URL && !SHEET_API_URL.includes('PASTE_YOUR');

  const [tab, setTab] = useState('dashboard');
  const [team, setTeam] = useState([]);
  const [kegiatanList, setKegiatanList] = useState([]);
  const [selectedKegiatanId, setSelectedKegiatanId] = useState(null);
  const [hasilLaporan, setHasilLaporan] = useState('');
  const [tanggapan1Draft, setTanggapan1Draft] = useState('');
  const [tanggapan2Draft, setTanggapan2Draft] = useState('');

  // ── State bulan (setiap bulan = 1 sheet/tab di spreadsheet) ────────────
  const [bulanAktif, setBulanAktif] = useState('');
  const [availableBulan, setAvailableBulan] = useState([]);
  const [targetBulan, setTargetBulan] = useState('');

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const pollRef = useRef(null);

  // ── Fetch data dari sheet bulan aktif ───────────────────────────────────
  const fetchData = useCallback(async (silent = false, overrideBulan = '') => {
    if (!apiReady) { setLoading(false); return; }
    if (!silent) setLoading(true); else setSyncing(true);
    setError(null);
    try {
      const bulan = overrideBulan || bulanAktif;
      const param = bulan ? `?bulan=${encodeURIComponent(bulan)}` : '';
      const res = await fetch(SHEET_API_URL + param);
      if (!res.ok) throw new Error('Gagal memuat data dari spreadsheet');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTeam(data.team || []);
      setKegiatanList(data.kegiatan || []);
      setAvailableBulan(data.availableBulan || []);
      if (data.bulanAktif && data.bulanAktif !== bulanAktif) {
        setBulanAktif(data.bulanAktif);
      }
      if (!targetBulan && data.bulanAktif) setTargetBulan(data.bulanAktif);
      setLastSync(new Date());
      setSelectedKegiatanId(prev => {
        const stillExists = (data.kegiatan || []).some(k => String(k.id) === String(prev));
        return stillExists ? prev : (data.kegiatan?.[0]?.id ?? null);
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); setSyncing(false);
    }
  }, [apiReady, bulanAktif, targetBulan]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(() => fetchData(true), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kalau bulan diganti, fetch ulang sheet yang bersangkutan
  const handleBulanChange = (newBulan) => {
    setBulanAktif(newBulan);
    setSelectedKegiatanId(null);
    fetchData(false, newBulan);
  };

  const selected = useMemo(
    () => kegiatanList.find(k => String(k.id) === String(selectedKegiatanId)) || kegiatanList[0],
    [kegiatanList, selectedKegiatanId]
  );

  useEffect(() => {
    setHasilLaporan(selected?.hasil_laporan || '');
    setTanggapan1Draft(selected?.tanggapan1 || '');
    setTanggapan2Draft(selected?.tanggapan2 || '');
  }, [selected?.id]);

  const stats = useMemo(() => {
    const totalKegiatan = kegiatanList.length;
    const selesai = kegiatanList.filter(k => (k.hasil_laporan || '').trim() !== '').length;
    const avgProgress = totalKegiatan ? Math.round((selesai / totalKegiatan) * 100) : 0;
    return { totalKegiatan, selesai, avgProgress };
  }, [kegiatanList]);

  // ── POST helper ──────────────────────────────────────────────────────────
  const postAction = async (payload) => {
    if (!apiReady) { alert('Isi SHEET_API_URL terlebih dahulu.'); return null; }
    try {
      const res = await fetch(SHEET_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      alert('❌ ' + err.message);
      return null;
    }
  };

  const handleSimpanHasil = async () => {
    if (!selected) return;
    setKegiatanList(prev => prev.map(k => k.id === selected.id ? { ...k, hasil_laporan: hasilLaporan } : k));
    const ok = await postAction({ action: 'saveHasil', bulan: bulanAktif, id: selected.id, hasil_laporan: hasilLaporan });
    if (ok) fetchData(true);
  };

  const handleSimpanTanggapan = async (slot) => {
    if (!selected) return;
    const text = slot === 1 ? tanggapan1Draft : tanggapan2Draft;
    const field = slot === 1 ? 'tanggapan1' : 'tanggapan2';
    setKegiatanList(prev => prev.map(k => k.id === selected.id ? { ...k, [field]: text } : k));
    const ok = await postAction({ action: 'addTanggapan', bulan: bulanAktif, kegiatan_id: selected.id, slot, text });
    if (ok) fetchData(true);
  };

  // ── Add Task form (kolomnya sama persis dengan sheet) ──────────────────
  const [form, setForm] = useState({
    kegiatan: '', minggu: WEEK_OPTIONS[0], keterangan: '', pic: '',
    tanggal_mulai: '', tanggal_selesai: '', jam_mulai: '', jam_selesai: '', tempat: '',
  });
  const [savingTask, setSavingTask] = useState(false);

  const handleSimpanTask = async () => {
    if (!form.kegiatan.trim()) { alert('Kegiatan wajib diisi!'); return; }
    if (!targetBulan) { alert('Pilih bulan tujuan terlebih dahulu!'); return; }
    setSavingTask(true);
    const result = await postAction({
      action          : 'addTask',
      bulan           : targetBulan,
      nama            : form.kegiatan,
      minggu          : form.minggu,
      keterangan      : form.keterangan,
      pic             : form.pic,
      tanggal_mulai   : form.tanggal_mulai,
      tanggal_selesai : form.tanggal_selesai,
      jam_mulai       : form.jam_mulai,
      jam_selesai     : form.jam_selesai,
      tempat          : form.tempat,
    });
    setSavingTask(false);
    if (result) {
      setForm({ kegiatan: '', minggu: WEEK_OPTIONS[0], keterangan: '', pic: '', tanggal_mulai: '', tanggal_selesai: '', jam_mulai: '', jam_selesai: '', tempat: '' });
      if (targetBulan === bulanAktif) {
        await fetchData();
        if (result.id) setSelectedKegiatanId(result.id);
      } else {
        alert(`✅ Data berhasil ditambahkan ke sheet ${targetBulan}.`);
      }
      setTab('monitoring');
    }
  };

  const SyncBadge = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textLabel, fontWeight: 600 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: error ? '#BA1A1A' : '#16a34a', animation: syncing ? 'jdm-pulse 1s ease infinite' : 'none' }} />
      {error ? 'Sinkronisasi gagal' : lastSync ? `Sinkron ${lastSync.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Menyambungkan...'}
      <style>{`@keyframes jdm-pulse{ 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>
    </div>
  );

  if (!apiReady) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', ...card, padding: 28, textAlign: 'center' }}>
        <Icon name="link_off" size={32} style={{ color: '#BA1A1A' }} />
        <div style={{ fontWeight: 800, fontSize: 15, color: theme.text, marginTop: 10 }}>Belum terhubung ke Spreadsheet</div>
        <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 6, lineHeight: 1.6 }}>
          Tempel URL Apps Script ke konstanta <code>SHEET_API_URL</code> di bagian atas file ini.
        </div>
      </div>
    );
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22, width: '100%', boxSizing: 'border-box', textAlign: 'left' }}>

      {/* ── HEADER ── */}
      <div className="jdm-header">
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>RESEARCH &amp; MONITORING</div>
          <h1 className="jdm-page-title" style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0 }}>Monitoring Jadwal</h1>
          <p style={{ fontSize: 13, color: theme.textMuted, margin: '4px 0 0', fontWeight: 500 }}>
            Data tersinkron langsung dari Google Spreadsheet · Sheet: <strong style={{ color: '#0082CA' }}>{bulanAktif}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: theme.textLabel, fontWeight: 700 }}>Bulan:</span>
            <select
              value={bulanAktif}
              onChange={e => handleBulanChange(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${theme.cardBorder}`, fontSize: 13, fontWeight: 700, color: theme.text, background: '#fff', outline: 'none', cursor: 'pointer' }}>
              {availableBulan.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <SyncBadge />
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(186,26,26,0.07)', border: '1px solid rgba(186,26,26,0.25)', borderRadius: 12, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: '#BA1A1A', fontWeight: 600 }}>{error}</span>
          <Btn variant="secondary" onClick={() => fetchData()}>Coba Lagi</Btn>
        </div>
      )}

      {/* ── SUB TABS ── */}
      <div className="jdm-tabs" style={{ display: 'flex', gap: 6, background: theme.input, padding: 6, borderRadius: 14, border: `1px solid ${theme.cardBorder}`, width: '100%', maxWidth: 460 }}>
        {TABS.map(t => (
          <button key={t.key} className="jdm-tab-btn" onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 700, transition: 'all .15s ease', flex: 1,
              background: tab === t.key ? '#0082CA' : 'transparent',
              color: tab === t.key ? '#fff' : theme.textLabel,
              boxShadow: tab === t.key ? '0 3px 10px rgba(0,130,202,0.25)' : 'none',
              whiteSpace: 'nowrap',
            }}>
            <Icon name={t.icon} size={16} fill={tab === t.key} />
            <span className="jdm-tab-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="jdm-card-pad" style={{ ...card, background: 'linear-gradient(135deg,#0B3A66,#0082CA)', color: '#fff', padding: 24, border: 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Hello, User PIC</div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>Manage your research projects and monitoring tasks efficiently today.</div>
          </div>

          <div className="jdm-card-pad" style={{ ...card, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Kegiatan Selesai · {bulanAktif}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: theme.text, marginTop: 4 }}>{stats.selesai} dari {stats.totalKegiatan} kegiatan sudah ada hasil</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0082CA' }}>{stats.avgProgress}%</div>
            </div>
            <div style={{ background: '#e5eeff', borderRadius: 99, height: 8, overflow: 'hidden', marginTop: 12 }}>
              <div style={{ width: `${stats.avgProgress}%`, height: '100%', background: '#0082CA', borderRadius: 99, transition: 'width 1s ease' }} />
            </div>
          </div>

          {team.length > 0 && (
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, fontWeight: 800, fontSize: 13, color: theme.text }}>
                Beban Kerja PIC · {bulanAktif}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 16 }}>
                {[...team].sort((a, b) => b.jumlah_kegiatan - a.jumlah_kegiatan).map(p => (
                  <div key={p.nama} style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.input, borderRadius: 999, padding: '6px 12px 6px 6px' }}>
                    <Avatar name={p.nama} size={26} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>{p.nama}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#0082CA' }}>{p.jumlah_kegiatan}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Kegiatan Bulan {bulanAktif}</span>
              <a onClick={() => setTab('schedule')} style={{ fontSize: 12, color: '#0082CA', fontWeight: 700, cursor: 'pointer' }}>View Schedule</a>
            </div>
            {kegiatanList.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: theme.textLabel }}>
                Belum ada kegiatan di sheet {bulanAktif}.
              </div>
            )}
            {kegiatanList.map(k => (
              <div key={k.id} onClick={() => { setSelectedKegiatanId(k.id); setTab('monitoring'); }}
                style={{ padding: '14px 20px', borderLeft: '4px solid #0082CA', borderBottom: `1px solid ${theme.borderLight}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: theme.text }}>{k.nama}</div>
                  <div style={{ fontSize: 11, color: theme.textLabel, marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="calendar_today" size={13} />
                      {k.tanggal_mulai && k.tanggal_selesai ? `${k.tanggal_mulai} – ${k.tanggal_selesai}` : k.tanggal_mulai || '-'}
                    </span>
                    {k.tempat && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="location_on" size={13} /> {k.tempat}</span>}
                  </div>
                </div>
                <span style={{ background: '#0B3A66', color: '#fff', fontSize: 10.5, fontWeight: 800, padding: '5px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  {(k.pic || '').split(/\n|,/)[0].toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: SCHEDULE ── */}
      {tab === 'schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="jdm-stats-2">
            <div style={{ background: '#0B3A66', color: '#fff', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Total Kegiatan</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>{stats.totalKegiatan}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>Bulan {bulanAktif}</div>
            </div>
            <div style={{ background: '#FFD700', color: '#3a2c00', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase' }}>Bulan Aktif</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>{bulanAktif}</div>
            </div>
          </div>

          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.borderLight}`, fontWeight: 800, fontSize: 13, color: theme.text }}>
              Jadwal Kegiatan · {bulanAktif}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#eff4ff' }}>
                    {['No', 'Kegiatan', 'Minggu ke', 'Tgl Mulai', 'Tgl Selesai', 'Jam Mulai', 'Jam Selesai', 'PIC', 'Tempat', 'Keterangan'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kegiatanList.length === 0 && (
                    <tr><td colSpan={10} style={{ padding: 24, textAlign: 'center', color: theme.textLabel, fontSize: 12 }}>Belum ada data.</td></tr>
                  )}
                  {kegiatanList.map((k) => (
                    <tr key={k.id}
                      onClick={() => { setSelectedKegiatanId(k.id); setTab('monitoring'); }}
                      style={{ borderBottom: `1px solid ${theme.borderLight}`, cursor: 'pointer', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = theme.rowHover || '#f8faff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: theme.textFaint }}>{k.no}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0082CA', maxWidth: 260 }}>{k.nama}</td>
                      <td style={{ padding: '11px 14px', color: theme.textMuted, whiteSpace: 'nowrap' }}>{k.minggu || '-'}</td>
                      <td style={{ padding: '11px 14px', color: theme.text, whiteSpace: 'nowrap' }}>{k.tanggal_mulai || '-'}</td>
                      <td style={{ padding: '11px 14px', color: theme.text, whiteSpace: 'nowrap' }}>{k.tanggal_selesai || '-'}</td>
                      <td style={{ padding: '11px 14px', color: theme.text }}>{k.jam_mulai || '-'}</td>
                      <td style={{ padding: '11px 14px', color: theme.text }}>{k.jam_selesai || '-'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: theme.text, whiteSpace: 'pre-line' }}>{k.pic}</td>
                      <td style={{ padding: '11px 14px', color: theme.textMuted }}>{k.tempat || '-'}</td>
                      <td style={{ padding: '11px 14px', color: theme.textMuted, maxWidth: 220 }}>{k.keterangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MONITORING ── */}
      {tab === 'monitoring' && (
        <div className="jdm-two-col">
          <div className="jdm-list-col" style={{ ...card, padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${theme.borderLight}`, fontWeight: 800, fontSize: 12.5, color: theme.text }}>
              Daftar Kegiatan · {bulanAktif}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {kegiatanList.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: theme.textLabel }}>Belum ada kegiatan.</div>
              )}
              {kegiatanList.map(k => (
                <div key={k.id} onClick={() => setSelectedKegiatanId(k.id)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderLeft: selected?.id === k.id ? '4px solid #0082CA' : '4px solid transparent', background: selected?.id === k.id ? theme.navActive || '#eff4ff' : 'transparent', borderBottom: `1px solid ${theme.borderLight}` }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.nama}</div>
                  <div style={{ fontSize: 10.5, color: theme.textLabel, marginTop: 3 }}>{(k.pic || '').split(/\n|,/)[0]} · {k.tanggal_mulai || '-'}</div>
                </div>
              ))}
            </div>
          </div>

          {selected && (
            <div className="jdm-detail-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <div className="jdm-card-pad" style={{ ...card, padding: 22 }}>
                <div className="jdm-detail-header">
                  <Avatar name={selected.pic} size={52} />
                  <div style={{ minWidth: 0, textAlign: 'left', width: '100%' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: theme.text, whiteSpace: 'pre-line', textAlign: 'left' }}>{selected.pic}</div>
                    <div style={{ fontSize: 11, color: theme.textLabel, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left' }}>No {selected.no} · {selected.minggu || '-'}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                      <StatusPill color={(selected.hasil_laporan || '').trim() ? COLORS.success : '#c98a00'}>
                        {(selected.hasil_laporan || '').trim() ? 'Ada Hasil' : 'Belum Ada Hasil'}
                      </StatusPill>
                      {selected.tempat && <StatusPill color={COLORS.primary}>{selected.tempat}</StatusPill>}
                    </div>
                  </div>
                </div>

                <div className="jdm-info-list" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { icon: 'work', label: 'Kegiatan', value: selected.nama },
                    { icon: 'location_on', label: 'Tempat', value: selected.tempat || '-' },
                    { icon: 'description', label: 'Keterangan', value: selected.keterangan || '-' },
                    { icon: 'calendar_today', label: 'Tanggal', value: selected.tanggal_mulai && selected.tanggal_selesai ? `${selected.tanggal_mulai} s/d ${selected.tanggal_selesai}` : selected.tanggal_mulai || '-' },
                    { icon: 'schedule', label: 'Jam', value: selected.jam_mulai && selected.jam_selesai ? `${selected.jam_mulai} - ${selected.jam_selesai}` : selected.jam_mulai || '-' },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="jdm-info-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%', textAlign: 'left' }}>
                      <Icon name={icon} size={16} style={{ color: '#0082CA', marginTop: 2, flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.textLabel, textTransform: 'uppercase', textAlign: 'left' }}>{label}</div>
                        <div style={{ fontSize: 13, color: theme.text, marginTop: 2, textAlign: 'left', wordBreak: 'break-word', overflowWrap: 'break-word', lineHeight: 1.5 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hasil kegiatan */}
              <div className="jdm-card-pad" style={{ ...card, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>Hasil Kegiatan</span>
                  <Icon name="edit" size={16} style={{ color: theme.textLabel }} />
                </div>
                <textarea value={hasilLaporan} onChange={e => setHasilLaporan(e.target.value)}
                  placeholder="Tuliskan hasil kegiatan..."
                  rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <Btn onClick={handleSimpanHasil}>Simpan Hasil</Btn>
                </div>
              </div>

              {/* Tanggapan 1 & 2 — persis 2 kolom yang ada di sheet */}
              <div className="jdm-card-pad" style={{ ...card, padding: 20 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: theme.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="forum" size={16} style={{ color: '#0082CA' }} /> Tanggapan &amp; Koreksi
                </div>
                <div className="jdm-tanggapan-grid">
                  <Field label="Tanggapan 1">
                    <textarea value={tanggapan1Draft} onChange={e => setTanggapan1Draft(e.target.value)}
                      placeholder="Belum ada tanggapan..." rows={3}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                    <div style={{ textAlign: 'right' }}>
                      <Btn variant="secondary" style={{ marginTop: 8 }} onClick={() => handleSimpanTanggapan(1)}>Simpan</Btn>
                    </div>
                  </Field>
                  <Field label="Tanggapan 2">
                    <textarea value={tanggapan2Draft} onChange={e => setTanggapan2Draft(e.target.value)}
                      placeholder="Belum ada tanggapan..." rows={3}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                    <div style={{ textAlign: 'right' }}>
                      <Btn variant="secondary" style={{ marginTop: 8 }} onClick={() => handleSimpanTanggapan(2)}>Simpan</Btn>
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ADD TASK ── */}
      {tab === 'addtask' && (
        <div className="jdm-card-pad" style={{ ...card, padding: 28, width: '100%', boxSizing: 'border-box' }}>
          <div className="jdm-addtask-wrap">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0082CA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Input Data Monitoring / Jadwal</div>
            <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 4, marginBottom: 18 }}>Data akan langsung ditambahkan sebagai baris baru di sheet bulan yang dipilih.</div>

            <div className="jdm-addtask-grid">

              <Field label="Tambah ke Bulan *">
                <select style={selectStyle} value={targetBulan} onChange={e => setTargetBulan(e.target.value)}>
                  {availableBulan.length === 0 && <option value="">Memuat daftar bulan...</option>}
                  {availableBulan.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>

              <Field label="Minggu ke">
                <select style={selectStyle} value={form.minggu} onChange={e => setForm({ ...form, minggu: e.target.value })}>
                  {WEEK_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>

              <Field className="jdm-span-2" label="Kegiatan *">
                <input style={inputStyle} placeholder="Contoh: Audit Panel Distribusi 24" value={form.kegiatan} onChange={e => setForm({ ...form, kegiatan: e.target.value })} />
              </Field>

              <Field label="PIC">
                <input style={inputStyle} placeholder="Nama PIC (pisahkan dengan koma jika lebih dari satu)" value={form.pic} onChange={e => setForm({ ...form, pic: e.target.value })} />
              </Field>

              <Field label="Tempat">
                <input style={inputStyle} placeholder="Lokasi kegiatan" value={form.tempat} onChange={e => setForm({ ...form, tempat: e.target.value })} />
              </Field>

              <Field className="jdm-span-2" label="Keterangan">
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Detail teknis atau instruksi khusus..."
                  value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} />
              </Field>

              <div className="jdm-span-2 jdm-form-grid">
                <Field label="Tanggal Mulai"><input type="date" style={inputStyle} value={form.tanggal_mulai} onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })} /></Field>
                <Field label="Tanggal Selesai"><input type="date" style={inputStyle} value={form.tanggal_selesai} onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })} /></Field>
                <Field label="Jam Mulai"><input type="time" style={inputStyle} value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} /></Field>
                <Field label="Jam Selesai"><input type="time" style={inputStyle} value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} /></Field>
              </div>

              <div className="jdm-submit-wrap">
                <button onClick={handleSimpanTask} disabled={savingTask}
                  className="jdm-submit-btn"
                  style={{ background: savingTask ? theme.input : '#FFD700', color: savingTask ? theme.textLabel : '#3a2c00', border: 'none', padding: '14px 28px', borderRadius: 14, fontSize: 13, fontWeight: 800, cursor: savingTask ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="save" size={18} /> {savingTask ? `Menyimpan ke sheet ${targetBulan}...` : `Simpan ke Sheet ${targetBulan}`}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
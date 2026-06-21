import React, { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { formatPrice } from '../../utils/format';
import { getInvoiceMetadata } from '../../utils/invoice';

const HomeDashboard: React.FC = () => {
  const { invoices, setActiveModule, setDirectAddNewModule } = useAppContext();
  const { files } = useFileState();
  const { tasks } = useWorkflowContext();
  const { penulis, penerbit, naskah, tim } = useDataMasterContext();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { id: 'tambah-tugas', label: '➕ Tambah Tugas Baru', desc: 'Daftarkan tugas alur kerja produksi baru', color: '#10b981' },
    { id: 'invoice', label: '✍️ Buat Invoice Baru', desc: 'Buat lembar tagihan kuitansi resmi baru', color: '#06b6d4' },
    { id: 'penulis', label: '👤 Tambah Kontak/Penulis', desc: 'Daftarkan profil penulis atau klien baru', color: '#3b82f6' },
    { id: 'naskah', label: '📚 Tambah Naskah Baru', desc: 'Daftarkan pesanan order buku masuk baru', color: '#a855f7' },
    { id: 'penerbit', label: '🏢 Tambah Mitra Penerbit', desc: 'Daftarkan mitra penerbit kerja sama baru', color: '#f59e0b' },
    { id: 'tim', label: '👨‍💼 Tambah Anggota Tim', desc: 'Daftarkan staf pelaksana alur produksi baru', color: '#6b7280' },
    { id: 'legalitas', label: '⚖️ Ajukan Legalitas Buku', desc: 'Ajukan ISBN atau hak cipta buku baru', color: '#ef4444' },
    { id: 'services', label: '🛠️ Tambah Layanan Jasa', desc: 'Daftarkan jenis layanan baru di katalog', color: '#14b8a6' },
  ];

  const greeting = useMemo(() => {
    const hrs = time.getHours();
    if (hrs < 12) return 'Selamat Pagi';
    if (hrs < 15) return 'Selamat Siang';
    if (hrs < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, [time]);

  const produksiStats = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter(t => t.status === 'Proses' || t.status === 'Belum Mulai').length;
    const pendingRevisi = tasks.filter(t => t.status === 'Menunggu Revisi').length;
    const pendingApproval = tasks.filter(t => t.status === 'Menunggu Approval').length;
    return { total, active, pendingRevisi, pendingApproval };
  }, [tasks]);

  const invoiceStats = useMemo(() => {
    let lunas = 0;
    let piutang = 0;
    invoices.forEach(inv => {
      const meta = getInvoiceMetadata(inv);
      const status = (meta.paymentStatus || 'BELUM LUNAS').toUpperCase();
      if (status === 'LUNAS') {
        lunas += inv.total;
      } else {
        piutang += inv.total;
      }
    });
    return { count: invoices.length, lunas, piutang };
  }, [invoices]);

  const masterCount = useMemo(() => {
    return penulis.length + penerbit.length + naskah.length + tim.length;
  }, [penulis, penerbit, naskah, tim]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)', fontFamily: "'Outfit', 'Inter', sans-serif" }}>

      {/* Scrollable Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxSizing: 'border-box' }}>
        
        {/* Banner Selamat Datang */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-panel) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              {greeting}, Rekan Kerja!
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: '1.5' }}>
              Selamat datang di panel utama PubDesk. Pantau seluruh proses produksi naskah, <br />
              terbitkan tagihan invoice, dan kelola arsip berkas digital Anda di satu tempat secara efisien.
            </p>
          </div>

          {/* Jam Real-time */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 20px',
            textAlign: 'right',
            minWidth: '150px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)', fontFamily: '"JetBrains Mono", monospace' }}>
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Panel Akses Cepat */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Akses Navigasi Cepat
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {quickActions.map(action => (
              <div
                key={action.id}
                onClick={() => {
                  setActiveModule(action.id as any);
                  if (!['tambah-tugas', 'invoice'].includes(action.id)) {
                    setDirectAddNewModule(action.id);
                  }
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {action.label}
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {action.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Ringkasan Modul (2x2 Grid Seimbang) */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            📊 Ringkasan Operasional & Akses Cepat
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px' }}>
            
            {/* Modul 1: Produksi Naskah */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>🏭 Produksi Naskah</span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: '600' }}>
                    {produksiStats.active} Aktif
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                  Pantau alur kerja buku dari draf penulis, penyuntingan, tata letak, hingga pencetakan massal.
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Menunggu Revisi</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#f97316', marginTop: '4px' }}>{produksiStats.pendingRevisi}</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Menunggu Approval</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6', marginTop: '4px' }}>{produksiStats.pendingApproval}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveModule('produksi-parent')}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-panel)'}
              >
                Masuk ke Produksi ➜
              </button>
            </div>

            {/* Modul 2: Invoice & Insight */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>🧾 Invoice & Keuangan</span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: '600' }}>
                    {invoiceStats.count} Total
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                  Analisis penagihan piutang, penerbitan kuitansi resmi, dan kelola status pembayaran secara terpusat.
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Piutang (Belum Lunas)</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {formatPrice(invoiceStats.piutang)}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Dana Masuk (Lunas)</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#22c55e', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {formatPrice(invoiceStats.lunas)}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveModule('invoice-parent')}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-panel)'}
              >
                Masuk ke Invoice ➜
              </button>
            </div>

            {/* Modul 3: Smart Folders */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>📁 Smart Folders</span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', fontWeight: '600' }}>
                    {files.length} Berkas
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                  Akses dokumen digital secara instan. Folder pintar memisahkan PDF, kuitansi, spreadsheet, dan dokumen kata secara otomatis.
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PDF Reader</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{files.filter(f => f.filename.toLowerCase().endsWith('.pdf')).length}</strong>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Spreadsheet</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{files.filter(f => f.filename.toLowerCase().endsWith('.xlsx') || f.filename.toLowerCase().endsWith('.xls')).length}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveModule('files-parent')}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-panel)'}
              >
                Masuk ke Smart Folders ➜
              </button>
            </div>

            {/* Modul 4: Master Data */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxSizing: 'border-box'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>🗃️ Master Data</span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: '600' }}>
                    {masterCount} Entitas
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                  Kelola basis data inti meliputi data penulis, penerbit mitra, katalog layanan jasa, serta legalitas dokumen kontrak.
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Penulis & Kontak</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{penulis.length}</strong>
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-panel)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Penerbit Mitra</span>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{penerbit.length}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveModule('master-data-parent')}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-panel)'}
              >
                Masuk ke Master Data ➜
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;

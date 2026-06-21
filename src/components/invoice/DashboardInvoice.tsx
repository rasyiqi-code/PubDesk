import React, { useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { getInvoiceMetadata } from '../../utils/invoice';
import { formatPrice } from '../../utils/format';

const STAT_CARDS = [
  { key: 'total_count', label: 'Total Invoice', color: '#3b82f6', icon: '🧾' },
  { key: 'total_nominal', label: 'Total Nominal', color: '#10b981', icon: '💰' },
  { key: 'lunas', label: 'Lunas', color: '#22c55e', icon: '✅' },
  { key: 'belum_lunas', label: 'Belum Lunas/Masalah', color: '#ef4444', icon: '🚨' },
  { key: 'dp', label: 'DP (Down Payment)', color: '#8b5cf6', icon: '💳' },
] as const;

const DashboardInvoice: React.FC = () => {
  const { invoices, setActiveModule } = useAppContext();

  const stats = useMemo(() => {
    let totalCount = invoices.length;
    let totalNominal = 0;
    let lunasCount = 0;
    let lunasNominal = 0;
    let belumLunasCount = 0;
    let belumLunasNominal = 0;
    let dpCount = 0;
    let dpNominal = 0;

    invoices.forEach(inv => {
      totalNominal += inv.total;
      const meta = getInvoiceMetadata(inv);
      const status = (meta.paymentStatus || 'BELUM LUNAS').toUpperCase();
      if (status === 'LUNAS') {
        lunasCount++;
        lunasNominal += inv.total;
      } else if (status === 'DP') {
        dpCount++;
        dpNominal += inv.total;
      } else {
        belumLunasCount++;
        belumLunasNominal += inv.total;
      }
    });

    return {
      total_count: `${totalCount} invoice`,
      total_nominal: formatPrice(totalNominal),
      lunas: `${lunasCount} (${formatPrice(lunasNominal)})`,
      belum_lunas: `${belumLunasCount} (${formatPrice(belumLunasNominal)})`,
      dp: `${dpCount} (${formatPrice(dpNominal)})`,
    };
  }, [invoices]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      {/* Header Bar Seragam */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        height: 44,
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧾</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Dashboard Invoice</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Kelola generator tagihan, cetak invoice PDF, dan ringkasan keuangan tagihan klien.
        </span>
      </div>

      {/* Konten Dashboard yang scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        
        {/* Grid Summary Info Cards terpadu tanpa space/gap dan siku */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          background: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border)', 
          borderRadius: '0px', 
          overflow: 'hidden',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          {STAT_CARDS.map(card => {
            const value = stats[card.key];
            return (
              <div
                key={card.key}
                style={{
                  flex: '1 1 200px',
                  minWidth: '180px',
                  padding: '20px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  boxSizing: 'border-box'
                }}
              >
                {/* Garis aksen warna kecil di sisi atas */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '3px', 
                  background: card.color 
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {card.label}
                  </span>
                  <span style={{ fontSize: '18px' }}>{card.icon}</span>
                </div>

                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '700', 
                  color: 'var(--text-primary)',
                  marginTop: '4px'
                }}>
                  {value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions / Navigasi */}
        <div style={{ 
          background: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border)', 
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            ⚡ Navigasi Cepat Invoice
          </h2>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border)',
            borderLeft: '1px solid var(--border)',
            borderRadius: '0px',
            overflow: 'hidden'
          }}>
            {[
              { module: 'invoice' as const, label: 'Invoice Generator', desc: 'Buat invoice / kuitansi tagihan baru', icon: '✍️' },
              { module: 'invoice-manager' as const, label: 'Manajemen Invoice', desc: 'Daftar, ubah, dan hapus berkas invoice', icon: '🗃️' },
              { module: 'invoice-insight' as const, label: 'Invoice Insight', desc: 'Analisis dan grafik performa piutang', icon: '📊' },
            ].map(act => (
              <button
                key={act.module}
                onClick={() => setActiveModule(act.module)}
                style={{
                  flex: '1 1 33.33%',
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px 20px',
                  border: 'none',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '24px', marginBottom: '4px' }}>{act.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{act.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{act.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Petunjuk Penggunaan */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            💡 Informasi Modul Invoice
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
            Modul Invoice digunakan untuk membuat tagihan resmi ke penulis/mitra. Data invoice terhubung langsung dengan Smart Folders agar dokumen kuitansi otomatis tersimpan dan mudah dibagikan. Pastikan status lunas diperbarui untuk menjaga keakuratan laporan keuangan di Invoice Insight.
          </p>
          <div style={{ 
            padding: '12px', 
            borderRadius: '0px', 
            background: 'var(--bg-panel)', 
            borderLeft: '4px solid var(--accent)',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <strong>Info Tambahan:</strong> Format penomoran invoice dapat disesuaikan di masing-masing template profil perusahaan di bawah Pengaturan.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardInvoice;

import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import InvoiceInsight from './InvoiceInsight';

const DashboardInvoice: React.FC = () => {
  const { setActiveModule } = useAppContext();

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
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Dashboard & Insight Invoice</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Analisis performa piutang, generator tagihan, cetak invoice PDF, dan ringkasan keuangan.
        </span>
      </div>

      {/* Konten Dashboard yang scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        
        {/* Render InvoiceInsight di sini dengan menghilangkan header-nya agar menyatu */}
        <InvoiceInsight hideHeader padding="0" height="auto" overflowY="visible" variant="dashboard" />

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
            ].map(act => (
              <button
                key={act.module}
                onClick={() => setActiveModule(act.module)}
                style={{
                  flex: '1 1 50%',
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
            Modul Invoice digunakan untuk membuat tagihan resmi ke penulis/mitra. Data invoice terhubung langsung dengan Smart Folders agar dokumen kuitansi otomatis tersimpan dan mudah dibagikan. Pastikan status lunas diperbarui untuk menjaga keakuratan laporan keuangan di analisis atas.
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

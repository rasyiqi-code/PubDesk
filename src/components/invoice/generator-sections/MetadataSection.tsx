import React from 'react';
import { useInvoiceContext } from '../../../contexts/InvoiceContext';

interface MetadataSectionProps {
  rightPanelVisible: boolean;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({ rightPanelVisible }) => {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    activeProfile,
    invoiceNo,
    invoiceDate,
    setInvoiceDate,
    invoiceHal,
    setInvoiceHal,
    invoiceLampiran,
    setInvoiceLampiran,
    paymentStatus,
    setPaymentStatus,
    spesifikasiFasilitas,
    setSpesifikasiFasilitas,
  } = useInvoiceContext();

  return (
    <>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Profil / Jenis Invoice</label>
        <select
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
          value={activeProfileId}
          onChange={(e) => setActiveProfileId(e.target.value)}
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>No. Invoice</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              style={{ 
                width: '100%', 
                padding: '10px 36px 10px 14px', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                fontSize: '14px', 
                background: 'var(--bg-panel)', 
                color: 'var(--text-secondary)', 
                cursor: 'not-allowed',
                opacity: 0.85
              }}
              value={invoiceNo}
              readOnly
              placeholder="Otomatis"
            />
            <span 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                color: 'var(--text-secondary)', 
                fontSize: '14px', 
                userSelect: 'none',
                cursor: 'help' 
              }}
              title="Nomor invoice dikunci & dibuat otomatis sesuai format profil aktif. Atur format di Pengaturan."
            >
              🔒
            </span>
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Tanggal Invoice</label>
          <input
            type="text"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            placeholder="Contoh: 11 Juni 2026"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Hal (Perihal)</label>
          <input
            type="text"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={invoiceHal}
            onChange={(e) => setInvoiceHal(e.target.value)}
            placeholder="Perihal Invoice"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Lampiran</label>
          <input
            type="text"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={invoiceLampiran}
            onChange={(e) => setInvoiceLampiran(e.target.value)}
            placeholder="-"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Status Akhir Pembayaran</label>
          <select
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            <option value="LUNAS">LUNAS</option>
            <option value="BELUM LUNAS">BELUM LUNAS</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
        {activeProfile?.showSpesifikasi && (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Spesifikasi & Fasilitas</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={spesifikasiFasilitas}
              onChange={(e) => setSpesifikasiFasilitas(e.target.value)}
              placeholder="Sesuai poster paket yang diambil"
            />
          </div>
        )}
      </div>
    </>
  );
};

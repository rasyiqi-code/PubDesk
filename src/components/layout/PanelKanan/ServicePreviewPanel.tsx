import React from 'react';
import { formatPrice } from '../../../utils/format';

interface ServicePreviewPanelProps {
  serviceId: number | null;
  services: any[];
}

// Mapping kategori layanan ke label yang mudah dibaca
const getCategoryLabel = (cat: string): string => {
  switch (cat) {
    case 'penerbitan': return 'Layanan Penerbitan';
    case 'desain_layout': return 'Desain & Layout';
    case 'haki': return 'Pendaftaran HAKI';
    case 'isbn': return 'Pengajuan ISBN';
    case 'mitra': return 'Layanan Mitra';
    default: return 'Lainnya';
  }
};

/**
 * Panel kanan untuk konteks modul Services dan Settings > Services.
 * Menampilkan detail visual layanan yang dipilih.
 */
const ServicePreviewPanel: React.FC<ServicePreviewPanelProps> = ({ serviceId, services }) => {
  const service = services.find(s => s.id === serviceId);

  if (!service) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <span style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</span>
        <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', marginBottom: '6px', textAlign: 'center' }}>Master Manajemen Layanan</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>
          Pilih salah satu layanan dari tabel master untuk melihat detail visual rincian layanan jasa.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '30px', overflow: 'auto', alignItems: 'center' }}>
      <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Detail Visual Layanan
      </h3>

      {/* Hero card layanan */}
      <div style={{
        width: '100%',
        padding: '24px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #c01c1c 0%, #e04a4a 100%)',
        boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '96px', opacity: 0.15, userSelect: 'none' }}>🛠️</div>
        <span style={{ fontSize: '48px' }}>🛠️</span>
        <div>
          <span style={{
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            color: '#ffffff',
            textTransform: 'uppercase'
          }}>
            {getCategoryLabel(service.category)}
          </span>
        </div>
      </div>

      {/* Rincian layanan */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', textAlign: 'center', lineHeight: '1.3' }}>
          {service.name}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Kategori</span>
            <strong style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(service.category)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Tarif Dasar</span>
            <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{formatPrice(service.price)}</strong>
          </div>
        </div>

        {service.description && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Deskripsi Layanan</span>
            <div style={{
              background: 'var(--bg-card)',
              padding: '14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap'
            }}>
              {service.description}
            </div>
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic', marginTop: '12px' }}>
          Layanan ini dapat digabungkan dalam katalog penawaran atau invoice jasa penerbitan.
        </div>
      </div>
    </div>
  );
};

export default ServicePreviewPanel;

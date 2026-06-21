import React from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';
import { Badge } from '../../../ui/atoms/Badge';
import { Button } from '../../../ui/atoms/Button';

const LegalitasPreviewPanel: React.FC = () => {
  const { selectedLegalitasId, setRightPanelVisible } = useAppContext();
  const { legalitas } = useDataMasterContext();

  const data = legalitas.find(l => l.id === selectedLegalitasId);

  if (!data) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>⚖️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text-primary)' }}>Pilih Legalitas</h3>
        <p style={{ margin: 0, fontSize: '14px' }}>Pilih pengajuan legalitas dari tabel untuk melihat detail.</p>
      </div>
    );
  }

  const formatTanggal = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)' }}>
      {/* Header */}
      <div style={{ 
        padding: '24px', 
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'sticky',
        top: 0,
        background: 'var(--bg-panel)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚖️</span>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {data.tipe}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Diajukan pada: {formatTanggal(data.tanggal_pengajuan || '')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setRightPanelVisible(false)}>
            ✕
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge 
            label={data.status} 
            variant={data.status === 'Selesai' ? 'success' : data.status === 'Ditolak' ? 'danger' : 'neutral'} 
          />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Info Utama */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Informasi Buku
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Judul Buku</div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>{data.judul_buku}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nama Penulis</div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{data.nama_penulis}</div>
            </div>
          </div>
        </div>

        {/* Dokumen & Bukti */}
        {(data.nomor_dokumen || data.proof_path_or_link) && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dokumen & Bukti
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              {data.nomor_dokumen && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nomor Dokumen</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>{data.nomor_dokumen}</div>
                </div>
              )}
              {data.proof_path_or_link && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bukti / Berkas Legalitas</div>
                  <div style={{ fontSize: '14px' }}>
                    <a 
                      href={data.proof_path_or_link} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      🔗 Lihat Dokumen Cloud
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Tambahan */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Catatan
          </h3>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Keterangan</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
              {data.keterangan || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>Tidak ada keterangan tambahan</span>}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default LegalitasPreviewPanel;

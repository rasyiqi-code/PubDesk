import React, { useMemo } from 'react';
import { useCrmContext } from '../../../contexts/CrmContext';
import { Badge } from '../../../ui/atoms/Badge';

interface NaskahPreviewPanelProps {
  naskahId: number | null;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'> = {
  'Belum Dimulai': 'neutral',
  'Sedang Dikerjakan': 'warning',
  'Selesai': 'success',
  'Batal': 'danger'
};

// Baris info — label + value dengan border bawah opsional
const InfoRow = ({
  label,
  value,
  noBorder = false,
}: {
  label: string;
  value: React.ReactNode;
  noBorder?: boolean;
}) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    ...(noBorder ? {} : { borderBottom: '1px solid var(--border)', paddingBottom: '8px' })
  }}>
    <span style={{ color: 'var(--text-secondary)', fontSize: '12px', flexShrink: 0 }}>{label}</span>
    <strong style={{ color: 'var(--text-primary)', fontSize: '12px', textAlign: 'right' }}>{value}</strong>
  </div>
);

// Kartu section standar
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h5 style={{
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: 'var(--text-secondary)',
      marginBottom: '8px'
    }}>
      {title}
    </h5>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: 'var(--bg-card)',
      padding: '12px 14px',
      borderRadius: '10px',
      border: '1px solid var(--border)',
    }}>
      {children}
    </div>
  </div>
);

const NaskahPreviewPanel: React.FC<NaskahPreviewPanelProps> = ({ naskahId }) => {
  const { naskahOrders, penulis, penerbit } = useCrmContext();

  const naskahData = useMemo(() => {
    if (!naskahId) return null;
    return naskahOrders.find((n) => n.id === naskahId) || null;
  }, [naskahOrders, naskahId]);

  const penulisData = useMemo(() => {
    if (!naskahData?.penulis_id) return null;
    return penulis.find((p) => p.id === naskahData.penulis_id) || null;
  }, [naskahData, penulis]);

  const penerbitData = useMemo(() => {
    if (!naskahData?.penerbit_id) return null;
    return penerbit.find((p) => p.id === naskahData.penerbit_id) || null;
  }, [naskahData, penerbit]);

  // Kelengkapan data naskah (persentase field terisi)
  const completeness = useMemo(() => {
    if (!naskahData) return 0;
    const fields = [
      naskahData.naskah_id_code,
      naskahData.genre,
      naskahData.total_pages,
      naskahData.synopsis,
      naskahData.book_size,
      naskahData.legal_type,
      naskahData.penulis_id,
      naskahData.penerbit_id,
      naskahData.package_type,
      naskahData.order_type,
      naskahData.copies,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [naskahData]);

  if (!naskahId || !naskahData) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-panel)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        gap: '12px'
      }}>
        <div style={{ fontSize: '40px', opacity: 0.3 }}>📚</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', fontWeight: '500', lineHeight: '1.5' }}>
          Pilih naskah dari tabel<br />untuk melihat rincian lengkap
        </p>
      </div>
    );
  }

  const titleInitial = naskahData.title.charAt(0).toUpperCase();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-panel)',
      overflowY: 'auto'
    }}>

      {/* Header Inspektur */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: 'var(--text-secondary)',
          display: 'block',
          marginBottom: '10px'
        }}>
          🔍 Inspektur Berkas Cerdas
        </span>

        {/* Profil singkat naskah */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '18px',
            fontWeight: '700',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(99,102,241,0.3)'
          }}>
            {titleInitial}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              lineHeight: '1.4',
              wordBreak: 'break-word'
            }}>
              {naskahData.title}
            </h4>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
              {naskahData.naskah_id_code && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  background: 'rgba(99,102,241,0.12)',
                  color: '#818cf8',
                  fontFamily: 'monospace'
                }}>
                  {naskahData.naskah_id_code}
                </span>
              )}
              {naskahData.genre && (
                <span style={{
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  background: 'rgba(6,182,212,0.12)',
                  color: '#22d3ee',
                  textTransform: 'uppercase'
                }}>
                  {naskahData.genre}
                </span>
              )}
              <Badge
                label={naskahData.status}
                variant={statusVariantMap[naskahData.status] || 'neutral'}
              />
            </div>
          </div>
        </div>

        {/* Progress kelengkapan data */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>Kelengkapan Data</span>
            <span style={{ fontWeight: '600', color: completeness >= 80 ? '#22c55e' : completeness >= 50 ? '#f59e0b' : '#f87171' }}>
              {completeness}%
            </span>
          </div>
          <div style={{
            height: '4px',
            borderRadius: '2px',
            background: 'var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${completeness}%`,
              borderRadius: '2px',
              background: completeness >= 80 ? '#22c55e' : completeness >= 50 ? '#f59e0b' : '#f87171',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Konten Detail */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Sinopsis */}
        {naskahData.synopsis && (
          <div>
            <h5 style={{
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              Sinopsis
            </h5>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
              background: 'var(--bg-card)',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              fontStyle: 'italic',
              opacity: 0.9
            }}>
              &ldquo;{naskahData.synopsis}&rdquo;
            </div>
          </div>
        )}

        {/* Identitas Naskah */}
        <SectionCard title="📖 Identitas Naskah">
          {naskahData.naskah_id_code && (
            <InfoRow label="Kode ID" value={
              <span style={{ fontFamily: 'monospace', color: '#818cf8' }}>{naskahData.naskah_id_code}</span>
            } />
          )}
          <InfoRow label="Genre" value={naskahData.genre || '—'} />
          <InfoRow label="Jumlah Halaman" value={naskahData.total_pages ? `${naskahData.total_pages} hlm` : '—'} />
          <InfoRow label="Ukuran Buku" value={naskahData.book_size || '—'} />
          <InfoRow label="Legalitas" value={naskahData.legal_type || '—'} noBorder />
        </SectionCard>

        {/* Penulis */}
        <SectionCard title="✍️ Penulis">
          {penulisData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0
                }}>
                  {penulisData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{penulisData.name}</div>
                  {penulisData.job && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{penulisData.job}</div>
                  )}
                </div>
              </div>
              {penulisData.institution && (
                <InfoRow label="Institusi" value={penulisData.institution} />
              )}
              {(penulisData.city || penulisData.province) && (
                <InfoRow label="Lokasi" value={[penulisData.city, penulisData.province].filter(Boolean).join(', ')} />
              )}
              {penulisData.wa_number && (
                <InfoRow label="WhatsApp" value={
                  <span style={{ color: '#4ade80' }}>
                    {penulisData.wa_number}
                    {penulisData.wa_valid === 1 && <span style={{ marginLeft: '4px', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penulisData.email && (
                <InfoRow label="Email" value={
                  <span style={{ fontSize: '11px' }}>
                    {penulisData.email}
                    {penulisData.email_valid === 1 && <span style={{ marginLeft: '4px', color: '#4ade80', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penulisData.followup_status && (
                <InfoRow label="Status Followup" value={penulisData.followup_status} noBorder />
              )}
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
              Belum ada penulis yang dipilih
            </div>
          )}
        </SectionCard>

        {/* Penerbit */}
        <SectionCard title="🏢 Penerbit Mitra">
          {penerbitData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0
                }}>
                  {penerbitData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{penerbitData.name}</div>
                  {penerbitData.cooperation_status && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{penerbitData.cooperation_status}</div>
                  )}
                </div>
              </div>
              {(penerbitData.city || penerbitData.province) && (
                <InfoRow label="Lokasi" value={[penerbitData.city, penerbitData.province].filter(Boolean).join(', ')} />
              )}
              {penerbitData.wa_number && (
                <InfoRow label="WhatsApp" value={
                  <span style={{ color: '#4ade80' }}>
                    {penerbitData.wa_number}
                    {penerbitData.wa_valid === 1 && <span style={{ marginLeft: '4px', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penerbitData.email && (
                <InfoRow label="Email" value={
                  <span style={{ fontSize: '11px' }}>
                    {penerbitData.email}
                    {penerbitData.email_valid === 1 && <span style={{ marginLeft: '4px', color: '#4ade80', fontSize: '10px' }}>✓</span>}
                  </span>
                } />
              )}
              {penerbitData.notes && (
                <InfoRow label="Catatan" value={penerbitData.notes} noBorder />
              )}
            </>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
              Belum ada penerbit yang dipilih
            </div>
          )}
        </SectionCard>

        {/* Detail Produksi */}
        <SectionCard title="📦 Detail Produksi">
          <InfoRow label="Paket" value={naskahData.package_type || 'Standar'} />
          <InfoRow label="Tipe Order" value={naskahData.order_type || '—'} />
          <InfoRow label="Jumlah Cetak" value={naskahData.copies ? `${naskahData.copies} eksemplar` : '—'} noBorder />
        </SectionCard>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <span>ID: <strong style={{ fontFamily: 'monospace' }}>#{naskahData.id}</strong></span>
          <span>Dibuat: <strong>{naskahData.created_at ? new Date(naskahData.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</strong></span>
        </div>

      </div>
    </div>
  );
};

export default NaskahPreviewPanel;

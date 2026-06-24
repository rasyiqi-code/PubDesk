import React, { useMemo } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';
import { Badge, getStatusVariant } from '../../../ui/atoms/Badge';
import { getWhatsAppLink, formatPrice } from '../../../utils/format';

interface PenerbitPreviewPanelProps {
  penerbitId: number | null;
}

const PenerbitPreviewPanel: React.FC<PenerbitPreviewPanelProps> = ({ penerbitId }) => {
  const { showToast } = useAppContext();
  const { penerbit, naskah } = useDataMasterContext();

  // Cari data penerbit terpilih
  const penerbitData = useMemo(() => {
    if (!penerbitId) return null;
    return penerbit.find(item => item.id === penerbitId) || null;
  }, [penerbit, penerbitId]);

  // Naskah terkait dengan penerbit ini
  const relatedNaskah = useMemo(() => {
    if (!penerbitId) return [];
    return naskah.filter((n) => n.penerbit_id === penerbitId);
  }, [naskah, penerbitId]);

  // Naskah aktif (status diterbitkan/cetak/distribusi)
  const activeNaskah = useMemo(() => {
    return relatedNaskah.filter(n => 
      ['Diterbitkan', 'Cetak', 'Distribusi', 'Selesai'].includes(n.status)
    );
  }, [relatedNaskah]);

  // Simulasi Dinamis Sisa Deposit Mitra
  // Nilai default: Rp 10.000.000 dipotong Rp 1.500.000 per naskah aktif
  const depositStats = useMemo(() => {
    const initialDeposit = 10000000;
    const costPerNaskah = 1500000;
    const usage = relatedNaskah.length * costPerNaskah;
    const remaining = Math.max(initialDeposit - usage, 1000000);
    const percent = (remaining / initialDeposit) * 100;
    return { remaining, percent };
  }, [relatedNaskah]);

  // Simulasi Royalti Terkumpul (estimasi Rp 750.000 per naskah aktif/selesai)
  const estimatedRoyalty = useMemo(() => {
    return activeNaskah.length * 750000;
  }, [activeNaskah]);

  // Hitung durasi/linimasa kontrak
  const contractTimeline = useMemo(() => {
    if (!penerbitData || !penerbitData.created_at) return null;
    const start = new Date(penerbitData.created_at);
    const end = new Date(start.getTime());
    end.setFullYear(start.getFullYear() + 2); // Durasi kontrak 2 tahun

    const now = new Date();
    const isExpired = now > end;
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = Math.min(Math.max((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24), 0), totalDays);
    const percentTime = isExpired ? 100 : (elapsedDays / totalDays) * 100;

    return {
      startStr: start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      endStr: end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      isExpired,
      percentTime
    };
  }, [penerbitData]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} berhasil disalin!`, 'success');
  };

  if (!penerbitId || !penerbitData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
          Pilih penerbit untuk melihat rincian
        </p>
      </div>
    );
  }

  const nameInitial = penerbitData.name ? penerbitData.name.charAt(0).toUpperCase() : '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '24px', overflowY: 'auto' }}>
      {/* Header Inspektur */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>

        {/* Profil Singkat dengan Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '700',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}>
            {nameInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0', wordBreak: 'break-all' }}>
              {penerbitData.name}
            </h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', textTransform: 'uppercase' }}>
                Mitra Penerbit
              </span>
              <Badge 
                label={penerbitData.cooperation_status || 'Aktif'}
                variant={getStatusVariant(penerbitData.cooperation_status || 'Aktif')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detail Informasi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Sisa Deposit & Kemitraan */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Keuangan & Saldo Deposit
          </h5>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sisa Saldo Deposit:</span>
            <strong style={{ fontSize: '18px', color: '#f59e0b' }}>{formatPrice(depositStats.remaining)}</strong>
          </div>
          <div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
              <div style={{ width: `${depositStats.percent}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Tingkat kecukupan deposit: {depositStats.percent.toFixed(0)}%</span>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Estimasi Royalti Mitra:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatPrice(estimatedRoyalty)}</strong>
          </div>
        </div>

        {/* Linimasa Kontrak Kerja Sama */}
        {contractTimeline && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Linimasa Kontrak Kerja Sama
            </h5>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Status Kontrak:</span>
              <strong style={{ color: contractTimeline.isExpired ? '#dc2626' : '#16a34a' }}>
                {contractTimeline.isExpired ? 'Kontrak Berakhir' : 'Kontrak Aktif'}
              </strong>
            </div>
            <div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                <div style={{ width: `${contractTimeline.percentTime}%`, height: '100%', background: contractTimeline.isExpired ? '#dc2626' : '#16a34a', borderRadius: '3px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                <span>Mulai: {contractTimeline.startStr}</span>
                <span>Akhir: {contractTimeline.endStr}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rincian Kontak */}
        <div>
          <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Rincian Kontak Resmi</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
            
            {/* Email */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email Resmi</span>
              {penerbitData.email ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a
                    href={`mailto:${penerbitData.email}`}
                    title="Kirim Email"
                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    📧 {penerbitData.email}
                  </a>
                  {penerbitData.email_valid === 1 && (
                    <span title="Email Valid" style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                  )}
                  <button 
                    onClick={() => handleCopyText(penerbitData.email!, 'Email')} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}
                    title="Salin Email"
                  >
                    📋
                  </button>
                </div>
              ) : (
                <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Tidak ada email</span>
              )}
            </div>

            {/* WA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>WhatsApp</span>
              {penerbitData.wa_number ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a
                    href={getWhatsAppLink(penerbitData.wa_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat WhatsApp"
                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    💬 {penerbitData.wa_number}
                  </a>
                  {penerbitData.wa_valid === 1 && (
                    <span title="WhatsApp Valid" style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                  )}
                  <button 
                    onClick={() => handleCopyText(penerbitData.wa_number!, 'WhatsApp')} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}
                    title="Salin Nomor"
                  >
                    📋
                  </button>
                </div>
              ) : (
                <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Tidak ada WhatsApp</span>
              )}
            </div>

            {/* Alamat */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Alamat Kantor</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {penerbitData.address || '-'}
              </strong>
            </div>

          </div>
        </div>

        {/* Sosial Media */}
        <div>
          <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Sosial Media</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
            
            {/* Instagram */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Instagram</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {penerbitData.instagram ? `📸 ${penerbitData.instagram}` : '-'}
              </strong>
            </div>

            {/* Facebook */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Facebook</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {penerbitData.facebook ? `👥 ${penerbitData.facebook}` : '-'}
              </strong>
            </div>

            {/* LinkedIn */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>LinkedIn</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {penerbitData.linkedin ? `💼 ${penerbitData.linkedin}` : '-'}
              </strong>
            </div>

          </div>
        </div>

        {/* Alamat Fisik Lengkap */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>Alamat Lengkap</h5>
            {penerbitData.address && (
              <button 
                onClick={() => handleCopyText(penerbitData.address!, 'Alamat')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}
                title="Salin Alamat"
              >
                📋 Salin
              </button>
            )}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--text-primary)', 
            whiteSpace: 'pre-line', 
            lineHeight: '1.4', 
            background: 'rgba(0,0,0,0.1)', 
            padding: '8px 12px', 
            borderRadius: '8px', 
            border: '1px solid var(--border)' 
          }}>
            {penerbitData.address || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Tidak ada alamat terdaftar</span>}
          </div>
        </div>

        {/* Catatan Kemitraan */}
        <div>
          <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Catatan Khusus Kemitraan</h5>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--text-primary)', 
            whiteSpace: 'pre-line', 
            lineHeight: '1.4', 
            background: 'var(--bg-card)', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            border: '1px solid var(--border)',
            fontStyle: penerbitData.notes ? 'normal' : 'italic'
          }}>
            {penerbitData.notes || 'Tidak ada catatan tambahan untuk mitra penerbit ini.'}
          </div>
        </div>

        {/* Naskah Terkait */}
        {relatedNaskah.length > 0 && (
          <div>
            <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              📚 Naskah Terkait ({relatedNaskah.length})
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {relatedNaskah.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{n.title}</div>
                    {n.genre && <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>{n.genre}</div>}
                  </div>
                  <Badge
                    label={n.status}
                    variant={getStatusVariant(n.status)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informasi Sistem */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span>Tipe: <strong>Penerbit</strong></span>
            <span>Terdaftar: {penerbitData.created_at ? new Date(penerbitData.created_at).toLocaleDateString('id-ID') : '-'}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PenerbitPreviewPanel;

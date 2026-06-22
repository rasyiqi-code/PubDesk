import React, { useMemo } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';
import { Badge, getStatusVariant } from '../../../ui/atoms/Badge';
import { Button } from '../../../ui/atoms/Button';
import { getWhatsAppLink, formatPrice } from '../../../utils/format';

interface PenulisPreviewPanelProps {
  penulisId: number | null;
}

const PenulisPreviewPanel: React.FC<PenulisPreviewPanelProps> = ({ penulisId }) => {
  const { contacts, addContact, showToast, showConfirm, invoices } = useAppContext();
  const { penulis, naskah } = useDataMasterContext();

  // Cari data penulis terpilih (penulisId bisa negatif jika dari database pelanggan murni)
  const penulisData = useMemo(() => {
    if (!penulisId) return null;

    // Jika ID negatif, cari di database pelanggan
    if (penulisId < 0) {
      const contactId = -penulisId;
      const c = contacts.find(contact => contact.id === contactId);
      if (c) {
        return {
          id: penulisId,
          name: c.name,
          email: c.email || '',
          wa_number: c.wa_number || '',
          address: c.address || '',
          province: '',
          city: '',
          job: 'Pelanggan',
          institution: '',
          data_source: 'Database Pelanggan',
          email_valid: c.email ? 1 : 0,
          wa_valid: c.wa_number ? 1 : 0,
          followup_status: 'Pelanggan',
          notes: 'Ditampilkan dari data pelanggan',
          created_at: c.created_at,
          is_customer: true,
          is_customer_only: true,
          is_customer_check: true,
        };
      }
      return null;
    }

    // Cari dari penulis asli
    const p = penulis.find(item => item.id === penulisId);
    if (!p) return null;

    const isCustomer = contacts.some(
      (c) =>
        c.type === 'customer' &&
        (c.name.toLowerCase() === p.name.toLowerCase() ||
          (p.wa_number && c.wa_number === p.wa_number))
    );

    return {
      ...p,
      is_customer: isCustomer
    };
  }, [penulis, contacts, penulisId]);

  // Naskah milik penulis ini
  const relatedNaskah = useMemo(() => {
    if (!penulisId || penulisId < 0) return [];
    return naskah.filter((n) => n.penulis_id === penulisId);
  }, [naskah, penulisId]);

  // Hitung riwayat invoice dan total tagihan untuk penulis ini
  const { penulisInvoices, totalBilling } = useMemo(() => {
    if (!penulisData) return { penulisInvoices: [], totalBilling: 0 };

    const filtered = invoices.filter(inv => {
      // 1. Cari yang customer_id-nya sama dengan contact id penulis ini (jika ada contact yang sama namanya)
      const relatedContact = contacts.find(
        c => c.type === 'customer' && c.name.toLowerCase() === penulisData.name.toLowerCase()
      );
      if (relatedContact && inv.customer_id === relatedContact.id) {
        return true;
      }

      // 2. Fallback pencocokan nama
      try {
        const meta = inv.file_path ? JSON.parse(inv.file_path) : {};
        if (meta.customerName && penulisData.name && meta.customerName.trim().toLowerCase() === penulisData.name.trim().toLowerCase()) {
          return true;
        }
      } catch {}
      return false;
    });

    const total = filtered.reduce((acc, curr) => acc + curr.total, 0);
    return { penulisInvoices: filtered, totalBilling: total };
  }, [penulisData, invoices, contacts]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} berhasil disalin!`, 'success');
  };

  const handlePromote = () => {
    if (!penulisData) return;

    showConfirm({
      title: 'Ubah Data Jadi Pelanggan',
      message: `Apakah Anda yakin data "${penulisData.name}" akan diubah jadi pelanggan?`,
      confirmText: 'Ya, Promosikan',
      type: 'primary',
      onConfirm: async () => {
        try {
          const addressParts = [];
          if (penulisData.institution) addressParts.push(penulisData.institution);
          if (penulisData.address) {
            addressParts.push(penulisData.address);
          } else if (penulisData.city || penulisData.province) {
            addressParts.push(`${penulisData.city || ''}, ${penulisData.province || ''}`.trim().replace(/^,\s*|,\s*$/, ''));
          }
          const fullAddress = addressParts.join('\n');

          await addContact({
            name: penulisData.name,
            wa_number: penulisData.wa_number || undefined,
            email: penulisData.email || undefined,
            address: fullAddress || undefined,
            type: 'customer',
            created_at: new Date().toISOString()
          });
          showToast(`"${penulisData.name}" berhasil dipromosikan menjadi Pelanggan!`, 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal mempromosikan penulis menjadi pelanggan!', 'error');
        }
      }
    });
  };

  if (!penulisId || !penulisData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
          Pilih penulis untuk melihat rincian
        </p>
      </div>
    );
  }

  const nameInitial = penulisData.name ? penulisData.name.charAt(0).toUpperCase() : '?';

  const getStatusBadgeStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'LUNAS':
        return { background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' };
      case 'BELUM LUNAS':
        return { background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' };
      case 'DP':
        return { background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' };
      case 'BERMASALAH':
      default:
        return { background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' };
    }
  };

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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
              {penulisData.name}
            </h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', textTransform: 'uppercase' }}>
                Kontak
              </span>
              <Badge 
                label={penulisData.followup_status || 'New'}
                variant={getStatusVariant(penulisData.followup_status || 'New')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detail Informasi */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Detail Identitas */}
        <div>
          <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Pekerjaan & Afiliasi</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pekerjaan</span>
              <strong style={{ color: 'var(--text-primary)' }}>{penulisData.job || '-'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Institusi/Afiliasi</span>
              <strong style={{ color: 'var(--text-primary)' }}>{penulisData.institution || '-'}</strong>
            </div>
          </div>
        </div>

        {/* Rincian Kontak */}
        <div>
          <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Rincian Kontak</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
            
            {/* Email */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email</span>
              {penulisData.email ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a
                    href={`mailto:${penulisData.email}`}
                    title="Kirim Email"
                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    📧 {penulisData.email}
                  </a>
                  {penulisData.email_valid === 1 && (
                    <span title="Email Valid" style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                  )}
                  <button 
                    onClick={() => handleCopyText(penulisData.email!, 'Email')} 
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
              {penulisData.wa_number ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <a
                    href={getWhatsAppLink(penulisData.wa_number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat WhatsApp"
                    style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    💬 {penulisData.wa_number}
                  </a>
                  {penulisData.wa_valid === 1 && (
                    <span title="WhatsApp Valid" style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                  )}
                  <button 
                    onClick={() => handleCopyText(penulisData.wa_number!, 'WhatsApp')} 
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}
                    title="Salin Nomor"
                  >
                    📋
                  </button>
                </div>
              ) : (
                <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Tidak ada</span>
              )}
            </div>

            {/* Lokasi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Lokasi Wilayah</span>
              <strong 
                style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
                title={penulisData.address || (penulisData.city || penulisData.province ? `${penulisData.city || ''}, ${penulisData.province || ''}` : '')}
              >
                {penulisData.city || penulisData.province ? (
                  `${penulisData.city || ''}${penulisData.city && penulisData.province ? ', ' : ''}${penulisData.province || ''}`
                ) : (penulisData.address || '-')}
              </strong>
            </div>

          </div>
        </div>

        {/* Alamat Fisik / Instansi */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>Alamat Lengkap</h5>
            {penulisData.address && (
              <button 
                onClick={() => handleCopyText(penulisData.address!, 'Alamat')} 
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
            {penulisData.address || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Tidak ada alamat terdaftar</span>}
          </div>
        </div>

        {/* Catatan Lead */}
        <div>
          <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Catatan Khusus Lead</h5>
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--text-primary)', 
            whiteSpace: 'pre-line', 
            lineHeight: '1.4', 
            background: 'var(--bg-card)', 
            padding: '12px 14px', 
            borderRadius: '8px', 
            border: '1px solid var(--border)',
            fontStyle: penulisData.notes ? 'normal' : 'italic'
          }}>
            {penulisData.notes || 'Tidak ada catatan tambahan untuk lead penulis ini.'}
          </div>
        </div>

        {/* Ikhtisar Keuangan Penulis */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ikhtisar Keuangan Penulis
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Tagihan</div>
              <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '700' }}>
                {formatPrice(totalBilling)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Jumlah Invoice</div>
              <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '700' }}>
                {penulisInvoices.length} Lembar
              </div>
            </div>
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

        {/* Riwayat Transaksi */}
        {penulisInvoices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Riwayat Invoice ({penulisInvoices.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {penulisInvoices.map(inv => {
                let meta = { invoiceNo: 'DRAF', invoiceDate: '', paymentStatus: 'LUNAS' };
                try {
                  if (inv.file_path) meta = JSON.parse(inv.file_path);
                } catch {}

                const badge = getStatusBadgeStyles(meta.paymentStatus || 'LUNAS');

                return (
                  <div
                    key={inv.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {meta.invoiceNo || 'DRAF'}
                      </strong>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                        {formatPrice(inv.total)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {meta.invoiceDate || new Date(inv.created_at).toLocaleDateString('id-ID')}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: '700',
                        ...badge
                      }}>
                        {meta.paymentStatus || 'LUNAS'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Informasi Sistem & Aksi */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            <span>Sumber Data: <strong>{penulisData.data_source || 'Sistem'}</strong></span>
            <span>Dibuat: {penulisData.created_at ? new Date(penulisData.created_at).toLocaleDateString('id-ID') : '-'}</span>
          </div>

          {/* Tombol Promosi Pelanggan */}
          {!penulisData.is_customer && (
            <Button
              variant="primary"
              onClick={handlePromote}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              🤝 Promosikan Jadi Pelanggan
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PenulisPreviewPanel;

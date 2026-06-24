import React, { useMemo } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { Button } from '../../../ui/atoms/Button';
import { formatPrice } from '../../../utils/format';
import { TimelineTracker } from '@pubhub/shared-ui';

const PelangganPreviewPanel: React.FC = () => {
  const { contacts, selectedCustomerId, setRightPanelVisible, invoices } = useAppContext();

  const data = contacts.find(c => c.id === selectedCustomerId && c.type === 'customer');

  // Hitung riwayat invoice dan total tagihan untuk pelanggan ini
  const { customerInvoices, totalBilling } = useMemo(() => {
    if (!data) return { customerInvoices: [], totalBilling: 0 };

    const filtered = invoices.filter(inv => {
      if (inv.customer_id === selectedCustomerId) return true;
      try {
        const meta = inv.file_path ? JSON.parse(inv.file_path) : {};
        if (meta.customerName && data.name && meta.customerName.trim().toLowerCase() === data.name.trim().toLowerCase()) {
          return true;
        }
      } catch {}
      return false;
    });

    const total = filtered.reduce((acc, curr) => acc + curr.total, 0);
    return { customerInvoices: filtered, totalBilling: total };
  }, [data, selectedCustomerId, invoices]);

  if (!data) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.5 }}>👥</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: 'var(--text-primary)' }}>Pilih Pelanggan</h3>
        <p style={{ margin: 0, fontSize: '14px' }}>Pilih pelanggan dari tabel untuk melihat detail.</p>
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
              <span style={{ fontSize: '24px' }}>👤</span>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {data.name}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
              Ditambahkan: {formatTanggal(data.created_at || '')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setRightPanelVisible(false)}>
            ✕
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Info Utama */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Informasi Kontak
          </h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Email</div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                {data.email || '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>No. WhatsApp</div>
              <div style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: '500' }}>
                {data.wa_number || '-'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Alamat</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
                {data.address || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan Finansial Pelanggan */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ikhtisar Keuangan
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
                {customerInvoices.length} Lembar
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Transaksi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Riwayat Invoice ({customerInvoices.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {customerInvoices.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontStyle: 'italic' }}>
                Belum ada invoice yang terbit untuk pelanggan ini.
              </div>
            ) : (
              customerInvoices.map(inv => {
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
              })
            )}
          </div>
        </div>

        {/* Timeline Tracking */}
        <TimelineTracker 
          entityType="contact" 
          entityId={selectedCustomerId} 
          relatedIds={useMemo(() => {
            const invIds = customerInvoices.map(inv => inv.id).filter((id): id is number => id !== undefined);
            return {
              invoiceIds: invIds
            };
          }, [customerInvoices])}
        />
        
      </div>
    </div>
  );
};

export default PelangganPreviewPanel;

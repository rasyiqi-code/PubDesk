import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import InvoicePreview from '../invoice/InvoicePreview';

const PanelKanan: React.FC = () => {
  const { appState, files, invoices, selectedFileId, books, selectedBookId } = useAppContext();

  const renderPreview = () => {
    switch (appState.activeModule) {
      case 'invoice':
        return <InvoicePreview />;
      case 'extractor':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Preview Extractor akan segera tersedia</p>
          </div>
        );
      case 'files': {
        const file = files.find(f => f.id === selectedFileId);
        if (!file) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>Pilih berkas invoice untuk melihat pratinjau</p>
            </div>
          );
        }

        if (file.type === 'invoice') {
          const invoiceId = file.version_label ? parseInt(file.version_label) : null;
          const invoice = invoices.find(inv => inv.id === invoiceId);
          if (invoice) {
            let metadata = {
              invoiceNo: '',
              invoiceDate: '',
              invoiceHal: '',
              invoiceLampiran: '',
              paymentStatus: 'LUNAS',
              spesifikasiFasilitas: '',
              customerName: '',
              customerWa: '',
              customerAddress: ''
            };
            try {
              if (invoice.file_path) {
                metadata = JSON.parse(invoice.file_path);
              }
            } catch (e) {
              console.error("Failed to parse invoice metadata JSON:", e);
            }

            let items = [];
            try {
              items = JSON.parse(invoice.items_json);
            } catch (e) {
              console.error("Failed to parse invoice items JSON:", e);
            }

            const overrideInvoice = {
              customerName: metadata.customerName || '',
              waNumber: metadata.customerWa || '',
              address: metadata.customerAddress || '',
              items: items,
              shippingCost: invoice.shipping_cost,
              adminFee: invoice.admin_fee,
              invoiceType: (invoice.export_format as any) || 'kbm_cetak',
              invoiceNo: metadata.invoiceNo || '',
              invoiceHal: metadata.invoiceHal || '',
              invoiceLampiran: metadata.invoiceLampiran || '',
              invoiceDate: metadata.invoiceDate || '',
              paymentStatus: metadata.paymentStatus || 'LUNAS',
              spesifikasiFasilitas: metadata.spesifikasiFasilitas || ''
            };

            return <InvoicePreview overrideInvoice={overrideInvoice} />;
          }
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Pratinjau untuk berkas ini tidak tersedia</p>
          </div>
        );
      }
      case 'books': {
        const book = books.find(b => b.id === selectedBookId);
        if (!book) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>📚</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', marginBottom: '6px', textAlign: 'center' }}>Master Manajemen Buku</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>Pilih salah satu buku dari tabel master untuk melihat detail visual rincian dan cover buku.</p>
            </div>
          );
        }

        const formatPrice = (amount: number) => {
          return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '30px', overflow: 'auto', alignItems: 'center' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Detail Visual Buku</h3>
            
            {/* Visual Cover Buku */}
            <div style={{
              width: '180px',
              height: '240px',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              transform: 'perspective(600px) rotateY(-5deg)',
              transformOrigin: 'left center',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'perspective(600px) rotateY(0deg) scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'perspective(600px) rotateY(-5deg)'}
            >
              {book.cover_path ? (
                <img src={book.cover_path} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '64px', display: 'block', marginBottom: '8px' }}>📖</span>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>Tidak ada cover</span>
                </div>
              )}
            </div>

            {/* Rincian Teks */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', lineHeight: '1.3' }}>{book.title}</h4>
                {book.isbn && <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>ISBN: {book.isbn}</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Harga PO</span>
                  <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{formatPrice(book.po_price)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Harga Reguler</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatPrice(book.regular_price)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Berat Estimasi</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{book.weight_grams} gram</strong>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic', marginTop: '12px' }}>
                Data master ini siap digunakan secara otomatis dalam pembuatan invoice cetak.
              </div>
            </div>
          </div>
        );
      }
      case 'ledger':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Preview Ledger akan segera tersedia</p>
          </div>
        );
      case 'settings':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Preview Settings akan segera tersedia</p>
          </div>
        );
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Pilih menu untuk melihat preview yang relevan</p>
          </div>
        );
    }
  };

  return renderPreview();
};

export default PanelKanan;

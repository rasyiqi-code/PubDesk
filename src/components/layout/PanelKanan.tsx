import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import InvoicePreview from '../invoice/InvoicePreview';

const PanelKanan: React.FC = () => {
  const { appState, files, invoices, selectedFileId } = useAppContext();

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

import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import InvoicePreview from '../invoice/InvoicePreview';
import FilePreviewPanel from './PanelKanan/FilePreviewPanel';
import ServicePreviewPanel from './PanelKanan/ServicePreviewPanel';
import InsightPanel from './PanelKanan/InsightPanel';
import PelangganPreviewPanel from './PanelKanan/PelangganPreviewPanel';

const PanelKanan: React.FC = () => {
  const {
    appState,
    services,
    selectedServiceId,
    selectedInsightMetric,
    invoices,
    setActiveModule,
  } = useAppContext();

  const { files, selectedFileId, setSelectedFileId, setRightPanelVisible } = useFileState();
  const { tempPreviewProfile, activeProfile } = useInvoiceContext();

  const { activeModule } = appState;

  switch (activeModule) {
    case 'settings-invoice':
      return <InvoicePreview previewProfile={tempPreviewProfile || activeProfile} />;

    case 'invoice':
      return <InvoicePreview />;

    case 'invoice-manager':
      return <FilePreviewPanel selectedFileId={selectedFileId} />;

    case 'invoice-parent':
    case 'invoice-insight':
      return (
        <InsightPanel
          selectedMetric={selectedInsightMetric}
          invoices={invoices}
          onNavigateToManager={(invoiceId) => {
            const fileEntry = files.find(f => f.type === 'invoice' && f.version_label === String(invoiceId));
            if (fileEntry) {
              setSelectedFileId(fileEntry.id || null);
              setRightPanelVisible(true);
            }
            setActiveModule('invoice-manager');
          }}
        />
      );

    case 'services':
      return <ServicePreviewPanel serviceId={selectedServiceId} services={services} />;

    case 'pelanggan':
      return <PelangganPreviewPanel />;

    default:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
            Pilih menu untuk melihat preview yang relevan
          </p>
        </div>
      );
  }
};

export { PanelKanan };
export default PanelKanan;


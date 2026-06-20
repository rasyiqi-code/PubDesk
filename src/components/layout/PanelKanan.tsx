import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import InvoicePreview from '../invoice/InvoicePreview';
import FilePreviewPanel from './PanelKanan/FilePreviewPanel';
import ServicePreviewPanel from './PanelKanan/ServicePreviewPanel';
import InsightPanel from './PanelKanan/InsightPanel';

/**
 * PanelKanan — orchestrator panel pratinjau di sisi kanan layar.
 * Mendelegasikan rendering ke sub-panel berdasarkan modul aktif.
 * Sub-panel ada di folder PanelKanan/:
 *   - FilePreviewPanel   → Smart Folders & Manajemen Invoice
 *   - ServicePreviewPanel → Layanan / Settings > Services
 *   - InsightPanel        → Invoice Insight
 */
const PanelKanan: React.FC = () => {
  const {
    appState,
    services,
    selectedServiceId,
    activeSettingsTab,
    selectedInsightMetric,
    invoices,
    selectedFileId,
    setActiveModule,
  } = useAppContext();

  const { activeModule } = appState;

  switch (activeModule) {
    // Generator invoice — preview langsung dari context form
    case 'invoice':
      return <InvoicePreview />;

    // Manajemen berkas dan manajemen invoice — panel preview berkas
    case 'files':
    case 'invoice-manager':
      return <FilePreviewPanel selectedFileId={selectedFileId} />;

    // Invoice insight — panel ringkasan metrik
    case 'invoice-insight':
      return (
        <InsightPanel
          selectedMetric={selectedInsightMetric}
          invoices={invoices}
          onNavigateToManager={() => setActiveModule('invoice-manager')}
        />
      );

    // Modul layanan — preview layanan terpilih
    case 'services':
      return <ServicePreviewPanel serviceId={selectedServiceId} services={services} />;

    // Settings — tampilkan preview layanan jika tab services aktif
    case 'settings':
      if (activeSettingsTab === 'services') {
        return <ServicePreviewPanel serviceId={selectedServiceId} services={services} />;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
            Preview Settings akan segera tersedia
          </p>
        </div>
      );

    // Modul lain (extractor, ledger, books)
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

export default PanelKanan;

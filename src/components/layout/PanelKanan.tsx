import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';
import InvoicePreview from '../invoice/InvoicePreview';
import FilePreviewPanel from './PanelKanan/FilePreviewPanel';
import ServicePreviewPanel from './PanelKanan/ServicePreviewPanel';
import InsightPanel from './PanelKanan/InsightPanel';
import PenulisPreviewPanel from './PanelKanan/PenulisPreviewPanel';
import PenerbitPreviewPanel from './PanelKanan/PenerbitPreviewPanel';
import NaskahPreviewPanel from './PanelKanan/NaskahPreviewPanel';
import TimPreviewPanel from './PanelKanan/TimPreviewPanel';
import LegalitasPreviewPanel from './PanelKanan/LegalitasPreviewPanel';
import PelangganPreviewPanel from './PanelKanan/PelangganPreviewPanel';

/**
 * PanelKanan — orchestrator panel pratinjau di sisi kanan layar.
 * Mendelegasikan rendering ke sub-panel berdasarkan modul aktif.
 * Sub-panel ada di folder PanelKanan/:
 *   - FilePreviewPanel   → Smart Folders & Manajemen Invoice
 *   - ServicePreviewPanel → Layanan / Settings > Services
 *   - InsightPanel        → Invoice Insight
 *   - PenulisPreviewPanel  → Lead Penulis (CRM)
 */
const PanelKanan: React.FC = () => {
  const {
    appState,
    services,
    selectedServiceId,
    selectedInsightMetric,
    invoices,
    setActiveModule,
    selectedPenulisId,
    selectedPenerbitId,
    selectedNaskahId,
    selectedTimId,
  } = useAppContext();

  const { files, selectedFileId, setSelectedFileId, setRightPanelVisible } = useFileState();

  const { activeModule } = appState;

  switch (activeModule) {
    // Generator invoice — preview langsung dari context form
    case 'invoice':
      return <InvoicePreview />;

    // Manajemen berkas dan manajemen invoice — panel preview berkas
    case 'files':
    case 'invoice-manager':
      return <FilePreviewPanel selectedFileId={selectedFileId} />;

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

    // Modul layanan — preview layanan terpilih
    case 'services':
      return <ServicePreviewPanel serviceId={selectedServiceId} services={services} />;



    // Modul Kontak terpadu (Penulis + Pelanggan)
    case 'kontak':
    case 'penulis':
      return <PenulisPreviewPanel penulisId={selectedPenulisId} />;

    case 'penerbit':
      return <PenerbitPreviewPanel penerbitId={selectedPenerbitId} />;

    case 'naskah':
      return <NaskahPreviewPanel naskahId={selectedNaskahId} />;

    case 'tim':
      return <TimPreviewPanel timId={selectedTimId} />;

    case 'legalitas':
      return <LegalitasPreviewPanel />;

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


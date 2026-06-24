import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import PenulisPreviewPanel from './PanelKanan/PenulisPreviewPanel';
import PenerbitPreviewPanel from './PanelKanan/PenerbitPreviewPanel';
import NaskahPreviewPanel from './PanelKanan/NaskahPreviewPanel';
import LegalitasPreviewPanel from './PanelKanan/LegalitasPreviewPanel';
import TaskPreviewPanel from './PanelKanan/TaskPreviewPanel';
import ServicePreviewPanel from './PanelKanan/ServicePreviewPanel';

/**
 * PanelKanan — orchestrator panel pratinjau di sisi kanan layar.
 * Mendelegasikan rendering ke sub-panel berdasarkan modul aktif.
 * Sub-panel ada di folder PanelKanan/:
 *   - ServicePreviewPanel   → Layanan / Jasa
 *   - PenulisPreviewPanel   → Lead Penulis (CRM)
 *   - PenerbitPreviewPanel  → Penerbit (CRM)
 *   - NaskahPreviewPanel    → Order Naskah (CRM)
 *   - LegalitasPreviewPanel → Dokumen Legalitas
 *   - TaskPreviewPanel      → Detail Pekerjaan/Tugas
 */

const PanelKanan: React.FC = () => {
  const {
    appState,
    selectedPenulisId,
    selectedPenerbitId,
    selectedNaskahId,
    selectedServiceId,
    services,
  } = useAppContext();

  const { activeModule } = appState;

  switch (activeModule) {
    // Modul Kontak terpadu (Penulis + Pelanggan)
    case 'kontak':
    case 'penulis':
      return <PenulisPreviewPanel penulisId={selectedPenulisId} />;

    case 'penerbit':
      return <PenerbitPreviewPanel penerbitId={selectedPenerbitId} />;

    case 'naskah':
      return <NaskahPreviewPanel naskahId={selectedNaskahId} />;

    case 'legalitas':
      return <LegalitasPreviewPanel />;

    case 'services':
      return <ServicePreviewPanel serviceId={selectedServiceId} services={services} />;

    case 'pekerjaan-saya':
    case 'produksi-board':
    case 'produksi-list':
    case 'produksi-kendala':
    case 'produksi-approval':
    case 'produksi-timeline':
      return <TaskPreviewPanel />;

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


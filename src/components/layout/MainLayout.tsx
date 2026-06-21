import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { PanelKanan } from './PanelKanan';
import { Toast } from '../../components/shared/Toast';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import InvoiceGenerator from '../invoice/InvoiceGenerator';
import InvoiceManager from '../invoice/InvoiceManager';
import InvoiceInsight from '../invoice/InvoiceInsight';
import { useAppContext } from '../../contexts/AppContext';
import Settings from '../settings/Settings';
import { FileManager } from '../files/FileManager';
import BookManager from '../books/BookManager';
import ServiceManager from '../data-master/ServiceManager';
// Modul CRM & Manajemen Kontak Pelanggan
import PenulisManager from '../data-master/PenulisManager';
import PenerbitManager from '../data-master/PenerbitManager';
import NaskahOrdersManager from '../data-master/NaskahOrdersManager';
import TimManager from '../data-master/TimManager';
import LegalitasManager from '../data-master/LegalitasManager';
import PelangganManager from '../data-master/PelangganManager';
import ActivityLog from '../data-master/ActivityLog';

// Modul Produksi (Workflow)
import PekerjaanSaya from '../produksi/PekerjaanSaya';
import ProduksiBoard from '../produksi/ProduksiBoard';
import ProduksiList from '../produksi/ProduksiList';
import ProduksiKendala from '../produksi/ProduksiKendala';
import ProduksiApproval from '../produksi/ProduksiApproval';
import ProduksiTimeline from '../produksi/ProduksiTimeline';
import TaskFormPage from '../produksi/TaskFormPage';
import LaporanOperasional from '../laporan/LaporanOperasional';
import DashboardProduksi from '../produksi/DashboardProduksi';
import DashboardMasterData from '../data-master/DashboardMasterData';
import DashboardInvoice from '../invoice/DashboardInvoice';
import DashboardFiles from '../files/DashboardFiles';

// Modul Auth Lokal
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../auth/LoginPage';


// Modul Pengaturan Tambahan
import ImportExcel from '../import/ImportExcel';


const MainLayout = () => {
  const { appState, rightPanelVisible } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [isSessionRunning, setIsSessionRunning] = useState<boolean | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = rightPanelWidth;
  };

  // Mouse move - only when dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = startXRef.current - e.clientX;
      const newWidth = startWidthRef.current + deltaX;
      setRightPanelWidth(Math.max(300, Math.min(600, newWidth)));
    }
  };

  // Mouse up - stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging]);

  // Reset pencarian saat berpindah modul aktif
  useEffect(() => {
    setFileSearchQuery('');
  }, [appState.activeModule]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderModule = () => {
    switch (appState.activeModule) {
      case 'invoice':
        return <InvoiceGenerator />;
      case 'invoice-manager':
        return <InvoiceManager searchQuery={fileSearchQuery} />;
      case 'invoice-insight':
        return <InvoiceInsight />;
      case 'extractor':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Pre-Order Extractor</h2><p>Fitur akan segera tersedia</p></div>;
      case 'files':
        return <FileManager searchQuery={fileSearchQuery} />;
      case 'books':
        return <BookManager />;
      case 'services':
        return <ServiceManager searchQuery={fileSearchQuery} />;
      case 'kontak':
      case 'penulis':
        return <PenulisManager searchQuery={fileSearchQuery} />;
      case 'penerbit':
        return <PenerbitManager searchQuery={fileSearchQuery} />;
      case 'naskah':
        return <NaskahOrdersManager searchQuery={fileSearchQuery} />;
      case 'tim':
        return <TimManager searchQuery={fileSearchQuery} />;
      case 'legalitas':
        return <LegalitasManager searchQuery={fileSearchQuery} />;
      case 'pelanggan':
        return <PelangganManager searchQuery={fileSearchQuery} />;
      case 'activity-log':
        return <ActivityLog />;
      case 'pekerjaan-saya':
        return <PekerjaanSaya searchQuery={fileSearchQuery} />;
      case 'produksi-parent':
        return <DashboardProduksi />;
      case 'master-data-parent':
        return <DashboardMasterData />;
      case 'invoice-parent':
        return <DashboardInvoice />;
      case 'files-parent':
        return <DashboardFiles />;
      case 'produksi-board':
        return <ProduksiBoard searchQuery={fileSearchQuery} />;
      case 'produksi-list':
        return <ProduksiList searchQuery={fileSearchQuery} />;
      case 'produksi-kendala':
        return <ProduksiKendala searchQuery={fileSearchQuery} />;
      case 'produksi-approval':
        return <ProduksiApproval searchQuery={fileSearchQuery} />;
      case 'produksi-timeline':
        return <ProduksiTimeline searchQuery={fileSearchQuery} />;
      case 'laporan-operasional':
        return <LaporanOperasional />;
      case 'import-data':
        return <ImportExcel />;
      case 'ledger':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Buku Besar Virtual</h2><p>Fitur akan segera tersedia</p></div>;
      case 'settings':
        return <Settings />;
      case 'tambah-tugas':
      case 'edit-tugas':
        return <TaskFormPage />;
      default:
        return <InvoiceGenerator />;
    }
  };

  return (
    <div className="main-layout" style={{ flexDirection: 'column' }}>
      <TopBar 
        onToggleSidebar={toggleSidebar} 
        sidebarCollapsed={sidebarCollapsed} 
        activeModule={appState.activeModule}
        searchQuery={fileSearchQuery}
        onSearchChange={setFileSearchQuery}
        onSessionChange={setIsSessionRunning}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 48px)', position: 'relative' }}>
        {/* Sidebar with collapse */}
        <div style={{ width: sidebarCollapsed ? '60px' : '260px', flexShrink: 0, position: 'relative', height: '100%', transition: 'width 0.3s ease' }}>
          <Sidebar collapsed={sidebarCollapsed} />
        </div>

        {/* Blocker Overlay */}
        {isSessionRunning === false && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: '#fff',
            padding: '24px',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'var(--bg-panel, #1e293b)',
              border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{ fontSize: '48px' }}>🔒</span>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
                Sesi Kerja Belum Dimulai
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: '1.6' }}>
                Silakan klik tombol <strong style={{ color: 'var(--accent, #3b82f6)' }}>"Mulai Kerja"</strong> di bagian kanan atas layar terlebih dahulu untuk menggunakan fitur aplikasi.
              </p>
            </div>
          </div>
        )}

        <div className="main-content">
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
            <div className="module-area">
              {renderModule()}
            </div>

            {/* Right panel with resizable width */}
            {rightPanelVisible && (
              <div style={{ 
                width: `${rightPanelWidth}px`, 
                display: 'flex', 
                flexDirection: 'column', 
                background: 'var(--bg-panel)', 
                position: 'relative',
                height: '100%'
              }}>
                <div 
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '6px',
                    cursor: 'col-resize',
                    background: isDragging ? 'var(--accent)' : 'transparent',
                    zIndex: 10,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseOver={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.background = 'var(--border)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isDragging) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                />
                <PanelKanan />
              </div>
            )}
          </div>
        </div>
      </div>
      <Toast />
      <ConfirmDialog />
    </div>
  );
};

const MainLayoutInner = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-secondary)', fontSize: '14px' }}>
        Memuat aplikasi...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

export { MainLayout, MainLayoutInner };
export default MainLayoutInner;


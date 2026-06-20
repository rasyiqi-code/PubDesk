import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import PanelKanan from './PanelKanan';
import InvoiceGenerator from '../invoice/InvoiceGenerator';
import InvoiceManager from '../invoice/InvoiceManager';
import InvoiceInsight from '../invoice/InvoiceInsight';
import { useAppContext } from '../../contexts/AppContext';
import TopBar from './TopBar';
import Settings from '../settings/Settings';
import Toast from '../shared/Toast';
import ConfirmDialog from '../shared/ConfirmDialog';
import FileManager from '../files/FileManager';
import BookManager from '../books/BookManager';
import ServiceManager from '../services/ServiceManager';


const MainLayout = () => {
  const { appState, rightPanelVisible, activeSettingsTab } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const [isDragging, setIsDragging] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState('');
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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderModule = () => {
    switch (appState.activeModule) {
      case 'invoice':
        return <InvoiceGenerator />;
      case 'invoice-manager':
        return <InvoiceManager />;
      case 'invoice-insight':
        return <InvoiceInsight />;
      case 'extractor':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Pre-Order Extractor</h2><p>Fitur akan segera tersedia</p></div>;
      case 'files':
        return <FileManager searchQuery={fileSearchQuery} />;
      case 'books':
        return <BookManager />;
      case 'services':
        return <ServiceManager />;
      case 'ledger':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Buku Besar Virtual</h2><p>Fitur akan segera tersedia</p></div>;
      case 'settings':
        return <Settings />;
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
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 48px)' }}>
        {/* Sidebar with collapse */}
        <div style={{ width: sidebarCollapsed ? '60px' : '260px', flexShrink: 0, position: 'relative', height: '100%', transition: 'width 0.3s ease' }}>
          <Sidebar collapsed={sidebarCollapsed} />
        </div>

        <div className="main-content">
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', height: '100%' }}>
            <div className="module-area">
              {renderModule()}
            </div>

            {/* Right panel with resizable width */}
            {(appState.activeModule !== 'settings' || activeSettingsTab === 'services') && rightPanelVisible && (
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

export default MainLayout;

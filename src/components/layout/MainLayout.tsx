import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import PanelKanan from './PanelKanan';
import InvoiceGenerator from '../invoice/InvoiceGenerator';
import { useAppContext } from '../../contexts/AppContext';
import TopBar from './TopBar';

const MainLayout = () => {
  const { appState } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(450);
  const [isDragging, setIsDragging] = useState(false);
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
      case 'extractor':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Pre-Order Extractor</h2><p>Fitur akan segera tersedia</p></div>;
      case 'files':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Smart Folders</h2><p>Fitur akan segera tersedia</p></div>;
      case 'ledger':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Buku Besar Virtual</h2><p>Fitur akan segera tersedia</p></div>;
      case 'settings':
        return <div className="module-content" style={{ padding: '24px', color: '#a89880' }}><h2>Pengaturan</h2><p>Fitur akan segera tersedia</p></div>;
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
            <div style={{ 
              width: `${rightPanelWidth}px`, 
              display: 'flex', 
              flexDirection: 'column', 
              background: '#2d2720', 
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
                  background: isDragging ? '#f0e0b5' : 'transparent',
                  zIndex: 10,
                  transition: 'background 0.15s ease'
                }}
                onMouseDown={handleMouseDown}
                onMouseOver={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.background = '#42382d';
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

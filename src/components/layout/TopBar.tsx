import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface TopBarProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  activeModule?: string;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, sidebarCollapsed, activeModule }) => {
  const { rightPanelVisible, setRightPanelVisible } = useAppContext();
  const [appWindow, setAppWindow] = useState<any>(null);

  useEffect(() => {
    // Cek apakah berjalan di lingkungan Tauri
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      import('@tauri-apps/api/window')
        .then((m) => {
          setAppWindow(m.getCurrentWindow());
        })
        .catch((err) => {
          console.error('Gagal memuat Tauri Window API:', err);
        });
    }
  }, []);

  const handleMinimize = () => {
    if (appWindow) {
      appWindow.minimize().catch(console.error);
    } else {
      console.log('Minimize window (browser mock)');
    }
  };

  const handleMaximize = () => {
    if (appWindow) {
      appWindow.toggleMaximize().catch(console.error);
    } else {
      console.log('Maximize window (browser mock)');
    }
  };

  const handleClose = () => {
    if (appWindow) {
      appWindow.close().catch(console.error);
    } else {
      console.log('Close window (browser mock)');
    }
  };

  const getModuleLabel = () => {
    switch (activeModule) {
      case 'invoice': return 'Invoice';
      case 'extractor': return 'Extractor';
      case 'files': return 'Files';
      case 'ledger': return 'Buku Besar';
      case 'settings': return 'Pengaturan';
      default: return 'Files';
    }
  };

  return (
    <div className="top-bar-container" data-tauri-drag-region>
      {/* Bagian Kiri: Di atas Sidebar */}
      <div 
        className="top-bar-sidebar-area" 
        style={{ width: sidebarCollapsed ? '60px' : '260px' }}
        data-tauri-drag-region
      >
        {!sidebarCollapsed && (
          <button className="top-bar-btn" aria-label="Search sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        )}
        
        {!sidebarCollapsed && (
          <span className="top-bar-sidebar-title">{getModuleLabel()}</span>
        )}

        <button className="top-bar-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>

      {/* Bagian Kanan: Di atas Main Content */}
      <div className="top-bar-main-area" data-tauri-drag-region>
        {/* Navigasi kiri */}
        <div className="top-bar-nav-arrows">
          <button className="top-bar-btn" aria-label="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <button className="top-bar-btn" aria-label="Forward">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* Path bar */}
        <div className="top-bar-gnome-pathbar">
          <span className="top-bar-path-text">/home/rasyiqi</span>
          <button className="top-bar-path-clear" aria-label="Clear path">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Tombol silang kecil di luar pathbar */}
        <button className="top-bar-btn-close-path" aria-label="Close path editing">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Aksi tambahan */}
        <div className="top-bar-gnome-actions">
          <button 
            className={`top-bar-btn ${rightPanelVisible ? 'active' : ''}`}
            onClick={() => setRightPanelVisible(!rightPanelVisible)}
            style={{
              color: rightPanelVisible ? 'var(--accent)' : 'var(--text-secondary)',
              background: rightPanelVisible ? 'var(--bg-card)' : 'transparent',
            }}
            aria-label="Toggle right panel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="3"></circle>
              <line x1="16" y1="17" x2="14.5" y2="15.5"></line>
            </svg>
          </button>
          
          <button className="top-bar-btn" aria-label="Grid view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </button>

          <button className="top-bar-btn top-bar-dropdown-btn" aria-label="Menu dropdown">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        {/* Separator vertikal */}
        <div className="top-bar-gnome-separator" />

        {/* Window controls */}
        <div className="top-bar-gnome-windowcontrols">
          <button className="top-bar-window-btn" onClick={handleMinimize} aria-label="Minimize">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button className="top-bar-window-btn" onClick={handleMaximize} aria-label="Maximize">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
          <button className="top-bar-window-btn top-bar-window-close-btn" onClick={handleClose} aria-label="Close">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;

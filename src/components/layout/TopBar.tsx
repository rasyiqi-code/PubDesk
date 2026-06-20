import React, { useEffect, useState } from 'react';
import { useFileState } from '../../contexts/FileContext';

interface TopBarProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  activeModule?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, sidebarCollapsed, activeModule, searchQuery = '', onSearchChange }) => {
  const { 
    rightPanelVisible, 
    setRightPanelVisible,
    canNavigateBack,
    canNavigateForward,
    navigateBack,
    navigateForward,
    fileLayoutMode,
    setFileLayoutMode,
    fileCategory,
    currentFolderId,
    files
  } = useFileState();
  const [appWindow, setAppWindow] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      case 'invoice': return 'Invoice Generator';
      case 'invoice-manager': return 'Manajemen Invoice';
      case 'invoice-insight': return 'Invoice Insight';
      case 'extractor': return 'Extractor';
      case 'files': return 'Files';
      case 'books': return 'Master Buku';
      case 'services': return 'Master Layanan';
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
          <button 
            className="top-bar-btn" 
            onClick={navigateBack} 
            disabled={!canNavigateBack} 
            style={{ opacity: canNavigateBack ? 1 : 0.4, cursor: canNavigateBack ? 'pointer' : 'not-allowed' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <button 
            className="top-bar-btn" 
            onClick={navigateForward} 
            disabled={!canNavigateForward} 
            style={{ opacity: canNavigateForward ? 1 : 0.4, cursor: canNavigateForward ? 'pointer' : 'not-allowed' }}
            aria-label="Forward"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* Path bar atau field cari berkas */}
        {(activeModule === 'files' || activeModule === 'invoice-manager') ? (
          (!isSearchFocused && !searchQuery) ? (
            <div 
              className="top-bar-gnome-pathbar" 
              onClick={() => setIsSearchFocused(true)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'text',
                userSelect: 'none',
                height: '100%',
                width: '100%',
                padding: '0 8px'
              }}
            >
              {activeModule === 'files' ? (
                fileCategory === 'gdrive' ? (
                  (() => {
                    const serverIcon = (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#855800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                      </svg>
                    );

                    const parseModifiedBy = (modifiedBy?: string) => {
                      if (!modifiedBy) return { size: '0', parentId: 'root', shared: '0', accountEmail: '' };
                      const parts = modifiedBy.split('|');
                      return {
                        size: parts[0] || '0',
                        parentId: parts[1] || 'root',
                        shared: parts[2] || '0',
                        accountEmail: parts[3] || ''
                      };
                    };

                    const rootFolderId = localStorage.getItem('gdrive_parent_folder_id') || 'root';

                    if (currentFolderId === 'root' || currentFolderId === rootFolderId) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {serverIcon}
                          <span className="top-bar-path-text" style={{ fontWeight: '600', color: '#556B2F' }}>Google Drive</span>
                        </div>
                      );
                    }

                    const breadcrumbs = [];
                    breadcrumbs.push({ id: 'root', name: 'Google Drive', icon: serverIcon });

                    if (currentFolderId.startsWith('ac_')) {
                      const email = currentFolderId.replace('ac_', '');
                      breadcrumbs.push({ id: currentFolderId, name: email });
                    } else if (currentFolderId.startsWith('md_')) {
                      const email = currentFolderId.replace('md_', '');
                      breadcrumbs.push({ id: `ac_${email}`, name: email });
                      breadcrumbs.push({ id: currentFolderId, name: 'Drive Saya' });
                    } else if (currentFolderId.startsWith('swm_')) {
                      const email = currentFolderId.replace('swm_', '');
                      breadcrumbs.push({ id: `ac_${email}`, name: email });
                      breadcrumbs.push({ id: currentFolderId, name: 'Shared with me' });
                    } else {
                      const pathList = [];
                      let tempId = currentFolderId;
                      let limit = 10;
                      let accountEmail = '';
                      let isShared = false;

                      while (tempId && tempId !== 'root' && !tempId.startsWith('ac_') && !tempId.startsWith('md_') && !tempId.startsWith('swm_') && limit > 0) {
                        const folder = files.find(f => f.path === `gdrive://${tempId}`);
                        if (folder) {
                          pathList.unshift({ id: tempId, name: folder.filename });
                          const meta = parseModifiedBy(folder.modified_by);
                          tempId = meta.parentId || 'root';
                          accountEmail = meta.accountEmail;
                          isShared = meta.shared === '1';
                        } else {
                          break;
                        }
                        limit--;
                      }

                      if (accountEmail) {
                        breadcrumbs.push({ id: `ac_${accountEmail}`, name: accountEmail });
                        breadcrumbs.push({ id: isShared ? `swm_${accountEmail}` : `md_${accountEmail}`, name: isShared ? 'Shared with me' : 'Drive Saya' });
                      }
                      breadcrumbs.push(...pathList);
                    }

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {breadcrumbs.map((bc, idx) => (
                          <React.Fragment key={bc.id}>
                            {idx > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 2px' }}>&gt;</span>}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {bc.icon}
                              <span className="top-bar-path-text" style={{ 
                                fontWeight: idx === breadcrumbs.length - 1 ? '600' : '400',
                                color: idx === 0 ? '#556B2F' : 'var(--text-primary)'
                              }}>{bc.name}</span>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <span className="top-bar-path-text">/home/rasyiqi</span>
                )
              ) : (
                <span className="top-bar-path-text" style={{ color: 'var(--text-secondary)' }}>🔍 Cari nomor invoice atau pelanggan...</span>
              )}
            </div>
          ) : (
            <div className="top-bar-gnome-pathbar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder={activeModule === 'files' ? "Cari berkas..." : "Cari nomor invoice atau pelanggan..."}
                value={searchQuery}
                autoFocus
                onBlur={() => {
                  if (!searchQuery) {
                    setIsSearchFocused(false);
                  }
                }}
                onChange={(e) => onSearchChange?.(e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  paddingLeft: '30px',
                  paddingRight: '8px'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchChange?.('');
                    setIsSearchFocused(false);
                  }}
                  className="top-bar-path-clear"
                  aria-label="Hapus pencarian"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          )
        ) : (
          <div className="top-bar-gnome-pathbar">
            <span className="top-bar-path-text">/home/rasyiqi</span>
            <button className="top-bar-path-clear" aria-label="Clear path">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}

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
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          
          {activeModule === 'files' && (
            <button 
              className={`top-bar-btn ${fileLayoutMode === 'grid' ? 'active' : ''}`} 
              onClick={() => setFileLayoutMode(fileLayoutMode === 'list' ? 'grid' : 'list')}
              title={fileLayoutMode === 'grid' ? 'Tampilan List' : 'Tampilan Grid'}
              style={{
                color: fileLayoutMode === 'grid' ? 'var(--accent)' : 'var(--text-secondary)',
                background: fileLayoutMode === 'grid' ? 'var(--bg-card)' : 'transparent',
              }}
              aria-label="Toggle grid/list view"
            >
              {fileLayoutMode === 'grid' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              )}
            </button>
          )}

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

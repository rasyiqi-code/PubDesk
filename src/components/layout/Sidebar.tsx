import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { appState, setActiveModule, connectedUser } = useAppContext();
  const { fileCategory, setFileCategory } = useFileState();

  const menuItems = [
    { id: 'invoice' as const, label: 'Invoice', icon: '🧾' },
    { id: 'extractor' as const, label: 'Pre-order Extractor', icon: '📥' },
    { id: 'files' as const, label: 'Smart Folders', icon: '📁' },
    { id: 'ledger' as const, label: 'Buku Besar', icon: '📊' },
  ];

  const bottomItems = [
    { id: 'settings' as const, label: 'Pengaturan', icon: '⚙️' },
  ];

  return (
    <div style={{ height: '100%', background: 'var(--bg-panel)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Menu */}
      <nav style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {menuItems.map((item) => {
          const isActive = item.id === 'invoice'
            ? (appState.activeModule === 'invoice' || appState.activeModule === 'invoice-manager' || appState.activeModule === 'invoice-insight')
            : appState.activeModule === item.id;
          const showSubmenu = item.id === 'files' && !collapsed;
          const showInvoiceSubmenu = item.id === 'invoice' && !collapsed;
          return (
            <div key={item.id}>
              <button
                style={{ 
                  width: '100%', 
                  padding: collapsed ? '12px' : '10px 12px', 
                  border: 'none', 
                  borderRadius: '8px',
                  background: isActive ? 'var(--accent)' : 'transparent', 
                  color: isActive ? '#ffffff' : 'var(--text-secondary)', 
                  textAlign: 'left', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? '0' : '12px',
                  marginBottom: '4px',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  if (item.id === 'invoice') {
                    if (appState.activeModule !== 'invoice' && appState.activeModule !== 'invoice-manager' && appState.activeModule !== 'invoice-insight') {
                      setActiveModule('invoice');
                    }
                  } else {
                    setActiveModule(item.id);
                    if (item.id === 'files') {
                      setFileCategory('all');
                    }
                  }
                }}
                onMouseOver={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>

              {showInvoiceSubmenu && (
                <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px', marginTop: '2px' }}>
                  {[
                    { module: 'invoice' as const, label: 'Invoice Generator', icon: '✍️' },
                    { module: 'invoice-manager' as const, label: 'Managemen Invoice', icon: '🗃️' },
                    { module: 'invoice-insight' as const, label: 'Invoice Insight', icon: '📊' },
                  ].map((sub) => {
                    const isSubActive = appState.activeModule === sub.module;
                    return (
                      <button
                        key={sub.module}
                        onClick={() => {
                          setActiveModule(sub.module);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '6px',
                          background: isSubActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                          color: isSubActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: isSubActive ? '600' : '400',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {showSubmenu && (
                <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px', marginTop: '2px' }}>
                  {[
                    { cat: 'all' as const, label: 'Semua Berkas', icon: '📂' },
                    { cat: 'invoice' as const, label: 'Dokumen Invoice', icon: '🧾' },
                    { cat: 'service' as const, label: 'Katalog Layanan', icon: '🛠️' },
                    { cat: 'pdf' as const, label: 'Dokumen PDF', icon: '📕' },
                    { cat: 'spreadsheet' as const, label: 'Spreadsheet', icon: '📊' },
                    { cat: 'text' as const, label: 'Dokumen Teks & Word', icon: '📝' },
                    { cat: 'image' as const, label: 'Gambar', icon: '🖼️' },
                    { cat: 'presentation' as const, label: 'Presentasi', icon: '📉' },
                    { cat: 'gdrive' as const, label: 'Google Drive', icon: '☁️' },
                    { cat: 'other' as const, label: 'Berkas Lainnya', icon: '📁' },
                  ].map((sub) => {
                    const isSubActive = isActive && fileCategory === sub.cat;
                    return (
                      <button
                        key={sub.cat}
                        onClick={() => {
                          setActiveModule('files');
                          setFileCategory(sub.cat);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          border: 'none',
                          borderRadius: '6px',
                          background: isSubActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                          color: isSubActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: isSubActive ? '600' : '400',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>{sub.icon}</span>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left' }}>
                          <span>{sub.label}</span>
                          {sub.cat === 'gdrive' && connectedUser && (
                            <span style={{ fontSize: '9px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={connectedUser.email}>
                              {connectedUser.email}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      
      {/* Bottom Section */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        {bottomItems.map((item) => (
          <button
            key={item.id}
            style={{ 
              width: '100%', 
              padding: collapsed ? '12px' : '10px 12px', 
              border: 'none', 
              borderRadius: '8px',
              background: 'transparent', 
              color: 'var(--text-secondary)', 
              textAlign: 'left', 
              cursor: 'pointer', 
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0' : '12px',
              marginBottom: '4px',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setActiveModule(item.id)}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

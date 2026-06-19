import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { appState, setActiveModule, fileCategory, setFileCategory } = useAppContext();

  const menuItems = [
    { id: 'invoice' as const, label: 'Invoice Generator', icon: '🧾' },
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
          const isActive = appState.activeModule === item.id;
          const showSubmenu = item.id === 'files' && !collapsed;
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
                  setActiveModule(item.id);
                  if (item.id === 'files') {
                    setFileCategory('all');
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

              {showSubmenu && (
                <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px', marginTop: '2px' }}>
                  {[
                    { cat: 'all' as const, label: 'Semua Berkas', icon: '📂' },
                    { cat: 'invoice' as const, label: 'Dokumen Invoice', icon: '📄' },
                    { cat: 'service' as const, label: 'Katalog Layanan', icon: '🛠️' },
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
                        <span>{sub.label}</span>
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
        {!collapsed && (
          <div style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>🧑‍💻</span>
            <span>info.rasyiq@gmail.com</span>
          </div>
        )}
        {!collapsed && (
          <div style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>📂</span>
              <span>PROJECT</span>
            </div>
            <span style={{ fontSize: '14px' }}>▴</span>
          </div>
        )}
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

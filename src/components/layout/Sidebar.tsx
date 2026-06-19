import React from 'react';
import { useAppContext } from '../../contexts/AppContext';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { appState, setActiveModule } = useAppContext();

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
        {menuItems.map((item) => (
          <button
            key={item.id}
            style={{ 
              width: '100%', 
              padding: collapsed ? '12px' : '10px 12px', 
              border: 'none', 
              borderRadius: '8px',
              background: appState.activeModule === item.id ? 'var(--accent)' : 'transparent', 
              color: appState.activeModule === item.id ? '#ffffff' : 'var(--text-secondary)', 
              textAlign: 'left', 
              cursor: 'pointer', 
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0' : '12px',
              marginBottom: '4px',
              fontWeight: appState.activeModule === item.id ? '600' : '400',
              transition: 'all 0.15s ease'
            }}
            onClick={() => setActiveModule(item.id)}
            onMouseOver={(e) => {
              if (appState.activeModule !== item.id) {
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseOut={(e) => {
              if (appState.activeModule !== item.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
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

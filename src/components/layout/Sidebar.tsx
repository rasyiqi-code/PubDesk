import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { appState, setActiveModule, connectedUser } = useAppContext();
  const { fileCategory, setFileCategory } = useFileState();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() => {
    const active = appState.activeModule;
    return {
      files: ['files', 'files-parent'].includes(active),
      invoice: ['invoice', 'invoice-manager', 'invoice-insight', 'invoice-parent'].includes(active),
      'master-data-parent': ['kontak', 'penerbit', 'naskah', 'tim', 'legalitas', 'services', 'master-data-parent'].includes(active),
      'produksi-parent': ['produksi-board', 'produksi-list', 'produksi-kendala', 'produksi-approval', 'tambah-tugas', 'edit-tugas', 'produksi-parent'].includes(active)
    };
  });

  const menuItems = [
    { id: 'pekerjaan-saya' as const, label: 'Pekerjaan Saya', icon: '📋' },
    { id: 'produksi-parent' as const, label: 'Produksi Naskah', icon: '🏭' },
    { id: 'laporan-operasional' as const, label: 'Laporan Operasional', icon: '📈' },
    { id: 'invoice' as const, label: 'Invoice', icon: '🧾' },
    { id: 'files' as const, label: 'Smart Folders', icon: '📁' },
    { id: 'master-data-parent' as const, label: 'Master Data', icon: '🗃️' },
  ];

  const bottomItems = [
    { id: 'activity-log' as const, label: 'Activity Log', icon: '📋' },
    { id: 'import-data' as const, label: 'Import Excel Lama', icon: '📥' },
    { id: 'settings' as const, label: 'Pengaturan', icon: '⚙️' },
  ];

  return (
    <div style={{ height: '100%', background: 'var(--bg-panel)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Menu */}
      <nav style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {menuItems.map((item) => {
        const isActive = item.id === 'invoice'
          ? (appState.activeModule === 'invoice' || appState.activeModule === 'invoice-manager' || appState.activeModule === 'invoice-insight' || appState.activeModule === 'invoice-parent')
          : item.id === 'files'
          ? (appState.activeModule === 'files' || appState.activeModule === 'files-parent')
          : item.id === 'master-data-parent'
          ? (
              appState.activeModule === 'kontak' ||
              appState.activeModule === 'penerbit' ||
              appState.activeModule === 'naskah' ||
              appState.activeModule === 'tim' ||
              appState.activeModule === 'legalitas' ||
              appState.activeModule === 'services' ||
              appState.activeModule === 'master-data-parent'
            )
          : item.id === 'produksi-parent'
          ? (
              appState.activeModule === 'produksi-board' ||
              appState.activeModule === 'produksi-list' ||
              appState.activeModule === 'produksi-kendala' ||
              appState.activeModule === 'produksi-approval' ||
              appState.activeModule === 'tambah-tugas' ||
              appState.activeModule === 'edit-tugas' ||
              appState.activeModule === 'produksi-parent'
            )
          : appState.activeModule === item.id;
          const isExpandable = item.id === 'files' || item.id === 'invoice' || item.id === 'master-data-parent' || item.id === 'produksi-parent';
          const isExpanded = expandedMenus[item.id];
          const showSubmenu = item.id === 'files' && !collapsed && isExpanded;
          const showInvoiceSubmenu = item.id === 'invoice' && !collapsed && isExpanded;
          const showMasterDataSubmenu = item.id === 'master-data-parent' && !collapsed && isExpanded;
          const showProduksiSubmenu = item.id === 'produksi-parent' && !collapsed && isExpanded;
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
                  justifyContent: collapsed ? 'center' : 'space-between',
                  marginBottom: '4px',
                  fontWeight: isActive ? '600' : '400',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  if (isExpandable) {
                    setExpandedMenus(prev => ({
                      ...prev,
                      [item.id]: !prev[item.id]
                    }));
                  }

                  if (item.id === 'invoice') {
                    setActiveModule('invoice-parent');
                  } else if (item.id === 'files') {
                    setActiveModule('files-parent');
                  } else if (item.id === 'master-data-parent') {
                    setActiveModule('master-data-parent');
                  } else if (item.id === 'produksi-parent') {
                    setActiveModule('produksi-parent');
                  } else {
                    setActiveModule(item.id);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? '0' : '12px' }}>
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && isExpandable && (
                  <span style={{ 
                    fontSize: '9px', 
                    opacity: 0.7, 
                    transition: 'transform 0.2s', 
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    display: 'inline-block'
                  }}>
                    ▶
                  </span>
                )}
              </button>

              {showInvoiceSubmenu && (
                <div style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '4px', marginTop: '1px' }}>
                  {[
                    { module: 'invoice' as const, label: 'Invoice Generator', icon: '✍️' },
                    { module: 'invoice-manager' as const, label: 'Manajemen Invoice', icon: '🗃️' },
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
                          padding: '4px 8px',
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

              {showMasterDataSubmenu && (
                <div style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '4px', marginTop: '1px' }}>
                  {[
                    { module: 'kontak' as const, label: 'Kontak', icon: '👤' },
                    { module: 'penerbit' as const, label: 'Penerbit', icon: '🏢' },
                    { module: 'naskah' as const, label: 'Naskah', icon: '📚' },
                    { module: 'legalitas' as const, label: 'Legalitas', icon: '⚖️' },
                    { module: 'tim' as const, label: 'Tim', icon: '👨‍💼' },
                    { module: 'services' as const, label: 'Layanan', icon: '🛠️' },
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
                          padding: '4px 8px',
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

              {showProduksiSubmenu && (
                <div style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '4px', marginTop: '1px' }}>
                  {[
                    { module: 'tambah-tugas' as const, label: 'Tambah Tugas Baru', icon: '➕' },
                    { module: 'produksi-board' as const, label: 'Board Produksi', icon: '🎨' },
                    { module: 'produksi-list' as const, label: 'Daftar Tugas', icon: '📄' },
                    { module: 'produksi-kendala' as const, label: 'Revisi & Kendala', icon: '⚠️' },
                    { module: 'produksi-approval' as const, label: 'Approval', icon: '✅' },
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
                          padding: '4px 8px',
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
                <div style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '4px', marginTop: '1px' }}>
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
                          padding: '4px 8px',
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
        {bottomItems.map((item) => {
          const isActive = appState.activeModule === item.id;
          return (
            <button
              key={item.id}
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
              onClick={() => setActiveModule(item.id)}
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
              <span style={{ fontSize: '18px', color: isActive ? '#ffffff' : undefined }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export { Sidebar };
export default Sidebar;

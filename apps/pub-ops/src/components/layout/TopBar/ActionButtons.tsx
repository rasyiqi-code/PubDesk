import React, { useState, useEffect } from 'react';
import { useFileState } from '../../../contexts/FileContext';
import { useAppContext } from '../../../contexts/AppContext';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';
import { useWorkflowContext } from '../../../contexts/WorkflowContext';

interface ActionButtonsProps {
  activeModule?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ activeModule }) => {
  const {
    rightPanelVisible,
    setRightPanelVisible,
  } = useFileState();
  
  const { 
    importExportActions,
    syncModuleDataToCloud,
    services,
    showToast,
    loadFiles,
    loadBooks,
    loadContacts,
    loadInvoices,
    loadServices
  } = useAppContext();

  const { 
    penulis, 
    penerbit, 
    naskah, 
    tim,
    legalitas,
    loadPenulis,
    loadPenerbit,
    loadNaskah,
    loadTim,
    loadLegalitas
  } = useDataMasterContext();
  
  const { tasks, loadTasks } = useWorkflowContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activeActions = activeModule ? importExportActions[activeModule] : undefined;

  const handleRefresh = async () => {
    setRefreshing(true);
    showToast('Menyegarkan data dari database...', 'info');
    try {
      await Promise.all([
        loadFiles(),
        loadBooks(),
        loadContacts(),
        loadInvoices(),
        loadServices(),
        loadPenulis(),
        loadPenerbit(),
        loadNaskah(),
        loadTim(),
        loadLegalitas(),
        loadTasks()
      ]);
      showToast('Seluruh data berhasil disegarkan!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyegarkan beberapa data.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncModuleData = async () => {
    if (!activeModule) return;
    
    // Validasi modul yang mendukung sinkronisasi
    const syncableModules = [
      'kontak', 'books', 'services', 'files', 'invoice', 
      'invoice-manager', 'penerbit', 'naskah', 'tim', 'legalitas',
      'produksi-board', 'produksi-list', 'produksi-kendala', 'produksi-approval', 'tambah-tugas', 'edit-tugas'
    ];
    if (!syncableModules.includes(activeModule)) {
      showToast('Halaman ini tidak mendukung sinkronisasi data.', 'info');
      return;
    }

    setSyncing(true);
    showToast('Memulai sinkronisasi data halaman ini ke Google Sheets...', 'info');

    try {
      const result = await syncModuleDataToCloud(activeModule, {
        penulis,
        penerbit,
        naskah,
        tim,
        legalitas,
        services,
        tasks
      });

      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal sinkronisasi data: ${err.message || String(err)}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = () => {
      setIsDropdownOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isDropdownOpen]);

  return (
    <div className="top-bar-gnome-actions">
      <button 
        className="top-bar-btn" 
        onClick={handleRefresh}
        disabled={refreshing}
        title={refreshing ? "Sedang menyegarkan data..." : "Segarkan data aplikasi"}
        aria-label="Refresh data"
        style={{
          color: refreshing ? 'var(--accent)' : 'var(--text-secondary)',
          cursor: refreshing ? 'not-allowed' : 'pointer'
        }}
      >
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            animation: refreshing ? 'spin 1s linear infinite' : 'none'
          }}
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.72 2.78L21 8" />
          <polyline points="21 3 21 8 16 8" />
        </svg>
      </button>

      <button 
        className="top-bar-btn" 
        onClick={handleSyncModuleData}
        disabled={syncing || !activeModule}
        title={
          !activeModule 
            ? "Pilih halaman untuk melakukan sinkronisasi" 
            : syncing 
              ? "Sedang menyelaraskan data halaman ini..." 
              : "Sinkronkan data halaman ini ke Google Sheets"
        }
        aria-label="Sync data to Google Sheets"
        style={{
          color: syncing ? 'var(--accent)' : 'var(--text-secondary)',
          cursor: (syncing || !activeModule) ? 'not-allowed' : 'pointer',
          opacity: activeModule ? 1 : 0.4
        }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            animation: syncing ? 'spin 1.5s linear infinite' : 'none'
          }}
        >
          <path d="M12 13V20" />
          <path d="m9 16 3-3 3 3" />
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42-1.89-1.78-3.5-4-3.5a5.5 5.5 0 0 0-5.38 4.63A4 4 0 0 0 7.5 20h10" />
        </svg>
      </button>

      <button
        className={`top-bar-btn ${rightPanelVisible ? 'active' : ''}`}
        onClick={() => setRightPanelVisible(!rightPanelVisible)}
        style={{ color: rightPanelVisible ? 'var(--accent)' : 'var(--text-secondary)', background: rightPanelVisible ? 'var(--bg-card)' : 'transparent' }}
        aria-label="Toggle right panel"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      <div style={{ position: 'relative' }}>
        <button 
          className={`top-bar-btn top-bar-dropdown-btn ${isDropdownOpen ? 'active' : ''}`} 
          onClick={(e) => {
            e.stopPropagation();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          style={{ 
            color: isDropdownOpen ? 'var(--accent)' : 'var(--text-secondary)',
            background: isDropdownOpen ? 'var(--bg-card)' : 'transparent',
            opacity: activeActions ? 1 : 0.4,
            cursor: activeActions ? 'pointer' : 'not-allowed'
          }}
          disabled={!activeActions}
          title={activeActions ? 'Ekspor/Impor Data' : 'Tidak ada opsi ekspor/impor untuk menu ini'}
          aria-label="Menu dropdown"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isDropdownOpen && activeActions && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '6px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              minWidth: '180px',
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {activeActions.onDownloadTemplate && (
              <button
                onClick={() => {
                  activeActions.onDownloadTemplate?.();
                  setIsDropdownOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                📥 Unduh Template Excel
              </button>
            )}
            {activeActions.onImport && (
              <button
                onClick={() => {
                  activeActions.onImport?.();
                  setIsDropdownOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                📥 Impor dari Excel
              </button>
            )}
            {activeActions.onExport && (
              <button
                onClick={() => {
                  activeActions.onExport?.();
                  setIsDropdownOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                📤 Ekspor ke Excel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

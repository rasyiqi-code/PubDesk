import React, { useState, useEffect } from 'react';
import { useFileState } from '../../contexts/FileContext';
import { useAppContext } from '../../contexts/AppContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { parseModifiedBy } from '../../utils/gdrive';
import { WindowControls } from './WindowControls';
import { invoke } from '@tauri-apps/api/core';
import { Modal } from '../../ui/molecules/Modal';
import { useAuth } from '../../contexts/AuthContext';
import {
  MODULE_LABELS,
  SEARCHABLE_MODULES,
  SEARCH_PLACEHOLDERS,
  SEARCH_HINTS,
  DEFAULT_SEARCH_PLACEHOLDER,
  DEFAULT_SEARCH_HINT,
} from './topBarConfig';

interface TopBarProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  activeModule?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSessionChange?: (isRunning: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, sidebarCollapsed, activeModule, searchQuery = '', onSearchChange, onSessionChange }) => {
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
  
  const { 
    importExportActions,
    syncAllDataToCloud,
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
  const { currentUser, logout } = useAuth();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Work Session states
  const [activeSession, setActiveSession] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [sessionNote, setSessionNote] = useState('');

  // Load active session on mount
  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const session = await invoke<any>('get_active_work_session');
        if (session) {
          setActiveSession(session);
          setIsTimerRunning(true);
          onSessionChange?.(true);
          const startTime = new Date(session.start_time).getTime();
          const now = Date.now();
          const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
          setTimerSeconds(elapsed);
        } else {
          onSessionChange?.(false);
        }
      } catch (err) {
        console.error('Gagal memuat sesi kerja aktif:', err);
        onSessionChange?.(false);
      }
    };
    fetchActiveSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update timer seconds every second if running
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && activeSession) {
      interval = setInterval(() => {
        const startTime = new Date(activeSession.start_time).getTime();
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
        setTimerSeconds(elapsed);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeSession]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };

  const handleStartWork = async () => {
    try {
      const startTime = new Date().toISOString();
      const sessionId = await invoke<number>('start_work_session', { startTime });
      const newSession = {
        id: sessionId,
        start_time: startTime,
        duration_seconds: 0,
        created_at: startTime
      };
      setActiveSession(newSession);
      setIsTimerRunning(true);
      onSessionChange?.(true);
      showToast('Sesi jam kerja dimulai!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal memulai sesi kerja: ${err.message || String(err)}`, 'error');
    }
  };

  const handleStopWorkClick = () => {
    setSessionNote('');
    setShowNoteModal(true);
  };

  const handleConfirmStopWork = async () => {
    if (!activeSession?.id) return;
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(activeSession.start_time).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      
      await invoke('stop_work_session', {
        id: activeSession.id,
        endTime,
        durationSeconds: elapsedSeconds,
        notes: sessionNote.trim() || null
      });

      setIsTimerRunning(false);
      setActiveSession(null);
      setShowNoteModal(false);
      onSessionChange?.(false);
      showToast('Sesi jam kerja telah disimpan!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal menghentikan sesi kerja: ${err.message || String(err)}`, 'error');
    }
  };

  const motivationalQuotes = "✦ Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras ✦ Satu-satunya cara untuk melakukan pekerjaan hebat adalah dengan mencintai apa yang Anda lakukan ✦ Disiplin adalah jembatan antara tujuan dan pencapaian ✦ Jangan menunggu kesempatan, ciptakan kesempatan itu sendiri ✦ Keberhasilan bukanlah kunci dari kebahagiaan. Kebahagiaan adalah kunci dari keberhasilan ✦ Mulailah dari mana Anda berada. Gunakan apa yang Anda miliki. Lakukan apa yang Anda bisa ✦";

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

  const handleSyncAllData = async () => {
    setSyncing(true);
    showToast('Memulai sinkronisasi seluruh data ke Google Sheets...', 'info');

    try {
      const result = await syncAllDataToCloud({
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

  const isSearchable = activeModule ? SEARCHABLE_MODULES.has(activeModule) : false;
  const moduleLabel = MODULE_LABELS[activeModule ?? ''] ?? 'Files';
  const searchPlaceholder = SEARCH_PLACEHOLDERS[activeModule ?? ''] ?? DEFAULT_SEARCH_PLACEHOLDER;
  const searchHint = SEARCH_HINTS[activeModule ?? ''] ?? DEFAULT_SEARCH_HINT;

  const renderGBriveBreadcrumbs = () => {
    const serverIcon = (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#855800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    );

    const rootFolderId = localStorage.getItem('gdrive_parent_folder_id') || 'root';

    if (currentFolderId === 'root' || currentFolderId === rootFolderId) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {serverIcon}
          <span className="top-bar-path-text" style={{ fontWeight: '600', color: '#556B2F' }}>Google Drive</span>
        </div>
      );
    }

    const breadcrumbs: Array<{ id: string; name: string; icon?: React.ReactNode }> = [];
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
      const pathList: Array<{ id: string; name: string }> = [];
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
  };

  return (
    <>
      <div className="top-bar-container" data-tauri-drag-region>
      <div
        className="top-bar-sidebar-area"
        style={{ width: sidebarCollapsed ? '60px' : '260px' }}
        data-tauri-drag-region
      >
        {!sidebarCollapsed && (
          <button className="top-bar-btn" aria-label="Search sidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}

        {!sidebarCollapsed && (
          <span className="top-bar-sidebar-title">{moduleLabel}</span>
        )}

        <button className="top-bar-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      <div className="top-bar-main-area" data-tauri-drag-region>
        <div className="top-bar-nav-arrows">
          <button
            className="top-bar-btn"
            onClick={navigateBack}
            disabled={!canNavigateBack}
            style={{ opacity: canNavigateBack ? 1 : 0.4, cursor: canNavigateBack ? 'pointer' : 'not-allowed' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
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
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        {isSearchable ? (
          (!isSearchFocused && !searchQuery) ? (
            <div
              className="top-bar-gnome-pathbar"
              onClick={() => setIsSearchFocused(true)}
              style={{ display: 'flex', alignItems: 'center', cursor: 'text', userSelect: 'none', padding: '0 8px' }}
            >
              {activeModule === 'files' ? (
                fileCategory === 'gdrive' ? renderGBriveBreadcrumbs() : (
                  <div className="marquee-container" onClick={(e) => e.stopPropagation()}>
                    <span className="marquee-content">{motivationalQuotes}</span>
                  </div>
                )
              ) : (
                <span className="top-bar-path-text" style={{ color: 'var(--text-secondary)' }}>{searchHint}</span>
              )}
            </div>
          ) : (
            <div className="top-bar-gnome-pathbar" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                autoFocus
                onBlur={() => { if (!searchQuery) setIsSearchFocused(false); }}
                onChange={(e) => onSearchChange?.(e.target.value)}
                style={{
                  width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--text-primary)', fontSize: '13px', paddingLeft: '30px', paddingRight: '8px',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { onSearchChange?.(''); setIsSearchFocused(false); }}
                  className="top-bar-path-clear"
                  aria-label="Hapus pencarian"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )
        ) : (
          <div className="top-bar-gnome-pathbar" style={{ paddingRight: '12px' }}>
            <div className="marquee-container">
              <span className="marquee-content">{motivationalQuotes}</span>
            </div>
          </div>
        )}

        <div className="top-bar-action-container">
          {/* Fitur Timer Durasi Jam Kerja */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
            {isTimerRunning ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 10px', 
                borderRadius: '20px',
                fontFamily: '"JetBrains Mono", "Courier New", monospace',
                fontSize: '13px',
                fontWeight: '600',
                color: '#10b981',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.05)'
              }}>
                <span className="timer-pulse" style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'inline-block',
                  boxShadow: '0 0 8px #10b981'
                }} />
                <span>{formatTime(timerSeconds)}</span>
                <button
                  onClick={handleStopWorkClick}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '4px',
                    borderRadius: '4px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  title="Selesai Kerja"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartWork}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                title="Mulai Sesi Kerja"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className="top-bar-btn-text">Mulai Kerja</span>
              </button>
            )}
          </div>

          <button 
            className="top-bar-btn-close-path" 
            onClick={handleRefresh}
            disabled={refreshing}
            title={refreshing ? "Sedang menyegarkan data..." : "Segarkan data aplikasi"}
            aria-label="Refresh data"
            style={{
              color: refreshing ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              marginRight: '2px'
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
            className="top-bar-btn-close-path" 
            onClick={handleSyncAllData}
            disabled={syncing}
            title={syncing ? "Sedang mensinkronkan data ke GAS..." : "Sinkronkan semua data ke Google Sheets"}
            aria-label="Sync data to Google Sheets"
            style={{
              color: syncing ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: syncing ? 'not-allowed' : 'pointer'
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

          <div className="top-bar-gnome-actions">
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

            {activeModule === 'files' && (
              <button
                className={`top-bar-btn ${fileLayoutMode === 'grid' ? 'active' : ''}`}
                onClick={() => setFileLayoutMode(fileLayoutMode === 'list' ? 'grid' : 'list')}
                title={fileLayoutMode === 'grid' ? 'Tampilan List' : 'Tampilan Grid'}
                style={{ color: fileLayoutMode === 'grid' ? 'var(--accent)' : 'var(--text-secondary)', background: fileLayoutMode === 'grid' ? 'var(--bg-card)' : 'transparent' }}
                aria-label="Toggle grid/list view"
              >
                {fileLayoutMode === 'grid' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                )}
              </button>
            )}

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
          <div className="top-bar-gnome-separator" style={{ margin: '0 4px' }} />

          {/* Info user + tombol logout */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: '700', color: '#fff', flexShrink: 0,
              }}>
                {currentUser.tim_name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('')}
              </div>
              <button
                onClick={logout}
                title="Logout / Ganti User"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '0px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}

          <WindowControls />
        </div>
      </div>

    </div>

      {showNoteModal && (
        <Modal 
          open={showNoteModal} 
          onClose={() => setShowNoteModal(false)} 
          title="Akhiri Sesi Kerja" 
          width="400px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Durasi kerja Anda hari ini adalah <strong>{formatTime(timerSeconds)}</strong>. Tambahkan catatan pekerjaan (opsional) sebelum menyimpan sesi kerja Anda:
            </p>
            <textarea
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              placeholder="Contoh: Menyelesaikan desain halaman login, sinkronisasi file..."
              style={{
                width: '100%',
                height: '80px',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                onClick={() => setShowNoteModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmStopWork}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Simpan & Selesai
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export { TopBar };
export default TopBar;

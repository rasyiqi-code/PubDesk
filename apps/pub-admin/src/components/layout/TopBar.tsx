import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { WindowControls } from './WindowControls';
import { WorkSessionTimer } from './TopBar/WorkSessionTimer';
import { ActionButtons } from './TopBar/ActionButtons';
import { UserProfile } from './TopBar/UserProfile';

interface TopBarProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  activeModule?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onSessionChange?: (isRunning: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  sidebarCollapsed,
  activeModule,
  onSessionChange
}) => {
  const {
    showToast,
    navigateModuleBack,
    navigateModuleForward,
    canNavigateModuleBack,
    canNavigateModuleForward
  } = useAppContext();

  const motivationalQuotes = "✦ Kerja keras mengalahkan bakat ketika bakat tidak bekerja keras ✦ Satu-satunya cara untuk melakukan pekerjaan hebat adalah dengan mencintai apa yang Anda lakukan ✦ Disiplin adalah jembatan antara tujuan dan pencapaian ✦ Jangan menunggu kesempatan, ciptakan kesempatan itu sendiri ✦ Keberhasilan bukanlah kunci dari kebahagiaan. Kebahagiaan adalah kunci dari keberhasilan ✦ Mulailah dari mana Anda berada. Gunakan apa yang Anda miliki. Lakukan apa yang Anda bisa ✦";
  const moduleLabel = 'PubDesk';

  return (
    <>
      <div className="top-bar-container" data-tauri-drag-region>
        <div
          className="top-bar-sidebar-area"
          style={{ width: sidebarCollapsed ? '60px' : '260px' }}
          data-tauri-drag-region
        >
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
              onClick={navigateModuleBack}
              disabled={!canNavigateModuleBack}
              style={{ opacity: canNavigateModuleBack ? 1 : 0.4, cursor: canNavigateModuleBack ? 'pointer' : 'not-allowed' }}
              aria-label="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <button
              className="top-bar-btn"
              onClick={navigateModuleForward}
              disabled={!canNavigateModuleForward}
              style={{ opacity: canNavigateModuleForward ? 1 : 0.4, cursor: canNavigateModuleForward ? 'pointer' : 'not-allowed' }}
              aria-label="Forward"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <div className="top-bar-gnome-pathbar" style={{ paddingRight: '12px' }}>
            <div className="marquee-container">
              <span className="marquee-content">{motivationalQuotes}</span>
            </div>
          </div>

          <div className="top-bar-action-container">
            {/* Fitur Timer Durasi Jam Kerja */}
            <WorkSessionTimer showToast={showToast} onSessionChange={onSessionChange} />

            {/* Tombol-tombol Aksi Refresh, Sync, Right Panel, Grid/List & Dropdown */}
            <ActionButtons activeModule={activeModule} />

            <div className="top-bar-gnome-separator" style={{ margin: '0 4px' }} />

            {/* Info user + tombol logout */}
            <UserProfile />

            <WindowControls />
          </div>
        </div>
      </div>
    </>
  );
};

export { TopBar };
export default TopBar;

import React, { useState, useEffect } from 'react';
import { useFileState } from '../../../contexts/FileContext';
import { useAppContext } from '../../../contexts/AppContext';

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
  } = useAppContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeActions = activeModule ? importExportActions[activeModule] : undefined;

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

import React, { useEffect, useState } from 'react';

const TopBar: React.FC = () => {
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

  return (
    <div className="top-bar" data-tauri-drag-region>
      {/* Navigasi kiri: back, forward */}
      <div className="top-bar-nav">
        <button className="top-bar-btn" aria-label="Back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="top-bar-btn" aria-label="Forward">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Path bar tengah */}
      <div className="top-bar-pathbar">
        <span className="top-bar-path-text">/home/rasyiqi</span>
        <button className="top-bar-btn top-bar-path-action" aria-label="Edit path">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="top-bar-btn top-bar-path-action" aria-label="Clear">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Aksi kanan: search, view, window controls */}
      <div className="top-bar-actions">
        <button className="top-bar-btn" aria-label="Search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="top-bar-btn" aria-label="Grid view">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
        </button>

        {/* Separator antara aksi dan window controls */}
        <div className="top-bar-separator" />

        {/* Window controls */}
        <button className="top-bar-btn" onClick={handleMinimize} aria-label="Minimize">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 8h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="top-bar-btn" onClick={handleMaximize} aria-label="Maximize">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 2h7a2 2 0 012 2v7M11 14H4a2 2 0 01-2-2V5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="top-bar-btn top-bar-btn-close" onClick={handleClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TopBar;

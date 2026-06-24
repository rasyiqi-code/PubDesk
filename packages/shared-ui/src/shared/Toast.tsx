import React, { useEffect, useState } from 'react';

const TOAST_CONFIG = {
  success: {
    bg: 'linear-gradient(135deg, #0f9960 0%, #0d8a56 100%)',
    border: 'rgba(15, 153, 96, 0.4)',
    glow: 'rgba(15, 153, 96, 0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
  },
  error: {
    bg: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)',
    border: 'rgba(192, 57, 43, 0.4)',
    glow: 'rgba(192, 57, 43, 0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    ),
  },
  info: {
    bg: 'linear-gradient(135deg, #1e70cd 0%, #1a63b8 100%)',
    border: 'rgba(30, 112, 205, 0.4)',
    glow: 'rgba(30, 112, 205, 0.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    ),
  },
} as const;

const DURATION_MS = 3500;

interface ToastData {
  message: string;
  type?: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastData | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setProgress(100);
    setVisible(true);

    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [toast]);

  if (!toast || !visible) return null;

  const type = toast.type ?? 'info';
  const config = TOAST_CONFIG[type] ?? TOAST_CONFIG.info;

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0)     scale(1); }
          to   { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.95); }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          minWidth: '280px',
          maxWidth: '420px',
          borderRadius: '14px',
          overflow: 'hidden',
          background: config.bg,
          border: `1px solid ${config.border}`,
          boxShadow: `0 8px 32px ${config.glow}, 0 2px 8px rgba(0,0,0,0.3)`,
          animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
          <span style={{ color: '#ffffff', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {config.icon}
          </span>

          <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '600', lineHeight: '1.4', flex: 1 }}>
            {toast.message}
          </span>
        </div>

        <div style={{ height: '3px', background: 'rgba(255,255,255,0.15)', position: 'relative' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'rgba(255,255,255,0.5)',
              transition: 'width 30ms linear',
              borderRadius: '0 2px 0 0',
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Toast;

import React from 'react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmDialogProps {
  confirmOptions: ConfirmOptions | null;
  hideConfirm: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ confirmOptions, hideConfirm }) => {
  if (!confirmOptions) return null;

  const {
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Batal',
    type = 'primary',
    onConfirm,
    onCancel
  } = confirmOptions;

  const handleCancel = () => {
    if (onCancel) onCancel();
    hideConfirm();
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      hideConfirm();
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-secondary';
      default:
        return 'btn-primary';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeInConfirm 0.2s ease-out'
      }}
      onClick={handleCancel}
    >
      <style>{`
        @keyframes fadeInConfirm {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpConfirm {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          width: '420px',
          maxWidth: '90vw',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'scaleUpConfirm 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{
            fontSize: '24px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(30, 112, 205, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: type === 'danger' ? '#ef4444' : '#1e70cd'
          }}>
            {type === 'danger' ? '⚠️' : '❓'}
          </div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {title}
          </h3>
        </div>

        <p style={{
          margin: 0,
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          whiteSpace: 'pre-line'
        }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button
            className="btn-secondary compact-btn"
            style={{ height: '32px', padding: '0 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '500' }}
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            className={`${getConfirmButtonClass()} compact-btn`}
            style={{
              height: '32px',
              padding: '0 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              backgroundColor: type === 'danger' ? '#ef4444' : undefined,
              borderColor: type === 'danger' ? '#ef4444' : undefined,
              color: type === 'danger' ? '#ffffff' : undefined
            }}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

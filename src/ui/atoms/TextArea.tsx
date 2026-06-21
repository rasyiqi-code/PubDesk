import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label, error, fullWidth, style, ...rest
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: fullWidth ? '100%' : undefined }}>
    {label && (
      <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
        {label}
      </label>
    )}
    <textarea
      style={{
        width: '100%',
        padding: '10px 14px',
        border: `1px solid ${error ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: '8px',
        fontSize: '14px',
        lineHeight: '1.5',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        outline: 'none',
        boxSizing: 'border-box',
        resize: 'vertical',
        fontFamily: 'inherit',
        ...style,
      }}
      {...rest}
    />
    {error && <span style={{ fontSize: '11px', color: 'var(--accent)' }}>{error}</span>}
  </div>
);

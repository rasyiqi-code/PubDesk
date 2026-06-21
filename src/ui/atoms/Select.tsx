import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label, options, fullWidth, style, ...rest
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: fullWidth ? '100%' : undefined }}>
    {label && (
      <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        style={{
          width: '100%',
          height: '42px',
          padding: '10px 36px 10px 14px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '14px',
          lineHeight: '1.4',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          outline: 'none',
          boxSizing: 'border-box',
          appearance: 'none',
          cursor: 'pointer',
          ...style,
        }}
        {...rest}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '10px',
        color: 'var(--text-secondary)',
        pointerEvents: 'none',
        opacity: 0.5,
      }}>
        ▼
      </span>
    </div>
  </div>
);

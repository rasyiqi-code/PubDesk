import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

// Mapping kelas CSS ke variant — konsisten dengan class global di index.css
const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const sizeStyleMap: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: '12px', height: '24px' },
  md: { padding: '8px 16px', fontSize: '13px', height: '32px' },
  lg: { padding: '10px 24px', fontSize: '14px', height: '40px' },
};

/**
 * Komponen Button atomik — digunakan di seluruh modul sebagai pengganti
 * button inline agar styling konsisten.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  children,
  style,
  disabled,
  ...rest
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '6px',
    border: 'none',
    fontWeight: '600',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    width: fullWidth ? '100%' : undefined,
    boxSizing: 'border-box',
    ...sizeStyleMap[size],
    ...style,
  };

  return (
    <button
      className={variantClassMap[variant]}
      style={baseStyle}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span style={{ fontSize: '12px' }}>⏳</span>
      ) : icon ? (
        <span>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

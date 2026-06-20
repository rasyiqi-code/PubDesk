import React from 'react';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  /** Slot untuk elemen di sisi kanan (tombol, badge, dll) */
  action?: React.ReactNode;
  /** Tampilkan border bawah (default: true) */
  bordered?: boolean;
  style?: React.CSSProperties;
}

/**
 * Header seksi dengan judul + slot aksi di kanan.
 * Digunakan untuk h2 dalam card/section di dalam modul.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  action,
  bordered = true,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: bordered ? '8px' : undefined,
      borderBottom: bordered ? '1px solid var(--border)' : undefined,
      marginBottom: bordered ? '12px' : undefined,
      ...style,
    }}
  >
    <h2
      style={{
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {icon && <span>{icon}</span>}
      {title}
    </h2>
    {action && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{action}</div>}
  </div>
);

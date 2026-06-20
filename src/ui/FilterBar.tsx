import React from 'react';

interface FilterBarProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

interface FilterGroupProps {
  label?: string;
  children: React.ReactNode;
}

interface FilterDividerProps {
  style?: React.CSSProperties;
}

/**
 * Wrapper filter bar — bar horizontal di atas tabel, identik di semua modul.
 * Gunakan FilterGroup untuk mengelompokkan chip filter, dan FilterDivider
 * sebagai pemisah vertikal antar grup.
 */
export const FilterBar: React.FC<FilterBarProps> = ({ children, style }) => (
  <div
    style={{
      display: 'flex',
      gap: '20px',
      padding: '10px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      alignItems: 'center',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      flexShrink: 0,
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * Grup label + chip di dalam FilterBar.
 */
export const FilterGroup: React.FC<FilterGroupProps> = ({ label, children }) => (
  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
    {label && (
      <span
        style={{
          fontSize: '11px',
          fontWeight: '700',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
          marginRight: '4px',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    )}
    {children}
  </div>
);

/**
 * Pemisah vertikal antar grup filter.
 */
export const FilterDivider: React.FC<FilterDividerProps> = ({ style }) => (
  <div
    style={{
      width: '1px',
      height: '16px',
      background: 'var(--border)',
      flexShrink: 0,
      ...style,
    }}
  />
);

/**
 * Chip/badge yang bisa diklik untuk memilih/membatalkan filter.
 */
interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  /** Warna teks saat tidak aktif (misalnya warna status) */
  inactiveColor?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  active,
  onClick,
  inactiveColor,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px',
      borderRadius: '20px',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.05)',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      background: active ? 'var(--accent)' : 'var(--bg-card)',
      color: active ? '#ffffff' : (inactiveColor ?? 'var(--text-secondary)'),
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
      height: '24px',
      display: 'inline-flex',
      alignItems: 'center',
    }}
  >
    {label}
  </button>
);

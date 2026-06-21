import React from 'react';
import { Chip } from '../atoms/Chip';

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
      height: 44,
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

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

export const FilterChip = Chip;

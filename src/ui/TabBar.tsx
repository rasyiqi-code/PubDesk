import React from 'react';

interface TabItem {
  key: string;
  label: string;
  icon?: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: React.CSSProperties;
}

/**
 * Komponen TabBar atomik — navigasi tab dengan garis bawah aktif.
 * Digunakan di Settings, PanelKanan, dan modul lain yang punya sub-navigasi.
 */
export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange, style }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: isActive
                ? '2px solid var(--accent)'
                : '2px solid transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

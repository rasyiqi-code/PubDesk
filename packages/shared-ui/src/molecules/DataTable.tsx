import React from 'react';
import { TableEmptyState } from './EmptyState';

export const tableStyles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'var(--bg-dark)',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    background: 'var(--bg-card)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
    textAlign: 'left' as const,
  },
  thead: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 1,
  },
  headerRow: {
    background: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  th: {
    padding: '8px 12px',
    fontWeight: '600' as const,
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
  },
  thAction: {
    padding: '8px 12px',
    fontWeight: '600' as const,
    textAlign: 'left' as const,
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    position: 'sticky' as const,
    right: 0,
    background: 'var(--bg-panel)',
    zIndex: 3,
    boxShadow: '-2px 0 4px rgba(0,0,0,0.06)',
  },
  td: {
    padding: '10px 12px',
    whiteSpace: 'nowrap' as const,
  },
  tdMuted: {
    padding: '10px 12px',
    whiteSpace: 'nowrap' as const,
    color: 'var(--text-secondary)',
  },
  tdTitle: {
    padding: '10px 12px',
    fontWeight: '500' as const,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '300px',
  },
  tdAction: {
    padding: '10px 12px',
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
    position: 'sticky' as const,
    right: 0,
    background: 'var(--bg-card)',
    zIndex: 2,
    boxShadow: '-2px 0 4px rgba(0,0,0,0.06)',
  },
  row: {
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer' as const,
    transition: 'background 0.1s ease',
    color: 'var(--text-primary)',
  },
  actionButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    fontSize: '16px',
    lineHeight: 1,
  },
} as const;

interface DataTablePageProps {
  children: React.ReactNode;
  filterBar?: React.ReactNode;
}

export const DataTablePage: React.FC<DataTablePageProps> = ({ children, filterBar }) => (
  <div style={tableStyles.container}>
    {filterBar}
    {children}
  </div>
);

interface DataTableProps {
  children: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ children }) => (
  <div style={tableStyles.scrollArea}>
    <table style={tableStyles.table}>{children}</table>
  </div>
);

interface DataTableHeaderProps {
  columns: string[];
  actionLabel?: string;
}

export const DataTableHeader: React.FC<DataTableHeaderProps> = ({ columns, actionLabel = 'Aksi' }) => (
  <thead style={tableStyles.thead}>
    <tr style={tableStyles.headerRow}>
      {columns.map((col) => (
        <th key={col} style={tableStyles.th}>{col}</th>
      ))}
      <th style={tableStyles.thAction}>{actionLabel}</th>
    </tr>
  </thead>
);

interface DataTableBodyProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  colSpan: number;
  loadingMessage?: string;
  emptyIcon?: string;
  emptyMessage?: string;
  children?: React.ReactNode;
}

export const DataTableBody: React.FC<DataTableBodyProps> = ({
  isLoading,
  isEmpty,
  colSpan,
  loadingMessage = 'Memuat...',
  emptyIcon = '📝',
  emptyMessage = 'Tidak ada data',
  children,
}) => (
  <tbody>
    {isLoading ? (
      <TableEmptyState colSpan={colSpan} icon="⏳" message={loadingMessage} />
    ) : isEmpty ? (
      <TableEmptyState colSpan={colSpan} icon={emptyIcon} message={emptyMessage} />
    ) : (
      children
    )}
  </tbody>
);

interface HoverRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const HoverRow: React.FC<HoverRowProps> = ({ children, onClick, style }) => (
  <tr
    style={{ ...tableStyles.row, ...style }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--bg-panel)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
    }}
  >
    {children}
  </tr>
);

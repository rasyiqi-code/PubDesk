import React from 'react';

interface EmptyStateProps {
  icon?: string;
  message: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Komponen EmptyState — ditampilkan saat tabel/daftar kosong.
 * Menggantikan pattern td colSpan yang berulang di setiap tabel.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📂',
  message,
  description,
  action,
  style,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      color: 'var(--text-secondary)',
      gap: '8px',
      ...style,
    }}
  >
    <span style={{ fontSize: '32px', marginBottom: '4px' }}>{icon}</span>
    <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{message}</p>
    {description && (
      <p style={{ fontSize: '12px', margin: 0, opacity: 0.7 }}>{description}</p>
    )}
    {action && <div style={{ marginTop: '12px' }}>{action}</div>}
  </div>
);

/**
 * Wrapper EmptyState sebagai <td> untuk penggunaan di dalam <tbody> tabel.
 */
export const TableEmptyState: React.FC<EmptyStateProps & { colSpan: number }> = ({
  colSpan,
  ...rest
}) => (
  <tr>
    <td colSpan={colSpan} style={{ padding: 0 }}>
      <EmptyState {...rest} />
    </td>
  </tr>
);

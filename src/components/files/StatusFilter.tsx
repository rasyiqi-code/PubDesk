import React from 'react';

interface StatusFilterProps {
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatus, setSelectedStatus }) => {
  const statuses = [
    { value: 'draft', label: 'Draft', color: 'var(--text-secondary)' },
    { value: 'review', label: 'Review', color: '#ffc107' },
    { value: 'approved', label: 'Approved', color: '#1e90ff' },
    { value: 'final', label: 'Final', color: '#2ec27e' },
    { value: 'Tersimpan', label: 'Tersimpan Lokal', color: '#2ec27e' },
    { value: 'Cloud', label: 'Tersedia di Cloud', color: 'var(--text-secondary)' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      overflowX: 'auto',
      alignItems: 'center',
      flexShrink: 0
    }}>
      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '4px', whiteSpace: 'nowrap' }}>
        🚦 Filter Status:
      </span>
      <button
        onClick={() => setSelectedStatus(null)}
        style={{
          padding: '4px 10px',
          borderRadius: '20px',
          border: 'none',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          background: selectedStatus === null ? 'var(--accent)' : 'var(--bg-card)',
          color: selectedStatus === null ? '#ffffff' : 'var(--text-secondary)',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap'
        }}
      >
        Semua
      </button>
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => setSelectedStatus(selectedStatus === status.value ? null : status.value)}
          style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            background: selectedStatus === status.value ? 'var(--accent)' : 'var(--bg-card)',
            color: selectedStatus === status.value ? '#ffffff' : status.color,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            border: selectedStatus === status.value ? 'none' : '1px solid rgba(255,255,255,0.05)'
          }}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

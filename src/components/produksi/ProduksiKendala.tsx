import React, { useState, useMemo } from 'react';
import { Task } from '../../types/workflow.types';
import UpdateStatusModal from './UpdateStatusModal';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { useAppContext } from '../../contexts/AppContext';
import { Badge } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import { TableEmptyState } from '../../ui/molecules/EmptyState';

const ProduksiKendala: React.FC = () => {
  const { tasks, isLoading, setSelectedTaskId } = useWorkflowContext();
  const { setRightPanelVisible } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPic, setFilterPic] = useState('');

  const filteredTasks = useMemo(() => {
    // Only keep tasks that are 'Menunggu Revisi' or have notes
    let filtered = tasks.filter(t => t.status === 'Menunggu Revisi' || t.notes);
    if (searchTerm) {
      filtered = filtered.filter(t => (t.naskah_title || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterPic) {
      filtered = filtered.filter(t => t.pic_name === filterPic);
    }
    if (filterStatus) {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    return filtered;
  }, [tasks, searchTerm, filterPic, filterStatus]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Selesai': return 'success';
      case 'Proses': return 'info';
      case 'Menunggu Revisi': return 'warning';
      case 'Menunggu Approval': return 'accent';
      case 'Terlambat': return 'danger';
      default: return 'neutral';
    }
  };

  const uniquePics = useMemo(() => Array.from(new Set(tasks.map(t => t.pic_name).filter(Boolean))), [tasks]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(tasks.map(t => t.status).filter(Boolean))), [tasks]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      <FilterBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
          <span style={{ position: 'relative', left: '12px', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Cari naskah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 10px 4px 36px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              height: '24px',
              flexShrink: 0
            }}
          />
        </div>

        <FilterDivider />

        <FilterGroup label="Status:">
          <FilterChip label="Semua" active={filterStatus === ''} onClick={() => setFilterStatus('')} />
          {uniqueStatuses.map(status => (
            <FilterChip key={status as string} label={status as string} active={filterStatus === status} onClick={() => setFilterStatus(status as string)} />
          ))}
        </FilterGroup>

        <FilterDivider />

        <FilterGroup label="PIC:">
          <FilterChip label="Semua" active={filterPic === ''} onClick={() => setFilterPic('')} />
          {uniquePics.map(pic => (
            <FilterChip key={pic as string} label={pic as string} active={filterPic === pic} onClick={() => setFilterPic(pic as string)} />
          ))}
        </FilterGroup>
      </FilterBar>

      {/* Table Container */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Judul</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Task</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Kendala</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableEmptyState colSpan={5} icon="⏳" message="Memuat..." />
            ) : filteredTasks.length === 0 ? (
              <TableEmptyState colSpan={5} icon="⚠️" message="Tidak ada data kendala atau revisi." />
            ) : (
              filteredTasks.map(task => {
                const handleClick = () => {
                  if (task.id) {
                    setSelectedTaskId(task.id);
                    setRightPanelVisible(true);
                  }
                };

                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                      color: 'var(--text-primary)'
                    }}
                    onClick={handleClick}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {task.naskah_title || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {task.step_name}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#ef4444' }}>
                      {task.notes || 'Menunggu Revisi'}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <Badge
                        label={task.status}
                        variant={getStatusVariant(task.status)}
                      />
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTask(task);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '16px',
                          lineHeight: 1
                        }}
                        title="Detail"
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <UpdateStatusModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default ProduksiKendala;

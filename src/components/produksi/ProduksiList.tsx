import React, { useState, useMemo } from 'react';
import { Task } from '../../types/workflow.types';
import TaskModal from './TaskModal';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { useAppContext } from '../../contexts/AppContext';
import { Badge } from '../../ui/atoms/Badge';
import { Button } from '../../ui/atoms/Button';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import { TableEmptyState } from '../../ui/molecules/EmptyState';

const ProduksiList: React.FC = () => {
  const { tasks, isLoading, setSelectedTaskId } = useWorkflowContext();
  const { setRightPanelVisible } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  // Filters
  const [filterPic, setFilterPic] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Unique PICs and statuses
  const uniquePics = useMemo(() => Array.from(new Set(tasks.map(t => t.pic_name).filter(Boolean))), [tasks]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(tasks.map(t => t.status).filter(Boolean))), [tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchTerm && !(t.naskah_title || '').toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterPic && t.pic_name !== filterPic) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      <FilterBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
          <span style={{ position: 'relative', left: '12px', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Cari..."
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

        <FilterGroup label="PIC:">
          <FilterChip label="Semua" active={filterPic === ''} onClick={() => setFilterPic('')} />
          {uniquePics.map(pic => (
            <FilterChip key={pic as string} label={pic as string} active={filterPic === pic} onClick={() => setFilterPic(pic as string)} />
          ))}
        </FilterGroup>

        <FilterDivider />

        <FilterGroup label="Status:">
          <FilterChip label="Semua" active={filterStatus === ''} onClick={() => setFilterStatus('')} />
          {uniqueStatuses.map(status => (
            <FilterChip key={status as string} label={status as string} active={filterStatus === status} onClick={() => setFilterStatus(status as string)} />
          ))}
        </FilterGroup>

        <FilterDivider />

        <Button onClick={() => { setSelectedTask(undefined); setIsModalOpen(true); }} variant="primary" size="sm" icon="➕">
          Task
        </Button>
      </FilterBar>

      {/* Task Table Container */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>ID Task</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>ID Naskah</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Judul</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Tahap</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>PIC</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Mulai</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Deadline</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Selesai</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableEmptyState colSpan={10} icon="⏳" message="Memuat..." />
            ) : filteredTasks.length === 0 ? (
              <TableEmptyState colSpan={10} icon="📝" message="Tidak ada data tugas" />
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
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      #{task.id}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      #{task.naskah_id}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {task.naskah_title || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {task.step_name}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {task.pic_name || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(task.start_date)}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(task.due_date)}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {formatDate(task.completed_date)}
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
                          setIsModalOpen(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '16px',
                          lineHeight: 1,
                          marginRight: '4px'
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

      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProduksiList;

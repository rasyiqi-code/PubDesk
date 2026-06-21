import React, { useState, useMemo } from 'react';
import { Task } from '../../types/workflow.types';
import UpdateStatusModal from './UpdateStatusModal';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { useAppContext } from '../../contexts/AppContext';
import { Badge } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip } from '../../ui/molecules/FilterBar';
import { TableEmptyState } from '../../ui/molecules/EmptyState';

const PekerjaanSaya: React.FC = () => {
  const { tasks, isLoading, setSelectedTaskId } = useWorkflowContext();
  const { setRightPanelVisible } = useAppContext();
  const [filter, setFilter] = useState<'Semua' | 'Hari Ini' | 'Terlambat' | 'Revisi' | 'Approval' | 'Selesai'>('Semua');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isOverdue = (task: Task) => {
    if (task.status === 'Selesai') return false;
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() < today.getTime();
  };

  const isDeadlineDekat = (task: Task) => {
    if (task.status === 'Selesai') return false;
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  const isHariIni = (task: Task) => {
    if (!task.due_date) return false;
    const due = new Date(task.due_date);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  };

  const isSelesaiMingguIni = (task: Task) => {
    if (task.status !== 'Selesai' || !task.completed_date) return false;
    const completed = new Date(task.completed_date);
    const diffTime = today.getTime() - completed.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const filteredTasks = useMemo(() => tasks.filter(t => {
    if (filter === 'Semua') return true;
    if (filter === 'Selesai') return t.status === 'Selesai';
    if (filter === 'Revisi') return t.status === 'Menunggu Revisi';
    if (filter === 'Approval') return t.status === 'Menunggu Approval';
    if (filter === 'Terlambat') return isOverdue(t) || t.status === 'Terlambat';
    if (filter === 'Hari Ini') return isHariIni(t);
    return true;
  }), [tasks, filter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      aktif: tasks.filter(t => t.status === 'Proses' || t.status === 'Belum Mulai').length,
      deadlineDekat: tasks.filter(isDeadlineDekat).length,
      terlambat: tasks.filter(t => isOverdue(t) || t.status === 'Terlambat').length,
      revisi: tasks.filter(t => t.status === 'Menunggu Revisi').length,
      approval: tasks.filter(t => t.status === 'Menunggu Approval').length,
      selesaiMingguIni: tasks.filter(isSelesaiMingguIni).length
    };
  }, [tasks]);

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
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', padding: '12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.aktif}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aktif</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.deadlineDekat}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Deadline Dekat</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.terlambat}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Terlambat</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.revisi}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Menunggu Revisi</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.approval}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Menunggu Approval</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{stats.selesaiMingguIni}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Selesai Minggu Ini</div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar>
        <FilterGroup label="">
          {(['Semua', 'Hari Ini', 'Terlambat', 'Revisi', 'Approval', 'Selesai'] as const).map(f => (
            <FilterChip
              key={f}
              label={f}
              active={filter === f}
              onClick={() => setFilter(f)}
            />
          ))}
        </FilterGroup>
      </FilterBar>

      {/* Task Table Container */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Judul Naskah</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Tahap</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Deadline</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Prioritas</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableEmptyState colSpan={6} icon="⏳" message="Memuat data..." />
            ) : filteredTasks.length === 0 ? (
              <TableEmptyState colSpan={6} icon="📝" message="Tidak ada tugas yang sesuai filter." />
            ) : (
              filteredTasks.map(task => {
                const handleClick = () => {
                  if (task.id) {
                    setSelectedTaskId(task.id);
                    setRightPanelVisible(true);
                  }
                };

                return (
                  <React.Fragment key={task.id}>
                    <tr
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        color: 'var(--text-primary)'
                      }}
                      onClick={handleClick}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-panel)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                        {task.naskah_title || `Naskah #${task.naskah_id}`}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {task.step_name}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(task.due_date)}
                        {isOverdue(task) && <span style={{ color: '#ef4444', marginLeft: '6px', fontSize: '12px' }}>⚠️</span>}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <Badge
                          label={task.status}
                          variant={getStatusVariant(task.status)}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          color: task.priority === 'Tinggi' || task.priority === 'Urgent' ? '#ef4444' : 'var(--text-secondary)'
                        }}>
                          {task.priority || 'Normal'}
                        </span>
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
                          title={task.status === 'Belum Mulai' ? 'Mulai' : 'Update'}
                        >
                          {task.status === 'Belum Mulai' ? '▶️' : '✏️'}
                        </button>
                      </td>
                    </tr>
                    {/* Notes/Proof row (if any) */}
                    {(task.notes || task.proof_path_or_link) && (
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={6} style={{ padding: '0 20px 16px 20px' }}>
                          <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {task.notes && (
                              <div><strong style={{ color: 'var(--text-primary)' }}>Catatan:</strong> {task.notes}</div>
                            )}
                            {task.proof_path_or_link && (
                              <div><strong style={{ color: 'var(--text-primary)' }}>Bukti/File:</strong> <a href={task.proof_path_or_link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{task.proof_path_or_link}</a></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Update Status */}
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

export default PekerjaanSaya;

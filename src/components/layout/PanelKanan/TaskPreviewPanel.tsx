import React from 'react';
import { useWorkflowContext } from '../../../contexts/WorkflowContext';
import UpdateStatusModal from '../../produksi/UpdateStatusModal';
import TaskModal from '../../produksi/TaskModal';

const TaskPreviewPanel: React.FC = () => {
  const { tasks, selectedTaskId } = useWorkflowContext();
  const [showUpdateModal, setShowUpdateModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  if (!selectedTask) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
          Pilih task untuk melihat detail
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selesai': return { bg: '#dcfce7', text: '#166534' };
      case 'Proses': return { bg: '#dbeafe', text: '#1e40af' };
      case 'Menunggu Revisi': return { bg: '#fef3c7', text: '#92400e' };
      case 'Menunggu Approval': return { bg: '#ede9fe', text: '#5b21b6' };
      case 'Terlambat': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  const statusStyle = getStatusColor(selectedTask.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '20px', overflowY: 'auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
          Detail Task
        </h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
          {selectedTask.naskah_title || `Naskah #${selectedTask.naskah_id}`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <span style={{ padding: '4px 12px', borderRadius: '12px', background: statusStyle.bg, color: statusStyle.text, fontSize: '12px', fontWeight: '600' }}>
          {selectedTask.status}
        </span>
        <span style={{ padding: '4px 12px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '500', border: '1px solid var(--border)' }}>
          {selectedTask.step_name}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>PIC</div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
            {selectedTask.pic_name || '-'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tanggal Mulai</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {selectedTask.start_date ? new Date(selectedTask.start_date).toLocaleDateString('id-ID') : '-'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Deadline</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('id-ID') : '-'}
            </div>
          </div>
        </div>

        {selectedTask.completed_date && (
          <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tanggal Selesai</div>
            <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {new Date(selectedTask.completed_date).toLocaleDateString('id-ID')}
            </div>
          </div>
        )}
      </div>

      {selectedTask.notes && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Catatan</h3>
          <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {selectedTask.notes}
          </div>
        </div>
      )}

      {selectedTask.proof_path_or_link && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Bukti / File</h3>
          <a
            href={selectedTask.proof_path_or_link}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              padding: '10px 14px',
              background: 'var(--bg-card)',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '13px',
              wordBreak: 'break-all'
            }}
          >
            {selectedTask.proof_path_or_link}
          </a>
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowUpdateModal(true)}
          style={{
            flex: 1,
            padding: '10px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          Update Status
        </button>
        <button
          onClick={() => setShowEditModal(true)}
          style={{
            flex: 1,
            padding: '10px',
            background: 'transparent',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500'
          }}
        >
          Edit Task
        </button>
      </div>

      {showUpdateModal && (
        <UpdateStatusModal
          task={selectedTask}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => setShowUpdateModal(false)}
        />
      )}

      {showEditModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

export default TaskPreviewPanel;

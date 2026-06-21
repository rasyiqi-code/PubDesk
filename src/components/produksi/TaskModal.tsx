import React, { useState } from 'react';
import { Task } from '../../types/workflow.types';
import { useAppContext } from '../../contexts/AppContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useWorkflowContext } from '../../contexts/WorkflowContext';

interface TaskModalProps {
  task?: Task; // if provided, it's edit mode
  onClose: () => void;
  onSuccess: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSuccess }) => {
  const { showToast } = useAppContext();
  const { tim } = useDataMasterContext();
  const { addTask, updateTask } = useWorkflowContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = !!task;
  const [useManualPic, setUseManualPic] = useState(false);

  // Form states
  const [naskahId, setNaskahId] = useState(task?.naskah_id || '');
  const [stepName, setStepName] = useState(task?.step_name || '');
  const [picName, setPicName] = useState(task?.pic_name || '');
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.split('T')[0] : '');
  const [priority, setPriority] = useState(task?.priority || 'Normal');
  const [status, setStatus] = useState(task?.status || 'Belum Mulai');
  const [notes, setNotes] = useState(task?.notes || '');

  const statusOptions = [
    'Belum Mulai',
    'Proses',
    'Menunggu Revisi',
    'Menunggu Approval',
    'Selesai',
    'Batal'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEdit && task) {
        // Edit mode
        const updatedTask: Task = {
          ...task,
          pic_name: picName,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          priority,
          status,
          notes
        };
        await updateTask(updatedTask);
        showToast('Tugas berhasil diupdate', 'success');
      } else {
        // Create mode
        const newTask = {
          naskah_id: Number(naskahId),
          step_name: stepName,
          status: 'Belum Mulai',
          priority: priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes
        };
        await addTask(newTask);
        showToast('Tugas berhasil ditambahkan', 'success');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        <h3 style={{ margin: '0 0 16px 0' }}>{isEdit ? 'Edit Tugas' : 'Tambah Tugas Baru'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {!isEdit && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>ID Naskah</label>
                <input required type="number" value={naskahId} onChange={e => setNaskahId(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label>Nama Tahap Workflow</label>
                <input required type="text" value={stepName} onChange={e => setStepName(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'white' }} />
              </div>
            </>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Nama PIC</label>
            {useManualPic ? (
              <input
                type="text"
                value={picName}
                onChange={e => setPicName(e.target.value)}
                placeholder="Masukkan nama PIC..."
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-panel)',
                  color: 'var(--text-primary)'
                }}
              />
            ) : (
              <select
                value={picName}
                onChange={e => setPicName(e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-panel)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Pilih PIC dari Tim...</option>
                {tim.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => setUseManualPic(!useManualPic)}
              style={{
                fontSize: '12px',
                color: 'var(--accent)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0
              }}
            >
              {useManualPic ? 'Pilih dari Tim' : 'Masukkan Manual'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Deadline</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'white' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Prioritas</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'white' }}>
              <option value="Normal">Normal</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Urgent">Urgent</option>
              <option value="Rendah">Rendah</option>
            </select>
          </div>

          {isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'white' }}>
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label>Catatan</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'white' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}>Batal</button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;

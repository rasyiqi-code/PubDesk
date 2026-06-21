import React, { useState } from 'react';
import { Task } from '../../types/workflow.types';
import { useAppContext } from '../../contexts/AppContext';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { googleAppsScriptService } from '../../services/googleAppsScript';
import { Modal } from '../../ui/molecules/Modal';
import { TextArea } from '../../ui/atoms/TextArea';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';

interface UpdateStatusModalProps {
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ task, onClose, onSuccess }) => {
  const { showToast } = useAppContext();
  const { updateTaskStatus } = useWorkflowContext();
  const [status, setStatus] = useState(task.status || 'Belum Mulai');
  const [notes, setNotes] = useState('');
  const [proof, setProof] = useState(task.proof_path_or_link || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const statusOptions = [
    { value: 'Belum Mulai', label: 'Belum Mulai' },
    { value: 'Proses', label: 'Proses' },
    { value: 'Menunggu Revisi', label: 'Menunggu Revisi' },
    { value: 'Menunggu Approval', label: 'Menunggu Approval' },
    { value: 'Selesai', label: 'Selesai' },
    { value: 'Terlambat', label: 'Terlambat' }
  ];

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!googleAppsScriptService.isConfigured()) {
      showToast('Harap konfigurasikan Google Apps Script terlebih dahulu di setelan!', 'error');
      return;
    }

    setIsUploading(true);
    showToast(`Mengunggah ${file.name} ke Google Drive...`, 'info');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const resultStr = reader.result as string;
          const base64String = resultStr.split(',')[1];
          const result = await googleAppsScriptService.uploadFileToCloud(
            file.name,
            base64String,
            task.step_name || 'Tasks',
            file.type
          );
          
          if (result.success && result.file_url) {
            setProof(result.file_url);
            showToast('File berhasil diunggah ke Google Drive!', 'success');
          } else {
            showToast('Gagal mengunggah file.', 'error');
          }
        } catch (err: any) {
          console.error(err);
          showToast(`Gagal mengunggah: ${err.message || String(err)}`, 'error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      showToast('Gagal membaca file.', 'error');
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === task.status && !notes && proof === task.proof_path_or_link) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTaskStatus(task.id!, status, notes, proof);
      showToast('Status berhasil diupdate!', 'success');
      onSuccess();
    } catch (err) {
      console.error('Failed to update task:', err);
      showToast('Gagal mengupdate status tugas.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Update Status Pekerjaan" width="500px">
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-8px', marginBottom: '8px' }}>
        {task.naskah_title || `Naskah #${task.naskah_id}`} - {task.step_name}
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        <Select
          label="Status Saat Ini"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={statusOptions}
          fullWidth
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Bukti Pekerjaan (URL / Path / Upload)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Tautan Google Drive atau klik unggah berkas..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('task-proof-upload')?.click()}
              disabled={isUploading || isSubmitting}
              style={{
                padding: '0 16px',
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              {isUploading ? '⏳ Uploading...' : '📤 Unggah'}
            </button>
            <input
              id="task-proof-upload"
              type="file"
              style={{ display: 'none' }}
              onChange={handleUploadFile}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Anda dapat mengetikkan tautan manual atau mengklik tombol **Unggah** untuk menyimpan file langsung di Google Drive.
          </span>
        </div>

        <TextArea
          label="Catatan / Kendala"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tambahkan informasi progres, alasan keterlambatan, dsb."
          rows={4}
          fullWidth
        />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            Batal
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            variant="primary"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateStatusModal;

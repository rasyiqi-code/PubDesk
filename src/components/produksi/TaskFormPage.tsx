import React, { useState, useEffect } from 'react';
import { Task } from '../../types/workflow.types';
import { useAppContext } from '../../contexts/AppContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { TextField } from '../../ui/atoms/TextField';
import { TextArea } from '../../ui/atoms/TextArea';
import { Select } from '../../ui/atoms/Select';
import { SearchableSelect } from '../../ui/atoms/SearchableSelect';
import { Button } from '../../ui/atoms/Button';
import { DatePicker } from '../../ui/atoms/DatePicker';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

const TaskFormPage: React.FC = () => {
  const { showToast, setActiveModule, selectedTaskId, appState } = useAppContext();
  const { tim, naskah } = useDataMasterContext();
  const { addTask, updateTask, tasks } = useWorkflowContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useManualPic, setUseManualPic] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  const isEdit = appState.activeModule === 'edit-tugas';

  // Form states
  const [naskahId, setNaskahId] = useState('');
  const [picName, setPicName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [status, setStatus] = useState('Belum Mulai');
  const [notes, setNotes] = useState('');
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [customStepsInput, setCustomStepsInput] = useState('');

  const statusOptions = [
    { value: 'Belum Mulai', label: 'Belum Mulai' },
    { value: 'Proses', label: 'Proses' },
    { value: 'Menunggu Revisi', label: 'Menunggu Revisi' },
    { value: 'Menunggu Approval', label: 'Menunggu Approval' },
    { value: 'Selesai', label: 'Selesai' },
    { value: 'Batal', label: 'Batal' }
  ];

  const priorityOptions = [
    { value: 'Rendah', label: 'Rendah' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Tinggi', label: 'Tinggi' },
    { value: 'Urgent', label: 'Urgent' }
  ];

  const picOptions = [
    { value: '', label: 'Pilih PIC dari Tim...' },
    ...tim.map(member => ({ value: member.name, label: member.name }))
  ];

  const naskahOptions = [
    { value: '', label: '-- Pilih Naskah --' },
    ...naskah.map(n => ({
      value: String(n.id),
      label: `${n.title} (${n.naskah_id_code || `ID: ${n.id}`})`
    }))
  ];

  // Load task data if in edit mode
  useEffect(() => {
    if (isEdit && selectedTaskId) {
      const taskToEdit = tasks.find(t => t.id === selectedTaskId);
      if (taskToEdit) {
        setNaskahId(taskToEdit.naskah_id.toString());
        setPicName(taskToEdit.pic_name || '');
        setDueDate(taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : '');
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
        setNotes(taskToEdit.notes || '');
      }
    } else {
      setNaskahId('');
      setPicName('');
      setDueDate('');
      setPriority('Normal');
      setStatus('Belum Mulai');
      setNotes('');
      setSelectedSteps([]);
      setCustomStepsInput('');
    }
  }, [isEdit, selectedTaskId, tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit) {
      if (!naskahId.trim()) {
        showToast('Naskah tidak boleh kosong!', 'error');
        return;
      }
      const customSteps = customStepsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const allSteps = [...selectedSteps, ...customSteps];

      if (allSteps.length === 0) {
        showToast('Pilih minimal satu Tahap Workflow!', 'error');
        return;
      }

      setIsSubmitting(true);
      try {
        let successCount = 0;
        // Loop secara serial berurutan agar database SQLite tidak race condition / locked
        for (const step of allSteps) {
          const newTask = {
            naskah_id: Number(naskahId),
            step_name: step,
            status: 'Belum Mulai',
            priority: priority,
            due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
            notes: notes
          };
          await addTask(newTask);
          successCount++;
        }
        showToast(`${successCount} tugas berhasil ditambahkan`, 'success');
        setActiveModule('produksi-list');
      } catch (err) {
        console.error(err);
        showToast('Terjadi kesalahan saat menambahkan tugas', 'error');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (selectedTaskId) {
        setIsSubmitting(true);
        try {
          const taskToEdit = tasks.find(t => t.id === selectedTaskId);
          if (taskToEdit) {
            const updatedTask: Task = {
              ...taskToEdit,
              pic_name: picName,
              due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
              priority,
              status,
              notes
            };
            await updateTask(updatedTask);
            showToast('Tugas berhasil diupdate', 'success');
            setActiveModule('produksi-list');
          }
        } catch (err) {
          console.error(err);
          showToast('Terjadi kesalahan saat mengupdate tugas', 'error');
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveModule('home')}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 10px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-panel)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          🏠 Beranda
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          {isEdit ? '📝 Edit Tugas' : '➕ Tugas Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="📋 Informasi Tugas" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isEdit && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', alignItems: 'start' }}>
                  <SearchableSelect
                    label="Pilih Naskah"
                    options={naskahOptions}
                    value={naskahId}
                    onChange={setNaskahId}
                    placeholder="Cari judul naskah..."
                    emptyMessage="Tidak ada naskah yang cocok"
                    fullWidth
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                      Tahap Workflow (Pilih beberapa)
                    </label>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '8px', 
                      background: 'var(--bg-panel)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      padding: '12px' 
                    }}>
                      {[
                        { value: 'Penulisan', label: 'Penulisan' },
                        { value: 'Editing', label: 'Editing (Penyuntingan)' },
                        { value: 'Layouting', label: 'Layouting (Tata Letak)' },
                        { value: 'Desain Cover', label: 'Desain Cover (Sampul)' },
                        { value: 'Proofreading', label: 'Proofreading (Koreksi)' },
                        { value: 'Legalitas', label: 'Legalitas (ISBN/QRCBN)' },
                        { value: 'Cetak', label: 'Cetak (Produksi Fisik)' },
                        { value: 'Distribusi', label: 'Distribusi / Pemasaran' }
                      ].map(step => {
                        const isChecked = selectedSteps.includes(step.value);
                        return (
                          <label 
                            key={step.value} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              fontSize: '13px', 
                              color: 'var(--text-primary)', 
                              cursor: 'pointer',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: isChecked ? 'var(--bg-card)' : 'transparent',
                              border: isChecked ? '1px solid var(--accent)' : '1px solid transparent',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSteps([...selectedSteps, step.value]);
                                } else {
                                  setSelectedSteps(selectedSteps.filter(s => s !== step.value));
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            {step.label}
                          </label>
                        );
                      })}
                    </div>
                    <TextField
                      type="text"
                      label="Tahap Kustom Tambahan (Opsional, pisahkan koma jika banyak)"
                      placeholder="Misal: Review Akhir, Layouting Tambahan"
                      value={customStepsInput}
                      onChange={e => setCustomStepsInput(e.target.value)}
                      fullWidth
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {useManualPic ? (
                  <TextField
                    label="Nama PIC"
                    type="text"
                    value={picName}
                    onChange={e => setPicName(e.target.value)}
                    placeholder="Masukkan nama PIC..."
                    fullWidth
                  />
                ) : (
                  <Select
                    label="Nama PIC"
                    value={picName}
                    onChange={e => setPicName(e.target.value)}
                    options={picOptions}
                    fullWidth
                  />
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
                    padding: 0,
                    width: 'fit-content'
                  }}
                >
                  {useManualPic ? 'Pilih dari Tim' : 'Masukkan Manual'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <DatePicker 
                  label="Deadline" 
                  value={dueDate} 
                  onChange={setDueDate} 
                  fullWidth
                />
                <Select
                  label="Prioritas"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  options={priorityOptions}
                  fullWidth
                />
              </div>

              {isEdit && (
                <Select
                  label="Status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  options={statusOptions}
                  fullWidth
                />
              )}

              <TextArea
                label="Catatan"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Catatan tambahan..."
                style={{ height: '100px' }}
                fullWidth
              />
            </div>
          </AccordionSection>
        </Accordion>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="primary" style={{ flex: 1 }} size="lg" loading={isSubmitting}>
            💾 Simpan
          </Button>
          <Button type="button" variant="secondary" style={{ flex: 1 }} size="lg" onClick={() => setActiveModule('produksi-list')}>
            ❌ Batal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskFormPage;

import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '../../types/workflow.types';
import { useAppContext } from '../../contexts/AppContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useWorkflowContext } from '../../contexts/WorkflowContext';
import { TextField } from '../../ui/atoms/TextField';
import { TextArea } from '../../ui/atoms/TextArea';
import { Select } from '../../ui/atoms/Select';

import { Button } from '../../ui/atoms/Button';
import { DatePicker } from '../../ui/atoms/DatePicker';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';
import { useAuth } from '../../contexts/AuthContext';
import { SmartRelationField, SmartRelationOption } from '@pubhub/shared-ui';
import { findBestDuplicate, formatDuplicateReason } from '@pubhub/shared-utils';

const TaskFormPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast, setActiveModule, selectedTaskId, appState } = useAppContext();
  const { naskah, penulis, addNaskah, tim } = useDataMasterContext();
  const { addTask, updateTask, tasks } = useWorkflowContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  const isEdit = appState.activeModule === 'edit-tugas';

  // Form states
  const [naskahId, setNaskahId] = useState('');
  const [stepName, setStepName] = useState('');
  const [assignedTeamId, setAssignedTeamId] = useState('');
  const [picName, setPicName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [status, setStatus] = useState('Belum Mulai');
  const [notes, setNotes] = useState('');
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [customStepsInput, setCustomStepsInput] = useState('');
  const [inputMode, setInputMode] = useState<'naskah' | 'pesanan'>('naskah');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [judulPesananInput, setJudulPesananInput] = useState('');

  // SmartRelation quick-create state
  const [naskahCreateForm, setNaskahCreateForm] = useState({ title: '', penulis_id: '', copies: 0 });
  const [naskahDuplicateWarning, setNaskahDuplicateWarning] = useState<{
    matchedOption: SmartRelationOption;
    similarity: number;
    reason: string;
  } | null>(null);

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

  const filteredNaskahOptions = useMemo(() => {
    let list = naskah;
    if (selectedCustomerId) {
      list = naskah.filter(n => n.penulis_id === Number(selectedCustomerId));
    }
    return list.map(n => ({
      value: String(n.id),
      label: `${n.title} (${n.naskah_id_code || `ID: ${n.id}`})`,
      penulis_id: n.penulis_id
    }));
  }, [naskah, selectedCustomerId]);

  const penulisOptions: SmartRelationOption[] = useMemo(
    () => penulis.map((p) => ({ value: String(p.id), label: p.name, wa_number: p.wa_number, email: p.email })),
    [penulis]
  );

  const timOptions: SmartRelationOption[] = useMemo(
    () => tim.map((t) => ({ value: String(t.id), label: `${t.name} (${t.role})`, role: t.role })),
    [tim]
  );

  const checkNaskahDuplicate = (title: string) => {
    const result = findBestDuplicate(
      { id: undefined, title },
      naskah.map((n) => ({ id: String(n.id), title: n.title })),
      [{ key: 'title', weight: 1, threshold: 0.85 }],
      0.75
    );
    if (result) {
      setNaskahDuplicateWarning({
        matchedOption: filteredNaskahOptions.find((o) => o.value === result.item.id) || { value: result.item.id, label: result.item.title },
        similarity: result.score,
        reason: formatDuplicateReason(result, 'title'),
      });
      return true;
    }
    setNaskahDuplicateWarning(null);
    return false;
  };

  const createNaskahFromTask = async (onSuccess: () => void) => {
    const { title, penulis_id, copies } = naskahCreateForm;
    if (!title.trim()) return;
    if (!naskahDuplicateWarning && checkNaskahDuplicate(title)) return;
    try {
      const id = await addNaskah({
        title: title.trim(),
        penulis_id: penulis_id ? Number(penulis_id) : undefined,
        copies: copies || 0,
        book_size: '14x20',
        legal_type: 'Tanpa ISBN',
        order_type: 'Baru',
        status: 'Belum Dimulai'
      });
      setNaskahId(String(id));
      if (penulis_id) setSelectedCustomerId(penulis_id);
      setNaskahDuplicateWarning(null);
      onSuccess();
    } catch (err) {
      console.error('Gagal membuat naskah:', err);
    }
  };

  // Otomatis set pelanggan jika naskah dipilih
  useEffect(() => {
    if (naskahId) {
      const selected = naskah.find(n => n.id === Number(naskahId));
      if (selected?.penulis_id) {
        setSelectedCustomerId(String(selected.penulis_id));
      }
    }
  }, [naskahId, naskah]);

  // Reset naskahId jika pelanggan berubah dan naskah yang terpilih tidak cocok dengan pelanggan tersebut
  useEffect(() => {
    if (naskahId && selectedCustomerId) {
      const selected = naskah.find(n => n.id === Number(naskahId));
      if (selected && selected.penulis_id !== Number(selectedCustomerId)) {
        setNaskahId('');
      }
    }
  }, [selectedCustomerId, naskahId, naskah]);

  // Load task data if in edit mode
  useEffect(() => {
    if (isEdit && selectedTaskId) {
      const taskToEdit = tasks.find(t => t.id === selectedTaskId);
      if (taskToEdit) {
        setNaskahId(taskToEdit.naskah_id.toString());
        setStepName(taskToEdit.step_name || '');
        setAssignedTeamId(taskToEdit.assigned_team_id ? taskToEdit.assigned_team_id.toString() : '');
        setPicName(taskToEdit.pic_name || '');
        setDueDate(taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : '');
        setPriority(taskToEdit.priority);
        setStatus(taskToEdit.status);
        setNotes(taskToEdit.notes || '');
      }
    } else {
      setNaskahId('');
      setStepName('');
      setAssignedTeamId('');
      setPicName(currentUser ? currentUser.tim_name : '');
      setDueDate('');
      setPriority('Normal');
      setStatus('Belum Mulai');
      setNotes('');
      setSelectedSteps([]);
      setCustomStepsInput('');
      setInputMode('naskah');
      setSelectedCustomerId('');
      setJudulPesananInput('');
    }
  }, [isEdit, selectedTaskId, tasks, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit) {
      let finalNaskahId = '';

      if (inputMode === 'naskah') {
        if (!naskahId.trim()) {
          showToast('Pilih naskah terlebih dahulu!', 'error');
          return;
        }
        finalNaskahId = naskahId;
      } else {
        if (!judulPesananInput.trim()) {
          showToast('Judul pesanan tidak boleh kosong!', 'error');
          return;
        }
        setIsSubmitting(true);
        try {
          // Membuat naskah baru secara otomatis
          const newNaskahId = await addNaskah({
            title: judulPesananInput.trim(),
            penulis_id: selectedCustomerId ? Number(selectedCustomerId) : undefined,
            copies: 0,
            book_size: '14x20',
            legal_type: 'Tanpa ISBN',
            order_type: 'Baru',
            status: 'Belum Dimulai'
          });
          if (newNaskahId) {
            finalNaskahId = String(newNaskahId);
          } else {
            showToast('Gagal membuat pesanan naskah baru', 'error');
            setIsSubmitting(false);
            return;
          }
        } catch (err) {
          console.error(err);
          showToast('Terjadi kesalahan saat membuat pesanan naskah', 'error');
          setIsSubmitting(false);
          return;
        }
      }

      const customSteps = customStepsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      const allSteps = [...selectedSteps, ...customSteps];

      if (allSteps.length === 0) {
        showToast('Pilih minimal satu Tugas Produksi!', 'error');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(true);
      try {
        let successCount = 0;
        // Loop secara serial berurutan agar database SQLite tidak race condition / locked
        for (const step of allSteps) {
          const newTask = {
            naskah_id: Number(finalNaskahId),
            step_name: step,
            status: 'Belum Mulai',
            priority: priority,
            due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
            notes: notes,
            assigned_team_id: assignedTeamId ? Number(assignedTeamId) : undefined,
            pic_name: picName || undefined
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
        if (!naskahId.trim()) {
          showToast('Pilih naskah terlebih dahulu!', 'error');
          return;
        }
        if (!stepName.trim()) {
          showToast('Nama langkah (tahap tugas) tidak boleh kosong!', 'error');
          return;
        }
        setIsSubmitting(true);
        try {
          const taskToEdit = tasks.find(t => t.id === selectedTaskId);
          if (taskToEdit) {
            const updatedTask: Task = {
              ...taskToEdit,
              naskah_id: Number(naskahId),
              step_name: stepName.trim(),
              assigned_team_id: assignedTeamId ? Number(assignedTeamId) : undefined,
              pic_name: picName || undefined,
              due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
              priority,
              status,
              notes
            };
            await updateTask(updatedTask);
            showToast('Tugas berhasil diperbarui!', 'success');
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
          <AccordionSection index={1} title={isEdit ? "📝 Detail Tugas" : "➕ Tambah Tugas"} expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
                {/* Kolom Kiri: Identitas Pelanggan dan Naskah/Pesanan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <SmartRelationField
                    label="Pelanggan / Penulis (Relasi CRM)"
                    options={penulisOptions}
                    value={selectedCustomerId}
                    onChange={(val) => setSelectedCustomerId(val)}
                    placeholder="Cari pelanggan..."
                    emptyMessage="Tidak ada pelanggan yang cocok"
                    entityLabel="Penulis"
                    fullWidth
                    allowCreate={false}
                  />

                  {!isEdit && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                        Metode Input Pesanan
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setInputMode('naskah')}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: inputMode === 'naskah' ? 'var(--accent)' : 'var(--bg-panel)',
                            color: inputMode === 'naskah' ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          📚 Cari Naskah
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputMode('pesanan')}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            background: inputMode === 'pesanan' ? 'var(--accent)' : 'var(--bg-panel)',
                            color: inputMode === 'pesanan' ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          ✍️ Tulis Judul
                        </button>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'start', opacity: 0.85 }}>
                        <span>ℹ️</span>
                        <span>Agar data terdokumentasi dengan baik, maka disarankan menggunakan mode <strong>Cari Naskah</strong> agar spesifikasi buku tetap tercatat lengkap.</span>
                      </div>
                    </div>
                  )}

                  {(isEdit || inputMode === 'naskah') ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
                      <div style={{ flex: 1 }}>
                        <SmartRelationField
                          label="Pilih Naskah"
                          options={filteredNaskahOptions}
                          value={naskahId}
                          onChange={(val) => setNaskahId(val)}
                          placeholder="Cari judul naskah..."
                          emptyMessage="Belum ada naskah. Klik '+ Naskah Baru'."
                          entityLabel="Naskah"
                          fullWidth
                          renderCreateForm={({ onSave, onCancel }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <input
                                type="text"
                                placeholder="Judul naskah"
                                value={naskahCreateForm.title}
                                onChange={(e) => setNaskahCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                              />
                              <Select
                                label="Penulis"
                                options={[{ value: '', label: '-- Pilih Penulis --' }, ...penulisOptions]}
                                value={naskahCreateForm.penulis_id}
                                onChange={(e) => setNaskahCreateForm((prev) => ({ ...prev, penulis_id: e.target.value }))}
                                fullWidth
                              />
                              <input
                                type="number"
                                placeholder="Jumlah cetak"
                                value={naskahCreateForm.copies || ''}
                                onChange={(e) => setNaskahCreateForm((prev) => ({ ...prev, copies: Number(e.target.value) || 0 }))}
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                              />
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" type="button" onClick={onCancel}>Batal</button>
                                <button className="btn-primary" type="button" onClick={() => createNaskahFromTask(onSave)}>Simpan</button>
                              </div>
                            </div>
                          )}
                          duplicateWarning={naskahDuplicateWarning}
                          onSelectExisting={(val) => {
                            setNaskahId(val);
                            setNaskahDuplicateWarning(null);
                          }}
                          onConfirmCreateAnyway={() => createNaskahFromTask(() => {})}
                        />
                      </div>
                    </div>
                  ) : (
                    <TextField
                      label="Judul Pesanan"
                      placeholder="Ketik judul pesanan langsung..."
                      value={judulPesananInput}
                      onChange={e => setJudulPesananInput(e.target.value)}
                      required
                      fullWidth
                    />
                  )}
                </div>

                {/* Kolom Kanan: Checklist Tugas Produksi (Add) ATAU Nama Langkah (Edit) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {isEdit ? (
                    <TextField
                      label="Nama Langkah (Tahap Tugas)"
                      placeholder="Contoh: Penulisan, Desain Cover..."
                      value={stepName}
                      onChange={e => setStepName(e.target.value)}
                      required
                      fullWidth
                    />
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          Tugas Produksi (Pilih beberapa)
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
                      </div>
                      <TextField
                        type="text"
                        label="Tugas Kustom Tambahan (Opsional, pisahkan koma jika banyak)"
                        placeholder="Misal: Review Akhir, Layouting Tambahan"
                        value={customStepsInput}
                        onChange={e => setCustomStepsInput(e.target.value)}
                        fullWidth
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Baris Bawah: Penanggung Jawab dan Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <SmartRelationField
                  label="Penanggung Jawab (PJ)"
                  options={timOptions}
                  value={assignedTeamId}
                  onChange={(val) => {
                    setAssignedTeamId(val);
                    const selected = tim.find(t => t.id === Number(val));
                    if (selected) {
                      setPicName(selected.name);
                    } else {
                      setPicName('');
                    }
                  }}
                  placeholder="Cari anggota tim..."
                  emptyMessage="Tidak ada tim yang cocok"
                  entityLabel="Tim"
                  fullWidth
                  allowCreate={false}
                />
                <DatePicker 
                  label="Deadline" 
                  value={dueDate} 
                  onChange={setDueDate} 
                  fullWidth
                />
              </div>

              {/* Baris Prioritas dan Status */}
              <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <Select
                  label="Prioritas"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  options={priorityOptions}
                  fullWidth
                />
                {isEdit && (
                  <Select
                    label="Status"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    options={statusOptions}
                    fullWidth
                  />
                )}
              </div>

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

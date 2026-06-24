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
  const { showToast, setActiveModule, selectedTaskId, appState, contacts, addContact } = useAppContext();
  const { naskah, addNaskah, tim } = useDataMasterContext();
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

  // SmartRelation quick-create state
  const [naskahCreateForm, setNaskahCreateForm] = useState({ title: '', penulis_id: '', copies: 0 });
  const [naskahDuplicateWarning, setNaskahDuplicateWarning] = useState<{
    matchedOption: SmartRelationOption;
    similarity: number;
    reason: string;
  } | null>(null);

  const [customerCreateForm, setCustomerCreateForm] = useState({
    name: '',
    wa_number: '',
    email: '',
    address: '',
    type: 'both'
  });
  const [customerDuplicateWarning, setCustomerDuplicateWarning] = useState<{
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

  const allNaskahOptions: SmartRelationOption[] = useMemo(() => {
    return naskah.map(n => ({
      value: String(n.id),
      label: `${n.title} (${n.naskah_id_code || `ID: ${n.id}`})`,
      penulis_id: n.penulis_id
    }));
  }, [naskah]);

  const contactOptions: SmartRelationOption[] = useMemo(() => {
    // Deduplicate berdasarkan wa_number atau email untuk cegah duplikat data
    const seen = new Set<string>();
    return contacts
      .filter((c) => {
        // Gunakan kombinasi nama + wa sebagai key dedup
        const key = `${c.name?.toLowerCase().trim()}|${c.wa_number ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((c) => ({
        value: String(c.id),
        label: `${c.name} (${
          c.type === 'both' ? 'Penulis & Pelanggan' :
          c.type === 'penulis' ? 'Penulis' :
          // Handle alias 'customer' = 'pelanggan'
          'Pelanggan'
        })`,
        wa_number: c.wa_number,
        email: c.email,
        isPenulis: c.type === 'penulis' || c.type === 'both',
      }));
  }, [contacts]);

  const penulisOptionsFiltered: SmartRelationOption[] = useMemo(
    () => contactOptions.filter(o => o.isPenulis),
    [contactOptions]
  );

  const timOptions: SmartRelationOption[] = useMemo(
    () => tim.map((t) => ({ value: String(t.id), label: `${t.name} (${t.role})`, role: t.role })),
    [tim]
  );

  const productionSteps = useMemo(() => [
    { value: 'Penulisan', label: 'Penulisan', icon: '✍️', desc: 'Proses menulis naskah' },
    { value: 'Editing', label: 'Editing', icon: '📝', desc: 'Penyuntingan bahasa & ejaan' },
    { value: 'Layouting', label: 'Layouting', icon: '📐', desc: 'Tata letak halaman & naskah' },
    { value: 'Desain Cover', label: 'Desain Cover', icon: '🎨', desc: 'Desain sampul depan & belakang' },
    { value: 'Proofreading', label: 'Proofreading', icon: '🔍', desc: 'Pengecekan akhir cetakan' },
    { value: 'Legalitas', label: 'Legalitas', icon: '⚖️', desc: 'Pengurusan ISBN / QRCBN' },
    { value: 'Cetak', label: 'Cetak', icon: '🖨️', desc: 'Produksi fisik buku & jilid' },
    { value: 'Distribusi', label: 'Distribusi', icon: '🚚', desc: 'Pemasaran & penyaluran buku' }
  ], []);

  const handleSelectAll = () => {
    setSelectedSteps(productionSteps.map(s => s.value));
  };

  const handleClearAll = () => {
    setSelectedSteps([]);
  };

  const handleSelectDefault = () => {
    setSelectedSteps(['Editing', 'Layouting', 'Desain Cover', 'Proofreading', 'Legalitas']);
  };

  const checkNaskahDuplicate = (title: string) => {
    const result = findBestDuplicate(
      { id: undefined, title },
      naskah.map((n) => ({ id: String(n.id), title: n.title })),
      [{ key: 'title', weight: 1, threshold: 0.85 }],
      0.75
    );
    if (result) {
      setNaskahDuplicateWarning({
        matchedOption: allNaskahOptions.find((o) => o.value === result.item.id) || { value: result.item.id, label: result.item.title },
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
      setInputMode('naskah');
      setNaskahDuplicateWarning(null);
      onSuccess();
    } catch (err) {
      console.error('Gagal membuat naskah:', err);
    }
  };

  const checkCustomerDuplicate = (name: string, wa_number?: string, email?: string) => {
    const result = findBestDuplicate(
      { id: undefined, name, wa_number, email },
      contacts.map((c) => ({ id: String(c.id), name: c.name, wa_number: c.wa_number, email: c.email })),
      [
        { key: 'name', weight: 0.6, threshold: 0.85 },
        { key: 'wa_number', weight: 0.25, isPhone: true, threshold: 0.95 },
        { key: 'email', weight: 0.15, threshold: 0.95 },
      ],
      0.7
    );
    if (result) {
      setCustomerDuplicateWarning({
        matchedOption: contactOptions.find((o) => o.value === result.item.id) || { value: result.item.id, label: result.item.name },
        similarity: result.score,
        reason: formatDuplicateReason(result),
      });
      return true;
    }
    setCustomerDuplicateWarning(null);
    return false;
  };

  const createCustomer = async (onSuccess: () => void) => {
    const { name, wa_number, email, address, type } = customerCreateForm;
    if (!name.trim()) return;
    if (!customerDuplicateWarning && checkCustomerDuplicate(name, wa_number, email)) return;
    try {
      const id = await addContact({
        name: name.trim(),
        wa_number: wa_number.trim(),
        email: email.trim(),
        address: address.trim(),
        type: type,
        email_valid: 0,
        wa_valid: 0,
        created_at: new Date().toISOString()
      });
      setSelectedCustomerId(String(id));
      setCustomerDuplicateWarning(null);
      onSuccess();
    } catch (err) {
      console.error('Gagal membuat kontak/pelanggan baru:', err);
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
    }
  }, [isEdit, selectedTaskId, tasks, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit) {
      if (!naskahId.trim()) {
        showToast('Pilih naskah atau daftarkan judul baru terlebih dahulu!', 'error');
        return;
      }
      const finalNaskahId = naskahId;

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 1. BAGIAN ATAS: Pilihan Tugas Produksi (1 Kolom Penuh) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                          Tugas Produksi (Pilih beberapa)
                        </label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--text-secondary)',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            ☑️ Semua
                          </button>
                          <button
                            type="button"
                            onClick={handleSelectDefault}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--text-secondary)',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            ⚙️ Default Alur
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAll}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--text-secondary)',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </div>

                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(2, 1fr)', 
                        gap: '10px',
                        background: 'var(--bg-panel)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '10px', 
                        padding: '12px' 
                      }}>
                        {productionSteps.map(step => {
                          const isChecked = selectedSteps.includes(step.value);
                          return (
                            <div
                              key={step.value}
                              onClick={() => {
                                  if (isChecked) {
                                    setSelectedSteps(selectedSteps.filter(s => s !== step.value));
                                  } else {
                                    setSelectedSteps([...selectedSteps, step.value]);
                                  }
                                }}
                              style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  background: isChecked ? 'var(--bg-card)' : 'rgba(0, 0, 0, 0.02)',
                                  border: isChecked ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                                  boxShadow: isChecked ? '0 4px 12px rgba(192, 28, 28, 0.05)' : 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                  userSelect: 'none'
                                }}
                              onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  if (!isChecked) {
                                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                                    e.currentTarget.style.background = 'var(--bg-card)';
                                  }
                                }}
                              onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  if (!isChecked) {
                                    e.currentTarget.style.borderColor = 'var(--border)';
                                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                                  }
                                }}
                            >
                              <div style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  border: isChecked ? '2px solid var(--accent)' : '2px solid var(--border)',
                                  background: isChecked ? 'var(--accent)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                  flexShrink: 0
                                }}>
                                {isChecked && (
                                  <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                                )}
                              </div>
                              <div style={{ fontSize: '20px', flexShrink: 0 }}>
                                {step.icon}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                                <span style={{ 
                                    fontSize: '13px', 
                                    fontWeight: '600', 
                                    color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    transition: 'color 0.15s ease'
                                  }}>
                                  {step.label}
                                </span>
                                <span style={{ 
                                    fontSize: '11px', 
                                    color: 'var(--text-secondary)', 
                                    opacity: 0.75,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}>
                                  {step.desc}
                                </span>
                              </div>
                            </div>
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

              {/* Divider Pemisah */}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

              {/* 2. BAGIAN BAWAH: Grid 2 Kolom untuk Identitas (Kiri) dan Parameter Pengerjaan (Kanan) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Kolom Kiri: Identitas Pelanggan & Naskah */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                    👤 Identitas Pelanggan & Naskah
                  </h3>

                  <SmartRelationField
                    label="Pelanggan / Penulis (Relasi CRM)"
                    options={contactOptions}
                    value={selectedCustomerId}
                    onChange={(val) => setSelectedCustomerId(val)}
                    placeholder="Cari pelanggan..."
                    emptyMessage="Tidak ada pelanggan yang cocok"
                    entityLabel="Penulis"
                    fullWidth
                    allowCreate={true}
                    renderCreateForm={({ onSave, onCancel }) => (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                          type="text"
                          placeholder="Nama penulis / pelanggan baru"
                          value={customerCreateForm.name}
                          onChange={(e) => setCustomerCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                        />
                        <input
                          type="text"
                          placeholder="Nomor WhatsApp"
                          value={customerCreateForm.wa_number}
                          onChange={(e) => setCustomerCreateForm((prev) => ({ ...prev, wa_number: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={customerCreateForm.email}
                          onChange={(e) => setCustomerCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                        />
                        <input
                          type="text"
                          placeholder="Alamat"
                          value={customerCreateForm.address}
                          onChange={(e) => setCustomerCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                        />
                        <Select
                          label="Tipe Kontak"
                          options={[
                            { value: 'both', label: 'Penulis & Pelanggan' },
                            { value: 'penulis', label: 'Penulis saja' },
                            { value: 'pelanggan', label: 'Pelanggan saja' }
                          ]}
                          value={customerCreateForm.type}
                          onChange={(e) => setCustomerCreateForm((prev) => ({ ...prev, type: e.target.value }))}
                          fullWidth
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" type="button" onClick={onCancel}>Batal</button>
                          <button className="btn-primary" type="button" onClick={() => createCustomer(() => onSave(customerCreateForm))}>Simpan</button>
                        </div>
                      </div>
                    )}
                    duplicateWarning={customerDuplicateWarning}
                    onSelectExisting={(val) => {
                      setSelectedCustomerId(val);
                      setCustomerDuplicateWarning(null);
                    }}
                    onConfirmCreateAnyway={() => createCustomer(() => {})}
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
                                options={[{ value: '', label: '-- Pilih Penulis --' }, ...penulisOptionsFiltered]}
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
                                <button className="btn-primary" type="button" onClick={() => createNaskahFromTask(() => onSave(naskahCreateForm))}>Simpan</button>
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
                    <SmartRelationField
                      label="Judul Pesanan"
                      options={allNaskahOptions}
                      value={naskahId}
                      onChange={(val, opt) => {
                        setNaskahId(val);
                        if (opt && opt.penulis_id) {
                          setSelectedCustomerId(String(opt.penulis_id));
                        }
                        setInputMode('naskah');
                        showToast(`Menggunakan naskah: ${opt ? opt.label : val}`, 'info');
                      }}
                      placeholder="Cari naskah atau ketik judul pesanan baru..."
                      emptyMessage="Judul baru (klik '+ Judul Baru' untuk mendaftarkan naskah)"
                      entityLabel="Judul"
                      fullWidth
                      allowCreate={true}
                      renderCreateForm={({ onSave, onCancel }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <input
                            type="text"
                            placeholder="Judul pesanan baru"
                            value={naskahCreateForm.title}
                            onChange={(e) => setNaskahCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                          />
                          <Select
                            label="Penulis / Pelanggan"
                            options={[{ value: '', label: '-- Pilih Penulis --' }, ...contactOptions]}
                            value={naskahCreateForm.penulis_id || selectedCustomerId}
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
                            <button className="btn-primary" type="button" onClick={() => createNaskahFromTask(() => onSave(naskahCreateForm))}>Simpan</button>
                          </div>
                        </div>
                      )}
                      duplicateWarning={naskahDuplicateWarning}
                      onSelectExisting={(val) => {
                        setNaskahId(val);
                        const opt = allNaskahOptions.find(o => o.value === val);
                        if (opt && opt.penulis_id) {
                          setSelectedCustomerId(String(opt.penulis_id));
                        }
                        setInputMode('naskah');
                        setNaskahDuplicateWarning(null);
                      }}
                      onConfirmCreateAnyway={() => createNaskahFromTask(() => {})}
                    />
                  )}
                </div>

                {/* Kolom Kanan: Parameter Pengerjaan & Catatan */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                    ⚙️ Parameter Pengerjaan & Detail
                  </h3>

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
                    style={{ height: '90px' }}
                    fullWidth
                  />
                </div>
              </div>
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

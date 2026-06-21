import React, { useState, useEffect } from 'react';
import { Tim } from '../../types/data-master.types';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface TimFormProps {
  initialData?: Tim | null;
  onSubmit: (data: Omit<Tim, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const TimForm: React.FC<TimFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { showToast } = useAppContext();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Layouter');
  const [department, setDepartment] = useState('Produksi');
  const [isActive, setIsActive] = useState(1);
  const [notes, setNotes] = useState('');

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setDepartment(initialData.department || 'Produksi');
      setIsActive(initialData.is_active);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setRole('Layouter');
      setDepartment('Produksi');
      setIsActive(1);
      setNotes('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama anggota tim tidak boleh kosong!', 'error');
      return;
    }

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      role,
      department,
      is_active: isActive,
      notes: notes.trim() || undefined,
    });
  };

  // Opsi peran mencakup seluruh tim produksi penerbitan
  const roleOptions = [
    { value: 'Layouter', label: '🎨 Layouter' },
    { value: 'Desainer Cover', label: '🖼️ Desainer Cover' },
    { value: 'Editor Naskah', label: '✏️ Editor Naskah' },
    { value: 'Proofreader', label: '🔍 Proofreader' },
    { value: 'Manajer Produksi', label: '📋 Manajer Produksi' },
    { value: 'Marketing', label: '📢 Marketing' },
    { value: 'Keuangan', label: '💰 Keuangan' },
    { value: 'Admin', label: '🗂️ Admin' },
    { value: 'Fotografer', label: '📷 Fotografer' },
    { value: 'Illustrator', label: '✏️ Illustrator' },
  ];

  const departmentOptions = [
    { value: 'Produksi', label: 'Produksi' },
    { value: 'Editorial', label: 'Editorial' },
    { value: 'Desain', label: 'Desain' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Keuangan', label: 'Keuangan' },
    { value: 'Administrasi', label: 'Administrasi' },
  ];

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Profil Anggota Tim' : '👤 Tambah Anggota Tim Baru'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="👥 Profil Anggota Tim" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Nama Lengkap"
                placeholder="Contoh: Hana Salsabila"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Select
                  label="Peran / Jabatan"
                  options={roleOptions}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  fullWidth
                />

                <Select
                  label="Divisi / Departemen"
                  options={departmentOptions}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  fullWidth
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={isActive === 1}
                    onChange={(e) => setIsActive(e.target.checked ? 1 : 0)}
                  />
                  Anggota Aktif (Siap Menerima Penugasan)
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Keahlian &amp; Catatan
                </label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    height: '100px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Ahli desain cover novel fantasi, mahir Adobe InDesign..."
                />
              </div>
            </div>
          </AccordionSection>
        </Accordion>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="primary" style={{ flex: 1 }} size="lg">
            💾 Simpan &amp; Catat
          </Button>
          <Button type="button" variant="secondary" style={{ flex: 1 }} size="lg" onClick={onCancel}>
            ❌ Batal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TimForm;

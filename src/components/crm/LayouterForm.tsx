import React, { useState, useEffect } from 'react';
import { Layouter } from '../../types/crm.types';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface LayouterFormProps {
  initialData?: Layouter | null;
  onSubmit: (data: Omit<Layouter, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const LayouterForm: React.FC<LayouterFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { showToast } = useAppContext();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Layouter Utama');
  const [isActive, setIsActive] = useState(1);
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [notes, setNotes] = useState('');

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setIsActive(initialData.is_active);
      setWeeklyTarget(initialData.weekly_target);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setRole('Layouter Utama');
      setIsActive(1);
      setWeeklyTarget(3);
      setNotes('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama layouter tidak boleh kosong!', 'error');
      return;
    }

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      role: role,
      is_active: isActive,
      weekly_target: weeklyTarget,
      notes: notes.trim() || undefined,
    });
  };

  const roleOptions = [
    { value: 'Layouter Utama', label: 'Layouter Utama' },
    { value: 'Desainer Cover', label: 'Desainer Cover' },
    { value: 'Editor/Korektor', label: 'Editor/Korektor' },
    { value: 'Layouter Magang', label: 'Layouter Magang' }
  ];

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Profil Layouter' : 'Pembuat Profil Layouter Baru'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="🎨 Informasi Profil Layouter" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Nama Lengkap Layouter"
                placeholder="Contoh: Hana Salsabila"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Select
                  label="Peran / Jabatan Layouter"
                  options={roleOptions}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Target Kerja Mingguan (Naskah)"
                  type="number"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                  min={0}
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
                  Anggota Aktif (Siap Menerima Tugas Layout/Desain)
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Keahlian Spesialis & Catatan
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
            💾 Simpan & Catat
          </Button>
          <Button type="button" variant="secondary" style={{ flex: 1 }} size="lg" onClick={onCancel}>
            ❌ Batal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LayouterForm;

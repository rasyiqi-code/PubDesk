import React, { useState, useEffect } from 'react';
import { Layouter } from '../../types/crm.types';

interface LayouterFormProps {
  initialData?: Layouter | null;
  onSubmit: (data: Omit<Layouter, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const LayouterForm: React.FC<LayouterFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Layouter Utama');
  const [isActive, setIsActive] = useState(1);
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [notes, setNotes] = useState('');

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
    if (!name.trim()) return;

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      role: role,
      is_active: isActive,
      weekly_target: weeklyTarget,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Anggota Layouter' : '🎨 Tambah Anggota Layouter Baru'}
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Nama Lengkap Layouter <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="Masukkan nama layouter..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Peran / Jabatan
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="Layouter Utama">Layouter Utama</option>
              <option value="Desainer Cover">Desainer Cover</option>
              <option value="Editor/Korektor">Editor/Korektor</option>
              <option value="Layouter Magang">Layouter Magang</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Target Mingguan (Naskah)
            </label>
            <input
              type="number"
              value={weeklyTarget}
              onChange={(e) => setWeeklyTarget(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              min={0}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={isActive === 1}
              onChange={(e) => setIsActive(e.target.checked ? 1 : 0)}
            />
            Anggota Aktif (Dapat Menerima Projek Naskah)
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Catatan Tambahan
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Keahlian khusus, ketersediaan, atau catatan tim..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}>
            💾 Simpan Data
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}>
            ❌ Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default LayouterForm;

import React, { useState } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { Layouter } from '../../types/crm.types';
import LayouterForm from './LayouterForm';

const LayouterManager: React.FC = () => {
  const { layouters, addLayouter, updateLayouter, deleteLayouter } = useCrmContext();
  const [isEditing, setIsEditing] = useState(false);
  const [currentLayouter, setCurrentLayouter] = useState<Layouter | null>(null);

  // State search
  const [search, setSearch] = useState('');

  // Filter layouters
  const filteredLayouters = layouters.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNew = () => {
    setCurrentLayouter(null);
    setIsEditing(true);
  };

  const handleEdit = (l: Layouter) => {
    setCurrentLayouter(l);
    setIsEditing(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Apakah Anda yakin ingin menghapus layouter ini?')) {
      await deleteLayouter(id);
    }
  };

  const handleFormSubmit = async (data: Omit<Layouter, 'created_at' | 'id'> & { id?: number }) => {
    if (data.id) {
      // Update
      const original = layouters.find((l) => l.id === data.id);
      if (original) {
        await updateLayouter({
          ...original,
          ...data,
        } as Layouter);
      }
    } else {
      // Add
      await addLayouter(data as Omit<Layouter, 'created_at'>);
    }
    setIsEditing(false);
    setCurrentLayouter(null);
  };

  if (isEditing) {
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
        <LayouterForm
          initialData={currentLayouter}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsEditing(false);
            setCurrentLayouter(null);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            🎨 Tim Layouter
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Kelola tim layouter produksi, atur peran kerja, dan pantau performa mingguan.
          </p>
        </div>
        <button className="btn-primary" onClick={handleAddNew} style={{ padding: '10px 18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>➕ Tambah Layouter</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        background: 'var(--bg-card)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        marginBottom: '20px'
      }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Cari nama layouter atau peran/spesialisasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Grid List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filteredLayouters.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            Belum ada anggota tim layouter yang sesuai.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredLayouters.map((l) => (
              <div key={l.id} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'relative'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                      {l.name}
                    </h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: '600',
                      background: l.is_active === 1 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      color: l.is_active === 1 ? '#22c55e' : '#9ca3af',
                      border: l.is_active === 1 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)'
                    }}>
                      {l.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Peran: <strong>{l.role}</strong>
                  </p>

                  <div style={{ marginTop: '14px', background: 'var(--bg-main)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', border: '1px solid var(--border)' }}>
                    🎯 Target Mingguan: <strong>{l.weekly_target} naskah</strong>
                  </div>

                  {l.notes && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', fontStyle: 'italic', lineHeight: '1.4' }}>
                      &ldquo;{l.notes}&rdquo;
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                  <button className="btn-secondary" onClick={() => handleEdit(l)} style={{ flex: 1, padding: '6px', fontSize: '12px', textAlign: 'center' }}>
                    ✏️ Edit
                  </button>
                  <button className="btn-secondary" onClick={() => handleDelete(l.id)} style={{ flex: 1, padding: '6px', fontSize: '12px', textAlign: 'center', color: '#ef4444' }}>
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LayouterManager;

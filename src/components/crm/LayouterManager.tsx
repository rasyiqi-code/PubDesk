import React, { useState, useMemo } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { useAppContext } from '../../contexts/AppContext';
import { Layouter } from '../../types/crm.types';
import LayouterForm from './LayouterForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';

const LayouterManager: React.FC = () => {
  const { layouters, addLayouter, updateLayouter, deleteLayouter } = useCrmContext();
  const { showConfirm, showToast } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [currentLayouter, setCurrentLayouter] = useState<Layouter | null>(null);

  // State search
  const [search, setSearch] = useState('');

  // Filter layouters
  const filteredLayouters = useMemo(() => {
    return layouters.filter((l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.role.toLowerCase().includes(search.toLowerCase())
    );
  }, [layouters, search]);

  const handleAddNew = () => {
    setCurrentLayouter(null);
    setIsEditing(true);
  };

  const handleEdit = (l: Layouter, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentLayouter(l);
    setIsEditing(true);
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Layouter',
      message: `Apakah Anda yakin ingin menghapus layouter "${name}" dari tim produksi?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteLayouter(id);
          showToast('Data layouter berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus layouter!', 'error');
        }
      }
    });
  };

  const handleFormSubmit = async (data: Omit<Layouter, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = layouters.find((l) => l.id === data.id);
        if (original) {
          await updateLayouter({
            ...original,
            ...data,
          } as Layouter);
          showToast('Data layouter berhasil diperbarui!', 'success');
        }
      } else {
        await addLayouter(data as Omit<Layouter, 'created_at'>);
        showToast('Layouter baru berhasil ditambahkan!', 'success');
      }
      setIsEditing(false);
      setCurrentLayouter(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data layouter!', 'error');
    }
  };

  if (isEditing) {
    return (
      <LayouterForm
        initialData={currentLayouter}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsEditing(false);
          setCurrentLayouter(null);
        }}
      />
    );
  }

  return (
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      
      {/* Baris Atas: Filter & Tambah */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 16px', 
        borderBottom: '1px solid var(--border)', 
        background: 'var(--bg-panel)', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        {/* Input Pencarian */}
        <div style={{ position: 'relative', width: '280px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama layouter atau peran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '6px 12px 6px 36px', 
              border: '1px solid var(--border)', 
              borderRadius: '20px', 
              fontSize: '12px', 
              background: 'var(--bg-card)', 
              color: 'var(--text-primary)', 
              outline: 'none'
            }}
          />
        </div>

        {/* Tombol Tambah */}
        <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕">
          Tambah Layouter
        </Button>
      </div>

      {/* Tabel Data */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Nama Layouter</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Peran / Spesialisasi</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', userSelect: 'none' }}>Target Mingguan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '20%', userSelect: 'none' }}>Status & Keaktifan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredLayouters.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="🎨"
                message="Tidak ada data layouter"
                description={search ? `Tidak ada hasil untuk pencarian "${search}"` : "Belum ada layouter terdaftar di tim produksi. Klik tombol Tambah Layouter untuk menambahkan anggota baru."}
              />
            ) : (
              filteredLayouters.map((l) => (
                <tr
                  key={l.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <div>{l.name}</div>
                    {l.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400', marginTop: '2px', fontStyle: 'italic' }}>
                        &ldquo;{l.notes}&rdquo;
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {l.role}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    🎯 {l.weekly_target} naskah
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      label={l.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                      variant={l.is_active === 1 ? 'success' : 'neutral'}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleEdit(l, e)}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => l.id && handleDelete(l.id, l.name, e)}
                      >
                        🗑️ Hapus
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LayouterManager;

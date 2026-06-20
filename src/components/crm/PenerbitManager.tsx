import React, { useState, useMemo } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { useAppContext } from '../../contexts/AppContext';
import { Penerbit } from '../../types/crm.types';
import PenerbitForm from './PenerbitForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';

const coopVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'> = {
  'Aktif': 'success',
  'Negosiasi': 'warning',
  'Pasif': 'neutral',
  'Berhenti': 'danger'
};

const PenerbitManager: React.FC = () => {
  const { penerbit, addPenerbit, updatePenerbit, deletePenerbit } = useCrmContext();
  const { showConfirm, showToast } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPenerbit, setCurrentPenerbit] = useState<Penerbit | null>(null);

  // State filter
  const [search, setSearch] = useState('');
  const [coopFilter, setCoopFilter] = useState('');

  // Filter data penerbit
  const filteredPenerbit = useMemo(() => {
    return penerbit.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
        (p.wa_number && p.wa_number.includes(search));
      const matchesCoop = coopFilter ? p.cooperation_status === coopFilter : true;
      return matchesSearch && matchesCoop;
    });
  }, [penerbit, search, coopFilter]);

  const handleAddNew = () => {
    setCurrentPenerbit(null);
    setIsEditing(true);
  };

  const handleEdit = (p: Penerbit, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPenerbit(p);
    setIsEditing(true);
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Penerbit',
      message: `Apakah Anda yakin ingin menghapus penerbit "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deletePenerbit(id);
          showToast('Data penerbit berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus penerbit!', 'error');
        }
      }
    });
  };

  const handleFormSubmit = async (data: Omit<Penerbit, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = penerbit.find(p => p.id === data.id);
        if (original) {
          await updatePenerbit({
            ...original,
            ...data,
          } as Penerbit);
          showToast('Data penerbit berhasil diperbarui!', 'success');
        }
      } else {
        await addPenerbit(data as Omit<Penerbit, 'created_at'>);
        showToast('Penerbit baru berhasil ditambahkan!', 'success');
      }
      setIsEditing(false);
      setCurrentPenerbit(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data penerbit!', 'error');
    }
  };

  if (isEditing) {
    return (
      <PenerbitForm
        initialData={currentPenerbit}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsEditing(false);
          setCurrentPenerbit(null);
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Input Pencarian */}
          <div style={{ position: 'relative', width: '250px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama penerbit, kota..."
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

          {/* Filter Status */}
          <select
            value={coopFilter}
            onChange={(e) => setCoopFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              fontSize: '12px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          >
            <option value="">Semua Status Kerja Sama</option>
            <option value="Aktif">Aktif</option>
            <option value="Negosiasi">Dalam Negosiasi</option>
            <option value="Pasif">Pasif</option>
            <option value="Berhenti">Berhenti</option>
          </select>
        </div>

        {/* Tombol Tambah */}
        <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕">
          Tambah Penerbit
        </Button>
      </div>

      {/* Tabel Data */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Nama Penerbit</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Kontak Resmi</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '20%', userSelect: 'none' }}>Sosial Media</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', userSelect: 'none' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPenerbit.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="🏢"
                message="Tidak ada data penerbit"
                description={search ? `Tidak ada hasil untuk pencarian "${search}"` : "Belum ada mitra penerbit terdaftar. Klik tombol Tambah Penerbit untuk memulai kerja sama baru."}
              />
            ) : (
              filteredPenerbit.map((p) => (
                <tr
                  key={p.id}
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
                    <div>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400', marginTop: '2px' }}>
                      📍 Kota: {p.city || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <div>
                      📧 {p.email || '-'} {p.email_valid === 1 && <span title="Email Valid" style={{ color: '#22c55e', marginLeft: '4px' }}>✓</span>}
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      💬 {p.wa_number || '-'} {p.wa_valid === 1 && <span title="WhatsApp Valid" style={{ color: '#22c55e', marginLeft: '4px' }}>✓</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                      {p.instagram && <span>📸 IG: {p.instagram}</span>}
                      {p.facebook && <span>👥 FB: {p.facebook}</span>}
                      {p.linkedin && <span>💼 In: {p.linkedin}</span>}
                      {!p.instagram && !p.facebook && !p.linkedin && <span>-</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      label={p.cooperation_status || 'Aktif'}
                      variant={coopVariantMap[p.cooperation_status || 'Aktif']}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleEdit(p, e)}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => p.id && handleDelete(p.id, p.name, e)}
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

export default PenerbitManager;

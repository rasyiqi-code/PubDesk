import React, { useState, useMemo } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { useAppContext } from '../../contexts/AppContext';
import { Penulis } from '../../types/crm.types';
import PenulisForm from './PenulisForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';

const followupVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'> = {
  'New': 'info',
  'Contacted': 'warning',
  'Interested': 'accent',
  'Deal': 'success',
  'Rejected': 'danger'
};

const PenulisManager: React.FC = () => {
  const { penulis, addPenulis, updatePenulis, deletePenulis } = useCrmContext();
  const { showConfirm, showToast } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPenulis, setCurrentPenulis] = useState<Penulis | null>(null);
  
  // State filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

  // Cari daftar provinsi unik untuk opsi filter
  const uniqueProvinces = useMemo(() => {
    return Array.from(
      new Set(penulis.map((p) => p.province).filter(Boolean))
    ) as string[];
  }, [penulis]);

  // Filter data penulis
  const filteredPenulis = useMemo(() => {
    return penulis.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
        (p.wa_number && p.wa_number.includes(search));
      const matchesStatus = statusFilter ? p.followup_status === statusFilter : true;
      const matchesProvince = provinceFilter ? p.province === provinceFilter : true;
      return matchesSearch && matchesStatus && matchesProvince;
    });
  }, [penulis, search, statusFilter, provinceFilter]);

  const handleAddNew = () => {
    setCurrentPenulis(null);
    setIsEditing(true);
  };

  const handleEdit = (p: Penulis, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPenulis(p);
    setIsEditing(true);
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Penulis',
      message: `Apakah Anda yakin ingin menghapus penulis "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deletePenulis(id);
          showToast('Data penulis berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus penulis!', 'error');
        }
      }
    });
  };

  const handleFormSubmit = async (data: Omit<Penulis, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = penulis.find(p => p.id === data.id);
        if (original) {
          await updatePenulis({
            ...original,
            ...data,
          } as Penulis);
          showToast('Data penulis berhasil diperbarui!', 'success');
        }
      } else {
        await addPenulis(data as Omit<Penulis, 'created_at'>);
        showToast('Penulis baru berhasil ditambahkan!', 'success');
      }
      setIsEditing(false);
      setCurrentPenulis(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data penulis!', 'error');
    }
  };

  if (isEditing) {
    return (
      <PenulisForm
        initialData={currentPenulis}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsEditing(false);
          setCurrentPenulis(null);
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
              placeholder="Cari nama, email, WA..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="">Semua Status Follow-Up</option>
            <option value="New">Baru (New)</option>
            <option value="Contacted">Sudah Dihubungi</option>
            <option value="Interested">Tertarik</option>
            <option value="Deal">Deal (Naskah)</option>
            <option value="Rejected">Menolak</option>
          </select>

          {/* Filter Provinsi */}
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
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
            <option value="">Semua Provinsi</option>
            {uniqueProvinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        {/* Tombol Tambah */}
        <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕">
          Tambah Penulis
        </Button>
      </div>

      {/* Tabel Data */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Nama Penulis</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Kontak</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '20%', userSelect: 'none' }}>Lokasi & Afiliasi</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', userSelect: 'none' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPenulis.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="👤"
                message="Tidak ada data penulis"
                description={search ? `Tidak ada hasil untuk pencarian "${search}"` : "Belum ada penulis terdaftar. Klik tombol Tambah Penulis untuk membuat profil baru."}
              />
            ) : (
              filteredPenulis.map((p) => (
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
                      Pekerjaan: {p.job || '-'}
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
                    <div>{p.city ? `${p.city}, ${p.province || ''}` : p.province || '-'}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{p.institution || '-'}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      label={p.followup_status || 'New'}
                      variant={followupVariantMap[p.followup_status || 'New']}
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

export default PenulisManager;

import React, { useState } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { Penerbit } from '../../types/crm.types';
import PenerbitForm from './PenerbitForm';

const PenerbitManager: React.FC = () => {
  const { penerbit, addPenerbit, updatePenerbit, deletePenerbit } = useCrmContext();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPenerbit, setCurrentPenerbit] = useState<Penerbit | null>(null);

  // State filter
  const [search, setSearch] = useState('');
  const [coopFilter, setCoopFilter] = useState('');

  // Filter data penerbit
  const filteredPenerbit = penerbit.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.wa_number && p.wa_number.includes(search));
    const matchesCoop = coopFilter ? p.cooperation_status === coopFilter : true;
    return matchesSearch && matchesCoop;
  });

  const handleAddNew = () => {
    setCurrentPenerbit(null);
    setIsEditing(true);
  };

  const handleEdit = (p: Penerbit) => {
    setCurrentPenerbit(p);
    setIsEditing(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Apakah Anda yakin ingin menghapus penerbit ini?')) {
      await deletePenerbit(id);
    }
  };

  const handleFormSubmit = async (data: Omit<Penerbit, 'created_at' | 'id'> & { id?: number }) => {
    if (data.id) {
      // Update
      const original = penerbit.find(p => p.id === data.id);
      if (original) {
        await updatePenerbit({
          ...original,
          ...data,
        } as Penerbit);
      }
    } else {
      // Add
      await addPenerbit(data as Omit<Penerbit, 'created_at'>);
    }
    setIsEditing(false);
    setCurrentPenerbit(null);
  };

  const getCoopBadgeStyle = (status?: string) => {
    switch (status) {
      case 'Aktif':
        return { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'Negosiasi':
        return { background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'Pasif':
        return { background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.3)' };
      case 'Berhenti':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
    }
  };

  if (isEditing) {
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
        <PenerbitForm
          initialData={currentPenerbit}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsEditing(false);
            setCurrentPenerbit(null);
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
            🏢 CRM Penerbit
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Kelola data penerbit mitra, jalin kerja sama, dan pantau status kolaborasi.
          </p>
        </div>
        <button className="btn-primary" onClick={handleAddNew} style={{ padding: '10px 18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>➕ Tambah Penerbit</span>
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
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '2 1 200px' }}>
          <input
            type="text"
            placeholder="Cari nama penerbit, kota, email, atau WhatsApp..."
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

        <div style={{ flex: '1 1 150px' }}>
          <select
            value={coopFilter}
            onChange={(e) => setCoopFilter(e.target.value)}
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
          >
            <option value="">Semua Status Kerja Sama</option>
            <option value="Aktif">Aktif</option>
            <option value="Negosiasi">Dalam Negosiasi</option>
            <option value="Pasif">Pasif</option>
            <option value="Berhenti">Berhenti</option>
          </select>
        </div>
      </div>

      {/* Grid/Table List */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {filteredPenerbit.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Belum ada data penerbit yang sesuai.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Nama Penerbit</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Kontak Resmi</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Sosial Media</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPenerbit.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📍 Kota: {p.city || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    <div>
                      📧 {p.email || '-'} {p.email_valid === 1 && <span title="Email Valid" style={{ color: '#22c55e' }}>✓</span>}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      💬 {p.wa_number || '-'} {p.wa_valid === 1 && <span title="WhatsApp Valid" style={{ color: '#22c55e' }}>✓</span>}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                      {p.instagram && <span>📸 Instagram: {p.instagram}</span>}
                      {p.facebook && <span>👥 Facebook: {p.facebook}</span>}
                      {p.linkedin && <span>💼 LinkedIn: {p.linkedin}</span>}
                      {!p.instagram && !p.facebook && !p.linkedin && <span>-</span>}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      ...getCoopBadgeStyle(p.cooperation_status)
                    }}>
                      {p.cooperation_status || 'Aktif'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => handleEdit(p)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        ✏️ Edit
                      </button>
                      <button className="btn-secondary" onClick={() => handleDelete(p.id)} style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444' }}>
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PenerbitManager;

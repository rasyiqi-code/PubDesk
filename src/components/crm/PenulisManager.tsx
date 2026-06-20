import React, { useState } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { Penulis } from '../../types/crm.types';
import PenulisForm from './PenulisForm';

const PenulisManager: React.FC = () => {
  const { penulis, addPenulis, updatePenulis, deletePenulis } = useCrmContext();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPenulis, setCurrentPenulis] = useState<Penulis | null>(null);
  
  // State filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

  // Cari daftar provinsi unik untuk opsi filter
  const uniqueProvinces = Array.from(
    new Set(penulis.map((p) => p.province).filter(Boolean))
  ) as string[];

  // Filter data penulis
  const filteredPenulis = penulis.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
      (p.wa_number && p.wa_number.includes(search));
    const matchesStatus = statusFilter ? p.followup_status === statusFilter : true;
    const matchesProvince = provinceFilter ? p.province === provinceFilter : true;
    return matchesSearch && matchesStatus && matchesProvince;
  });

  const handleAddNew = () => {
    setCurrentPenulis(null);
    setIsEditing(true);
  };

  const handleEdit = (p: Penulis) => {
    setCurrentPenulis(p);
    setIsEditing(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Apakah Anda yakin ingin menghapus penulis ini?')) {
      await deletePenulis(id);
    }
  };

  const handleFormSubmit = async (data: Omit<Penulis, 'created_at' | 'id'> & { id?: number }) => {
    if (data.id) {
      // Update
      const original = penulis.find(p => p.id === data.id);
      if (original) {
        await updatePenulis({
          ...original,
          ...data,
        } as Penulis);
      }
    } else {
      // Add
      await addPenulis(data as Omit<Penulis, 'created_at'>);
    }
    setIsEditing(false);
    setCurrentPenulis(null);
  };

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'New':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'Contacted':
        return { background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'Interested':
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'Deal':
        return { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'Rejected':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
    }
  };

  if (isEditing) {
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
        <PenulisForm
          initialData={currentPenulis}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsEditing(false);
            setCurrentPenulis(null);
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
            👤 CRM Penulis
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Kelola database penulis, pantau prospek naskah, dan tindak lanjut (follow-up).
          </p>
        </div>
        <button className="btn-primary" onClick={handleAddNew} style={{ padding: '10px 18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>➕ Tambah Penulis</span>
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
            placeholder="Cari nama, email, atau nomor WhatsApp..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="">Semua Status Follow-Up</option>
            <option value="New">Baru (New)</option>
            <option value="Contacted">Sudah Dihubungi</option>
            <option value="Interested">Tertarik</option>
            <option value="Deal">Deal</option>
            <option value="Rejected">Menolak</option>
          </select>
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
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
            <option value="">Semua Provinsi</option>
            {uniqueProvinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid/Table List */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {filteredPenulis.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Belum ada data penulis yang sesuai dengan filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Nama Penulis</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Kontak</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Lokasi & Institusi</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPenulis.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '500', color: 'var(--text-primary)' }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Pekerjaan: {p.job || '-'}
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
                    <div>{p.city ? `${p.city}, ${p.province || ''}` : p.province || '-'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {p.institution || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      ...getStatusBadgeStyle(p.followup_status)
                    }}>
                      {p.followup_status || 'New'}
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

export default PenulisManager;

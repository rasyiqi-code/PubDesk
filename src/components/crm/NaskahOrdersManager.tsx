import React, { useState } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { NaskahOrder } from '../../types/crm.types';
import NaskahOrderForm from './NaskahOrderForm';

const NaskahOrdersManager: React.FC = () => {
  const { naskahOrders, penulis, penerbit, addNaskahOrder, updateNaskahOrder, deleteNaskahOrder } = useCrmContext();
  const [isEditing, setIsEditing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<NaskahOrder | null>(null);

  // State filter & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dapatkan nama Penulis berdasarkan ID
  const getPenulisName = (id?: number) => {
    if (!id) return '-';
    const found = penulis.find((p) => p.id === id);
    return found ? found.name : `Penulis #${id}`;
  };

  // Dapatkan nama Penerbit berdasarkan ID
  const getPenerbitName = (id?: number) => {
    if (!id) return '-';
    const found = penerbit.find((p) => p.id === id);
    return found ? found.name : `Penerbit #${id}`;
  };

  // Filter naskah orders
  const filteredOrders = naskahOrders.filter((o) => {
    const writerName = getPenulisName(o.penulis_id).toLowerCase();
    const pubName = getPenerbitName(o.penerbit_id).toLowerCase();
    const matchesSearch = o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.naskah_id_code && o.naskah_id_code.toLowerCase().includes(search.toLowerCase())) ||
      writerName.includes(search.toLowerCase()) ||
      pubName.includes(search.toLowerCase());
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleAddNew = () => {
    setCurrentOrder(null);
    setIsEditing(true);
  };

  const handleEdit = (order: NaskahOrder) => {
    setCurrentOrder(order);
    setIsEditing(true);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Apakah Anda yakin ingin menghapus order naskah ini?')) {
      await deleteNaskahOrder(id);
    }
  };

  const handleFormSubmit = async (data: Omit<NaskahOrder, 'created_at' | 'id'> & { id?: number }) => {
    if (data.id) {
      // Update
      const original = naskahOrders.find((o) => o.id === data.id);
      if (original) {
        await updateNaskahOrder({
          ...original,
          ...data,
        } as NaskahOrder);
      }
    } else {
      // Add
      await addNaskahOrder(data as Omit<NaskahOrder, 'status' | 'created_at'>);
    }
    setIsEditing(false);
    setCurrentOrder(null);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Belum Dimulai':
        return { background: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.3)' };
      case 'Sedang Dikerjakan':
        return { background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)' };
      case 'Selesai':
        return { background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' };
      case 'Batal':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
      default:
        return { background: 'var(--bg-main)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
    }
  };

  if (isEditing) {
    return (
      <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
        <NaskahOrderForm
          initialData={currentOrder}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsEditing(false);
            setCurrentOrder(null);
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
            📚 Naskah & Orders
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Pantau seluruh naskah masuk, status penerbitan, spesifikasi buku, dan timeline produksi.
          </p>
        </div>
        <button className="btn-primary" onClick={handleAddNew} style={{ padding: '10px 18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>➕ Tambah Naskah / Order</span>
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
            placeholder="Cari judul naskah, kode ID, penulis, atau penerbit..."
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
            <option value="">Semua Status Naskah</option>
            <option value="Belum Dimulai">Belum Dimulai</option>
            <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
            <option value="Selesai">Selesai</option>
            <option value="Batal">Batal</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Belum ada data naskah atau order.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Detail Naskah</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Penulis & Penerbit</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Paket & Ukuran</th>
                <th style={{ padding: '16px 20px', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{o.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      🔑 ID Code: {o.naskah_id_code || '-'} | Cetak: {o.copies || 0} eks
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    <div>👤 {getPenulisName(o.penulis_id)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      🏢 {getPenerbitName(o.penerbit_id)}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    <div>📦 {o.package_type || 'Standar'} ({o.order_type || 'Baru'})</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      📐 Ukuran: {o.book_size || '-'} | Legal: {o.legal_type || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      ...getStatusBadgeStyle(o.status)
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => handleEdit(o)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        ✏️ Edit
                      </button>
                      <button className="btn-secondary" onClick={() => handleDelete(o.id)} style={{ padding: '6px 12px', fontSize: '12px', color: '#ef4444' }}>
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

export default NaskahOrdersManager;

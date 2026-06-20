import React, { useState, useMemo } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { useAppContext } from '../../contexts/AppContext';
import { NaskahOrder } from '../../types/crm.types';
import NaskahOrderForm from './NaskahOrderForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';

const orderStatusVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'> = {
  'Belum Dimulai': 'neutral',
  'Sedang Dikerjakan': 'warning',
  'Selesai': 'success',
  'Batal': 'danger'
};

const NaskahOrdersManager: React.FC = () => {
  const { naskahOrders, penulis, penerbit, addNaskahOrder, updateNaskahOrder, deleteNaskahOrder } = useCrmContext();
  const { showConfirm, showToast } = useAppContext();

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
  const filteredOrders = useMemo(() => {
    return naskahOrders.filter((o) => {
      const writerName = getPenulisName(o.penulis_id).toLowerCase();
      const pubName = getPenerbitName(o.penerbit_id).toLowerCase();
      const matchesSearch = o.title.toLowerCase().includes(search.toLowerCase()) ||
        (o.naskah_id_code && o.naskah_id_code.toLowerCase().includes(search.toLowerCase())) ||
        writerName.includes(search.toLowerCase()) ||
        pubName.includes(search.toLowerCase());
      const matchesStatus = statusFilter ? o.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [naskahOrders, search, statusFilter, penulis, penerbit]);

  const handleAddNew = () => {
    setCurrentOrder(null);
    setIsEditing(true);
  };

  const handleEdit = (order: NaskahOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentOrder(order);
    setIsEditing(true);
  };

  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Order Naskah',
      message: `Apakah Anda yakin ingin menghapus order naskah "${title}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteNaskahOrder(id);
          showToast('Data order naskah berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus order naskah!', 'error');
        }
      }
    });
  };

  const handleFormSubmit = async (data: Omit<NaskahOrder, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = naskahOrders.find((o) => o.id === data.id);
        if (original) {
          await updateNaskahOrder({
            ...original,
            ...data,
          } as NaskahOrder);
          showToast('Data order naskah berhasil diperbarui!', 'success');
        }
      } else {
        await addNaskahOrder(data as Omit<NaskahOrder, 'status' | 'created_at'>);
        showToast('Order naskah baru berhasil ditambahkan!', 'success');
      }
      setIsEditing(false);
      setCurrentOrder(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data order naskah!', 'error');
    }
  };

  if (isEditing) {
    return (
      <NaskahOrderForm
        initialData={currentOrder}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsEditing(false);
          setCurrentOrder(null);
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
              placeholder="Cari judul, penulis, penerbit..."
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
            <option value="">Semua Status Naskah</option>
            <option value="Belum Dimulai">Belum Dimulai</option>
            <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
            <option value="Selesai">Selesai</option>
            <option value="Batal">Batal</option>
          </select>
        </div>

        {/* Tombol Tambah */}
        <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕">
          Tambah Naskah / Order
        </Button>
      </div>

      {/* Tabel Data */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '30%', userSelect: 'none' }}>Detail Naskah</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Penulis & Penerbit</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '20%', userSelect: 'none' }}>Paket & Ukuran</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '12%', userSelect: 'none' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '13%', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="📚"
                message="Tidak ada data naskah atau order"
                description={search ? `Tidak ada hasil untuk pencarian "${search}"` : "Belum ada order naskah terdaftar. Tambahkan naskah baru untuk memantau alur produksinya."}
              />
            ) : (
              filteredOrders.map((o) => (
                <tr
                  key={o.id}
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
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: '600' }}>{o.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      ID: {o.naskah_id_code || '-'} | Cetak: {o.copies || 0} eks
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <div>👤 {getPenulisName(o.penulis_id)}</div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>🏢 {getPenerbitName(o.penerbit_id)}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <div>📦 {o.package_type || 'Standar'} ({o.order_type || 'Baru'})</div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>📐 {o.book_size || '-'} | {o.legal_type || '-'}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      label={o.status}
                      variant={orderStatusVariantMap[o.status] || 'neutral'}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleEdit(o, e)}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => o.id && handleDelete(o.id, o.title, e)}
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

export default NaskahOrdersManager;

import React, { useState, useMemo } from 'react';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { Naskah } from '../../types/data-master.types';
import NaskahOrderForm from './NaskahOrderForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';

interface NaskahOrdersManagerProps {
  searchQuery?: string;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'> = {
  'Belum Dimulai': 'neutral',
  'Sedang Dikerjakan': 'warning',
  'Selesai': 'success',
  'Batal': 'danger'
};

const STATUS_LIST = ['Belum Dimulai', 'Sedang Dikerjakan', 'Selesai', 'Batal'];

const NaskahOrdersManager: React.FC<NaskahOrdersManagerProps> = ({ searchQuery = '' }) => {
  const { naskah, penulis, penerbit, addNaskah, updateNaskah, deleteNaskah } = useDataMasterContext();
  const { showConfirm, showToast, setSelectedNaskahId, setRightPanelVisible, addFile, files } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Naskah | null>(null);

  // ID baris yang sedang terseleksi (highlight lokal)
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Filter badge state (bisa multi-pilih status)
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [genreFilter, setGenreFilter] = useState('');

  // Daftar genre unik dari data yang ada
  const genres = useMemo(() => {
    const set = new Set(naskah.map((o) => o.genre).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [naskah]);

  const getPenulisName = (id?: number) => {
    if (!id) return '-';
    const found = penulis.find((p) => p.id === id);
    return found ? found.name : `Penulis #${id}`;
  };

  const getPenerbitName = (id?: number) => {
    if (!id) return '-';
    const found = penerbit.find((p) => p.id === id);
    return found ? found.name : `Penerbit #${id}`;
  };

  // Toggle status badge filter
  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Filter naskah
  const filteredOrders = useMemo(() => {
    return naskah.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        o.title.toLowerCase().includes(q) ||
        (o.naskah_id_code && o.naskah_id_code.toLowerCase().includes(q)) ||
        getPenulisName(o.penulis_id).toLowerCase().includes(q) ||
        getPenerbitName(o.penerbit_id).toLowerCase().includes(q) ||
        (o.genre && o.genre.toLowerCase().includes(q));
      const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(o.status);
      const matchGenre = genreFilter ? o.genre === genreFilter : true;
      return matchSearch && matchStatus && matchGenre;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naskah, searchQuery, activeStatuses, genreFilter, penulis, penerbit]);

  // Hitung per-status untuk badge info
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_LIST.forEach((s) => { counts[s] = 0; });
    naskah.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [naskah]);

  const handleAddNew = () => {
    setCurrentOrder(null);
    setIsEditing(true);
  };

  const handleEdit = (order: Naskah, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentOrder(order);
    setIsEditing(true);
  };

  // Single click — seleksi baris & simpan ke context
  const handleRowClick = (id?: number) => {
    if (id) {
      setSelectedId(id);
      setSelectedNaskahId(id);
    }
  };

  // Double click — buka panel preview kanan
  const handleRowDoubleClick = (id?: number) => {
    if (id) {
      setSelectedId(id);
      setSelectedNaskahId(id);
      setRightPanelVisible(true);
    }
  };

  const handleDelete = (id: number, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Naskah',
      message: `Apakah Anda yakin ingin menghapus naskah "${title}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteNaskah(id);
          showToast('Data naskah berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus naskah!', 'error');
        }
      }
    });
  };

  const registerNaskahFile = async (naskahId: number, naskahData: Naskah) => {
    try {
      const filename = `Naskah-${naskahId}.json`;
      const jsonString = JSON.stringify(naskahData);
      const bytes = new TextEncoder().encode(jsonString);
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'naskah'
      });
      const alreadyExists = files.some(f => f.filename === filename && f.type === 'naskah');
      if (!alreadyExists) {
        await addFile({
          filename,
          path: physicalPath,
          type: 'naskah',
          project_id: undefined,
          version_label: String(naskahId),
          status: 'Tersimpan',
          last_modified: new Date().toISOString(),
          is_readonly: false
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan file naskah:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<Naskah, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = naskah.find((o) => o.id === data.id);
        if (original) {
          await updateNaskah({ ...original, ...data } as Naskah);
          showToast('Data naskah berhasil diperbarui!', 'success');
          await registerNaskahFile(data.id, { ...original, ...data } as Naskah);
        }
      } else {
        const newId = await addNaskah(data as Omit<Naskah, 'status' | 'created_at'>);
        showToast('Naskah baru berhasil ditambahkan!', 'success');
        await registerNaskahFile(newId, { ...data, id: newId } as Naskah);
      }
      setIsEditing(false);
      setCurrentOrder(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data naskah!', 'error');
    }
  };

  if (isEditing) {
    return (
      <NaskahOrderForm
        initialData={currentOrder}
        onSubmit={handleFormSubmit}
        onCancel={() => { setIsEditing(false); setCurrentOrder(null); }}
      />
    );
  }

  const hasActiveFilter = activeStatuses.length > 0 || !!genreFilter || !!searchQuery;

  return (
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>

      <FilterBar>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{filteredOrders.length}</strong>
          {' '}dari{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{naskah.length}</strong>
          {' '}naskah
        </span>

        <FilterDivider />

        <FilterGroup label="🚦 Status:">
          <FilterChip label="Semua" active={activeStatuses.length === 0} onClick={() => setActiveStatuses([])} />
          {STATUS_LIST.map((status) => {
            const variant = statusVariantMap[status] || 'neutral';
            const colorMap: Record<string, string> = { success: '#22c55e', warning: '#e6a817', danger: '#ef4444', info: '#3b82f6' };
            return (
              <FilterChip
                key={status}
                label={`${status} (${statusCounts[status]})`}
                active={activeStatuses.includes(status)}
                inactiveColor={colorMap[variant] ?? undefined}
                onClick={() => toggleStatus(status)}
              />
            );
          })}
        </FilterGroup>

        {genres.length > 0 && (
          <>
            <FilterDivider />
            <FilterGroup label="📂 Genre:">
              <FilterChip label="Semua" active={genreFilter === ''} onClick={() => setGenreFilter('')} />
              {genres.map((g) => (
                <FilterChip key={g} label={g} active={genreFilter === g} onClick={() => setGenreFilter(g)} />
              ))}
            </FilterGroup>
          </>
        )}

        <FilterDivider />

        <FilterGroup label="">
          <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕">
            Tambah Naskah
          </Button>
        </FilterGroup>
      </FilterBar>

      {/* Tabel */}
      <div style={{ flex: 1, overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Judul &amp; Identitas</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Penulis &amp; Penerbit</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Tipe</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Eks</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Ukuran</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Genre</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <TableEmptyState
                colSpan={8}
                icon="📚"
                message="Tidak ada data naskah"
                description={hasActiveFilter ? 'Tidak ada hasil untuk filter yang dipilih.' : 'Belum ada naskah terdaftar. Klik Tambah Naskah untuk menambahkan.'}
              />
            ) : (
              filteredOrders.map((o) => (
                <tr
                  key={o.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedId === o.id ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleRowClick(o.id)}
                  onDoubleClick={() => handleRowDoubleClick(o.id)}
                  onMouseEnter={(e) => {
                    if (selectedId !== o.id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== o.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '600' }}>{o.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {o.naskah_id_code && <span>ID: {o.naskah_id_code}</span>}
                      {o.total_pages && <span style={{ marginLeft: '8px' }}>· {o.total_pages} hlm</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    <div>👤 {getPenulisName(o.penulis_id)}</div>
                    <div style={{ marginTop: '2px' }}>🏢 {getPenerbitName(o.penerbit_id)}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {o.order_type ? (
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(192, 28, 28, 0.08)',
                        color: 'var(--accent)'
                      }}>
                        {o.order_type}
                      </span>
                    ) : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>-</span>}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {o.copies ?? '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {o.book_size || '-'}
                  </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {o.genre ? (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(192, 28, 28, 0.08)',
                        color: 'var(--accent)'
                      }}>
                        {o.genre}
                      </span>
                    ) : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>-</span>}
                  </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <Badge
                      label={o.status}
                      variant={statusVariantMap[o.status] || 'neutral'}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                      <button onClick={(e) => handleEdit(o, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Edit">✏️</button>
                      <button onClick={(e) => o.id && handleDelete(o.id, o.title, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Hapus">🗑️</button>
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

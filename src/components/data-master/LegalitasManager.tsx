import React, { useState, useMemo } from 'react';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { Legalitas } from '../../types/data-master.types';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import LegalitasForm from './LegalitasForm';

interface LegalitasManagerProps {
  searchQuery?: string;
}

const TIPE_LEGALITAS = ['E-ISBN', 'ISBN', 'QRCBN', 'QRSBN', 'HAKI'];

const LegalitasManager: React.FC<LegalitasManagerProps> = ({ searchQuery = '' }) => {
  const { legalitas, naskah, addLegalitas, updateLegalitas, deleteLegalitas } = useDataMasterContext();
  const { showConfirm, showToast, setRightPanelVisible, selectedLegalitasId, setSelectedLegalitasId, addFile, files } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [currentLegalitas, setCurrentLegalitas] = useState<Legalitas | null>(null);

  const [activeTipe, setActiveTipe] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const statuses = useMemo(() => {
    const set = new Set(legalitas.map((l) => l.status).filter(Boolean));
    return Array.from(set).sort();
  }, [legalitas]);

  const toggleTipe = (tipe: string) => {
    setActiveTipe((prev) =>
      prev.includes(tipe) ? prev.filter((t) => t !== tipe) : [...prev, tipe]
    );
  };

  const filteredData = useMemo(() => {
    return legalitas.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        l.judul_buku.toLowerCase().includes(q) ||
        l.nama_penulis.toLowerCase().includes(q);

      const matchTipe = activeTipe.length === 0 || activeTipe.includes(l.tipe);
      const matchStatus = statusFilter ? l.status === statusFilter : true;
      return matchSearch && matchTipe && matchStatus;
    });
  }, [legalitas, searchQuery, activeTipe, statusFilter]);

  const tipeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TIPE_LEGALITAS.forEach((t) => { counts[t] = 0; });
    legalitas.forEach((l) => { if (counts[l.tipe] !== undefined) counts[l.tipe]++; });
    return counts;
  }, [legalitas]);

  const handleAddNew = () => {
    setCurrentLegalitas(null);
    setIsEditing(true);
  };

  const handleEdit = (l: Legalitas, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentLegalitas(l);
    setIsEditing(true);
  };

  const handleRowClick = (id?: number) => {
    if (id) {
      setSelectedLegalitasId(id);
    }
  };

  const handleRowDoubleClick = (id?: number) => {
    if (id) {
      setSelectedLegalitasId(id);
      setRightPanelVisible(true);
    }
  };

  const handleDelete = (id: number, judul: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Legalitas',
      message: `Apakah Anda yakin ingin menghapus data legalitas untuk buku "${judul}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteLegalitas(id);
          showToast('Data legalitas berhasil dihapus', 'success');
          if (selectedLegalitasId === id) {
             setSelectedLegalitasId(null);
          }
        } catch (err) {
          showToast('Gagal menghapus data legalitas', 'error');
        }
      }
    });
  };

  const registerLegalitasFile = async (legalitasId: number, legalitasData: Legalitas) => {
    try {
      const filename = `Legalitas-${legalitasId}.json`;
      const jsonString = JSON.stringify(legalitasData);
      const bytes = new TextEncoder().encode(jsonString);
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'legalitas'
      });
      const alreadyExists = files.some(f => f.filename === filename && f.type === 'legalitas');
      if (!alreadyExists) {
        await addFile({
          filename,
          path: physicalPath,
          type: 'legalitas',
          project_id: undefined,
          version_label: String(legalitasId),
          status: 'Tersimpan',
          last_modified: new Date().toISOString(),
          is_readonly: false
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan file legalitas:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<Legalitas, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        await updateLegalitas(data as Legalitas);
        showToast('Data legalitas berhasil diperbarui', 'success');
        await registerLegalitasFile(data.id, data as Legalitas);
      } else {
        const newId = await addLegalitas(data);
        showToast('Data legalitas berhasil ditambahkan', 'success');
        await registerLegalitasFile(newId, { ...data, id: newId } as Legalitas);
      }
      setIsEditing(false);
      setCurrentLegalitas(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data legalitas', 'error');
    }
  };

  const formatTanggal = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  if (isEditing) {
    return (
      <LegalitasForm
        initialData={currentLegalitas}
        onSubmit={handleFormSubmit}
        onCancel={() => { setIsEditing(false); setCurrentLegalitas(null); }}
      />
    );
  }

  const hasActiveFilter = activeTipe.length > 0 || statusFilter !== '' || searchQuery !== '';

  return (
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>

      <FilterBar>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
          ⚖️ <strong style={{ color: 'var(--text-primary)' }}>{filteredData.length}</strong> pengajuan
        </span>

        <FilterDivider />

        <FilterGroup label="📄 Tipe:">
          <FilterChip label="Semua" active={activeTipe.length === 0} onClick={() => setActiveTipe([])} />
          {TIPE_LEGALITAS.map((t) => (
            <FilterChip
              key={t}
              label={`${t} (${tipeCounts[t] || 0})`}
              active={activeTipe.includes(t)}
              onClick={() => toggleTipe(t)}
            />
          ))}
        </FilterGroup>

        <FilterDivider />

        <FilterGroup label="📋 Status:">
          <FilterChip label="Semua" active={statusFilter === ''} onClick={() => setStatusFilter('')} />
          {statuses.map((s) => (
            <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </FilterGroup>

        <FilterDivider />

        <FilterGroup label="">
          <Button variant="primary" size="sm" onClick={handleAddNew} icon="➕">
            Tambah Pengajuan
          </Button>
        </FilterGroup>
      </FilterBar>

      {/* Tabel */}
      <div style={{ flex: 1, overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>No.</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Judul Buku</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Penulis</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Naskah</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Tipe</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Tgl Pengajuan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <TableEmptyState
                colSpan={8}
                icon="⚖️"
                message="Tidak ada data legalitas"
                description={hasActiveFilter ? 'Tidak ada hasil untuk filter yang dipilih.' : 'Belum ada pengajuan legalitas terdaftar. Klik Tambah Pengajuan untuk memulai.'}
              />
            ) : (
              filteredData.map((l, index) => (
                <tr
                  key={l.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedLegalitasId === l.id ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleRowClick(l.id)}
                  onDoubleClick={() => handleRowDoubleClick(l.id)}
                  onMouseEnter={(e) => {
                    if (selectedLegalitasId !== l.id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLegalitasId !== l.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    <div style={{ wordBreak: 'break-word' }}>{l.judul_buku}</div>
                    {l.keterangan && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400', marginTop: '2px', fontStyle: 'italic' }}>
                        {l.keterangan}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {l.nama_penulis}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {(() => {
                      if (!l.naskah_id) return <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>-</span>;
                      const rel = naskah.find(n => n.id === l.naskah_id);
                      return rel ? (
                        <span title={`ID Naskah: ${l.naskah_id}`}>📄 {rel.title}</span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>Naskah #{l.naskah_id}</span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: 'rgba(192, 28, 28, 0.08)',
                      color: 'var(--accent)'
                    }}>
                      {l.tipe}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    📅 {formatTanggal(l.tanggal_pengajuan || '')}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <Badge
                      label={l.status}
                      variant={l.status === 'Selesai' ? 'success' : l.status === 'Ditolak' ? 'danger' : 'neutral'}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                      <button onClick={(e) => handleEdit(l, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Edit">✏️</button>
                      <button onClick={(e) => l.id && handleDelete(l.id, l.judul_buku, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Hapus">🗑️</button>
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

export default LegalitasManager;

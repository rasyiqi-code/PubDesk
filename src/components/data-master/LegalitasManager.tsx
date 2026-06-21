import React, { useState, useMemo, useEffect } from 'react';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { Legalitas } from '../../types/data-master.types';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import LegalitasForm from './LegalitasForm';
import * as XLSX from 'xlsx';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

interface LegalitasManagerProps {
  searchQuery?: string;
}

const TIPE_LEGALITAS = ['E-ISBN', 'ISBN', 'QRCBN', 'QRSBN', 'HAKI'];

const LegalitasManager: React.FC<LegalitasManagerProps> = ({ searchQuery = '' }) => {
  const { legalitas, naskah, addLegalitas, updateLegalitas, deleteLegalitas } = useDataMasterContext();
  const { 
    showConfirm, 
    showToast, 
    setRightPanelVisible, 
    selectedLegalitasId, 
    setSelectedLegalitasId, 
    addFile, 
    files, 
    registerImportExportActions,
    directAddNewModule,
    setDirectAddNewModule
  } = useAppContext();

  useEffect(() => {
    const actions = {
      onImport: () => document.getElementById('legalitas-excel-import-input')?.click(),
      onExport: handleExportExcel,
      onDownloadTemplate: handleDownloadTemplate
    };
    registerImportExportActions('legalitas', actions);
    return () => {
      registerImportExportActions('legalitas', null);
    };
  }, [legalitas, naskah]);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          showToast('File Excel kosong!', 'error');
          return;
        }

        let importedCount = 0;
        let errorCount = 0;

        for (const row of data) {
          const judul_buku = row["Judul Buku"] || row.Judul || row.judul || row.Title || row.title || row.judul_buku;
          if (!judul_buku) {
            errorCount++;
            continue;
          }

          const nama_penulis = row["Nama Penulis"] || row.Penulis || row.penulis || row.Author || row.author || row.nama_penulis || 'Anonim';
          const tipe = row.Tipe || row.tipe || row.Type || row.type || 'E-ISBN';
          const tanggal_pengajuan = row["Tanggal Pengajuan"] || row.tanggal_pengajuan || row.date || row.Date;
          const keterangan = row.Keterangan || row.keterangan || row.Notes || row.notes;
          const status = row.Status || row.status || 'Diajukan';
          const nomor_dokumen = row["Nomor Dokumen"] || row.nomor_dokumen || row.document_number;

          // Lookup naskah_id if possible
          let naskah_id: number | undefined = undefined;
          const foundNaskah = naskah.find(n => n.title.toLowerCase() === String(judul_buku).trim().toLowerCase());
          if (foundNaskah) {
            naskah_id = foundNaskah.id;
          }

          try {
            await addLegalitas({
              judul_buku: String(judul_buku).trim(),
              nama_penulis: String(nama_penulis).trim(),
              tipe: String(tipe).trim(),
              tanggal_pengajuan: tanggal_pengajuan ? String(tanggal_pengajuan).trim() : undefined,
              keterangan: keterangan ? String(keterangan).trim() : undefined,
              status: String(status).trim(),
              nomor_dokumen: nomor_dokumen ? String(nomor_dokumen).trim() : undefined,
              naskah_id
            });
            importedCount++;
          } catch (err) {
            console.error('Gagal mengimpor legalitas:', err);
            errorCount++;
          }
        }

        showToast(`Impor data legalitas berhasil! ${importedCount} data dimasukkan.${errorCount > 0 ? ` Gagal: ${errorCount}` : ''}`, 'success');
        e.target.value = '';
      } catch (err) {
        console.error(err);
        showToast('Gagal memproses file Excel!', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = async () => {
    try {
      if (legalitas.length === 0) {
        showToast('Tidak ada data legalitas untuk diekspor!', 'info');
        return;
      }

      const exportData = legalitas.map((l, idx) => ({
        "No": idx + 1,
        "Judul Buku": l.judul_buku,
        "Nama Penulis": l.nama_penulis,
        "Tipe": l.tipe,
        "Tanggal Pengajuan": l.tanggal_pengajuan ? l.tanggal_pengajuan.substring(0, 10) : '',
        "Status": l.status,
        "Nomor Dokumen": l.nomor_dokumen || '',
        "Tanggal Keluar": l.tanggal_keluar || '',
        "Rejection Reason": l.rejection_reason || '',
        "Keterangan": l.keterangan || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const maxLens = Object.keys(exportData[0] || {}).map(key => {
        return Math.max(
          key.length,
          ...exportData.map(row => String((row as any)[key] || '').length)
        );
      });
      ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 3, 50) }));

      XLSX.utils.book_append_sheet(wb, ws, "Legalitas");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Legalitas_Export.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Data Legalitas berhasil diekspor!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data legalitas!', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        {
          "Judul Buku": "Fisika Modern",
          "Nama Penulis": "Dr. Albert",
          "Tipe": "ISBN",
          "Tanggal Pengajuan": "2026-06-20",
          "Keterangan": "Pengajuan mendesak untuk akreditasi",
          "Status": "Diajukan",
          "Nomor Dokumen": ""
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      const maxLens = Object.keys(templateData[0] || {}).map(key => {
        return Math.max(
          key.length,
          ...templateData.map(row => String((row as any)[key] || '').length)
        );
      });
      ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 3, 50) }));

      XLSX.utils.book_append_sheet(wb, ws, "Template Legalitas");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Template_Legalitas.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Template Excel Legalitas berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template!', 'error');
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [currentLegalitas, setCurrentLegalitas] = useState<Legalitas | null>(null);

  useEffect(() => {
    if (directAddNewModule === 'legalitas') {
      setCurrentLegalitas(null);
      setIsEditing(true);
      setDirectAddNewModule(null);
    }
  }, [directAddNewModule]);

  const [filterType, setFilterType] = useState<'type' | 'status'>('type');
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
      <input
        type="file"
        id="legalitas-excel-import-input"
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        onChange={handleImportExcel}
      />

      <FilterBar
        actions={
          <Button variant="primary" size="sm" onClick={handleAddNew} icon="➕" />
        }
      >
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
          ⚖️ <strong style={{ color: 'var(--text-primary)' }}>{filteredData.length}</strong> pengajuan
        </span>

        <FilterDivider />

        <FilterGroup label="🔍 FILTER:">
          <FilterChip 
            label="Tipe" 
            active={filterType === 'type'} 
            onClick={() => { setFilterType('type'); setStatusFilter(''); }} 
          />
          <FilterChip 
            label="Status" 
            active={filterType === 'status'} 
            onClick={() => { setFilterType('status'); setActiveTipe([]); }} 
          />
        </FilterGroup>

        {filterType === 'type' && (
          <>
            <FilterDivider />
            <FilterGroup label="📄 TIPE:">
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
          </>
        )}

        {filterType === 'status' && (
          <>
            <FilterDivider />
            <FilterGroup label="📋 STATUS:">
              <FilterChip label="Semua" active={statusFilter === ''} onClick={() => setStatusFilter('')} />
              {statuses.map((s) => (
                <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
              ))}
            </FilterGroup>
          </>
        )}
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

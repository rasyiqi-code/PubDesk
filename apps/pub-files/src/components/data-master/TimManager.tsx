import React, { useState, useMemo, useEffect } from 'react';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { Tim } from '../../types/data-master.types';
import TimForm from './TimForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import * as XLSX from 'xlsx';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

interface TimManagerProps {
  searchQuery?: string;
}

// Format tanggal singkat ke ID locale
const formatTanggal = (isoString: string) => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '-';
  }
};

const TimManager: React.FC<TimManagerProps> = ({ searchQuery = '' }) => {
  const { tim, addTim, updateTim, deleteTim } = useDataMasterContext();
  const { 
    showConfirm, 
    showToast, 
    setSelectedTimId, 
    setRightPanelVisible, 
    addFile, 
    files, 
    registerImportExportActions,
    directAddNewModule,
    setDirectAddNewModule
  } = useAppContext();

  useEffect(() => {
    const actions = {
      onImport: () => document.getElementById('tim-excel-import-input')?.click(),
      onExport: handleExportExcel,
      onDownloadTemplate: handleDownloadTemplate
    };
    registerImportExportActions('tim', actions);
    return () => {
      registerImportExportActions('tim', null);
    };
  }, [tim]);

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
          const name = row.Nama || row.nama || row.Name || row.name || row["Nama Anggota"];
          if (!name) {
            errorCount++;
            continue;
          }

          const role = row.Peran || row.peran || row.Role || row.role || 'Layouter';
          const department = row.Divisi || row.divisi || row.Department || row.department || row.Departemen || row.departemen;
          const weekly_target = parseInt(row["Target Mingguan"] || row.target || row.weekly_target || '0', 10);
          const is_active_str = String(row.Status || row.status || 'Aktif').toLowerCase();
          const is_active = (is_active_str.includes('non') || is_active_str.includes('pasif') || is_active_str === '0') ? 0 : 1;
          const notes = row.Catatan || row.catatan || row.Notes || row.notes;
          const wa_number = row["No WA"] || row["No. WA"] || row.WhatsApp || row.whatsapp || row.wa || row.wa_number || row.Phone || row.phone;
          const email = row.Email || row.email || row.Mail || row.mail;
          const address = row.Alamat || row.alamat || row.Address || row.address;

          try {
            await addTim({
              name: String(name).trim(),
              role: String(role).trim(),
              department: department ? String(department).trim() : undefined,
              is_active,
              weekly_target: isNaN(weekly_target) ? 0 : weekly_target,
              notes: notes ? String(notes).trim() : undefined,
              wa_number: wa_number ? String(wa_number).trim() : undefined,
              email: email ? String(email).trim() : undefined,
              address: address ? String(address).trim() : undefined,
            });
            importedCount++;
          } catch (err) {
            console.error('Gagal mengimpor anggota tim:', err);
            errorCount++;
          }
        }

        showToast(`Impor anggota tim berhasil! ${importedCount} data dimasukkan.${errorCount > 0 ? ` Gagal: ${errorCount}` : ''}`, 'success');
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
      if (tim.length === 0) {
        showToast('Tidak ada anggota tim untuk diekspor!', 'info');
        return;
      }

      const exportData = tim.map((l, idx) => ({
        "No": idx + 1,
        "Nama Anggota": l.name,
        "Peran": l.role,
        "Divisi/Departemen": l.department || '',
        "No WA": l.wa_number || '',
        "Email": l.email || '',
        "Alamat": l.address || '',
        "Target Mingguan": l.weekly_target,
        "Status": l.is_active === 1 ? 'Aktif' : 'Nonaktif',
        "Catatan": l.notes || '',
        "Tanggal Terdaftar": l.created_at ? l.created_at.substring(0, 10) : ''
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

      XLSX.utils.book_append_sheet(wb, ws, "Daftar Tim");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Tim_Export.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Data Anggota Tim berhasil diekspor!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data tim!', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        {
          "Nama Anggota": "Hana Safitri",
          "Peran": "Layouter",
          "Divisi": "Produksi",
          "No WA": "081234567890",
          "Email": "hana@pubdesk.com",
          "Alamat": "Jl. Kebon Agung No. 12, Sleman, Yogyakarta",
          "Target Mingguan": 3,
          "Status": "Aktif",
          "Catatan": "Menguasai Adobe InDesign dan Affinity Publisher"
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

      XLSX.utils.book_append_sheet(wb, ws, "Template Tim");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Template_Tim.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Template Excel Tim berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template!', 'error');
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Tim | null>(null);

  useEffect(() => {
    if (directAddNewModule === 'tim') {
      setCurrentMember(null);
      setActiveStatuses([]);
      setDepartmentFilter('');
      setIsEditing(true);
      setDirectAddNewModule(null);
    }
  }, [directAddNewModule]);

  // ID baris yang sedang terseleksi (highlight lokal)
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Filter state — badge multi-select untuk status
  const [filterType, setFilterType] = useState<'status' | 'department'>('status');
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Daftar departemen unik dari data
  const departments = useMemo(() => {
    const set = new Set(tim.map((l) => l.department).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [tim]);

  // Toggle status badge filter
  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  // Filter anggota tim
  const filteredMembers = useMemo(() => {
    return tim.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q) ||
        (l.department && l.department.toLowerCase().includes(q));

      const statusLabel = l.is_active === 1 ? 'Aktif' : 'Nonaktif';
      const matchStatus = activeStatuses.length === 0 || activeStatuses.includes(statusLabel);
      const matchDept = departmentFilter ? l.department === departmentFilter : true;
      return matchSearch && matchStatus && matchDept;
    });
  }, [tim, searchQuery, activeStatuses, departmentFilter]);

  // Hitung statistik
  const totalAktif = tim.filter((l) => l.is_active === 1).length;
  const totalNonaktif = tim.length - totalAktif;

  const handleAddNew = () => {
    setCurrentMember(null);
    setActiveStatuses([]);
    setDepartmentFilter('');
    setIsEditing(true);
  };

  const handleEdit = (l: Tim, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMember(l);
    setIsEditing(true);
  };

  // Single click — seleksi baris saja
  const handleRowClick = (id?: number) => {
    if (id) {
      setSelectedId(id);
      setSelectedTimId(id);
    }
  };

  // Double click — buka panel preview kanan
  const handleRowDoubleClick = (id?: number) => {
    if (id) {
      setSelectedId(id);
      setSelectedTimId(id);
      setRightPanelVisible(true);
    }
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Anggota Tim',
      message: `Apakah Anda yakin ingin menghapus anggota tim "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteTim(id);
          showToast('Anggota tim berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus anggota tim!', 'error');
        }
      }
    });
  };

  const registerTimFile = async (timId: number, timData: Tim) => {
    try {
      const filename = `Tim-${timId}.json`;
      const jsonString = JSON.stringify(timData);
      const bytes = new TextEncoder().encode(jsonString);
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'tim'
      });
      const alreadyExists = files.some(f => f.filename === filename && f.type === 'tim');
      if (!alreadyExists) {
        await addFile({
          filename,
          path: physicalPath,
          type: 'tim',
          project_id: undefined,
          version_label: String(timId),
          status: 'Tersimpan',
          last_modified: new Date().toISOString(),
          is_readonly: false
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan file tim:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<Tim, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = tim.find((l) => l.id === data.id);
        if (original) {
          await updateTim({ ...original, ...data } as Tim);
          showToast('Data anggota tim berhasil diperbarui!', 'success');
          await registerTimFile(data.id, { ...original, ...data } as Tim);
        }
      } else {
        const newId = await addTim(data as Omit<Tim, 'created_at'>);
        if (!newId) throw new Error('Gagal menyimpan anggota tim');
        showToast('Anggota tim baru berhasil ditambahkan!', 'success');
        await registerTimFile(newId, { ...data, id: newId } as Tim);
      }
      setIsEditing(false);
      setCurrentMember(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data anggota tim!', 'error');
    }
  };

  if (isEditing) {
    return (
      <TimForm
        initialData={currentMember}
        onSubmit={handleFormSubmit}
        onCancel={() => { setIsEditing(false); setCurrentMember(null); }}
      />
    );
  }

  const hasActiveFilter = activeStatuses.length > 0 || !!departmentFilter || !!searchQuery;

  return (
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      <input
        type="file"
        id="tim-excel-import-input"
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        onChange={handleImportExcel}
      />

      <FilterBar
        actions={
          <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕" />
        }
      >
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{filteredMembers.length}</strong>
          {' '}dari{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{tim.length}</strong>
          {' '}anggota
        </span>

        <FilterDivider />

        <FilterGroup label="🔍 FILTER:">
          <FilterChip 
            label="Status" 
            active={filterType === 'status'} 
            onClick={() => { setFilterType('status'); setDepartmentFilter(''); }} 
          />
          {departments.length > 0 && (
            <FilterChip 
              label="Divisi" 
              active={filterType === 'department'} 
              onClick={() => { setFilterType('department'); setActiveStatuses([]); }} 
            />
          )}
        </FilterGroup>

        {filterType === 'status' && (
          <>
            <FilterDivider />
            <FilterGroup label="👤 STATUS:">
              <FilterChip label="Semua" active={activeStatuses.length === 0} onClick={() => setActiveStatuses([])} />
              <FilterChip label={`Aktif (${totalAktif})`} active={activeStatuses.includes('Aktif')} inactiveColor="#22c55e" onClick={() => toggleStatus('Aktif')} />
              <FilterChip label={`Nonaktif (${totalNonaktif})`} active={activeStatuses.includes('Nonaktif')} inactiveColor="var(--text-secondary)" onClick={() => toggleStatus('Nonaktif')} />
            </FilterGroup>
          </>
        )}

        {filterType === 'department' && departments.length > 0 && (
          <>
            <FilterDivider />
            <FilterGroup label="🏢 DIVISI:">
              <FilterChip label="Semua" active={departmentFilter === ''} onClick={() => setDepartmentFilter('')} />
              {departments.map((d) => (
                <FilterChip key={d} label={d} active={departmentFilter === d} onClick={() => setDepartmentFilter(d)} />
              ))}
            </FilterGroup>
          </>
        )}
      </FilterBar>

      {/* Tabel */}
      <div style={{ flex: 1, overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Nama Anggota</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Peran</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Divisi</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>WhatsApp</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Email</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Alamat</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Tanggal Masuk</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>PIN Login</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <TableEmptyState
                colSpan={10}
                icon="👥"
                message="Tidak ada data anggota tim"
                description={hasActiveFilter ? 'Tidak ada hasil untuk filter yang dipilih.' : 'Belum ada anggota tim terdaftar. Klik Tambah Anggota Tim untuk menambahkan.'}
              />
            ) : (
              filteredMembers.map((l) => (
                <tr
                  key={l.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedId === l.id ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleRowClick(l.id)}
                  onDoubleClick={() => handleRowDoubleClick(l.id)}
                  onMouseEnter={(e) => {
                    if (selectedId !== l.id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== l.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    <div>{l.name}</div>
                    {l.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400', marginTop: '2px', fontStyle: 'italic' }}>
                        &ldquo;{l.notes}&rdquo;
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontWeight: '500', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {l.role}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {l.department ? (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(192, 28, 28, 0.08)',
                        color: 'var(--accent)'
                      }}>
                        {l.department}
                      </span>
                    ) : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>-</span>}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {l.wa_number ? (
                      <a
                        href={`https://wa.me/${l.wa_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        💬 {l.wa_number}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {l.email ? (
                      <a
                        href={`mailto:${l.email}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        📧 {l.email}
                      </a>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.address}>
                    {l.address || '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    📅 {formatTanggal(l.created_at)}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <Badge
                      label={l.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                      variant={l.is_active === 1 ? 'success' : 'neutral'}
                    />
                  </td>
                  {/* Kolom status PIN — indikator apakah PIN login sudah di-setup */}
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {l.pin && l.pin.trim().length === 6 ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(34, 197, 94, 0.12)',
                        color: '#16a34a'
                      }}>
                        🔐 Sudah Setup
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'rgba(239, 68, 68, 0.10)',
                        color: '#dc2626'
                      }}>
                        ⚠️ Belum Setup
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                      <button onClick={(e) => handleEdit(l, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Edit">✏️</button>
                      <button onClick={(e) => l.id && handleDelete(l.id, l.name, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Hapus">🗑️</button>
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

export default TimManager;

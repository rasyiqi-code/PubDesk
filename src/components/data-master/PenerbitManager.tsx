import React, { useState, useMemo, useEffect } from 'react';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { Penerbit } from '../../types/data-master.types';
import PenerbitForm from './PenerbitForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge, getStatusVariant } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import { getWhatsAppLink } from '../../utils/format';
import * as XLSX from 'xlsx';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

interface PenerbitManagerProps {
  searchQuery?: string;
}

const PenerbitManager: React.FC<PenerbitManagerProps> = ({ searchQuery = '' }) => {
  const { penerbit, addPenerbit, updatePenerbit, deletePenerbit } = useDataMasterContext();
  const { 
    showConfirm, 
    showToast, 
    selectedPenerbitId, 
    setSelectedPenerbitId, 
    setRightPanelVisible,
    addFile,
    files,
    registerImportExportActions,
    directAddNewModule,
    setDirectAddNewModule
  } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPenerbit, setCurrentPenerbit] = useState<Penerbit | null>(null);

  useEffect(() => {
    if (directAddNewModule === 'penerbit') {
      setCurrentPenerbit(null);
      setIsEditing(true);
      setDirectAddNewModule(null);
    }
  }, [directAddNewModule]);

  // State filter
  const [filterType, setFilterType] = useState<'status'>('status');
  const [coopFilter, setCoopFilter] = useState<'all' | 'Aktif' | 'Negosiasi' | 'Pasif' | 'Berhenti' | 'Internal'>('all');

  // Filter data penerbit
  const filteredPenerbit = useMemo(() => {
    return penerbit.filter((p) => {
      const matchesSearch = searchQuery ? (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city && p.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.province && p.province.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.wa_number && p.wa_number.includes(searchQuery))
      ) : true;
      
      const pStatus = p.cooperation_status || 'Aktif';
      const matchesCoop = coopFilter === 'all' ? true : pStatus === coopFilter;
      return matchesSearch && matchesCoop;
    });
  }, [penerbit, searchQuery, coopFilter]);

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
          if (selectedPenerbitId === id) {
            setSelectedPenerbitId(null);
            setRightPanelVisible(false);
          }
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus penerbit!', 'error');
        }
      }
    });
  };

  const registerPenerbitFile = async (penerbitId: number, penerbitData: Penerbit) => {
    try {
      const filename = `Penerbit-${penerbitId}.json`;
      const jsonString = JSON.stringify(penerbitData);
      const bytes = new TextEncoder().encode(jsonString);
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'penerbit'
      });
      const alreadyExists = files.some(f => f.filename === filename && f.type === 'penerbit');
      if (!alreadyExists) {
        await addFile({
          filename,
          path: physicalPath,
          type: 'penerbit',
          project_id: undefined,
          version_label: String(penerbitId),
          status: 'Tersimpan',
          last_modified: new Date().toISOString(),
          is_readonly: false
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan file penerbit:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<Penerbit, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = penerbit.find(p => p.id === data.id);
        if (original) {
          await updatePenerbit({ ...original, ...data } as Penerbit);
          showToast('Data penerbit berhasil diperbarui!', 'success');
          await registerPenerbitFile(data.id, { ...original, ...data } as Penerbit);
        }
      } else {
        const newId = await addPenerbit(data as Omit<Penerbit, 'created_at'>);
        showToast('Penerbit baru berhasil ditambahkan!', 'success');
        await registerPenerbitFile(newId, { ...data, id: newId } as Penerbit);
      }
      setIsEditing(false);
      setCurrentPenerbit(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data penerbit!', 'error');
    }
  };

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
          const name = row["Nama Penerbit"] || row.Nama || row.nama || row.Name || row.name;
          if (!name) {
            errorCount++;
            continue;
          }

          const city = row.Kota || row.kota || row.City || row.city;
          const province = row.Provinsi || row.provinsi || row.Province || row.province;
          const address = row.Alamat || row.alamat || row.Address || row.address || row["Alamat Kantor"];
          const notes = row.Catatan || row.catatan || row.Notes || row.notes || row["Catatan Kemitraan"];
          const email = row.Email || row.email || row.Mail || row.mail;
          const wa_number = row["No WA"] || row["No. WA"] || row.WhatsApp || row.whatsapp || row.wa || row.wa_number || row.Phone || row.phone;
          const instagram = row.Instagram || row.instagram || row.IG || row.ig;
          const facebook = row.Facebook || row.facebook || row.FB || row.fb;
          const linkedin = row.LinkedIn || row.linkedin || row.Linkedin;
          const twitter = row.Twitter || row.twitter || row.X || row.x;
          const tiktok = row.TikTok || row.tiktok || row.Tiktok;
          const cooperation_status = row.Status || row.status || row["Status Kerja Sama"] || 'Aktif';

          try {
            await addPenerbit({
              name: String(name).trim(),
              city: city ? String(city).trim() : undefined,
              province: province ? String(province).trim() : undefined,
              address: address ? String(address).trim() : undefined,
              notes: notes ? String(notes).trim() : undefined,
              email: email ? String(email).trim() : undefined,
              wa_number: wa_number ? String(wa_number).trim() : undefined,
              instagram: instagram ? String(instagram).trim() : undefined,
              facebook: facebook ? String(facebook).trim() : undefined,
              linkedin: linkedin ? String(linkedin).trim() : undefined,
              twitter: twitter ? String(twitter).trim() : undefined,
              tiktok: tiktok ? String(tiktok).trim() : undefined,
              email_valid: email ? 1 : 0,
              wa_valid: wa_number ? 1 : 0,
              cooperation_status: String(cooperation_status).trim(),
            });
            importedCount++;
          } catch (err) {
            console.error('Gagal mengimpor baris penerbit:', err);
            errorCount++;
          }
        }

        showToast(`Impor berhasil! ${importedCount} data dimasukkan.${errorCount > 0 ? ` Gagal: ${errorCount}` : ''}`, 'success');
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
      if (penerbit.length === 0) {
        showToast('Tidak ada data penerbit untuk diekspor!', 'info');
        return;
      }

      const exportData = penerbit.map((p, idx) => ({
        "No": idx + 1,
        "Nama Penerbit": p.name,
        "Kota": p.city || '',
        "Provinsi": p.province || '',
        "WhatsApp PIC": p.wa_number || '',
        "Email Resmi": p.email || '',
        "Instagram": p.instagram || '',
        "Facebook": p.facebook || '',
        "LinkedIn": p.linkedin || '',
        "TikTok": p.tiktok || '',
        "Alamat Kantor": p.address || '',
        "Status Kerja Sama": p.cooperation_status || 'Aktif',
        "Catatan Kemitraan": p.notes || '',
        "Tanggal Dibuat": p.created_at ? p.created_at.substring(0, 10) : ''
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

      XLSX.utils.book_append_sheet(wb, ws, "Mitra Penerbit");

      const filePath = await save({
        filters: [{
          name: 'Excel Workbook',
          extensions: ['xlsx']
        }],
        defaultPath: 'Mitra_Penerbit_Export.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Data Mitra Penerbit berhasil diekspor ke Excel!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data ke Excel!', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        {
          "Nama Penerbit": "PT. Aksara Nusantara",
          "Kota": "Yogyakarta",
          "Provinsi": "DIY",
          "No WA": "089876543210",
          "Email": "redaksi@aksaranusantara.com",
          "Instagram": "@aksaranusantara",
          "Facebook": "Aksara Nusantara Press",
          "LinkedIn": "aksara-nusantara",
          "TikTok": "@aksaranusantara",
          "Alamat Kantor": "Jl. Ringroad Utara No. 12, Sleman, Yogyakarta",
          "Status Kerja Sama": "Aktif",
          "Catatan Kemitraan": "MoU potongan harga cetak 10% untuk buku pendidikan."
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

      XLSX.utils.book_append_sheet(wb, ws, "Template Mitra Penerbit");

      const filePath = await save({
        filters: [{
          name: 'Excel Workbook',
          extensions: ['xlsx']
        }],
        defaultPath: 'Template_Mitra_Penerbit.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Template Excel Mitra Penerbit berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template Excel!', 'error');
    }
  };

  useEffect(() => {
    const actions = {
      onImport: () => document.getElementById('penerbit-excel-import-input')?.click(),
      onExport: handleExportExcel,
      onDownloadTemplate: handleDownloadTemplate
    };
    registerImportExportActions('penerbit', actions);
    return () => {
      registerImportExportActions('penerbit', null);
    };
  }, [penerbit, handleExportExcel, handleDownloadTemplate]);

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
      
      <FilterBar
        actions={
          <Button
            onClick={handleAddNew}
            variant="primary"
            size="sm"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          />
        }
      >
        <FilterGroup label="🔍 FILTER:">
          <FilterChip 
            label="Status Kerja Sama" 
            active={filterType === 'status'} 
            onClick={() => { setFilterType('status'); setCoopFilter('all'); }} 
          />
        </FilterGroup>

        {filterType === 'status' && (
          <>
            <FilterDivider />
            <FilterGroup label="🤝 STATUS:">
              <FilterChip label={`Semua (${penerbit.length})`} active={coopFilter === 'all'} onClick={() => setCoopFilter('all')} />
              <FilterChip label={`Aktif (${penerbit.filter(p => (p.cooperation_status || 'Aktif') === 'Aktif').length})`} active={coopFilter === 'Aktif'} onClick={() => setCoopFilter('Aktif')} />
              <FilterChip label={`Negosiasi (${penerbit.filter(p => p.cooperation_status === 'Negosiasi').length})`} active={coopFilter === 'Negosiasi'} onClick={() => setCoopFilter('Negosiasi')} />
              <FilterChip label={`Pasif (${penerbit.filter(p => p.cooperation_status === 'Pasif').length})`} active={coopFilter === 'Pasif'} onClick={() => setCoopFilter('Pasif')} />
              <FilterChip label={`Berhenti (${penerbit.filter(p => p.cooperation_status === 'Berhenti').length})`} active={coopFilter === 'Berhenti'} onClick={() => setCoopFilter('Berhenti')} />
              <FilterChip label={`Internal (${penerbit.filter(p => p.cooperation_status === 'Internal').length})`} active={coopFilter === 'Internal'} onClick={() => setCoopFilter('Internal')} />
            </FilterGroup>
          </>
        )}
      </FilterBar>

      {/* Input File Tersembunyi untuk Impor Excel */}
      <input
        type="file"
        id="penerbit-excel-import-input"
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        onChange={handleImportExcel}
      />

      {/* Tabel Data */}
      <div style={{ flex: 1, overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Nama Penerbit</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', color: '#25D366' }}>
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.23-1.371a9.936 9.936 0 0 0 4.78 1.23h.004c5.502 0 9.985-4.479 9.986-9.987A9.99 9.99 0 0 0 12.012 2zm5.823 13.917c-.32.901-1.854 1.76-2.548 1.86-.633.093-1.463.153-4.225-.992-3.528-1.463-5.795-5.066-5.971-5.301-.177-.235-1.428-1.9-1.428-3.621 0-1.721.899-2.569 1.22-2.909.32-.34.698-.425.932-.425h.663c.213 0 .49.081.745.698l1.042 2.531c.085.204.149.442.011.714-.138.273-.208.442-.415.684-.208.243-.438.541-.627.725-.208.204-.425.425-.181.842.244.417 1.082 1.785 2.316 2.884 1.588 1.413 2.923 1.854 3.328 2.054.404.2.643.167.884-.112.243-.279 1.042-1.213 1.32-1.626.276-.412.553-.34.931-.2.378.14 2.404 1.134 2.511 1.189.106.055.176.262.083.524z"/>
                </svg>
                WhatsApp PIC
              </th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Email Resmi</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Sosial Media</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Provinsi / Kota</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Alamat Lengkap</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Catatan Kemitraan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPenerbit.length === 0 ? (
              <TableEmptyState
                colSpan={9}
                icon="🏢"
                message="Tidak ada data penerbit"
                description={searchQuery ? `Tidak ada hasil untuk pencarian "${searchQuery}"` : "Belum ada mitra penerbit terdaftar. Klik tombol Tambah Penerbit untuk memulai kerja sama baru."}
              />
            ) : (
              filteredPenerbit.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    if (p.id !== undefined) {
                      setSelectedPenerbitId(p.id);
                    }
                  }}
                  onDoubleClick={() => {
                    if (p.id !== undefined) {
                      setSelectedPenerbitId(p.id);
                      setRightPanelVisible(true);
                    }
                  }}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedPenerbitId === p.id ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPenerbitId !== p.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPenerbitId !== p.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    <div>{p.name}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.wa_number ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={getWhatsAppLink(p.wa_number)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Klik untuk chat WhatsApp"
                          style={{
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          {p.wa_number} <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
                        </a>
                        <span title={p.wa_valid ? 'WA Valid' : 'WA Tidak Valid'} style={{
                          fontSize: '10px',
                          color: p.wa_valid ? '#16a34a' : 'var(--text-secondary)',
                          opacity: 0.7
                        }}>
                          {p.wa_valid ? '✓' : '?'}
                        </span>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.email ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={`mailto:${p.email}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Klik untuk mengirim email"
                          style={{
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          📧 {p.email} <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
                        </a>
                        <span title={p.email_valid ? 'Email Valid' : 'Email Tidak Valid'} style={{
                          fontSize: '10px',
                          color: p.email_valid ? '#16a34a' : 'var(--text-secondary)',
                          opacity: 0.7
                        }}>
                          {p.email_valid ? '✓' : '?'}
                        </span>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                      {p.instagram && <span>📸 IG: {p.instagram}</span>}
                      {p.facebook && <span>👥 FB: {p.facebook}</span>}
                      {p.linkedin && <span>💼 In: {p.linkedin}</span>}
                      {p.tiktok && <span>🎵 TT: {p.tiktok}</span>}
                      {!p.instagram && !p.facebook && !p.linkedin && !p.tiktok && <span>-</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.city || p.province ? (
                      `${p.city || ''}${p.city && p.province ? ', ' : ''}${p.province || ''}`
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.address}>
                    {p.address || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.notes}>
                    {p.notes || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <Badge
                      label={p.cooperation_status || 'Aktif'}
                      variant={getStatusVariant(p.cooperation_status || 'Aktif')}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                      <button onClick={(e) => handleEdit(p, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Edit">✏️</button>
                      <button onClick={(e) => p.id !== undefined && handleDelete(p.id, p.name, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Hapus">🗑️</button>
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

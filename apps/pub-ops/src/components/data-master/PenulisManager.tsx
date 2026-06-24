import React, { useState, useMemo, useEffect } from 'react';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { Penulis } from '../../types/data-master.types';
import PenulisForm from './PenulisForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge, getStatusVariant } from '../../ui/atoms/Badge';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import { getWhatsAppLink } from '../../utils/format';
import * as XLSX from 'xlsx';
import { invoke } from '@tauri-apps/api/core';
import { save } from '@tauri-apps/plugin-dialog';

interface PenulisManagerProps {
  searchQuery?: string;
}

const PenulisManager: React.FC<PenulisManagerProps> = ({ searchQuery = '' }) => {
  const { penulis, addPenulis, updatePenulis, deletePenulis } = useDataMasterContext();
  const { 
    showConfirm, 
    showToast, 
    contacts, 
    addContact, 
    updateContact, 
    deleteContact, 
    selectedPenulisId, 
    setSelectedPenulisId, 
    setRightPanelVisible, 
    addFile, 
    files, 
    registerImportExportActions,
    directAddNewModule,
    setDirectAddNewModule
  } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPenulis, setCurrentPenulis] = useState<Penulis | null>(null);

  useEffect(() => {
    if (directAddNewModule === 'penulis' || directAddNewModule === 'kontak') {
      setCurrentPenulis(null);
      setStatusFilter('');
      setContactTypeFilter('all');
      setIsEditing(true);
      setDirectAddNewModule(null);
    }
  }, [directAddNewModule]);
  
  // State filter
  const [filterType, setFilterType] = useState<'type' | 'status'>('type');
  const [statusFilter, setStatusFilter] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState<'all' | 'penulis' | 'customer'>('all');

  // Gabungkan data penulis asli dengan kontak pelanggan
  const combinedPenulis = useMemo(() => {
    const list: Penulis[] = penulis.map((p) => {
      const isCustomer = contacts.some(
        (c) =>
          c.type === 'customer' &&
          (c.name.toLowerCase() === p.name.toLowerCase() ||
            (p.wa_number && c.wa_number === p.wa_number))
      );
      return {
        ...p,
        is_customer: isCustomer,
      };
    });

    // Cari pelanggan murni yang belum ada di daftar penulis
    const customerContacts = contacts.filter((c) => c.type === 'customer');
    customerContacts.forEach((c) => {
      const alreadyInPenulis = list.some(
        (p) =>
          p.name.toLowerCase() === c.name.toLowerCase() ||
          (c.wa_number && p.wa_number === c.wa_number)
      );

      if (!alreadyInPenulis) {
        list.push({
          id: -c.id!, // Gunakan id negatif agar unik
          name: c.name,
          email: c.email || '',
          wa_number: c.wa_number || '',
          address: c.address || '',
          job: '',
          institution: '',
          data_source: 'Database Pelanggan',
          email_valid: c.email ? 1 : 0,
          wa_valid: c.wa_number ? 1 : 0,
          followup_status: 'Pelanggan',
          notes: 'Ditampilkan dari data pelanggan',
          created_at: c.created_at,
          is_customer: true,
          is_customer_only: true,
        });
      }
    });

    return list;
  }, [penulis, contacts]);



  // Filter data penulis
  const filteredPenulis = useMemo(() => {
    return combinedPenulis.filter((p) => {
      const matchesSearch = searchQuery ? (
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.wa_number && p.wa_number.includes(searchQuery))
      ) : true;
      const matchesStatus = statusFilter ? p.followup_status === statusFilter : true;
      
      let matchesType = true;
      if (contactTypeFilter === 'penulis') {
        matchesType = !p.is_customer_only;
      } else if (contactTypeFilter === 'customer') {
        matchesType = !!p.is_customer;
      }
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [combinedPenulis, searchQuery, statusFilter, contactTypeFilter]);

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
          const name = row.Nama || row.nama || row.Name || row.name || row["Nama Kontak"] || row["Nama Penulis"];
          if (!name) {
            errorCount++;
            continue;
          }

          const wa_number = row.WA || row.wa || row["No WA"] || row["No. WA"] || row["WhatsApp"] || row["wa_number"] || row.Phone || row.phone;
          const email = row.Email || row.email || row.Mail || row.mail;
          const address = row.Alamat || row.alamat || row.Address || row.address;
          const job = row.Pekerjaan || row.pekerjaan || row.Job || row.job;
          const institution = row.Institusi || row.institusi || row.Institution || row.institution;
          const data_source = row.Sumber || row.sumber || row["Sumber Data"] || row.source;
          const followup_status = row.Status || row.status || row["Status Follow-Up"] || 'New';
          const notes = row.Catatan || row.catatan || row.Notes || row.notes;

          try {
            await addPenulis({
              name: String(name).trim(),
              wa_number: wa_number ? String(wa_number).trim() : undefined,
              email: email ? String(email).trim() : undefined,
              address: address ? String(address).trim() : undefined,
              job: job ? String(job).trim() : undefined,
              institution: institution ? String(institution).trim() : undefined,
              data_source: data_source ? String(data_source).trim() : 'Impor Excel',
              email_valid: email ? 1 : 0,
              wa_valid: wa_number ? 1 : 0,
              followup_status: String(followup_status).trim(),
              notes: notes ? String(notes).trim() : undefined,
            });
            importedCount++;
          } catch (err) {
            console.error('Gagal mengimpor baris penulis:', err);
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
      if (penulis.length === 0) {
        showToast('Tidak ada kontak untuk diekspor!', 'info');
        return;
      }

      const exportData = penulis.map((p, idx) => ({
        "No": idx + 1,
        "Nama Kontak": p.name,
        "WhatsApp": p.wa_number || '',
        "Email": p.email || '',
        "Alamat": p.address || '',
        "Pekerjaan": p.job || '',
        "Institusi": p.institution || '',
        "Sumber Data": p.data_source || '',
        "Status Follow-Up": p.followup_status || 'New',
        "Catatan": p.notes || '',
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

      XLSX.utils.book_append_sheet(wb, ws, "Kontak");

      const filePath = await save({
        filters: [{
          name: 'Excel Workbook',
          extensions: ['xlsx']
        }],
        defaultPath: 'Kontak_Export.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Data kontak berhasil diekspor ke Excel!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data ke Excel!', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        {
          "Nama Kontak": "Budi Santoso",
          "No WA": "081234567890",
          "Email": "budi.santoso@email.com",
          "Alamat": "Jl. Kaliurang Km 5, Sleman, Yogyakarta",
          "Pekerjaan": "Dosen / Penulis",
          "Institusi": "Universitas Gadjah Mada",
          "Sumber Data": "Website",
          "Status": "New",
          "Catatan": "Tertarik menerbitkan buku tentang kecerdasan buatan."
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

      XLSX.utils.book_append_sheet(wb, ws, "Template Kontak");

      const filePath = await save({
        filters: [{
          name: 'Excel Workbook',
          extensions: ['xlsx']
        }],
        defaultPath: 'Template_Kontak.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Template Excel Kontak berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template Excel!', 'error');
    }
  };

  useEffect(() => {
    const actions = {
      onImport: () => document.getElementById('excel-import-input')?.click(),
      onExport: handleExportExcel,
      onDownloadTemplate: handleDownloadTemplate
    };
    registerImportExportActions('kontak', actions);
    registerImportExportActions('penulis', actions);
    return () => {
      registerImportExportActions('kontak', null);
      registerImportExportActions('penulis', null);
    };
  }, [combinedPenulis, contacts, handleExportExcel, handleDownloadTemplate]);

  const handleAddNew = () => {
    setCurrentPenulis(null);
    setStatusFilter('');
    setContactTypeFilter('all');
    setIsEditing(true);
  };

  const handleEdit = (p: Penulis, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPenulis(p);
    setIsEditing(true);
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCustomerOnly = id < 0;
    
    showConfirm({
      title: 'Hapus Pelanggan',
      message: isCustomerOnly 
        ? `Apakah Anda yakin ingin menghapus pelanggan "${name}"?`
        : `Apakah Anda yakin ingin menghapus kontak "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          if (isCustomerOnly) {
            await deleteContact(-id);
            showToast('Data pelanggan berhasil dihapus!', 'success');
          } else {
            await deletePenulis(id);
            showToast('Data kontak berhasil dihapus!', 'success');
          }
        } catch (err) {
          console.error(err);
          showToast(isCustomerOnly ? 'Gagal menghapus pelanggan!' : 'Gagal menghapus kontak!', 'error');
        }
      }
    });
  };

  const registerPenulisFile = async (penulisId: number, penulisData: Penulis) => {
    try {
      const filename = `Penulis-${penulisId}.json`;
      const jsonString = JSON.stringify(penulisData);
      const bytes = new TextEncoder().encode(jsonString);
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'penulis'
      });
      const alreadyExists = files.some(f => f.filename === filename && f.type === 'penulis');
      if (!alreadyExists) {
        await addFile({
          filename,
          path: physicalPath,
          type: 'penulis',
          project_id: undefined,
          version_label: String(penulisId),
          status: 'Tersimpan',
          last_modified: new Date().toISOString(),
          is_readonly: false
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan file penulis:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<Penulis, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id && data.id < 0) {
        const contactId = -data.id;
        const originalContact = contacts.find(c => c.id === contactId);
        if (originalContact) {
          await updateContact({
            ...originalContact,
            name: data.name,
            wa_number: data.wa_number,
            email: data.email,
            address: data.address
          });

          const existingPenulis = penulis.find(p => 
            p.name.toLowerCase() === originalContact.name.toLowerCase() ||
            (originalContact.wa_number && p.wa_number === originalContact.wa_number)
          );

          let penulisId: number | undefined;
          if (existingPenulis) {
            await updatePenulis({
              ...existingPenulis,
              name: data.name,
              email: data.email,
              wa_number: data.wa_number,
              address: data.address,
              job: data.job,
              institution: data.institution,
              notes: data.notes,
              followup_status: data.followup_status || 'Pelanggan',
              email_valid: data.email_valid,
              wa_valid: data.wa_valid,
            });
            penulisId = existingPenulis.id;
          } else {
            const newId = await addPenulis({
              name: data.name,
              email: data.email,
              wa_number: data.wa_number,
              address: data.address,
              job: data.job,
              institution: data.institution,
              notes: data.notes,
              followup_status: data.followup_status || 'Pelanggan',
              email_valid: data.email_valid,
              wa_valid: data.wa_valid,
              data_source: data.data_source || 'Database Pelanggan',
            });
            if (!newId) throw new Error('Gagal menyimpan penulis');
            penulisId = newId;
          }

          showToast('Data pelanggan berhasil diperbarui!', 'success');

          if (penulisId) {
            await registerPenulisFile(penulisId, { ...data, id: penulisId } as Penulis);
          }
        } else {
          showToast('Kontak pelanggan tidak ditemukan!', 'error');
        }
      } else if (data.id) {
        const original = penulis.find(p => p.id === data.id);
        if (original) {
          await updatePenulis({ ...original, ...data } as Penulis);

          const originalContact = contacts.find(c => 
            c.type === 'customer' &&
            (c.name.toLowerCase() === original.name.toLowerCase() ||
              (original.wa_number && c.wa_number === original.wa_number))
          );
          if (originalContact) {
            await updateContact({
              ...originalContact,
              name: data.name,
              wa_number: data.wa_number,
              email: data.email,
              address: data.address
            });
          }

          showToast('Data penulis berhasil diperbarui!', 'success');
          await registerPenulisFile(data.id, { ...original, ...data } as Penulis);
        }
      } else {
        const newId = await addPenulis(data as Omit<Penulis, 'created_at'>);
        if (!newId) throw new Error('Gagal menyimpan penulis');
        showToast('Penulis baru berhasil ditambahkan!', 'success');
        await registerPenulisFile(newId, { ...data, id: newId } as Penulis);
      }
      setIsEditing(false);
      setCurrentPenulis(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data!', 'error');
    }
  };

  const handlePromoteToCustomer = (p: Penulis, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Ubah Data Jadi Pelanggan',
      message: `Apakah Anda yakin data ini akan diubah jadi pelanggan?`,
      confirmText: 'Ya, Promosikan',
      type: 'primary',
      onConfirm: async () => {
        try {
          // Bentuk alamat lengkap dari data instansi dan alamat penulis
          const addressParts = [];
          if (p.institution) addressParts.push(p.institution);
          if (p.address) {
            addressParts.push(p.address);
          }
          const fullAddress = addressParts.join('\n');

          await addContact({
            name: p.name,
            wa_number: p.wa_number || undefined,
            email: p.email || undefined,
            address: fullAddress || undefined,
            type: 'customer',
            created_at: new Date().toISOString()
          });
          showToast(`Penulis "${p.name}" berhasil dipromosikan menjadi Pelanggan!`, 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal mempromosikan penulis menjadi pelanggan!', 'error');
        }
      }
    });
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
            label="Tipe Kontak" 
            active={filterType === 'type'} 
            onClick={() => { setFilterType('type'); setContactTypeFilter('all'); setStatusFilter(''); }} 
          />
          <FilterChip 
            label="Status" 
            active={filterType === 'status'} 
            onClick={() => { setFilterType('status'); setContactTypeFilter('all'); setStatusFilter(''); }} 
          />
        </FilterGroup>

        {filterType === 'type' && (
          <>
            <FilterDivider />
            <FilterGroup label="👤 TIPE KONTAK:">
              <FilterChip label="Semua" active={contactTypeFilter === 'all'} onClick={() => setContactTypeFilter('all')} />
              <FilterChip label={`Penulis (${combinedPenulis.filter(p => !p.is_customer_only).length})`} active={contactTypeFilter === 'penulis'} onClick={() => setContactTypeFilter('penulis')} />
              <FilterChip label={`Pelanggan (${combinedPenulis.filter(p => p.is_customer).length})`} active={contactTypeFilter === 'customer'} onClick={() => setContactTypeFilter('customer')} />
            </FilterGroup>
          </>
        )}

        {filterType === 'status' && (
          <>
            <FilterDivider />
            <FilterGroup label="📋 STATUS:">
              <FilterChip label="Semua" active={statusFilter === ''} onClick={() => setStatusFilter('')} />
              <FilterChip label="Baru (New)" active={statusFilter === 'New'} onClick={() => setStatusFilter('New')} />
              <FilterChip label="Sudah Dihubungi" active={statusFilter === 'Contacted'} onClick={() => setStatusFilter('Contacted')} />
              <FilterChip label="Tertarik" active={statusFilter === 'Interested'} onClick={() => setStatusFilter('Interested')} />
              <FilterChip label="Deal (Naskah)" active={statusFilter === 'Deal'} onClick={() => setStatusFilter('Deal')} />
              <FilterChip label="Menolak" active={statusFilter === 'Rejected'} onClick={() => setStatusFilter('Rejected')} />
              <FilterChip label="🤝 Pelanggan" active={statusFilter === 'Pelanggan'} onClick={() => setStatusFilter('Pelanggan')} />
            </FilterGroup>
          </>
        )}
      </FilterBar>

      {/* Input File Tersembunyi untuk Impor Excel */}
      <input
        type="file"
        id="excel-import-input"
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        onChange={handleImportExcel}
      />

      {/* Tabel Data */}
      <div style={{ flex: 1, overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Nama Kontak</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Pekerjaan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Institusi / Afiliasi</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', color: '#25D366' }}>
                  <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.993L2 22l5.23-1.371a9.936 9.936 0 0 0 4.78 1.23h.004c5.502 0 9.985-4.479 9.986-9.987A9.99 9.99 0 0 0 12.012 2zm5.823 13.917c-.32.901-1.854 1.76-2.548 1.86-.633.093-1.463.153-4.225-.992-3.528-1.463-5.795-5.066-5.971-5.301-.177-.235-1.428-1.9-1.428-3.621 0-1.721.899-2.569 1.22-2.909.32-.34.698-.425.932-.425h.663c.213 0 .49.081.745.698l1.042 2.531c.085.204.149.442.011.714-.138.273-.208.442-.415.684-.208.243-.438.541-.627.725-.208.204-.425.425-.181.842.244.417 1.082 1.785 2.316 2.884 1.588 1.413 2.923 1.854 3.328 2.054.404.2.643.167.884-.112.243-.279 1.042-1.213 1.32-1.626.276-.412.553-.34.931-.2.378.14 2.404 1.134 2.511 1.189.106.055.176.262.083.524z"/>
                </svg>
                WhatsApp
              </th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Email</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Alamat</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Sumber Data</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Catatan Tambahan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPenulis.length === 0 ? (
              <TableEmptyState
                colSpan={10}
                icon="👤"
                message="Tidak ada kontak"
                description={searchQuery ? `Tidak ada hasil untuk pencarian "${searchQuery}"` : "Belum ada kontak terdaftar. Klik tombol Tambah Kontak untuk membuat profil baru."}
              />
            ) : (
              filteredPenulis.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    if (p.id !== undefined) {
                      setSelectedPenulisId(p.id);
                    }
                  }}
                  onDoubleClick={() => {
                    if (p.id !== undefined) {
                      setSelectedPenulisId(p.id);
                      setRightPanelVisible(true);
                    }
                  }}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedPenulisId === p.id ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPenulisId !== p.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPenulisId !== p.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <div>{p.name}</div>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {p.job || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {p.institution || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {p.wa_number ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={getWhatsAppLink(p.wa_number)}
                          target="_blank"
                          rel="noopener noreferrer"
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
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {p.email ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={`mailto:${p.email}`}
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
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {p.address || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {p.data_source || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--text-secondary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.notes}>
                    {p.notes || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.is_customer ? (
                        <span style={{ fontSize: '16px', display: 'inline-flex', padding: '2px 4px' }} title="Pelanggan Terverifikasi">
                          🤝
                        </span>
                      ) : (
                        <>
                          <Badge
                            label={p.followup_status || 'New'}
                            variant={getStatusVariant(p.followup_status || 'New')}
                          />
                          <button
                            onClick={(e) => handlePromoteToCustomer(p, e)}
                            title="Ubah data jadi pelanggan (Promosikan)"
                            style={{ 
                              border: 'none', 
                              background: 'transparent', 
                              cursor: 'pointer', 
                              fontSize: '14px', 
                              padding: '2px 4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'transform 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            🤝
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', textAlign: 'left', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
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

export default PenulisManager;

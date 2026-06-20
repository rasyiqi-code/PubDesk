import React, { useState, useMemo } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { useAppContext } from '../../contexts/AppContext';
import { Penulis } from '../../types/crm.types';
import PenulisForm from './PenulisForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { Badge } from '../../ui/atoms/Badge';
import * as XLSX from 'xlsx';

const getWhatsAppLink = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 0) {
    cleaned = '62' + cleaned;
  }
  return `https://wa.me/${cleaned}`;
};

const followupVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'> = {
  'New': 'info',
  'Contacted': 'warning',
  'Interested': 'accent',
  'Deal': 'success',
  'Rejected': 'danger',
  'Pelanggan': 'success'
};

interface PenulisManagerProps {
  searchQuery?: string;
}

const PenulisManager: React.FC<PenulisManagerProps> = ({ searchQuery = '' }) => {
  const { penulis, addPenulis, updatePenulis, deletePenulis } = useCrmContext();
  const { showConfirm, showToast, contacts, addContact, updateContact, deleteContact, selectedPenulisId, setSelectedPenulisId, setRightPanelVisible } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPenulis, setCurrentPenulis] = useState<Penulis | null>(null);
  
  // State filter
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
          province: '',
          city: '',
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
          const name = row.Nama || row.nama || row.Name || row.name || row["Nama Penulis"];
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

  const handleExportExcel = () => {
    try {
      if (penulis.length === 0) {
        showToast('Tidak ada data penulis untuk diekspor!', 'info');
        return;
      }

      const exportData = penulis.map((p, idx) => ({
        "No": idx + 1,
        "Nama Penulis": p.name,
        "WhatsApp": p.wa_number || '',
        "Email": p.email || '',
        "Alamat": p.address || (p.city ? `${p.city}, ${p.province}` : p.province || ''),
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

      XLSX.utils.book_append_sheet(wb, ws, "Lead Penulis");
      XLSX.writeFile(wb, "Lead_Penulis_Export.xlsx");
      showToast('Data Lead Penulis berhasil diekspor ke Excel!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data ke Excel!', 'error');
    }
  };

  const handleCopyText = (text: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast(`${label} disalin!`, 'success');
  };

  const handleAddNew = () => {
    setCurrentPenulis(null);
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
      title: isCustomerOnly ? 'Hapus Pelanggan' : 'Hapus Penulis',
      message: isCustomerOnly 
        ? `Apakah Anda yakin ingin menghapus pelanggan "${name}"?`
        : `Apakah Anda yakin ingin menghapus penulis "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          if (isCustomerOnly) {
            await deleteContact(-id);
            showToast('Data pelanggan berhasil dihapus!', 'success');
          } else {
            await deletePenulis(id);
            showToast('Data penulis berhasil dihapus!', 'success');
          }
        } catch (err) {
          console.error(err);
          showToast(isCustomerOnly ? 'Gagal menghapus pelanggan!' : 'Gagal menghapus penulis!', 'error');
        }
      }
    });
  };

  const handleFormSubmit = async (data: Omit<Penulis, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id && data.id < 0) {
        const contactId = -data.id;
        const originalContact = contacts.find(c => c.id === contactId);
        if (originalContact) {
          // 1. Sinkronkan rincian kontak utama ke tabel contacts
          await updateContact({
            ...originalContact,
            name: data.name,
            wa_number: data.wa_number,
            email: data.email,
            address: data.address
          });

          // 2. Karena pelanggan murni diedit (dan mungkin memiliki job, institution, notes, followup_status),
          // kita simpan dia ke database Penulis/Lead agar data spesifik CRM ini tersimpan!
          const existingPenulis = penulis.find(p => 
            p.name.toLowerCase() === originalContact.name.toLowerCase() ||
            (originalContact.wa_number && p.wa_number === originalContact.wa_number)
          );

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
          } else {
            await addPenulis({
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
          }

          showToast('Data pelanggan berhasil diperbarui!', 'success');
        } else {
          showToast('Kontak pelanggan tidak ditemukan!', 'error');
        }
      } else if (data.id) {
        const original = penulis.find(p => p.id === data.id);
        if (original) {
          // 1. Perbarui database penulis
          await updatePenulis({
            ...original,
            ...data,
          } as Penulis);

          // 2. Jika penulis ini terhubung sebagai pelanggan, sinkronkan juga ke database kontak
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
        }
      } else {
        await addPenulis(data as Omit<Penulis, 'created_at'>);
        showToast('Penulis baru berhasil ditambahkan!', 'success');
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
          } else if (p.city || p.province) {
            addressParts.push(`${p.city || ''}, ${p.province || ''}`.trim().replace(/^,\s*|,\s*$/, ''));
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
          {/* Tab Filter Tipe Kontak */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(0, 0, 0, 0.2)', 
            padding: '3px', 
            borderRadius: '20px', 
            border: '1px solid var(--border)',
            gap: '2px',
            marginRight: '8px'
          }}>
            {[
              { id: 'all', label: 'Semua', count: combinedPenulis.length },
              { id: 'penulis', label: 'Lead Penulis', count: combinedPenulis.filter(p => !p.is_customer_only).length },
              { id: 'customer', label: 'Pelanggan', count: combinedPenulis.filter(p => p.is_customer).length }
            ].map(tab => {
              const isTabActive = contactTypeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setContactTypeFilter(tab.id as any)}
                  style={{
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: isTabActive ? 'var(--accent)' : 'transparent',
                    color: isTabActive ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    background: isTabActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '9px',
                    color: isTabActive ? '#ffffff' : 'var(--text-secondary)'
                  }}>{tab.count}</span>
                </button>
              );
            })}
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
            <option value="">Semua Status Follow-Up</option>
            <option value="New">Baru (New)</option>
            <option value="Contacted">Sudah Dihubungi</option>
            <option value="Interested">Tertarik</option>
            <option value="Deal">Deal (Naskah)</option>
            <option value="Rejected">Menolak</option>
            <option value="Pelanggan">🤝 Pelanggan</option>
          </select>


        </div>

        {/* Input File Tersembunyi untuk Impor Excel */}
        <input
          type="file"
          id="excel-import-input"
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          onChange={handleImportExcel}
        />

        {/* Tombol Aksi Toolbar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            onClick={() => document.getElementById('excel-import-input')?.click()} 
            variant="secondary" 
            size="sm" 
            icon="📥"
          >
            Impor Excel
          </Button>
          <Button 
            onClick={handleExportExcel} 
            variant="secondary" 
            size="sm" 
            icon="📤"
          >
            Ekspor Excel
          </Button>
          <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕">
            Tambah Penulis
          </Button>
        </div>
      </div>

      {/* Tabel Data */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Nama Penulis</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Pekerjaan</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Institusi / Afiliasi</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>WhatsApp</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Email</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Lokasi / Alamat</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Sumber Data</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Catatan Tambahan</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Status</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', width: '100px', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPenulis.length === 0 ? (
              <TableEmptyState
                colSpan={10}
                icon="👤"
                message="Tidak ada data penulis"
                description={searchQuery ? `Tidak ada hasil untuk pencarian "${searchQuery}"` : "Belum ada penulis terdaftar. Klik tombol Tambah Penulis untuk membuat profil baru."}
              />
            ) : (
              filteredPenulis.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => {
                    if (p.id !== undefined) {
                      setSelectedPenulisId(p.id);
                      setRightPanelVisible(true);
                    }
                  }}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedPenulisId === p.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
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
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <div>{p.name}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.job || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.institution || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.wa_number ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={getWhatsAppLink(p.wa_number)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Klik untuk chat WhatsApp (Click to Chat)"
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
                          💬 {p.wa_number} <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
                        </a>
                        <button
                          onClick={(e) => handleCopyText(p.wa_number!, 'Nomor WhatsApp', e)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}
                          title="Salin WhatsApp"
                        >
                          📋
                        </button>
                        {p.wa_valid === 1 && <span title="WhatsApp Valid" style={{ color: '#22c55e', marginLeft: '2px' }}>✓</span>}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.email ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={`mailto:${p.email}`}
                          title="Klik untuk mengirim email (Click to Send Email)"
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
                        <button
                          onClick={(e) => handleCopyText(p.email!, 'Email', e)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }}
                          title="Salin Email"
                        >
                          📋
                        </button>
                        {p.email_valid === 1 && <span title="Email Valid" style={{ color: '#22c55e', marginLeft: '2px' }}>✓</span>}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {(() => {
                      const resolvedAddress = p.address || (p.city ? `${p.city}, ${p.province || ''}` : p.province || '');
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                          <span style={{ whiteSpace: 'pre-line' }}>{resolvedAddress || '-'}</span>
                          {resolvedAddress && (
                            <button
                              onClick={(e) => handleCopyText(resolvedAddress, 'Alamat', e)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', opacity: 0.6, flexShrink: 0 }}
                              title="Salin Alamat"
                            >
                              📋
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.data_source || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.notes}>
                    {p.notes || '-'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {p.is_customer ? (
                        <span style={{ fontSize: '16px', display: 'inline-flex', padding: '2px 4px' }} title="Pelanggan Terverifikasi">
                          🤝
                        </span>
                      ) : (
                        <>
                          <Badge
                            label={p.followup_status || 'New'}
                            variant={followupVariantMap[p.followup_status || 'New']}
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
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleEdit(p, e)}
                        style={{ padding: '6px 10px' }}
                        title="Edit Profil"
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => p.id !== undefined && handleDelete(p.id, p.name, e)}
                        style={{ padding: '6px 10px' }}
                        title={p.is_customer_only ? "Hapus Pelanggan" : "Hapus Lead"}
                      >
                        🗑️
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

export default PenulisManager;

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

const PenulisManager: React.FC = () => {
  const { penulis, addPenulis, updatePenulis, deletePenulis } = useCrmContext();
  const { showConfirm, showToast, contacts, addContact } = useAppContext();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentPenulis, setCurrentPenulis] = useState<Penulis | null>(null);
  
  // State filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');

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
          job: 'Pelanggan',
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

  // Cari daftar provinsi unik untuk opsi filter
  const uniqueProvinces = useMemo(() => {
    return Array.from(
      new Set(combinedPenulis.map((p) => p.province).filter(Boolean))
    ) as string[];
  }, [combinedPenulis]);

  // Filter data penulis
  const filteredPenulis = useMemo(() => {
    return combinedPenulis.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
        (p.wa_number && p.wa_number.includes(search));
      const matchesStatus = statusFilter ? p.followup_status === statusFilter : true;
      const matchesProvince = provinceFilter ? p.province === provinceFilter : true;
      return matchesSearch && matchesStatus && matchesProvince;
    });
  }, [combinedPenulis, search, statusFilter, provinceFilter]);

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
    showConfirm({
      title: 'Hapus Penulis',
      message: `Apakah Anda yakin ingin menghapus penulis "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deletePenulis(id);
          showToast('Data penulis berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus penulis!', 'error');
        }
      }
    });
  };

  const handleFormSubmit = async (data: Omit<Penulis, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = penulis.find(p => p.id === data.id);
        if (original) {
          await updatePenulis({
            ...original,
            ...data,
          } as Penulis);
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
      showToast('Gagal menyimpan data penulis!', 'error');
    }
  };

  const handlePromoteToCustomer = (p: Penulis, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Promosikan Menjadi Pelanggan',
      message: `Apakah Anda yakin ingin mempromosikan penulis "${p.name}" menjadi pelanggan?`,
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
          {/* Input Pencarian */}
          <div style={{ position: 'relative', width: '250px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '14px' }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama, email, WA..."
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
            <option value="">Semua Status Follow-Up</option>
            <option value="New">Baru (New)</option>
            <option value="Contacted">Sudah Dihubungi</option>
            <option value="Interested">Tertarik</option>
            <option value="Deal">Deal (Naskah)</option>
            <option value="Rejected">Menolak</option>
            <option value="Pelanggan">🤝 Pelanggan</option>
          </select>

          {/* Filter Provinsi */}
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
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
            <option value="">Semua Provinsi</option>
            {uniqueProvinces.map((prov) => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
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
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Nama Penulis</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Kontak</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '20%', userSelect: 'none' }}>Lokasi & Afiliasi</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', userSelect: 'none' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPenulis.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="👤"
                message="Tidak ada data penulis"
                description={search ? `Tidak ada hasil untuk pencarian "${search}"` : "Belum ada penulis terdaftar. Klik tombol Tambah Penulis untuk membuat profil baru."}
              />
            ) : (
              filteredPenulis.map((p) => (
                <tr
                  key={p.id}
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
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <div>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400', marginTop: '2px' }}>
                      Pekerjaan: {p.job || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <div>
                      📧 {p.email || '-'} {p.email_valid === 1 && <span title="Email Valid" style={{ color: '#22c55e', marginLeft: '4px' }}>✓</span>}
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      💬 {p.wa_number ? (
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
                          {p.wa_number} <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
                        </a>
                      ) : '-'} {p.wa_valid === 1 && <span title="WhatsApp Valid" style={{ color: '#22c55e', marginLeft: '4px' }}>✓</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <div style={{ whiteSpace: 'pre-line' }}>{p.address || (p.city ? `${p.city}, ${p.province || ''}` : p.province || '-')}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>{p.institution || '-'}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      label={p.followup_status || 'New'}
                      variant={followupVariantMap[p.followup_status || 'New']}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      {/* Cek apakah penulis sudah menjadi pelanggan */}
                      {p.is_customer ? (
                        <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: '600', padding: '4px 8px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', gap: '4px' }} title="Sudah terdaftar sebagai pelanggan">
                          🤝 Pelanggan
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handlePromoteToCustomer(p, e)}
                          title="Promosikan penulis menjadi Pelanggan"
                          style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--bg-panel)' }}
                        >
                          🤝 Jadi Pelanggan
                        </Button>
                      )}
                      {!p.is_customer_only && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => handleEdit(p, e)}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => p.id && handleDelete(p.id, p.name, e)}
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            🗑️ Hapus
                          </Button>
                        </>
                      )}
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

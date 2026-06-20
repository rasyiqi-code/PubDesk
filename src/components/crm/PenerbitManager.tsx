import React, { useState, useMemo } from 'react';
import { useCrmContext } from '../../contexts/CrmContext';
import { useAppContext } from '../../contexts/AppContext';
import { Penerbit } from '../../types/crm.types';
import PenerbitForm from './PenerbitForm';
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

const coopVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent'> = {
  'Aktif': 'success',
  'Negosiasi': 'warning',
  'Pasif': 'neutral',
  'Berhenti': 'danger'
};

interface PenerbitManagerProps {
  searchQuery?: string;
}

const PenerbitManager: React.FC<PenerbitManagerProps> = ({ searchQuery = '' }) => {
  const { penerbit, addPenerbit, updatePenerbit, deletePenerbit } = useCrmContext();
  const { 
    showConfirm, 
    showToast, 
    selectedPenerbitId, 
    setSelectedPenerbitId, 
    setRightPanelVisible 
  } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPenerbit, setCurrentPenerbit] = useState<Penerbit | null>(null);

  // State filter status kerja sama
  const [coopFilter, setCoopFilter] = useState<'all' | 'Aktif' | 'Negosiasi' | 'Pasif' | 'Berhenti'>('all');

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

  const handleFormSubmit = async (data: Omit<Penerbit, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = penerbit.find(p => p.id === data.id);
        if (original) {
          await updatePenerbit({
            ...original,
            ...data,
          } as Penerbit);
          showToast('Data penerbit berhasil diperbarui!', 'success');
        }
      } else {
        await addPenerbit(data as Omit<Penerbit, 'created_at'>);
        showToast('Penerbit baru berhasil ditambahkan!', 'success');
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

  const handleExportExcel = () => {
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
      XLSX.writeFile(wb, "Mitra_Penerbit_Export.xlsx");
      showToast('Data Mitra Penerbit berhasil diekspor ke Excel!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data ke Excel!', 'error');
    }
  };

  const handleDownloadTemplate = () => {
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
      XLSX.writeFile(wb, "Template_Mitra_Penerbit.xlsx");
      showToast('Template Excel Mitra Penerbit berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template Excel!', 'error');
    }
  };

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
          
          {/* Tab Filter Status Kerja Sama */}
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
              { id: 'all', label: 'Semua', count: penerbit.length },
              { id: 'Aktif', label: 'Aktif', count: penerbit.filter(p => (p.cooperation_status || 'Aktif') === 'Aktif').length },
              { id: 'Negosiasi', label: 'Negosiasi', count: penerbit.filter(p => p.cooperation_status === 'Negosiasi').length },
              { id: 'Pasif', label: 'Pasif', count: penerbit.filter(p => p.cooperation_status === 'Pasif').length },
              { id: 'Berhenti', label: 'Berhenti', count: penerbit.filter(p => p.cooperation_status === 'Berhenti').length }
            ].map(tab => {
              const isTabActive = coopFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCoopFilter(tab.id as any)}
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

        </div>

        {/* Input File Tersembunyi untuk Impor Excel */}
        <input
          type="file"
          id="penerbit-excel-import-input"
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          onChange={handleImportExcel}
        />

        {/* Tombol Aksi Toolbar */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            onClick={handleDownloadTemplate} 
            variant="secondary" 
            size="sm" 
            title="Unduh Template Excel"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
            }
          />
          <Button 
            onClick={() => document.getElementById('penerbit-excel-import-input')?.click()} 
            variant="secondary" 
            size="sm" 
            title="Impor data Penerbit dari Excel"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            }
          />
          <Button 
            onClick={handleExportExcel} 
            variant="secondary" 
            size="sm" 
            title="Ekspor data Penerbit ke Excel"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            }
          />
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
          >
            Tambah Penerbit
          </Button>
        </div>
      </div>

      {/* Tabel Data */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Nama Penerbit</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>WhatsApp PIC</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Email Resmi</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Sosial Media</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Provinsi / Kota</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Alamat Lengkap</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Catatan Kemitraan</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', userSelect: 'none' }}>Status</th>
              <th style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1, padding: '8px 12px', fontWeight: '600', width: '100px', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
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
                      setRightPanelVisible(true);
                    }
                  }}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedPenerbitId === p.id ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
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
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <div>{p.name}</div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.wa_number ? (
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
                        💬 {p.wa_number} <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
                      </a>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {p.email ? (
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
                    ) : '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                      {p.instagram && <span>📸 IG: {p.instagram}</span>}
                      {p.facebook && <span>👥 FB: {p.facebook}</span>}
                      {p.linkedin && <span>💼 In: {p.linkedin}</span>}
                      {p.tiktok && <span>🎵 TT: {p.tiktok}</span>}
                      {!p.instagram && !p.facebook && !p.linkedin && !p.tiktok && <span>-</span>}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
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
                  <td style={{ padding: '10px 12px' }}>
                    <Badge
                      label={p.cooperation_status || 'Aktif'}
                      variant={coopVariantMap[p.cooperation_status || 'Aktif']}
                    />
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
                        title="Hapus Penerbit"
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

export default PenerbitManager;

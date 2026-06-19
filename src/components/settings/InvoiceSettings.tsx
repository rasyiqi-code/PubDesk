import React, { useState, useEffect } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { useAppContext } from '../../contexts/AppContext';
import { InvoiceProfile, InvoiceTableColumn } from '../../types';
import { invoiceTemplates } from '../../data/invoiceTemplates';
import InvoicePreview from '../invoice/InvoicePreview';

const InvoiceSettings: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addOrUpdateProfile,
    deleteProfile,
    resetProfilesToDefault,
    setProfiles
  } = useInvoiceContext();
  const { showToast } = useAppContext();

  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeProfileId);
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);

  // State untuk form input
  const [profileName, setProfileName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [invoiceTitleText, setInvoiceTitleText] = useState('INVOICE');
  const [accentColor, setAccentColor] = useState('#1e70cd');
  const [accentColorDark, setAccentColorDark] = useState('#1e3a8a');
  const [headerBgColor, setHeaderBgColor] = useState('#222933');
  const [headerPrimaryColor, setHeaderPrimaryColor] = useState('#d93838');
  const [headerSecondaryColor, setHeaderSecondaryColor] = useState('#d93838');
  const [defaultHal, setDefaultHal] = useState('');
  const [defaultLampiran, setDefaultLampiran] = useState('-');
  const [salamPembuka, setSalamPembuka] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [tableType, setTableType] = useState<string>('');
  const [notes, setNotes] = useState<string[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [showSpesifikasi, setShowSpesifikasi] = useState(false);
  const [defaultSpesifikasi, setDefaultSpesifikasi] = useState('');
  const [signatureOffice, setSignatureOffice] = useState('');
  const [signatureLocation, setSignatureLocation] = useState('');
  const [signatureRole, setSignatureRole] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [showBankInfo, setShowBankInfo] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountOwner, setBankAccountOwner] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [signatureImg, setSignatureImg] = useState('');
  const [headerType, setHeaderType] = useState<'logo_only' | 'logo_text' | 'text_only'>('logo_text');
  const [tableColumns, setTableColumns] = useState<InvoiceTableColumn[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Memuat data profil terpilih ke dalam state form
  useEffect(() => {
    if (isEditingNew) {
      setProfileName('Profil Baru');
      setCompanyName('NAMA PERUSAHAAN');
      setCompanyTagline('TAGLINE PERUSAHAAN');
      setInvoiceTitleText('INVOICE');
      setAccentColor('#1e70cd');
      setAccentColorDark('#1e3a8a');
      setHeaderBgColor('#222933');
      setHeaderPrimaryColor('#d93838');
      setHeaderSecondaryColor('#d93838');
      setDefaultHal('Perihal Invoice');
      setDefaultLampiran('-');
      setSalamPembuka('Bersama surat ini kami memberikan gambaran rincian biaya dengan ketentuan sebagai berikut:');
      setActionLabel('transaksi');
      setTableType('');
      setNotes([]);
      setShowSpesifikasi(false);
      setDefaultSpesifikasi('');
      setSignatureOffice('Kantor Utama');
      setSignatureLocation('Kota Asal');
      setSignatureRole('Direktur');
      setSignatureName('Nama Penandatangan');
      setShowBankInfo(false);
      setBankName('');
      setBankAccountNo('');
      setBankAccountOwner('');
      setCompanyLogo('');
      setSignatureImg('');
      setHeaderType('logo_text');
      setTableColumns([
        { key: 'book_title', label: 'Judul', type: 'text', align: 'left' },
        { key: 'pages', label: 'Hal', type: 'text', align: 'center', width: '90px' },
        { key: 'paper_type', label: 'Jenis Naskah', type: 'text', align: 'center', width: '90px' },
        { key: 'quantity', label: 'Jml. Cetak', type: 'number', align: 'center', width: '80px' },
        { key: 'price', label: 'Cetak/pcs', type: 'currency', align: 'right', width: '100px' },
        { key: 'item_shipping_cost', label: 'Ongkos Kirim', type: 'currency', align: 'right', width: '100px' },
        { key: 'total', label: 'Total Biaya', type: 'formula', align: 'right', width: '110px', formula: '({price} * {quantity}) + {item_shipping_cost}' }
      ]);
    } else {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      if (profile) {
        setProfileName(profile.name || '');
        setCompanyName(profile.companyName || '');
        setCompanyTagline(profile.companyTagline || '');
        setInvoiceTitleText(profile.invoiceTitleText || 'INVOICE');
        setAccentColor(profile.accentColor || '#1e70cd');
        setAccentColorDark(profile.accentColorDark || '#1e3a8a');
        setHeaderBgColor(profile.headerBgColor || '#222933');
        setHeaderPrimaryColor(profile.headerPrimaryColor || (profile as any).headerColor || profile.accentColor || '#d93838');
        setHeaderSecondaryColor(profile.headerSecondaryColor || (profile as any).headerColor || profile.accentColor || '#d93838');
        setDefaultHal(profile.defaultHal || '');
        setDefaultLampiran(profile.defaultLampiran || '-');
        setSalamPembuka(profile.salamPembuka || '');
        setActionLabel(profile.actionLabel || '');
        setTableType(profile.tableType || '');
        setNotes(profile.notes || []);
        setShowSpesifikasi(profile.showSpesifikasi || false);
        setDefaultSpesifikasi(profile.defaultSpesifikasi || '');
        setSignatureOffice(profile.signatureOffice || '');
        setSignatureLocation(profile.signatureLocation || '');
        setSignatureRole(profile.signatureRole || '');
        setSignatureName(profile.signatureName || '');
        setShowBankInfo(profile.showBankInfo || false);
        setBankName(profile.bankName || '');
        setBankAccountNo(profile.bankAccountNo || '');
        setBankAccountOwner(profile.bankAccountOwner || '');
        setCompanyLogo(profile.companyLogo || '');
        setSignatureImg(profile.signatureImg || '');
        setHeaderType(profile.headerType || 'logo_text');
        setTableColumns(profile.tableColumns || []);
      }
    }
  }, [selectedProfileId, isEditingNew, profiles]);

  // Sinkronisasi selectedProfileId ketika activeProfileId berubah secara global
  useEffect(() => {
    if (!isEditingNew) {
      setSelectedProfileId(activeProfileId);
    }
  }, [activeProfileId, isEditingNew]);

  // Menggabungkan state form saat ini menjadi InvoiceProfile temporer untuk dikirim ke preview
  const currentEditingProfile: InvoiceProfile = {
    id: isEditingNew ? `profile_preview_${Date.now()}` : selectedProfileId,
    name: profileName,
    companyName,
    companyTagline,
    invoiceTitleText,
    accentColor,
    accentColorDark,
    headerBgColor,
    headerPrimaryColor,
    headerSecondaryColor,
    defaultHal,
    defaultLampiran,
    salamPembuka,
    actionLabel,
    tableType,
    notes,
    showSpesifikasi,
    defaultSpesifikasi,
    signatureOffice,
    signatureLocation,
    signatureRole,
    signatureName,
    showBankInfo,
    bankName,
    bankAccountNo,
    bankAccountOwner,
    companyLogo,
    signatureImg,
    headerType,
    tableColumns
  };

  const handleSave = () => {
    if (!profileName.trim()) {
      showToast('Nama Profil tidak boleh kosong!', 'error');
      return;
    }

    const savedProfile: InvoiceProfile = {
      ...currentEditingProfile,
      id: isEditingNew ? `profile_${Date.now()}` : selectedProfileId
    };

    addOrUpdateProfile(savedProfile);
    setIsEditingNew(false);
    setSelectedProfileId(savedProfile.id);
    setActiveProfileId(savedProfile.id);
    showToast('Profil invoice berhasil disimpan!', 'success');
  };

  // Menyimpan nilai tableType generik tanpa mereset kolom secara otomatis
  const handleTableTypeChange = (newType: string) => {
    setTableType(newType);
  };

  const handleUpdateColumn = (index: number, updates: Partial<InvoiceTableColumn>) => {
    setTableColumns(prev => prev.map((col, i) => i === index ? { ...col, ...updates } : col));
  };

  const handleAddColumn = () => {
    const newCol: InvoiceTableColumn = {
      key: `custom_${Date.now()}`,
      label: 'Kolom Baru',
      type: 'text',
      align: 'left',
      width: 'auto'
    };
    setTableColumns(prev => [...prev, newCol]);
  };

  const handleRemoveColumn = (index: number) => {
    setTableColumns(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tableColumns.length - 1) return;
    
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...tableColumns];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTableColumns(updated);
  };

  const handleResetColumns = () => {
    if (confirm('Apakah Anda yakin ingin mereset kolom ke skema bawaan minimal?')) {
      // Reset ke kolom minimal generik (nama item, qty, harga)
      setTableColumns([
        { key: 'book_title', label: 'Nama Item', type: 'text', align: 'left' },
        { key: 'quantity', label: 'Qty', type: 'number', align: 'center', width: '80px' },
        { key: 'price', label: 'Harga', type: 'currency', align: 'right', width: '110px' },
        { key: 'total', label: 'Total', type: 'formula', align: 'right', width: '110px', formula: '{price} * {quantity}' }
      ]);
    }
  };

  const handleCreateNew = () => {
    setIsEditingNew(true);
  };

  // Memuat semua field form dari template yang dipilih
  const handleLoadTemplate = (templateId: string) => {
    const tmpl = invoiceTemplates.find(t => t.templateId === templateId);
    if (!tmpl) return;
    const p = tmpl.profile;
    setProfileName(`${tmpl.label} (Salinan)`);
    setCompanyName(p.companyName || '');
    setCompanyTagline(p.companyTagline || '');
    setInvoiceTitleText(p.invoiceTitleText || 'INVOICE');
    setAccentColor(p.accentColor || '#1e70cd');
    setAccentColorDark(p.accentColorDark || '#1e3a8a');
    setHeaderBgColor(p.headerBgColor || '#222933');
    setHeaderPrimaryColor(p.headerPrimaryColor || '#d93838');
    setHeaderSecondaryColor(p.headerSecondaryColor || '#d93838');
    setDefaultHal(p.defaultHal || '');
    setDefaultLampiran(p.defaultLampiran || '-');
    setSalamPembuka(p.salamPembuka || '');
    setActionLabel(p.actionLabel || '');
    setTableType(p.tableType || '');
    setNotes(p.notes || []);
    setShowSpesifikasi(p.showSpesifikasi || false);
    setDefaultSpesifikasi(p.defaultSpesifikasi || '');
    setSignatureOffice(p.signatureOffice || '');
    setSignatureLocation(p.signatureLocation || '');
    setSignatureRole(p.signatureRole || '');
    setSignatureName(p.signatureName || '');
    setShowBankInfo(p.showBankInfo || false);
    setBankName(p.bankName || '');
    setBankAccountNo(p.bankAccountNo || '');
    setBankAccountOwner(p.bankAccountOwner || '');
    setCompanyLogo(p.companyLogo || '');
    setSignatureImg(p.signatureImg || '');
    setHeaderType(p.headerType || 'logo_text');
    setTableColumns(p.tableColumns || []);
    setShowTemplateModal(false);
  };

  const handleCancelNew = () => {
    setIsEditingNew(false);
    setSelectedProfileId(activeProfileId);
  };

  const handleDelete = () => {
    if (profiles.length <= 1) {
      showToast('Tidak dapat menghapus satu-satunya profil yang tersisa!', 'error');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus profil "${profileName}"?`)) {
      deleteProfile(selectedProfileId);
      showToast('Profil berhasil dihapus.', 'success');
      const remaining = profiles.filter((p) => p.id !== selectedProfileId);
      if (remaining.length > 0) {
        setSelectedProfileId(remaining[0].id);
      }
    }
  };

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      setNotes([...notes, newNoteText.trim()]);
      setNewNoteText('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(profiles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'pubdesk_invoice_profiles_backup.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const isValid = parsed.every((p) => p.id && p.name && p.companyName);
            if (isValid) {
              setProfiles(parsed);
              setSelectedProfileId(parsed[0].id);
              setActiveProfileId(parsed[0].id);
              showToast('Backup profil berhasil di-import!', 'success');
            } else {
              showToast('Format berkas backup JSON tidak valid!', 'error');
            }
          } else {
            showToast('Berkas backup JSON kosong atau tidak valid!', 'error');
          }
        } catch (error) {
          console.error(error);
          showToast('Gagal mengurai berkas JSON backup.', 'error');
        }
      };
    }
  };

  const handleResetToDefault = () => {
    if (
      confirm(
        'Apakah Anda yakin ingin me-reset profil ke pengaturan bawaan (dummy)? Seluruh perubahan kustom Anda akan terhapus.'
      )
    ) {
      resetProfilesToDefault();
      showToast('Pengaturan profil berhasil di-reset ke bawaan.', 'info');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(300px, 1fr)', gap: '16px', alignItems: 'start' }}>
      {/* Kolom Kiri: Form Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Panel Kelola Profil */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '16px', color: 'var(--text-primary)' }}>📁 Kelola Profil Invoice</h2>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label className="compact-label">Pilih Profil untuk Diedit</label>
              <select
                className="compact-select"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={isEditingNew ? 'new' : selectedProfileId}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    handleCreateNew();
                  } else {
                    setIsEditingNew(false);
                    setSelectedProfileId(e.target.value);
                    setActiveProfileId(e.target.value);
                  }
                }}
                disabled={isEditingNew}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.id === activeProfileId ? '(Aktif)' : ''}
                  </option>
                ))}
                {isEditingNew && <option value="new">-- Profil Baru sedang Dibuat --</option>}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {!isEditingNew ? (
                <>
                  <button className="btn-primary compact-btn" style={{ height: '32px' }} onClick={handleCreateNew}>➕ Buat Baru</button>
                  <button className="btn-danger compact-btn" style={{ height: '32px' }} onClick={handleDelete}>🗑️ Hapus</button>
                </>
              ) : (
                <>
                  <button
                    className="btn-secondary compact-btn"
                    style={{ height: '32px' }}
                    onClick={() => setShowTemplateModal(true)}
                    title="Isi form dari template yang tersedia"
                  >📋 Dari Template</button>
                  <button className="btn-secondary compact-btn" style={{ height: '32px' }} onClick={handleCancelNew}>Batal</button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
            <button className="btn-secondary compact-btn" style={{ height: '32px' }} onClick={handleExportBackup}>📥 Ekspor Backup JSON</button>
            
            <label className="btn-secondary compact-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', height: '32px' }}>
              📤 Impor Backup JSON
              <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
            </label>

            <button className="btn-danger compact-btn" style={{ marginLeft: 'auto', height: '32px' }} onClick={handleResetToDefault}>🔄 Reset Bawaan</button>
          </div>
        </div>

        {/* Form Editor Profil */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '16px', color: 'var(--text-primary)' }}>
            ✏️ {isEditingNew ? 'Buat Profil Invoice Baru' : `Edit Profil: ${profileName}`}
          </h2>

          {/* Bagian 1: Informasi Profil & Desain */}
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Desain & Identitas Profil</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="compact-form-group">
              <label className="compact-label">Nama Profil (Internal)</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Contoh: Profil Cetak Kustom"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Kode Tipe Tabel (bebas, untuk identifikasi)</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={tableType}
                onChange={(e) => handleTableTypeChange(e.target.value)}
                placeholder="Contoh: layanan_desain, cetak_buku, haki, dll."
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Warna Aksen Utama</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="color"
                  style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                <input
                  type="text"
                  className="compact-input"
                  style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  placeholder="#1e70cd"
                />
              </div>
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Warna Aksen Gelap</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="color"
                  style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
                  value={accentColorDark}
                  onChange={(e) => setAccentColorDark(e.target.value)}
                />
                <input
                  type="text"
                  className="compact-input"
                  style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={accentColorDark}
                  onChange={(e) => setAccentColorDark(e.target.value)}
                  placeholder="#1e3a8a"
                />
              </div>
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Warna Utama Header SVG (Kiri)</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="color"
                  style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
                  value={headerPrimaryColor}
                  onChange={(e) => setHeaderPrimaryColor(e.target.value)}
                />
                <input
                  type="text"
                  className="compact-input"
                  style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={headerPrimaryColor}
                  onChange={(e) => setHeaderPrimaryColor(e.target.value)}
                  placeholder="#d93838"
                />
              </div>
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Warna Aksen Header SVG (Tengah)</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="color"
                  style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
                  value={headerSecondaryColor}
                  onChange={(e) => setHeaderSecondaryColor(e.target.value)}
                />
                <input
                  type="text"
                  className="compact-input"
                  style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={headerSecondaryColor}
                  onChange={(e) => setHeaderSecondaryColor(e.target.value)}
                  placeholder="#d93838"
                />
              </div>
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Warna Latar Header SVG (Kanan)</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="color"
                  style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
                  value={headerBgColor}
                  onChange={(e) => setHeaderBgColor(e.target.value)}
                />
                <input
                  type="text"
                  className="compact-input"
                  style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={headerBgColor}
                  onChange={(e) => setHeaderBgColor(e.target.value)}
                  placeholder="#222933"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Kop Surat (Header) */}
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Kop Surat & Judul (Header)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="compact-form-group">
              <label className="compact-label">Nama Perusahaan</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: CV DUMMY JAYA"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Tagline Perusahaan</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={companyTagline}
                onChange={(e) => setCompanyTagline(e.target.value)}
                placeholder="Contoh: DUMMY JAYA ABADI"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Teks Judul Invoice</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={invoiceTitleText}
                onChange={(e) => setInvoiceTitleText(e.target.value)}
                placeholder="Contoh: INVOICE"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Logo Kop Surat (PNG/JPG/SVG)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {companyLogo && (
                  <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={companyLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button 
                      type="button" 
                      onClick={() => setCompanyLogo('')} 
                      style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '0 0 0 4px', cursor: 'pointer', fontSize: '8px', padding: '1px 2px' }}
                      title="Hapus Logo"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 1024 * 1024) {
                          showToast('Ukuran berkas logo terlalu besar (maksimal 1MB)!', 'error');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setCompanyLogo(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                    id="logo-upload-input"
                  />
                  <label 
                    htmlFor="logo-upload-input" 
                    className="btn-secondary compact-btn" 
                    style={{ cursor: 'pointer', textAlign: 'center', display: 'block', height: '32px', lineHeight: '20px' }}
                  >
                    {companyLogo ? 'Ubah Logo' : 'Unggah Logo'}
                  </label>
                </div>
              </div>
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Tipe Kop Surat</label>
              <select
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', height: '32px', padding: '0 8px', borderRadius: '6px' }}
                value={headerType}
                onChange={(e) => setHeaderType(e.target.value as any)}
              >
                <option value="logo_text">Logo + Teks</option>
                <option value="logo_only">Hanya Logo</option>
                <option value="text_only">Hanya Teks</option>
              </select>
            </div>
          </div>

          {/* Bagian 3: Konten Surat */}
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Detail Konten Surat</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="compact-form-group">
              <label className="compact-label">Perihal Bawaan (Default Hal)</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={defaultHal}
                onChange={(e) => setDefaultHal(e.target.value)}
                placeholder="Contoh: Pengadaan Modul Ajar"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Lampiran Bawaan (Default Lampiran)</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={defaultLampiran}
                onChange={(e) => setDefaultLampiran(e.target.value)}
                placeholder="Contoh: 1 Lembar"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }} className="compact-form-group">
              <label className="compact-label">Salam Pembuka Bawaan</label>
              <textarea
                className="compact-textarea"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', minHeight: '42px', resize: 'vertical' }}
                value={salamPembuka}
                onChange={(e) => setSalamPembuka(e.target.value)}
                placeholder="Teks salam pembuka..."
                rows={2}
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Label Aksi Penutup</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="Contoh: penerbitan buku"
              />
            </div>
          </div>

          {/* Bagian 4: Spesifikasi & Catatan */}
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4. Spesifikasi & Catatan (Notes)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  id="showSpesifikasi"
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  checked={showSpesifikasi}
                  onChange={(e) => setShowSpesifikasi(e.target.checked)}
                />
                <label htmlFor="showSpesifikasi" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>Tampilkan Box Spesifikasi & Fasilitas</label>
              </div>
              
              {showSpesifikasi && (
                <div className="compact-form-group">
                  <label className="compact-label">Teks Spesifikasi Bawaan</label>
                  <input
                    type="text"
                    className="compact-input"
                    style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    value={defaultSpesifikasi}
                    onChange={(e) => setDefaultSpesifikasi(e.target.value)}
                    placeholder="Contoh: Sesuai proposal kerjasama"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="compact-label">Daftar Catatan (Note)</label>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  type="text"
                  className="compact-input"
                  style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Ketik catatan baru..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote(); } }}
                />
                <button className="btn-primary compact-btn" onClick={handleAddNote}>Tambah</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px', background: 'var(--bg-card)' }}>
                {notes.length === 0 ? (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '2px' }}>Tidak ada catatan.</div>
                ) : (
                  notes.map((note, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', background: 'var(--bg-panel)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{index + 1}. {note}</span>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleRemoveNote(index)}>✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bagian 5: Tanda Tangan */}
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>5. Tanda Tangan Penutup</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div className="compact-form-group">
              <label className="compact-label">Instansi / Nama Kantor</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={signatureOffice}
                onChange={(e) => setSignatureOffice(e.target.value)}
                placeholder="Contoh: Kantor Penerbit Yogyakarta"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Lokasi Tanda Tangan</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={signatureLocation}
                onChange={(e) => setSignatureLocation(e.target.value)}
                placeholder="Contoh: Yogyakarta"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Jabatan Penandatangan</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={signatureRole}
                onChange={(e) => setSignatureRole(e.target.value)}
                placeholder="Contoh: CEO Penerbit"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Nama Lengkap & Gelar</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Contoh: RUDI HARTONO, M.Kom."
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Gambar Tanda Tangan (PNG Transparan)</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {signatureImg && (
                  <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={signatureImg} alt="Tanda Tangan" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    <button 
                      type="button" 
                      onClick={() => setSignatureImg('')} 
                      style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '0 0 0 4px', cursor: 'pointer', fontSize: '8px', padding: '1px 2px' }}
                      title="Hapus Tanda Tangan"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 1024 * 1024) {
                          showToast('Ukuran berkas tanda tangan terlalu besar (maksimal 1MB)!', 'error');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setSignatureImg(event.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                    id="signature-upload-input"
                  />
                  <label 
                    htmlFor="signature-upload-input" 
                    className="btn-secondary compact-btn" 
                    style={{ cursor: 'pointer', textAlign: 'center', display: 'block', height: '32px', lineHeight: '20px' }}
                  >
                    {signatureImg ? 'Ubah Gambar' : 'Unggah Gambar'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 6: Informasi Pembayaran */}
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>6. Informasi Rekening Bank</h3>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                id="showBankInfo"
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                checked={showBankInfo}
                onChange={(e) => setShowBankInfo(e.target.checked)}
              />
              <label htmlFor="showBankInfo" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>Tampilkan Blok Informasi Bank</label>
            </div>

            {showBankInfo && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div className="compact-form-group">
                  <label className="compact-label">Nama Bank / Layanan</label>
                  <input
                    type="text"
                    className="compact-input"
                    style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Contoh: Bank Central Asia (BCA)"
                  />
                </div>

                <div className="compact-form-group">
                  <label className="compact-label">Nomor Rekening</label>
                  <input
                    type="text"
                    className="compact-input"
                    style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    value={bankAccountNo}
                    onChange={(e) => setBankAccountNo(e.target.value)}
                    placeholder="Contoh: 876830659"
                  />
                </div>

                <div className="compact-form-group">
                  <label className="compact-label">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    className="compact-input"
                    style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    value={bankAccountOwner}
                    onChange={(e) => setBankAccountOwner(e.target.value)}
                    placeholder="Contoh: Mohammad Imam"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bagian 7: Pengaturan Kolom Tabel Invoice */}
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>7. Kolom Tabel Rincian Invoice</h3>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>Sesuaikan kolom tabel rincian item:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" className="btn-secondary compact-btn" style={{ fontSize: '11px', height: '26px' }} onClick={handleResetColumns}>
                  🔄 Reset Bawaan
                </button>
                <button type="button" className="btn-primary compact-btn" style={{ fontSize: '11px', height: '26px' }} onClick={handleAddColumn}>
                  ➕ Tambah Kolom
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '360px', overflowY: 'auto', paddingRight: '2px' }}>
              {tableColumns.length === 0 ? (
                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', padding: '16px', fontStyle: 'italic' }}>
                  Belum ada kolom tabel yang didefinisikan.
                </div>
              ) : (
                tableColumns.map((col, idx) => {
                  const isLocked = col.key === 'book_title' || col.key === 'quantity' || col.key === 'price';
                  const typeBadge: Record<string, { label: string; color: string }> = {
                    text:     { label: 'Teks',    color: '#6b7280' },
                    number:   { label: 'Angka',   color: '#1d4ed8' },
                    currency: { label: 'Rp',      color: '#0d9488' },
                    formula:  { label: 'Formula', color: '#7c3aed' },
                  };
                  const badge = typeBadge[col.type] ?? typeBadge.text;

                  return (
                    <div
                      key={col.key}
                      style={{
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Header baris */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: isLocked ? 'rgba(0,0,0,0.04)' : 'transparent', borderBottom: '1px solid var(--border)' }}>
                        {/* Nomor urut */}
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', width: '16px', textAlign: 'center', flexShrink: 0 }}>
                          {idx + 1}
                        </span>

                        {/* Input label (nama kolom) */}
                        <input
                          type="text"
                          style={{ flex: 1, fontSize: '12px', fontWeight: '600', padding: '2px 6px', border: '1px solid transparent', borderRadius: '4px', background: 'transparent', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.15s' }}
                          value={col.label}
                          onChange={(e) => handleUpdateColumn(idx, { label: e.target.value })}
                          placeholder="Label Kolom"
                          onFocus={(e) => e.target.style.borderColor = 'var(--border)'}
                          onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        />

                        {/* Badge tipe */}
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '12px', background: badge.color + '22', color: badge.color, flexShrink: 0 }}>
                          {badge.label}
                        </span>

                        {/* Tombol naik/turun */}
                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleMoveColumn(idx, 'up')}
                            disabled={idx === 0}
                            title="Pindah ke atas"
                            style={{ background: 'transparent', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: '2px 4px', borderRadius: '3px', color: idx === 0 ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '10px', opacity: idx === 0 ? 0.3 : 1 }}
                          >▲</button>
                          <button
                            type="button"
                            onClick={() => handleMoveColumn(idx, 'down')}
                            disabled={idx === tableColumns.length - 1}
                            title="Pindah ke bawah"
                            style={{ background: 'transparent', border: 'none', cursor: idx === tableColumns.length - 1 ? 'default' : 'pointer', padding: '2px 4px', borderRadius: '3px', color: idx === tableColumns.length - 1 ? 'var(--text-secondary)' : 'var(--text-primary)', fontSize: '10px', opacity: idx === tableColumns.length - 1 ? 0.3 : 1 }}
                          >▼</button>
                        </div>

                        {/* Tombol hapus */}
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(idx)}
                          disabled={isLocked}
                          title={isLocked ? 'Kolom wajib tidak dapat dihapus' : 'Hapus kolom'}
                          style={{ background: isLocked ? 'transparent' : '#dc262611', border: 'none', cursor: isLocked ? 'default' : 'pointer', padding: '3px 6px', borderRadius: '4px', color: isLocked ? 'var(--text-secondary)' : '#dc2626', fontSize: '13px', opacity: isLocked ? 0.25 : 1, flexShrink: 0 }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6l-1 14H6L5 6"></path>
                            <path d="M10 11v6M14 11v6"></path>
                          </svg>
                        </button>
                      </div>

                      {/* Detail baris */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: '8px', padding: '10px 10px', alignItems: 'start', background: 'var(--bg-card)' }}>
                        {/* Kunci */}
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Kunci</div>
                          <input
                            type="text"
                            style={{ width: '100%', fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-panel)', color: 'var(--text-secondary)', outline: 'none', boxSizing: 'border-box' }}
                            value={col.key}
                            onChange={(e) => handleUpdateColumn(idx, { key: e.target.value })}
                            disabled={isLocked}
                            placeholder="key_kolom"
                          />
                        </div>

                        {/* Tipe */}
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Tipe</div>
                          <select
                            style={{ width: '100%', fontSize: '11px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', outline: 'none', height: '28px', boxSizing: 'border-box' }}
                            value={col.type}
                            onChange={(e) => handleUpdateColumn(idx, { type: e.target.value as any })}
                            disabled={isLocked}
                          >
                            <option value="text">Teks</option>
                            <option value="number">Angka</option>
                            <option value="currency">Mata Uang (Rp)</option>
                            <option value="formula">Formula</option>
                          </select>
                        </div>

                        {/* Align */}
                        <div>
                          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Rata</div>
                          <select
                            style={{ width: '100%', fontSize: '11px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', outline: 'none', height: '28px', boxSizing: 'border-box' }}
                            value={col.align || 'left'}
                            onChange={(e) => handleUpdateColumn(idx, { align: e.target.value as any })}
                          >
                            <option value="left">Kiri</option>
                            <option value="center">Tengah</option>
                            <option value="right">Kanan</option>
                          </select>
                        </div>

                        {/* Width atau Formula */}
                        <div>
                          {col.type === 'formula' ? (
                            <>
                              <div style={{ fontSize: '9px', color: '#a78bfa', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Formula</div>
                              <input
                                type="text"
                                style={{ width: '100%', fontSize: '11px', padding: '4px 8px', border: '1px solid #7c3aed66', borderRadius: '4px', background: '#2d1b6922', color: '#c4b5fd', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                                value={col.formula || ''}
                                onChange={(e) => handleUpdateColumn(idx, { formula: e.target.value })}
                                placeholder="{price}*{quantity}"
                              />
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Lebar</div>
                              <input
                                type="text"
                                style={{ width: '100%', fontSize: '11px', padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg-panel)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                                value={col.width || 'auto'}
                                onChange={(e) => handleUpdateColumn(idx, { width: e.target.value })}
                                placeholder="auto / 90px"
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>


          {/* Tombol Simpan Terakhir */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
            <button className="btn-primary compact-btn" style={{ flex: 1, height: '32px', fontSize: '13px', fontWeight: '600' }} onClick={handleSave}>
              💾 Simpan Pengaturan Profil
            </button>
            {isEditingNew && (
              <button className="btn-secondary compact-btn" style={{ width: '100px', height: '32px' }} onClick={handleCancelNew}>
                Batal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Panel Realtime Preview */}
      <div style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100vh - 100px)', minHeight: '400px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
          👁️ Realtime Preview
        </h3>
        <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <InvoicePreview previewProfile={currentEditingProfile} />
        </div>
      </div>

      {/* Modal Pilih Template */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={() => setShowTemplateModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '24px', width: '480px', maxWidth: '90vw',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                📋 Pilih Template Invoice
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Form profil akan diisi dari template yang dipilih. Anda tetap bisa mengubah field sebelum menyimpan.
            </p>

            {/* Kelompokkan berdasarkan kategori */}
            {Array.from(new Set(invoiceTemplates.map(t => t.category))).map(cat => (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {cat}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {invoiceTemplates.filter(t => t.category === cat).map(tmpl => (
                    <div
                      key={tmpl.templateId}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 12px', borderRadius: '8px',
                        border: '1px solid var(--border)', background: 'var(--bg-main)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{tmpl.label}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{tmpl.description}</div>
                      </div>
                      <button
                        className="btn-primary compact-btn"
                        style={{ height: '30px', whiteSpace: 'nowrap', marginLeft: '12px' }}
                        onClick={() => handleLoadTemplate(tmpl.templateId)}
                      >
                        Gunakan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceSettings;

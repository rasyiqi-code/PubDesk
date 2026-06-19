import React, { useState, useEffect } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { InvoiceProfile } from '../../types';
import kbmProfilesBackup from '../../assets/kbm_profiles_backup.json';

const Settings: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addOrUpdateProfile,
    deleteProfile,
    resetProfilesToDefault,
    setProfiles
  } = useInvoiceContext();

  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeProfileId);
  const [isEditingNew, setIsEditingNew] = useState<boolean>(false);

  // Form states
  const [profileName, setProfileName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyTagline, setCompanyTagline] = useState('');
  const [invoiceTitleText, setInvoiceTitleText] = useState('INVOICE');
  const [accentColor, setAccentColor] = useState('#1e70cd');
  const [accentColorDark, setAccentColorDark] = useState('#1e3a8a');
  const [defaultHal, setDefaultHal] = useState('');
  const [defaultLampiran, setDefaultLampiran] = useState('-');
  const [salamPembuka, setSalamPembuka] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [tableType, setTableType] = useState<'kbm_cetak' | 'kbm_creator' | 'spt_mitra'>('kbm_cetak');
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

  // Load selected profile data into form
  useEffect(() => {
    if (isEditingNew) {
      // Load empty/default new profile values
      setProfileName('Profil Baru');
      setCompanyName('NAMA PERUSAHAAN');
      setCompanyTagline('TAGLINE PERUSAHAAN');
      setInvoiceTitleText('INVOICE');
      setAccentColor('#1e70cd');
      setAccentColorDark('#1e3a8a');
      setDefaultHal('Perihal Invoice');
      setDefaultLampiran('-');
      setSalamPembuka('Bersama surat ini kami memberikan gambaran rincian biaya dengan ketentuan sebagai berikut:');
      setActionLabel('transaksi');
      setTableType('kbm_cetak');
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
    } else {
      const profile = profiles.find((p) => p.id === selectedProfileId);
      if (profile) {
        setProfileName(profile.name || '');
        setCompanyName(profile.companyName || '');
        setCompanyTagline(profile.companyTagline || '');
        setInvoiceTitleText(profile.invoiceTitleText || 'INVOICE');
        setAccentColor(profile.accentColor || '#1e70cd');
        setAccentColorDark(profile.accentColorDark || '#1e3a8a');
        setDefaultHal(profile.defaultHal || '');
        setDefaultLampiran(profile.defaultLampiran || '-');
        setSalamPembuka(profile.salamPembuka || '');
        setActionLabel(profile.actionLabel || '');
        setTableType(profile.tableType || 'kbm_cetak');
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
      }
    }
  }, [selectedProfileId, isEditingNew, profiles]);

  // Sync selectedProfileId when activeProfileId changes globally
  useEffect(() => {
    if (!isEditingNew) {
      setSelectedProfileId(activeProfileId);
    }
  }, [activeProfileId, isEditingNew]);

  const handleSave = () => {
    if (!profileName.trim()) {
      alert('Nama Profil tidak boleh kosong!');
      return;
    }

    const newProfile: InvoiceProfile = {
      id: isEditingNew ? `profile_${Date.now()}` : selectedProfileId,
      name: profileName,
      companyName,
      companyTagline,
      invoiceTitleText,
      accentColor,
      accentColorDark,
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
    };

    addOrUpdateProfile(newProfile);
    setIsEditingNew(false);
    setSelectedProfileId(newProfile.id);
    setActiveProfileId(newProfile.id);
    alert('Profil invoice berhasil disimpan!');
  };

  const handleCreateNew = () => {
    setIsEditingNew(true);
  };

  const handleCancelNew = () => {
    setIsEditingNew(false);
    setSelectedProfileId(activeProfileId);
  };

  const handleDelete = () => {
    if (profiles.length <= 1) {
      alert('Tidak dapat menghapus satu-satunya profil yang tersisa!');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus profil "${profileName}"?`)) {
      deleteProfile(selectedProfileId);
      alert('Profil berhasil dihapus.');
      // Auto select profil pertama dari list setelah hapus
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
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'pubdesk_invoice_profiles_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Validasi field minimum profil
            const isValid = parsed.every(p => p.id && p.name && p.companyName);
            if (isValid) {
              setProfiles(parsed);
              setSelectedProfileId(parsed[0].id);
              setActiveProfileId(parsed[0].id);
              alert('Backup profil berhasil di-import!');
            } else {
              alert('Format berkas backup JSON tidak valid!');
            }
          } else {
            alert('Berkas backup JSON kosong atau tidak valid!');
          }
        } catch (error) {
          console.error(error);
          alert('Gagal mengurai berkas JSON backup.');
        }
      };
    }
  };

  const handleImportKbmOriginal = () => {
    if (confirm('Apakah Anda yakin ingin mengimpor Profil KBM & Undiksha asli? Tindakan ini akan menambahkan profil asli KBM ke daftar profil Anda.')) {
      // Loop backup profiles dan tambahkan jika belum ada id-nya, atau timpahkan jika sudah ada
      let updatedProfiles = [...profiles];
      kbmProfilesBackup.forEach((kbmProf: any) => {
        const idx = updatedProfiles.findIndex(p => p.id === kbmProf.id);
        if (idx > -1) {
          updatedProfiles[idx] = kbmProf as InvoiceProfile;
        } else {
          updatedProfiles.push(kbmProf as InvoiceProfile);
        }
      });
      setProfiles(updatedProfiles);
      setSelectedProfileId(kbmProfilesBackup[0].id);
      setActiveProfileId(kbmProfilesBackup[0].id);
      alert('Profil KBM Cetak, KBM Creator, dan SPT Undiksha asli berhasil di-import!');
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Apakah Anda yakin ingin me-reset profil ke pengaturan bawaan (dummy)? Seluruh perubahan kustom Anda akan terhapus.')) {
      resetProfilesToDefault();
      alert('Pengaturan profil berhasil di-reset ke bawaan.');
    }
  };

  return (
    <div className="settings-module" style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-primary)' }}>Pengaturan</h1>

      {/* Profil selector & Aksi Utama */}
      <div style={{ marginBottom: '24px', background: 'var(--bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>📁 Kelola Profil Invoice</h2>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Pilih Profil untuk Diedit</label>
            <select
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
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

          <div style={{ display: 'flex', gap: '8px' }}>
            {!isEditingNew ? (
              <>
                <button className="btn-primary" onClick={handleCreateNew}>➕ Buat Baru</button>
                <button className="btn-danger" onClick={handleDelete}>🗑️ Hapus</button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={handleCancelNew}>Batal</button>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
          <button className="btn-secondary" onClick={handleExportBackup}>📥 Ekspor Backup JSON</button>
          
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            📤 Impor Backup JSON
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
          </label>

          <button className="btn-success" onClick={handleImportKbmOriginal}>✨ Impor KBM Asli</button>
          
          <button className="btn-danger" style={{ marginLeft: 'auto' }} onClick={handleResetToDefault}>🔄 Reset Bawaan</button>
        </div>
      </div>

      {/* Form Editor Profil */}
      <div style={{ background: 'var(--bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          ✏️ {isEditingNew ? 'Buat Profil Invoice Baru' : `Edit Profil: ${profileName}`}
        </h2>

        {/* Bagian 1: Informasi Profil & Desain */}
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Desain & Identitas Profil</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Profil (Internal)</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Contoh: Profil Cetak Kustom"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Jenis Format Kolom Tabel</label>
            <select
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
              value={tableType}
              onChange={(e) => setTableType(e.target.value as any)}
            >
              <option value="kbm_cetak">KBM Cetak (Kolom: Judul, Hal, Naskah, Qty, Pcs, Ongkir, Total)</option>
              <option value="kbm_creator">KBM Creator (Kolom: Judul Karya, Pemegang Hak Cipta, Total)</option>
              <option value="spt_mitra">SPT Mitra (Kolom: Judul, Hal, Naskah, Qty Paket, Harga Paket)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Warna Aksen Utama</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                style={{ width: '42px', height: '42px', padding: '2px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', cursor: 'pointer' }}
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
              <input
                type="text"
                style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                placeholder="#1e70cd"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Warna Aksen Gelap</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                style={{ width: '42px', height: '42px', padding: '2px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', cursor: 'pointer' }}
                value={accentColorDark}
                onChange={(e) => setAccentColorDark(e.target.value)}
              />
              <input
                type="text"
                style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={accentColorDark}
                onChange={(e) => setAccentColorDark(e.target.value)}
                placeholder="#1e3a8a"
              />
            </div>
          </div>
        </div>

        {/* Bagian 2: Kop Surat (Header) */}
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Kop Surat & Judul (Header)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Perusahaan</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Contoh: CV DUMMY JAYA"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Tagline Perusahaan</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={companyTagline}
              onChange={(e) => setCompanyTagline(e.target.value)}
              placeholder="Contoh: DUMMY JAYA ABADI"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Teks Judul Invoice</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={invoiceTitleText}
              onChange={(e) => setInvoiceTitleText(e.target.value)}
              placeholder="Contoh: INVOICE"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Logo Kop Surat (PNG/JPG/SVG)</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {companyLogo && (
                <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={companyLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  <button 
                    type="button" 
                    onClick={() => setCompanyLogo('')} 
                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderRadius: '0 0 0 4px', cursor: 'pointer', fontSize: '10px', padding: '1px 3px' }}
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
                        alert('Ukuran berkas logo terlalu besar (maksimal 1MB)!');
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
                  className="btn-secondary" 
                  style={{ cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', display: 'block' }}
                >
                  {companyLogo ? 'Ubah Logo' : 'Unggah Logo'}
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bagian 3: Konten Surat */}
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Detail Konten Surat</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Perihal Bawaan (Default Hal)</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={defaultHal}
              onChange={(e) => setDefaultHal(e.target.value)}
              placeholder="Contoh: Pengadaan Modul Ajar"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Lampiran Bawaan (Default Lampiran)</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={defaultLampiran}
              onChange={(e) => setDefaultLampiran(e.target.value)}
              placeholder="Contoh: 1 Lembar"
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Salam Pembuka Bawaan</label>
            <textarea
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', minHeight: '60px', resize: 'vertical' }}
              value={salamPembuka}
              onChange={(e) => setSalamPembuka(e.target.value)}
              placeholder="Teks salam pembuka..."
              rows={2}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Label Aksi Penutup</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder="Contoh: penerbitan buku (Demikian rincian biaya penerbitan buku anda...)"
            />
          </div>
        </div>

        {/* Bagian 4: Spesifikasi & Catatan */}
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>4. Spesifikasi & Catatan (Notes)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="showSpesifikasi"
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                checked={showSpesifikasi}
                onChange={(e) => setShowSpesifikasi(e.target.checked)}
              />
              <label htmlFor="showSpesifikasi" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>Tampilkan Box Spesifikasi & Fasilitas</label>
            </div>
            
            {showSpesifikasi && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Teks Spesifikasi Bawaan</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={defaultSpesifikasi}
                  onChange={(e) => setDefaultSpesifikasi(e.target.value)}
                  placeholder="Contoh: Sesuai proposal kerjasama"
                />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Daftar Catatan (Note - KBM Style)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Ketik catatan baru di sini..."
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNote(); } }}
              />
              <button className="btn-primary" onClick={handleAddNote}>Tambah</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', background: 'var(--bg-card)' }}>
              {notes.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px' }}>Tidak ada catatan.</div>
              ) : (
                notes.map((note, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', background: 'var(--bg-panel)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{index + 1}. {note}</span>
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '14px' }} onClick={() => handleRemoveNote(index)}>✕</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bagian 5: Tanda Tangan */}
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>5. Tanda Tangan Penutup</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Instansi / Nama Kantor</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={signatureOffice}
              onChange={(e) => setSignatureOffice(e.target.value)}
              placeholder="Contoh: Kantor Penerbit Yogyakarta"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Lokasi Tanda Tangan</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={signatureLocation}
              onChange={(e) => setSignatureLocation(e.target.value)}
              placeholder="Contoh: Yogyakarta (akan diikuti tanggal otomatis)"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Jabatan Penandatangan</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={signatureRole}
              onChange={(e) => setSignatureRole(e.target.value)}
              placeholder="Contoh: CEO Penerbit"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Lengkap & Gelar</label>
            <input
              type="text"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Contoh: RUDI HARTONO, M.Kom."
            />
          </div>
        </div>

        {/* Bagian 6: Informasi Pembayaran */}
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>6. Informasi Rekening Bank</h3>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input
              type="checkbox"
              id="showBankInfo"
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              checked={showBankInfo}
              onChange={(e) => setShowBankInfo(e.target.checked)}
            />
            <label htmlFor="showBankInfo" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>Tampilkan Blok Informasi Bank</label>
          </div>

          {showBankInfo && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Bank / Layanan</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: Bank Central Asia (BCA)"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nomor Rekening</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="Contoh: 876830659"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Pemilik Rekening</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={bankAccountOwner}
                  onChange={(e) => setBankAccountOwner(e.target.value)}
                  placeholder="Contoh: Mohammad Imam"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tombol Simpan Terakhir */}
        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
          <button className="btn-primary" style={{ flex: 1, height: '45px', fontSize: '15px', fontWeight: '600' }} onClick={handleSave}>
            💾 Simpan Pengaturan Profil
          </button>
          {isEditingNew && (
            <button className="btn-secondary" style={{ width: '150px' }} onClick={handleCancelNew}>
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

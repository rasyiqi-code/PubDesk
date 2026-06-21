import React, { useState, useEffect } from 'react';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { useAppContext } from '../../contexts/AppContext';
import { InvoiceProfile, InvoiceTableColumn } from '../../types/invoice.types';
import { invoiceTemplates } from '../../data/invoiceTemplates';
import InvoicePreview from '../invoice/InvoicePreview';
import { SettingsFormContext } from './invoice/SettingsFormContext';
import DesignSection from './invoice/DesignSection';
import HeaderSection from './invoice/HeaderSection';
import ContentSection from './invoice/ContentSection';
import NotesSection from './invoice/NotesSection';
import SignatureSection from './invoice/SignatureSection';
import BankSection from './invoice/BankSection';
import ColumnsSection from './invoice/ColumnsSection';
import ContactSection from './invoice/ContactSection';

const InvoiceSettings: React.FC = () => {
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    addOrUpdateProfile,
    deleteProfile,
    setProfiles
  } = useInvoiceContext();
  const { showToast, showConfirm, addFile, files, rightPanelVisible } = useAppContext();

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
  const [shippingType, setShippingType] = useState<'none' | 'global' | 'item'>('global');
  const [watermarkColor, setWatermarkColor] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(8); // Default 8%
  const [invoiceNoFormat, setInvoiceNoFormat] = useState('KBM/{year}/{month}/{day}/{seq}');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyYoutube, setCompanyYoutube] = useState('');
  const [companyInstagram, setCompanyInstagram] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [showCompanyContact, setShowCompanyContact] = useState(false);
  const [footerBgColor, setFooterBgColor] = useState('');
  const [footerPrimaryColor, setFooterPrimaryColor] = useState('');
  const [footerSecondaryColor, setFooterSecondaryColor] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  const renderAccordionSection = (index: number, title: string, component: React.ReactNode) => {
    const isOpen = expandedSection === index;
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setExpandedSection(isOpen ? null : index)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: isOpen ? 'var(--bg-panel)' : 'transparent',
            border: 'none',
            color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: '700',
            textAlign: 'left',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            outline: 'none'
          }}
        >
          <span>{title}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            {component}
          </div>
        )}
      </div>
    );
  };

  // Helper to build full columns (injecting item_shipping_cost if needed)
  const getFullTableColumns = (cols: InvoiceTableColumn[], type: 'none' | 'global' | 'item') => {
    let finalCols = cols.filter(c => c.key !== 'item_shipping_cost');
    if (type === 'item') {
      const totalIdx = finalCols.findIndex(c => c.key === 'total');
      const shippingCol = { key: 'item_shipping_cost', label: 'Ongkos Kirim', type: 'currency' as const, align: 'right' as const, width: '100px' };
      if (totalIdx > -1) {
        finalCols.splice(totalIdx, 0, shippingCol);
      } else {
        finalCols.push(shippingCol);
      }
    }
    return finalCols;
  };

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
        { key: 'item_title', label: 'Judul', type: 'text', align: 'left' },
        { key: 'pages', label: 'Hal', type: 'text', align: 'center', width: '90px' },
        { key: 'paper_type', label: 'Jenis Naskah', type: 'text', align: 'center', width: '90px' },
        { key: 'quantity', label: 'Jml. Cetak', type: 'number', align: 'center', width: '80px' },
        { key: 'price', label: 'Cetak/pcs', type: 'currency', align: 'right', width: '100px' },
        { key: 'total', label: 'Total Biaya', type: 'formula', align: 'right', width: '110px', formula: '{price} * {quantity}' }
      ]);
      setShippingType('global');
      setWatermarkColor('');
      setWatermarkOpacity(8);
      setInvoiceNoFormat('KBM/{year}/{month}/{day}/{seq}');
      setCompanyWebsite('');
      setCompanyEmail('');
      setCompanyYoutube('');
      setCompanyInstagram('');
      setCompanyPhone('');
      setShowCompanyContact(false);
      setFooterBgColor('#222933');
      setFooterPrimaryColor('#d93838');
      setFooterSecondaryColor('#d93838');
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
        setFooterBgColor(profile.footerBgColor || profile.headerBgColor || '#222933');
        setFooterPrimaryColor(profile.footerPrimaryColor || profile.headerPrimaryColor || profile.accentColor || '#d93838');
        setFooterSecondaryColor(profile.footerSecondaryColor || profile.headerSecondaryColor || profile.accentColor || '#d93838');
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
 
        // Sembunyikan item_shipping_cost dari tabel kolom editor
        const colsWithoutShipping = (profile.tableColumns || []).filter(c => c.key !== 'item_shipping_cost');
        setTableColumns(colsWithoutShipping);
 
        // Deteksi tipe ongkos kirim bawaan
        const hasShippingCol = (profile.tableColumns || []).some(c => c.key === 'item_shipping_cost');
        const detectedType = profile.shippingType || (hasShippingCol ? 'item' : 'global');
        setShippingType(detectedType);
 
        // Muat watermark settings
        setWatermarkColor(profile.watermarkColor || '');
        setWatermarkOpacity(profile.watermarkOpacity !== undefined ? profile.watermarkOpacity : 8);
        setInvoiceNoFormat(profile.invoiceNoFormat || 'KBM/{year}/{month}/{day}/{seq}');
        setCompanyWebsite(profile.companyWebsite || '');
        setCompanyEmail(profile.companyEmail || '');
        setCompanyYoutube(profile.companyYoutube || '');
        setCompanyInstagram(profile.companyInstagram || '');
        setCompanyPhone(profile.companyPhone || '');
        setShowCompanyContact(profile.showCompanyContact || false);
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
    footerBgColor,
    footerPrimaryColor,
    footerSecondaryColor,
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
    tableColumns: getFullTableColumns(tableColumns, shippingType),
    shippingType,
    watermarkColor,
    watermarkOpacity,
    invoiceNoFormat,
    companyWebsite,
    companyEmail,
    companyYoutube,
    companyInstagram,
    companyPhone,
    showCompanyContact
  };

  const handleSave = () => {
    if (!profileName.trim()) {
      showToast('Nama Profil tidak boleh kosong!', 'error');
      return;
    }

    const savedProfile: InvoiceProfile = {
      ...currentEditingProfile,
      id: isEditingNew ? `profile_${Date.now()}` : selectedProfileId,
      tableColumns: getFullTableColumns(tableColumns, shippingType),
      shippingType
    };

    addOrUpdateProfile(savedProfile);
    setIsEditingNew(false);
    setSelectedProfileId(savedProfile.id);
    setActiveProfileId(savedProfile.id);
    showToast('Profil invoice berhasil disimpan!', 'success');
  };

  // Note & column handlers moved to subcomponents.

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
    // Sembunyikan item_shipping_cost dari tabel kolom editor saat memuat template
    const colsWithoutShipping = (p.tableColumns || []).filter(c => c.key !== 'item_shipping_cost');
    setTableColumns(colsWithoutShipping);

    // Deteksi tipe ongkos kirim bawaan dari template
    const hasShippingCol = (p.tableColumns || []).some(c => c.key === 'item_shipping_cost');
    const detectedType = p.shippingType || (hasShippingCol ? 'item' : 'global');
    setShippingType(detectedType);

    // Muat watermark dari template
    setWatermarkColor(p.watermarkColor || '');
    setWatermarkOpacity(p.watermarkOpacity !== undefined ? p.watermarkOpacity : 8);
    setInvoiceNoFormat((p as any).invoiceNoFormat || 'KBM/{year}/{month}/{day}/{seq}');
    setCompanyWebsite((p as any).companyWebsite || '');
    setCompanyEmail((p as any).companyEmail || '');
    setCompanyYoutube((p as any).companyYoutube || '');
    setCompanyInstagram((p as any).companyInstagram || '');
    setCompanyPhone((p as any).companyPhone || '');
    setShowCompanyContact((p as any).showCompanyContact || false);

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
    showConfirm({
      title: 'Hapus Profil',
      message: `Apakah Anda yakin ingin menghapus profil "${profileName}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: () => {
        deleteProfile(selectedProfileId);
        showToast('Profil berhasil dihapus.', 'success');
        const remaining = profiles.filter((p) => p.id !== selectedProfileId);
        if (remaining.length > 0) {
          setSelectedProfileId(remaining[0].id);
        }
      }
    });
  };

  // Note helper functions moved to NotesSection component.

  const handleExportBackup = async () => {
    try {
      const dataStr = JSON.stringify(profiles, null, 2);
      const bytes = new TextEncoder().encode(dataStr);
      const filename = `pubdesk_invoice_profiles_backup.json`;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'backups'
      });

      // Daftarkan ke file manager/smart folder jika belum terdaftar
      const alreadyExists = files.some((f) => f.filename === filename && f.type === 'other');
      if (!alreadyExists) {
        const fileData = {
          filename,
          path: physicalPath,
          type: 'other',
          project_id: undefined,
          version_label: 'Backup',
          status: 'Aktif',
          last_modified: new Date().toISOString(),
          is_readonly: false
        };
        await addFile(fileData);
      }

      showToast(`Backup berhasil diekspor ke: ${physicalPath}`, 'success');

      // Buka folder lokasi berkas
      await tauriInvoke('open_file_location_physically', { path: physicalPath });
    } catch (error) {
      console.error(error);
      showToast('Gagal mengekspor backup.', 'error');
    }
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? 'minmax(0, 1.25fr) minmax(300px, 1fr)' : '1fr', gap: '16px', alignItems: 'start' }}>
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

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
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
              <button 
                type="button"
                className="btn-secondary compact-btn" 
                style={{ height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} 
                onClick={handleExportBackup}
                title="Ekspor Backup JSON"
              >
                📥
              </button>
              <label 
                className="btn-secondary compact-btn" 
                style={{ cursor: 'pointer', height: '32px', width: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0 }}
                title="Impor Backup JSON"
              >
                📤
                <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        {/* Form Editor Profil */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '16px', color: 'var(--text-primary)' }}>
            ✏️ {isEditingNew ? 'Buat Profil Invoice Baru' : `Edit Profil: ${profileName}`}
          </h2>

          <SettingsFormContext.Provider
            value={{
              profileName,
              setProfileName,
              companyName,
              setCompanyName,
              companyTagline,
              setCompanyTagline,
              invoiceTitleText,
              setInvoiceTitleText,
              accentColor,
              setAccentColor,
              accentColorDark,
              setAccentColorDark,
              headerBgColor,
              setHeaderBgColor,
              headerPrimaryColor,
              setHeaderPrimaryColor,
              headerSecondaryColor,
              setHeaderSecondaryColor,
              defaultHal,
              setDefaultHal,
              defaultLampiran,
              setDefaultLampiran,
              salamPembuka,
              setSalamPembuka,
              actionLabel,
              setActionLabel,
              tableType,
              setTableType,
              notes,
              setNotes,
              showSpesifikasi,
              setShowSpesifikasi,
              defaultSpesifikasi,
              setDefaultSpesifikasi,
              signatureOffice,
              setSignatureOffice,
              signatureLocation,
              setSignatureLocation,
              signatureRole,
              setSignatureRole,
              signatureName,
              setSignatureName,
              showBankInfo,
              setShowBankInfo,
              bankName,
              setBankName,
              bankAccountNo,
              setBankAccountNo,
              bankAccountOwner,
              setBankAccountOwner,
              companyLogo,
              setCompanyLogo,
              signatureImg,
              setSignatureImg,
              headerType,
              setHeaderType,
              tableColumns,
              setTableColumns,
              shippingType,
              setShippingType,
              watermarkColor,
              setWatermarkColor,
              watermarkOpacity,
              setWatermarkOpacity,
              invoiceNoFormat,
              setInvoiceNoFormat,
              companyWebsite,
              setCompanyWebsite,
              companyEmail,
              setCompanyEmail,
              companyYoutube,
              setCompanyYoutube,
              companyInstagram,
              setCompanyInstagram,
              companyPhone,
              setCompanyPhone,
              showCompanyContact,
              setShowCompanyContact,
              footerBgColor,
              setFooterBgColor,
              footerPrimaryColor,
              setFooterPrimaryColor,
              footerSecondaryColor,
              setFooterSecondaryColor
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {renderAccordionSection(1, '1. Desain & Identitas Profil', <DesignSection />)}
              {renderAccordionSection(2, '2. Kop Surat & Judul (Header)', <HeaderSection />)}
              {renderAccordionSection(3, '3. Detail Konten Surat', <ContentSection />)}
              {renderAccordionSection(4, '4. Spesifikasi & Catatan (Notes)', <NotesSection />)}
              {renderAccordionSection(5, '5. Tanda Tangan Penutup', <SignatureSection />)}
              {renderAccordionSection(6, '6. Informasi Rekening Bank', <BankSection />)}
              {renderAccordionSection(7, '7. Kolom Tabel Rincian Invoice', <ColumnsSection />)}
              {renderAccordionSection(8, '8. Informasi Kontak Profil', <ContactSection />)}
            </div>
          </SettingsFormContext.Provider>

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
      {rightPanelVisible && (
        <div style={{ position: 'sticky', top: '16px', display: 'flex', flexDirection: 'column', gap: '8px', height: 'calc(100vh - 100px)', minHeight: '400px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            👁️ Realtime Preview
          </h3>
          <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
            <InvoicePreview previewProfile={currentEditingProfile} />
          </div>
        </div>
      )}

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

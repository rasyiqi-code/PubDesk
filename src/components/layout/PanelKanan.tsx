import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import InvoicePreview from '../invoice/InvoicePreview';
import { invoke } from '@tauri-apps/api/core';

const PanelKanan: React.FC = () => {
  const { 
    appState, 
    files, 
    invoices, 
    selectedFileId, 
    setSelectedFileId,
    services, 
    selectedServiceId, 
    activeSettingsTab, 
    showToast, 
    updateFile, 
    refreshAccessToken, 
    gdriveAccounts, 
    refreshAccountToken,
    addFileTag,
    removeFileTag,
    getFileTags,
    setActiveModule,
    selectedInsightMetric
  } = useAppContext();

  const { loadInvoiceToForm } = useInvoiceContext();

  const [fileMetadata, setFileMetadata] = useState<any | null>(null);
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      if ((appState.activeModule !== 'files' && appState.activeModule !== 'invoice-manager') || !selectedFileId) {
        setFileMetadata(null);
        setRelatedFiles([]);
        setCurrentTags([]);
        return;
      }
      const file = files.find(f => f.id === selectedFileId);
      if (!file || file.type === 'invoice' || file.type === 'service') {
        return;
      }

      setLoadingMetadata(true);
      try {
        const metadata = await invoke<any>('get_file_metadata', { fileId: selectedFileId });
        const related = await invoke<any[]>('get_related_files', { fileId: selectedFileId });
        const tags = await getFileTags(selectedFileId);
        setFileMetadata(metadata);
        setRelatedFiles(related);
        setCurrentTags(tags);
      } catch (err) {
        console.error("Gagal memuat metadata berkas:", err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [selectedFileId, appState.activeModule, files]);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !selectedFileId) return;
    
    let tag = newTagInput.trim();
    if (!tag.startsWith('#')) {
      tag = '#' + tag;
    }

    try {
      await addFileTag(selectedFileId, tag);
      setCurrentTags(prev => [...prev.filter(t => t !== tag), tag]);
      setNewTagInput('');
      showToast('Tag berhasil ditambahkan', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan tag', 'error');
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!selectedFileId) return;
    try {
      await removeFileTag(selectedFileId, tag);
      setCurrentTags(prev => prev.filter(t => t !== tag));
      showToast('Tag berhasil dihapus', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus tag', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const file = files.find(f => f.id === selectedFileId);
    if (!file) return;
    try {
      await updateFile({
        ...file,
        status: newStatus
      });
      setFileMetadata((prev: any) => prev ? { ...prev, status: newStatus } : null);
      showToast('Status berkas berhasil diperbarui', 'success');
    } catch (err) {
      console.error("Gagal memperbarui status berkas:", err);
      showToast('Gagal memperbarui status berkas', 'error');
    }
  };

  const renderPreview = () => {
    switch (appState.activeModule) {
      case 'invoice':
        return <InvoicePreview />;
      case 'extractor':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Preview Extractor akan segera tersedia</p>
          </div>
        );
      case 'invoice-manager':
      case 'files': {
        const file = files.find(f => f.id === selectedFileId);
        if (!file) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>Pilih berkas invoice untuk melihat pratinjau</p>
            </div>
          );
        }

        if (file.type === 'invoice') {
          const invoiceId = file.version_label ? parseInt(file.version_label) : null;
          const invoice = invoices.find(inv => inv.id === invoiceId);
          if (invoice) {
            let metadata = {
              invoiceNo: '',
              invoiceDate: '',
              invoiceHal: '',
              invoiceLampiran: '',
              paymentStatus: 'LUNAS',
              spesifikasiFasilitas: '',
              customerName: '',
              customerWa: '',
              customerAddress: ''
            };
            try {
              if (invoice.file_path) {
                metadata = JSON.parse(invoice.file_path);
              }
            } catch (e) {
              console.error("Failed to parse invoice metadata JSON:", e);
            }

            let items = [];
            try {
              items = JSON.parse(invoice.items_json);
            } catch (e) {
              console.error("Failed to parse invoice items JSON:", e);
            }

            const overrideInvoice = {
              customerName: metadata.customerName || '',
              waNumber: metadata.customerWa || '',
              address: metadata.customerAddress || '',
              items: items,
              shippingCost: invoice.shipping_cost,
              adminFee: invoice.admin_fee,
              invoiceType: invoice.export_format || '',
              invoiceNo: metadata.invoiceNo || '',
              invoiceHal: metadata.invoiceHal || '',
              invoiceLampiran: metadata.invoiceLampiran || '',
              invoiceDate: metadata.invoiceDate || '',
              paymentStatus: metadata.paymentStatus || 'LUNAS',
              spesifikasiFasilitas: metadata.spesifikasiFasilitas || ''
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                <div style={{ padding: '8px 16px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '8px', zIndex: 10 }}>
                  <button
                    className="btn-primary compact-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      loadInvoiceToForm(invoice);
                      setActiveModule('invoice');
                    }}
                    style={{ height: '32px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '0 12px' }}
                  >
                    <span>📝</span> Edit / Muat ke Generator
                  </button>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <InvoicePreview overrideInvoice={overrideInvoice} />
                </div>
              </div>
            );
          }
        } else if (file.type === 'service') {
          const serviceId = file.version_label ? parseInt(file.version_label) : null;
          const service = services.find(s => s.id === serviceId);
          if (service) {
            const formatPrice = (amount: number) => {
              return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
            };

            const getCategoryLabel = (cat: string) => {
              switch (cat) {
                case 'penerbitan': return 'Layanan Penerbitan';
                case 'desain_layout': return 'Desain & Layout';
                case 'haki': return 'Pendaftaran HAKI';
                case 'isbn': return 'Pengajuan ISBN';
                case 'mitra': return 'Layanan Mitra';
                default: return 'Lainnya';
              }
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '30px', overflow: 'auto', alignItems: 'center' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Detail Visual Layanan</h3>
                
                <div style={{
                  width: '100%',
                  padding: '24px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #c01c1c 0%, #e04a4a 100%)',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                  color: '#ffffff',
                  marginBottom: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '96px', opacity: 0.15, userSelect: 'none' }}>🛠️</div>
                  <span style={{ fontSize: '48px' }}>🛠️</span>
                  <div>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      textTransform: 'uppercase'
                    }}>
                      {getCategoryLabel(service.category)}
                    </span>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', textAlign: 'center', lineHeight: '1.3' }}>{service.name}</h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Kategori</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(service.category)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tarif Dasar</span>
                      <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{formatPrice(service.price)}</strong>
                    </div>
                  </div>

                  {service.description && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Deskripsi Layanan</span>
                      <div style={{
                        background: 'var(--bg-card)',
                        padding: '14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {service.description}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        } else if (file.type === 'gdrive') {
          const parseModifiedBy = (modifiedBy?: string) => {
            if (!modifiedBy) return { size: '0', parentId: 'root', shared: '0', accountEmail: '' };
            const parts = modifiedBy.split('|');
            return {
              size: parts[0] || '0',
              parentId: parts[1] || 'root',
              shared: parts[2] || '0',
              accountEmail: parts[3] || ''
            };
          };

          const handleOpenGDrivePhysically = async (e: React.MouseEvent) => {
            e.stopPropagation();
            try {
              const fileId = file.path.replace('gdrive://', '');
              const { accountEmail } = parseModifiedBy(file.modified_by);
              
              let account = gdriveAccounts.find(acc => acc.email === accountEmail);
              let token = account ? account.token : localStorage.getItem('gdrive_token');
              
              if (!token && accountEmail && refreshAccountToken) {
                showToast('Memperbarui koneksi akun Google...', 'info');
                token = await refreshAccountToken(accountEmail);
              } else if (!token && refreshAccessToken) {
                showToast('Memperbarui koneksi Google Drive...', 'info');
                token = await refreshAccessToken();
              }
              
              if (!token) {
                showToast('Google Drive belum dikonfigurasi. Hubungkan akun di Pengaturan.', 'error');
                return;
              }

              showToast('Mengunduh berkas dari Google Drive...', 'info');
              const mimeType = file.version_label || '';
              const isGoogleDoc = mimeType.startsWith('application/vnd.google-apps.');
              
              let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
              let filename = file.filename;
              
              if (isGoogleDoc) {
                let exportMime = 'application/pdf';
                let ext = '.pdf';
                
                if (mimeType === 'application/vnd.google-apps.document') {
                  exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                  ext = '.docx';
                } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
                  exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                  ext = '.xlsx';
                } else if (mimeType === 'application/vnd.google-apps.presentation') {
                  exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                  ext = '.pptx';
                }
                
                url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`;
                
                if (!filename.toLowerCase().endsWith(ext)) {
                  filename = filename + ext;
                }
              }

              let response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.status === 401) {
                showToast('Token kedaluwarsa. Memperbarui token...', 'info');
                let newToken = null;
                if (accountEmail && refreshAccountToken) {
                  newToken = await refreshAccountToken(accountEmail);
                } else if (refreshAccessToken) {
                  newToken = await refreshAccessToken();
                }
                
                if (newToken) {
                  token = newToken;
                  response = await fetch(url, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                }
              }

              if (!response.ok) {
                throw new Error('HTTP error');
              }

              const buffer = await response.arrayBuffer();
              const bytes = new Uint8Array(buffer);

              const localPath = await invoke<string>('create_physical_file', {
                filename: filename,
                bytes: Array.from(bytes),
                folder: 'gdrive_cache'
              });

              await updateFile({
                ...file,
                status: 'Tersimpan'
              });

              showToast('Membuka berkas...', 'info');
              await invoke('open_file_physically', { path: localPath });
            } catch (error) {
              console.error(error);
              showToast('Gagal membuka berkas Drive', 'error');
            }
          };

          const handleOpenInBrowser = () => {
            const fileId = file.path.replace('gdrive://', '');
            const url = `https://drive.google.com/open?id=${fileId}`;
            window.open(url, '_blank');
          };

          const handleCopyLink = () => {
            const fileId = file.path.replace('gdrive://', '');
            const url = `https://drive.google.com/open?id=${fileId}`;
            navigator.clipboard.writeText(url);
            showToast('Link Google Drive berhasil disalin', 'success');
          };

          const formatBytes = (bytesStr?: string) => {
            if (!bytesStr) return '-';
            const sizePart = bytesStr.split('|')[0] || '0';
            const bytes = parseInt(sizePart);
            if (isNaN(bytes)) return sizePart;
            if (bytes === 0 || file.version_label === 'application/vnd.google-apps.folder') return '-';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          };

          const getMimeLabel = (mime?: string) => {
            if (!mime) return 'Berkas Cloud';
            if (mime.startsWith('application/vnd.google-apps.')) {
              return mime.replace('application/vnd.google-apps.', 'Google ').toUpperCase();
            }
            return mime;
          };

          const isFolder = file.version_label === 'application/vnd.google-apps.folder';

          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '30px', overflow: 'auto', alignItems: 'center' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                {isFolder ? 'Detail Folder Google Drive' : 'Detail Berkas Google Drive'}
              </h3>
              
              <div style={{
                width: '100%',
                padding: '24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                color: '#ffffff',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '96px', opacity: 0.05, userSelect: 'none' }}>
                  {isFolder ? '📁' : '☁️'}
                </div>
                <span style={{ fontSize: '48px' }}>{isFolder ? '📁' : '☁️'}</span>
                <div>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: isFolder ? 'rgba(30, 144, 255, 0.2)' : (file.status === 'Tersimpan' ? 'rgba(46, 194, 126, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
                    backdropFilter: 'blur(4px)',
                    color: isFolder ? '#1e90ff' : (file.status === 'Tersimpan' ? '#2ec27e' : '#e5e7eb'),
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {isFolder ? 'Folder Cloud' : (file.status === 'Tersimpan' ? 'Tersimpan Lokal (Cached)' : 'Tersedia di Cloud')}
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0', textAlign: 'center', lineHeight: '1.3', wordBreak: 'break-all' }}>{file.filename}</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ukuran File</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(file.modified_by)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Format MIME</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '11px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.version_label}>{getMimeLabel(file.version_label)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Modifikasi Terakhir</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{new Date(file.last_modified).toLocaleString('id-ID')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>ID File</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'monospace' }}>{file.path.replace('gdrive://', '').substring(0, 12)}...</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {!isFolder ? (
                    <button
                      className="btn-primary compact-btn"
                      onClick={handleOpenGDrivePhysically}
                      style={{ width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>📥</span> {file.status === 'Tersimpan' ? 'Buka Berkas Native' : 'Unduh & Buka Native'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '8px', lineHeight: '1.4' }}>
                      💡 <strong>Klik dua kali</strong> pada baris folder di sebelah kiri untuk masuk dan menjelajah isinya.
                    </div>
                  )}

                  <button
                    className="btn-secondary compact-btn"
                    onClick={handleOpenInBrowser}
                    style={{ width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-card)' }}
                  >
                    <span>🌐</span> Buka di Web Browser
                  </button>

                  <button
                    className="btn-secondary compact-btn"
                    onClick={handleCopyLink}
                    style={{ width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-card)' }}
                  >
                    <span>📋</span> {isFolder ? 'Salin Link Folder' : 'Salin Link Drive'}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        if (loadingMetadata) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              <span style={{ fontSize: '13px' }}>Memuat metadata & analisis berkas...</span>
            </div>
          );
        }

        if (!fileMetadata) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Pratinjau untuk berkas ini tidak tersedia</p>
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '24px', overflowY: 'auto' }}>
            {/* Header Inspektur Berkas */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                🔍 Inspektur Berkas Cerdas
              </h3>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0', wordBreak: 'break-all' }}>
                {fileMetadata.filename}
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: 'rgba(192, 28, 28, 0.1)',
                  color: 'var(--accent)',
                  textTransform: 'uppercase'
                }}>
                  {fileMetadata.type}
                </span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: 'rgba(0, 0, 0, 0.05)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase'
                }}>
                  {fileMetadata.version_label || 'Lokal'}
                </span>
              </div>
            </div>

            {/* Status Berkas */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Status Berkas
              </h5>
              {file?.type === 'gdrive' ? (
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background: file.status === 'Tersimpan' ? 'rgba(46, 194, 126, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                  color: file.status === 'Tersimpan' ? '#2ec27e' : 'var(--text-secondary)'
                }}>
                  {file.status === 'Tersimpan' ? 'Tersimpan Lokal' : 'Tersedia di Cloud'}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={fileMetadata.status || 'draft'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="final">Final</option>
                  </select>
                </div>
              )}
            </div>

            {/* Entitas Terdeteksi */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Entitas Terdeteksi
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {fileMetadata.entities.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Tidak ada entitas penerbitan khusus yang terdeteksi.
                  </span>
                ) : (
                  fileMetadata.entities.filter((ent: any) => ent.entity_type !== 'hash').map((ent: any, idx: number) => {
                    let icon = '📑';
                    if (ent.entity_type === 'judul') icon = '📖';
                    if (ent.entity_type === 'penulis') icon = '✍️';
                    if (ent.entity_type === 'bab') icon = '📑';
                    if (ent.entity_type === 'ISBN') icon = '🔢';
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: idx < fileMetadata.entities.filter((e: any) => e.entity_type !== 'hash').length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: idx < fileMetadata.entities.filter((e: any) => e.entity_type !== 'hash').length - 1 ? '6px' : '0' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {icon} <span style={{ textTransform: 'capitalize' }}>{ent.entity_type}</span>
                        </span>
                        <strong style={{ color: 'var(--text-primary)' }}>{ent.entity_value}</strong>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tag Berkas */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Tag Berkas
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {currentTags.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      Belum ada tag untuk berkas ini.
                    </span>
                  ) : (
                    currentTags.map(tag => (
                      <span key={tag} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}>
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            fontWeight: 'bold'
                          }}
                          title="Hapus tag"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
                
                <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <input
                    type="text"
                    placeholder="Tambah tag baru (misal: #final)..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Tambah
                  </button>
                </form>
              </div>
            </div>

            {/* Ringkasan Otomatis */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Ringkasan Konten Otomatis
              </h5>
              <div style={{
                background: 'var(--bg-card)',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: '1.5',
                fontStyle: 'italic'
              }}>
                "{fileMetadata.summary || 'Tidak ada konten teks untuk dirangkum.'}"
              </div>
            </div>

            {/* Berkas Terkait & Garis Waktu Versi */}
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Linimasa Versi & Relasi Berkas
              </h5>
              {relatedFiles.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  Tidak ada berkas terkait atau versi lain terdeteksi.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '16px', borderLeft: '2px solid var(--border)', gap: '16px', marginLeft: '6px' }}>
                  {relatedFiles.map((rel: any, idx: number) => {
                    const isVersion = rel.relation_type === 'version_of';
                    const isDup = rel.relation_type === 'duplicate_of';
                    
                    let badgeColor = 'rgba(30, 144, 255, 0.15)';
                    let badgeTextColor = '#1e90ff';
                    let badgeText = 'Terkait';
                    
                    if (isVersion) {
                      badgeColor = 'rgba(46, 194, 126, 0.15)';
                      badgeTextColor = '#2ec27e';
                      badgeText = `Revisi (${Math.round(rel.confidence * 100)}%)`;
                    } else if (isDup) {
                      badgeColor = 'rgba(239, 68, 68, 0.15)';
                      badgeTextColor = '#ef4444';
                      badgeText = 'Duplikat Persis';
                    }

                    return (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* Bullet point on the timeline line */}
                        <div style={{
                          position: 'absolute',
                          left: '-23px',
                          top: '12px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: isDup ? '#ef4444' : (isVersion ? '#2ec27e' : '#1e90ff'),
                          border: '2.5px solid var(--bg-panel)',
                          boxShadow: '0 0 0 1px var(--border)'
                        }} />
                        
                        <div 
                          onClick={() => {
                            const found = files.find(f => f.id === rel.file_id);
                            if (found) {
                              setSelectedFileId(rel.file_id);
                            }
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-panel)';
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.06)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--bg-card)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
                          }}
                          title="Klik untuk melihat berkas ini"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--bg-card)',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            fontSize: '12px',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: '700',
                              background: badgeColor,
                              color: badgeTextColor,
                              textTransform: 'uppercase'
                            }}>
                              {badgeText}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                              {new Date(rel.last_modified).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          
                          <span 
                            style={{ fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all' }}
                          >
                            {rel.filename}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'services': {
        const service = services.find(s => s.id === selectedServiceId);
        if (!service) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</span>
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', marginBottom: '6px', textAlign: 'center' }}>Master Manajemen Layanan</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>Pilih salah satu layanan dari tabel master untuk melihat detail visual rincian layanan jasa.</p>
            </div>
          );
        }

        const formatPrice = (amount: number) => {
          return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        };

        const getCategoryLabel = (cat: string) => {
          switch (cat) {
            case 'penerbitan': return 'Layanan Penerbitan';
            case 'desain_layout': return 'Desain & Layout';
            case 'haki': return 'Pendaftaran HAKI';
            case 'isbn': return 'Pengajuan ISBN';
            case 'mitra': return 'Layanan Mitra';
            default: return 'Lainnya';
          }
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '30px', overflow: 'auto', alignItems: 'center' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Detail Visual Layanan</h3>
            
            <div style={{
              width: '100%',
              padding: '24px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #c01c1c 0%, #e04a4a 100%)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
              color: '#ffffff',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '96px', opacity: 0.15, userSelect: 'none' }}>🛠️</div>
              <span style={{ fontSize: '48px' }}>🛠️</span>
              <div>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  textTransform: 'uppercase'
                }}>
                  {getCategoryLabel(service.category)}
                </span>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', textAlign: 'center', lineHeight: '1.3' }}>{service.name}</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Kategori</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(service.category)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tarif Dasar</span>
                  <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{formatPrice(service.price)}</strong>
                </div>
              </div>

              {service.description && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Deskripsi Layanan</span>
                  <div style={{
                    background: 'var(--bg-card)',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {service.description}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', fontStyle: 'italic', marginTop: '12px' }}>
                Layanan ini dapat digabungkan dalam katalog penawaran atau invoice jasa penerbitan.
              </div>
            </div>
          </div>
        );
      }
      case 'ledger':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Preview Ledger akan segera tersedia</p>
          </div>
        );
      case 'settings': {
        if (activeSettingsTab === 'services') {
          const service = services.find(s => s.id === selectedServiceId);
          if (!service) {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <span style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</span>
                <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600', marginBottom: '6px', textAlign: 'center' }}>Master Manajemen Layanan</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>Pilih salah satu layanan dari tabel master untuk melihat detail visual rincian layanan jasa.</p>
              </div>
            );
          }

          const formatPrice = (amount: number) => {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
          };

          const getCategoryLabel = (cat: string) => {
            switch (cat) {
              case 'penerbitan': return 'Layanan Penerbitan';
              case 'desain_layout': return 'Desain & Layout';
              case 'haki': return 'Pendaftaran HAKI';
              case 'isbn': return 'Pengajuan ISBN';
              case 'mitra': return 'Layanan Mitra';
              default: return 'Lainnya';
            }
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '30px', overflow: 'auto', alignItems: 'center' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Detail Visual Layanan</h3>
              
              <div style={{
                width: '100%',
                padding: '24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #c01c1c 0%, #e04a4a 100%)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
                color: '#ffffff',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '96px', opacity: 0.15, userSelect: 'none' }}>🛠️</div>
                <span style={{ fontSize: '48px' }}>🛠️</span>
                <div>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    textTransform: 'uppercase'
                  }}>
                    {getCategoryLabel(service.category)}
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', textAlign: 'center', lineHeight: '1.3' }}>{service.name}</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kategori</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(service.category)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tarif Dasar</span>
                    <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>{formatPrice(service.price)}</strong>
                  </div>
                </div>

                {service.description && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Deskripsi Layanan</span>
                    <div style={{
                      background: 'var(--bg-card)',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {service.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Preview Settings akan segera tersedia</p>
          </div>
        );
      }
      case 'invoice-insight': {
        const metric = selectedInsightMetric || 'total';
        
        // Filter invoice berdasarkan metrik
        const filtered = invoices.filter(inv => {
          let metadata = { paymentStatus: 'PENDING' };
          try {
            if (inv.file_path) metadata = JSON.parse(inv.file_path);
          } catch {}
          
          const status = metadata.paymentStatus || 'PENDING';
          
          if (metric === 'lunas') return status === 'LUNAS';
          if (metric === 'belum_lunas') return status === 'BELUM LUNAS';
          if (metric === 'pending') return status === 'PENDING';
          return true; // total
        });

        const formatPrice = (amount: number) => {
          return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
        };

        const getMetricTitle = () => {
          switch (metric) {
            case 'lunas': return '🟢 Pembayaran Lunas';
            case 'belum_lunas': return '🔴 Piutang Belum Lunas';
            case 'pending': return '🟡 Pembayaran Pending';
            case 'total':
            default:
              return '📊 Ringkasan Total Invoice';
          }
        };

        const getMetricDescription = () => {
          switch (metric) {
            case 'lunas':
              return 'Dana dari invoice ini telah masuk ke rekening usaha Anda sepenuhnya. Transaksi selesai dan catatan keuangan bersih.';
            case 'belum_lunas':
              return 'Invoice ini merupakan piutang aktif yang belum dibayar oleh pelanggan. Disarankan untuk segera mengirimkan pengingat tagihan.';
            case 'pending':
              return 'Invoice ini sudah dibuat namun status pembayarannya masih tertunda atau dalam proses verifikasi bank.';
            case 'total':
            default:
              return 'Menampilkan seluruh invoice yang terbit di sistem. Analisis ini mencakup omzet kotor baik yang sudah cair maupun piutang.';
          }
        };

        const totalValue = filtered.reduce((acc, curr) => acc + curr.total, 0);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '20px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{getMetricTitle()}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              {getMetricDescription()}
            </p>

            {/* Total Ringkasan */}
            <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Akumulasi Nominal:</span>
              <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{formatPrice(totalValue)}</strong>
            </div>

            {/* Daftar Invoice */}
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Daftar Invoice ({filtered.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '13px' }}>
                  Tidak ada invoice dalam kategori ini.
                </div>
              ) : (
                filtered.map(inv => {
                  let metadata = { invoiceNo: '-', customerName: 'Umum', invoiceDate: '-' };
                  try {
                    if (inv.file_path) metadata = JSON.parse(inv.file_path);
                  } catch {}

                  return (
                    <div 
                      key={inv.id} 
                      style={{ 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setActiveModule('invoice-manager');
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{metadata.invoiceNo || 'DRAF'}</strong>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{formatPrice(inv.total)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <span>{metadata.customerName || 'Umum'}</span>
                        <span>{metadata.invoiceDate || new Date(inv.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      }
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Pilih menu untuk melihat preview yang relevan</p>
          </div>
        );
    }
  };

  return renderPreview();
};

export default PanelKanan;

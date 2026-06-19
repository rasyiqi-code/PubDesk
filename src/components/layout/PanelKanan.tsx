import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import InvoicePreview from '../invoice/InvoicePreview';
import { invoke } from '@tauri-apps/api/core';

const PanelKanan: React.FC = () => {
  const { appState, files, invoices, selectedFileId, services, selectedServiceId, activeSettingsTab, showToast, updateFile, refreshAccessToken, gdriveAccounts, refreshAccountToken } = useAppContext();

  const [fileMetadata, setFileMetadata] = useState<any | null>(null);
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (appState.activeModule !== 'files' || !selectedFileId) {
        setFileMetadata(null);
        setRelatedFiles([]);
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
        setFileMetadata(metadata);
        setRelatedFiles(related);
      } catch (err) {
        console.error("Gagal memuat metadata berkas:", err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [selectedFileId, appState.activeModule, files]);

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

            return <InvoicePreview overrideInvoice={overrideInvoice} />;
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
                  {fileMetadata.r#type}
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
                  fileMetadata.entities.map((ent: any, idx: number) => {
                    let icon = '📑';
                    if (ent.entity_type === 'judul') icon = '📖';
                    if (ent.entity_type === 'penulis') icon = '✍️';
                    if (ent.entity_type === 'bab') icon = '📑';
                    if (ent.entity_type === 'ISBN') icon = '🔢';
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: idx < fileMetadata.entities.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: idx < fileMetadata.entities.length - 1 ? '6px' : '0' }}>
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
              <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Berkas Terkait & Versi
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {relatedFiles.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                    Tidak ada berkas terkait dengan kemiripan tinggi.
                  </span>
                ) : (
                  relatedFiles.map((rel: any, idx: number) => {
                    const isVersion = rel.relation_type === 'version_of';
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-card)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: '700',
                            background: isVersion ? 'rgba(46, 194, 126, 0.15)' : 'rgba(30, 144, 255, 0.15)',
                            color: isVersion ? '#2ec27e' : '#1e90ff',
                            textTransform: 'uppercase'
                          }}>
                            {isVersion ? `Versi Lain (${Math.round(rel.confidence * 100)}%)` : 'Terkait'}
                          </span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                            {new Date(rel.last_modified).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                          {rel.filename}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
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

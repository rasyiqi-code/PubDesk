import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../contexts/AppContext';
import { useInvoiceContext } from '../../../contexts/InvoiceContext';
import InvoicePreview from '../../invoice/InvoicePreview';

interface FilePreviewPanelProps {
  /** ID berkas yang dipilih */
  selectedFileId: number | null;
}

// Helper parse modified_by metadata field
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

// Format ukuran file dari string bytes
const formatBytes = (modifiedBy?: string, mimeType?: string): string => {
  if (!modifiedBy) return '-';
  const sizePart = modifiedBy.split('|')[0] || '0';
  const bytes = parseInt(sizePart);
  if (isNaN(bytes) || bytes === 0) return '-';
  if (mimeType === 'application/vnd.google-apps.folder') return '-';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format MIME ke label mudah dibaca
const getMimeLabel = (mime?: string): string => {
  if (!mime) return 'Berkas Cloud';
  if (mime.startsWith('application/vnd.google-apps.')) {
    return mime.replace('application/vnd.google-apps.', 'Google ').toUpperCase();
  }
  return mime;
};

/**
 * Panel kanan untuk konteks modul Smart Folders dan Manajemen Invoice.
 * Menampilkan preview berkas (lokal, GDrive, atau invoice PDF).
 */
const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({ selectedFileId }) => {
  const {
    files,
    invoices,
    updateFile,
    showToast,
    refreshAccessToken,
    gdriveAccounts,
    refreshAccountToken,
    addFileTag,
    removeFileTag,
    getFileTags,
    setActiveModule,
  } = useAppContext();

  const { loadInvoiceToForm } = useInvoiceContext();

  const [fileMetadata, setFileMetadata] = useState<any | null>(null);
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!selectedFileId) {
        setFileMetadata(null);
        setRelatedFiles([]);
        setCurrentTags([]);
        return;
      }

      const file = files.find(f => f.id === selectedFileId);
      // Berkas invoice dan service tidak perlu metadata semantik
      if (!file || file.type === 'invoice' || file.type === 'service' || file.type === 'gdrive') {
        setFileMetadata(null);
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
        console.error('Gagal memuat metadata berkas:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [selectedFileId, files]);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !selectedFileId) return;
    let tag = newTagInput.trim();
    if (!tag.startsWith('#')) tag = '#' + tag;
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
      await updateFile({ ...file, status: newStatus });
      setFileMetadata((prev: any) => prev ? { ...prev, status: newStatus } : null);
      showToast('Status berkas berhasil diperbarui', 'success');
    } catch (err) {
      console.error('Gagal memperbarui status berkas:', err);
      showToast('Gagal memperbarui status berkas', 'error');
    }
  };

  // ---------- Tidak ada berkas terpilih ----------
  if (!selectedFileId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
          Pilih berkas untuk melihat pratinjau
        </p>
      </div>
    );
  }

  const file = files.find(f => f.id === selectedFileId);
  if (!file) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
          Pilih berkas invoice untuk melihat pratinjau
        </p>
      </div>
    );
  }

  // ---------- Berkas Invoice — render InvoicePreview ----------
  if (file.type === 'invoice') {
    const invoiceId = file.version_label ? parseInt(file.version_label) : null;
    const invoice = invoices.find(inv => inv.id === invoiceId);

    if (!invoice) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '13px' }}>Data invoice tidak ditemukan</span>
        </div>
      );
    }

    let metadata: any = { invoiceNo: '', invoiceDate: '', invoiceHal: '', invoiceLampiran: '', paymentStatus: 'LUNAS', spesifikasiFasilitas: '', customerName: '', customerWa: '', customerAddress: '' };
    try { if (invoice.file_path) metadata = JSON.parse(invoice.file_path); } catch {}

    let items: any[] = [];
    try { items = JSON.parse(invoice.items_json); } catch {}

    const overrideInvoice = {
      customerName: metadata.customerName || '',
      waNumber: metadata.customerWa || '',
      address: metadata.customerAddress || '',
      items,
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
            onClick={() => { loadInvoiceToForm(invoice); setActiveModule('invoice'); }}
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

  // ---------- Berkas GDrive ----------
  if (file.type === 'gdrive') {
    const isFolder = file.version_label === 'application/vnd.google-apps.folder';
    const { accountEmail } = parseModifiedBy(file.modified_by);

    const handleOpenGDrivePhysically = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const fileId = file.path.replace('gdrive://', '');
        let account = gdriveAccounts.find(acc => acc.email === accountEmail);
        let token = account ? account.token : localStorage.getItem('gdrive_token');

        if (!token && accountEmail && refreshAccountToken) {
          showToast('Memperbarui koneksi akun Google...', 'info');
          token = await refreshAccountToken(accountEmail);
        } else if (!token && refreshAccessToken) {
          showToast('Memperbarui koneksi Google Drive...', 'info');
          token = await refreshAccessToken();
        }

        if (!token) { showToast('Google Drive belum dikonfigurasi. Hubungkan akun di Pengaturan.', 'error'); return; }

        showToast('Mengunduh berkas dari Google Drive...', 'info');
        const mimeType = file.version_label || '';
        const isGoogleDoc = mimeType.startsWith('application/vnd.google-apps.');
        let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        let filename = file.filename;

        if (isGoogleDoc) {
          let exportMime = 'application/pdf';
          let ext = '.pdf';
          if (mimeType === 'application/vnd.google-apps.document') { exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; ext = '.docx'; }
          else if (mimeType === 'application/vnd.google-apps.spreadsheet') { exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; ext = '.xlsx'; }
          else if (mimeType === 'application/vnd.google-apps.presentation') { exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'; ext = '.pptx'; }
          url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMime)}`;
          if (!filename.toLowerCase().endsWith(ext)) filename = filename + ext;
        }

        let response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

        if (response.status === 401) {
          showToast('Token kedaluwarsa. Memperbarui token...', 'info');
          let newToken = null;
          if (accountEmail && refreshAccountToken) newToken = await refreshAccountToken(accountEmail);
          else if (refreshAccessToken) newToken = await refreshAccessToken();
          if (newToken) { token = newToken; response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } }); }
        }

        if (!response.ok) throw new Error('HTTP error');
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        const localPath = await invoke<string>('create_physical_file', { filename, bytes: Array.from(bytes), folder: 'gdrive_cache' });
        await updateFile({ ...file, status: 'Tersimpan' });
        showToast('Membuka berkas...', 'info');
        await invoke('open_file_physically', { path: localPath });
      } catch (error) {
        console.error(error);
        showToast('Gagal membuka berkas Drive', 'error');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '30px', overflow: 'auto', alignItems: 'center' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {isFolder ? 'Detail Folder Google Drive' : 'Detail Berkas Google Drive'}
        </h3>

        <div style={{ width: '100%', padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', boxShadow: '0 12px 28px rgba(0,0,0,0.15)', color: '#ffffff', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '96px', opacity: 0.05, userSelect: 'none' }}>{isFolder ? '📁' : '☁️'}</div>
          <span style={{ fontSize: '48px' }}>{isFolder ? '📁' : '☁️'}</span>
          <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: isFolder ? 'rgba(30, 144, 255, 0.2)' : (file.status === 'Tersimpan' ? 'rgba(46, 194, 126, 0.2)' : 'rgba(255, 255, 255, 0.1)'), backdropFilter: 'blur(4px)', color: isFolder ? '#1e90ff' : (file.status === 'Tersimpan' ? '#2ec27e' : '#e5e7eb'), textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>
            {isFolder ? 'Folder Cloud' : (file.status === 'Tersimpan' ? 'Tersimpan Lokal (Cached)' : 'Tersedia di Cloud')}
          </span>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, textAlign: 'center', wordBreak: 'break-all' }}>{file.filename}</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ukuran File</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(file.modified_by, file.version_label)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Format MIME</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '11px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.version_label}>{getMimeLabel(file.version_label)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Modifikasi Terakhir</span>
              <strong style={{ color: 'var(--text-primary)' }}>{new Date(file.last_modified).toLocaleString('id-ID')}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!isFolder ? (
              <button className="btn-primary compact-btn" onClick={handleOpenGDrivePhysically} style={{ width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>📥</span> {file.status === 'Tersimpan' ? 'Buka Berkas Native' : 'Unduh & Buka Native'}
              </button>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', lineHeight: '1.4' }}>
                💡 <strong>Klik dua kali</strong> pada baris folder di sebelah kiri untuk masuk dan menjelajah isinya.
              </div>
            )}
            <button className="btn-secondary compact-btn" onClick={() => window.open(`https://drive.google.com/open?id=${file.path.replace('gdrive://', '')}`, '_blank')} style={{ width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-card)' }}>
              <span>🌐</span> Buka di Web Browser
            </button>
            <button className="btn-secondary compact-btn" onClick={() => { navigator.clipboard.writeText(`https://drive.google.com/open?id=${file.path.replace('gdrive://', '')}`); showToast('Link Google Drive berhasil disalin', 'success'); }} style={{ width: '100%', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-card)' }}>
              <span>📋</span> {isFolder ? 'Salin Link Folder' : 'Salin Link Drive'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Loading metadata ----------
  if (loadingMetadata) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '13px' }}>Memuat metadata & analisis berkas...</span>
      </div>
    );
  }

  // ---------- Tidak ada metadata ----------
  if (!fileMetadata) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>Pratinjau untuk berkas ini tidak tersedia</p>
      </div>
    );
  }

  // ---------- Berkas lokal — tampilkan metadata semantik ----------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-panel)', padding: '24px', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          🔍 Inspektur Berkas Cerdas
        </h3>
        <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 6px 0', wordBreak: 'break-all' }}>
          {fileMetadata.filename}
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: 'rgba(192, 28, 28, 0.1)', color: 'var(--accent)', textTransform: 'uppercase' }}>
            {fileMetadata.type}
          </span>
          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {fileMetadata.version_label || 'Lokal'}
          </span>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Status Berkas</h5>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={fileMetadata.status || 'draft'}
            onChange={e => handleStatusChange(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
          >
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="final">Final</option>
          </select>
        </div>
      </div>

      {/* Entitas */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Entitas Terdeteksi</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {fileMetadata.entities.length === 0 ? (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Tidak ada entitas penerbitan khusus yang terdeteksi.</span>
          ) : (
            fileMetadata.entities.filter((ent: any) => ent.entity_type !== 'hash').map((ent: any, idx: number) => {
              const iconMap: Record<string, string> = { judul: '📖', penulis: '✍️', bab: '📑', ISBN: '🔢' };
              const icon = iconMap[ent.entity_type] || '📑';
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

      {/* Tag */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tag Berkas</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {currentTags.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Belum ada tag untuk berkas ini.</span>
            ) : (
              currentTags.map(tag => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} style={{ border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', padding: '0 2px', fontSize: '10px', display: 'flex', alignItems: 'center', fontWeight: 'bold' }} title="Hapus tag">×</button>
                </span>
              ))
            )}
          </div>
          <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <input
              type="text"
              placeholder="Tambah tag baru (misal: #final)..."
              value={newTagInput}
              onChange={e => setNewTagInput(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '12px', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--accent)', color: '#ffffff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              Tambah
            </button>
          </form>
        </div>
      </div>

      {/* Ringkasan */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Ringkasan Konten Otomatis</h5>
        <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', fontStyle: 'italic' }}>
          "{fileMetadata.summary || 'Tidak ada konten teks untuk dirangkum.'}"
        </div>
      </div>

      {/* Linimasa Versi */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>Linimasa Versi & Relasi Berkas</h5>
        {relatedFiles.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
            Tidak ada berkas terkait atau versi lain terdeteksi.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '16px', borderLeft: '2px solid var(--border)', gap: '16px', marginLeft: '6px' }}>
            {relatedFiles.map((rel: any, idx: number) => {
              const isVersion = rel.relation_type === 'version_of';
              const isDup = rel.relation_type === 'duplicate_of';
              const dotColor = isDup ? '#ef4444' : (isVersion ? '#2ec27e' : '#1e90ff');
              const badgeColor = isDup ? 'rgba(239, 68, 68, 0.15)' : (isVersion ? 'rgba(46, 194, 126, 0.15)' : 'rgba(30, 144, 255, 0.15)');
              const badgeText = isDup ? 'Duplikat Persis' : (isVersion ? `Revisi (${Math.round(rel.confidence * 100)}%)` : 'Terkait');
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-23px', top: '12px', width: '12px', height: '12px', borderRadius: '50%', background: dotColor, border: '2.5px solid var(--bg-panel)', boxShadow: '0 0 0 1px var(--border)' }} />
                  <div
                    onClick={() => { const found = files.find(f => f.id === rel.file_id); if (found) { /* setSelectedFileId handled by parent */ } }}
                    style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '12px', gap: '6px', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-panel)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', background: badgeColor, color: dotColor, textTransform: 'uppercase' }}>{badgeText}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{new Date(rel.last_modified).toLocaleDateString('id-ID')}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{rel.filename}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePreviewPanel;

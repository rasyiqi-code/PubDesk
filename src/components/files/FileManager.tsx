import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';

interface FileManagerProps {
  searchQuery: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ searchQuery }) => {
  const { files, deleteFile, updateFile, selectedFileId, setSelectedFileId, showToast, fileCategory, showConfirm } = useAppContext();

  // Handler Buka Berkas Fisik via Rust Backend
  const handleOpenFile = async (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    const path = file.path;
    if (path.startsWith('gdrive://')) {
      const fileId = path.replace('gdrive://', '');
      const token = localStorage.getItem('gdrive_token');
      if (!token) {
        showToast('Google Drive belum dikonfigurasi. Atur token di Pengaturan.', 'error');
        return;
      }

      showToast('Mengunduh berkas dari Google Drive...', 'info');
      try {
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

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        const localPath = await invoke<string>('create_physical_file', {
          filename: filename,
          bytes: Array.from(bytes),
          folder: 'gdrive_cache'
        });

        // Update status di DB
        await updateFile({
          ...file,
          status: 'Tersimpan'
        });

        showToast('Membuka berkas...', 'info');
        await invoke('open_file_physically', { path: localPath });
      } catch (error) {
        console.error('Gagal mengunduh/membuka berkas Drive:', error);
        showToast('Gagal mengunduh berkas dari Google Drive', 'error');
      }
    } else {
      try {
        await invoke('open_file_physically', { path });
        showToast('Membuka berkas...', 'info');
      } catch (error) {
        console.error('Gagal membuka berkas:', error);
        showToast('Gagal membuka berkas (pastikan file fisik ada)', 'error');
      }
    }
  };

  // Handler Buka Lokasi Berkas di File Manager Sistem via Rust Backend
  const handleOpenFileLocation = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      await invoke('open_file_location_physically', { path });
      showToast('Membuka lokasi berkas...', 'info');
    } catch (error) {
      console.error('Gagal membuka lokasi berkas:', error);
      showToast('Gagal membuka lokasi berkas', 'error');
    }
  };

  // Handler Hapus Berkas
  const handleDelete = (e: React.MouseEvent, id: number, filename: string) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Berkas',
      message: `Apakah Anda yakin ingin menghapus berkas "${filename}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteFile(id);
          showToast(`Berkas "${filename}" berhasil dihapus`, 'success');
        } catch (error) {
          console.error('Gagal menghapus berkas:', error);
          showToast('Gagal menghapus berkas', 'error');
        }
      }
    });
  };

  // Format tanggal modifikasi agar ramah dibaca
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesCategory =
      fileCategory === 'all' ||
      (fileCategory === 'invoice' && file.type === 'invoice') ||
      (fileCategory === 'service' && file.type === 'service') ||
      (fileCategory === 'gdrive' && file.type === 'gdrive') ||
      (fileCategory === 'other' && file.type !== 'invoice' && file.type !== 'service' && file.type !== 'gdrive');

    const matchesSearch = file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      {/* Daftar Berkas (Tabel Compact) */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        {filteredFiles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📂</span>
            <p style={{ fontSize: '13px', fontWeight: '500' }}>Tidak ada berkas yang ditemukan</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px 12px', fontWeight: '600', width: '40%' }}>Nama Berkas</th>
                <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%' }}>Tipe</th>
                <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%' }}>Diubah Terakhir</th>
                <th style={{ padding: '8px 12px', fontWeight: '600', width: '10%' }}>Status</th>
                <th style={{ padding: '8px 12px', fontWeight: '600', width: '10%', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map((file) => {
                const isSelected = selectedFileId === file.id;
                return (
                  <tr
                    key={file.id}
                    onClick={() => setSelectedFileId(isSelected ? null : (file.id ?? null))}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isSelected ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {file.type === 'invoice' && '📄'}
                        {file.type === 'service' && '🛠️'}
                        {file.type === 'gdrive' && '☁️'}
                        {file.type !== 'invoice' && file.type !== 'service' && file.type !== 'gdrive' && '📁'}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.filename}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {file.type}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {formatDateTime(file.last_modified)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: file.status === 'Tersimpan' ? 'rgba(46, 194, 126, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                          color: file.status === 'Tersimpan' ? '#2ec27e' : 'var(--text-secondary)'
                        }}
                      >
                        {file.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {/* Tombol Buka Berkas */}
                        <button
                          onClick={(e) => handleOpenFile(e, file)}
                          title="Buka berkas"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </button>

                        {/* Tombol Buka Lokasi Berkas (Hanya untuk berkas lokal) */}
                        {!file.path.startsWith('gdrive://') && (
                          <button
                            onClick={(e) => handleOpenFileLocation(e, file.path)}
                            title="Buka lokasi berkas"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                              e.currentTarget.style.color = 'var(--text-primary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                          </button>
                        )}

                        {/* Tombol Hapus */}
                        <button
                          onClick={(e) => handleDelete(e, file.id!, file.filename)}
                          title="Hapus berkas"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(192, 28, 28, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FileManager;

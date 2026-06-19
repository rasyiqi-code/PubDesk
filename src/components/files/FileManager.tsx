import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';

interface FileManagerProps {
  searchQuery: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ searchQuery }) => {
  const { files, deleteFile, updateFile, selectedFileId, setSelectedFileId, showToast, fileCategory, showConfirm, fileLayoutMode, currentFolderId, navigateFolder, refreshAccessToken, gdriveAccounts, refreshAccountToken } = useAppContext();

  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await invoke<any[]>('global_semantic_search', { query: searchQuery });
        const mapped = results.map(res => ({
          id: res.id,
          path: res.path,
          filename: res.filename,
          type: res.type,
          status: 'Lokal',
          version_label: res.version_label,
          last_modified: res.last_modified,
          modified_by: '',
          is_readonly: false
        }));
        setSearchResults(mapped);
      } catch (err) {
        console.error("Gagal melakukan pencarian semantik:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const rootFolderId = localStorage.getItem('gdrive_parent_folder_id') || 'root';

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

  const getParentId = (file: any) => {
    if (file.type !== 'gdrive') return null;
    return parseModifiedBy(file.modified_by).parentId;
  };

  const getIsShared = (file: any) => {
    if (file.type !== 'gdrive') return false;
    return parseModifiedBy(file.modified_by).shared === '1';
  };

  const getVirtualFolders = () => {
    const list: any[] = [];
    if (currentFolderId === rootFolderId) {
      gdriveAccounts.forEach((acc, index) => {
        list.push({
          id: -1000 - index,
          path: `gdrive://ac_${acc.email}`,
          filename: acc.email,
          type: 'gdrive',
          status: 'Cloud',
          version_label: 'application/vnd.google-apps.folder',
          last_modified: new Date().toISOString(),
          modified_by: `0|root|0|${acc.email}`,
          is_readonly: true
        });
      });
    } else if (currentFolderId.startsWith('ac_')) {
      const email = currentFolderId.replace('ac_', '');
      list.push({
        id: -2000,
        path: `gdrive://md_${email}`,
        filename: 'Drive Saya',
        type: 'gdrive',
        status: 'Cloud',
        version_label: 'application/vnd.google-apps.folder',
        last_modified: new Date().toISOString(),
        modified_by: `0|ac_${email}|0|${email}`,
        is_readonly: true
      });
      list.push({
        id: -2001,
        path: `gdrive://swm_${email}`,
        filename: 'Shared with me',
        type: 'gdrive',
        status: 'Cloud',
        version_label: 'application/vnd.google-apps.folder',
        last_modified: new Date().toISOString(),
        modified_by: `0|ac_${email}|1|${email}`,
        is_readonly: true
      });
    }
    return list;
  };

  const handleGoUp = () => {
    if (currentFolderId.startsWith('md_') || currentFolderId.startsWith('swm_')) {
      const email = currentFolderId.substring(3);
      navigateFolder(`ac_${email}`);
      setSelectedFileId(null);
      return;
    }
    if (currentFolderId.startsWith('ac_')) {
      navigateFolder(rootFolderId);
      setSelectedFileId(null);
      return;
    }
    const currentFolder = files.find(f => f.path === `gdrive://${currentFolderId}`);
    if (currentFolder) {
      const parentId = getParentId(currentFolder);
      const isShared = getIsShared(currentFolder);
      const email = parseModifiedBy(currentFolder.modified_by).accountEmail;
      
      if (parentId === 'root' || !parentId || !gdriveIdSet.has(parentId)) {
        navigateFolder(isShared ? `swm_${email}` : `md_${email}`);
      } else {
        navigateFolder(parentId);
      }
    } else {
      navigateFolder(rootFolderId);
    }
    setSelectedFileId(null);
  };

  const renderFileIcon = (file: any, size: 'large' | 'small' = 'large') => {
    const isFolder = file.type === 'gdrive' && file.version_label === 'application/vnd.google-apps.folder';
    
    if (file.path && file.path.startsWith('gdrive://ac_')) {
      const dim = size === 'large' ? 48 : 18;
      return (
        <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 10C4 7.79086 5.79086 6 8 6H18.5C19.7827 6 20.9781 6.61273 21.7222 7.65449L24.2778 11.2312C24.65 11.7521 25.2476 12.0583 25.8889 12.0583H40C42.2091 12.0583 44 13.8492 44 16.0583V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V10Z" fill="#E8F0FE" stroke="#4285F4" strokeWidth="1.5" />
          <path d="M4 17H44V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V17Z" fill="#4285F4" />
          <circle cx="24" cy="26" r="3.5" fill="#FFFFFF" />
          <path d="M24 31C21.5 31 19.5 32.2 19.5 34V35H28.5V34C28.5 32.2 26.5 31 24 31Z" fill="#FFFFFF" />
        </svg>
      );
    }

    if (file.path && file.path.startsWith('gdrive://md_')) {
      const dim = size === 'large' ? 48 : 18;
      return (
        <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 10C4 7.79086 5.79086 6 8 6H18.5C19.7827 6 20.9781 6.61273 21.7222 7.65449L24.2778 11.2312C24.65 11.7521 25.2476 12.0583 25.8889 12.0583H40C42.2091 12.0583 44 13.8492 44 16.0583V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V10Z" fill="#FCE8B2" stroke="#F1C40F" strokeWidth="1.5" />
          <path d="M4 17H44V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V17Z" fill="#FDD835" />
          <path d="M24 23L17 29H21V35H27V29H31L24 23Z" fill="#F39C12" />
        </svg>
      );
    }

    if (file.path && file.path.startsWith('gdrive://swm_')) {
      const dim = size === 'large' ? 48 : 18;
      return (
        <svg width={dim} height={dim} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 10C4 7.79086 5.79086 6 8 6H18.5C19.7827 6 20.9781 6.61273 21.7222 7.65449L24.2778 11.2312C24.65 11.7521 25.2476 12.0583 25.8889 12.0583H40C42.2091 12.0583 44 13.8492 44 16.0583V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V10Z" fill="#FCE8B2" stroke="#F1C40F" strokeWidth="1.5" />
          <path d="M4 17H44V38C44 40.2091 42.2091 42 40 42H8C5.79086 42 4 40.2091 4 38V17Z" fill="#FDD835" />
          <circle cx="24" cy="26" r="3.5" fill="#F39C12" />
          <path d="M24 31C20.5 31 18 32.5 18 35V36H30V35C30 32.5 27.5 31 24 31Z" fill="#F39C12" />
        </svg>
      );
    }

    if (size === 'large') {
      return (
        <span style={{ fontSize: '36px', lineHeight: '1' }}>
          {file.type === 'invoice' && '📄'}
          {file.type === 'service' && '🛠️'}
          {file.type === 'gdrive' && (isFolder ? '📁' : '☁️')}
          {file.type !== 'invoice' && file.type !== 'service' && file.type !== 'gdrive' && '📁'}
        </span>
      );
    } else {
      return (
        <span style={{ fontSize: '16px' }}>
          {file.type === 'invoice' && '📄'}
          {file.type === 'service' && '🛠️'}
          {file.type === 'gdrive' && (isFolder ? '📁' : '☁️')}
          {file.type !== 'invoice' && file.type !== 'service' && file.type !== 'gdrive' && '📁'}
        </span>
      );
    }
  };

  // Handler Buka Berkas Fisik via Rust Backend
  const handleOpenFile = async (e: React.MouseEvent, file: any) => {
    e.stopPropagation();
    const path = file.path;

    // Catat statistik akses berkas jika berkas lokal (memiliki id valid di DB)
    if (file.id && file.id > 0) {
      try {
        await invoke('record_file_access', { fileId: file.id });
      } catch (err) {
        console.error("Gagal mencatat statistik akses berkas:", err);
      }
    }
    
    // Navigasi masuk folder Google Drive
    if (file.type === 'gdrive' && file.version_label === 'application/vnd.google-apps.folder') {
      navigateFolder(file.path.replace('gdrive://', ''));
      setSelectedFileId(null);
      return;
    }
    if (path.startsWith('gdrive://')) {
      const fileId = path.replace('gdrive://', '');
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

  // Mendapatkan label tipe berkas yang ramah dibaca
  const getDisplayType = (file: any) => {
    if (file.type === 'invoice') return 'Invoice';
    if (file.type === 'service') return 'Layanan';
    if (file.type === 'gdrive' && file.version_label === 'application/vnd.google-apps.folder') return 'Folder';
    
    const parts = file.filename.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].toUpperCase();
      if (file.type === 'gdrive' && file.version_label?.includes('google-apps')) {
        if (file.version_label.endsWith('document')) return 'Google Doc (DOCX)';
        if (file.version_label.endsWith('spreadsheet')) return 'Google Sheet (XLSX)';
        if (file.version_label.endsWith('presentation')) return 'Google Slide (PPTX)';
        return `Google ${ext}`;
      }
      return `${ext} File`;
    }
    
    if (file.type === 'gdrive') return 'Cloud File';
    return 'Berkas';
  };

  // Buat Set berisi semua ID file/folder GDrive yang ada di database lokal
  const gdriveIdSet = new Set(
    files
      .filter(f => f.type === 'gdrive')
      .map(f => f.path.replace('gdrive://', ''))
  );

  const allFiles = fileCategory === 'gdrive' && (currentFolderId === rootFolderId || currentFolderId.startsWith('ac_'))
    ? getVirtualFolders()
    : files;

  const baseFiles = searchQuery.trim() ? searchResults : allFiles;

  const filteredFiles = baseFiles.filter((file) => {
    const matchesCategory =
      (fileCategory === 'all' && file.type !== 'gdrive') ||
      (fileCategory === 'invoice' && file.type === 'invoice') ||
      (fileCategory === 'service' && file.type === 'service') ||
      (fileCategory === 'gdrive' && file.type === 'gdrive') ||
      (fileCategory === 'other' && file.type !== 'invoice' && file.type !== 'service' && file.type !== 'gdrive');

    const fileParentId = getParentId(file);
    const isShared = getIsShared(file);
    const { accountEmail } = parseModifiedBy(file.modified_by);
    
    let matchesFolder = true;
    if (!searchQuery && fileCategory === 'gdrive') {
      if (currentFolderId === rootFolderId) {
        matchesFolder = file.path?.startsWith('gdrive://ac_') || false;
      } else if (currentFolderId.startsWith('ac_')) {
        const email = currentFolderId.replace('ac_', '');
        matchesFolder = file.path === `gdrive://md_${email}` || file.path === `gdrive://swm_${email}`;
      } else if (currentFolderId.startsWith('md_')) {
        const email = currentFolderId.replace('md_', '');
        matchesFolder = accountEmail === email && !isShared && (
          fileParentId === 'root' ||
          fileParentId === rootFolderId ||
          !fileParentId ||
          !gdriveIdSet.has(fileParentId)
        );
      } else if (currentFolderId.startsWith('swm_')) {
        const email = currentFolderId.replace('swm_', '');
        matchesFolder = accountEmail === email && isShared && (
          fileParentId === 'root' ||
          fileParentId === rootFolderId ||
          !fileParentId ||
          !gdriveIdSet.has(fileParentId)
        );
      } else {
        matchesFolder = fileParentId === currentFolderId;
      }
    }

    return matchesCategory && matchesFolder;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      {/* Daftar Berkas */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)', padding: fileLayoutMode === 'grid' ? '16px' : '0' }}>
        {filteredFiles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📂</span>
            <p style={{ fontSize: '13px', fontWeight: '500' }}>Tidak ada berkas yang ditemukan</p>
          </div>
        ) : fileLayoutMode === 'grid' ? (
          // Grid View Layout
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '12px',
            alignContent: 'start'
          }}>
            {/* Folder Induk back item (Grid style) */}
            {fileCategory === 'gdrive' && !searchQuery && currentFolderId !== rootFolderId && (
              <div
                onDoubleClick={handleGoUp}
                onClick={() => setSelectedFileId(null)}
                title="Klik dua kali untuk naik ke folder induk"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 8px',
                  borderRadius: '10px',
                  border: '1px dashed var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  gap: '6px',
                  height: '110px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '36px' }}>📁</span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>.. (Ke Atas)</span>
              </div>
            )}

            {filteredFiles.map((file) => {
              const isSelected = selectedFileId === file.id;
              
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileId(isSelected ? null : (file.id ?? null))}
                  onDoubleClick={(e) => handleOpenFile(e, file)}
                  title="Klik dua kali untuk membuka"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(192, 28, 28, 0.05)' : 'var(--bg-panel)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                    gap: '6px',
                    position: 'relative',
                    userSelect: 'none',
                    height: '110px',
                    justifyContent: 'center',
                    boxShadow: isSelected ? '0 4px 10px rgba(192, 28, 28, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-dark)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-panel)';
                  }}
                >
                  {/* File Icon */}
                  {renderFileIcon(file, 'large')}

                  {/* File Name */}
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      fontWeight: '500', 
                      color: 'var(--text-primary)', 
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.2',
                      maxHeight: '28px',
                      padding: '0 4px'
                    }}
                    title={file.filename}
                  >
                    {file.filename}
                  </span>

                  {/* Cache Status Badge */}
                  {file.status === 'Tersimpan' && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      fontSize: '8px',
                      background: 'rgba(46, 194, 126, 0.2)',
                      color: '#2ec27e',
                      padding: '0px 3px',
                      borderRadius: '3px',
                      fontWeight: '700'
                    }}>
                      LOKAL
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // List View Layout (Tabel)
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
              {/* Baris kembali ke folder induk */}
              {fileCategory === 'gdrive' && !searchQuery && currentFolderId !== rootFolderId && (
                <tr
                  onClick={() => setSelectedFileId(null)}
                  onDoubleClick={handleGoUp}
                  title="Klik dua kali untuk naik ke folder induk"
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>📁</span>
                    <span>.. (Kembali ke folder sebelumnya)</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Folder Induk</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>-</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>-</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>-</td>
                </tr>
              )}
              {filteredFiles.map((file) => {
                const isSelected = selectedFileId === file.id;
                return (
                  <tr
                    key={file.id}
                    onClick={() => setSelectedFileId(isSelected ? null : (file.id ?? null))}
                    onDoubleClick={(e) => handleOpenFile(e, file)}
                    title="Klik dua kali untuk membuka berkas secara native"
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
                      {renderFileIcon(file, 'small')}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.filename}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {getDisplayType(file)}
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

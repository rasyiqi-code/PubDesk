import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';
import { getCommonPrefix, buildLocalFileTree, flattenTree } from '../../utils/fileTree';
import { parseModifiedBy, getParentId, getIsShared } from './fileHelpers';
import { TagFilter } from './TagFilter';
import { StatusFilter } from './StatusFilter';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';

interface FileManagerProps {
  searchQuery: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ searchQuery }) => {
  const { 
    files, 
    deleteFile, 
    updateFile, 
    selectedFileId, 
    setSelectedFileId, 
    showToast, 
    fileCategory, 
    showConfirm, 
    fileLayoutMode, 
    currentFolderId, 
    navigateFolder, 
    refreshAccessToken, 
    gdriveAccounts, 
    refreshAccountToken,
    getAllTags,
    getAllFileTags,
    setRightPanelVisible
  } = useAppContext();

  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [allTags, setAllTags] = React.useState<string[]>([]);
  const [fileTags, setFileTags] = React.useState<Record<number, string[]>>({});
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<'status' | 'tag'>('tag');

  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size' | 'type' | 'status'>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const isTreeView = true;
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({});

  // Auto-scroll ke berkas yang terpilih
  React.useEffect(() => {
    if (selectedFileId !== null && selectedFileId !== undefined) {
      const timer = setTimeout(() => {
        const element = document.querySelector(`[data-file-id="${selectedFileId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedFileId]);

  const fetchTagsData = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
      const fileTagsMap = await getAllFileTags();
      setFileTags(fileTagsMap);
    } catch (err) {
      console.error("Gagal mengambil data tag:", err);
    }
  };

  React.useEffect(() => {
    fetchTagsData();
  }, [files]);

  React.useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
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
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const rootFolderId = localStorage.getItem('gdrive_parent_folder_id') || 'root';

  const sortFiles = (filesToSort: any[]) => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'date':
          const dateA = new Date(a.last_modified).getTime() || 0;
          const dateB = new Date(b.last_modified).getTime() || 0;
          comparison = dateA - dateB;
          break;
        case 'size':
          const sizeA = parseInt(parseModifiedBy(a.modified_by).size, 10) || 0;
          const sizeB = parseInt(parseModifiedBy(b.modified_by).size, 10) || 0;
          comparison = sizeA - sizeB;
          break;
        case 'type':
          const typeA = a.type || '';
          const typeB = b.type || '';
          comparison = typeA.localeCompare(typeB);
          break;
        case 'status':
          const statusA = a.status || '';
          const statusB = b.status || '';
          comparison = statusA.localeCompare(statusB);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const sortTreeNodes = (nodes: any[]): any[] => {
    return [...nodes].map(node => {
      if (node.type === 'folder' && node.children) {
        return {
          ...node,
          children: sortTreeNodes(node.children)
        };
      }
      return node;
    }).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      
      if (a.type === 'folder') {
        return a.name.localeCompare(b.name);
      }
      
      let comparison = 0;
      const fileA = a.file;
      const fileB = b.file;
      
      switch (sortBy) {
        case 'name':
          comparison = fileA.filename.localeCompare(fileB.filename);
          break;
        case 'date':
          const dateA = new Date(fileA.last_modified).getTime() || 0;
          const dateB = new Date(fileB.last_modified).getTime() || 0;
          comparison = dateA - dateB;
          break;
        case 'size':
          const sizeA = parseInt(parseModifiedBy(fileA.modified_by).size, 10) || 0;
          const sizeB = parseInt(parseModifiedBy(fileB.modified_by).size, 10) || 0;
          comparison = sizeA - sizeB;
          break;
        case 'type':
          const typeA = fileA.type || '';
          const typeB = fileB.type || '';
          comparison = typeA.localeCompare(typeB);
          break;
        case 'status':
          const statusA = fileA.status || '';
          const statusB = fileB.status || '';
          comparison = statusA.localeCompare(statusB);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (field: 'name' | 'type' | 'date' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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

  const gdriveIdSet = new Set(
    files
      .filter(f => f.type === 'gdrive')
      .map(f => f.path.replace('gdrive://', ''))
  );

  const allFiles = fileCategory === 'gdrive' && (currentFolderId === rootFolderId || currentFolderId.startsWith('ac_'))
    ? getVirtualFolders()
    : files;

  const baseFiles = searchQuery.trim() ? searchResults : allFiles;
  const preFilteredFiles = baseFiles.filter((file) => {
    const filenameLower = (file.filename || '').toLowerCase();
    const isPdf = filenameLower.endsWith('.pdf');
    const isSpreadsheet = filenameLower.endsWith('.xlsx') || filenameLower.endsWith('.xls') || filenameLower.endsWith('.csv') || filenameLower.endsWith('.ods');
    const isText = filenameLower.endsWith('.docx') || filenameLower.endsWith('.doc') || filenameLower.endsWith('.txt') || filenameLower.endsWith('.odt') || filenameLower.endsWith('.rtf') || filenameLower.endsWith('.md');
    const isImage = filenameLower.endsWith('.png') || filenameLower.endsWith('.jpg') || filenameLower.endsWith('.jpeg') || filenameLower.endsWith('.gif') || filenameLower.endsWith('.svg') || filenameLower.endsWith('.webp');
    const isPresentation = filenameLower.endsWith('.pptx') || filenameLower.endsWith('.ppt') || filenameLower.endsWith('.odp');

    let matchesCategory = false;
    if (fileCategory === 'all') {
      matchesCategory = file.type !== 'gdrive';
    } else if (fileCategory === 'invoice') {
      matchesCategory = file.type === 'invoice';
    } else if (fileCategory === 'service') {
      matchesCategory = file.type === 'service';
    } else if (fileCategory === 'gdrive') {
      matchesCategory = file.type === 'gdrive';
    } else if (fileCategory === 'pdf') {
      matchesCategory = file.type !== 'gdrive' && isPdf;
    } else if (fileCategory === 'spreadsheet') {
      matchesCategory = file.type !== 'gdrive' && isSpreadsheet;
    } else if (fileCategory === 'text') {
      matchesCategory = file.type !== 'gdrive' && isText;
    } else if (fileCategory === 'image') {
      matchesCategory = file.type !== 'gdrive' && isImage;
    } else if (fileCategory === 'presentation') {
      matchesCategory = file.type !== 'gdrive' && isPresentation;
    } else if (fileCategory === 'other') {
      matchesCategory = file.type !== 'invoice' && 
                        file.type !== 'service' && 
                        file.type !== 'gdrive' && 
                        !isPdf && 
                        !isSpreadsheet && 
                        !isText && 
                        !isImage && 
                        !isPresentation;
    }

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

    // Filter by selected tag
    let matchesTag = true;
    if (selectedTag) {
      const tagsForFile = fileTags[file.id] || [];
      matchesTag = tagsForFile.includes(selectedTag);
    }

    // Filter by selected status
    let matchesStatus = true;
    if (selectedStatus) {
      matchesStatus = file.status === selectedStatus;
    }

    return matchesCategory && matchesFolder && matchesTag && matchesStatus;
  });

  const filteredFiles = sortFiles(preFilteredFiles);

  const isLocalCategory = 
    fileCategory === 'all' ||
    fileCategory === 'other' ||
    fileCategory === 'pdf' ||
    fileCategory === 'spreadsheet' ||
    fileCategory === 'text' ||
    fileCategory === 'image' ||
    fileCategory === 'presentation';

  const showTreeActive = isTreeView && isLocalCategory && fileLayoutMode === 'list';
  let treeRows: any[] = [];

  if (showTreeActive) {
    const commonPrefix = getCommonPrefix(preFilteredFiles.map(f => f.path));
    const tree = buildLocalFileTree(preFilteredFiles, commonPrefix);
    const sortedTree = sortTreeNodes(tree);
    treeRows = flattenTree(sortedTree, expandedFolders);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      {/* Baris Filter Status & Tag Terpadu (Satu baris compact dinamis) */}
      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        alignItems: 'center',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {/* Jenis Filter Utama (Badge) */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '4px', whiteSpace: 'nowrap' }}>
            🔍 Filter:
          </span>
          <button
            onClick={() => {
              setFilterType('status');
              setSelectedStatus(null);
              setSelectedTag(null);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              background: filterType === 'status' ? 'var(--accent)' : 'var(--bg-card)',
              color: filterType === 'status' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              height: '24px',
              boxSizing: 'border-box'
            }}
          >
            Status
          </button>
          <button
            onClick={() => {
              setFilterType('tag');
              setSelectedStatus(null);
              setSelectedTag(null);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              background: filterType === 'tag' ? 'var(--accent)' : 'var(--bg-card)',
              color: filterType === 'tag' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              height: '24px',
              boxSizing: 'border-box'
            }}
          >
            Tag
          </button>
        </div>

        {/* Dropdown Nilai Status (Kondisional) */}
        {filterType === 'status' && (
          <>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />
            <StatusFilter
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
            />
          </>
        )}

        {/* Dropdown Nilai Tag (Kondisional) */}
        {filterType === 'tag' && allTags.length > 0 && (
          <>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />
            <TagFilter
              allTags={allTags}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
            />
          </>
        )}
      </div>

      {/* Daftar Berkas */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)', padding: fileLayoutMode === 'grid' ? '16px' : '0' }}>
        {filteredFiles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '32px', marginBottom: '8px' }}>📂</span>
            <p style={{ fontSize: '13px', fontWeight: '500' }}>Tidak ada berkas yang ditemukan</p>
          </div>
        ) : fileLayoutMode === 'grid' ? (
          // Grid View Layout
          <FileGrid
            filteredFiles={filteredFiles}
            selectedFileId={selectedFileId}
            setSelectedFileId={setSelectedFileId}
            fileTags={fileTags}
            fileCategory={fileCategory}
            searchQuery={searchQuery}
            currentFolderId={currentFolderId}
            rootFolderId={rootFolderId}
            handleGoUp={handleGoUp}
            handleOpenFile={handleOpenFile}
            setRightPanelVisible={setRightPanelVisible}
          />
        ) : (
          // List View Layout (Tabel)
          <FileList
            filteredFiles={filteredFiles}
            selectedFileId={selectedFileId}
            setSelectedFileId={setSelectedFileId}
            fileTags={fileTags}
            fileCategory={fileCategory}
            searchQuery={searchQuery}
            currentFolderId={currentFolderId}
            rootFolderId={rootFolderId}
            handleGoUp={handleGoUp}
            handleOpenFile={handleOpenFile}
            handleOpenFileLocation={handleOpenFileLocation}
            handleDelete={handleDelete}
            sortBy={sortBy}
            sortOrder={sortOrder}
            handleSort={handleSort}
            showTreeActive={showTreeActive}
            treeRows={treeRows}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            setRightPanelVisible={setRightPanelVisible}
          />
        )}
      </div>
    </div>
  );
};

export default FileManager;

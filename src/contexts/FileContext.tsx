import { useAppContext } from './AppContext';

/**
 * useFileState — hook khusus untuk state berkas.
 * Mengekstrak state file-specific dari AppContext sehingga komponen tidak perlu
 * mendestruct langsung dari useAppContext yang besar.
 *
 * Gunakan hook ini di komponen: FileManager, FileList, FileGrid, FilePreviewPanel,
 * PanelKanan, Sidebar, TopBar — jika hanya butuh state file.
 *
 * Keuntungan:
 * - Import yang lebih eksplisit dan mudah dilacak
 * - Persiapan migrasi ke FileContext tersendiri di masa depan
 * - Mengurangi coupling langsung ke AppContext besar
 */
export function useFileState() {
  const {
    files,
    selectedFileId,
    setSelectedFileId,
    fileCategory,
    setFileCategory,
    fileLayoutMode,
    setFileLayoutMode,
    currentFolderId,
    setCurrentFolderId,
    folderHistory,
    folderHistoryIndex,
    navigateFolder,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    rightPanelVisible,
    setRightPanelVisible,
    addFile,
    deleteFile,
    updateFile,
    loadFiles,
    addFileTag,
    removeFileTag,
    getFileTags,
    getAllTags,
    getAllFileTags,
    watchFolders,
    loadWatchFolders,
    addWatchFolder,
    removeWatchFolder,
  } = useAppContext();

  return {
    files,
    selectedFileId,
    setSelectedFileId,
    fileCategory,
    setFileCategory,
    fileLayoutMode,
    setFileLayoutMode,
    currentFolderId,
    setCurrentFolderId,
    folderHistory,
    folderHistoryIndex,
    navigateFolder,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    rightPanelVisible,
    setRightPanelVisible,
    addFile,
    deleteFile,
    updateFile,
    loadFiles,
    addFileTag,
    removeFileTag,
    getFileTags,
    getAllTags,
    getAllFileTags,
    watchFolders,
    loadWatchFolders,
    addWatchFolder,
    removeWatchFolder,
  };
}

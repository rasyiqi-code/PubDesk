export const MODULE_LABELS: Record<string, string> = {
  'home': 'Beranda Utama',
  'files': 'Smart Folders',
  'files-parent': 'Dashboard Smart Folders',
  'activity-log': 'Activity Log',
  'settings-local-folders': 'Folder Lokal Dipantau',
  'settings-gdrive': 'Google Drive',
  'settings-p2p': 'Koneksi Jaringan',
};

export const SEARCHABLE_MODULES = new Set([
  'files',
]);

export const SEARCH_PLACEHOLDERS: Record<string, string> = {
  'files': 'Cari berkas...',
};

export const SEARCH_HINTS: Record<string, string> = {};

export const DEFAULT_SEARCH_PLACEHOLDER = 'Cari berkas...';
export const DEFAULT_SEARCH_HINT = '🔍 Cari berkas...';

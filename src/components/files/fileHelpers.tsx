import React from 'react';

// Helper to parse GDrive specific modified_by string containing metadata
export const parseModifiedBy = (modifiedBy?: string) => {
  if (!modifiedBy) return { size: '0', parentId: 'root', shared: '0', accountEmail: '' };
  const parts = modifiedBy.split('|');
  return {
    size: parts[0] || '0',
    parentId: parts[1] || 'root',
    shared: parts[2] || '0',
    accountEmail: parts[3] || ''
  };
};

export const getParentId = (file: any) => {
  if (file.type !== 'gdrive') return null;
  return parseModifiedBy(file.modified_by).parentId;
};

export const getIsShared = (file: any) => {
  if (file.type !== 'gdrive') return false;
  return parseModifiedBy(file.modified_by).shared === '1';
};

// Format date time friendly to Indonesian locale
export const formatDateTime = (isoString: string) => {
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

// Get user-friendly file type display name
export const getDisplayType = (file: any) => {
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

interface FileIconProps {
  file: any;
  size?: 'large' | 'small';
  expandedFolders?: Record<string, boolean>;
}

export const FileIcon: React.FC<FileIconProps> = ({ file, size = 'large', expandedFolders = {} }) => {
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

  const getEmoji = () => {
    if (file.type === 'folder') {
      return expandedFolders[file.path] ? '📂' : '📁';
    }
    if (file.type === 'invoice') return '📄';
    if (file.type === 'service') return '🛠️';
    if (file.type === 'gdrive') return isFolder ? (expandedFolders[file.path] ? '📂' : '📁') : '☁️';
    
    // Berkas lokal
    const ext = (file.version_label || '').toLowerCase();
    switch (ext) {
      case 'pdf': return '📕';
      case 'docx':
      case 'doc': return '📘';
      case 'xlsx':
      case 'xls': return '📗';
      case 'png':
      case 'jpg':
      case 'jpeg': return '🖼️';
      case 'txt':
      case 'md': return '📝';
      default: return '📄';
    }
  };

  const fontSize = size === 'large' ? '36px' : '16px';
  return (
    <span style={{ fontSize, lineHeight: '1' }}>
      {getEmoji()}
    </span>
  );
};

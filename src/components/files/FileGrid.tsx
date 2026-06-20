import React from 'react';
import { FileIcon } from './fileHelpers';

interface FileGridProps {
  filteredFiles: any[];
  selectedFileId: number | null;
  setSelectedFileId: (id: number | null) => void;
  fileTags: Record<number, string[]>;
  fileCategory: string;
  searchQuery: string;
  currentFolderId: string;
  rootFolderId: string;
  handleGoUp: () => void;
  handleOpenFile: (e: React.MouseEvent, file: any) => void;
  setRightPanelVisible: (visible: boolean) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  filteredFiles,
  selectedFileId,
  setSelectedFileId,
  fileTags,
  fileCategory,
  searchQuery,
  currentFolderId,
  rootFolderId,
  handleGoUp,
  handleOpenFile,
  setRightPanelVisible
}) => {
  return (
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
            data-file-id={file.id}
            onClick={() => setSelectedFileId(isSelected ? null : (file.id ?? null))}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setSelectedFileId(file.id);
              setRightPanelVisible(true);
            }}
            title="Klik dua kali untuk melihat pratinjau"
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
            <span
              onClick={(e) => handleOpenFile(e, file)}
              title="Klik ikon untuk membuka berkas secara native"
              style={{ cursor: 'pointer', display: 'inline-flex' }}
            >
              <FileIcon file={file} size="large" />
            </span>

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

            {/* Tags in Grid */}
            {fileTags[file.id] && fileTags[file.id].length > 0 && (
              <div style={{ display: 'flex', gap: '3px', marginTop: '2px', justifyContent: 'center', flexWrap: 'wrap', width: '100%', overflow: 'hidden', maxHeight: '14px' }}>
                {fileTags[file.id].slice(0, 2).map(tag => (
                  <span key={tag} style={{ fontSize: '8px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', padding: '0px 4px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

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
  );
};

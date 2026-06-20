import React from 'react';
import { FileIcon, formatDateTime, getDisplayType } from './fileHelpers';

interface FileListProps {
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
  handleOpenFileLocation: (e: React.MouseEvent, path: string) => void;
  handleDelete: (e: React.MouseEvent, id: number, filename: string) => void;
  sortBy: 'name' | 'date' | 'size' | 'type' | 'status';
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'name' | 'type' | 'date' | 'status') => void;
  showTreeActive: boolean;
  treeRows: any[];
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setRightPanelVisible: (visible: boolean) => void;
}

export const FileList: React.FC<FileListProps> = ({
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
  handleOpenFileLocation,
  handleDelete,
  sortBy,
  sortOrder,
  handleSort,
  showTreeActive,
  treeRows,
  expandedFolders,
  setExpandedFolders,
  setRightPanelVisible
}) => {
  return (
    <>
      <style>{`
        @media (max-width: 1000px) {
          .file-col-status {
            display: none !important;
          }
        }
        @media (max-width: 800px) {
          .file-col-status, .file-col-date {
            display: none !important;
          }
        }
        @media (max-width: 600px) {
          .file-col-status, .file-col-date, .file-col-type {
            display: none !important;
          }
        }
      `}</style>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <th 
              onClick={() => handleSort('name')}
              style={{ padding: '8px 12px', fontWeight: '600', width: '40%', cursor: 'pointer', userSelect: 'none' }}
            >
              Nama Berkas {sortBy === 'name' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
            </th>
            <th 
              onClick={() => handleSort('type')}
              className="file-col-type"
              style={{ padding: '8px 12px', fontWeight: '600', width: '15%', cursor: 'pointer', userSelect: 'none' }}
            >
              Tipe {sortBy === 'type' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
            </th>
            <th 
              onClick={() => handleSort('date')}
              className="file-col-date"
              style={{ padding: '8px 12px', fontWeight: '600', width: '25%', cursor: 'pointer', userSelect: 'none' }}
            >
              Diubah Terakhir {sortBy === 'date' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
            </th>
            <th 
              onClick={() => handleSort('status')}
              className="file-col-status"
              style={{ padding: '8px 12px', fontWeight: '600', width: '10%', cursor: 'pointer', userSelect: 'none' }}
            >
              Status {sortBy === 'status' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
            </th>
            <th style={{ padding: '8px 12px', fontWeight: '600', width: '10%', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
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
              <td className="file-col-type" style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>Folder Induk</td>
              <td className="file-col-date" style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>-</td>
              <td className="file-col-status" style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>-</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>-</td>
            </tr>
          )}
          {showTreeActive ? (
            treeRows.map((row) => {
              const isFolder = row.type === 'folder';
              const isSelected = !isFolder && selectedFileId === row.file?.id;
              
              return (
                <tr
                  key={row.id}
                  data-file-id={isFolder ? undefined : row.file?.id}
                  onClick={() => {
                    if (isFolder) {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [row.path]: !prev[row.path]
                      }));
                    } else {
                      setSelectedFileId(isSelected ? null : (row.file?.id ?? null));
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isFolder) {
                      setSelectedFileId(row.file?.id ?? null);
                      setRightPanelVisible(true);
                    } else {
                      setExpandedFolders(prev => ({
                        ...prev,
                        [row.path]: !prev[row.path]
                      }));
                    }
                  }}
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
                  <td style={{
                    padding: '10px 12px',
                    fontWeight: isFolder ? '600' : '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: `${12 + row.depth * 20}px`
                  }}>
                    {isFolder ? (
                      <span style={{
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                        marginRight: '2px',
                        cursor: 'pointer',
                        display: 'inline-block',
                        width: '12px',
                        textAlign: 'center'
                      }}>
                        {expandedFolders[row.path] ? '▼' : '▶'}
                      </span>
                    ) : (
                      <span style={{ width: '12px', display: 'inline-block' }} />
                    )}
                    <span
                      onClick={(e) => {
                        if (!isFolder) {
                          handleOpenFile(e, row.file);
                        }
                      }}
                      title={isFolder ? undefined : "Klik ikon untuk membuka berkas secara native"}
                      style={{ cursor: isFolder ? 'default' : 'pointer', display: 'inline-flex' }}
                    >
                      <FileIcon file={isFolder ? { type: 'folder', path: row.path } : row.file} size="small" expandedFolders={expandedFolders} />
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span title={row.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.name}
                      </span>
                      {/* Tags */}
                      {!isFolder && fileTags[row.file?.id] && fileTags[row.file?.id].length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {fileTags[row.file?.id].map(tag => (
                            <span key={tag} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: '3px' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="file-col-type" style={{ padding: '10px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {isFolder ? 'Folder' : getDisplayType(row.file)}
                  </td>
                  <td className="file-col-date" style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {isFolder ? '-' : formatDateTime(row.file?.last_modified)}
                  </td>
                  <td className="file-col-status" style={{ padding: '10px 12px' }}>
                    {isFolder ? '-' : (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: row.file?.status === 'Tersimpan' ? 'rgba(46, 194, 126, 0.15)' : 'rgba(0, 0, 0, 0.06)',
                          color: row.file?.status === 'Tersimpan' ? '#2ec27e' : 'var(--text-secondary)'
                        }}
                      >
                        {row.file?.status}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {!isFolder && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {/* Tombol Buka Berkas */}
                        <button
                          onClick={(e) => handleOpenFile(e, row.file)}
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
                        {!row.file.path.startsWith('gdrive://') && (
                          <button
                            onClick={(e) => handleOpenFileLocation(e, row.file.path)}
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
                          onClick={(e) => handleDelete(e, row.file.id!, row.file.filename)}
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
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            filteredFiles.map((file) => {
              const isSelected = selectedFileId === file.id;
              return (
                <tr
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
                    <span
                      onClick={(e) => handleOpenFile(e, file)}
                      title="Klik ikon untuk membuka berkas secara native"
                      style={{ cursor: 'pointer', display: 'inline-flex' }}
                    >
                      <FileIcon file={file} size="small" />
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span title={file.filename} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.filename}
                      </span>
                      {/* Tags */}
                      {fileTags[file.id] && fileTags[file.id].length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                          {fileTags[file.id].map(tag => (
                            <span key={tag} style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: '3px' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="file-col-type" style={{ padding: '10px 12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {getDisplayType(file)}
                  </td>
                  <td className="file-col-date" style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {formatDateTime(file.last_modified)}
                  </td>
                  <td className="file-col-status" style={{ padding: '10px 12px' }}>
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
            })
          )}
        </tbody>
      </table>
    </>
  );
};

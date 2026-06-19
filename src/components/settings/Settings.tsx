import React, { useState, useEffect } from 'react';
import InvoiceSettings from './InvoiceSettings';
import ServiceManager from '../services/ServiceManager';
import { useAppContext } from '../../contexts/AppContext';

const Settings: React.FC = () => {
  const { 
    activeSettingsTab, 
    setActiveSettingsTab, 
    showToast, 
    files, 
    addFile, 
    updateFile, 
    deleteFile, 
    showConfirm 
  } = useAppContext();

  const [token, setToken] = useState(localStorage.getItem('gdrive_token') || '');
  const [parentFolderId, setParentFolderId] = useState(localStorage.getItem('gdrive_parent_folder_id') || '');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectedUser, setConnectedUser] = useState<{ name: string, email: string } | null>(null);
  const [connectionError, setConnectionError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (activeSettingsTab === 'general' && token) {
      testConnection(token);
    }
  }, [activeSettingsTab]);

  const testConnection = async (currentToken: string) => {
    if (!currentToken) return;
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setConnectedUser({
          name: data.user.displayName,
          email: data.user.emailAddress
        });
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setConnectionError('Token tidak valid atau telah kedaluwarsa. Silakan perbarui token Anda.');
      }
    } catch (err) {
      setConnectionStatus('error');
      setConnectionError('Gagal menghubungkan ke Google API. Periksa koneksi internet Anda.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSync = async () => {
    if (!token) {
      showToast('Masukkan Token Akses terlebih dahulu!', 'error');
      return;
    }
    setSyncing(true);
    setSyncProgress('Menghubungkan ke Google Drive...');
    try {
      let q = "trashed = false";
      if (parentFolderId.trim()) {
        q = `'${parentFolderId.trim()}' in parents and trashed = false`;
      }
      
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,size)`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`Gagal mengambil data file: ${res.status}`);
      }
      
      const data = await res.json();
      const driveFiles = data.files || [];
      
      setSyncProgress(`Ditemukan ${driveFiles.length} file di Drive. Menyinkronkan ke database lokal...`);
      
      const existingGDriveFiles = files.filter(f => f.type === 'gdrive');
      
      let createdCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;
      
      for (const df of driveFiles) {
        const path = `gdrive://${df.id}`;
        const existing = existingGDriveFiles.find(f => f.path === path);
        
        const fileData = {
          path,
          filename: df.name,
          type: 'gdrive',
          status: existing ? existing.status : 'Cloud',
          version_label: df.mimeType,
          last_modified: df.modifiedTime,
          modified_by: df.size ? df.size.toString() : '0',
          is_readonly: true
        };
        
        if (existing) {
          await updateFile({
            ...existing,
            ...fileData
          });
          updatedCount++;
        } else {
          await addFile(fileData);
          createdCount++;
        }
      }
      
      const driveFilePaths = driveFiles.map((df: any) => `gdrive://${df.id}`);
      for (const lf of existingGDriveFiles) {
        if (!driveFilePaths.includes(lf.path)) {
          await deleteFile(lf.id!);
          deletedCount++;
        }
      }
      
      showToast(`Sinkronisasi selesai! ${createdCount} file baru, ${updatedCount} diperbarui, ${deletedCount} dihapus.`, 'success');
      testConnection(token); // Update status koneksi
    } catch (error: any) {
      console.error(error);
      showToast(`Gagal sinkronisasi: ${error.message || error}`, 'error');
    } finally {
      setSyncing(false);
      setSyncProgress('');
    }
  };

  const handleClearSync = () => {
    showConfirm({
      title: 'Hapus Metadata Google Drive',
      message: 'Apakah Anda yakin ingin menghapus semua metadata berkas Google Drive dari aplikasi? Berkas fisik yang sudah di-download di cache tidak akan dihapus, tetapi berkas Google Drive tidak akan muncul lagi di daftar berkas.',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          const driveFiles = files.filter(f => f.type === 'gdrive');
          for (const f of driveFiles) {
            await deleteFile(f.id!);
          }
          showToast('Metadata Google Drive berhasil dihapus dari aplikasi', 'success');
        } catch (error) {
          console.error(error);
          showToast('Gagal menghapus metadata Google Drive', 'error');
        }
      }
    });
  };

  return (
    <div className="settings-module" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
      {/* Header & Tab Menu di Bagian Atas */}
      <div style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 16px 0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0
      }}>
        <h1 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          ⚙️ Pengaturan
        </h1>
        
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveSettingsTab('invoice')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSettingsTab === 'invoice' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeSettingsTab === 'invoice' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              marginBottom: '-1px'
            }}
          >
            📄 Pengaturan Invoice
          </button>



          <button
            onClick={() => setActiveSettingsTab('services')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSettingsTab === 'services' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeSettingsTab === 'services' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              marginBottom: '-1px'
            }}
          >
            🛠️ Master Layanan
          </button>

          <button
            onClick={() => setActiveSettingsTab('general')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSettingsTab === 'general' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeSettingsTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              marginBottom: '-1px'
            }}
          >
            ⚙️ Pengaturan Umum
          </button>
        </div>
      </div>

      {/* Area Konten Utama */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {activeSettingsTab === 'invoice' && <InvoiceSettings />}
        {activeSettingsTab === 'services' && <ServiceManager />}
        {activeSettingsTab === 'general' && (
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Integrasi Google Drive Card */}
            <div className="compact-panel" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                ☁️ Integrasi Google Drive
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4', textAlign: 'left' }}>
                Hubungkan PubDesk dengan akun Google Drive Anda untuk menyinkronkan daftar naskah dan aset secara otomatis. File cloud dapat diunduh dan dibuka langsung seolah file lokal.
              </p>

              {/* Input fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                <div className="compact-form-group">
                  <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Google Drive OAuth2 Access Token</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type={showToken ? 'text' : 'password'}
                      className="compact-input"
                      placeholder="Masukkan Access Token Anda..."
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        localStorage.setItem('gdrive_token', e.target.value);
                      }}
                      style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="btn-secondary compact-btn"
                      style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {showToken ? '👁️ Sembunyikan' : '👁️ Tampilkan'}
                    </button>
                  </div>
                </div>

                <div className="compact-form-group">
                  <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>ID Folder Induk (Opsional)</label>
                  <input
                    type="text"
                    className="compact-input"
                    placeholder="Kosongkan untuk menyinkronkan seluruh Drive..."
                    value={parentFolderId}
                    onChange={(e) => {
                      setParentFolderId(e.target.value);
                      localStorage.setItem('gdrive_parent_folder_id', e.target.value);
                    }}
                    style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                    Batasi pencarian file hanya dalam folder tertentu di Drive Anda dengan memasukkan ID foldernya (dari URL folder).
                  </span>
                </div>
              </div>

              {/* Connection status feedback */}
              {connectionStatus !== 'idle' && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '13px',
                  border: '1px solid',
                  textAlign: 'left',
                  background: connectionStatus === 'success' ? 'rgba(46, 194, 126, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderColor: connectionStatus === 'success' ? '#2ec27e' : '#ef4444',
                  color: connectionStatus === 'success' ? '#2e7d32' : '#c62828'
                }}>
                  {connectionStatus === 'success' && connectedUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>✅</span>
                      <span>
                        <strong>Terhubung!</strong> Akun: <strong>{connectedUser.name}</strong> ({connectedUser.email})
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚠️</span>
                      <span>{connectionError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button Row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary compact-btn"
                  onClick={() => testConnection(token)}
                  disabled={testingConnection || syncing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {testingConnection ? 'Memeriksa...' : '🔌 Hubungkan / Uji Koneksi'}
                </button>

                <button
                  type="button"
                  className="btn-primary compact-btn"
                  onClick={handleSync}
                  disabled={syncing || !token}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {syncing ? '🔄 Menyinkronkan...' : '🔄 Sinkronisasi Sekarang'}
                </button>

                <button
                  type="button"
                  className="btn-danger compact-btn"
                  onClick={handleClearSync}
                  disabled={syncing}
                  style={{ marginLeft: 'auto' }}
                >
                  🗑️ Hapus Metadata Drive
                </button>
              </div>

              {/* Sync Progress log */}
              {syncing && syncProgress && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px 14px', 
                  background: 'rgba(0,0,0,0.05)', 
                  borderRadius: '6px', 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left'
                }}>
                  <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid var(--text-secondary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>{syncProgress}</span>
                </div>
              )}
            </div>

            {/* Guide Card */}
            <div className="compact-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', textAlign: 'left' }}>
              <details>
                <summary style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                  ℹ️ Cara Mendapatkan Google Drive Access Token
                </summary>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p>Untuk menghubungkan aplikasi dengan Google Drive API secara aman tanpa server perantara, Anda membutuhkan token akses temporer.</p>
                  <ol style={{ paddingLeft: '20px' }}>
                    <li>Buka <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Google OAuth 2.0 Playground</a> di browser Anda.</li>
                    <li>Di panel kiri (Step 1), cari dan pilih <strong>Drive API v3</strong>.</li>
                    <li>Centang scope <code>https://www.googleapis.com/auth/drive.readonly</code> (atau <code>.../auth/drive</code> jika ingin akses penuh).</li>
                    <li>Klik tombol <strong>Authorize APIs</strong> dan masuk dengan akun Google Anda.</li>
                    <li>Di Step 2, klik tombol <strong>Exchange authorization code for tokens</strong>.</li>
                    <li>Salin nilai <strong>Access Token</strong> yang dihasilkan, lalu tempel pada input di atas.</li>
                  </ol>
                  <p style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Catatan: Token Playground biasanya berlaku selama 1 jam. Untuk penggunaan produksi jangka panjang, Anda dapat membuat Client ID sendiri di Google Cloud Console.</p>
                </div>
              </details>
            </div>

            {/* Style for Spinner (injected inline or via css) */}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

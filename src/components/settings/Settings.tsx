import React, { useState, useEffect } from 'react';
import InvoiceSettings from './InvoiceSettings';
import ServiceManager from '../services/ServiceManager';
import { useAppContext } from '../../contexts/AppContext';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

const Settings: React.FC = () => {
  const {
    activeSettingsTab,
    setActiveSettingsTab,
    showToast,
    files,
    addFile,
    updateFile,
    deleteFile,
    showConfirm,
    setConnectedUser: setGlobalConnectedUser,
    gdriveAccounts,
    setGdriveAccounts,
    refreshAccountToken,
    watchFolders,
    addWatchFolder,
    removeWatchFolder
  } = useAppContext();

  const [token, setToken] = useState(localStorage.getItem('gdrive_token') || '');
  const [parentFolderId, setParentFolderId] = useState(localStorage.getItem('gdrive_parent_folder_id') || '');
  const [clientId, setClientId] = useState(localStorage.getItem('gdrive_client_id') || '935478440552-k48b61cglp06gskchsc7qg6l2i1pkhn1.apps.googleusercontent.com');
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('gdrive_client_secret') || '');
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('gdrive_refresh_token') || '');
  const [showSecret, setShowSecret] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectedUser, setConnectedUser] = useState<{ name: string, email: string } | null>(null);
  const [connectionError, setConnectionError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [localPathInput, setLocalPathInput] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);

  useEffect(() => {
    if (activeSettingsTab === 'google-drive' && token) {
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
        const userObj = {
          name: data.user.displayName,
          email: data.user.emailAddress
        };
        setConnectedUser(userObj);
        setGlobalConnectedUser(userObj);
        setConnectionStatus('success');
      } else {
        setConnectedUser(null);
        setGlobalConnectedUser(null);
        setConnectionStatus('error');
        setConnectionError('Token tidak valid atau telah kedaluwarsa. Silakan perbarui token Anda.');
      }
    } catch (err) {
      setConnectedUser(null);
      setGlobalConnectedUser(null);
      setConnectionStatus('error');
      setConnectionError('Gagal menghubungkan ke Google API. Periksa koneksi internet Anda.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAddAccount = async () => {
    const port = 50007;
    try {
      setTestingConnection(true);
      await invoke('start_oauth_server', { port });

      const client_id = clientId.trim() || '935478440552-k48b61cglp06gskchsc7qg6l2i1pkhn1.apps.googleusercontent.com';
      const redirect_uri = encodeURIComponent(`http://localhost:${port}`);
      const scopes = encodeURIComponent(
        'https://www.googleapis.com/auth/drive.readonly ' +
        'https://www.googleapis.com/auth/userinfo.profile ' +
        'https://www.googleapis.com/auth/userinfo.email'
      );

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scopes}&prompt=select_account`;

      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(authUrl);

      showToast('Browser terbuka. Silakan lakukan proses login Google.', 'info');
    } catch (err: any) {
      console.error('OAuth start server error:', err);
      showToast(`Gagal memulai proses login: ${err.message || err}`, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleRemoveAccount = (email: string) => {
    showConfirm({
      title: 'Putuskan Akun',
      message: `Apakah Anda yakin ingin memutuskan akun "${email}"? Berkas Google Drive milik akun ini akan tetap ada di database sampai Anda melakukan sinkronisasi ulang.`,
      confirmText: 'Putuskan',
      type: 'danger',
      onConfirm: () => {
        const updatedAccounts = gdriveAccounts.filter(acc => acc.email !== email);
        setGdriveAccounts(updatedAccounts);

        if (connectedUser?.email === email) {
          if (updatedAccounts.length > 0) {
            const nextAcc = updatedAccounts[0];
            localStorage.setItem('gdrive_token', nextAcc.token);
            localStorage.setItem('gdrive_refresh_token', nextAcc.refreshToken);
            localStorage.setItem('gdrive_client_id', nextAcc.clientId);
            localStorage.setItem('gdrive_client_secret', nextAcc.clientSecret);
            setGlobalConnectedUser({ name: nextAcc.name, email: nextAcc.email });
            setConnectedUser({ name: nextAcc.name, email: nextAcc.email });
          } else {
            localStorage.removeItem('gdrive_token');
            localStorage.removeItem('gdrive_refresh_token');
            setGlobalConnectedUser(null);
            setConnectedUser(null);
          }
        }
        showToast(`Akun ${email} berhasil diputuskan.`, 'success');
      }
    });
  };

  const handleSync = async () => {
    let targetAccounts = [...gdriveAccounts];
    if (targetAccounts.length === 0) {
      if (token || (refreshToken && clientId && clientSecret)) {
        targetAccounts.push({
          email: connectedUser?.email || 'default_account',
          name: connectedUser?.name || 'Default Account',
          token: token,
          refreshToken: refreshToken,
          clientId: clientId,
          clientSecret: clientSecret
        });
      }
    }

    if (targetAccounts.length === 0) {
      showToast('Hubungkan minimal satu akun Google Drive terlebih dahulu!', 'error');
      return;
    }

    setSyncing(true);
    setSyncProgress('Memulai sinkronisasi multi-akun...');

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;

    const allDriveFilePaths = new Set<string>();

    try {
      for (const account of targetAccounts) {
        setSyncProgress(`Menghubungkan ke Google Drive untuk ${account.email}...`);

        let activeToken = account.token;
        if (!activeToken && account.refreshToken && account.clientId && account.clientSecret) {
          setSyncProgress(`Memperbarui token untuk ${account.email}...`);
          const renewed = await refreshAccountToken(account.email);
          if (renewed) {
            activeToken = renewed;
          }
        }

        if (!activeToken) {
          console.warn(`Token tidak tersedia untuk ${account.email}, melewati sinkronisasi.`);
          continue;
        }

        const q = "trashed = false";
        const driveFiles: any[] = [];
        let nextPageToken = '';
        let page = 1;

        do {
          setSyncProgress(`Mengambil file ${account.email} (Halaman ${page})...`);
          let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,parents,shared)&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
          if (nextPageToken) {
            url += `&pageToken=${nextPageToken}`;
          }

          let res = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${activeToken}`
            }
          });

          if (res.status === 401) {
            setSyncProgress(`Token kedaluwarsa untuk ${account.email}. Memperbarui token...`);
            const renewed = await refreshAccountToken(account.email);
            if (renewed) {
              activeToken = renewed;
              res = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${activeToken}`
                }
              });
            }
          }

          if (!res.ok) {
            console.error(`Gagal mengambil data halaman ${page} untuk ${account.email}: ${res.status}`);
            break;
          }

          const data = await res.json();
          const filesPage = data.files || [];
          driveFiles.push(...filesPage);

          nextPageToken = data.nextPageToken || '';
          page++;
        } while (nextPageToken);

        // Penyaringan rekursif secara lokal jika parentFolderId diisi
        let filteredDriveFiles = driveFiles;
        if (parentFolderId.trim()) {
          const targetParentId = parentFolderId.trim();
          const descendantIds = new Set<string>();
          descendantIds.add(targetParentId);

          let addedNew = true;
          while (addedNew) {
            addedNew = false;
            for (const df of driveFiles) {
              const parents = df.parents || [];
              for (const p of parents) {
                if (descendantIds.has(p) && !descendantIds.has(df.id)) {
                  descendantIds.add(df.id);
                  addedNew = true;
                }
              }
            }
          }

          filteredDriveFiles = driveFiles.filter(df => {
            if (df.id === targetParentId) return false;
            const parents = df.parents || [];
            return parents.some((p: string) => descendantIds.has(p));
          });
        }

        setSyncProgress(`Menyelaraskan data lokal untuk ${account.email} (${filteredDriveFiles.length} file)...`);

        const existingGDriveFiles = files.filter(f => f.type === 'gdrive');

        for (const df of filteredDriveFiles) {
          const path = `gdrive://${df.id}`;
          allDriveFilePaths.add(path);
          const existing = existingGDriveFiles.find(f => f.path === path);

          const parentId = df.parents && df.parents.length > 0 ? df.parents[0] : 'root';
          const isShared = df.shared ? '1' : '0';

          const modifiedByValue = `${df.size ? df.size.toString() : '0'}|${parentId}|${isShared}|${account.email}`;

          const fileData = {
            path,
            filename: df.name,
            type: 'gdrive',
            status: existing ? existing.status : 'Cloud',
            version_label: df.mimeType,
            last_modified: df.modifiedTime,
            modified_by: modifiedByValue,
            is_readonly: true
          };

          if (existing) {
            await updateFile({
              ...existing,
              ...fileData
            });
            totalUpdated++;
          } else {
            await addFile(fileData);
            totalCreated++;
          }
        }
      }

      // Hapus file-file cloud lokal yang tidak ada lagi di Drive manapun
      const existingGDriveFiles = files.filter(f => f.type === 'gdrive');
      for (const lf of existingGDriveFiles) {
        if (!allDriveFilePaths.has(lf.path)) {
          await deleteFile(lf.id!);
          totalDeleted++;
        }
      }

      showToast(`Sinkronisasi selesai! ${totalCreated} file baru, ${totalUpdated} diperbarui, ${totalDeleted} dihapus.`, 'success');
      if (token) {
        testConnection(token);
      }
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

  const handleSaveConfig = () => {
    localStorage.setItem('gdrive_token', token);
    localStorage.setItem('gdrive_client_id', clientId);
    localStorage.setItem('gdrive_client_secret', clientSecret);
    localStorage.setItem('gdrive_refresh_token', refreshToken);
    localStorage.setItem('gdrive_parent_folder_id', parentFolderId);
    showToast('Konfigurasi Google Drive berhasil disimpan!', 'success');
    if (token) {
      testConnection(token);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: 'Pilih Folder untuk Dipantau'
      });
      if (selected && typeof selected === 'string') {
        setLocalPathInput(selected);
      }
    } catch (err: any) {
      console.error('Error selecting directory:', err);
      showToast('Gagal membuka dialog pemilihan folder', 'error');
    }
  };

  const handleAddLocalFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPathInput.trim()) {
      showToast('Path folder tidak boleh kosong!', 'error');
      return;
    }
    setAddingFolder(true);
    try {
      const res = await addWatchFolder(localPathInput.trim());
      showToast(res, 'success');
      setLocalPathInput('');
    } catch (err: any) {
      showToast(err.message || err.toString(), 'error');
    } finally {
      setAddingFolder(false);
    }
  };

  const handleRemoveWatchFolder = (id: number, path: string) => {
    showConfirm({
      title: 'Hapus Pemantauan Folder',
      message: `Apakah Anda yakin ingin menghapus pemantauan untuk folder "${path}"? Indeks berkas di dalam folder ini akan dihapus dari aplikasi (berkas fisik tidak akan dihapus).`,
      confirmText: 'Hapus Pemantauan',
      type: 'danger',
      onConfirm: async () => {
         try {
           await removeWatchFolder(id);
           showToast('Pemantauan folder berhasil dihapus.', 'success');
         } catch (err: any) {
           showToast(err.message || err.toString(), 'error');
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
            onClick={() => setActiveSettingsTab('local-folders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSettingsTab === 'local-folders' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeSettingsTab === 'local-folders' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              marginBottom: '-1px'
            }}
          >
            📁 Folder Lokal Dipantau
          </button>

          <button
            onClick={() => setActiveSettingsTab('google-drive')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeSettingsTab === 'google-drive' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeSettingsTab === 'google-drive' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              marginBottom: '-1px'
            }}
          >
            ☁️ Google Drive
          </button>
        </div>
      </div>

      {/* Area Konten Utama */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {activeSettingsTab === 'invoice' && <InvoiceSettings />}
        {activeSettingsTab === 'services' && <ServiceManager />}
        
        {/* TAB: Folder Lokal Dipantau */}
        {activeSettingsTab === 'local-folders' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Folder Lokal yang Dipantau Card */}
            <div className="compact-panel" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  📁 Folder Lokal yang Dipantau
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                  Daftarkan folder lokal dari komputer Anda untuk dipantau secara real-time. Berkas di dalamnya akan otomatis diindeks secara offline-first.
                </p>
                
                {watchFolders.length === 0 ? (
                  <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center', marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Belum ada folder lokal yang dipantau.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                    {watchFolders.map(folder => (
                      <div key={folder.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={folder.path}>
                            {folder.path.split('/').pop() || folder.path}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={folder.path}>
                            {folder.path}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-danger compact-btn"
                          onClick={() => handleRemoveWatchFolder(folder.id!, folder.path)}
                          style={{ padding: '4px 8px', fontSize: '11px', height: '24px', cursor: 'pointer', flexShrink: 0, marginLeft: '12px' }}
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddLocalFolder} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="compact-form-group">
                  <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Path Folder Absolut</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="compact-input"
                      placeholder="Klik Pilih Folder..."
                      value={localPathInput}
                      readOnly
                      onClick={handleSelectFolder}
                      style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer' }}
                    />
                    <button
                      type="button"
                      onClick={handleSelectFolder}
                      className="btn-secondary compact-btn"
                      style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      📂 Pilih Folder
                    </button>
                    <button
                      type="submit"
                      disabled={addingFolder || !localPathInput.trim()}
                      className="btn-primary compact-btn"
                      style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      {addingFolder ? 'Menambah...' : '➕ Tambah'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB: Google Drive */}
        {activeSettingsTab === 'google-drive' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', alignItems: 'stretch' }}>
              {/* Akun Google Drive Terhubung */}
              <div className="compact-panel" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    👤 Akun Google Drive Terhubung
                  </h2>

                  {gdriveAccounts.length === 0 ? (
                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center', marginBottom: '16px' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Belum ada akun Google Drive yang terhubung.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {gdriveAccounts.map(account => (
                        <div key={account.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{account.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{account.email}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-danger compact-btn"
                            onClick={() => handleRemoveAccount(account.email)}
                            style={{ padding: '4px 8px', fontSize: '11px', height: '24px', cursor: 'pointer' }}
                          >
                            Disconnect
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-primary compact-btn"
                  onClick={handleAddAccount}
                  disabled={testingConnection || syncing}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: 'auto' }}
                >
                  ➕ Hubungkan Akun Google Baru
                </button>
              </div>

              {/* Integrasi Google Drive Card */}
              <div className="compact-panel" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
                <div>
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
                          placeholder="Masukkan Access Token Anda (Bisa kosong jika Refresh Token diisi)..."
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="compact-form-group">
                        <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Google Client ID (Jangka Panjang)</label>
                        <input
                          type="text"
                          className="compact-input"
                          placeholder="Masukkan Client ID Google Cloud..."
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="compact-form-group">
                        <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Google Client Secret (Jangka Panjang)</label>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type={showSecret ? 'text' : 'password'}
                            className="compact-input"
                            placeholder="Masukkan Client Secret..."
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(!showSecret)}
                            className="btn-secondary compact-btn"
                            style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {showSecret ? '👁' : '👁'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="compact-form-group">
                      <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Google OAuth2 Refresh Token (Jangka Panjang)</label>
                      <input
                        type="password"
                        className="compact-input"
                        placeholder="Masukkan Refresh Token Anda..."
                        value={refreshToken}
                        onChange={(e) => setRefreshToken(e.target.value)}
                        style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                        💡 Dapatkan Refresh Token dari OAuth Playground menggunakan Client ID Anda agar aplikasi tetap terhubung selamanya.
                      </span>
                    </div>

                    <div className="compact-form-group">
                      <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>ID Folder Induk (Opsional)</label>
                      <input
                        type="text"
                        className="compact-input"
                        placeholder="Kosongkan untuk menyinkronkan seluruh Drive..."
                        value={parentFolderId}
                        onChange={(e) => setParentFolderId(e.target.value)}
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
                      className="btn-primary compact-btn"
                      onClick={handleSaveConfig}
                      disabled={syncing}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      💾 Simpan Konfigurasi
                    </button>

                    <button
                      type="button"
                      className="btn-secondary compact-btn"
                      onClick={handleSync}
                      disabled={syncing || (gdriveAccounts.length === 0 && !token)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      {syncing ? '🔄 Menyinkronkan...' : '🔄 Sinkronisasi Sekarang'}
                    </button>

                    <button
                      type="button"
                      className="btn-danger compact-btn"
                      onClick={handleClearSync}
                      disabled={syncing}
                      style={{ marginLeft: 'auto', cursor: 'pointer' }}
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
              </div>
            </div>

            {/* Guide Card */}
            <div className="compact-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', textAlign: 'left' }}>
              <details>
                <summary style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                  ℹ️ Panduan Mendapatkan Kredensial Google Drive Jangka Panjang (Produksi)
                </summary>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    A. Membuat OAuth Credentials di Google Cloud Console:
                  </p>
                  <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Buka <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Google Cloud Console</a> dan buat project baru.</li>
                    <li>Cari <strong>Google Drive API</strong> di kolom pencarian atas dan klik <strong>Enable</strong> (Aktifkan).</li>
                    <li>Masuk to menu <strong>OAuth consent screen</strong> di sidebar kiri, pilih User Type <strong>External</strong>, lalu isi form informasi aplikasi Anda. Pada bagian <em>Test Users</em>, tambahkan email Gmail Anda sendiri.</li>
                    <li>Buka menu <strong>Credentials</strong> di sidebar kiri, klik <strong>Create Credentials</strong> &gt; <strong>OAuth client ID</strong>.</li>
                    <li>Pilih Application Type: <strong>Desktop app</strong>, beri nama bebas, lalu klik <strong>Create</strong>.</li>
                    <li>Salin nilai <strong>Client ID</strong> dan <strong>Client Secret</strong> yang didapatkan ke kolom input di atas.</li>
                  </ol>

                  <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '10px', marginBottom: '4px' }}>
                    B. Mendapatkan Refresh Token melalui OAuth Playground:
                  </p>
                  <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Buka <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Google OAuth 2.0 Playground</a>.</li>
                    <li>Klik ikon <strong>Gear (Settings)</strong> di pojok kanan atas Playground.</li>
                    <li>Centang opsi <strong>Use your own OAuth credentials</strong>, lalu masukkan <strong>Client ID</strong> and <strong>Client Secret</strong> yang Anda buat di Langkah A.</li>
                    <li>Di panel kiri (Step 1), cari dan pilih <strong>Drive API v3</strong>, centang scope <code>https://www.googleapis.com/auth/drive.readonly</code> (atau <code>.../auth/drive</code> jika ingin akses penuh), kemudian klik <strong>Authorize APIs</strong>.</li>
                    <li>Login menggunakan akun Google yang sudah didaftarkan sebagai Test User di Langkah A.</li>
                    <li>Di Step 2, klik tombol <strong>Exchange authorization code for tokens</strong>.</li>
                    <li>Salin nilai <strong>Refresh Token</strong> yang tampil di panel kanan Playground, lalu tempel ke kolom input di atas.</li>
                  </ol>
                  <p style={{ fontStyle: 'italic', color: 'var(--accent)', marginTop: '6px' }}>
                    Catatan: Menggunakan kombinasi Client ID, Client Secret, dan Refresh Token akan membuat koneksi Google Drive Anda bertahan selamanya (Access Token akan diperbarui otomatis di latar belakang).
                  </p>
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

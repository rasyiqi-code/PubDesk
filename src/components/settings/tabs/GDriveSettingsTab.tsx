import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * Tab Pengaturan: Google Drive.
 * Mengelola koneksi, konfigurasi OAuth, dan sinkronisasi berkas Google Drive.
 * State & logic GDrive dipindahkan dari Settings.tsx ke sini agar Settings.tsx
 * hanya bertugas sebagai tab container.
 */
const GDriveSettingsTab: React.FC = () => {
  const {
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
  } = useAppContext();

  const [token, setToken] = useState(localStorage.getItem('gdrive_token') || '');
  const [parentFolderId, setParentFolderId] = useState(localStorage.getItem('gdrive_parent_folder_id') || '');
  const [clientId, setClientId] = useState(
    localStorage.getItem('gdrive_client_id') || '935478440552-k48b61cglp06gskchsc7qg6l2i1pkhn1.apps.googleusercontent.com'
  );
  const [clientSecret, setClientSecret] = useState(localStorage.getItem('gdrive_client_secret') || '');
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('gdrive_refresh_token') || '');
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectedUser, setConnectedUser] = useState<{ name: string; email: string } | null>(null);
  const [connectionError, setConnectionError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState('');

  useEffect(() => {
    if (token) testConnection(token);
  }, []);

  // Uji koneksi ke Google Drive dengan token yang diberikan
  const testConnection = async (currentToken: string) => {
    if (!currentToken) return;
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const userObj = { name: data.user.displayName, email: data.user.emailAddress };
        setConnectedUser(userObj);
        setGlobalConnectedUser(userObj);
        setConnectionStatus('success');
      } else {
        setConnectedUser(null);
        setGlobalConnectedUser(null);
        setConnectionStatus('error');
        setConnectionError('Token tidak valid atau telah kedaluwarsa. Silakan perbarui token Anda.');
      }
    } catch {
      setConnectedUser(null);
      setGlobalConnectedUser(null);
      setConnectionStatus('error');
      setConnectionError('Gagal menghubungkan ke Google API. Periksa koneksi internet Anda.');
    } finally {
      setTestingConnection(false);
    }
  };

  // Mulai proses OAuth untuk menambahkan akun Google baru
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

  // Putuskan koneksi akun Google Drive
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

  // Simpan konfigurasi OAuth ke localStorage
  const handleSaveConfig = () => {
    localStorage.setItem('gdrive_token', token);
    localStorage.setItem('gdrive_client_id', clientId);
    localStorage.setItem('gdrive_client_secret', clientSecret);
    localStorage.setItem('gdrive_refresh_token', refreshToken);
    localStorage.setItem('gdrive_parent_folder_id', parentFolderId);
    showToast('Konfigurasi Google Drive berhasil disimpan!', 'success');
    if (token) testConnection(token);
  };

  // Sinkronisasi semua akun Google Drive yang terdaftar
  const handleSync = async () => {
    let targetAccounts = [...gdriveAccounts];
    if (targetAccounts.length === 0) {
      if (token || (refreshToken && clientId && clientSecret)) {
        targetAccounts.push({
          email: connectedUser?.email || 'default_account',
          name: connectedUser?.name || 'Default Account',
          token,
          refreshToken,
          clientId,
          clientSecret
        });
      }
    }
    if (targetAccounts.length === 0) {
      showToast('Hubungkan minimal satu akun Google Drive terlebih dahulu!', 'error');
      return;
    }

    setSyncing(true);
    setSyncProgress('Memulai sinkronisasi multi-akun...');
    let totalCreated = 0, totalUpdated = 0, totalDeleted = 0;
    const allDriveFilePaths = new Set<string>();

    try {
      for (const account of targetAccounts) {
        setSyncProgress(`Menghubungkan ke Google Drive untuk ${account.email}...`);
        let activeToken = account.token;

        if (!activeToken && account.refreshToken && account.clientId && account.clientSecret) {
          setSyncProgress(`Memperbarui token untuk ${account.email}...`);
          const renewed = await refreshAccountToken(account.email);
          if (renewed) activeToken = renewed;
        }
        if (!activeToken) { console.warn(`Token tidak tersedia untuk ${account.email}, melewati.`); continue; }

        // Ambil semua file dari Drive dengan pagination
        const driveFiles: any[] = [];
        let nextPageToken = '';
        let page = 1;
        do {
          setSyncProgress(`Mengambil file ${account.email} (Halaman ${page})...`);
          let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent('trashed = false')}&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size,parents,shared)&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
          if (nextPageToken) url += `&pageToken=${nextPageToken}`;

          let res = await fetch(url, { headers: { 'Authorization': `Bearer ${activeToken}` } });
          if (res.status === 401) {
            setSyncProgress(`Token kedaluwarsa untuk ${account.email}. Memperbarui...`);
            const renewed = await refreshAccountToken(account.email);
            if (renewed) { activeToken = renewed; res = await fetch(url, { headers: { 'Authorization': `Bearer ${activeToken}` } }); }
          }
          if (!res.ok) { console.error(`Gagal halaman ${page} akun ${account.email}: ${res.status}`); break; }
          const data = await res.json();
          driveFiles.push(...(data.files || []));
          nextPageToken = data.nextPageToken || '';
          page++;
        } while (nextPageToken);

        // Filter berkas berdasarkan folder induk jika dikonfigurasi
        let filteredDriveFiles = driveFiles;
        if (parentFolderId.trim()) {
          const targetParentId = parentFolderId.trim();
          const descendantIds = new Set<string>([targetParentId]);
          let addedNew = true;
          while (addedNew) {
            addedNew = false;
            for (const df of driveFiles) {
              for (const p of (df.parents || [])) {
                if (descendantIds.has(p) && !descendantIds.has(df.id)) { descendantIds.add(df.id); addedNew = true; }
              }
            }
          }
          filteredDriveFiles = driveFiles.filter(df => {
            if (df.id === targetParentId) return false;
            return (df.parents || []).some((p: string) => descendantIds.has(p));
          });
        }

        setSyncProgress(`Menyelaraskan data lokal untuk ${account.email} (${filteredDriveFiles.length} file)...`);
        const existingGDriveFiles = files.filter(f => f.type === 'gdrive');

        for (const df of filteredDriveFiles) {
          const path = `gdrive://${df.id}`;
          allDriveFilePaths.add(path);
          const existing = existingGDriveFiles.find(f => f.path === path);
          const parentId = df.parents?.[0] || 'root';
          const isShared = df.shared ? '1' : '0';
          const fileData = {
            path,
            filename: df.name,
            type: 'gdrive',
            status: existing ? existing.status : 'Cloud',
            version_label: df.mimeType,
            last_modified: df.modifiedTime,
            modified_by: `${df.size || '0'}|${parentId}|${isShared}|${account.email}`,
            is_readonly: true
          };
          if (existing) { await updateFile({ ...existing, ...fileData }); totalUpdated++; }
          else { await addFile(fileData); totalCreated++; }
        }
      }

      // Hapus berkas cloud lokal yang sudah tidak ada di Drive
      for (const lf of files.filter(f => f.type === 'gdrive')) {
        if (!allDriveFilePaths.has(lf.path)) { await deleteFile(lf.id!); totalDeleted++; }
      }

      showToast(`Sinkronisasi selesai! ${totalCreated} baru, ${totalUpdated} diperbarui, ${totalDeleted} dihapus.`, 'success');
      if (token) testConnection(token);
    } catch (error: any) {
      console.error(error);
      showToast(`Gagal sinkronisasi: ${error.message || error}`, 'error');
    } finally {
      setSyncing(false);
      setSyncProgress('');
    }
  };

  // Hapus semua metadata GDrive dari database lokal
  const handleClearSync = () => {
    showConfirm({
      title: 'Hapus Metadata Google Drive',
      message: 'Apakah Anda yakin ingin menghapus semua metadata berkas Google Drive dari aplikasi? Berkas fisik yang sudah di-download di cache tidak akan dihapus.',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          for (const f of files.filter(f => f.type === 'gdrive')) await deleteFile(f.id!);
          showToast('Metadata Google Drive berhasil dihapus dari aplikasi', 'success');
        } catch (error) {
          console.error(error);
          showToast('Gagal menghapus metadata Google Drive', 'error');
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', alignItems: 'stretch' }}>

        {/* Akun terhubung */}
        <div className="compact-panel" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              👤 Akun Google Drive Terhubung
            </h2>
            {gdriveAccounts.length === 0 ? (
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center', marginBottom: '16px' }}>
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
                    <button type="button" className="btn-danger compact-btn" onClick={() => handleRemoveAccount(account.email)} style={{ padding: '4px 8px', fontSize: '11px', height: '24px', cursor: 'pointer' }}>
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="btn-primary compact-btn" onClick={handleAddAccount} disabled={testingConnection || syncing} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '13px', cursor: 'pointer', marginTop: 'auto' }}>
            ➕ Hubungkan Akun Google Baru
          </button>
        </div>

        {/* Konfigurasi OAuth */}
        <div className="compact-panel" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              ☁️ Integrasi Google Drive
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Hubungkan PubDesk dengan Google Drive untuk menyinkronkan daftar naskah dan aset secara otomatis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Access Token */}
              <div className="compact-form-group">
                <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>OAuth2 Access Token</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type={showToken ? 'text' : 'password'} className="compact-input" placeholder="Masukkan Access Token (opsional jika Refresh Token diisi)..." value={token} onChange={e => setToken(e.target.value)} style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                  <button type="button" onClick={() => setShowToken(!showToken)} className="btn-secondary compact-btn" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showToken ? '👁️ Sembunyikan' : '👁️ Tampilkan'}
                  </button>
                </div>
              </div>

              {/* Client ID & Secret */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="compact-form-group">
                  <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Client ID</label>
                  <input type="text" className="compact-input" placeholder="Masukkan Client ID..." value={clientId} onChange={e => setClientId(e.target.value)} style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                </div>
                <div className="compact-form-group">
                  <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Client Secret</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type={showSecret ? 'text' : 'password'} className="compact-input" placeholder="Masukkan Client Secret..." value={clientSecret} onChange={e => setClientSecret(e.target.value)} style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} className="btn-secondary compact-btn" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👁</button>
                  </div>
                </div>
              </div>

              {/* Refresh Token */}
              <div className="compact-form-group">
                <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Refresh Token (Jangka Panjang)</label>
                <input type="password" className="compact-input" placeholder="Masukkan Refresh Token Anda..." value={refreshToken} onChange={e => setRefreshToken(e.target.value)} style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  💡 Dapatkan Refresh Token dari OAuth Playground menggunakan Client ID Anda.
                </span>
              </div>

              {/* Parent Folder ID */}
              <div className="compact-form-group">
                <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>ID Folder Induk (Opsional)</label>
                <input type="text" className="compact-input" placeholder="Kosongkan untuk seluruh Drive..." value={parentFolderId} onChange={e => setParentFolderId(e.target.value)} style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            {/* Status koneksi */}
            {connectionStatus !== 'idle' && (
              <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', fontSize: '13px', border: '1px solid', background: connectionStatus === 'success' ? 'rgba(46, 194, 126, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: connectionStatus === 'success' ? '#2ec27e' : '#ef4444', color: connectionStatus === 'success' ? '#2e7d32' : '#c62828' }}>
                {connectionStatus === 'success' && connectedUser ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✅</span>
                    <span><strong>Terhubung!</strong> Akun: <strong>{connectedUser.name}</strong> ({connectedUser.email})</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span><span>{connectionError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tombol aksi */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary compact-btn" onClick={handleSaveConfig} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                💾 Simpan Konfigurasi
              </button>
              <button type="button" className="btn-secondary compact-btn" onClick={handleSync} disabled={syncing || (gdriveAccounts.length === 0 && !token)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                {syncing ? '🔄 Menyinkronkan...' : '🔄 Sinkronisasi Sekarang'}
              </button>
              <button type="button" className="btn-danger compact-btn" onClick={handleClearSync} disabled={syncing} style={{ marginLeft: 'auto', cursor: 'pointer' }}>
                🗑️ Hapus Metadata Drive
              </button>
            </div>

            {/* Progress sinkronisasi */}
            {syncing && syncProgress && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid var(--text-secondary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>{syncProgress}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panduan kredensial */}
      <div className="compact-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
        <details>
          <summary style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
            ℹ️ Panduan Mendapatkan Kredensial Google Drive Jangka Panjang (Produksi)
          </summary>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>A. Membuat OAuth Credentials di Google Cloud Console:</p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Buka <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google Cloud Console</a> dan buat project baru.</li>
              <li>Cari <strong>Google Drive API</strong> dan klik <strong>Enable</strong>.</li>
              <li>Masuk ke <strong>OAuth consent screen</strong>, pilih External, isi form, dan tambahkan email Anda sebagai Test User.</li>
              <li>Buka <strong>Credentials</strong> → <strong>Create Credentials</strong> → <strong>OAuth client ID</strong> → Desktop app.</li>
              <li>Salin <strong>Client ID</strong> dan <strong>Client Secret</strong> ke kolom di atas.</li>
            </ol>
            <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '10px', marginBottom: '4px' }}>B. Mendapatkan Refresh Token melalui OAuth Playground:</p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>Buka <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google OAuth 2.0 Playground</a>.</li>
              <li>Klik ikon Gear, centang <strong>Use your own OAuth credentials</strong>, masukkan Client ID & Secret.</li>
              <li>Pilih scope <code>drive.readonly</code> di Step 1, klik <strong>Authorize APIs</strong>.</li>
              <li>Di Step 2, klik <strong>Exchange authorization code for tokens</strong>.</li>
              <li>Salin <strong>Refresh Token</strong> ke kolom input di atas.</li>
            </ol>
          </div>
        </details>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GDriveSettingsTab;

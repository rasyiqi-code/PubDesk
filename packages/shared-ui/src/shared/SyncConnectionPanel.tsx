import React, { useEffect, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface SyncConfig {
  enabled: boolean;
  device_id: string | null;
  workspace_id: string | null;
  admin_setup_complete: boolean;
}

interface PeerInfo {
  peer_id: string;
  source: string;
}

interface SyncStatus {
  enabled: boolean;
  workspace_id: string | null;
  local_peer_id: string;
  connected_peers: PeerInfo[];
  pending_outbox_count: number;
  last_sync_at: string | null;
  error: string | null;
}

interface SyncConnectionPanelProps {
  isAdmin?: boolean;
}

export const SyncConnectionPanel: React.FC<SyncConnectionPanelProps> = ({ isAdmin = false }) => {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [employeePin, setEmployeePin] = useState('');
  const [adminPinForInvite, setAdminPinForInvite] = useState('');
  const [newEmployeePin, setNewEmployeePin] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState('');
  const [rendezvousUrl, setRendezvousUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const loadConfig = useCallback(async () => {
    try {
      const cfg = await invoke<SyncConfig>('get_sync_config_command');
      setConfig(cfg);
    } catch (err: any) {
      console.error('Gagal load sync config:', err);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const st = await invoke<SyncStatus>('get_sync_status');
      setStatus(st);
    } catch (err: any) {
      console.error('Gagal load sync status:', err);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    (async () => {
      try {
        const url = await invoke<string>('get_sync_rendezvous_url');
        setRendezvousUrl(url);
      } catch (err: any) {
        console.error('Gagal load rendezvous url:', err);
      }
    })();
    const interval = setInterval(() => {
      loadStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadConfig, loadStatus]);

  useEffect(() => {
    const unlistenApplied = listen('sync-applied', (event) => {
      const payload = event.payload as { table: string; row_id: string; action: string };
      showMessage(`Sinkron: ${payload.action} ${payload.table} #${payload.row_id}`);
      loadStatus();
    });
    const unlistenConnected = listen('sync-peer-connected', (event) => {
      const payload = event.payload as { peer_id: string; source: string };
      showMessage(`Peer terhubung via ${payload.source}`);
      loadStatus();
    });
    const unlistenDisconnected = listen('sync-peer-disconnected', () => {
      loadStatus();
    });
    return () => {
      unlistenApplied.then((f) => f());
      unlistenConnected.then((f) => f());
      unlistenDisconnected.then((f) => f());
    };
  }, [loadStatus]);

  const handleCreateWorkspace = async () => {
    if (!pin) return;
    setLoading(true);
    try {
      const ws = await invoke<string>('create_sync_workspace', { adminPin: pin });
      setUnlocked(true);
      showMessage(`Workspace ${ws} dibuat. Berbagi invite code ke karyawan.`);
      loadConfig();
      loadStatus();
    } catch (err: any) {
      showMessage(`Gagal: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async () => {
    if (!inviteCode || !employeePin) return;
    setLoading(true);
    try {
      const ws = await invoke<string>('join_sync_workspace', {
        inviteCode,
        employeePin,
      });
      setUnlocked(true);
      showMessage(`Bergabung ke workspace ${ws}`);
      loadConfig();
      loadStatus();
    } catch (err: any) {
      showMessage(`Gagal bergabung: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!pin) return;
    setLoading(true);
    try {
      const ws = await invoke<string>('unlock_sync', { pin });
      setUnlocked(true);
      showMessage(`Workspace ${ws} aktif`);
      loadStatus();
    } catch (err: any) {
      showMessage(`PIN salah: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      await invoke('lock_sync');
      setUnlocked(false);
      setPin('');
      showMessage('Sync dikunci');
    } catch (err: any) {
      showMessage(`Gagal kunci: ${err}`);
    }
  };

  const handleToggleEnabled = async () => {
    if (!status) return;
    try {
      await invoke('set_sync_enabled', { enabled: !status.enabled });
      loadConfig();
      loadStatus();
    } catch (err: any) {
      showMessage(`Gagal: ${err}`);
    }
  };

  const handleCreateInvite = async () => {
    if (!adminPinForInvite || !newEmployeePin) return;
    try {
      const code = await invoke<string>('create_employee_invite', {
        adminPin: adminPinForInvite,
        employeePin: newEmployeePin,
      });
      setGeneratedInvite(code);
      showMessage('Invite code dibuat');
    } catch (err: any) {
      showMessage(`Gagal: ${err}`);
    }
  };

  const handleSaveRendezvousUrl = async () => {
    try {
      await invoke('set_sync_rendezvous_url', { url: rendezvousUrl.trim() });
      showMessage('URL Worker disimpan');
    } catch (err: any) {
      showMessage(`Gagal simpan URL: ${err}`);
    }
  };

  const copyInvite = () => {
    if (generatedInvite) {
      navigator.clipboard.writeText(generatedInvite);
      showMessage('Invite code disalin');
    }
  };

  const renderSetup = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {isAdmin && (
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
            Setup Admin (PC Pusat)
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Buat workspace baru. PIN admin digunakan untuk membuka kunci data sync.
          </p>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Buat PIN admin"
            style={inputStyle}
          />
          <button onClick={handleCreateWorkspace} disabled={loading || !pin} style={btnPrimaryStyle}>
            {loading ? '...' : 'Buat Workspace'}
          </button>
        </div>
      )}

      <div style={{ borderTop: isAdmin ? '1px solid var(--border)' : 'none', paddingTop: isAdmin ? '24px' : 0 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
          {isAdmin ? 'Join sebagai Karyawan' : 'Aktivasi Aplikasi Client'}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Masukkan invite code dari admin dan PIN karyawan Anda.
        </p>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Invite code"
          style={inputStyle}
        />
        <input
          type="password"
          value={employeePin}
          onChange={(e) => setEmployeePin(e.target.value)}
          placeholder="PIN karyawan"
          style={inputStyle}
        />
        <button
          onClick={handleJoinWorkspace}
          disabled={loading || !inviteCode || !employeePin}
          style={btnPrimaryStyle}
        >
          {loading ? '...' : 'Gabung Workspace'}
        </button>
      </div>
    </div>
  );

  const renderUnlock = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Workspace sudah di-setup. Masukkan PIN untuk membuka kunci sync.
      </p>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="PIN Anda"
        style={inputStyle}
      />
      <button onClick={handleUnlock} disabled={loading || !pin} style={btnPrimaryStyle}>
        {loading ? '...' : 'Buka Kunci Sync'}
      </button>
    </div>
  );

  const renderActive = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${status?.enabled ? '#10b981' : '#ef4444'}`,
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status Sync</div>
          <div style={{ fontSize: '15px', fontWeight: 700 }}>
            {status?.enabled ? 'Aktif' : 'Nonaktif'}
          </div>
        </div>
        <button onClick={handleToggleEnabled} style={btnSecondaryStyle}>
          {status?.enabled ? 'Matikan' : 'Aktifkan'}
        </button>
      </div>

      <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <strong>Workspace:</strong> {status?.workspace_id || '-'}
        </div>
        <div>
          <strong>Peer ID lokal:</strong>{' '}
          <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {status?.local_peer_id?.slice(0, 16)}...
          </span>
        </div>
        <div>
          <strong>Peer terhubung:</strong> {status?.connected_peers.length || 0}
        </div>
        {status?.connected_peers && status.connected_peers.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            {status.connected_peers.map((p, i) => (
              <div
                key={p.peer_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  marginBottom: '4px',
                  fontSize: '12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    flexShrink: 0,
                  }}
                  title="Terhubung"
                />
                <span style={{ fontFamily: 'monospace', fontSize: '11px', flex: 1 }}>
                  {p.peer_id.slice(0, 12)}...
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  {p.source}
                </span>
              </div>
            ))}
          </div>
        )}
        <div>
          <strong>Menunggu kirim:</strong> {status?.pending_outbox_count || 0}
        </div>
        <div>
          <strong>Sync terakhir:</strong>{' '}
          {status?.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : '-'}
        </div>
        {status?.error && (
          <div style={{ color: '#ef4444', fontSize: '12px' }}>Error: {status.error}</div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
          Cloudflare Rendezvous Worker
        </h4>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Opsional. Isi URL Worker untuk membantu peer menemukan satu sama lain antar kantor.
        </p>
        <input
          type="text"
          value={rendezvousUrl}
          onChange={(e) => setRendezvousUrl(e.target.value)}
          placeholder="https://pubdesk-rendezvous.your-account.workers.dev"
          style={inputStyle}
        />
        <button onClick={handleSaveRendezvousUrl} style={btnSecondaryStyle}>
          Simpan URL Worker
        </button>
      </div>

      {isAdmin && (
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>
          Invite Karyawan Baru
        </h4>
        <input
          type="password"
          value={adminPinForInvite}
          onChange={(e) => setAdminPinForInvite(e.target.value)}
          placeholder="PIN admin"
          style={inputStyle}
        />
        <input
          type="password"
          value={newEmployeePin}
          onChange={(e) => setNewEmployeePin(e.target.value)}
          placeholder="PIN karyawan baru"
          style={inputStyle}
        />
        <button onClick={handleCreateInvite} style={btnSecondaryStyle}>
          Buat Invite Code
        </button>
        {generatedInvite && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: '12px',
              wordBreak: 'break-all',
            }}
          >
            <div style={{ fontFamily: 'monospace', marginBottom: '8px' }}>{generatedInvite}</div>
            <button onClick={copyInvite} style={btnSecondaryStyle}>
              Salin Code
            </button>
          </div>
        )}
      </div>
      )}

      <button onClick={handleLock} style={{ ...btnSecondaryStyle, alignSelf: 'flex-start' }}>
        Kunci Sync
      </button>
    </div>
  );

  return (
    <div style={{ width: '100%', padding: '8px 0' }}>
      <h2
        style={{
          fontSize: '15px',
          fontWeight: 700,
          marginBottom: '16px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '8px',
        }}
      >
        Sinkronisasi Real-Time (P2P)
      </h2>

      {message && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 12px',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '12px',
            color: '#10b981',
          }}
        >
          {message}
        </div>
      )}

      {!config && <div style={{ fontSize: '13px' }}>Memuat...</div>}
      {config && !config.workspace_id && renderSetup()}
      {config && config.workspace_id && !unlocked && renderUnlock()}
      {config && config.workspace_id && unlocked && renderActive()}
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: '10px',
  borderRadius: '0px',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimaryStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '0px',
  border: 'none',
  background: '#10b981',
  color: 'white',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '0px',
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontSize: '12px',
  cursor: 'pointer',
};

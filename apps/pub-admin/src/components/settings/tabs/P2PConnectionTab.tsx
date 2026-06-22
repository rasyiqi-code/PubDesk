import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface P2PConfig {
  enabled: boolean;
  role: string;
  host_address: string;
  auth_token: string;
  local_peer_id: string;
}

interface P2PStatus {
  is_connected: boolean;
  peer_id: string;
  active_peers: string[];
  local_addresses: string[];
}

const P2PConnectionTab: React.FC = () => {
  const [config, setConfig] = useState<P2PConfig>({
    enabled: false,
    role: 'host',
    host_address: '',
    auth_token: '',
    local_peer_id: '',
  });

  const [status, setStatus] = useState<P2PStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Load config & status saat pertama kali render
  useEffect(() => {
    loadConfig();
  }, []);

  // Poll status setiap 3 detik jika enabled
  useEffect(() => {
    let interval: any;
    if (config.enabled) {
      loadStatus();
      interval = setInterval(() => {
        loadStatus();
      }, 3000);
    } else {
      setStatus(null);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.enabled]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await invoke<P2PConfig>('get_p2p_config');
      setConfig(res);
    } catch (err: any) {
      console.error('Gagal mengambil konfigurasi P2P:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const res = await invoke<P2PStatus>('get_p2p_status_command');
      setStatus(res);
    } catch (err: any) {
      // Abaikan log error jika manager dinonaktifkan
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await invoke('set_p2p_config', {
        enabled: config.enabled,
        role: config.role,
        hostAddress: config.host_address,
        authToken: config.auth_token,
      });
      // Beri sedikit jeda lalu muat ulang
      setTimeout(() => {
        loadConfig();
      }, 1000);
    } catch (err: any) {
      alert(`Gagal menyimpan konfigurasi: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const generateNewToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setConfig({ ...config, auth_token: token });
  };

  if (loading) {
    return (
      <div style={{ color: 'var(--text-secondary)', padding: '24px', textAlign: 'center' }}>
        Memuat konfigurasi jaringan...
      </div>
    );
  }

  // Tentukan warna status untuk visualisasi
  const isP2PConnected = status?.is_connected || false;
  const statusColor = config.enabled
    ? (isP2PConnected ? '#10b981' : '#f59e0b')
    : '#ef4444';

  const statusText = config.enabled
    ? (config.role === 'host'
        ? (status?.local_addresses.length ? 'Host Mendengarkan' : 'Host Memulai...')
        : (isP2PConnected ? 'Terhubung ke Host' : 'Mencari Host...'))
    : 'P2P Nonaktif';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', alignItems: 'start' }}>
        
        {/* Kolom Kiri: Form Konfigurasi */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              🔗 Sinkronisasi Database Peer-to-Peer (P2P)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.4' }}>
              Hubungkan database aplikasi antar PC kantor secara real-time tanpa membutuhkan server cloud VPS berbayar atau VPN tambahan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Switch Enable P2P */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Aktifkan Sinkronisasi P2P
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Alihkan database untuk menggunakan koneksi P2P real-time.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  style={{
                    width: '40px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#10b981'
                  }}
                />
              </div>

              {/* Role Selection */}
              <div style={{ opacity: config.enabled ? 1 : 0.6, pointerEvents: config.enabled ? 'auto' : 'none' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Peran PC Ini (P2P Role)
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setConfig({ ...config, role: 'host' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '0px',
                      border: config.role === 'host' ? '1px solid #10b981' : '1px solid var(--border)',
                      background: config.role === 'host' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                      color: config.role === 'host' ? '#10b981' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    🖥️ Host (PC Pusat / Database Utama)
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, role: 'client' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '0px',
                      border: config.role === 'client' ? '1px solid #10b981' : '1px solid var(--border)',
                      background: config.role === 'client' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-card)',
                      color: config.role === 'client' ? '#10b981' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s'
                    }}
                  >
                    💻 Client (PC Cabang / Pengakses)
                  </button>
                </div>
              </div>

              {/* Token Keamanan */}
              <div style={{ opacity: config.enabled ? 1 : 0.6, pointerEvents: config.enabled ? 'auto' : 'none' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Token Otorisasi Keamanan
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={config.auth_token}
                    onChange={(e) => setConfig({ ...config, auth_token: e.target.value })}
                    placeholder="Masukkan Token Keamanan PC Pusat"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '0px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  {config.role === 'host' && (
                    <button
                      onClick={generateNewToken}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '0px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Buat Token
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Token ini wajib sama antara Host dan Client agar koneksi disetujui.
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Simpan */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '0px',
              border: 'none',
              background: '#10b981',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s',
              width: '100%'
            }}
          >
            {saving ? '⏳ Menyimpan & Merestart Jaringan...' : '💾 Simpan & Terapkan Konfigurasi'}
          </button>
        </div>

        {/* Kolom Kanan: Status & Informasi Koneksi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Info Status Jaringan */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              📡 Status Koneksi Real-Time
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px',
              borderLeft: `4px solid ${statusColor}`
            }}>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Status Jaringan
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: statusColor,
                    display: 'inline-block',
                    boxShadow: `0 0 8px ${statusColor}`
                  }} />
                  {statusText}
                </div>
              </div>

              {config.enabled && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {config.role === 'host' ? 'Peer Terhubung' : 'Status Sinkron'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {config.role === 'host'
                      ? `${status?.active_peers.length || 0} PC Client`
                      : (isP2PConnected ? 'Real-Time' : 'Offline')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kode Koneksi / Host Address */}
          <div style={{ opacity: config.enabled ? 1 : 0.6, pointerEvents: config.enabled ? 'auto' : 'none', textAlign: 'left' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              🔑 Kode Alamat Koneksi
            </h3>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {config.role === 'host' ? 'Kode Koneksi PC Host Anda' : 'Kode Koneksi PC Pusat (Multiaddress)'}
            </label>
            
            {config.role === 'host' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {status?.local_addresses.length ? (
                  status.local_addresses.map((addr, idx) => (
                    <div key={idx} style={{
                      padding: '10px 12px',
                      borderRadius: '0px',
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: '#10b981',
                      wordBreak: 'break-all',
                      userSelect: 'all'
                    }}>
                      {addr}/p2p/{status.peer_id}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '12px', color: '#f59e0b', padding: '10px 12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '0px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    Menunggu server P2P aktif untuk mendapatkan alamat lokal...
                  </div>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                  Salin salah satu kode di atas (gunakan alamat IP jaringan lokal Anda yang sesuai) dan masukkan pada menu Client PC Cabang.
                </span>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={config.host_address}
                  onChange={(e) => setConfig({ ...config, host_address: e.target.value })}
                  placeholder="Contoh: /ip4/192.168.1.100/tcp/4321/p2p/PeerIdHost"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '0px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                  Masukkan alamat Multiaddress PC Pusat lengkap dengan penanda `/p2p/...`
                </span>
              </div>
            )}
          </div>

          {/* Peer ID Lokal */}
          <div style={{ textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              ID Peer PC Lokal
            </label>
            <div style={{
              padding: '10px 12px',
              borderRadius: '0px',
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              fontSize: '12px',
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              wordBreak: 'break-all'
            }}>
              {config.local_peer_id || 'Belum dibuat'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default P2PConnectionTab;

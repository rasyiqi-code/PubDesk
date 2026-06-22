import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../ui/molecules/Modal';

interface TimMember {
  id?: number;
  name: string;
  role: string;
  department?: string;
  is_active: number;
}

// Warna avatar berdasarkan index
const AVATAR_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [members, setMembers] = useState<TimMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splashLogo, setSplashLogo] = useState('📚');
  const [logoType, setLogoType] = useState<'emoji' | 'image'>('emoji');
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedAdminForPin, setSelectedAdminForPin] = useState<TimMember | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [appName, setAppName] = useState('PubDesk');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedLogo = localStorage.getItem('splash_logo');
    if (savedLogo) {
      setSplashLogo(savedLogo);
      if (savedLogo.startsWith('data:image')) {
        setLogoType('image');
      } else {
        setLogoType('emoji');
      }
    }
    const publisherName = localStorage.getItem('publisher_name');
    if (publisherName && publisherName.trim()) {
      setAppName(`PubDesk - ${publisherName.trim()}`);
    } else {
      setAppName('PubDesk');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await invoke<TimMember[]>('get_tim');
        setMembers(data.filter(m => m.is_active === 1));
      } catch (e) {
        setError('Gagal memuat data anggota tim.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredMembers = members.filter(member => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query) ||
      (member.department && member.department.toLowerCase().includes(query))
    );
  });

  const handleLogin = async (member: TimMember) => {
    if (!member.id) return;
    const isMemberAdmin = member.role.toLowerCase().includes('admin') || 
                          (member.department && member.department.toLowerCase().includes('admin'));
    
    if (isMemberAdmin) {
      setSelectedAdminForPin(member);
      setPinInput('');
      setPinError(null);
      setShowPinModal(true);
    } else {
      setLoggingIn(member.id);
      setError(null);
      try {
        await login(member.id);
      } catch (e) {
        setError('Gagal login. Silakan coba lagi.');
        console.error(e);
      } finally {
        setLoggingIn(null);
      }
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (pinInput !== '123456') {
      setPinError('PIN keamanan admin salah!');
      return;
    }

    if (!selectedAdminForPin || !selectedAdminForPin.id) return;

    setLoggingIn(selectedAdminForPin.id);
    try {
      await login(selectedAdminForPin.id);
      setShowPinModal(false);
    } catch (err) {
      setPinError('Gagal login. Silakan coba lagi.');
      console.error(err);
      setLoggingIn(null);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-dark)',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{
          width: '120px',
          height: '120px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: logoType === 'emoji' ? '64px' : 'unset',
          marginBottom: '12px',
          overflow: 'hidden'
        }}>
          {logoType === 'emoji' ? (
            splashLogo
          ) : (
            <img src={splashLogo} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: '0 0 8px 0',
        }}>
          {appName}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
          Pilih identitas Anda untuk memulai sesi kerja
        </p>
      </div>

      {/* Container kartu anggota */}
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: '0px',
        width: '100%',
        maxWidth: '680px',
        overflow: 'hidden',
      }}>
        {/* Header panel */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card)',
        }}>
          <span style={{ fontSize: '14px' }}>👥</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Anggota Tim Aktif
          </span>
        </div>

        {/* Search Bar */}
        {!isLoading && members.length > 0 && (
          <div style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-panel)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>🔍</span>
            <input
              type="text"
              placeholder="Cari nama, peran, atau divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                padding: '6px 0',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 6px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Memuat daftar tim...
          </div>
        ) : members.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>😕</div>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 16px 0', fontSize: '14px' }}>
              Belum ada anggota tim yang terdaftar.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
              Tambahkan anggota tim melalui menu Master Data → Anggota Tim terlebih dahulu.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '14px' }}>
              Tidak ada anggota tim yang cocok dengan pencarian "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            maxHeight: '380px',
            overflowY: 'auto',
          }}>
            {filteredMembers.map((member, idx) => {
              const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const isLoggingIn = loggingIn === member.id;
              return (
                <button
                  key={member.id}
                  onClick={() => handleLogin(member)}
                  disabled={loggingIn !== null}
                  style={{
                    flex: '1 1 200px',
                    minWidth: '180px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '12px',
                    border: 'none',
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    background: isLoggingIn ? 'var(--bg-panel)' : 'transparent',
                    cursor: loggingIn !== null ? 'wait' : 'pointer',
                    transition: 'background 0.15s ease',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                    opacity: loggingIn !== null && !isLoggingIn ? 0.5 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (loggingIn === null) e.currentTarget.style.background = 'var(--bg-panel)';
                  }}
                  onMouseOut={(e) => {
                    if (!isLoggingIn) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#ffffff',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    {isLoggingIn ? (
                      <span style={{ fontSize: '16px', animation: 'spin 1s linear infinite' }}>⌛</span>
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>
                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}>
                      {member.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                    }}>
                      {member.role}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            background: 'rgba(239,68,68,0.06)',
            borderLeft: '4px solid #ef4444',
            color: '#ef4444',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-dark)',
        }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
            Setiap aksi yang dilakukan akan tercatat di Activity Log beserta identitas Anda.
          </p>
        </div>
      </div>

      {showPinModal && selectedAdminForPin && (
        <Modal
          open={showPinModal}
          onClose={() => {
            setShowPinModal(false);
            setSelectedAdminForPin(null);
          }}
          title="Verifikasi PIN Admin"
          width="360px"
        >
          <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Anda mencoba masuk sebagai <strong>{selectedAdminForPin.name}</strong> ({selectedAdminForPin.role}). Masukkan PIN Admin untuk melanjutkan:
            </p>
            <input
              type="password"
              placeholder="Masukkan 6 digit PIN..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                height: '42px',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                textAlign: 'center',
                letterSpacing: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {pinError && (
              <span style={{ fontSize: '12px', color: '#ef4444', textAlign: 'center' }}>
                ⚠️ {pinError}
              </span>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setSelectedAdminForPin(null);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Masuk
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LoginPage;

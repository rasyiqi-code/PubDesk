import React, { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';

const HomeDashboard: React.FC = () => {
  const { setActiveModule, setDirectAddNewModule } = useAppContext();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    { id: 'tambah-tugas', label: '➕ Tambah Tugas Baru', desc: 'Daftarkan tugas alur kerja produksi baru', color: '#10b981' },
    { id: 'invoice', label: '✍️ Buat Invoice Baru', desc: 'Buat lembar tagihan kuitansi resmi baru', color: '#06b6d4' },
    { id: 'penulis', label: '👤 Tambah Kontak/Penulis', desc: 'Daftarkan profil penulis atau klien baru', color: '#3b82f6' },
    { id: 'naskah', label: '📚 Tambah Naskah Baru', desc: 'Daftarkan pesanan order buku masuk baru', color: '#a855f7' },
    { id: 'penerbit', label: '🏢 Tambah Mitra Penerbit', desc: 'Daftarkan mitra penerbit kerja sama baru', color: '#f59e0b' },
    { id: 'tim', label: '👨‍💼 Tambah Anggota Tim', desc: 'Daftarkan staf pelaksana alur produksi baru', color: '#6b7280' },
    { id: 'legalitas', label: '⚖️ Ajukan Legalitas Buku', desc: 'Ajukan ISBN atau hak cipta buku baru', color: '#ef4444' },
    { id: 'services', label: '🛠️ Tambah Layanan Jasa', desc: 'Daftarkan jenis layanan baru di katalog', color: '#14b8a6' },
  ];

  const greeting = useMemo(() => {
    const hrs = time.getHours();
    if (hrs < 12) return 'Selamat Pagi';
    if (hrs < 15) return 'Selamat Siang';
    if (hrs < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, [time]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)', fontFamily: "'Outfit', 'Inter', sans-serif" }}>

      {/* Scrollable Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', boxSizing: 'border-box' }}>
        
        {/* Banner Selamat Datang */}
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-panel) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              {greeting}, Rekan Kerja!
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: '1.5' }}>
              Selamat datang di panel pintasan PubDesk. Klik tombol di bawah untuk langsung <br />
              menambahkan tugas, invoice, naskah, kontak, penerbit, tim, legalitas, atau layanan baru.
            </p>
          </div>

          {/* Jam Real-time */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 20px',
            textAlign: 'right',
            minWidth: '150px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)', fontFamily: '"JetBrains Mono", monospace' }}>
              {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Panel Akses Cepat */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⚡ Akses Navigasi Cepat
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {quickActions.map(action => (
              <div
                key={action.id}
                onClick={() => {
                  setActiveModule(action.id as any);
                  if (!['tambah-tugas', 'invoice'].includes(action.id)) {
                    setDirectAddNewModule(action.id);
                  }
                }}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {action.label}
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {action.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;

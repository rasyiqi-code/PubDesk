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

  const quickActions: { id: string; label: string; desc: string; color: string }[] = [];

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
              Selamat datang di panel pintasan PubDesk. Gunakan menu di samping untuk bernavigasi.
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

        {quickActions.length > 0 && (
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
                    setDirectAddNewModule(action.id);
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
        )}
      </div>
    </div>
  );
};

export default HomeDashboard;

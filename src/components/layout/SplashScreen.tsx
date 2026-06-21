import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Menginisialisasi aplikasi...');
  const [splashLogo, setSplashLogo] = useState('📚');
  const [logoType, setLogoType] = useState<'emoji' | 'image'>('emoji');

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
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    const statusTimers = [
      setTimeout(() => setStatusText('Membuka database lokal...'), 500),
      setTimeout(() => setStatusText('Memuat data master & tim...'), 1100),
      setTimeout(() => setStatusText('Sinkronisasi folder pintar...'), 1700),
      setTimeout(() => setStatusText('Menyiapkan workspace...'), 2200),
    ];

    return () => {
      clearInterval(interval);
      statusTimers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#ffffff',
      color: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      userSelect: 'none',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        {/* Visualisasi Logo (Pulsing 3D effect) */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, var(--accent, #3b82f6) 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: logoType === 'emoji' ? '42px' : 'unset',
          boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)',
          animation: 'pulseLogo 2s infinite ease-in-out',
          overflow: 'hidden'
        }}>
          {logoType === 'emoji' ? (
            splashLogo
          ) : (
            <img src={splashLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            margin: 0,
            background: 'linear-gradient(to right, #0f172a, #334155)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PubDesk
          </h1>
          <p style={{
            fontSize: '11px',
            color: '#64748b',
            margin: '4px 0 0 0',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            fontWeight: '600'
          }}>
            Workspace Penerbitan Buku
          </p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div style={{
        width: '260px',
        marginTop: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '100%',
          height: '4px',
          background: '#e2e8f0',
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
            borderRadius: '2px',
            transition: 'width 0.1s linear',
            boxShadow: '0 0 8px #3b82f6'
          }} />
        </div>

        <span style={{
          fontSize: '12px',
          color: '#64748b',
          fontWeight: '500',
          height: '16px',
          display: 'inline-block'
        }}>
          {statusText}
        </span>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseLogo {
          0% { transform: scale(1); box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15); }
          50% { transform: scale(1.05); box-shadow: 0 8px 40px rgba(59, 130, 246, 0.25); }
          100% { transform: scale(1); box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

import React, { useState } from 'react';
import InvoiceSettings from './InvoiceSettings';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoice' | 'general'>('invoice');

  return (
    <div className="settings-module" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
      {/* Header & Tab Menu di Bagian Atas */}
      <div style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        padding: '20px 32px 0 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexShrink: 0
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          ⚙️ Pengaturan
        </h1>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('invoice')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'invoice' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'invoice' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '14px',
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
            onClick={() => setActiveTab('general')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'general' ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '14px',
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
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {activeTab === 'invoice' ? (
          <InvoiceSettings />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '400px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '40px'
          }}>
            <span style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</span>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Pengaturan Umum
            </h2>
            <p style={{ fontSize: '14px', maxWidth: '360px', margin: 0 }}>
              Modul pengaturan dasar aplikasi. Fitur ini akan dikembangkan pada rilis berikutnya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

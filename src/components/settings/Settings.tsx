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
            onClick={() => setActiveTab('invoice')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'invoice' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'invoice' ? 'var(--text-primary)' : 'var(--text-secondary)',
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
            onClick={() => setActiveTab('general')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'general' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
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
        {activeTab === 'invoice' ? (
          <InvoiceSettings />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '300px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            padding: '24px'
          }}>
            <span style={{ fontSize: '36px', marginBottom: '12px' }}>⚙️</span>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Pengaturan Umum
            </h2>
            <p style={{ fontSize: '13px', maxWidth: '320px', margin: 0 }}>
              Modul pengaturan dasar aplikasi. Fitur ini akan dikembangkan pada rilis berikutnya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { useInvoiceContext } from '../../../contexts/InvoiceContext';
import { useAppContext } from '../../../contexts/AppContext';
import { useDataMasterContext } from '../../../contexts/DataMasterContext';

export const CustomerSection: React.FC = () => {
  const { customer, setCustomer } = useInvoiceContext();
  const { contacts } = useAppContext();
  const { penulis } = useDataMasterContext();
  const [waInput, setWaInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Saring kontak bertipe 'customer'
  const customers = contacts.filter(c => c.type === 'customer');

  // Gabungkan pelanggan dan penulis untuk suggestions
  const allContacts = [
    ...customers.map(c => ({ ...c, source: 'Pelanggan' })),
    ...penulis.map(p => ({ ...p, source: 'Penulis' }))
  ];

  // Saring data suggestion berdasarkan input Nama saat ini
  const filteredSuggestions = allContacts.filter(c => 
    customer.name && c.name.toLowerCase().includes(customer.name.toLowerCase())
  );

  const handleParseWA = () => {
    const lines = waInput.split('\n');
    let name = '';
    let wa_number = '';
    let email = '';
    let address = '';

    lines.forEach((line) => {
      if (line.toLowerCase().startsWith('nama:')) {
        name = line.substring(5).trim();
      } else if (line.toLowerCase().startsWith('no:') || line.toLowerCase().startsWith('wa:')) {
        wa_number = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.toLowerCase().startsWith('email:')) {
        email = line.substring(6).trim();
      } else if (line.toLowerCase().startsWith('alamat:')) {
        address = line.substring(7).trim();
      }
    });

    setCustomer((prev) => ({
      ...prev,
      name: name || prev.name || '',
      wa_number: wa_number || prev.wa_number || '',
      email: email || prev.email || '',
      address: address || prev.address || ''
    }));
  };

  return (
    <>
      <textarea
        style={{ width: '100%', minHeight: '80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', resize: 'vertical', marginBottom: '8px' }}
        placeholder="Tempel teks chat WhatsApp di sini..."
        value={waInput}
        onChange={(e) => setWaInput(e.target.value)}
        rows={3}
      />
      <button className="btn-secondary" onClick={handleParseWA} style={{ marginBottom: '16px', width: '100%', padding: '8px 10px', fontSize: '12px' }}>
        ✨ Parse Otomatis Chat WhatsApp
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 16px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detail Kontak Pelanggan</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
      </div>

      <div style={{ marginBottom: '12px', position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama</label>
        <input
          type="text"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
          value={customer.name || ''}
          onChange={(e) => {
            setCustomer(prev => ({ ...prev, name: e.target.value }));
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Beri jeda waktu kecil agar event klik opsi suggestion terpicu sebelum menu ditutup
            setTimeout(() => setShowSuggestions(false), 250);
          }}
          placeholder="Nama Pelanggan"
        />

        {showSuggestions && customer.name && filteredSuggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginTop: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pelanggan Terdaftar
            </div>
            {filteredSuggestions.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setCustomer(prev => ({
                    ...prev,
                    name: c.name,
                    wa_number: c.wa_number || '',
                    email: c.email || '',
                    address: c.address || '',
                    isPenulis: c.source === 'Penulis'
                  }));
                  setShowSuggestions(false);
                }}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.15s ease',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{c.name}</span>
                  <span style={{ fontSize: '10px', background: c.source === 'Penulis' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)', color: c.source === 'Penulis' ? 'var(--accent)' : '#10b981', padding: '2px 6px', borderRadius: '4px' }}>
                    {c.source}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  WA: {c.wa_number || '-'} | Email: {c.email || '-'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>No. WhatsApp</label>
        <input
          type="text"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
          value={customer.wa_number || ''}
          onChange={(e) => setCustomer(prev => ({ ...prev, wa_number: e.target.value }))}
          placeholder="08123456789"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Alamat Email (Opsional)</label>
        <input
          type="email"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
          value={customer.email || ''}
          onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
          placeholder="pelanggan@email.com"
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Alamat</label>
        <input
          type="text"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
          value={customer.address || ''}
          onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Alamat Pengiriman"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '12px', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <input
          type="checkbox"
          id="isPenulis"
          checked={customer.isPenulis || false}
          onChange={(e) => setCustomer(prev => ({ ...prev, isPenulis: e.target.checked }))}
          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
        />
        <label htmlFor="isPenulis" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
          Apakah pelanggan ini penulis? (Simpan ke Master Data Penulis)
        </label>
      </div>
    </>
  );
};

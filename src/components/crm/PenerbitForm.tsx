import React, { useState, useEffect } from 'react';
import { Penerbit } from '../../types/crm.types';

interface PenerbitFormProps {
  initialData?: Penerbit | null;
  onSubmit: (data: Omit<Penerbit, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const PenerbitForm: React.FC<PenerbitFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [emailValid, setEmailValid] = useState(0);
  const [waValid, setWaValid] = useState(0);
  const [cooperationStatus, setCooperationStatus] = useState('Aktif');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCity(initialData.city || '');
      setEmail(initialData.email || '');
      setWaNumber(initialData.wa_number || '');
      setInstagram(initialData.instagram || '');
      setFacebook(initialData.facebook || '');
      setLinkedin(initialData.linkedin || '');
      setTwitter(initialData.twitter || '');
      setTiktok(initialData.tiktok || '');
      setEmailValid(initialData.email_valid);
      setWaValid(initialData.wa_valid);
      setCooperationStatus(initialData.cooperation_status || 'Aktif');
    } else {
      setName('');
      setCity('');
      setEmail('');
      setWaNumber('');
      setInstagram('');
      setFacebook('');
      setLinkedin('');
      setTwitter('');
      setTiktok('');
      setEmailValid(0);
      setWaValid(0);
      setCooperationStatus('Aktif');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      city: city.trim() || undefined,
      email: email.trim() || undefined,
      wa_number: waNumber.trim() || undefined,
      instagram: instagram.trim() || undefined,
      facebook: facebook.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      twitter: twitter.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      email_valid: emailValid,
      wa_valid: waValid,
      cooperation_status: cooperationStatus,
    });
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Penerbit' : '🏢 Tambah Penerbit Baru'}
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Nama Penerbit / Penerbitan <span style={{ color: '#ff4d4f' }}>*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
            placeholder="Masukkan nama penerbit..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Kota Asal Penerbit
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: Yogyakarta"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Status Kerja Sama
            </label>
            <select
              value={cooperationStatus}
              onChange={(e) => setCooperationStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="Aktif">Aktif</option>
              <option value="Negosiasi">Dalam Negosiasi</option>
              <option value="Pasif">Pasif</option>
              <option value="Berhenti">Berhenti</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Email Resmi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="redaksi@penerbit.com"
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={emailValid === 1}
                onChange={(e) => setEmailValid(e.target.checked ? 1 : 0)}
              />
              Email Valid / Aktif
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Nomor WhatsApp PIC
            </label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: 0813..."
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={waValid === 1}
                onChange={(e) => setWaValid(e.target.checked ? 1 : 0)}
              />
              WhatsApp Valid / Aktif
            </label>
          </div>
        </div>

        <h4 style={{ fontSize: '14px', fontWeight: '600', marginTop: '10px', marginBottom: '4px', color: 'var(--text-primary)' }}>
          Media Sosial & Kontak Digital
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Instagram
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="@username"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Facebook Page
            </label>
            <input
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Nama Page"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              LinkedIn
            </label>
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="penerbit-company"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              TikTok
            </label>
            <input
              type="text"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="@tiktok_handle"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}>
            💾 Simpan Data
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}>
            ❌ Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default PenerbitForm;

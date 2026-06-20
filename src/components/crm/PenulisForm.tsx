import React, { useState, useEffect } from 'react';
import { Penulis } from '../../types/crm.types';

interface PenulisFormProps {
  initialData?: Penulis | null;
  onSubmit: (data: Omit<Penulis, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const PenulisForm: React.FC<PenulisFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [job, setJob] = useState('');
  const [institution, setInstitution] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [emailValid, setEmailValid] = useState(0);
  const [waValid, setWaValid] = useState(0);
  const [followupStatus, setFollowupStatus] = useState('New');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email || '');
      setWaNumber(initialData.wa_number || '');
      setProvince(initialData.province || '');
      setCity(initialData.city || '');
      setJob(initialData.job || '');
      setInstitution(initialData.institution || '');
      setDataSource(initialData.data_source || '');
      setEmailValid(initialData.email_valid);
      setWaValid(initialData.wa_valid);
      setFollowupStatus(initialData.followup_status || 'New');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setEmail('');
      setWaNumber('');
      setProvince('');
      setCity('');
      setJob('');
      setInstitution('');
      setDataSource('');
      setEmailValid(0);
      setWaValid(0);
      setFollowupStatus('New');
      setNotes('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      email: email.trim() || undefined,
      wa_number: waNumber.trim() || undefined,
      province: province.trim() || undefined,
      city: city.trim() || undefined,
      job: job.trim() || undefined,
      institution: institution.trim() || undefined,
      data_source: dataSource.trim() || undefined,
      email_valid: emailValid,
      wa_valid: waValid,
      followup_status: followupStatus,
      notes: notes.trim() || undefined,
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
        {initialData ? '📝 Edit Penulis' : '👤 Tambah Penulis Baru'}
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Nama Lengkap <span style={{ color: '#ff4d4f' }}>*</span>
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
            placeholder="Masukkan nama penulis..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Email
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
              placeholder="contoh@domain.com"
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
              Nomor WhatsApp
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
              placeholder="Contoh: 0812..."
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Provinsi
            </label>
            <input
              type="text"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: Jawa Tengah"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Kota / Kabupaten
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
              placeholder="Contoh: Semarang"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Pekerjaan
            </label>
            <input
              type="text"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: Dosen, Penulis"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Institusi / Afiliasi
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: Universitas Diponegoro"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Sumber Data
            </label>
            <input
              type="text"
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: Web Registrasi, Event"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Status Follow-Up
            </label>
            <select
              value={followupStatus}
              onChange={(e) => setFollowupStatus(e.target.value)}
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
              <option value="New">Baru (New)</option>
              <option value="Contacted">Sudah Dihubungi</option>
              <option value="Interested">Tertarik</option>
              <option value="Deal">Deal (Naskah Masuk)</option>
              <option value="Rejected">Menolak</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Catatan Tambahan
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Tulis info tambahan penulis di sini..."
          />
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

export default PenulisForm;

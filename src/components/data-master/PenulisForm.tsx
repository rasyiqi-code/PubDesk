import React, { useState, useEffect } from 'react';
import { Penulis } from '../../types/data-master.types';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface PenulisFormProps {
  initialData?: Penulis | null;
  onSubmit: (data: Omit<Penulis, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const PenulisForm: React.FC<PenulisFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { showToast } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [address, setAddress] = useState('');
  const [job, setJob] = useState('');
  const [institution, setInstitution] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [emailValid, setEmailValid] = useState(0);
  const [waValid, setWaValid] = useState(0);
  const [followupStatus, setFollowupStatus] = useState('New');
  const [notes, setNotes] = useState('');

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email || '');
      setWaNumber(initialData.wa_number || '');
      setAddress(initialData.address || '');
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
      setAddress('');
      setJob('');
      setInstitution('');
      setDataSource('');
      setEmailValid(0);
      setWaValid(0);
      setFollowupStatus('New');
      setNotes('');
    }
  }, [initialData]);

  const formatWhatsAppNumber = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return '';
    if (cleaned.startsWith('08')) {
      cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama kontak tidak boleh kosong!', 'error');
      return;
    }

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      email: email.trim() || undefined,
      wa_number: waNumber.trim() ? formatWhatsAppNumber(waNumber.trim()) : undefined,
      address: address.trim() || undefined,
      province: initialData?.province, // tetapkan data lama jika ada
      city: initialData?.city,
      job: job.trim() || undefined,
      institution: institution.trim() || undefined,
      data_source: dataSource.trim() || undefined,
      email_valid: emailValid,
      wa_valid: waValid,
      followup_status: followupStatus,
      notes: notes.trim() || undefined,
    });
  };

  const statusOptions = [
    { value: 'New', label: 'Baru (New)' },
    { value: 'Contacted', label: 'Sudah Dihubungi' },
    { value: 'Interested', label: 'Tertarik' },
    { value: 'Deal', label: 'Deal (Naskah Masuk)' },
    { value: 'Rejected', label: 'Menolak' },
    { value: 'Pelanggan', label: '🤝 Pelanggan' }
  ];

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Kontak' : 'Kontak Baru'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="👤 Informasi Kontak" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Nama Lengkap"
                placeholder="Contoh: Prof. Dr. Budi Utomo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <TextField
                    label="Email"
                    type="email"
                    placeholder="budi@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={emailValid === 1}
                      onChange={(e) => setEmailValid(e.target.checked ? 1 : 0)}
                    />
                    Email Valid / Aktif
                  </label>
                </div>

                <div>
                  <TextField
                    label="Nomor WhatsApp"
                    placeholder="Contoh: 08123456789"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    required
                    fullWidth
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={waValid === 1}
                      onChange={(e) => setWaValid(e.target.checked ? 1 : 0)}
                    />
                    WhatsApp Valid / Aktif
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Alamat Lengkap
                </label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    height: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: '1.4'
                  }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Diponegoro No. 12, Surabaya, Jawa Timur"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextField
                  label="Pekerjaan"
                  placeholder="Contoh: Dosen, Peneliti"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Institusi / Afiliasi"
                  placeholder="Contoh: Universitas Airlangga"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextField
                  label="Sumber Data"
                  placeholder="Contoh: Pendaftaran Mandiri"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  fullWidth
                />

                <Select
                  label="Status Follow-Up"
                  options={statusOptions}
                  value={followupStatus}
                  onChange={(e) => setFollowupStatus(e.target.value)}
                  fullWidth
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Catatan Tambahan
                </label>
                <textarea
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    height: '100px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>
          </AccordionSection>
        </Accordion>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="primary" style={{ flex: 1 }} size="lg">
            💾 Simpan & Catat
          </Button>
          <Button type="button" variant="secondary" style={{ flex: 1 }} size="lg" onClick={onCancel}>
            ❌ Batal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PenulisForm;

import React, { useState, useEffect } from 'react';
import { Penerbit } from '../../types/crm.types';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface PenerbitFormProps {
  initialData?: Penerbit | null;
  onSubmit: (data: Omit<Penerbit, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const PenerbitForm: React.FC<PenerbitFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { showToast } = useAppContext();

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

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

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
    if (!name.trim()) {
      showToast('Nama penerbit tidak boleh kosong!', 'error');
      return;
    }

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

  const statusOptions = [
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Negosiasi', label: 'Dalam Negosiasi' },
    { value: 'Pasif', label: 'Pasif' },
    { value: 'Berhenti', label: 'Berhenti' }
  ];

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Profil Penerbit' : 'Pembuat Profil Penerbit Baru'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="🏢 Informasi Profil Penerbit" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Nama Penerbit / Penerbitan"
                placeholder="Contoh: PT. Aksara Nusantara"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextField
                  label="Kota Asal Penerbit"
                  placeholder="Contoh: Yogyakarta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  fullWidth
                />

                <Select
                  label="Status Kerja Sama"
                  options={statusOptions}
                  value={cooperationStatus}
                  onChange={(e) => setCooperationStatus(e.target.value)}
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <TextField
                    label="Email Resmi"
                    type="email"
                    placeholder="redaksi@penerbit.com"
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
                    label="Nomor WhatsApp PIC"
                    placeholder="Contoh: 08123456789"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    fullWidth
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={waValid === 1}
                      onChange={(e) => setWaValid(e.target.checked ? 1 : 0)}
                    />
                    WhatsApp Valid / PIC Aktif
                  </label>
                </div>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection index={2} title="📸 Media Sosial & Kontak Digital" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextField
                  label="Instagram"
                  placeholder="@username_penerbit"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Facebook Page"
                  placeholder="Nama Halaman Facebook"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextField
                  label="LinkedIn Company Page"
                  placeholder="nama-perusahaan"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="TikTok"
                  placeholder="@tiktok_penerbit"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  fullWidth
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

export default PenerbitForm;

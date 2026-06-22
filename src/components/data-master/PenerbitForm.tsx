import React, { useState, useEffect } from 'react';
import { Penerbit } from '../../types/data-master.types';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { TextArea } from '../../ui/atoms/TextArea';
import { Checkbox } from '../../ui/atoms/Checkbox';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface PenerbitFormProps {
  initialData?: Penerbit | null;
  onSubmit: (data: Omit<Penerbit, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const PenerbitForm: React.FC<PenerbitFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { showToast, setActiveModule } = useAppContext();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
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
      setProvince(initialData.province || '');
      setAddress(initialData.address || '');
      setNotes(initialData.notes || '');
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
      setProvince('');
      setAddress('');
      setNotes('');
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
      province: province.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
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
    { value: 'Berhenti', label: 'Berhenti' },
    { value: 'Internal', label: 'Penerbit Internal' }
  ];

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveModule('home')}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 10px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-panel)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          🏠 Beranda
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          {initialData ? '📝 Edit Profil Penerbit' : 'Pembuat Profil Penerbit Baru'}
        </h1>
      </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <TextField
                  label="Kota Asal Penerbit"
                  placeholder="Contoh: Yogyakarta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Provinsi"
                  placeholder="Contoh: DIY"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <TextField
                    label="Email Resmi"
                    type="email"
                    placeholder="redaksi@penerbit.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                  />
                  <Checkbox
                    label="Email Valid / Aktif"
                    checked={emailValid === 1}
                    onChange={(e) => setEmailValid(e.target.checked ? 1 : 0)}
                    style={{ marginTop: '4px' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <TextField
                    label="Nomor WhatsApp PIC"
                    placeholder="Contoh: 08123456789"
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                    fullWidth
                  />
                  <Checkbox
                    label="WhatsApp Valid / PIC Aktif"
                    checked={waValid === 1}
                    onChange={(e) => setWaValid(e.target.checked ? 1 : 0)}
                    style={{ marginTop: '4px' }}
                  />
                </div>
              </div>

              <TextArea
                label="Alamat Lengkap Kantor"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Jl. Ringroad Utara No. 12, Sleman, Yogyakarta"
                style={{ height: '80px' }}
                fullWidth
              />
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

          <AccordionSection index={3} title="📝 Catatan Kemitraan" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <TextArea
              label="Catatan / MoU / Kesepakatan Khusus"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tulis detail kesepakatan harga cetak, nomor kontrak, atau PIC penting..."
              style={{ height: '80px' }}
              fullWidth
            />
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

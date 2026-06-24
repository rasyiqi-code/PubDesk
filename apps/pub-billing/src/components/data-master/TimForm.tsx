import React, { useState, useEffect } from 'react';
import { Tim } from '../../types/data-master.types';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { TextArea } from '../../ui/atoms/TextArea';
import { Checkbox } from '../../ui/atoms/Checkbox';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface TimFormProps {
  initialData?: Tim | null;
  onSubmit: (data: Omit<Tim, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const TimForm: React.FC<TimFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { showToast, setActiveModule } = useAppContext();

  const [name, setName] = useState('');
  const [role, setRole] = useState('Layouter');
  const [department, setDepartment] = useState('Produksi');
  const [isActive, setIsActive] = useState(1);
  const [notes, setNotes] = useState('');
  const [pin, setPin] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [app, setApp] = useState('');

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setDepartment(initialData.department || 'Produksi');
      setIsActive(initialData.is_active);
      setNotes(initialData.notes || '');
      setPin(initialData.pin || '');
      setWaNumber(initialData.wa_number || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setApp(initialData.app || '');
    } else {
      setName('');
      setRole('Layouter');
      setDepartment('Produksi');
      setIsActive(1);
      setNotes('');
      setPin('');
      setWaNumber('');
      setEmail('');
      setAddress('');
      setApp('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama anggota tim tidak boleh kosong!', 'error');
      return;
    }
    if (pin.trim() && pin.trim().length !== 6) {
      showToast('PIN keamanan harus terdiri dari 6 digit angka!', 'error');
      return;
    }

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      role,
      department,
      is_active: isActive,
      notes: notes.trim() || undefined,
      pin: pin.trim() || undefined,
      wa_number: waNumber.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      app: app.trim() || undefined,
    });
  };

  // Opsi peran mencakup seluruh tim produksi penerbitan
  const roleOptions = [
    { value: 'Layouter', label: '🎨 Layouter' },
    { value: 'Desainer Cover', label: '🖼️ Desainer Cover' },
    { value: 'Editor Naskah', label: '✏️ Editor Naskah' },
    { value: 'Proofreader', label: '🔍 Proofreader' },
    { value: 'Manajer Produksi', label: '📋 Manajer Produksi' },
    { value: 'Marketing', label: '📢 Marketing' },
    { value: 'Keuangan', label: '💰 Keuangan' },
    { value: 'Admin', label: '🗂️ Admin' },
    { value: 'Fotografer', label: '📷 Fotografer' },
    { value: 'Illustrator', label: '✏️ Illustrator' },
    { value: 'Kepala Kantor', label: '👔 Kepala Kantor' },
    { value: 'HRD', label: '👥 HRD' },
    { value: 'Direktur', label: '📈 Direktur / Pimpinan' },
    { value: 'Staf Umum', label: '🛠️ Staf Umum' },
    { value: 'Staf Gudang', label: '📦 Staf Gudang' },
    { value: 'Admin Master', label: '🔑 Admin Master' },
  ];

  const departmentOptions = [
    { value: 'Admin Master', label: 'Admin Master' },
    { value: 'Produksi', label: 'Produksi' },
    { value: 'Editorial', label: 'Editorial' },
    { value: 'Desain', label: 'Desain' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Keuangan', label: 'Keuangan' },
    { value: 'Administrasi', label: 'Administrasi' },
    { value: 'Manajemen / Direksi', label: 'Manajemen / Direksi' },
    { value: 'HRD / Kepegawaian', label: 'HRD / Kepegawaian' },
    { value: 'Operasional / Umum', label: 'Operasional / Umum' },
    { value: 'Distribusi / Logistik', label: 'Distribusi / Logistik' },
    { value: 'Kepala Kantor', label: 'Kepala Kantor' },
    { value: 'Gudang', label: 'Gudang' },
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
          {initialData ? '📝 Edit Profil Anggota Tim' : '👤 Tambah Anggota Tim Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="👥 Profil Anggota Tim" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Nama Lengkap"
                placeholder="Contoh: Hana Salsabila"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Select
                  label="Peran / Jabatan"
                  options={roleOptions}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  fullWidth
                />

                <Select
                  label="Divisi / Departemen"
                  options={departmentOptions}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  fullWidth
                />
              </div>

              <Select
                label="Aplikasi"
                options={[
                  { value: '', label: 'Semua Aplikasi' },
                  { value: 'admin', label: 'PubAdmin' },
                  { value: 'billing', label: 'PubBilling' },
                  { value: 'files', label: 'PubFiles' },
                  { value: 'ops', label: 'PubOps' },
                ]}
                value={app}
                onChange={(e) => setApp(e.target.value)}
                fullWidth
              />

              <Checkbox
                label="Anggota Aktif (Siap Menerima Penugasan)"
                checked={isActive === 1}
                onChange={(e) => setIsActive(e.target.checked ? 1 : 0)}
                style={{ marginTop: '4px' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextField
                  label="Nomor WhatsApp"
                  placeholder="Contoh: 081234567890"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value.replace(/\D/g, ''))}
                  fullWidth
                />

                <TextField
                  label="Email Resmi / Pribadi"
                  type="email"
                  placeholder="Contoh: hana@pubdesk.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
              </div>

              <TextField
                label="Alamat Lengkap"
                placeholder="Contoh: Jl. Kebon Agung No. 12, Sleman, Yogyakarta"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                fullWidth
              />

              <TextArea
                label="Keahlian & Catatan"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Ahli desain cover novel fantasi, mahir Adobe InDesign..."
                style={{ height: '100px' }}
                fullWidth
              />

              {/* PIN Login untuk autentikasi masuk aplikasi */}
              <div>
                <TextField
                  label="PIN Login (6 Digit)"
                  type="password"
                  placeholder="Contoh: 123456"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPin(val);
                  }}
                  fullWidth
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '2px' }}>
                  📌 PIN digunakan untuk masuk ke aplikasi. Wajib diisi agar anggota bisa login.
                </p>
              </div>
            </div>
          </AccordionSection>
        </Accordion>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="primary" style={{ flex: 1 }} size="lg">
            💾 Simpan &amp; Catat
          </Button>
          <Button type="button" variant="secondary" style={{ flex: 1 }} size="lg" onClick={onCancel}>
            ❌ Batal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TimForm;

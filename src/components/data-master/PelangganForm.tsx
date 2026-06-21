import React, { useState, useEffect } from 'react';
import { Contact } from '../../types/contact.types';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface PelangganFormProps {
  initialData?: Contact | null;
  onSubmit: (data: Omit<Contact, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const PelangganForm: React.FC<PelangganFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { showToast } = useAppContext();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [address, setAddress] = useState('');
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email || '');
      setWaNumber(initialData.wa_number || '');
      setAddress(initialData.address || '');
    } else {
      setName('');
      setEmail('');
      setWaNumber('');
      setAddress('');
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
      showToast('Nama pelanggan tidak boleh kosong!', 'error');
      return;
    }

    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      email: email.trim() || undefined,
      wa_number: waNumber.trim() ? formatWhatsAppNumber(waNumber.trim()) : undefined,
      address: address.trim() || undefined,
      type: 'customer' // Selalu customer karena ini adalah manager pelanggan
    });
  };

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Data Pelanggan' : '👥 Tambah Pelanggan Baru'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="👤 Informasi Pelanggan" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Nama Lengkap Pelanggan"
                placeholder="Contoh: Budi Utomo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <TextField
                  label="Email"
                  type="email"
                  placeholder="budi@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Nomor WhatsApp"
                  placeholder="Contoh: 08123456789"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  fullWidth
                />
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
                />
              </div>
            </div>
          </AccordionSection>
        </Accordion>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button type="submit" variant="primary" style={{ flex: 1 }} size="lg">
            💾 Simpan Data
          </Button>
          <Button type="button" variant="secondary" style={{ flex: 1 }} size="lg" onClick={onCancel}>
            ❌ Batal
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PelangganForm;

import React, { useState, useEffect } from 'react';
import { Service } from '../../types/service.types';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { TextArea } from '../../ui/atoms/TextArea';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';
import { useAppContext } from '../../contexts/AppContext';

interface ServiceFormProps {
  initialData?: Service | null;
  onSubmit: (data: Omit<Service, 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const categoryOptions = [
  { value: 'penerbitan', label: 'Layanan Penerbitan' },
  { value: 'desain_layout', label: 'Desain & Layout' },
  { value: 'haki', label: 'Pendaftaran HAKI' },
  { value: 'isbn', label: 'Pengajuan ISBN' },
  { value: 'mitra', label: 'Layanan Mitra' },
  { value: 'other', label: 'Lainnya' },
];

const ServiceForm: React.FC<ServiceFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { setActiveModule } = useAppContext();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('penerbitan');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setPrice(initialData.price);
      setDescription(initialData.description || '');
    } else {
      setName('');
      setCategory('penerbitan');
      setPrice(0);
      setDescription('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      id: initialData?.id,
      name: name.trim(),
      category,
      price,
      description: description.trim() || undefined,
    });
  };

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
          {initialData ? '✏️ Edit Layanan' : '➕ Tambah Layanan Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="🛠️ Detail Layanan" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <TextField
                label="Nama Layanan"
                placeholder="Contoh: Desain Cover Premium & Layouting"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Select
                  label="Kategori Layanan"
                  options={categoryOptions}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Tarif / Harga (Rp)"
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  fullWidth
                />
              </div>

              <TextArea
                label="Deskripsi Layanan (Opsional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan cakupan layanan, batasan revisi, atau rincian mitra di sini..."
                fullWidth
              />
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

export default ServiceForm;

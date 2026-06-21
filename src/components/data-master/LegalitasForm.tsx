import React, { useState, useEffect } from 'react';
import { Legalitas } from '../../types/data-master.types';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { SearchableSelect } from '../../ui/atoms/SearchableSelect';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

interface LegalitasFormProps {
  initialData?: Legalitas | null;
  onSubmit: (data: Omit<Legalitas, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const TIPE_OPTIONS = [
  { value: 'E-ISBN', label: 'E-ISBN' },
  { value: 'ISBN', label: 'ISBN' },
  { value: 'QRCBN', label: 'QRCBN' },
  { value: 'QRSBN', label: 'QRSBN' },
  { value: 'HAKI', label: 'HAKI' },
];

const STATUS_OPTIONS = [
  { value: 'Diajukan', label: 'Diajukan' },
  { value: 'Diproses', label: 'Diproses' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Ditolak', label: 'Ditolak' },
];

const LegalitasForm: React.FC<LegalitasFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { naskah, penulis } = useDataMasterContext();
  const { showToast } = useAppContext();

  const [naskahId, setNaskahId] = useState<number | undefined>(undefined);
  const [judulBuku, setJudulBuku] = useState('');
  const [namaPenulis, setNamaPenulis] = useState('');
  const [tipe, setTipe] = useState('E-ISBN');
  const [tanggalPengajuan, setTanggalPengajuan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [status, setStatus] = useState('Diajukan');

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  const naskahOptions = [
    { value: '', label: '-- Pilih Naskah --' },
    ...naskah.map((n) => {
      const penulisName = n.penulis_id ? (penulis.find(p => p.id === n.penulis_id)?.name || `#${n.penulis_id}`) : '-';
      return { value: String(n.id), label: `${n.title} — ${penulisName}` };
    }),
  ];

  useEffect(() => {
    if (initialData) {
      setNaskahId(initialData.naskah_id || undefined);
      setJudulBuku(initialData.judul_buku);
      setNamaPenulis(initialData.nama_penulis);
      setTipe(initialData.tipe);
      setTanggalPengajuan(initialData.tanggal_pengajuan || '');
      setKeterangan(initialData.keterangan || '');
      setStatus(initialData.status);
    } else {
      setNaskahId(undefined);
      setJudulBuku('');
      setNamaPenulis('');
      setTipe('E-ISBN');
      setTanggalPengajuan('');
      setKeterangan('');
      setStatus('Diajukan');
    }
  }, [initialData]);

  const handleNaskahSelect = (val: string) => {
    const id = val ? Number(val) : undefined;
    setNaskahId(id);
    if (id) {
      const found = naskah.find((n) => n.id === id);
      if (found) {
        setJudulBuku(found.title);
        const penulisName = found.penulis_id ? (penulis.find(p => p.id === found.penulis_id)?.name || '') : '';
        if (penulisName) setNamaPenulis(penulisName);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulBuku.trim() || !namaPenulis.trim()) {
      showToast('Judul buku dan nama penulis wajib diisi!', 'error');
      return;
    }

    onSubmit({
      id: initialData?.id,
      naskah_id: naskahId,
      judul_buku: judulBuku.trim(),
      nama_penulis: namaPenulis.trim(),
      tipe,
      tanggal_pengajuan: tanggalPengajuan || undefined,
      keterangan: keterangan.trim() || undefined,
      status,
    });
  };

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Pengajuan Legalitas' : '⚖️ Pengajuan Legalitas Baru'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="📄 Informasi Legalitas" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SearchableSelect
                label="Pilih dari Naskah yang Ada"
                options={naskahOptions}
                value={naskahId ? String(naskahId) : ''}
                onChange={handleNaskahSelect}
                placeholder="Ketik judul naskah..."
                emptyMessage="Tidak ada naskah yang cocok"
                fullWidth
              />

              <TextField
                label="Judul Buku / Naskah"
                placeholder="Masukkan judul buku..."
                value={judulBuku}
                onChange={(e) => setJudulBuku(e.target.value)}
                required
                fullWidth
                autoFocus
              />

              <SearchableSelect
                label="Cari Penulis dari Database"
                options={[
                  { value: '', label: '-- Pilih Penulis --' },
                  ...penulis.map((p) => ({ value: String(p.id), label: p.name })),
                ]}
                value=""
                onChange={(val) => {
                  if (val) {
                    const p = penulis.find((x) => x.id === Number(val));
                    if (p) setNamaPenulis(p.name);
                  }
                }}
                placeholder="Ketik nama penulis..."
                emptyMessage="Tidak ada penulis yang cocok"
                fullWidth
              />

              <TextField
                label="Nama Penulis"
                placeholder="Masukkan nama penulis..."
                value={namaPenulis}
                onChange={(e) => setNamaPenulis(e.target.value)}
                required
                fullWidth
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Select
                  label="Tipe Legalitas"
                  options={TIPE_OPTIONS}
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value)}
                  fullWidth
                />
                <Select
                  label="Status Pengajuan"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  fullWidth
                />
              </div>

              <TextField
                label="Tanggal Pengajuan"
                type="date"
                value={tanggalPengajuan}
                onChange={(e) => setTanggalPengajuan(e.target.value)}
                fullWidth
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Keterangan
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
                    boxSizing: 'border-box'
                  }}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan tambahan terkait pengajuan legalitas ini..."
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

export default LegalitasForm;

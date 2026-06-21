import React, { useState, useEffect } from 'react';
import { Legalitas } from '../../types/data-master.types';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { googleAppsScriptService } from '../../services/googleAppsScript';
import { TextField } from '../../ui/atoms/TextField';
import { SearchableSelect } from '../../ui/atoms/SearchableSelect';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';
import { DatePicker } from '../../ui/atoms/DatePicker';
import { TextArea } from '../../ui/atoms/TextArea';

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
  const [nomorDokumen, setNomorDokumen] = useState('');
  const [proof, setProof] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
      setNomorDokumen(initialData.nomor_dokumen || '');
      setProof(initialData.proof_path_or_link || '');
    } else {
      setNaskahId(undefined);
      setJudulBuku('');
      setNamaPenulis('');
      setTipe('E-ISBN');
      setTanggalPengajuan('');
      setKeterangan('');
      setStatus('Diajukan');
      setNomorDokumen('');
      setProof('');
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

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!googleAppsScriptService.isConfigured()) {
      showToast('Harap konfigurasikan Google Apps Script terlebih dahulu di setelan!', 'error');
      return;
    }

    setIsUploading(true);
    showToast(`Mengunggah ${file.name} ke Google Drive...`, 'info');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const resultStr = reader.result as string;
          const base64String = resultStr.split(',')[1];
          const result = await googleAppsScriptService.uploadFileToCloud(
            file.name,
            base64String,
            'Legalitas',
            file.type
          );
          
          if (result.success && result.file_url) {
            setProof(result.file_url);
            showToast('Dokumen legalitas berhasil diunggah!', 'success');
          } else {
            showToast('Gagal mengunggah dokumen.', 'error');
          }
        } catch (err: any) {
          console.error(err);
          showToast(`Gagal mengunggah: ${err.message || String(err)}`, 'error');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      showToast('Gagal membaca dokumen.', 'error');
      setIsUploading(false);
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
      nomor_dokumen: nomorDokumen.trim() || undefined,
      proof_path_or_link: proof.trim() || undefined,
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

              <DatePicker
                label="Tanggal Pengajuan"
                value={tanggalPengajuan}
                onChange={setTanggalPengajuan}
                fullWidth
              />

              <TextField
                label="Nomor Dokumen (ISBN / HAKI / QRCBN)"
                placeholder="Masukkan nomor dokumen jika sudah terbit..."
                value={nomorDokumen}
                onChange={(e) => setNomorDokumen(e.target.value)}
                fullWidth
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Bukti / Berkas Legalitas (URL / Upload)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={proof}
                      onChange={(e) => setProof(e.target.value)}
                      placeholder="Tautan Google Drive atau klik unggah berkas..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => document.getElementById('legalitas-proof-upload')?.click()}
                    disabled={isUploading}
                    style={{
                      padding: '0 16px',
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {isUploading ? '⏳ Uploading...' : '📤 Unggah'}
                  </button>
                  <input
                    id="legalitas-proof-upload"
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleUploadFile}
                  />
                </div>
              </div>

              <TextArea
                label="Keterangan"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan tambahan terkait pengajuan legalitas ini..."
                style={{ height: '80px' }}
                fullWidth
              />
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

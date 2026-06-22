import React, { useState, useEffect, useMemo } from 'react';
import { Legalitas } from '../../types/data-master.types';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useAppContext } from '../../contexts/AppContext';
import { googleAppsScriptService } from '../../services/googleAppsScript';
import { TextField } from '../../ui/atoms/TextField';

import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';
import { DatePicker } from '../../ui/atoms/DatePicker';
import { TextArea } from '../../ui/atoms/TextArea';
import { SmartRelationField, SmartRelationOption } from '@pubhub/shared-ui';
import { findBestDuplicate, formatDuplicateReason } from '@pubhub/shared-utils';

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
  const { naskah, penulis, addNaskah, addPenulis } = useDataMasterContext();
  const { showToast, setActiveModule } = useAppContext();

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

  const [penulisCreateForm, setPenulisCreateForm] = useState({ name: '', email: '', wa_number: '', address: '', email_valid: 0, wa_valid: 0 });
  const [naskahCreateForm, setNaskahCreateForm] = useState<{ title: string; penulis_id: string; copies: number; cover_type: string }>({ title: '', penulis_id: '', copies: 0, cover_type: '' });

  const [penulisDuplicateWarning, setPenulisDuplicateWarning] = useState<{
    matchedOption: SmartRelationOption;
    similarity: number;
    reason: string;
  } | null>(null);
  const [naskahDuplicateWarning, setNaskahDuplicateWarning] = useState<{
    matchedOption: SmartRelationOption;
    similarity: number;
    reason: string;
  } | null>(null);
  const [selectedRelationPenulisId, setSelectedRelationPenulisId] = useState('');

  const naskahOptions: SmartRelationOption[] = useMemo(() =>
    naskah.map((n) => {
      const penulisName = n.penulis_id ? (penulis.find(p => p.id === n.penulis_id)?.name || `#${n.penulis_id}`) : '-';
      return { value: String(n.id), label: `${n.title} — ${penulisName}`, meta: n };
    }),
  [naskah, penulis]);

  const penulisOptions: SmartRelationOption[] = useMemo(() =>
    penulis.map((p) => ({ value: String(p.id), label: `${p.name}${p.email ? ` — ${p.email}` : ''}`, meta: p })),
  [penulis]);

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

  const createPenulisFromLegalitas = async (onSave?: (val: string) => void) => {
    const name = penulisCreateForm.name.trim();
    if (!name) { showToast('Nama penulis wajib diisi', 'error'); return; }
    const dup = findBestDuplicate(
      { ...penulisCreateForm, id: 0 },
      penulis,
      [
        { key: 'name', weight: 0.7, threshold: 0.85 },
        { key: 'wa_number', weight: 0.2, isPhone: true, threshold: 0.95 },
        { key: 'email', weight: 0.1, threshold: 0.95 },
      ]
    );
    if (dup && !penulisDuplicateWarning) {
      setPenulisDuplicateWarning({
        matchedOption: penulisOptions.find((o) => o.value === String(dup.item.id)) || { value: String(dup.item.id), label: dup.item.name },
        similarity: dup.score,
        reason: formatDuplicateReason(dup),
      });
      return;
    }
    try {
      const id = await addPenulis(penulisCreateForm);
      setNamaPenulis(name);
      setPenulisCreateForm({ name: '', email: '', wa_number: '', address: '', email_valid: 0, wa_valid: 0 });
      setPenulisDuplicateWarning(null);
      onSave?.(String(id));
      showToast('Penulis baru berhasil dibuat', 'success');
    } catch (e) {
      showToast('Gagal membuat penulis baru', 'error');
    }
  };

  const createNaskahFromLegalitas = async (onSave?: (val: string) => void) => {
    const title = naskahCreateForm.title.trim();
    if (!title) { showToast('Judul naskah wajib diisi', 'error'); return; }
    if (!naskahCreateForm.penulis_id) { showToast('Penulis wajib dipilih', 'error'); return; }
    const dup = findBestDuplicate(
      { id: 0, title, copies: naskahCreateForm.copies },
      naskah,
      [
        { key: 'title', weight: 0.8, threshold: 0.85 },
        { key: 'copies', weight: 0.2, threshold: 0.95 },
      ]
    );
    if (dup && !naskahDuplicateWarning) {
      setNaskahDuplicateWarning({
        matchedOption: naskahOptions.find((o) => o.value === String(dup.item.id)) || { value: String(dup.item.id), label: dup.item.title },
        similarity: dup.score,
        reason: formatDuplicateReason(dup, 'title'),
      });
      return;
    }
    try {
      const id = await addNaskah({
        ...naskahCreateForm,
        penulis_id: Number(naskahCreateForm.penulis_id),
        copies: Number(naskahCreateForm.copies) || 0,
        status: 'Belum Dimulai'
      });
      handleNaskahSelect(String(id));
      setNaskahCreateForm({ title: '', penulis_id: '', copies: 0, cover_type: '' });
      setNaskahDuplicateWarning(null);
      onSave?.(String(id));
      showToast('Naskah baru berhasil dibuat', 'success');
    } catch (e) {
      showToast('Gagal membuat naskah baru', 'error');
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
          {initialData ? '📝 Edit Pengajuan Legalitas' : '⚖️ Pengajuan Legalitas Baru'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="📄 Informasi Legalitas" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <SmartRelationField
                label="Pilih dari Naskah yang Ada"
                options={naskahOptions}
                value={naskahId ? String(naskahId) : ''}
                onChange={handleNaskahSelect}
                placeholder="Ketik judul naskah..."
                emptyMessage="Belum ada naskah. Klik '+ Naskah Baru'."
                entityLabel="Naskah"
                fullWidth
                renderCreateForm={({ onSave, onCancel }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Judul naskah"
                      value={naskahCreateForm.title}
                      onChange={(e) => setNaskahCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                    <SmartRelationField
                      label="Penulis"
                      options={penulisOptions}
                      value={naskahCreateForm.penulis_id}
                      onChange={(val) => setNaskahCreateForm((prev) => ({ ...prev, penulis_id: val }))}
                      placeholder="Pilih penulis..."
                      emptyMessage="Belum ada penulis. Klik '+ Penulis Baru'."
                      entityLabel="Penulis"
                      fullWidth
                      renderCreateForm={({ onSave: onSaveInnerPenulis, onCancel: onCancelInnerPenulis }) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input
                            type="text"
                            placeholder="Nama penulis"
                            value={penulisCreateForm.name}
                            onChange={(e) => setPenulisCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                          />
                          <input
                            type="text"
                            placeholder="Email"
                            value={penulisCreateForm.email}
                            onChange={(e) => setPenulisCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                          />
                          <input
                            type="text"
                            placeholder="Telepon"
                            value={penulisCreateForm.wa_number}
                            onChange={(e) => setPenulisCreateForm((prev) => ({ ...prev, wa_number: e.target.value }))}
                            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" type="button" onClick={onCancelInnerPenulis}>Batal</button>
                            <button className="btn-primary" type="button" onClick={() => createPenulisFromLegalitas(onSaveInnerPenulis)}>Simpan</button>
                          </div>
                        </div>
                      )}
                      duplicateWarning={penulisDuplicateWarning}
                      onSelectExisting={(val) => {
                        setNaskahCreateForm((prev) => ({ ...prev, penulis_id: val }));
                        setPenulisDuplicateWarning(null);
                      }}
                      onConfirmCreateAnyway={() => createPenulisFromLegalitas((id) => setNaskahCreateForm((prev) => ({ ...prev, penulis_id: id })))}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" type="button" onClick={onCancel}>Batal</button>
                      <button className="btn-primary" type="button" onClick={() => createNaskahFromLegalitas(onSave)}>Simpan</button>
                    </div>
                  </div>
                )}
                duplicateWarning={naskahDuplicateWarning}
                onSelectExisting={(val) => {
                  handleNaskahSelect(val);
                  setNaskahDuplicateWarning(null);
                }}
                onConfirmCreateAnyway={() => createNaskahFromLegalitas(() => {})}
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

              <SmartRelationField
                label="Cari Penulis dari Database"
                options={penulisOptions}
                value={selectedRelationPenulisId}
                onChange={(val) => {
                  setSelectedRelationPenulisId(val);
                  if (val) {
                    const p = penulis.find((x) => x.id === Number(val));
                    if (p) setNamaPenulis(p.name);
                  }
                }}
                placeholder="Ketik nama penulis..."
                emptyMessage="Belum ada penulis. Klik '+ Penulis Baru'."
                entityLabel="Penulis"
                fullWidth
                renderCreateForm={({ onSave, onCancel }) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Nama penulis"
                      value={penulisCreateForm.name}
                      onChange={(e) => setPenulisCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      placeholder="Email"
                      value={penulisCreateForm.email}
                      onChange={(e) => setPenulisCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                    <input
                      type="text"
                      placeholder="Telepon"
                      value={penulisCreateForm.wa_number}
                      onChange={(e) => setPenulisCreateForm((prev) => ({ ...prev, wa_number: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" type="button" onClick={onCancel}>Batal</button>
                      <button className="btn-primary" type="button" onClick={() => createPenulisFromLegalitas((id) => { setSelectedRelationPenulisId(id); onSave(id); })}>Simpan</button>
                    </div>
                  </div>
                )}
                duplicateWarning={penulisDuplicateWarning}
                onSelectExisting={(val) => {
                  setSelectedRelationPenulisId(val);
                  const p = penulis.find((x) => x.id === Number(val));
                  if (p) setNamaPenulis(p.name);
                  setPenulisDuplicateWarning(null);
                }}
                onConfirmCreateAnyway={() => createPenulisFromLegalitas((id) => { setSelectedRelationPenulisId(id); })}
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

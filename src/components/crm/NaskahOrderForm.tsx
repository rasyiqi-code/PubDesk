import React, { useState, useEffect } from 'react';
import { NaskahOrder } from '../../types/crm.types';
import { useCrmContext } from '../../contexts/CrmContext';
import { useAppContext } from '../../contexts/AppContext';
import { TextField } from '../../ui/atoms/TextField';
import { Select } from '../../ui/atoms/Select';
import { Button } from '../../ui/atoms/Button';

interface NaskahOrderFormProps {
  initialData?: NaskahOrder | null;
  onSubmit: (data: Omit<NaskahOrder, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const NaskahOrderForm: React.FC<NaskahOrderFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { penulis, penerbit } = useCrmContext();
  const { showToast } = useAppContext();
  
  const [naskahIdCode, setNaskahIdCode] = useState('');
  const [title, setTitle] = useState('');
  const [penulisId, setPenulisId] = useState<number | undefined>(undefined);
  const [penerbitId, setPenerbitId] = useState<number | undefined>(undefined);
  const [packageType, setPackageType] = useState('Standar');
  const [orderType, setOrderType] = useState('Baru');
  const [copies, setCopies] = useState<number>(0);
  const [bookSize, setBookSize] = useState('14x20');
  const [initialRequest, setInitialRequest] = useState('');
  const [revisedRequest, setRevisedRequest] = useState('');
  const [legalType, setLegalType] = useState('ISBN');
  const [shippingAddress, setShippingAddress] = useState('');
  const [status, setStatus] = useState('Belum Dimulai');

  useEffect(() => {
    if (initialData) {
      setNaskahIdCode(initialData.naskah_id_code || '');
      setTitle(initialData.title);
      setPenulisId(initialData.penulis_id || undefined);
      setPenerbitId(initialData.penerbit_id || undefined);
      setPackageType(initialData.package_type || 'Standar');
      setOrderType(initialData.order_type || 'Baru');
      setCopies(initialData.copies || 0);
      setBookSize(initialData.book_size || '14x20');
      setInitialRequest(initialData.initial_request || '');
      setRevisedRequest(initialData.revised_request || '');
      setLegalType(initialData.legal_type || 'ISBN');
      setShippingAddress(initialData.shipping_address || '');
      setStatus(initialData.status);
    } else {
      setNaskahIdCode('');
      setTitle('');
      setPenulisId(undefined);
      setPenerbitId(undefined);
      setPackageType('Standar');
      setOrderType('Baru');
      setCopies(0);
      setBookSize('14x20');
      setInitialRequest('');
      setRevisedRequest('');
      setLegalType('ISBN');
      setShippingAddress('');
      setStatus('Belum Dimulai');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Judul naskah tidak boleh kosong!', 'error');
      return;
    }

    onSubmit({
      id: initialData?.id,
      naskah_id_code: naskahIdCode.trim() || undefined,
      title: title.trim(),
      penulis_id: penulisId || undefined,
      penerbit_id: penerbitId || undefined,
      package_type: packageType,
      order_type: orderType,
      copies: copies,
      book_size: bookSize,
      initial_request: initialRequest.trim() || undefined,
      revised_request: revisedRequest.trim() || undefined,
      legal_type: legalType,
      shipping_address: shippingAddress.trim() || undefined,
      status: status,
    });
  };

  const penulisOptions = [
    { value: '', label: '-- Pilih Penulis --' },
    ...penulis.map(p => ({ value: String(p.id), label: p.name }))
  ];

  const penerbitOptions = [
    { value: '', label: '-- Pilih Penerbit --' },
    ...penerbit.map(pub => ({ value: String(pub.id), label: pub.name }))
  ];

  const packageOptions = [
    { value: 'Standar', label: 'Standar' },
    { value: 'Populer', label: 'Populer' },
    { value: 'Eksklusif', label: 'Eksklusif' },
    { value: 'Kustom', label: 'Kustom' }
  ];

  const orderTypeOptions = [
    { value: 'Baru', label: 'Baru' },
    { value: 'Cetak Ulang', label: 'Cetak Ulang' },
    { value: 'Revisi', label: 'Revisi' }
  ];

  const legalOptions = [
    { value: 'ISBN', label: 'ISBN' },
    { value: 'QRCBN', label: 'QRCBN' },
    { value: 'Tanpa ISBN', label: 'Tanpa ISBN' }
  ];

  const statusOptions = [
    { value: 'Belum Dimulai', label: 'Belum Dimulai' },
    { value: 'Sedang Dikerjakan', label: 'Sedang Dikerjakan' },
    { value: 'Selesai', label: 'Selesai' },
    { value: 'Batal', label: 'Batal' }
  ];

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Naskah & Order' : 'Pembuat Naskah & Order Baru'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ background: 'var(--bg-panel)', padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <TextField
              label="Kode ID Naskah"
              placeholder="Contoh: NSK-010"
              value={naskahIdCode}
              onChange={(e) => setNaskahIdCode(e.target.value)}
              fullWidth
            />

            <TextField
              label="Judul Naskah / Buku"
              placeholder="Masukkan judul lengkap..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Penulis (Relasi CRM)"
              options={penulisOptions}
              value={penulisId || ''}
              onChange={(e) => setPenulisId(e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
            />

            <Select
              label="Penerbit Mitra (Relasi CRM)"
              options={penerbitOptions}
              value={penerbitId || ''}
              onChange={(e) => setPenerbitId(e.target.value ? Number(e.target.value) : undefined)}
              fullWidth
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Paket Penerbitan"
              options={packageOptions}
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              fullWidth
            />

            <Select
              label="Tipe Order"
              options={orderTypeOptions}
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              fullWidth
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <TextField
              label="Jumlah Cetak (Copies)"
              type="number"
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              min={0}
              fullWidth
            />

            <TextField
              label="Ukuran Buku"
              placeholder="Contoh: 14x20 cm atau A5"
              value={bookSize}
              onChange={(e) => setBookSize(e.target.value)}
              fullWidth
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Legalitas / Perizinan"
              options={legalOptions}
              value={legalType}
              onChange={(e) => setLegalType(e.target.value)}
              fullWidth
            />

            <Select
              label="Status Naskah"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              fullWidth
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Permintaan Awal Layout/Desain
            </label>
            <textarea
              style={inputStyle}
              rows={3}
              value={initialRequest}
              onChange={(e) => setInitialRequest(e.target.value)}
              placeholder="Masukkan catatan tata letak, warna cover, dsb..."
            />
          </div>

          {initialData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Catatan Revisi / Masukan Penulis
              </label>
              <textarea
                style={inputStyle}
                rows={3}
                value={revisedRequest}
                onChange={(e) => setRevisedRequest(e.target.value)}
                placeholder="Detail revisi yang diajukan..."
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Alamat Pengiriman Hasil Cetak
            </label>
            <textarea
              style={inputStyle}
              rows={3}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Alamat lengkap penerima cetak buku..."
            />
          </div>
        </div>

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

export default NaskahOrderForm;

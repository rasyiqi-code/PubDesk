import React, { useState, useEffect } from 'react';
import { NaskahOrder } from '../../types/crm.types';
import { useCrmContext } from '../../contexts/CrmContext';

interface NaskahOrderFormProps {
  initialData?: NaskahOrder | null;
  onSubmit: (data: Omit<NaskahOrder, 'created_at' | 'id'> & { id?: number }) => Promise<void>;
  onCancel: () => void;
}

const NaskahOrderForm: React.FC<NaskahOrderFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { penulis, penerbit } = useCrmContext();
  
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
    if (!title.trim()) return;

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

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {initialData ? '📝 Edit Naskah & Order' : '📚 Tambah Naskah / Order Baru'}
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Kode ID Naskah
            </label>
            <input
              type="text"
              value={naskahIdCode}
              onChange={(e) => setNaskahIdCode(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: NSK-001"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Judul Buku / Naskah <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Masukkan judul naskah..."
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Penulis (Relasi CRM)
            </label>
            <select
              value={penulisId || ''}
              onChange={(e) => setPenulisId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="">-- Pilih Penulis --</option>
              {penulis.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Penerbit Mitra (Relasi CRM)
            </label>
            <select
              value={penerbitId || ''}
              onChange={(e) => setPenerbitId(e.target.value ? Number(e.target.value) : undefined)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="">-- Pilih Penerbit --</option>
              {penerbit.map((pub) => (
                <option key={pub.id} value={pub.id}>{pub.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Paket Penerbitan
            </label>
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="Standar">Standar</option>
              <option value="Populer">Populer</option>
              <option value="Eksklusif">Eksklusif</option>
              <option value="Kustom">Kustom</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Tipe Order
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="Baru">Baru</option>
              <option value="Cetak Ulang">Cetak Ulang</option>
              <option value="Revisi">Revisi</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Jumlah Cetak (Copies)
            </label>
            <input
              type="number"
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              min={0}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Ukuran Buku
            </label>
            <input
              type="text"
              value={bookSize}
              onChange={(e) => setBookSize(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              placeholder="Contoh: 14x20, A5"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Legalitas / Perizinan
            </label>
            <select
              value={legalType}
              onChange={(e) => setLegalType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="ISBN">ISBN</option>
              <option value="QRCBN">QRCBN</option>
              <option value="Tanpa ISBN">Tanpa ISBN</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Status Naskah
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="Belum Dimulai">Belum Dimulai</option>
              <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
              <option value="Selesai">Selesai</option>
              <option value="Batal">Batal</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Permintaan Awal Layout/Desain
          </label>
          <textarea
            value={initialRequest}
            onChange={(e) => setInitialRequest(e.target.value)}
            style={{
              width: '100%',
              height: '60px',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Tulis instruksi desain/layout awal..."
          />
        </div>

        {initialData && (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Catatan Revisi / Perubahan
            </label>
            <textarea
              value={revisedRequest}
              onChange={(e) => setRevisedRequest(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Masukkan catatan revisi dari penulis..."
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            Alamat Pengiriman Hasil Cetak
          </label>
          <textarea
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            style={{
              width: '100%',
              height: '60px',
              padding: '10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'vertical'
            }}
            placeholder="Tulis alamat pengiriman lengkap..."
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}>
            💾 Simpan Order
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel} style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}>
            ❌ Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default NaskahOrderForm;

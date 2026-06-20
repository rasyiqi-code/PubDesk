import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Contact } from '../../types/contact.types';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';

const CustomerForm: React.FC = () => {
  const {
    addContact,
    updateContact,
    showToast,
    setActiveModule,
    editingCustomer,
    setEditingCustomer
  } = useAppContext();

  // State form
  const [name, setName] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [address, setAddress] = useState('');
  
  // State accordion
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  // Sinkronisasi data saat masuk mode edit
  useEffect(() => {
    if (editingCustomer) {
      setName(editingCustomer.name);
      setWaNumber(editingCustomer.wa_number || '');
      setAddress(editingCustomer.address || '');
    } else {
      setName('');
      setWaNumber('');
      setAddress('');
    }
  }, [editingCustomer]);

  // Reset form dan batalkan aksi
  const handleCancel = () => {
    setEditingCustomer(null);
    setName('');
    setWaNumber('');
    setAddress('');
    setActiveModule('customer-manager');
  };

  // Simpan data (Tambah/Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama pelanggan tidak boleh kosong!', 'error');
      return;
    }

    const customerData: Contact = {
      id: editingCustomer?.id || undefined,
      name: name.trim(),
      wa_number: waNumber.trim() || undefined,
      address: address.trim() || undefined,
      type: 'customer',
      created_at: editingCustomer
        ? editingCustomer.created_at
        : new Date().toISOString()
    };

    try {
      if (editingCustomer) {
        await updateContact(customerData);
        showToast('Data pelanggan berhasil diperbarui!', 'success');
      } else {
        await addContact(customerData);
        showToast('Pelanggan baru berhasil ditambahkan!', 'success');
      }
      setEditingCustomer(null);
      setName('');
      setWaNumber('');
      setAddress('');
      setActiveModule('customer-manager');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan data pelanggan!', 'error');
    }
  };

  return (
    <div className="customer-form" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {editingCustomer ? '📝 Edit Profil Pelanggan' : 'Pembuat Profil Pelanggan'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Accordion>
          <AccordionSection index={1} title="💬 Informasi Profil Pelanggan" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Nama Pelanggan / Instansi
                </label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    outline: 'none' 
                  }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: PT. Aksara Nusantara Utama"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Nomor WhatsApp / Kontak
                </label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    outline: 'none' 
                  }}
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="Contoh: 08123456789 atau +62812..."
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Alamat Pengiriman / Surat (Opsional)
                </label>
                <textarea
                  style={{ 
                    width: '100%', 
                    height: '120px', 
                    padding: '10px 14px', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    resize: 'vertical', 
                    outline: 'none', 
                    lineHeight: '1.4' 
                  }}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap pengiriman buku atau invoice..."
                />
              </div>
            </div>
          </AccordionSection>
        </Accordion>

        {/* Aksi Utama */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }}>
            {editingCustomer ? '💾 Perbarui & Catat' : '💾 Simpan & Catat'}
          </button>
          <button type="button" className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600' }} onClick={handleCancel}>
            ❌ Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;

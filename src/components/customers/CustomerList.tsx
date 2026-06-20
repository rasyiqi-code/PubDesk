import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Contact } from '../../types/contact.types';
import { TableEmptyState } from '../../ui/molecules/EmptyState';

const CustomerList: React.FC = () => {
  const {
    contacts,
    deleteContact,
    showToast,
    showConfirm,
    setEditingCustomer,
    setActiveModule
  } = useAppContext();

  // State pencarian lokal
  const [searchQuery, setSearchQuery] = useState('');

  // Saring kontak yang bertipe 'customer'
  const customers = useMemo(() => {
    return contacts.filter(c => c.type === 'customer');
  }, [contacts]);

  // Saring berdasarkan input pencarian
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.wa_number || '').toLowerCase().includes(query) ||
      (c.address || '').toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  // Fungsi untuk memulai pengeditan pelanggan
  const handleStartEdit = (customer: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setActiveModule('customer-form');
  };

  // Fungsi untuk menghapus pelanggan
  const handleDeleteCustomer = (id: number, customerName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Pelanggan',
      message: `Apakah Anda yakin ingin menghapus pelanggan "${customerName}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteContact(id);
          showToast('Pelanggan berhasil dihapus!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus pelanggan!', 'error');
        }
      }
    });
  };

  // Salin nomor WA ke clipboard
  const handleCopyWa = (num: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(num);
    showToast('Nomor WhatsApp disalin!', 'success');
  };

  return (
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      
      {/* Baris Atas: Pencarian & Tombol Tambah (Menyerupai FilterBar di File List) */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 16px', 
        borderBottom: '1px solid var(--border)', 
        background: 'var(--bg-panel)', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        {/* Input Pencarian dengan style seragam */}
        <div style={{ position: 'relative', width: '280px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '14px' }}>🔍</span>
          <input
            type="text"
            placeholder="Cari nama, kontak WhatsApp, alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '6px 12px 6px 36px', 
              border: '1px solid var(--border)', 
              borderRadius: '20px', 
              fontSize: '12px', 
              background: 'var(--bg-card)', 
              color: 'var(--text-primary)', 
              outline: 'none'
            }}
          />
        </div>

        {/* Tombol Tambah Pelanggan */}
        <button 
          onClick={() => {
            setEditingCustomer(null);
            setActiveModule('customer-form');
          }}
          className="btn-primary" 
          style={{ 
            padding: '6px 14px', 
            fontSize: '12px', 
            fontWeight: '600', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          <span>➕</span> Tambah Pelanggan
        </button>
      </div>

      {/* Tabel Data (Membentang penuh seperti FileList) */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '8%', textAlign: 'center', userSelect: 'none' }}>Avatar</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '32%', userSelect: 'none' }}>Nama Pelanggan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '20%', userSelect: 'none' }}>Kontak WhatsApp</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '25%', userSelect: 'none' }}>Alamat Instansi / Pengiriman</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '15%', textAlign: 'center', userSelect: 'none' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon="👥"
                message="Tidak ada data pelanggan"
                description={searchQuery ? `Tidak ada hasil untuk pencarian "${searchQuery}"` : "Belum ada pelanggan terdaftar. Tambahkan pelanggan baru untuk memulai."}
              />
            ) : (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '16px' }}>
                    👤
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {customer.name}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {customer.wa_number ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{customer.wa_number}</span>
                        <button
                          onClick={(e) => handleCopyWa(customer.wa_number!, e)}
                          style={{ 
                            border: 'none', 
                            background: 'transparent', 
                            cursor: 'pointer', 
                            fontSize: '12px', 
                            padding: '4px', 
                            opacity: 0.6,
                            borderRadius: '4px',
                            transition: 'opacity 0.15s ease'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseOut={(e) => e.currentTarget.style.opacity = '0.6'}
                          title="Salin nomor WhatsApp"
                        >
                          📋
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Tidak ada</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={customer.address}>
                    {customer.address || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Tidak ada alamat terdaftar</span>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="btn-secondary"
                        onClick={(e) => handleStartEdit(customer, e)}
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                        title="Edit Rincian Pelanggan"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={(e) => customer.id && handleDeleteCustomer(customer.id, customer.name, e)}
                        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                        title="Hapus Pelanggan"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerList;

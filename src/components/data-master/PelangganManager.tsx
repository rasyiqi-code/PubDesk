import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Contact } from '../../types/contact.types';
import { Button } from '../../ui/atoms/Button';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { FilterBar, FilterGroup, FilterDivider } from '../../ui/molecules/FilterBar';
import PelangganForm from './PelangganForm';

interface PelangganManagerProps {
  searchQuery?: string;
}

const PelangganManager: React.FC<PelangganManagerProps> = ({ searchQuery = '' }) => {
  const { contacts, addContact, updateContact, deleteContact, showConfirm, showToast, setRightPanelVisible, selectedCustomerId, setSelectedCustomerId, addFile, files } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);

  // Ambil hanya pelanggan (type === 'customer')
  const pelanggan = contacts.filter(c => c.type === 'customer');

  // Filter & Search
  const filteredPelanggan = pelanggan.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.wa_number || '').toLowerCase().includes(query);
    return matchSearch;
  });

  const handleAddNew = () => {
    setCurrentContact(null);
    setIsEditing(true);
  };

  const handleEdit = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentContact(contact);
    setIsEditing(true);
  };

  const registerPelangganFile = async (contactId: number, contactData: Contact) => {
    try {
      const filename = `Pelanggan-${contactId}.json`;
      const jsonString = JSON.stringify(contactData);
      const bytes = new TextEncoder().encode(jsonString);
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'pelanggan'
      });
      const alreadyExists = files.some(f => f.filename === filename && f.type === 'pelanggan');
      if (!alreadyExists) {
        await addFile({
          filename,
          path: physicalPath,
          type: 'pelanggan',
          project_id: undefined,
          version_label: String(contactId),
          status: 'Tersimpan',
          last_modified: new Date().toISOString(),
          is_readonly: false
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan file pelanggan:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<Contact, 'created_at' | 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const existing = pelanggan.find(p => p.id === data.id);
        if (existing) {
          await updateContact({ ...existing, ...data });
          showToast('Data pelanggan berhasil diperbarui', 'success');
          await registerPelangganFile(data.id, { ...existing, ...data } as Contact);
        }
      } else {
        const newId = await addContact({
          ...data,
          created_at: new Date().toISOString()
        });
        showToast('Data pelanggan berhasil ditambahkan', 'success');
        if (newId) {
          await registerPelangganFile(newId, { ...data, id: newId, created_at: new Date().toISOString() } as Contact);
        }
      }
      setIsEditing(false);
      setCurrentContact(null);
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat menyimpan data pelanggan', 'error');
    }
  };

  const handleRowClick = (id?: number) => {
    if (id) {
      setSelectedCustomerId(id);
    }
  };

  const handleRowDoubleClick = (id?: number) => {
    if (id) {
      setSelectedCustomerId(id);
      setRightPanelVisible(true);
    }
  };

  const handleDelete = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Pelanggan',
      message: `Apakah Anda yakin ingin menghapus data pelanggan "${name}"?`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteContact(id);
          showToast('Data pelanggan berhasil dihapus', 'success');
          if (selectedCustomerId === id) {
            setSelectedCustomerId(null);
          }
        } catch (err) {
          showToast('Gagal menghapus data pelanggan', 'error');
        }
      }
    });
  };

  if (isEditing) {
    return (
      <PelangganForm
        initialData={currentContact}
        onSubmit={handleFormSubmit}
        onCancel={() => { setIsEditing(false); setCurrentContact(null); }}
      />
    );
  }

  return (
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>

      <FilterBar>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
          👥 <strong style={{ color: 'var(--text-primary)' }}>{filteredPelanggan.length}</strong> pelanggan
        </span>

        <FilterDivider />

        <FilterGroup label="">
          <Button variant="primary" size="sm" onClick={handleAddNew} icon="➕">
            Tambah Pelanggan
          </Button>
        </FilterGroup>
      </FilterBar>

      {/* Tabel */}
      <div style={{ flex: 1, overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>No.</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Nama Lengkap</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>No. WhatsApp</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Email</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Alamat</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPelanggan.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                icon={searchQuery ? '🔍' : '👥'}
                message={searchQuery ? 'Tidak ada pelanggan yang cocok' : 'Belum ada data pelanggan'}
                description={searchQuery ? `Pencarian "${searchQuery}" tidak membuahkan hasil.` : 'Mulai tambahkan pelanggan baru dengan menekan tombol Tambah Pelanggan di atas.'}
              />
            ) : (
              filteredPelanggan.map((p, index) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedCustomerId === p.id ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleRowClick(p.id)}
                  onDoubleClick={() => handleRowDoubleClick(p.id)}
                  onMouseEnter={(e) => {
                    if (selectedCustomerId !== p.id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCustomerId !== p.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {index + 1}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.wa_number || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.email || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.address}>
                    {p.address || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                      <button onClick={(e) => handleEdit(p, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Edit">✏️</button>
                      <button onClick={(e) => p.id && handleDelete(p.id, p.name, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Hapus">🗑️</button>
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

export default PelangganManager;

import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Service } from '../../types';
import { formatPrice } from '../../utils/format';

const ServiceManager: React.FC = () => {
  const { services, addService, updateService, deleteService, showToast, selectedServiceId, setSelectedServiceId, addFile, files, showConfirm, rightPanelVisible } = useAppContext();

  // State untuk form input tambah / edit
  const [isEditing, setIsEditing] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('penerbitan');
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState('');

  // Fungsi reset form
  const resetForm = () => {
    setIsEditing(false);
    setCurrentServiceId(null);
    setName('');
    setCategory('penerbitan');
    setPrice(0);
    setDescription('');
  };

  // Mulai mode edit
  const handleStartEdit = (service: Service, e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah bentrok dengan seleksi row
    setIsEditing(true);
    setCurrentServiceId(service.id || null);
    setName(service.name);
    setCategory(service.category);
    setPrice(service.price);
    setDescription(service.description || '');
    if (service.id) {
      setSelectedServiceId(service.id);
    }
  };

  // Simpan tambah atau edit layanan
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama layanan tidak boleh kosong!', 'error');
      return;
    }

    const serviceData: Service = {
      id: currentServiceId || undefined,
      name: name.trim(),
      category,
      price,
      description: description.trim() || undefined,
    };

    try {
      let serviceId = currentServiceId;
      if (isEditing && currentServiceId !== null) {
        await updateService(serviceData);
        showToast('Layanan berhasil diperbarui!', 'success');
      } else {
        const newId = await addService(serviceData);
        serviceId = newId;
        showToast('Layanan baru berhasil ditambahkan!', 'success');
      }

      // Tulis file fisik JSON berisi data layanan dan daftarkan ke Smart Folder
      if (serviceId) {
        const filename = `Service-${serviceId}.json`;
        const serviceJsonString = JSON.stringify({ ...serviceData, id: serviceId });
        const bytes = new TextEncoder().encode(serviceJsonString);

        const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
        const physicalPath = await tauriInvoke<string>('create_physical_file', {
          filename,
          bytes: Array.from(bytes),
          folder: 'services',
        });

        // Daftarkan ke Smart Folder (tabel files) jika belum terdaftar
        const alreadyExists = files.some((f) => f.filename === filename && f.type === 'service');
        if (!alreadyExists) {
          const fileData = {
            filename,
            path: physicalPath,
            type: 'service',
            project_id: undefined,
            version_label: String(serviceId),
            status: 'Aktif',
            last_modified: new Date().toISOString(),
            is_readonly: false,
          };
          await addFile(fileData);
        }
      }

      resetForm();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan layanan!', 'error');
    }
  };

  // Hapus layanan
  const handleDeleteService = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm({
      title: 'Hapus Layanan',
      message: 'Apakah Anda yakin ingin menghapus layanan ini?',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteService(id);
          showToast('Layanan berhasil dihapus!', 'success');
          if (selectedServiceId === id) {
            setSelectedServiceId(null);
          }
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus layanan!', 'error');
        }
      }
    });
  };



  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'penerbitan':
        return 'Layanan Penerbitan';
      case 'desain_layout':
        return 'Desain & Layout';
      case 'haki':
        return 'Pendaftaran HAKI';
      case 'isbn':
        return 'Pengajuan ISBN';
      case 'mitra':
        return 'Layanan Mitra';
      default:
        return 'Lainnya';
    }
  };

  return (
    <div className="service-manager" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflow: 'auto' }}>
      
      {/* Header Modul */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          🛠️ Master Manajemen Layanan
        </h1>
        {(isEditing || name || price || description) && (
          <button className="btn-secondary" onClick={resetForm} style={{ padding: '6px 12px', fontSize: '13px' }}>
            Batal / Reset
          </button>
        )}
      </div>

      {/* Form Tambah/Edit */}
      <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '8px', color: 'var(--text-primary)' }}>
          {isEditing ? '✏️ Edit Rincian Layanan' : '➕ Tambah Layanan Baru'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Layanan</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Desain Cover Premium & Layouting"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Kategori Layanan</label>
              <select
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="penerbitan">Layanan Penerbitan</option>
                <option value="desain_layout">Desain & Layout</option>
                <option value="haki">Pendaftaran HAKI</option>
                <option value="isbn">Pengajuan ISBN</option>
                <option value="mitra">Layanan Mitra</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Tarif / Harga Layanan (Rp)</label>
              <input
                type="number"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={price || ''}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Deskripsi Layanan (Opsional)</label>
            <textarea
              style={{ width: '100%', height: '80px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan cakupan layanan, batasan revisi, atau rincian mitra di sini..."
            />
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>
            {isEditing ? '💾 Simpan Perubahan' : '➕ Tambah Layanan'}
          </button>
        </div>
      </form>

      {/* Tabel List Layanan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '8px', color: 'var(--text-primary)' }}>
          📋 Daftar Master Layanan ({services.length})
        </h2>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: '600' }}>
                <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>Ikon</th>
                <th style={{ padding: '12px 16px' }}>Nama Layanan</th>
                <th style={{ padding: '12px 16px' }}>Kategori</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Tarif Layanan</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '150px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Belum ada data master layanan.
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const isSelected = selectedServiceId === service.id;
                  return (
                    <tr
                      key={service.id}
                      onClick={() => service.id && setSelectedServiceId(service.id)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--bg-panel)' : 'transparent',
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '8px 16px', textAlign: 'center', fontSize: '18px' }}>
                        🛠️
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {service.name}
                        {isSelected && <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--accent)', color: '#ffffff' }}>Terpilih</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: 'var(--bg-panel)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)'
                        }}>
                          {getCategoryLabel(service.category)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>
                        {formatPrice(service.price)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            className="btn-secondary"
                            onClick={(e) => handleStartEdit(service, e)}
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Layanan"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-danger"
                            onClick={(e) => service.id && handleDeleteService(service.id, e)}
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Hapus Layanan"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ServiceManager;

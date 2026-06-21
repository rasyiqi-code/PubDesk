import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Service } from '../../types/service.types';
import { formatPrice } from '../../utils/format';
import ServiceForm from './ServiceForm';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/molecules/FilterBar';
import * as XLSX from 'xlsx';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case 'penerbitan': return 'Layanan Penerbitan';
    case 'desain_layout': return 'Desain & Layout';
    case 'haki': return 'Pendaftaran HAKI';
    case 'isbn': return 'Pengajuan ISBN';
    case 'mitra': return 'Layanan Mitra';
    default: return 'Lainnya';
  }
};


interface ServiceManagerProps {
  searchQuery?: string;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ searchQuery = '' }) => {
  const { 
    services, 
    addService, 
    updateService, 
    deleteService, 
    showToast, 
    selectedServiceId, 
    setSelectedServiceId, 
    addFile, 
    files, 
    showConfirm, 
    setRightPanelVisible, 
    registerImportExportActions,
    directAddNewModule,
    setDirectAddNewModule
  } = useAppContext();

  useEffect(() => {
    const actions = {
      onImport: () => document.getElementById('services-excel-import-input')?.click(),
      onExport: handleExportExcel,
      onDownloadTemplate: handleDownloadTemplate
    };
    registerImportExportActions('services', actions);
    return () => {
      registerImportExportActions('services', null);
    };
  }, [services]);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          showToast('File Excel kosong!', 'error');
          return;
        }

        let importedCount = 0;
        let errorCount = 0;

        for (const row of data) {
          const name = row["Nama Layanan"] || row.Nama || row.nama || row.Name || row.name;
          if (!name) {
            errorCount++;
            continue;
          }

          const price = parseFloat(row.Tarif || row.Harga || row.harga || row.Price || row.price || '0');
          const description = row.Deskripsi || row.deskripsi || row.Description || row.description;
          const category_raw = String(row.Kategori || row.kategori || row.Category || row.category || 'other').toLowerCase();
          
          let category = 'other';
          if (category_raw.includes('penerbitan')) category = 'penerbitan';
          else if (category_raw.includes('desain') || category_raw.includes('layout')) category = 'desain_layout';
          else if (category_raw.includes('haki')) category = 'haki';
          else if (category_raw.includes('isbn')) category = 'isbn';
          else if (category_raw.includes('mitra')) category = 'mitra';

          try {
            await addService({
              name: String(name).trim(),
              price: isNaN(price) ? 0 : price,
              description: description ? String(description).trim() : undefined,
              category
            });
            importedCount++;
          } catch (err) {
            console.error('Gagal mengimpor layanan:', err);
            errorCount++;
          }
        }

        showToast(`Impor layanan berhasil! ${importedCount} data dimasukkan.${errorCount > 0 ? ` Gagal: ${errorCount}` : ''}`, 'success');
        e.target.value = '';
      } catch (err) {
        console.error(err);
        showToast('Gagal memproses file Excel!', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = async () => {
    try {
      if (services.length === 0) {
        showToast('Tidak ada layanan untuk diekspor!', 'info');
        return;
      }

      const exportData = services.map((s, idx) => ({
        "No": idx + 1,
        "Nama Layanan": s.name,
        "Kategori": getCategoryLabel(s.category),
        "Tarif": s.price,
        "Deskripsi": s.description || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      const maxLens = Object.keys(exportData[0] || {}).map(key => {
        return Math.max(
          key.length,
          ...exportData.map(row => String((row as any)[key] || '').length)
        );
      });
      ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 3, 50) }));

      XLSX.utils.book_append_sheet(wb, ws, "Layanan");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Layanan_Export.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Data Layanan berhasil diekspor!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengekspor data layanan!', 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = [
        {
          "Nama Layanan": "Layout Buku Standar",
          "Kategori": "Desain & Layout",
          "Tarif": 350000,
          "Deskripsi": "Layout standar menggunakan Adobe InDesign untuk ukuran A5, maksimal 200 halaman."
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      const maxLens = Object.keys(templateData[0] || {}).map(key => {
        return Math.max(
          key.length,
          ...templateData.map(row => String((row as any)[key] || '').length)
        );
      });
      ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 3, 50) }));

      XLSX.utils.book_append_sheet(wb, ws, "Template Layanan");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'Template_Layanan.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Template Excel Layanan berhasil diunduh!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh template!', 'error');
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (directAddNewModule === 'services') {
      setCurrentService(null);
      setIsEditing(true);
      setDirectAddNewModule(null);
    }
  }, [directAddNewModule]);

  const [filterType, setFilterType] = useState<'category'>('category');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'penerbitan' | 'desain_layout' | 'haki' | 'isbn' | 'mitra' | 'other'>('all');

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q);
      const matchCategory = categoryFilter === 'all' ? true : s.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [services, searchQuery, categoryFilter]);

  const handleAddNew = () => {
    setCurrentService(null);
    setIsEditing(true);
  };

  const handleEdit = (service: Service, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentService(service);
    setIsEditing(true);
  };

  const handleRowClick = (id?: number) => {
    if (id) {
      setSelectedId(id);
      setSelectedServiceId(id);
    }
  };

  const handleRowDoubleClick = (id?: number) => {
    if (id) {
      setSelectedId(id);
      setSelectedServiceId(id);
      setRightPanelVisible(true);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
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
          if (selectedServiceId === id) setSelectedServiceId(null);
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus layanan!', 'error');
        }
      }
    });
  };

  const registerServiceFile = async (serviceId: number, serviceData: Service) => {
    try {
      const filename = `Service-${serviceId}.json`;
      const jsonString = JSON.stringify(serviceData);
      const bytes = new TextEncoder().encode(jsonString);
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const physicalPath = await tauriInvoke<string>('create_physical_file', {
        filename,
        bytes: Array.from(bytes),
        folder: 'services'
      });
      const alreadyExists = files.some(f => f.filename === filename && f.type === 'service');
      if (!alreadyExists) {
        await addFile({
          filename,
          path: physicalPath,
          type: 'service',
          project_id: undefined,
          version_label: String(serviceId),
          status: 'Aktif',
          last_modified: new Date().toISOString(),
          is_readonly: false
        });
      }
    } catch (err) {
      console.error('Gagal mendaftarkan file layanan:', err);
    }
  };

  const handleFormSubmit = async (data: Omit<Service, 'id'> & { id?: number }) => {
    try {
      if (data.id) {
        const original = services.find((s) => s.id === data.id);
        if (original) {
          await updateService({ ...original, ...data } as Service);
          showToast('Layanan berhasil diperbarui!', 'success');
          await registerServiceFile(data.id, { ...original, ...data } as Service);
        }
      } else {
        const newId = await addService(data as Service);
        showToast('Layanan baru berhasil ditambahkan!', 'success');
        await registerServiceFile(newId, { ...data, id: newId } as Service);
      }
      setIsEditing(false);
      setCurrentService(null);
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan layanan!', 'error');
    }
  };

  if (isEditing) {
    return (
      <ServiceForm
        initialData={currentService}
        onSubmit={handleFormSubmit}
        onCancel={() => { setIsEditing(false); setCurrentService(null); }}
      />
    );
  }

  return (
    <div className="customer-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      <input
        type="file"
        id="services-excel-import-input"
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        onChange={handleImportExcel}
      />

      <FilterBar
        actions={
          <Button onClick={handleAddNew} variant="primary" size="sm" icon="➕" />
        }
      >
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{filteredServices.length}</strong>
          {' '}layanan
        </span>

        <FilterDivider />

        <FilterGroup label="🔍 FILTER:">
          <FilterChip 
            label="Kategori" 
            active={filterType === 'category'} 
            onClick={() => { setFilterType('category'); setCategoryFilter('all'); }} 
          />
        </FilterGroup>

        {filterType === 'category' && (
          <>
            <FilterDivider />
            <FilterGroup label="🛠️ KATEGORI:">
              <FilterChip label="Semua" active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} />
              <FilterChip label="Layanan Penerbitan" active={categoryFilter === 'penerbitan'} onClick={() => setCategoryFilter('penerbitan')} />
              <FilterChip label="Desain & Layout" active={categoryFilter === 'desain_layout'} onClick={() => setCategoryFilter('desain_layout')} />
              <FilterChip label="Pendaftaran HAKI" active={categoryFilter === 'haki'} onClick={() => setCategoryFilter('haki')} />
              <FilterChip label="Pengajuan ISBN" active={categoryFilter === 'isbn'} onClick={() => setCategoryFilter('isbn')} />
              <FilterChip label="Layanan Mitra" active={categoryFilter === 'mitra'} onClick={() => setCategoryFilter('mitra')} />
              <FilterChip label="Lainnya" active={categoryFilter === 'other'} onClick={() => setCategoryFilter('other')} />
            </FilterGroup>
          </>
        )}
      </FilterBar>

      {/* Tabel */}
      <div style={{ flex: 1, overflowX: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Nama Layanan</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', userSelect: 'none', whiteSpace: 'nowrap' }}>Kategori</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap' }}>Tarif</th>
              <th style={{ padding: '8px 12px', fontWeight: '600', textAlign: 'left', userSelect: 'none', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-panel)', zIndex: 3, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 ? (
              <TableEmptyState
                colSpan={4}
                icon="🛠️"
                message="Belum ada data layanan"
                description="Klik Tambah Layanan untuk menambahkan layanan baru."
              />
            ) : (
              filteredServices.map((service) => (
                <tr
                  key={service.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: selectedId === service.id ? 'rgba(192, 28, 28, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => handleRowClick(service.id)}
                  onDoubleClick={() => handleRowDoubleClick(service.id)}
                  onMouseEnter={(e) => {
                    if (selectedId !== service.id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedId !== service.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    <div>{service.name}</div>
                    {service.description && (
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '400', marginTop: '2px', fontStyle: 'italic' }}>
                        {service.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: 'rgba(192, 28, 28, 0.08)',
                      color: 'var(--accent)'
                    }}>
                      {getCategoryLabel(service.category)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: 'var(--accent)' }}>
                    {formatPrice(service.price)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', right: 0, background: 'var(--bg-card)', zIndex: 2, boxShadow: '-2px 0 4px rgba(0,0,0,0.06)' }}>
                      <button onClick={(e) => handleEdit(service, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Edit">✏️</button>
                      <button onClick={(e) => service.id && handleDelete(service.id, e)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px',fontSize:'16px',lineHeight:1}} title="Hapus">🗑️</button>
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

export default ServiceManager;

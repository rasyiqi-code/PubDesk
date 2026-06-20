import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { Invoice } from '../../types';
import { formatPrice } from '../../utils/format';
import { StatusBadge } from '../../ui/Badge';
import { TableEmptyState } from '../../ui/EmptyState';
import { FilterBar, FilterGroup, FilterChip, FilterDivider } from '../../ui/FilterBar';

interface InvoiceManagerProps {
  searchQuery?: string;
}

// Daftar status pembayaran invoice
const PAYMENT_STATUSES = [
  { value: 'LUNAS', label: 'Lunas', color: '#16a34a' },
  { value: 'PENDING', label: 'Pending', color: '#d97706' },
  { value: 'BELUM LUNAS', label: 'Belum Lunas', color: '#dc2626' },
];

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ searchQuery = '' }) => {
  const { 
    invoices, 
    deleteInvoice, 
    showConfirm, 
    showToast, 
    setActiveModule, 
  } = useAppContext();

  const {
    files,
    deleteFile,
    setSelectedFileId,
    setRightPanelVisible,
  } = useFileState();
  
  const { loadInvoiceToForm } = useInvoiceContext();

  const [sortField, setSortField] = useState<'date' | 'invoiceNo' | 'customerName' | 'total' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter status pembayaran — pola identik dengan Smart Folders
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const handleSort = (field: 'date' | 'invoiceNo' | 'customerName' | 'total' | 'status') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: 'date' | 'invoiceNo' | 'customerName' | 'total' | 'status') => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ▴' : ' ▾';
  };
  

  
  // Parse file_path (metadata JSON)
  const getInvoiceMetadata = (invoice: Invoice) => {
    try {
      if (invoice.file_path) {
        return JSON.parse(invoice.file_path);
      }
    } catch (e) {
      console.error('Gagal memuat metadata invoice:', e);
    }
    return {
      invoiceNo: '-',
      invoiceDate: '-',
      invoiceHal: '-',
      paymentStatus: 'PENDING',
      customerName: 'Umum',
      customerWa: '-'
    };
  };

  // Filter, Search & Sort Invoices
  const filteredInvoices = useMemo(() => {
    const filtered = invoices.filter((inv) => {
      const metadata = getInvoiceMetadata(inv);
      const invoiceNoLower = (metadata.invoiceNo || '').toLowerCase();
      const customerNameLower = (metadata.customerName || '').toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      const matchesSearch = invoiceNoLower.includes(searchLower) || customerNameLower.includes(searchLower);
      const matchesStatus = selectedStatus === null || (metadata.paymentStatus || 'PENDING') === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const metaA = getInvoiceMetadata(a);
      const metaB = getInvoiceMetadata(b);

      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'date':
          valA = metaA.invoiceDate || a.created_at;
          valB = metaB.invoiceDate || b.created_at;
          break;
        case 'invoiceNo':
          valA = metaA.invoiceNo || '';
          valB = metaB.invoiceNo || '';
          break;
        case 'customerName':
          valA = metaA.customerName || '';
          valB = metaB.customerName || '';
          break;
        case 'total':
          valA = a.total;
          valB = b.total;
          break;
        case 'status':
          valA = metaA.paymentStatus || 'PENDING';
          valB = metaB.paymentStatus || 'PENDING';
          break;
        default:
          valA = a.created_at;
          valB = b.created_at;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [invoices, searchQuery, sortField, sortDirection, selectedStatus]);

  // Aksi Buka File PDF Secara Native
  const handleOpenPDF = async (invoiceId: number) => {
    const fileEntry = files.find(f => f.type === 'invoice' && f.version_label === String(invoiceId));
    if (!fileEntry) {
      showToast('Berkas PDF tidak ditemukan di database!', 'error');
      return;
    }
    try {
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      await tauriInvoke('open_file_physically', { path: fileEntry.path });
      showToast('Membuka PDF invoice...', 'info');
    } catch (err) {
      console.error(err);
      showToast('Gagal membuka berkas PDF secara native!', 'error');
    }
  };

  // Aksi Hapus Invoice
  const handleDeleteInvoice = (invoiceId: number, invoiceNo: string) => {
    showConfirm({
      title: 'Hapus Invoice',
      message: `Apakah Anda yakin ingin menghapus invoice "${invoiceNo}"? Tindakan ini juga akan menghapus berkas PDF fisiknya di Smart Folders.`,
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Hapus entri invoice dari SQLite
          await deleteInvoice(invoiceId);
          
          // Cari & Hapus entri file terkait di SQLite
          const fileEntry = files.find(f => f.type === 'invoice' && f.version_label === String(invoiceId));
          if (fileEntry && fileEntry.id) {
            await deleteFile(fileEntry.id);
          }
          
          showToast(`Invoice "${invoiceNo}" berhasil dihapus!`, 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus invoice!', 'error');
        }
      }
    });
  };

  // Aksi Edit / Muat Ulang ke Generator
  const handleEdit = (invoice: Invoice) => {
    loadInvoiceToForm(invoice);
    setActiveModule('invoice');
    showToast('Data invoice berhasil dimuat ke editor!', 'success');
  };

  // Aksi sinkronisasi manual ke cloud
  const handleSyncCloud = async (invoice: Invoice) => {
    const metadata = getInvoiceMetadata(invoice);
    let items = [];
    try {
      items = JSON.parse(invoice.items_json);
    } catch (e) {
      console.error(e);
    }

    const { googleAppsScriptService } = await import('../../services/googleAppsScript');
    if (!googleAppsScriptService.isConfigured()) {
      showToast('Google Apps Script belum dikonfigurasi di Pengaturan!', 'error');
      return;
    }

    try {
      const fileEntry = files.find(f => f.type === 'invoice' && f.version_label === String(invoice.id));
      let pdfBytes: number[] = [];
      
      if (fileEntry) {
        try {
          // Fallback: panggil service cloud sheet saja jika berkas fisik tidak bisa dibaca langsung
        } catch (readErr) {
          console.error("Gagal membaca berkas fisik:", readErr);
        }
      }

      const itemsPayload = items.map((item: any) => ({
        item_title: item.item_title,
        quantity: item.quantity,
        price: item.price
      }));

      const gasPayload = {
        invoice_no: metadata.invoiceNo || undefined,
        id_invoice: invoice.id,
        tanggal: metadata.invoiceDate || new Date().toISOString().split('T')[0],
        pelanggan: metadata.customerName || '',
        whatsapp: metadata.customerWa || '',
        alamat: metadata.customerAddress || '',
        items: itemsPayload,
        shipping_cost: invoice.shipping_cost,
        admin_fee: invoice.admin_fee,
        total: invoice.total
      };

      showToast('Menyinkronkan data ke Cloud Google Sheets...', 'info');
      const cloudResult = await googleAppsScriptService.sendInvoiceToCloud(
        gasPayload,
        pdfBytes,
        `Invoice-${metadata.invoiceNo || 'DRAF'}.pdf`
      );

      if (cloudResult.success) {
        const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
        await tauriInvoke('update_invoice_sync_status', {
          id: invoice.id,
          syncStatus: 'synced',
          cloudFileUrl: cloudResult.fileUrl || ''
        });
        showToast('Sinkronisasi cloud berhasil!', 'success');
      } else {
        showToast('Gagal sinkronisasi ke cloud Sheets!', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan sinkronisasi cloud!', 'error');
    }
  };



  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>

      <FilterBar>
        {/* Tombol Buat Invoice Baru */}
        <button
          className="btn-primary"
          onClick={() => {
            loadInvoiceToForm({ id: null, file_path: '', items_json: '[]', shipping_cost: 0, admin_fee: 0, total: 0 });
            setActiveModule('invoice');
          }}
          style={{
            padding: '4px 10px', borderRadius: '6px', border: 'none',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            background: 'var(--accent)', color: '#ffffff',
            display: 'flex', alignItems: 'center', gap: '6px',
            height: '24px', flexShrink: 0
          }}
        >
          <span>➕</span> Buat Invoice
        </button>

        <FilterDivider />

        <FilterGroup label="🚦 Status:">
          <FilterChip label="Semua" active={selectedStatus === null} onClick={() => setSelectedStatus(null)} />
          {PAYMENT_STATUSES.map((s) => (
            <FilterChip
              key={s.value}
              label={s.label}
              active={selectedStatus === s.value}
              inactiveColor={s.color}
              onClick={() => setSelectedStatus(selectedStatus === s.value ? null : s.value)}
            />
          ))}
        </FilterGroup>
      </FilterBar>

      {/* Invoice Table Container */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              <th 
                onClick={() => handleSort('date')}
                style={{ padding: '8px 12px', fontWeight: '600', width: '15%', cursor: 'pointer', userSelect: 'none' }}
                title="Urutkan berdasarkan Tanggal"
              >
                Tanggal{renderSortIcon('date')}
              </th>
              <th 
                onClick={() => handleSort('invoiceNo')}
                style={{ padding: '8px 12px', fontWeight: '600', width: '20%', cursor: 'pointer', userSelect: 'none' }}
                title="Urutkan berdasarkan Nomor Invoice"
              >
                No. Invoice{renderSortIcon('invoiceNo')}
              </th>
              <th 
                onClick={() => handleSort('customerName')}
                style={{ padding: '8px 12px', fontWeight: '600', width: '25%', cursor: 'pointer', userSelect: 'none' }}
                title="Urutkan berdasarkan Nama Pelanggan"
              >
                Pelanggan{renderSortIcon('customerName')}
              </th>
              <th 
                onClick={() => handleSort('total')}
                style={{ padding: '8px 12px', fontWeight: '600', width: '15%', textAlign: 'right', cursor: 'pointer', userSelect: 'none' }}
                title="Urutkan berdasarkan Total Nominal"
              >
                Total{renderSortIcon('total')}
              </th>
              <th 
                onClick={() => handleSort('status')}
                style={{ padding: '8px 12px', fontWeight: '600', width: '12%', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                title="Urutkan berdasarkan Status Pembayaran"
              >
                Status{renderSortIcon('status')}
              </th>
              <th style={{ padding: '8px 12px', fontWeight: '600', width: '13%', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                icon="🧾"
                message="Tidak ada invoice yang ditemukan"
                description={searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : undefined}
              />
            ) : (
              filteredInvoices.map((inv) => {
                const metadata = getInvoiceMetadata(inv);
                const status = metadata.paymentStatus || 'PENDING';
                const hasFile = files.some(f => f.type === 'invoice' && f.version_label === String(inv.id));
                
                return (
                  <tr 
                    key={inv.id} 
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease', cursor: 'pointer' }}
                    onClick={() => {
                      const fileEntry = files.find(f => f.type === 'invoice' && f.version_label === String(inv.id));
                      if (fileEntry) {
                        setSelectedFileId(fileEntry.id || null);
                        setRightPanelVisible(true);
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.015)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Tanggal */}
                    <td style={{ padding: '6px 12px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      {metadata.invoiceDate || new Date(inv.created_at).toLocaleDateString('id-ID')}
                    </td>
                    
                    {/* No Invoice */}
                    <td style={{ padding: '6px 12px', color: 'var(--text-primary)', fontWeight: '600' }}>
                      {metadata.invoiceNo || 'DRAF'}
                    </td>
                    
                    {/* Pelanggan */}
                    <td style={{ padding: '6px 12px', color: 'var(--text-primary)' }}>
                      <div style={{ fontWeight: '600' }}>{metadata.customerName || 'Umum'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        WA: {metadata.customerWa || '-'}
                      </div>
                    </td>
                    
                    {/* Total */}
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatPrice(inv.total)}
                    </td>
                    
                    {/* Status Pembayaran */}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                      <StatusBadge status={status} />
                    </td>
                    
                    {/* Aksi */}
                    <td style={{ padding: '6px 12px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {/* Edit / Reload */}
                        <button
                          onClick={() => handleEdit(inv)}
                          title="Edit / Muat Ulang ke Generator"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        
                        {/* Cetak / Lihat PDF */}
                        {hasFile && (
                          <button
                            onClick={() => handleOpenPDF(inv.id!)}
                            title="Buka Berkas PDF Invoice"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </button>
                        )}

                        {/* Sync Cloud Ulang (jika pending/gagal) */}
                        {inv.sync_status !== 'synced' && (
                          <button
                            onClick={() => handleSyncCloud(inv)}
                            title="Sinkronkan Ulang ke Cloud"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                            </svg>
                          </button>
                        )}
                        
                        {/* Hapus */}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id!, metadata.invoiceNo || 'DRAF')}
                          title="Hapus Invoice"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
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
  );
};

export default InvoiceManager;

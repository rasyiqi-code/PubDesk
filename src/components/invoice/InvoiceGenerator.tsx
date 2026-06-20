import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { InvoiceItem } from '../../types';

const InvoiceGenerator: React.FC = () => {
  const { services, addInvoice, updateInvoice, addFile, updateFile, showToast, rightPanelVisible, invoices, files } = useAppContext();
  const {
    customer, setCustomer,
    items, addItem, removeItem,
    shippingCost, setShippingCost,
    adminFee, setAdminFee,
    invoiceType,
    invoiceNo, setInvoiceNo,
    invoiceHal, setInvoiceHal,
    invoiceLampiran, setInvoiceLampiran,
    invoiceDate, setInvoiceDate,
    paymentStatus, setPaymentStatus,
    spesifikasiFasilitas, setSpesifikasiFasilitas,
    calculateItemTotal,
    resetInvoice,
    profiles,
    activeProfileId,
    setActiveProfileId,
    activeProfile,
    editingInvoiceId
  } = useInvoiceContext();

  const [waInput, setWaInput] = useState('');
  const [selectedServiceIdState, setSelectedServiceIdState] = useState('');

  // States for the add item form
  const [customTitle, setCustomTitle] = useState('');
  const [dynamicInputs, setDynamicInputs] = useState<Record<string, any>>({});
  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  // Auto-generate nomor invoice (diawali KBM) ketika kosong
  useEffect(() => {
    if (!invoiceNo && invoices.length >= 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const seq = String(invoices.length + 1).padStart(4, '0');
      setInvoiceNo(`KBM/${year}/${month}/${day}/${seq}`);
    }
  }, [invoices, invoiceNo, setInvoiceNo]);

  // Dynamically set default values when activeProfile changes
  useEffect(() => {
    if (!activeProfile?.tableColumns) return;
    
    const initialInputs: Record<string, any> = {};
    activeProfile.tableColumns.forEach(col => {
      if (col.key === 'item_title') return;
      
      let defVal: any = '';
      if (col.key === 'quantity') {
        defVal = 1;
      } else if (col.key === 'price') {
        defVal = 0;
      } else if (col.key === 'pages') {
        defVal = '';
      } else if (col.key === 'paper_type') {
        defVal = '';
      } else if (col.key === 'item_shipping_cost') {
        defVal = 0;
      } else if (col.key === 'package_name') {
        defVal = '';
      } else if (col.key === 'copyright_holder') {
        defVal = customer.name || '';
      }
      initialInputs[col.key] = defVal;
    });
    
    setDynamicInputs(initialInputs);
    setCustomTitle('');
  }, [activeProfile, customer.name]);

  // Dapatkan daftar field input yang diperlukan untuk profil aktif
  const getRequiredFields = () => {
    if (!activeProfile?.tableColumns) return [];
    
    const fieldsMap = new Map<string, { key: string; label: string; type: 'text' | 'number' | 'currency' }>();
    
    activeProfile.tableColumns.forEach(col => {
      if (col.type !== 'formula') {
        fieldsMap.set(col.key, {
          key: col.key,
          label: col.label,
          type: col.type as 'text' | 'number' | 'currency'
        });
      } else if (col.formula) {
        const tokenRegex = /\{([^}]+)\}/g;
        let match;
        while ((match = tokenRegex.exec(col.formula)) !== null) {
          const tokenKey = match[1];
          if (!fieldsMap.has(tokenKey)) {
            let label = tokenKey;
            let type: 'text' | 'number' | 'currency' = 'text';
            
            if (tokenKey === 'quantity') {
              label = 'Jumlah';
              type = 'number';
            } else if (tokenKey === 'price') {
              label = 'Harga';
              type = 'currency';
            } else if (tokenKey === 'item_shipping_cost') {
              label = 'Ongkos Kirim';
              type = 'currency';
            } else if (tokenKey === 'package_name') {
              label = 'Nama Paket';
              type = 'text';
            } else if (tokenKey === 'pages') {
              label = 'Halaman';
              type = 'text';
            } else if (tokenKey === 'paper_type') {
              label = 'Jenis Naskah';
              type = 'text';
            } else if (tokenKey === 'copyright_holder') {
              label = 'Pemegang Hak Cipta';
              type = 'text';
            }
            
            fieldsMap.set(tokenKey, { key: tokenKey, label, type });
          }
        }
      }
    });
    
    const fields = Array.from(fieldsMap.values());
    const titleField = fields.find(f => f.key === 'item_title');
    const priceField = fields.find(f => f.key === 'price');
    const qtyField = fields.find(f => f.key === 'quantity');
    
    const otherFields = fields.filter(f => f.key !== 'item_title' && f.key !== 'price' && f.key !== 'quantity');
    
    const sortedFields = [];
    if (titleField) sortedFields.push(titleField);
    sortedFields.push(...otherFields);
    if (qtyField) sortedFields.push(qtyField);
    if (priceField) sortedFields.push(priceField);
    
    return sortedFields;
  };

  const handleParseWA = () => {
    const lines = waInput.split('\n');
    let name = '';
    let wa_number = '';
    let address = '';

    lines.forEach((line) => {
      if (line.toLowerCase().startsWith('nama:')) {
        name = line.substring(5).trim();
      } else if (line.toLowerCase().startsWith('no:') || line.toLowerCase().startsWith('wa:')) {
        wa_number = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.toLowerCase().startsWith('alamat:')) {
        address = line.substring(7).trim();
      }
    });

    setCustomer((prev) => ({
      ...prev,
      name: name || prev.name || '',
      wa_number: wa_number || prev.wa_number || '',
      address: address || prev.address || ''
    }));
  };

  const handleAddItem = () => {
    let finalTitle = customTitle.trim();
    let finalPrice = parseFloat(dynamicInputs['price']) || 0;
    const finalQty = parseInt(dynamicInputs['quantity']) || 1;

    if (selectedServiceIdState) {
      const service = services.find((s) => s.id === parseInt(selectedServiceIdState));
      if (service) {
        if (!finalTitle) finalTitle = service.name;
        if (finalPrice === 0) {
          finalPrice = service.price;
        }
      }
    }

    if (!finalTitle) {
      showToast('Nama layanan atau karya harus diisi!', 'error');
      return;
    }

    const newItem: InvoiceItem = {
      book_id: selectedServiceIdState ? parseInt(selectedServiceIdState) : 0,
      item_title: finalTitle,
      quantity: finalQty,
      price: finalPrice,
      discount: 0,
      ...dynamicInputs
    };

    addItem(newItem);

    // Reset form item
    setCustomTitle('');
    setSelectedServiceIdState('');
    
    if (activeProfile?.tableColumns) {
      const initialInputs: Record<string, any> = {};
      activeProfile.tableColumns.forEach(col => {
        if (col.key === 'item_title') return;
        
        let defVal: any = '';
        if (col.key === 'quantity') {
          defVal = 1;
        } else if (col.key === 'price') {
          defVal = 0;
        } else if (col.key === 'pages') {
          defVal = '';
        } else if (col.key === 'paper_type') {
          defVal = '';
        } else if (col.key === 'item_shipping_cost') {
          defVal = 0;
        } else if (col.key === 'package_name') {
          defVal = '';
        } else if (col.key === 'copyright_holder') {
          defVal = customer.name || '';
        }
        initialInputs[col.key] = defVal;
      });
      setDynamicInputs(initialInputs);
    }
  };

  const handleSaveInvoice = async () => {
    if (!customer.name) {
      showToast('Nama pelanggan harus diisi!', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Item pesanan tidak boleh kosong!', 'error');
      return;
    }

    const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    // Deteksi ongkir per item secara dinamis agar tidak bergantung pada tableType tertentu
    const hasItemShipping = activeProfile?.tableColumns?.some(col => col.key === 'item_shipping_cost');
    const globalShip = hasItemShipping ? 0 : shippingCost;
    const total = itemsTotal + globalShip + adminFee;

    const metadata = {
      invoiceNo,
      invoiceDate,
      invoiceHal,
      invoiceLampiran,
      paymentStatus,
      spesifikasiFasilitas,
      invoiceType,
      customerName: customer.name || '',
      customerWa: customer.wa_number || '',
      customerAddress: customer.address || ''
    };

    const invoiceData = {
      id: editingInvoiceId || undefined,
      items_json: JSON.stringify(items),
      shipping_cost: shippingCost,
      admin_fee: adminFee,
      total,
      created_at: new Date().toISOString(),
      export_format: invoiceType,
      file_path: JSON.stringify(metadata)
    };

    try {
      let invoiceId = editingInvoiceId;
      if (editingInvoiceId) {
        await updateInvoice(invoiceData as any);
        showToast('Invoice berhasil diperbarui secara lokal!', 'success');
      } else {
        invoiceId = await addInvoice(invoiceData as any);
      }

      const filename = `Invoice-${invoiceNo ? invoiceNo.replace(/\//g, '_') : 'DRAF'}-${Date.now()}.pdf`;

      // Generate PDF biner dari pratinjau invoice yang sedang aktif di panel kanan
      const { generateInvoicePDFBytes } = await import('../../utils/pdfGenerator');
      let pdfBytes: number[] = [];
      try {
        const bytes = await generateInvoicePDFBytes('invoice-preview-content');
        pdfBytes = Array.from(bytes);
      } catch (err) {
        console.error('Gagal menghasilkan visual PDF:', err);
      }

      // Buat/Perbarui file fisik di folder data aplikasi
      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      let physicalPath = '';
      
      const existingFile = editingInvoiceId ? files.find(f => f.type === 'invoice' && f.version_label === String(editingInvoiceId)) : null;

      if (existingFile) {
        // Gunakan nama file lama untuk overwrite
        const existingFilename = existingFile.path.split('/').pop() || filename;
        physicalPath = await tauriInvoke<string>('create_physical_file', { 
          filename: existingFilename,
          bytes: pdfBytes,
          folder: 'invoices'
        });

        // Update entri berkas di Smart Folders
        await updateFile({
          ...existingFile,
          filename: `Invoice-${invoiceNo || 'DRAF'}.pdf`,
          last_modified: new Date().toISOString()
        });
      } else {
        physicalPath = await tauriInvoke<string>('create_physical_file', { 
          filename,
          bytes: pdfBytes,
          folder: 'invoices'
        });

        // Simpan berkas ke tabel files untuk modul Smart Folders
        const fileData = {
          filename: `Invoice-${invoiceNo || 'DRAF'}.pdf`,
          path: physicalPath,
          type: 'invoice',
          project_id: undefined,
          version_label: String(invoiceId),
          status: 'Tersimpan',
          last_modified: new Date().toISOString(),
          is_readonly: false
        };

        await addFile(fileData);
      }

      // Coba kirim data ke Google Apps Script (Cloud Sheets & Google Drive)
      const { googleAppsScriptService } = await import('../../services/googleAppsScript');
      if (googleAppsScriptService.isConfigured()) {
        try {
          const itemsPayload = items.map(item => ({
            item_title: item.item_title,
            quantity: item.quantity,
            price: item.price
          }));

          const gasPayload = {
            invoice_no: invoiceNo || undefined,
            id_invoice: invoiceId, // opsional: sertakan id dari database lokal
            tanggal: invoiceDate || new Date().toISOString().split('T')[0],
            pelanggan: customer.name || '',
            whatsapp: customer.wa_number || '',
            alamat: customer.address || '',
            items: itemsPayload,
            shipping_cost: shippingCost,
            admin_fee: adminFee,
            total
          };

          showToast('Menyinkronkan data ke Cloud Google Sheets...', 'info');
          const cloudResult = await googleAppsScriptService.sendInvoiceToCloud(
            gasPayload,
            pdfBytes,
            filename
          );

          if (cloudResult.success) {
            try {
              await tauriInvoke('update_invoice_sync_status', {
                id: invoiceId,
                syncStatus: 'synced',
                cloudFileUrl: cloudResult.fileUrl || ''
              });
            } catch (dbUpdateError) {
              console.error('Gagal memperbarui status sinkronisasi di database lokal:', dbUpdateError);
            }
            showToast(`Invoice berhasil disinkronkan ke Cloud!`, 'success');
          }
        } catch (cloudError) {
          console.error('Gagal sinkronisasi cloud:', cloudError);
          showToast(`Invoice disimpan lokal. Gagal ke Cloud: ${cloudError instanceof Error ? cloudError.message : String(cloudError)}`, 'error');
        }
      } else {
        showToast('Invoice berhasil disimpan di lokal!', 'success');
      }

      resetInvoice();
      setWaInput('');
    } catch (error) {
      console.error(error);
      showToast(`Gagal menyimpan: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const renderAccordionSection = (index: number, title: string, component: React.ReactNode) => {
    const isOpen = expandedSection === index;
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)', marginBottom: '4px' }}>
        <button
          type="button"
          onClick={() => setExpandedSection(isOpen ? null : index)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: isOpen ? 'var(--bg-panel)' : 'transparent',
            border: 'none',
            color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: '700',
            textAlign: 'left',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            outline: 'none'
          }}
        >
          <span>{title}</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            {component}
          </div>
        )}
      </div>
    );
  };

  const showGlobalAdditions = !activeProfile?.tableColumns?.some(col => col.key === 'item_shipping_cost');

  return (
    <div className="invoice-generator" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {editingInvoiceId ? '📝 Edit Invoice' : 'Pembuat Invoice'}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' }}>
        {/* Section 1: Jenis & Metadata Invoice */}
        {renderAccordionSection(1, '📄 Jenis & Metadata Invoice', (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Profil / Jenis Invoice</label>
              <select
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
                value={activeProfileId}
                onChange={(e) => setActiveProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>No. Invoice</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="Contoh: RA.01/11/06/2026"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Tanggal Invoice</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  placeholder="Contoh: 11 Juni 2026"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Hal (Perihal)</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={invoiceHal}
                  onChange={(e) => setInvoiceHal(e.target.value)}
                  placeholder="Perihal Invoice"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Lampiran</label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  value={invoiceLampiran}
                  onChange={(e) => setInvoiceLampiran(e.target.value)}
                  placeholder="-"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Status Akhir Pembayaran</label>
                <select
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="LUNAS">LUNAS</option>
                  <option value="BELUM LUNAS">BELUM LUNAS</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              {activeProfile?.showSpesifikasi && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Spesifikasi & Fasilitas</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                    value={spesifikasiFasilitas}
                    onChange={(e) => setSpesifikasiFasilitas(e.target.value)}
                    placeholder="Sesuai poster paket yang diambil"
                  />
                </div>
              )}
            </div>
          </>
        ))}

        {/* Section 2: Data Pelanggan */}
        {renderAccordionSection(2, '💬 Data Pelanggan', (
          <>
            <textarea
              style={{ width: '100%', minHeight: '80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', resize: 'vertical', marginBottom: '8px' }}
              placeholder="Tempel teks chat WhatsApp di sini..."
              value={waInput}
              onChange={(e) => setWaInput(e.target.value)}
              rows={3}
            />
            <button className="btn-secondary" onClick={handleParseWA} style={{ marginBottom: '16px' }}>
              ✨ Parse Otomatis
            </button>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={customer.name || ''}
                onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nama Pelanggan"
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>No. WhatsApp</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={customer.wa_number || ''}
                onChange={(e) => setCustomer(prev => ({ ...prev, wa_number: e.target.value }))}
                placeholder="08123456789"
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Alamat</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={customer.address || ''}
                onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Alamat Pengiriman"
              />
            </div>
          </>
        ))}

        {/* Section 3: Rincian Item */}
        {renderAccordionSection(3, '📦 Rincian Item', (
          <>
            {/* Input Form Item */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Layanan / Karya</label>
                  <input
                    list="services-datalist"
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={customTitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomTitle(val);
                      
                      // Periksa jika input cocok dengan salah satu layanan master
                      const matchedService = services.find(s => s.name === val);
                      if (matchedService) {
                        setSelectedServiceIdState(String(matchedService.id));
                        setDynamicInputs(prev => ({
                          ...prev,
                          price: matchedService.price
                        }));
                      } else {
                        setSelectedServiceIdState('');
                      }
                    }}
                    placeholder="Ketik nama layanan / karya atau pilih dari Master Layanan..."
                  />
                  <datalist id="services-datalist">
                    {services.map((service) => (
                      <option key={service.id} value={service.name}>
                        Tarif: Rp {new Intl.NumberFormat('id-ID').format(service.price)}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {getRequiredFields().map((field) => {
                  if (field.key === 'item_title') return null;

                  return (
                    <div key={field.key} style={{ flex: field.key === 'copyright_holder' ? 2 : 1, minWidth: '110px' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>{field.label}</label>
                      <input
                        type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
                        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                        value={dynamicInputs[field.key] !== undefined ? dynamicInputs[field.key] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDynamicInputs(prev => ({
                            ...prev,
                            [field.key]: field.type === 'number' || field.type === 'currency' ? (parseFloat(val) || 0) : val
                          }));
                        }}
                        placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                        min={field.key === 'quantity' ? "1" : undefined}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Tombol Tambah — full width di bawah form */}
              <button
                className="btn-primary"
                onClick={handleAddItem}
                style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', marginTop: '4px' }}
              >
                + Tambah Item
              </button>
            </div>

            {/* List Item */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <span style={{ fontWeight: '600', width: '20px', color: 'var(--text-secondary)' }}>{index + 1}.</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>"{item.item_title}"</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {/* Tampilkan ringkasan item berdasarkan kolom yang aktif secara dinamis */}
                      {activeProfile?.tableColumns?.filter(col => col.type !== 'formula' && col.key !== 'item_title').map(col => {
                        const val = item[col.key];
                        if (val === undefined || val === null || val === '') return null;
                        const displayVal = col.type === 'currency' ? `Rp ${formatPrice(Number(val))}` : String(val);
                        return `${col.label}: ${displayVal}`;
                      }).filter(Boolean).join(' | ')}
                    </div>
                  </div>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)', minWidth: '100px', textAlign: 'right' }}>
                    Rp {formatPrice(calculateItemTotal(item))}
                  </span>
                  <button className="btn-danger" onClick={() => removeItem(index)} style={{ padding: '6px 10px', borderRadius: '6px' }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </>
        ))}

        {/* Section 4: Biaya Tambahan (Global) */}
        {showGlobalAdditions && renderAccordionSection(4, '💰 Biaya Tambahan (Global)', (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Ongkos Kirim</label>
              <input
                type="number"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Biaya Admin</label>
              <input
                type="number"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={adminFee}
                onChange={(e) => setAdminFee(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </>
        ))}


      </div>

      {/* Aksi Utama */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveInvoice}>
          {editingInvoiceId ? '💾 Perbarui & Catat' : '💾 Simpan & Catat'}
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { resetInvoice(); setWaInput(''); }}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
};

export default InvoiceGenerator;

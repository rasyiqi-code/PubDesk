import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';
import { MetadataSection } from './generator-sections/MetadataSection';
import { CustomerSection } from './generator-sections/CustomerSection';
import { ItemsSection } from './generator-sections/ItemsSection';
import { GlobalCostsSection } from './generator-sections/GlobalCostsSection';

const InvoiceGenerator: React.FC = () => {
  const { addInvoice, updateInvoice, showToast, rightPanelVisible, invoices, contacts, addContact, updateContact } = useAppContext();
  const { addFile, updateFile, files } = useFileState();
  const { penulis, addPenulis, updatePenulis } = useDataMasterContext();
  const {
    customer,
    items,
    shippingCost,
    adminFee,
    invoiceType,
    invoiceNo,
    setInvoiceNo,
    invoiceHal,
    invoiceLampiran,
    invoiceDate,
    paymentStatus,
    spesifikasiFasilitas,
    calculateItemTotal,
    resetInvoice,
    activeProfile,
    editingInvoiceId
  } = useInvoiceContext();

  const [expandedSection, setExpandedSection] = useState<number | null>(1);

  // Auto-generate nomor invoice secara dinamis berdasarkan format profil aktif
  useEffect(() => {
    if (!editingInvoiceId) {
      const format = activeProfile?.invoiceNoFormat || 'KBM/{year}/{month}/{day}/{seq}';
      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const seq = String(invoices.length + 1).padStart(4, '0');

      const generatedNo = format
        .replace(/{year}/g, year)
        .replace(/{month}/g, month)
        .replace(/{day}/g, day)
        .replace(/{seq}/g, seq);

      setInvoiceNo(generatedNo);
    }
  }, [invoices.length, activeProfile, setInvoiceNo, editingInvoiceId]);

  const handleSaveInvoice = async () => {
    if (!customer.name) {
      showToast('Nama pelanggan harus diisi!', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Item pesanan tidak boleh kosong!', 'error');
      return;
    }

    const isPenulis = customer.isPenulis;
    let contactId: number | undefined = undefined;
    const customerNameTrimmed = customer.name.trim();

    if (isPenulis) {
      // Auto-save/update ke tabel Penulis (CRM)
      const existingPenulis = penulis.find(p => p.name.toLowerCase() === customerNameTrimmed.toLowerCase());
      if (!existingPenulis) {
        try {
          await addPenulis({
            name: customerNameTrimmed,
            wa_number: customer.wa_number?.trim() || '',
            email: customer.email?.trim() || '',
            address: customer.address?.trim() || '',
            data_source: 'Invoice',
            email_valid: 0,
            wa_valid: 0
          });
        } catch (err) {
          console.error('Gagal menyimpan penulis baru secara otomatis:', err);
        }
      } else {
        const hasWaChanged = (customer.wa_number?.trim() || '') !== (existingPenulis.wa_number || '');
        const hasEmailChanged = (customer.email?.trim() || '') !== (existingPenulis.email || '');
        const hasAddressChanged = (customer.address?.trim() || '') !== (existingPenulis.address || '');
        if (hasWaChanged || hasEmailChanged || hasAddressChanged) {
          try {
            await updatePenulis({
              ...existingPenulis,
              wa_number: customer.wa_number?.trim() || existingPenulis.wa_number,
              email: customer.email?.trim() || existingPenulis.email,
              address: customer.address?.trim() || existingPenulis.address
            });
          } catch (err) {
            console.error('Gagal memperbarui data penulis secara otomatis:', err);
          }
        }
      }
      // Kita biarkan contactId undefined jika penulis, karena customer_id di tabel invoices merujuk pada tabel contacts.
      // Opsional: kita bisa tetap sinkron ke tabel contacts sebagai cache. Tapi untuk saat ini biarkan null sesuai plan.
    } else {
      // Auto-save/update pelanggan ke database SQLite tabel contacts saat invoice disimpan
      const existingContact = contacts.find(c => c.type === 'customer' && c.name.toLowerCase() === customerNameTrimmed.toLowerCase());
      contactId = existingContact?.id;

      if (!existingContact) {
        try {
          contactId = await addContact({
            name: customerNameTrimmed,
            wa_number: customer.wa_number?.trim() || undefined,
            email: customer.email?.trim() || undefined,
            address: customer.address?.trim() || undefined,
            type: 'customer',
            created_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('Gagal menyimpan pelanggan baru secara otomatis:', err);
        }
      } else {
        const hasWaChanged = (customer.wa_number?.trim() || '') !== (existingContact.wa_number || '');
        const hasEmailChanged = (customer.email?.trim() || '') !== (existingContact.email || '');
        const hasAddressChanged = (customer.address?.trim() || '') !== (existingContact.address || '');
        if (hasWaChanged || hasEmailChanged || hasAddressChanged) {
          try {
            await updateContact({
              ...existingContact,
              wa_number: customer.wa_number?.trim() || existingContact.wa_number,
              email: customer.email?.trim() || existingContact.email,
              address: customer.address?.trim() || existingContact.address
            });
          } catch (err) {
            console.error('Gagal memperbarui data kontak secara otomatis:', err);
          }
        }
      }
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
      customerName: customerNameTrimmed,
      customerWa: customer.wa_number || '',
      customerEmail: customer.email || '',
      customerAddress: customer.address || '',
      isPenulis
    };

    const invoiceData = {
      id: editingInvoiceId || undefined,
      created_at: new Date().toISOString(),
      customer_id: contactId || null,
      items_json: JSON.stringify(items),
      shipping_cost: shippingCost,
      admin_fee: adminFee,
      total,
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
    } catch (error) {
      console.error(error);
      showToast(`Gagal menyimpan: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const showGlobalAdditions = !activeProfile?.tableColumns?.some(col => col.key === 'item_shipping_cost');

  return (
    <div className="invoice-generator" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
        {editingInvoiceId ? '📝 Edit Invoice' : 'Pembuat Invoice'}
      </h1>

      <Accordion>
        <AccordionSection index={1} title="📄 Jenis & Metadata Invoice" expandedSection={expandedSection} onToggle={setExpandedSection}>
          <MetadataSection rightPanelVisible={rightPanelVisible} />
        </AccordionSection>

        <AccordionSection index={2} title="💬 Data Pelanggan" expandedSection={expandedSection} onToggle={setExpandedSection}>
          <CustomerSection />
        </AccordionSection>

        <AccordionSection index={3} title="📦 Rincian Item" expandedSection={expandedSection} onToggle={setExpandedSection}>
          <ItemsSection />
        </AccordionSection>

        {showGlobalAdditions && (
          <AccordionSection index={4} title="💰 Biaya Tambahan (Global)" expandedSection={expandedSection} onToggle={setExpandedSection}>
            <GlobalCostsSection />
          </AccordionSection>
        )}
      </Accordion>

      {/* Aksi Utama */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveInvoice}>
          {editingInvoiceId ? '💾 Perbarui & Catat' : '💾 Simpan & Catat'}
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => resetInvoice()}>
          🔄 Reset
        </button>
      </div>
    </div>
  );
};

export default InvoiceGenerator;

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useFileState } from '../../contexts/FileContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';
import { MetadataSection } from './generator-sections/MetadataSection';
import { CustomerSection } from './generator-sections/CustomerSection';
import { ItemsSection } from './generator-sections/ItemsSection';
import { GlobalCostsSection } from './generator-sections/GlobalCostsSection';

const InvoiceGenerator: React.FC = () => {
  const { addInvoice, updateInvoice, showToast, rightPanelVisible, invoices } = useAppContext();
  const { addFile, updateFile, files } = useFileState();
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
    } catch (error) {
      console.error(error);
      showToast(`Gagal menyimpan: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const showGlobalAdditions = !activeProfile?.tableColumns?.some(col => col.key === 'item_shipping_cost');

  return (
    <div className="invoice-generator" style={{ padding: '20px' }}>
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

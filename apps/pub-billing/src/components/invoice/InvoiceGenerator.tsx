import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { Accordion, AccordionSection } from '../../ui/molecules/Accordion';
import { MetadataSection } from './generator-sections/MetadataSection';
import { CustomerSection } from './generator-sections/CustomerSection';
import { ItemsSection } from './generator-sections/ItemsSection';
import { GlobalCostsSection } from './generator-sections/GlobalCostsSection';
import InvoicePreview from './InvoicePreview';

const InvoiceGenerator: React.FC = () => {
  const { addInvoice, updateInvoice, showToast, rightPanelVisible, invoices, contacts, addContact, updateContact, setActiveModule } = useAppContext();
  const { loadPenulis } = useDataMasterContext();
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

    // Cari kontak secara global berdasarkan nama (tanpa menyaring berdasarkan tipe)
    const existingContact = contacts.find(c => c.name.toLowerCase() === customerNameTrimmed.toLowerCase());

    if (existingContact) {
      contactId = existingContact.id;
      
      // Tentukan tipe baru jika peran bertambah
      let newType = existingContact.type;
      if (isPenulis) {
        if (existingContact.type === 'customer') {
          newType = 'both';
        }
      } else {
        if (existingContact.type === 'penulis') {
          newType = 'both';
        }
      }

      const hasWaChanged = (customer.wa_number?.trim() || '') !== (existingContact.wa_number || '');
      const hasEmailChanged = (customer.email?.trim() || '') !== (existingContact.email || '');
      const hasAddressChanged = (customer.address?.trim() || '') !== (existingContact.address || '');
      const hasTypeChanged = newType !== existingContact.type;

      if (hasWaChanged || hasEmailChanged || hasAddressChanged || hasTypeChanged) {
        try {
          await updateContact({
            ...existingContact,
            wa_number: customer.wa_number?.trim() || existingContact.wa_number,
            email: customer.email?.trim() || existingContact.email,
            address: customer.address?.trim() || existingContact.address,
            type: newType
          });
          // Refresh data master penulis jika tipenya berubah menjadi penulis/both
          if (newType === 'both' || newType === 'penulis') {
            await loadPenulis();
          }
        } catch (err) {
          console.error('Gagal memperbarui data kontak secara otomatis:', err);
        }
      }
    } else {
      // Jika tidak ditemukan, buat kontak baru
      try {
        if (isPenulis) {
          contactId = await addPenulis({
            name: customerNameTrimmed,
            wa_number: customer.wa_number?.trim() || '',
            email: customer.email?.trim() || '',
            address: customer.address?.trim() || '',
            data_source: 'Invoice',
            email_valid: 0,
            wa_valid: 0
          });
        } else {
          contactId = await addContact({
            name: customerNameTrimmed,
            wa_number: customer.wa_number?.trim() || undefined,
            email: customer.email?.trim() || undefined,
            address: customer.address?.trim() || undefined,
            type: 'customer',
            needs_review: 1,
            created_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Gagal menyimpan pelanggan baru secara otomatis:', err);
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

    const customerSnapshot = JSON.stringify({
      name: customerNameTrimmed,
      wa_number: customer.wa_number || '',
      email: customer.email || '',
      address: customer.address || '',
      isPenulis
    });

    const invoiceData = {
      id: editingInvoiceId || undefined,
      created_at: new Date().toISOString(),
      customer_id: contactId || null,
      items_json: JSON.stringify(items),
      shipping_cost: shippingCost,
      admin_fee: adminFee,
      total,
      export_format: invoiceType,
      file_path: JSON.stringify(metadata),
      customer_snapshot: customerSnapshot,
      payment_status: paymentStatus
    };

    try {
      let invoiceId = editingInvoiceId;
      if (editingInvoiceId) {
        await updateInvoice(invoiceData as any);
        showToast('Invoice berhasil diperbarui secara lokal!', 'success');
      } else {
        invoiceId = await addInvoice(invoiceData as any);
      }

      // Coba kirim data ke Google Apps Script (Cloud Sheets)
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
            id_invoice: invoiceId,
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
          const cloudResult = await googleAppsScriptService.sendInvoiceToCloud(gasPayload, []);

          if (cloudResult.success) {
            try {
              const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveModule('home')}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '6px 10px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-card)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-panel)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          🏠 Beranda
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          {editingInvoiceId ? '📝 Edit Invoice' : 'Pembuat Invoice'}
        </h1>
      </div>

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
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveInvoice}>
          {editingInvoiceId ? '💾 Perbarui & Catat' : '💾 Simpan & Catat'}
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => resetInvoice()}>
          🔄 Reset
        </button>
      </div>

      {/* Container pratinjau tersembunyi untuk kepentingan ekspor PDF (terhindar dari issue panel kanan tertutup) */}
      {/*
        Ukuran container 635x882 mengakomodasi padding 20px dari panelRef InvoicePreview
        sehingga A4 div (595x842) pas muat tanpa overflow/negative offset,
        mencegah clipping 20px kiri/atas oleh html2canvas.
      */}
      <div style={{ position: 'fixed', top: '-9999px', left: 0, width: '635px', height: '882px', overflow: 'hidden', pointerEvents: 'none', zIndex: -9999 }}>
        <InvoicePreview id="invoice-preview-export" />
      </div>
    </div>
  );
};

export default InvoiceGenerator;

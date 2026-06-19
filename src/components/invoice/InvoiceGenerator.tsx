import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useInvoiceContext } from '../../contexts/InvoiceContext';
import { Book, InvoiceItem } from '../../types';

const InvoiceGenerator: React.FC = () => {
  const { books, addBook, addInvoice, addFile, showToast } = useAppContext();
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
    activeProfile
  } = useInvoiceContext();

  const [waInput, setWaInput] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');

  // States for the add item form
  const [customTitle, setCustomTitle] = useState('');
  const [itemPrice, setItemPrice] = useState(0);
  const [itemQty, setItemQty] = useState(1);
  const [pagesInput, setPagesInput] = useState('± 160 hal A5');
  const [paperTypeInput, setPaperTypeInput] = useState('Cetak BW');
  const [copyrightHolderInput, setCopyrightHolderInput] = useState('');
  const [itemShippingCostInput, setItemShippingCostInput] = useState(75000);
  const [packageNameInput, setPackageNameInput] = useState('Paket Gold');

  const [showBookModal, setShowBookModal] = useState(false);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    regular_price: 0,
    po_price: 0,
    weight_grams: 0
  });

  // Dynamically set default values when activeProfile changes
  useEffect(() => {
    if (!activeProfile) return;
    
    const type = activeProfile.tableType;
    if (type === 'kbm_cetak') {
      setPagesInput('± 160 hal A5');
      setPaperTypeInput('Cetak BW');
      setItemQty(20);
      setItemPrice(20100);
      setItemShippingCostInput(75000);
    } else if (type === 'kbm_creator') {
      setCopyrightHolderInput(customer.name || '');
      setItemPrice(350000);
    } else if (type === 'spt_mitra') {
      setPagesInput('± 144 hal A4');
      setPaperTypeInput('Cetak BW');
      setItemQty(5);
      setPackageNameInput('Paket Gold');
      setItemPrice(905250);
    }
  }, [activeProfile]);

  // Sync copyright holder input with customer name if empty
  useEffect(() => {
    if (invoiceType === 'kbm_creator' && !copyrightHolderInput && customer.name) {
      setCopyrightHolderInput(customer.name);
    }
  }, [customer.name, invoiceType]);

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
    let finalPrice = itemPrice;

    if (selectedBookId) {
      const book = books.find((b) => b.id === parseInt(selectedBookId));
      if (book) {
        if (!finalTitle) finalTitle = book.title;
        if (finalPrice === 0) {
          finalPrice = book.po_price || book.regular_price || 0;
        }
      }
    }

    if (!finalTitle) {
      alert('Judul buku atau karya harus diisi!');
      return;
    }

    const newItem: InvoiceItem = {
      book_id: selectedBookId ? parseInt(selectedBookId) : 0,
      book_title: finalTitle,
      quantity: itemQty,
      price: finalPrice,
      discount: 0,
      pages: invoiceType !== 'kbm_creator' ? pagesInput : undefined,
      paper_type: invoiceType !== 'kbm_creator' ? paperTypeInput : undefined,
      copyright_holder: invoiceType === 'kbm_creator' ? copyrightHolderInput || customer.name || '' : undefined,
      item_shipping_cost: invoiceType === 'kbm_cetak' ? itemShippingCostInput : undefined,
      package_name: invoiceType === 'spt_mitra' ? packageNameInput : undefined
    };

    addItem(newItem);

    // Reset form item (keep default based on type)
    setCustomTitle('');
    setSelectedBookId('');
    if (invoiceType === 'kbm_cetak') {
      setItemQty(20);
      setItemPrice(20100);
      setItemShippingCostInput(75000);
    } else if (invoiceType === 'kbm_creator') {
      setItemPrice(350000);
    } else if (invoiceType === 'spt_mitra') {
      setItemQty(5);
      setItemPrice(905250);
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
    const globalShip = invoiceType === 'kbm_cetak' ? 0 : shippingCost;
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
      items_json: JSON.stringify(items),
      shipping_cost: shippingCost,
      admin_fee: adminFee,
      total,
      created_at: new Date().toISOString(),
      export_format: invoiceType,
      file_path: JSON.stringify(metadata)
    };

    try {
      const invoiceId = await addInvoice(invoiceData);

      // Simpan berkas ke tabel files untuk modul Smart Folders
      const fileData = {
        filename: `Invoice-${invoiceNo || 'DRAF'}.pdf`,
        path: `invoices/Invoice-${invoiceNo ? invoiceNo.replace(/\//g, '_') : 'DRAF'}-${Date.now()}.pdf`,
        type: 'invoice',
        project_id: invoiceId,
        status: 'Tersimpan',
        last_modified: new Date().toISOString(),
        is_readonly: false
      };

      await addFile(fileData);
      showToast('Invoice berhasil disimpan dan dicatat ke Smart Folders!', 'success');
      resetInvoice();
      setWaInput('');
    } catch (error) {
      console.error(error);
      showToast(`Gagal menyimpan: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.regular_price || !newBook.po_price) return;

    await addBook(newBook as Book);
    setShowBookModal(false);
    setNewBook({
      title: '',
      regular_price: 0,
      po_price: 0,
      weight_grams: 0
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  return (
    <div className="invoice-generator" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-primary)' }}>Pembuat Invoice</h1>

      {/* Jenis & Metadata Invoice */}
      <div style={{ marginBottom: '24px', background: 'var(--bg-panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>📄 Jenis & Metadata Invoice</h2>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
          {invoiceType === 'spt_mitra' && (
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
      </div>

      {/* Data Pelanggan */}
      <div style={{ marginBottom: '24px', background: 'var(--bg-panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>💬 Data Pelanggan</h2>
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
      </div>

      {/* Rincian Item */}
      <div style={{ marginBottom: '24px', background: 'var(--bg-panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>📦 Rincian Item</h2>
          <button className="btn-success" onClick={() => setShowBookModal(true)}>
            ➕ Data Master Buku
          </button>
        </div>

        {/* Input Form Item */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Pilih dari Buku Master</label>
              <select
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: '14px' }}
                value={selectedBookId}
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  if (e.target.value) {
                    const book = books.find(b => b.id === parseInt(e.target.value));
                    if (book) {
                      setCustomTitle(book.title);
                      if (invoiceType === 'kbm_cetak') {
                        setItemPrice(book.po_price || book.regular_price || 20100);
                      } else {
                        setItemPrice(book.po_price || book.regular_price || 0);
                      }
                    }
                  }
                }}
              >
                <option value="">-- Kustom / Ketik Sendiri --</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} (PO: {new Intl.NumberFormat('id-ID').format(book.po_price)})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 3, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Judul Buku / Karya</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ketik judul buku atau karya di sini..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {invoiceType === 'kbm_cetak' && (
              <>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Halaman</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={pagesInput}
                    onChange={(e) => setPagesInput(e.target.value)}
                    placeholder="Contoh: ± 160 hal A5"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Jenis Naskah</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={paperTypeInput}
                    onChange={(e) => setPaperTypeInput(e.target.value)}
                    placeholder="Contoh: Cetak BW"
                  />
                </div>
                <div style={{ width: '90px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Jml. Cetak</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div style={{ flex: 1.2, minWidth: '120px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Cetak/pcs (Rp)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Harga pcs"
                  />
                </div>
                <div style={{ flex: 1.2, minWidth: '120px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Ongkir Item (Rp)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={itemShippingCostInput}
                    onChange={(e) => setItemShippingCostInput(parseFloat(e.target.value) || 0)}
                    placeholder="Ongkir"
                  />
                </div>
              </>
            )}

            {invoiceType === 'kbm_creator' && (
              <>
                <div style={{ flex: 2, minWidth: '180px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Pemegang Hak Cipta</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={copyrightHolderInput}
                    onChange={(e) => setCopyrightHolderInput(e.target.value)}
                    placeholder="Nama Pemegang Hak Cipta"
                  />
                </div>
                <div style={{ flex: 1.5, minWidth: '130px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Total Biaya (Rp)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Total Biaya"
                  />
                </div>
              </>
            )}

            {invoiceType === 'spt_mitra' && (
              <>
                <div style={{ flex: 1, minWidth: '90px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Halaman</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={pagesInput}
                    onChange={(e) => setPagesInput(e.target.value)}
                    placeholder="Contoh: ± 144 hal A4"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '95px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Jenis Naskah</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={paperTypeInput}
                    onChange={(e) => setPaperTypeInput(e.target.value)}
                    placeholder="Contoh: Cetak BW"
                  />
                </div>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Jml (Pcs)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={itemQty}
                    onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
                <div style={{ flex: 1.2, minWidth: '110px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Paket</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={packageNameInput}
                    onChange={(e) => setPackageNameInput(e.target.value)}
                    placeholder="Contoh: Paket Gold"
                  />
                </div>
                <div style={{ flex: 1.5, minWidth: '120px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Harga Paket (Rp)</label>
                  <input
                    type="number"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Harga Paket"
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn-primary" onClick={handleAddItem} style={{ height: '42px' }}>
                + Tambah
              </button>
            </div>
          </div>
        </div>

        {/* List Item */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', width: '20px', color: 'var(--text-secondary)' }}>{index + 1}.</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>"{item.book_title}"</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {invoiceType === 'kbm_cetak' && `Hal: ${item.pages} | Naskah: ${item.paper_type} | Qty: ${item.quantity} pcs | Cetak/pcs: Rp ${formatPrice(item.price)} | Ongkir: Rp ${formatPrice(item.item_shipping_cost || 0)}`}
                  {invoiceType === 'kbm_creator' && `HAKI: ${item.copyright_holder || '-'} | Biaya: Rp ${formatPrice(item.price)}`}
                  {invoiceType === 'spt_mitra' && `Hal: ${item.pages} | Naskah: ${item.paper_type} | Qty: ${item.quantity} pcs (${item.package_name}) | Paket: Rp ${formatPrice(item.price)}`}
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
      </div>

      {/* Biaya Tambahan (Global) */}
      {invoiceType !== 'kbm_cetak' && (
        <div style={{ marginBottom: '24px', background: 'var(--bg-panel)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>💰 Biaya Tambahan (Global)</h2>
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
        </div>
      )}

      {/* Aksi Utama */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveInvoice}>
          💾 Simpan & Catat
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { resetInvoice(); setWaInput(''); }}>
          🔄 Reset
        </button>
      </div>

      {showBookModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowBookModal(false)}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '24px', minWidth: '400px', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>Tambah Buku Master</h2>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowBookModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Judul Buku</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Judul Buku"
                />
              </div>
              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  value={newBook.isbn || ''}
                  onChange={(e) => setNewBook((prev) => ({ ...prev, isbn: e.target.value }))}
                  placeholder="978-602-8567-12-3"
                />
              </div>
              <div className="form-group">
                <label>Harga Reguler</label>
                <input
                  type="number"
                  value={newBook.regular_price}
                  onChange={(e) => setNewBook((prev) => ({ ...prev, regular_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="50000"
                />
              </div>
              <div className="form-group">
                <label>Harga PO</label>
                <input
                  type="number"
                  value={newBook.po_price}
                  onChange={(e) => setNewBook((prev) => ({ ...prev, po_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="35000"
                />
              </div>
              <div className="form-group">
                <label>Berat (gram)</label>
                <input
                  type="number"
                  value={newBook.weight_grams}
                  onChange={(e) => setNewBook((prev) => ({ ...prev, weight_grams: parseInt(e.target.value) || 0 }))}
                  placeholder="200"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleAddBook}>
                Simpan
              </button>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowBookModal(false)}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;

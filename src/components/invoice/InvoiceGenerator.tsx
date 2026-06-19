import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Book, InvoiceItem } from '../../types';

const InvoiceGenerator: React.FC = () => {
  const { books, addBook, addInvoice } = useAppContext();
  const [waInput, setWaInput] = useState('');
  const [customer, setCustomer] = useState<{ name?: string; wa_number?: string; address?: string }>({});
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemDiscount, setItemDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [showBookModal, setShowBookModal] = useState(false);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    regular_price: 0,
    po_price: 0,
    weight_grams: 0
  });

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

    if (name) setCustomer((prev) => ({ ...prev, name }));
    if (wa_number) setCustomer((prev) => ({ ...prev, wa_number }));
    if (address) setCustomer((prev) => ({ ...prev, address }));
  };

  const handleAddItem = () => {
    if (!selectedBookId) return;
    const book = books.find((b) => b.id === parseInt(selectedBookId));
    if (!book) return;

    const basePrice = book.po_price || book.regular_price || 0;
    const priceAfterDiscount = Math.max(0, basePrice - itemDiscount);

    const newItem: InvoiceItem = {
      book_id: book.id || 0,
      book_title: book.title,
      quantity: itemQty,
      price: priceAfterDiscount,
      discount: itemDiscount
    };

    setItems((prev) => [...prev, newItem]);
    setSelectedBookId('');
    setItemQty(1);
    setItemDiscount(0);
  };

  const updateItem = (index: number, updated: Partial<InvoiceItem>) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            ...updated
          };
        }
        return item;
      })
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const resetInvoice = () => {
    setCustomer({});
    setItems([]);
    setShippingCost(0);
    setAdminFee(0);
    setWaInput('');
  };

  const handleSaveInvoice = async () => {
    if (!customer.name) {
      alert('Nama pelanggan harus diisi!');
      return;
    }
    if (items.length === 0) {
      alert('Item pesanan tidak boleh kosong!');
      return;
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingCost + adminFee;

    const invoiceData = {
      items_json: JSON.stringify(items),
      shipping_cost: shippingCost,
      admin_fee: adminFee,
      total,
      created_at: new Date().toISOString()
    };

    try {
      await addInvoice(invoiceData);
      alert('Invoice berhasil disimpan dan dicatat!');
      resetInvoice();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan invoice.');
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

  return (
    <div className="invoice-generator" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-primary)' }}>Invoice Generator</h1>
      
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>💬 Data Pelanggan</h2>
        <textarea
          style={{ width: '100%', minHeight: '80px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', color: 'var(--text-primary)', resize: 'vertical', marginBottom: '8px' }}
          placeholder="Tempel chat WhatsApp di sini..."
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

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>📦 Item Pesanan</h2>
          <button className="btn-success" onClick={() => setShowBookModal(true)}>
            ➕ Tambah Buku
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <select
            style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
          >
            <option value="">Pilih Buku</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} (PO: {new Intl.NumberFormat('id-ID').format(book.po_price)})
              </option>
            ))}
          </select>
          <input
            type="number"
            style={{ width: '100px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
            placeholder="Qty"
            value={itemQty}
            onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
            min="1"
          />
          <input
            type="number"
            style={{ width: '100px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '14px' }}
            placeholder="Diskon"
            value={itemDiscount}
            onChange={(e) => setItemDiscount(parseInt(e.target.value) || 0)}
            min="0"
          />
          <button className="btn-primary" onClick={handleAddItem}>
            + Tambah
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ flex: 1 }}>{item.book_title}</span>
              <input
                type="number"
                style={{ width: '80px', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-panel)', color: 'var(--text-primary)', fontSize: '14px' }}
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
              />
              <span>x</span>
              <span style={{ minWidth: '100px', textAlign: 'right' }}>{new Intl.NumberFormat('id-ID').format(item.price)}</span>
              <button className="btn-danger" onClick={() => removeItem(index)} style={{ padding: '6px 12px' }}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>💰 Biaya Tambahan</h2>
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

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveInvoice}>
          💾 Simpan & Catat
        </button>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={resetInvoice}>
          🔄 Reset
        </button>
      </div>

      {showBookModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowBookModal(false)}>
          <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '24px', minWidth: '400px', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--text-primary)' }}>Tambah Buku</h2>
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

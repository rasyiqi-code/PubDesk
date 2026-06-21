import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { formatPrice } from '../../utils/format';
import { Book } from '../../types/book.types';
import { TableEmptyState } from '../../ui/molecules/EmptyState';
import { Button } from '../../ui/atoms/Button';
import { TextField } from '../../ui/atoms/TextField';

const BookManager: React.FC = () => {
  const { books, addBook, updateBook, deleteBook, showToast, selectedBookId, setSelectedBookId, addFile, files, showConfirm } = useAppContext();

  // State untuk form input tambah / edit
  const [isEditing, setIsEditing] = useState(false);
  const [currentBookId, setCurrentBookId] = useState<number | null>(null);
  
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [poPrice, setPoPrice] = useState<number>(0);
  const [weightGrams, setWeightGrams] = useState<number>(0);
  const [coverPath, setCoverPath] = useState<string>('');

  // Fungsi reset form
  const resetForm = () => {
    setIsEditing(false);
    setCurrentBookId(null);
    setTitle('');
    setIsbn('');
    setRegularPrice(0);
    setPoPrice(0);
    setWeightGrams(0);
    setCoverPath('');
  };

  // Handler unggah cover dan konversi ke Base64
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran gambar cover maksimal 2 MB!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPath(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Mulai mode edit
  const handleStartEdit = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah bentrok dengan klik row untuk select
    setIsEditing(true);
    setCurrentBookId(book.id || null);
    setTitle(book.title);
    setIsbn(book.isbn || '');
    setRegularPrice(book.regular_price);
    setPoPrice(book.po_price);
    setWeightGrams(book.weight_grams);
    setCoverPath(book.cover_path || '');
    if (book.id) {
      setSelectedBookId(book.id);
    }
  };

  // Simpan tambah atau edit buku
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Judul buku tidak boleh kosong!', 'error');
      return;
    }

    const bookData: Book = {
      id: currentBookId || undefined,
      title: title.trim(),
      isbn: isbn.trim() || undefined,
      regular_price: regularPrice,
      po_price: poPrice,
      weight_grams: weightGrams,
      cover_path: coverPath || undefined,
    };

    try {
      let bookId = currentBookId;
      if (isEditing && currentBookId !== null) {
        await updateBook(bookData);
        showToast('Buku berhasil diperbarui!', 'success');
      } else {
        const newId = await addBook(bookData);
        bookId = newId;
        showToast('Buku baru berhasil ditambahkan!', 'success');
      }

      // Tulis file fisik JSON berisi data buku master dan daftarkan ke files untuk Smart Folder
      if (bookId) {
        const filename = `Book-${bookId}.json`;
        const bookJsonString = JSON.stringify({ ...bookData, id: bookId });
        const bytes = new TextEncoder().encode(bookJsonString);
        
        const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
        const physicalPath = await tauriInvoke<string>('create_physical_file', { 
          filename, 
          bytes: Array.from(bytes),
          folder: 'books'
        });

        // Daftarkan ke Smart Folder (tabel files) jika belum terdaftar
        const alreadyExists = files.some(f => f.filename === filename && f.type === 'book');
        if (!alreadyExists) {
          const fileData = {
            filename,
            path: physicalPath,
            type: 'book',
            project_id: undefined,
            version_label: String(bookId),
            status: 'Tersimpan',
            last_modified: new Date().toISOString(),
            is_readonly: false
          };
          await addFile(fileData);
        }
      }

      resetForm();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan buku!', 'error');
    }
  };

  // Hapus buku
  const handleDeleteBook = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah bentrok dengan klik row
    showConfirm({
      title: 'Hapus Buku',
      message: 'Apakah Anda yakin ingin menghapus buku ini?',
      confirmText: 'Hapus',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteBook(id);
          showToast('Buku berhasil dihapus!', 'success');
          if (selectedBookId === id) {
            setSelectedBookId(null);
          }
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus buku!', 'error');
        }
      }
    });
  };



  return (
    <div className="book-manager" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflow: 'auto' }}>
      
      {/* Bagian Header Modul */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          📚 Master Manajemen Buku
        </h1>
        {(isEditing || title || isbn || regularPrice || poPrice || weightGrams || coverPath) && (
          <Button variant="secondary" size="sm" onClick={resetForm}>Batal / Reset</Button>
        )}
      </div>

      {/* Form Compact & Native */}
      <form onSubmit={handleSaveBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '8px', color: 'var(--text-primary)' }}>
          {isEditing ? '✏️ Edit Rincian Buku' : '➕ Tambah Buku Baru'}
        </h2>

        {/* Input Cover dan Data Dasar */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Sisi Kiri: Unggah Sampul Buku */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '130px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center' }}>Sampul Buku</label>
            <div style={{
              width: '110px',
              height: '150px',
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: 'var(--bg-panel)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease'
            }}
            onClick={() => document.getElementById('cover-file-input')?.click()}
            >
              {coverPath ? (
                <img src={coverPath} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-secondary)' }}>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '4px' }}>📖</span>
                  <span style={{ fontSize: '10px', fontWeight: '500' }}>Pilih Gambar</span>
                </div>
              )}
            </div>
            <input
              id="cover-file-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverUpload}
            />
            {coverPath && (
              <Button variant="danger" size="sm" onClick={() => setCoverPath('')}>Hapus Sampul</Button>
            )}
          </div>

          {/* Sisi Kanan: Form Field */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '280px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <TextField label="Judul Buku" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Belajar Pemrograman Rust" required fullWidth />
              <TextField label="ISBN (Opsional)" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978-602-..." fullWidth />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <TextField label="Harga Reguler (Rp)" type="number" value={regularPrice || ''} onChange={(e) => setRegularPrice(parseFloat(e.target.value) || 0)} placeholder="0" min="0" fullWidth />
              <TextField label="Harga PO (Rp)" type="number" value={poPrice || ''} onChange={(e) => setPoPrice(parseFloat(e.target.value) || 0)} placeholder="0" min="0" fullWidth />
              <TextField label="Berat (Gram)" type="number" value={weightGrams || ''} onChange={(e) => setWeightGrams(parseInt(e.target.value) || 0)} placeholder="0" min="0" fullWidth />
            </div>

            <Button type="submit" variant="primary">{isEditing ? '💾 Simpan Perubahan' : '➕ Tambah Master Buku'}</Button>
          </div>
        </div>
      </form>

      {/* Tabel List Buku Master */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', paddingBottom: '6px', borderBottom: '1px solid var(--border)', marginBottom: '8px', color: 'var(--text-primary)' }}>
          📋 Daftar Master Buku ({books.length})
        </h2>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', color: 'var(--text-primary)', fontWeight: '600' }}>
                <th style={{ padding: '8px 12px', width: '70px', textAlign: 'center' }}>Sampul</th>
                <th style={{ padding: '8px 12px' }}>Judul Buku</th>
                <th style={{ padding: '8px 12px' }}>ISBN</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Harga Reguler</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Harga PO</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Berat (gr)</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', width: '150px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <TableEmptyState
                  colSpan={7}
                  icon="📚"
                  message="Belum ada data buku master"
                  description="Tambahkan buku baru melalui form di atas"
                />
              ) : (
                books.map((book) => {
                  const isSelected = selectedBookId === book.id;
                  return (
                    <tr
                      key={book.id}
                      onClick={() => book.id && setSelectedBookId(book.id)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(192, 28, 28, 0.08)' : 'transparent'
                      }}
                      className="table-row-hover"
                    >
                      {/* Sampul Buku Column */}
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <div style={{
                          width: '36px',
                          height: '48px',
                          borderRadius: '4px',
                          background: 'var(--bg-panel)',
                          border: '1px solid var(--border)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto'
                        }}>
                          {book.cover_path ? (
                            <img src={book.cover_path} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '18px' }}>📖</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {book.title}
                        {isSelected && <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--accent)', color: '#ffffff' }}>Terpilih</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{book.isbn || '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '500', color: 'var(--text-primary)' }}>{formatPrice(book.regular_price)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600', color: 'var(--accent)' }}>{formatPrice(book.po_price)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-secondary)' }}>{book.weight_grams} gr</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Button variant="secondary" size="sm" onClick={(e) => handleStartEdit(book, e)}>✏️ Edit</Button>
                          <Button variant="danger" size="sm" onClick={(e) => book.id && handleDeleteBook(book.id, e)}>🗑️ Hapus</Button>
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

export default BookManager;

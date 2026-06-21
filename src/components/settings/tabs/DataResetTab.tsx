import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../contexts/AppContext';
import * as XLSX from 'xlsx';
import { save } from '@tauri-apps/plugin-dialog';

const DataResetTab: React.FC = () => {
  const { showToast } = useAppContext();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [logoType, setLogoType] = useState<'emoji' | 'image'>(() => {
    const saved = localStorage.getItem('splash_logo');
    if (saved && saved.startsWith('data:image')) {
      return 'image';
    }
    return 'emoji';
  });

  const [splashLogo, setSplashLogo] = useState<string>(() => {
    return localStorage.getItem('splash_logo') || '📚';
  });

  const [publisherName, setPublisherName] = useState<string>(() => {
    return localStorage.getItem('publisher_name') || '';
  });

  const handleSaveLogo = () => {
    localStorage.setItem('splash_logo', splashLogo);
    localStorage.setItem('publisher_name', publisherName.trim());
    showToast('Kustomisasi aplikasi berhasil disimpan!', 'success');
  };

  const handleResetLogo = () => {
    setSplashLogo('📚');
    setLogoType('emoji');
    setPublisherName('');
    localStorage.setItem('splash_logo', '📚');
    localStorage.setItem('publisher_name', '');
    showToast('Kustomisasi aplikasi dikembalikan ke bawaan!', 'success');
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file gambar maksimal adalah 2MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        setSplashLogo(base64);
        setLogoType('image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const [
        naskahData,
        tasksData,
        timData,
        contactsData,
        penerbitData,
        booksData,
        invoicesData,
        servicesData,
        legalitasData
      ] = await Promise.all([
        invoke<any[]>('get_naskah').catch(() => []),
        invoke<any[]>('get_tasks').catch(() => []),
        invoke<any[]>('get_tim').catch(() => []),
        invoke<any[]>('get_contacts').catch(() => []),
        invoke<any[]>('get_penerbit').catch(() => []),
        invoke<any[]>('get_books').catch(() => []),
        invoke<any[]>('get_invoices').catch(() => []),
        invoke<any[]>('get_services').catch(() => []),
        invoke<any[]>('get_legalitas').catch(() => [])
      ]);

      const wb = XLSX.utils.book_new();

      const addSheet = (data: any[], sheetName: string) => {
        const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{}]);
        if (data.length > 0) {
          const maxLens = Object.keys(data[0] || {}).map(key => {
            return Math.max(
              key.length,
              ...data.map(row => String((row as any)[key] || '').length)
            );
          });
          ws['!cols'] = maxLens.map(len => ({ wch: Math.min(len + 3, 50) }));
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      };

      addSheet(naskahData.map((d, i) => ({
        "No": i + 1,
        "ID Code": d.naskah_id_code || '',
        "Judul Naskah": d.title || '',
        "ID Penulis": d.penulis_id || '',
        "ID Penerbit": d.penerbit_id || '',
        "Tipe Paket": d.package_type || '',
        "Tipe Order": d.order_type || '',
        "Jumlah Eksemplar": d.copies || 0,
        "Ukuran Buku": d.book_size || '',
        "Genre": d.genre || '',
        "Jumlah Halaman": d.total_pages || 0,
        "Sinopsis": d.synopsis || '',
        "Status": d.status || '',
        "Tanggal Dibuat": d.created_at || ''
      })), "Naskah");

      addSheet(tasksData.map((d, i) => ({
        "No": i + 1,
        "ID Naskah": d.naskah_id || '',
        "Nama Tahapan": d.step_name || '',
        "Urutan Tahapan": d.step_order || 0,
        "ID Tim PIC": d.assigned_team_id || '',
        "Status": d.status || '',
        "Prioritas": d.priority || '',
        "Tanggal Mulai": d.start_date || '',
        "Tenggat Waktu": d.due_date || '',
        "Tanggal Selesai": d.completed_date || '',
        "Catatan": d.notes || ''
      })), "Tugas & Alur");

      addSheet(timData.map((d, i) => ({
        "No": i + 1,
        "Nama Anggota": d.name || '',
        "Peran": d.role || '',
        "Divisi/Departemen": d.department || '',
        "Target Mingguan": d.weekly_target || 0,
        "Status": d.is_active === 1 ? 'Aktif' : 'Nonaktif',
        "Catatan": d.notes || '',
        "Tanggal Terdaftar": d.created_at || ''
      })), "Tim");

      addSheet(contactsData.map((d, i) => ({
        "No": i + 1,
        "Nama Kontak": d.name || '',
        "Nomor WA": d.wa_number || '',
        "Email": d.email || '',
        "Alamat": d.address || '',
        "Provinsi": d.province || '',
        "Kota": d.city || '',
        "Pekerjaan": d.job || '',
        "Institusi": d.institution || '',
        "Tipe": d.type || '',
        "Tanggal Terdaftar": d.created_at || ''
      })), "Kontak & Penulis");

      addSheet(penerbitData.map((d, i) => ({
        "No": i + 1,
        "Nama Penerbit": d.name || '',
        "Kota": d.city || '',
        "Provinsi": d.province || '',
        "Alamat": d.address || '',
        "Email": d.email || '',
        "Nomor WA": d.wa_number || '',
        "Instagram": d.instagram || '',
        "Facebook": d.facebook || '',
        "Status Kerjasama": d.cooperation_status || '',
        "Catatan": d.notes || '',
        "Tanggal Terdaftar": d.created_at || ''
      })), "Penerbit");

      addSheet(booksData.map((d, i) => ({
        "No": i + 1,
        "Judul Buku": d.title || '',
        "ISBN": d.isbn || '',
        "Harga Reguler": d.regular_price || 0,
        "Harga PO": d.po_price || 0,
        "Berat (gram)": d.weight_grams || 0,
        "ID Penulis": d.author_id || '',
        "Tanggal Dibuat": d.created_at || ''
      })), "Buku");

      addSheet(invoicesData.map((d, i) => ({
        "No": i + 1,
        "ID Pelanggan": d.customer_id || '',
        "ID Naskah": d.naskah_id || '',
        "Biaya Pengiriman": d.shipping_cost || 0,
        "Biaya Admin": d.admin_fee || 0,
        "Total": d.total || 0,
        "Format Ekspor": d.export_format || '',
        "Status Pembayaran": d.payment_status || '',
        "Jumlah Dibayar": d.paid_amount || 0,
        "Sisa Pembayaran": d.remaining_amount || 0,
        "Catatan Pembayaran": d.payment_notes || '',
        "Tanggal Dibuat": d.created_at || ''
      })), "Invoice");

      addSheet(servicesData.map((d, i) => ({
        "No": i + 1,
        "Nama Layanan": d.name || '',
        "Harga": d.price || 0,
        "Kategori": d.category || '',
        "Deskripsi": d.description || '',
        "Tanggal Dibuat": d.created_at || ''
      })), "Layanan");

      addSheet(legalitasData.map((d, i) => ({
        "No": i + 1,
        "ID Naskah": d.naskah_id || '',
        "Judul Buku": d.judul_buku || '',
        "Nama Penulis": d.nama_penulis || '',
        "Tipe Dokumen": d.tipe || '',
        "Nomor Dokumen": d.nomor_dokumen || '',
        "Tanggal Pengajuan": d.tanggal_pengajuan || '',
        "Tanggal Keluar": d.tanggal_keluar || '',
        "Status": d.status || '',
        "Keterangan": d.keterangan || '',
        "Tanggal Dibuat": d.created_at || ''
      })), "Legalitas");

      const filePath = await save({
        filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }],
        defaultPath: 'PubDesk_All_Data_Export.xlsx'
      });

      if (!filePath) return;

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const bytes = new Uint8Array(wbout);
      await invoke('write_binary_file', { path: filePath, bytes: Array.from(bytes) });

      showToast('Semua data berhasil diekspor ke Excel!', 'success');
    } catch (err) {
      console.error(err);
      showToast(`Gagal mengekspor data: ${err}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await invoke<string>('seed_sample_data');
      showToast(result, 'success');
    } catch (err) {
      showToast(`Gagal memuat sample data: ${err}`, 'error');
    } finally {
      setIsSeeding(false);
    }
  };


  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setIsResetting(true);
    try {
      const result = await invoke<string>('reset_workflow_data');
      showToast(result, 'success');
      setConfirmReset(false);
    } catch (err) {
      showToast(`Gagal mereset data: ${err}`, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
          Kustomisasi & Data
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0' }}>
          Kelola kustomisasi identitas aplikasi serta ekspor, pemulihan, dan pembersihan database.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', alignItems: 'start' }}>
        
        {/* Kolom Kiri: Kustomisasi Logo & Nama Penerbit */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              🎨 Logo & Nama Penerbit
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Sesuaikan logo dan nama penerbit yang tampil pada layar splash serta halaman login.
            </p>

            {/* Input Nama Penerbit */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px' }}>
                Nama Penerbit
              </label>
              <input
                type="text"
                value={publisherName}
                onChange={(e) => setPublisherName(e.target.value)}
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                placeholder="Masukkan nama penerbit (misal: KBM)"
              />
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Preview Tampil Apa Adanya */}
              <div style={{
                width: '120px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: logoType === 'emoji' ? '64px' : 'unset',
                overflow: 'hidden',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                background: 'var(--bg-panel)',
                flexShrink: 0
              }}>
                {logoType === 'emoji' ? (
                  splashLogo
                ) : (
                  <img src={splashLogo} alt="Custom Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setLogoType('emoji')}
                    style={{
                      padding: '4px 12px',
                      background: logoType === 'emoji' ? 'var(--accent)' : 'transparent',
                      color: logoType === 'emoji' ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Gunakan Emoji
                  </button>
                  <button
                    onClick={() => document.getElementById('splash-logo-file-input')?.click()}
                    style={{
                      padding: '4px 12px',
                      background: logoType === 'image' ? 'var(--accent)' : 'transparent',
                      color: logoType === 'image' ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Unggah Gambar
                  </button>
                  <input
                    type="file"
                    id="splash-logo-file-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoFileChange}
                  />
                </div>

                {logoType === 'emoji' ? (
                  <input
                    type="text"
                    value={splashLogo.startsWith('data:image') ? '📚' : splashLogo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplashLogo(val || '📚');
                    }}
                    maxLength={4}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--bg-panel)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      width: '120px'
                    }}
                    placeholder="Emoji / Teks"
                  />
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Berkas gambar kustom aktif (maks. 2MB)
                  </span>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={handleSaveLogo}
                    style={{
                      padding: '6px 16px',
                      background: '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Simpan Logo
                  </button>
                  <button
                    onClick={handleResetLogo}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Reset Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Aksi Data (Export, Seed, Reset) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Export Semua Data ke Excel */}
          <div style={{
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
                  📥 Export Semua Data ke Excel
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Ekspor seluruh data dari database (Naskah, Tugas, Tim, Kontak, Penerbit, Buku, Invoice, Layanan, dan Legalitas) 
                  ke dalam satu file Excel (.xlsx).
                </p>
              </div>
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                style={{
                  padding: '8px 20px',
                  background: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: isExporting ? 'wait' : 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  opacity: isExporting ? 0.7 : 1,
                  alignSelf: 'center'
                }}
              >
                {isExporting ? 'Mengekspor...' : 'Export ke Excel'}
              </button>
            </div>
          </div>

          {/* Muat Data Sample */}
          <div style={{
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text-primary)' }}>
                  📦 Muat Data Sample
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Menyisipkan data contoh untuk pengujian alur kerja produksi dan master data.
                </p>
              </div>
              <button
                onClick={handleSeed}
                disabled={isSeeding}
                style={{
                  padding: '8px 20px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: isSeeding ? 'wait' : 'pointer',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                  opacity: isSeeding ? 0.7 : 1,
                  alignSelf: 'center'
                }}
              >
                {isSeeding ? 'Memuat...' : 'Muat Sample'}
              </button>
            </div>
          </div>

          {/* Reset Data Workflow */}
          <div style={{
            paddingBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: confirmReset ? '#ef4444' : 'var(--text-primary)' }}>
                  🗑️ Reset Data Workflow
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Menghapus semua data tugas, riwayat, kendala, approval, dan template workflow.
                  <br />
                  <strong style={{ color: 'var(--text-primary)' }}>Data master tidak akan terhapus.</strong>
                </p>
                {confirmReset && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#ef4444', fontWeight: '600' }}>
                    ⚠️ Klik sekali lagi untuk mengonfirmasi penghapusan.
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignSelf: 'center' }}>
                {confirmReset && (
                  <button
                    onClick={() => setConfirmReset(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Batal
                  </button>
                )}
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  style={{
                    padding: '8px 20px',
                    background: confirmReset ? '#ef4444' : 'transparent',
                    color: confirmReset ? '#fff' : '#ef4444',
                    border: confirmReset ? 'none' : '1px solid #ef4444',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: isResetting ? 'wait' : 'pointer',
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    opacity: isResetting ? 0.7 : 1
                  }}
                >
                  {isResetting ? 'Menghapus...' : confirmReset ? 'Ya, Hapus Semua' : 'Reset Data'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default DataResetTab;

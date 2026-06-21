import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * Tab Pengaturan: Folder Lokal yang Dipantau.
 * Menampilkan daftar watch folders dan form untuk menambah/menghapus.
 */
const LocalFoldersTab: React.FC = () => {
  const { watchFolders, addWatchFolder, removeWatchFolder, showToast, showConfirm } = useAppContext();

  const [localPathInput, setLocalPathInput] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const selected = await open({ multiple: false, directory: true, title: 'Pilih Folder untuk Dipantau' });
      if (selected && typeof selected === 'string') {
        setLocalPathInput(selected);
      }
    } catch (err: any) {
      console.error('Error selecting directory:', err);
      showToast('Gagal membuka dialog pemilihan folder', 'error');
    }
  };

  const handleAddLocalFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localPathInput.trim()) { showToast('Path folder tidak boleh kosong!', 'error'); return; }
    setAddingFolder(true);
    try {
      const res = await addWatchFolder(localPathInput.trim());
      showToast(res, 'success');
      setLocalPathInput('');
    } catch (err: any) {
      showToast(err.message || err.toString(), 'error');
    } finally {
      setAddingFolder(false);
    }
  };

  const handleRemoveWatchFolder = (id: number, path: string) => {
    showConfirm({
      title: 'Hapus Pemantauan Folder',
      message: `Apakah Anda yakin ingin menghapus pemantauan untuk folder "${path}"? Indeks berkas di dalam folder ini akan dihapus dari aplikasi (berkas fisik tidak akan dihapus).`,
      confirmText: 'Hapus Pemantauan',
      type: 'danger',
      onConfirm: async () => {
        try {
          await removeWatchFolder(id);
          showToast('Pemantauan folder berhasil dihapus.', 'success');
        } catch (err: any) {
          showToast(err.message || err.toString(), 'error');
        }
      }
    });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', alignItems: 'start' }}>
        
        {/* Kolom Kiri: Daftar Folder Dipantau */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              📁 Folder Lokal yang Dipantau
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Berikut adalah daftar folder lokal yang sedang dipantau secara real-time.
            </p>

            {watchFolders.length === 0 ? (
              <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Belum ada folder lokal yang dipantau.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                {watchFolders.map(folder => (
                  <div key={folder.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={folder.path}>
                        {folder.path.split('/').pop() || folder.path}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={folder.path}>
                        {folder.path}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-danger compact-btn"
                      onClick={() => handleRemoveWatchFolder(folder.id!, folder.path)}
                      style={{ padding: '4px 8px', fontSize: '11px', height: '24px', cursor: 'pointer', flexShrink: 0, marginLeft: '12px' }}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Tambah Folder & Panduan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              ➕ Tambah Folder Baru
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
              Pilih folder dari sistem penyimpanan lokal komputer Anda.
            </p>
            <form onSubmit={handleAddLocalFolder} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="compact-form-group">
                <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Path Folder Absolut</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    className="compact-input"
                    placeholder="Klik Pilih Folder..."
                    value={localPathInput}
                    readOnly
                    onClick={handleSelectFolder}
                    style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
                  />
                  <button type="button" onClick={handleSelectFolder} className="btn-secondary compact-btn" style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    📂 Pilih
                  </button>
                </div>
              </div>
              <button type="submit" disabled={addingFolder || !localPathInput.trim()} className="btn-primary compact-btn" style={{ height: '36px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: '8px', fontWeight: '600' }}>
                {addingFolder ? 'Menambah...' : '➕ Tambah ke Pemantauan'}
              </button>
            </form>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>💡 Tentang Folder Dipantau:</strong>
            <ul style={{ margin: '8px 0 0 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Berkas yang terdeteksi di folder ini akan masuk ke menu <strong>Smart Folders</strong>.</li>
              <li>Aplikasi secara otomatis mendeteksi perubahan berkas (tambah/ubah/hapus).</li>
              <li>Proses indeks berjalan sepenuhnya di latar belakang secara offline-first.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LocalFoldersTab;

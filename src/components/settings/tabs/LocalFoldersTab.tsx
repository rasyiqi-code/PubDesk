import React, { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useAppContext } from '../../../contexts/AppContext';

/**
 * Tab Pengaturan: Folder Lokal yang Dipantau.
 * Menampilkan daftar watch folders dan form untuk menambah/menghapus.
 */
const LocalFoldersTab: React.FC = () => {
  const { watchFolders, addWatchFolder, removeWatchFolder, showToast, showConfirm } = useAppContext();

  const [localPathInput, setLocalPathInput] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const [customWorkDir, setCustomWorkDir] = useState<string | null>(null);

  useEffect(() => {
    invoke<string | null>('get_custom_work_dir')
      .then(dir => setCustomWorkDir(dir))
      .catch(err => console.error('Gagal mengambil folder penyimpanan:', err));
  }, []);

  const handleSelectWorkDir = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: true,
        title: 'Pilih Folder Penyimpanan Berkas Pekerjaan'
      });
      if (selected && typeof selected === 'string') {
        await invoke('set_custom_work_dir', { path: selected });
        setCustomWorkDir(selected);
        showToast('Folder penyimpanan berkas pekerjaan berhasil diubah!', 'success');
      }
    } catch (err: any) {
      console.error('Error selecting work directory:', err);
      showToast('Gagal mengubah folder penyimpanan: ' + err.toString(), 'error');
    }
  };

  const handleResetWorkDir = async () => {
    try {
      await invoke('set_custom_work_dir', { path: null });
      setCustomWorkDir(null);
      showToast('Folder penyimpanan dikembalikan ke bawaan sistem!', 'success');
    } catch (err: any) {
      console.error('Error resetting work directory:', err);
      showToast('Gagal mereset folder penyimpanan: ' + err.toString(), 'error');
    }
  };

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
          {/* Section: Folder Penyimpanan Berkas Pekerjaan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              📂 Folder Penyimpanan Berkas Pekerjaan
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
              Tentukan folder di mana semua berkas fisik hasil pekerjaan (seperti draf naskah, invoice PDF, cover buku, dll.) disimpan agar tidak bercampur dengan direktori sistem aplikasi.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="compact-input"
                  placeholder="Menggunakan folder default sistem..."
                  value={customWorkDir || 'Default (Folder Sistem AppData)'}
                  readOnly
                  style={{
                    flex: 1,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: customWorkDir ? 'var(--text-primary)' : 'var(--text-secondary)',
                    outline: 'none',
                    fontSize: '12px',
                    padding: '8px 12px',
                    borderRadius: '6px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSelectWorkDir}
                  className="btn-secondary compact-btn"
                  style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', cursor: 'pointer', padding: '0 12px' }}
                >
                  📂 Ubah Lokasi
                </button>
              </div>
              {customWorkDir && (
                <button
                  type="button"
                  onClick={handleResetWorkDir}
                  className="btn-danger compact-btn"
                  style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: '600', alignSelf: 'flex-start', padding: '0 12px' }}
                >
                  🔄 Kembalikan ke Default
                </button>
              )}
            </div>
          </div>

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
        </div>

      </div>
    </div>
  );
};

export default LocalFoldersTab;

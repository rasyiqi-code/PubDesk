import React, { useState, useEffect } from 'react';
import { googleAppsScriptService } from '../../services/googleAppsScript';
import { useAppContext } from '../../contexts/AppContext';
import { useDataMasterContext } from '../../contexts/DataMasterContext';
import { useWorkflowContext } from '../../contexts/WorkflowContext';

interface GASCloudSettingsProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GASCloudSettings: React.FC<GASCloudSettingsProps> = ({ showToast }) => {
  const [urlInput, setUrlInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { syncAllDataToCloud, services } = useAppContext();
  const { penulis, penerbit, naskah, tim, legalitas } = useDataMasterContext();
  const { tasks } = useWorkflowContext();

  useEffect(() => {
    const { url, token } = googleAppsScriptService.getSettings();
    setUrlInput(url);
    setTokenInput(token);
  }, []);

  const handleSave = () => {
    if (!urlInput.trim()) {
      showToast('URL Google Apps Script tidak boleh kosong!', 'error');
      return;
    }
    googleAppsScriptService.saveSettings(urlInput, tokenInput);
    showToast('Konfigurasi Google Apps Script berhasil disimpan!', 'success');
  };

  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      showToast('URL Google Apps Script kosong!', 'error');
      return;
    }

    setTesting(true);
    showToast('Menguji koneksi ke Google Apps Script...', 'info');

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const testUrl = `${urlInput.trim()}?auth_token=${encodeURIComponent(tokenInput.trim())}&action=get_invoices`;
      
      const responseText = await invoke<string>('call_gas_api', {
        url: testUrl,
        method: 'GET',
        payloadJson: null
      });

      const data = JSON.parse(responseText);
      if (data && data.status === 'error') {
        showToast(`Koneksi gagal! ${data.message}`, 'error');
      } else {
        showToast('Koneksi sukses! Google Apps Script merespons dengan benar.', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Koneksi gagal! Error: ${err.message || String(err)}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAllData = async () => {
    if (!googleAppsScriptService.isConfigured()) {
      showToast('Harap simpan URL Google Apps Script terlebih dahulu!', 'error');
      return;
    }

    setSyncing(true);
    showToast('Memulai sinkronisasi seluruh data ke Google Sheets...', 'info');

    try {
      const result = await syncAllDataToCloud({
        penulis,
        penerbit,
        naskah,
        tim,
        legalitas,
        services,
        tasks
      });

      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`Gagal sinkronisasi data: ${err.message || String(err)}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', alignItems: 'start' }}>
        
        {/* Kolom Kiri: Form Integrasi */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              ☁️ Integrasi Google Apps Script (Cloud Sheets & Drive)
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              Hubungkan PubDesk dengan Google Sheets (sebagai cloud database) dan Google Drive (sebagai cloud storage) melalui Web App Google Apps Script.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="compact-form-group">
                <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>URL Web App Google Apps Script</label>
                <input
                  type="text"
                  className="compact-input"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div className="compact-form-group">
                <label className="compact-label" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Token Keamanan (Pre-shared Key)</label>
                <input
                  type="password"
                  className="compact-input"
                  placeholder="Masukkan token rahasia..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button
              type="button"
              className="btn-primary compact-btn"
              onClick={handleSave}
              disabled={testing || syncing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              💾 Simpan Setelan
            </button>

            <button
              type="button"
              className="btn-secondary compact-btn"
              onClick={handleTestConnection}
              disabled={testing || syncing}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            >
              🔌 Uji Koneksi
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Sinkronisasi & Panduan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              🔄 Sinkronisasi Data Manual
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
              Anda dapat memicu sinkronisasi manual untuk mengunggah seluruh data master dan operasional lokal (SQLite) ke Google Sheets cloud.
            </p>
            <button
              type="button"
              className="btn-primary compact-btn"
              onClick={handleSyncAllData}
              disabled={syncing || testing}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              {syncing ? '⏳ Mensinkronkan...' : '🚀 Sinkronkan Semua Data ke Cloud'}
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Cara Memasang:</strong>
            <ol style={{ margin: '8px 0 0 18px', padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Buka dokumen API & kode draf GAS di folder proyek <code>docs/google-apps-script/</code>.</li>
              <li>Salin kodenya, tempel di menu <strong>Ekstensi {"→"} Apps Script</strong> di Google Sheets Anda.</li>
              <li>Deploy sebagai <strong>Web App</strong> dengan akses <strong>"Anyone"</strong>.</li>
              <li>Salin URL Web App dan simpan di atas. Masukkan token rahasia jika Anda menyetelnya di properti proyek Apps Script.</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GASCloudSettings;

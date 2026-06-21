import React, { useEffect } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { TabBar } from '../../ui/molecules/TabBar';
import InvoiceSettings from './InvoiceSettings';
import GASCloudSettings from './GASCloudSettings';
import GDriveSettingsTab from './tabs/GDriveSettingsTab';
import LocalFoldersTab from './tabs/LocalFoldersTab';
import DataResetTab from './tabs/DataResetTab';

// Definisi tab — urutan dan label
const SETTINGS_TABS = [
  { key: 'invoice', label: 'Pengaturan Invoice', icon: '📄' },
  { key: 'local-folders', label: 'Folder Lokal Dipantau', icon: '📁' },
  { key: 'google-drive', label: 'Google Drive', icon: '☁️' },
  { key: 'google-apps-script', label: 'Google Apps Script', icon: '☁️' },
  { key: 'data-reset', label: 'Kustomisasi & Data', icon: '🎨' },
];

/**
 * Settings — container tab navigasi pengaturan.
 * File ini hanya menangani routing antar tab; logika tiap tab
 * ada di file tab masing-masing di subfolder tabs/.
 */
const Settings: React.FC = () => {
  const { activeSettingsTab, setActiveSettingsTab, showToast, setRightPanelVisible } = useAppContext();

  // Buka PanelKanan secara otomatis saat masuk ke modul Pengaturan, dan tutup saat keluar
  useEffect(() => {
    setRightPanelVisible(true);
    return () => {
      setRightPanelVisible(false);
    };
  }, [setRightPanelVisible]);

  const renderTab = () => {
    switch (activeSettingsTab) {
      case 'invoice':
        return <InvoiceSettings />;
      case 'local-folders':
        return <LocalFoldersTab />;
      case 'google-drive':
        return <GDriveSettingsTab />;
      case 'google-apps-script':
        return <GASCloudSettings showToast={showToast} />;
      case 'data-reset':
        return <DataResetTab />;
      default:
        return <InvoiceSettings />;
    }
  };

  return (
    <div
      className="settings-module"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}
    >

      {/* Tab Bar Sub-Header */}
      <div style={{
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <TabBar
          tabs={SETTINGS_TABS}
          activeTab={activeSettingsTab}
          onTabChange={setActiveSettingsTab as (key: string) => void}
        />
      </div>

      {/* Konten Tab */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {renderTab()}
      </div>
    </div>
  );
};

export default Settings;

import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { TabBar } from '../../ui/TabBar';
import InvoiceSettings from './InvoiceSettings';
import GASCloudSettings from './GASCloudSettings';
import ServiceManager from '../services-module/ServiceManager';
import GDriveSettingsTab from './tabs/GDriveSettingsTab';
import LocalFoldersTab from './tabs/LocalFoldersTab';

// Definisi tab — urutan dan label
const SETTINGS_TABS = [
  { key: 'invoice', label: 'Pengaturan Invoice', icon: '📄' },
  { key: 'services', label: 'Master Layanan', icon: '🛠️' },
  { key: 'local-folders', label: 'Folder Lokal Dipantau', icon: '📁' },
  { key: 'google-drive', label: 'Google Drive', icon: '☁️' },
  { key: 'google-apps-script', label: 'Google Apps Script', icon: '☁️' },
];

/**
 * Settings — container tab navigasi pengaturan.
 * File ini hanya menangani routing antar tab; logika tiap tab
 * ada di file tab masing-masing di subfolder tabs/.
 */
const Settings: React.FC = () => {
  const { activeSettingsTab, setActiveSettingsTab, showToast } = useAppContext();

  const renderTab = () => {
    switch (activeSettingsTab) {
      case 'invoice':
        return <InvoiceSettings />;
      case 'services':
        return <ServiceManager />;
      case 'local-folders':
        return <LocalFoldersTab />;
      case 'google-drive':
        return <GDriveSettingsTab />;
      case 'google-apps-script':
        return <GASCloudSettings showToast={showToast} />;
      default:
        return <InvoiceSettings />;
    }
  };

  return (
    <div
      className="settings-module"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}
    >
      {/* Header & Tab Bar */}
      <div style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', padding: '12px 16px 0 16px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
          ⚙️ Pengaturan
        </h1>
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

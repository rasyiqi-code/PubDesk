import React from 'react';
import { useSettingsForm } from './SettingsFormContext';
import { useAppContext } from '../../../contexts/AppContext';

const DesignSection: React.FC = () => {
  const {
    profileName,
    setProfileName,
    tableType,
    setTableType,
    accentColor,
    setAccentColor,
    accentColorDark,
    setAccentColorDark,
    headerPrimaryColor,
    setHeaderPrimaryColor,
    headerSecondaryColor,
    setHeaderSecondaryColor,
    headerBgColor,
    setHeaderBgColor
  } = useSettingsForm();

  const { rightPanelVisible } = useAppContext();

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div className="compact-form-group">
          <label className="compact-label">Nama Profil (Internal)</label>
          <input
            type="text"
            className="compact-input"
            style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Contoh: Profil Cetak Kustom"
          />
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Kode Tipe Tabel (bebas, untuk identifikasi)</label>
          <input
            type="text"
            className="compact-input"
            style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={tableType}
            onChange={(e) => setTableType(e.target.value)}
            placeholder="Contoh: layanan_desain, cetak_buku, haki, dll."
          />
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Warna Aksen Utama</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="color"
              style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
            <input
              type="text"
              className="compact-input"
              style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#1e70cd"
            />
          </div>
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Warna Aksen Gelap</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="color"
              style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
              value={accentColorDark}
              onChange={(e) => setAccentColorDark(e.target.value)}
            />
            <input
              type="text"
              className="compact-input"
              style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={accentColorDark}
              onChange={(e) => setAccentColorDark(e.target.value)}
              placeholder="#1e3a8a"
            />
          </div>
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Warna Utama Header SVG (Kiri)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="color"
              style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
              value={headerPrimaryColor}
              onChange={(e) => setHeaderPrimaryColor(e.target.value)}
            />
            <input
              type="text"
              className="compact-input"
              style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={headerPrimaryColor}
              onChange={(e) => setHeaderPrimaryColor(e.target.value)}
              placeholder="#d93838"
            />
          </div>
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Warna Aksen Header SVG (Tengah)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="color"
              style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
              value={headerSecondaryColor}
              onChange={(e) => setHeaderSecondaryColor(e.target.value)}
            />
            <input
              type="text"
              className="compact-input"
              style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={headerSecondaryColor}
              onChange={(e) => setHeaderSecondaryColor(e.target.value)}
              placeholder="#d93838"
            />
          </div>
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Warna Latar Header SVG (Kanan)</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="color"
              style={{ width: '32px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', cursor: 'pointer' }}
              value={headerBgColor}
              onChange={(e) => setHeaderBgColor(e.target.value)}
            />
            <input
              type="text"
              className="compact-input"
              style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={headerBgColor}
              onChange={(e) => setHeaderBgColor(e.target.value)}
              placeholder="#222933"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignSection;

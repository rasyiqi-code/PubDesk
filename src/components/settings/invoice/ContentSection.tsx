import React from 'react';
import { useSettingsForm } from './SettingsFormContext';
import { useAppContext } from '../../../contexts/AppContext';

const ContentSection: React.FC = () => {
  const {
    defaultHal,
    setDefaultHal,
    defaultLampiran,
    setDefaultLampiran,
    salamPembuka,
    setSalamPembuka,
    actionLabel,
    setActionLabel
  } = useSettingsForm();

  const { rightPanelVisible } = useAppContext();

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div className="compact-form-group">
          <label className="compact-label">Perihal Bawaan (Default Hal)</label>
          <input
            type="text"
            className="compact-input"
            style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={defaultHal}
            onChange={(e) => setDefaultHal(e.target.value)}
            placeholder="Contoh: Pengadaan Modul Ajar"
          />
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Lampiran Bawaan (Default Lampiran)</label>
          <input
            type="text"
            className="compact-input"
            style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={defaultLampiran}
            onChange={(e) => setDefaultLampiran(e.target.value)}
            placeholder="Contoh: 1 Lembar"
          />
        </div>

        <div style={{ gridColumn: rightPanelVisible ? 'span 1' : 'span 2' }} className="compact-form-group">
          <label className="compact-label">Salam Pembuka Bawaan</label>
          <textarea
            className="compact-textarea"
            style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', minHeight: '42px', resize: 'vertical' }}
            value={salamPembuka}
            onChange={(e) => setSalamPembuka(e.target.value)}
            placeholder="Teks salam pembuka..."
            rows={2}
          />
        </div>

        <div className="compact-form-group">
          <label className="compact-label">Label Aksi Penutup</label>
          <input
            type="text"
            className="compact-input"
            style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            value={actionLabel}
            onChange={(e) => setActionLabel(e.target.value)}
            placeholder="Contoh: penerbitan buku"
          />
        </div>
      </div>
    </>
  );
};

export default ContentSection;

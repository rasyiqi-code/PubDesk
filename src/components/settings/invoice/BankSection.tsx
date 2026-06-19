import React from 'react';
import { useSettingsForm } from './SettingsFormContext';
import { useAppContext } from '../../../contexts/AppContext';

const BankSection: React.FC = () => {
  const {
    showBankInfo,
    setShowBankInfo,
    bankName,
    setBankName,
    bankAccountNo,
    setBankAccountNo,
    bankAccountOwner,
    setBankAccountOwner
  } = useSettingsForm();

  const { rightPanelVisible } = useAppContext();

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <input
            type="checkbox"
            id="showBankInfo"
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            checked={showBankInfo}
            onChange={(e) => setShowBankInfo(e.target.checked)}
          />
          <label htmlFor="showBankInfo" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
            Tampilkan Blok Informasi Bank
          </label>
        </div>

        {showBankInfo && (
          <div style={{ display: 'grid', gridTemplateColumns: rightPanelVisible ? '1fr' : '1fr 1fr', gap: '12px' }}>
            <div className="compact-form-group">
              <label className="compact-label">Nama Bank / Layanan</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Contoh: Bank Central Asia (BCA)"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Nomor Rekening</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="Contoh: 876830659"
              />
            </div>

            <div className="compact-form-group">
              <label className="compact-label">Nama Pemilik Rekening</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={bankAccountOwner}
                onChange={(e) => setBankAccountOwner(e.target.value)}
                placeholder="Contoh: Mohammad Imam"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BankSection;

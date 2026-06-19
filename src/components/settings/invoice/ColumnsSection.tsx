import React from 'react';
import { useSettingsForm } from './SettingsFormContext';
import { useAppContext } from '../../../contexts/AppContext';
import { InvoiceTableColumn } from '../../../types';

const ColumnsSection: React.FC = () => {
  const { tableColumns, setTableColumns } = useSettingsForm();
  const { showConfirm } = useAppContext();

  const handleUpdateColumn = (index: number, updates: Partial<InvoiceTableColumn>) => {
    setTableColumns(prev => prev.map((col, i) => i === index ? { ...col, ...updates } : col));
  };

  const handleAddColumn = () => {
    const newCol: InvoiceTableColumn = {
      key: `custom_${Date.now()}`,
      label: 'Kolom Baru',
      type: 'text',
      align: 'left',
      width: 'auto'
    };
    setTableColumns(prev => {
      // Jika setTableColumns menerima callback
      if (typeof prev === 'function') {
        const fn = prev as any;
        return [...fn([]), newCol];
      }
      return [...prev, newCol];
    });
  };

  const handleRemoveColumn = (index: number) => {
    setTableColumns(prev => {
      if (typeof prev === 'function') {
        const fn = prev as any;
        return fn([]).filter((_: any, i: number) => i !== index);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tableColumns.length - 1) return;
    
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...tableColumns];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setTableColumns(updated);
  };

  const handleResetColumns = () => {
    showConfirm({
      title: 'Reset Kolom',
      message: 'Apakah Anda yakin ingin mereset kolom ke skema bawaan minimal?',
      confirmText: 'Reset',
      type: 'danger',
      onConfirm: () => {
        setTableColumns([
          { key: 'item_title', label: 'Nama Item', type: 'text', align: 'left' },
          { key: 'quantity', label: 'Qty', type: 'number', align: 'center', width: '80px' },
          { key: 'price', label: 'Harga', type: 'currency', align: 'right', width: '110px' },
          { key: 'total', label: 'Total', type: 'formula', align: 'right', width: '110px', formula: '{price} * {quantity}' }
        ]);
      }
    });
  };

  return (
    <>
      <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        7. Kolom Tabel Rincian Invoice
      </h3>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            Sesuaikan kolom tabel rincian item:
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" className="btn-secondary compact-btn" style={{ fontSize: '11px', height: '26px' }} onClick={handleResetColumns}>
              🔄 Reset Bawaan
            </button>
            <button type="button" className="btn-primary compact-btn" style={{ fontSize: '11px', height: '26px' }} onClick={handleAddColumn}>
              ➕ Tambah Kolom
            </button>
          </div>
        </div>

        {/* Header label kolom */}
        <div style={{ display: 'grid', gridTemplateColumns: '20px 1.8fr 1fr 0.8fr 1fr 32px 32px', gap: '6px', padding: '0 4px 4px', alignItems: 'center' }}>
          <span />
          <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Label / Kunci</span>
          <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipe</span>
          <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rata</span>
          <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lebar / Formula</span>
          <span />
          <span />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '380px', overflowY: 'auto', paddingRight: '2px' }}>
          {tableColumns.length === 0 ? (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', padding: '16px', fontStyle: 'italic' }}>
              Belum ada kolom tabel yang didefinisikan.
            </div>
          ) : (
            tableColumns.map((col, idx) => {
              const isLocked = col.key === 'item_title' || col.key === 'quantity' || col.key === 'price';

              const inputBase: React.CSSProperties = {
                width: '100%',
                fontSize: '12px',
                padding: '5px 8px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                outline: 'none',
                height: '30px',
                boxSizing: 'border-box',
              };
              const selectBase: React.CSSProperties = { ...inputBase, cursor: 'pointer' };
              const disabledStyle: React.CSSProperties = {
                ...inputBase,
                background: 'var(--bg-panel)',
                color: 'var(--text-secondary)',
                cursor: 'default',
              };

              return (
                <div
                  key={col.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '20px 1.8fr 1fr 0.8fr 1fr 32px 32px',
                    gap: '6px',
                    alignItems: 'center',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    opacity: isLocked ? 0.85 : 1,
                  }}
                >
                  {/* Nomor */}
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center' }}>
                    {idx + 1}
                  </span>

                  {/* Label + Kunci */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <input
                      type="text"
                      style={{ ...inputBase, fontWeight: '600', fontSize: '12px' }}
                      value={col.label}
                      onChange={(e) => handleUpdateColumn(idx, { label: e.target.value })}
                      placeholder="Label Kolom"
                    />
                    <input
                      type="text"
                      style={{ ...disabledStyle, fontSize: '10px', height: '22px', padding: '2px 8px', fontFamily: 'monospace' }}
                      value={col.key}
                      onChange={(e) => handleUpdateColumn(idx, { key: e.target.value })}
                      disabled={isLocked}
                      placeholder="key_field"
                    />
                  </div>

                  {/* Tipe */}
                  <select
                    style={isLocked ? { ...selectBase, background: 'var(--bg-panel)', color: 'var(--text-secondary)' } : selectBase}
                    value={col.type}
                    onChange={(e) => handleUpdateColumn(idx, { type: e.target.value as any })}
                    disabled={isLocked}
                  >
                    <option value="text">Teks</option>
                    <option value="number">Angka</option>
                    <option value="currency">Mata Uang (Rp)</option>
                    <option value="formula">Formula</option>
                  </select>

                  {/* Rata */}
                  <select
                    style={selectBase}
                    value={col.align || 'left'}
                    onChange={(e) => handleUpdateColumn(idx, { align: e.target.value as any })}
                  >
                    <option value="left">Kiri</option>
                    <option value="center">Tengah</option>
                    <option value="right">Kanan</option>
                  </select>

                  {/* Lebar atau Formula */}
                  {col.type === 'formula' ? (
                    <input
                      type="text"
                      style={{ ...inputBase, fontFamily: 'monospace', fontSize: '11px', color: '#7c3aed', borderColor: '#7c3aed44', background: '#f5f3ff' }}
                      value={col.formula || ''}
                      onChange={(e) => handleUpdateColumn(idx, { formula: e.target.value })}
                      placeholder="{price}*{qty}"
                    />
                  ) : (
                    <input
                      type="text"
                      style={inputBase}
                      value={col.width || 'auto'}
                      onChange={(e) => handleUpdateColumn(idx, { width: e.target.value })}
                      placeholder="auto / 90px"
                    />
                  )}

                  {/* Naik / Turun */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveColumn(idx, 'up')}
                      disabled={idx === 0}
                      style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: '1px', fontSize: '11px', color: 'var(--text-secondary)', opacity: idx === 0 ? 0.3 : 0.7, lineHeight: 1 }}
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => handleMoveColumn(idx, 'down')}
                      disabled={idx === tableColumns.length - 1}
                      style={{ background: 'none', border: 'none', cursor: idx === tableColumns.length - 1 ? 'default' : 'pointer', padding: '1px', fontSize: '11px', color: 'var(--text-secondary)', opacity: idx === tableColumns.length - 1 ? 0.3 : 0.7, lineHeight: 1 }}
                    >▼</button>
                  </div>

                  {/* Hapus */}
                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(idx)}
                    disabled={isLocked}
                    title={isLocked ? 'Kolom wajib' : 'Hapus kolom'}
                    style={{ background: isLocked ? 'transparent' : '#fef2f2', border: isLocked ? 'none' : '1px solid #fecaca', borderRadius: '6px', cursor: isLocked ? 'default' : 'pointer', padding: '4px', color: '#dc2626', opacity: isLocked ? 0.2 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30px', width: '30px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6l-1 14H6L5 6"></path>
                      <path d="M10 11v6M14 11v6"></path>
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default ColumnsSection;

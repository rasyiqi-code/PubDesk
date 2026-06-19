import React, { useState } from 'react';
import { useSettingsForm } from './SettingsFormContext';

const NotesSection: React.FC = () => {
  const {
    notes,
    setNotes,
    showSpesifikasi,
    setShowSpesifikasi,
    defaultSpesifikasi,
    setDefaultSpesifikasi
  } = useSettingsForm();

  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      setNotes([...notes, newNoteText.trim()]);
      setNewNoteText('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  return (
    <>
      <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        4. Spesifikasi & Catatan (Notes)
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              id="showSpesifikasi"
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              checked={showSpesifikasi}
              onChange={(e) => setShowSpesifikasi(e.target.checked)}
            />
            <label htmlFor="showSpesifikasi" style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Tampilkan Box Spesifikasi & Fasilitas
            </label>
          </div>
          
          {showSpesifikasi && (
            <div className="compact-form-group">
              <label className="compact-label">Teks Spesifikasi Bawaan</label>
              <input
                type="text"
                className="compact-input"
                style={{ width: '100%', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                value={defaultSpesifikasi}
                onChange={(e) => setDefaultSpesifikasi(e.target.value)}
                placeholder="Contoh: Sesuai proposal kerjasama"
              />
            </div>
          )}
        </div>

        <div>
          <label className="compact-label">Daftar Catatan (Note)</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            <input
              type="text"
              className="compact-input"
              style={{ flex: 1, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Ketik catatan baru..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
            />
            <button type="button" className="btn-primary compact-btn" onClick={handleAddNote}>Tambah</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px', background: 'var(--bg-card)' }}>
            {notes.length === 0 ? (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '2px' }}>
                Tidak ada catatan.
              </div>
            ) : (
              notes.map((note, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', background: 'var(--bg-panel)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{index + 1}. {note}</span>
                  <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleRemoveNote(index)}>✕</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotesSection;

import React, { useMemo } from 'react';
import { useFileState } from '../../contexts/FileContext';
import { useAppContext } from '../../contexts/AppContext';

type FileCategory = 'all' | 'invoice' | 'service' | 'other' | 'gdrive' | 'pdf' | 'spreadsheet' | 'text' | 'image' | 'presentation';

interface StatCardConfig {
  label: string;
  color: string;
  icon: string;
  cat: FileCategory;
}

const STAT_CARDS: StatCardConfig[] = [
  { label: 'Semua Berkas', color: '#3b82f6', icon: '📂', cat: 'all' },
  { label: 'Dokumen Invoice', color: '#10b981', icon: '🧾', cat: 'invoice' },
  { label: 'Dokumen PDF', color: '#ef4444', icon: '📕', cat: 'pdf' },
  { label: 'Spreadsheet', color: '#f59e0b', icon: '📊', cat: 'spreadsheet' },
  { label: 'Dokumen Teks & Word', color: '#8b5cf6', icon: '📝', cat: 'text' },
  { label: 'Google Drive', color: '#06b6d4', icon: '☁️', cat: 'gdrive' },
];

const DashboardFiles: React.FC = () => {
  const { files, setFileCategory } = useFileState();
  const { setActiveModule } = useAppContext();

  const stats = useMemo(() => {
    const all = files.length;
    const invoice = files.filter(f => f.type === 'invoice').length;
    const pdf = files.filter(f => f.type === 'pdf' || f.filename.toLowerCase().endsWith('.pdf')).length;
    const spreadsheet = files.filter(f =>
      f.type === 'spreadsheet' ||
      f.filename.toLowerCase().endsWith('.xlsx') ||
      f.filename.toLowerCase().endsWith('.xls')
    ).length;
    const text = files.filter(f =>
      f.type === 'text' ||
      f.filename.toLowerCase().endsWith('.docx') ||
      f.filename.toLowerCase().endsWith('.doc') ||
      f.filename.toLowerCase().endsWith('.txt')
    ).length;
    const gdrive = files.filter(f => f.type === 'gdrive').length;

    return { all, invoice, pdf, spreadsheet, text, gdrive };
  }, [files]);

  const countMap: Record<string, number> = {
    all: stats.all,
    invoice: stats.invoice,
    pdf: stats.pdf,
    spreadsheet: stats.spreadsheet,
    text: stats.text,
    gdrive: stats.gdrive,
  };

  const handleNavigate = (category: FileCategory) => {
    setFileCategory(category);
    setActiveModule('files');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-dark)' }}>
      {/* Header Bar Seragam */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        height: 44,
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📁</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Dashboard Smart Folders</span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Katalogisasi berkas otomatis berdasarkan jenis dokumen, kuitansi invoice, spreadsheet data master, dan sinkronisasi Google Drive.
        </span>
      </div>

      {/* Konten Dashboard yang scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
        
        {/* Grid Summary Info Cards terpadu tanpa space/gap dan siku */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          background: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border)', 
          borderRadius: '0px', 
          overflow: 'hidden',
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          {STAT_CARDS.map(card => {
            const count = countMap[card.cat] ?? 0;
            return (
              <div
                key={card.cat}
                onClick={() => handleNavigate(card.cat)}
                style={{
                  flex: '1 1 33.33%',
                  minWidth: '220px',
                  padding: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  transition: 'all 0.2s ease-in-out',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-panel)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* Garis aksen warna kecil di sisi atas */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '3px', 
                  background: card.color 
                }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '24px' }}>{card.icon}</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {count}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {card.label}
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                    Klik untuk membuka folder ini
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions / Navigasi */}
        <div style={{ 
          background: 'var(--bg-card)', 
          borderBottom: '1px solid var(--border)', 
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            ⚡ Kategori Pintar Lainnya
          </h2>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            background: 'var(--bg-panel)',
            borderTop: '1px solid var(--border)',
            borderLeft: '1px solid var(--border)',
            borderRadius: '0px',
            overflow: 'hidden'
          }}>
            {[
              { cat: 'service' as FileCategory, label: 'Katalog Layanan', desc: 'Berkas terkait modul list layanan', icon: '🛠️' },
              { cat: 'image' as FileCategory, label: 'Gambar & Poster', desc: 'Aset gambar naskah atau promosi', icon: '🖼️' },
              { cat: 'presentation' as FileCategory, label: 'Presentasi', desc: 'Slide atau proposal berformat PPTX/PDF', icon: '📉' },
              { cat: 'other' as FileCategory, label: 'Berkas Lainnya', desc: 'Kategori berkas tak terdefinisi', icon: '📁' },
            ].map(act => (
              <button
                key={act.cat}
                onClick={() => handleNavigate(act.cat)}
                style={{
                  flex: '1 1 25%',
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '16px 20px',
                  border: 'none',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '24px', marginBottom: '4px' }}>{act.icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{act.label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{act.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Petunjuk Penggunaan */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            💡 Petunjuk Smart Folders
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
            Smart Folders mendeteksi berkas secara cerdas dari folder lokal yang Anda pantau (Watch Folders) dan menyaringnya berdasarkan ekstensi atau metadata file secara otomatis. Hubungkan ke Google Drive pada Pengaturan untuk mengaktifkan sinkronisasi otomatis berkas invoice Anda.
          </p>
          <div style={{ 
            padding: '12px', 
            borderRadius: '0px', 
            background: 'var(--bg-panel)', 
            borderLeft: '4px solid var(--accent)',
            fontSize: '12px',
            color: 'var(--text-secondary)'
          }}>
            <strong>Pengingat:</strong> Anda dapat memantau folder baru di komputer lokal Anda dengan mendaftarkan jalurnya di tab Pengaturan Folder Lokal.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFiles;

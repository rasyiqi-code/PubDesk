import React from 'react';

interface TagFilterProps {
  allTags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTag, setSelectedTag }) => {
  if (allTags.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-panel)',
      overflowX: 'auto',
      alignItems: 'center',
      flexShrink: 0
    }}>
      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '4px', whiteSpace: 'nowrap' }}>
        🏷️ Filter Tag:
      </span>
      <button
        onClick={() => setSelectedTag(null)}
        style={{
          padding: '4px 10px',
          borderRadius: '20px',
          border: 'none',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          background: selectedTag === null ? 'var(--accent)' : 'var(--bg-card)',
          color: selectedTag === null ? '#ffffff' : 'var(--text-secondary)',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap'
        }}
      >
        Semua
      </button>
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
          style={{
            padding: '4px 10px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            background: selectedTag === tag ? 'var(--accent)' : 'var(--bg-card)',
            color: selectedTag === tag ? '#ffffff' : 'var(--text-secondary)',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

import React from 'react';

interface AccordionSectionProps {
  index: number;
  title: string;
  icon?: string;
  expandedSection: number | null;
  onToggle: (index: number | null) => void;
  children: React.ReactNode;
}

export const AccordionSection: React.FC<AccordionSectionProps> = ({
  index, title, icon, expandedSection, onToggle, children
}) => {
  const isOpen = expandedSection === index;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-card)' }}>
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : index)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: isOpen ? 'var(--bg-panel)' : 'transparent',
          border: 'none',
          color: isOpen ? 'var(--accent)' : 'var(--text-primary)',
          fontSize: '12px',
          fontWeight: '700',
          textAlign: 'left',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          outline: 'none',
        }}
      >
        <span>{icon && <span>{icon} </span>}{title}</span>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

interface AccordionProps {
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ children }) => {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>;
};

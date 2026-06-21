import React, { useState, useRef, useEffect, useMemo } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  emptyMessage?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Ketik untuk mencari...',
  fullWidth,
  emptyMessage = 'Tidak ada data',
  required,
  autoFocus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = useMemo(() => {
    const found = options.find(o => o.value === value);
    return found ? found.label : '';
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      o.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: fullWidth ? '100%' : undefined,
        position: 'relative',
      }}
    >
      {label && (
        <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
          {label}
          {required && <span style={{ color: 'var(--accent)', marginLeft: '2px' }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? search : selectedLabel}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={isOpen ? placeholder : (selectedLabel || placeholder)}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            height: '42px',
            padding: '10px 36px 10px 14px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '14px',
            lineHeight: '1.4',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: isOpen ? 'text' : 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setSearch('');
            }
            if (e.key === 'Enter' && filteredOptions.length === 1) {
              handleSelect(filteredOptions[0]);
            }
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none',
          }}
        >
          {selectedLabel && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                opacity: 0.6,
                lineHeight: 1,
              }}
              title="Hapus pilihan"
            >
              ✕
            </span>
          )}
          <span style={{
            fontSize: '10px',
            color: 'var(--text-secondary)',
            opacity: isOpen ? 0.5 : 0.35,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            ▼
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            marginTop: '4px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            maxHeight: '240px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}
        >
          {filteredOptions.length === 0 ? (
            <div style={{
              padding: '12px 14px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              textAlign: 'center',
            }}>
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: opt.value === value ? 'var(--accent)' : 'var(--text-primary)',
                  background: opt.value === value ? 'rgba(192, 28, 28, 0.06)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (opt.value !== value) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                }}
                onMouseLeave={(e) => {
                  if (opt.value !== value) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.label || `(${opt.value})`}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Modal } from '../molecules/Modal';
import { Button } from './Button';

interface DatePickerProps {
  value?: string | null; // ISO string (yyyy-mm-dd)
  onChange?: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  fullWidth?: boolean;
}

// Format Date object to ISO string (yyyy-mm-dd)
const formatToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format Date object to display string (dd/mm/yyyy)
const formatToDisplay = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Parse either dd/mm/yyyy or yyyy-mm-dd to Date
const parseDate = (dateString: string): Date | null => {
  // Try yyyy-mm-dd first
  let parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
  }
  // Try dd/mm/yyyy
  parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(year, month, day);
      if (
        date.getDate() === day &&
        date.getMonth() === month &&
        date.getFullYear() === year
      ) {
        return date;
      }
    }
  }
  return null;
};

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Pilih Tanggal',
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const parsedValue = value ? parseDate(value) : null;
  const initialDate = parsedValue || new Date();
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(parsedValue);
  const [inputValue, setInputValue] = useState(parsedValue ? formatToDisplay(parsedValue) : '');

  // Update input value when value changes
  useEffect(() => {
    if (value) {
      const date = parseDate(value);
      if (date) {
        setSelectedDate(date);
        setCurrentDate(date);
        setInputValue(formatToDisplay(date));
      }
    } else {
      setSelectedDate(null);
      setCurrentDate(new Date());
      setInputValue('');
    }
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle input blur
  const handleInputBlur = () => {
    const parsed = parseDate(inputValue);
    if (parsed) {
      setSelectedDate(parsed);
      setCurrentDate(parsed);
      if (onChange) onChange(formatToISO(parsed));
    } else if (value) {
      const date = parseDate(value);
      if (date) {
        setInputValue(formatToDisplay(date));
      }
    }
  };

  // Handle input key press (Enter)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseDate(inputValue);
      if (parsed) {
        setSelectedDate(parsed);
        setCurrentDate(parsed);
        if (onChange) onChange(formatToISO(parsed));
      }
    }
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle save
  const handleSave = () => {
    if (selectedDate) {
      setInputValue(formatToDisplay(selectedDate));
      if (onChange) onChange(formatToISO(selectedDate));
    }
    setIsOpen(false);
  };

  // Get days in month
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, ...)
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Render calendar
  const renderCalendar = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    // Empty days before first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            background: 'transparent',
          }}
        />
      );
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = selectedDate
        ? date.toDateString() === selectedDate.toDateString()
        : false;

      days.push(
        <div
          key={`day-${day}`}
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 600,
            color: isToday
              ? '#ffffff'
              : isSelected
              ? '#ffffff'
              : 'var(--text-primary)',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            background: isToday
              ? 'var(--accent)'
              : isSelected
              ? 'var(--text-primary)'
              : 'transparent',
          }}
          onClick={() => handleDateClick(date)}
          onMouseEnter={(e) => {
            const target = e.currentTarget;
            if (!isToday && !isSelected) {
              target.style.background = 'var(--bg-panel)';
            } else if (isToday) {
              target.style.background = 'var(--accent-dark)';
            } else if (isSelected) {
              target.style.opacity = '0.85';
            }
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget;
            if (!isToday && !isSelected) {
              target.style.background = 'transparent';
            } else if (isToday) {
              target.style.background = 'var(--accent)';
            } else if (isSelected) {
              target.style.opacity = '1';
            }
          }}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  // Month names
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  // Day names
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <>
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          width: fullWidth ? '100%' : 'auto',
        }}
      >
        {label && (
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
            }}
          >
            {label}
          </label>
        )}
        <div
          style={{
            position: 'relative',
            width: '100%',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.boxShadow =
                '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)';
            }}
            placeholder={placeholder}
            style={{
              width: '100%',
              height: '42px',
              padding: '10px 44px 10px 14px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.4',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease',
            }}
          />
          <button
            type="button"
            onClick={() => {
              // Reset calendar state when opening
              if (value) {
                const date = parseDate(value);
                if (date) {
                  setSelectedDate(date);
                  setCurrentDate(date);
                }
              }
              setIsOpen(true);
            }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-panel)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            📅
          </button>
        </div>
      </div>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Pilih Tanggal"
        width="380px"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() - 1,
                  1
                )
              );
            }}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              background: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-panel)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            ‹
          </button>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth() + 1,
                  1
                )
              );
            }}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              background: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              fontWeight: 600,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-panel)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            ›
          </button>
        </div>

        {/* Day names */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '8px',
          }}
        >
          {dayNames.map((name, index) => (
            <div
              key={`day-name-${index}`}
              style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                padding: '8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
          }}
        >
          {renderCalendar()}
        </div>

        {/* Footer: Today button and Action buttons */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setSelectedDate(today);
              setCurrentDate(today);
            }}
            style={{
              padding: '8px 20px',
              border: '1px solid var(--border)',
              background: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-panel)';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            Hari Ini
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} size="sm">
              Batal
            </Button>
            <Button type="button" variant="primary" onClick={handleSave} size="sm">
              Pilih
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

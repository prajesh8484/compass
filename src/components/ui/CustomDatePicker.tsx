import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  position?: 'top' | 'bottom';
}

const PRESETS = [
  { label: 'Today', offsetDays: 0 },
  { label: 'Tomorrow', offsetDays: 1 },
  { label: 'In 3 Days', offsetDays: 3 },
  { label: 'Next Week', offsetDays: 7 },
];

export function CustomDatePicker({ value, onChange, id, position = 'top' }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date();
  });

  useEffect(() => {
    if (value) {
      setViewDate(new Date(value));
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPresetDateString = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return getDateString(d);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDate = (dayNumber: number) => {
    const selected = new Date(year, month, dayNumber);
    onChange(getDateString(selected));
    setIsOpen(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        id={id}
        tabIndex={0}
        className={`input input--sm ${isOpen ? 'open' : ''}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          outline: 'none',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: value ? 'var(--text)' : 'var(--text-dim)' }}>
          <CalendarIcon size={14} />
          {value ? new Date(value + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select deadline...'}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-dim)' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: position === 'top' ? 'auto' : 'calc(100% + 6px)',
              bottom: position === 'top' ? 'calc(100% + 6px)' : 'auto',
              right: 0,
              width: 280,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 12,
              zIndex: 500,
              boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
            }}
          >
            {/* Presets */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              {PRESETS.map((p) => {
                const dateStr = getPresetDateString(p.offsetDays);
                const isSelected = dateStr === value;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => { onChange(dateStr); setIsOpen(false); }}
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent-dim)' : 'var(--surface-alt)',
                      color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
              {value && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  style={{
                    fontSize: 11,
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-dim)',
                    color: 'var(--danger)',
                    border: '1px solid var(--danger-dim)',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Calendar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {monthNames[month]} {year}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  type="button"
                  className="btn btn--icon"
                  onClick={prevMonth}
                  style={{ width: 24, height: 24 }}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn--icon"
                  onClick={nextMonth}
                  style={{ width: 24, height: 24 }}
                  aria-label="Next month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', marginBottom: 4 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <span key={day} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)' }}>
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateObj = new Date(year, month, dayNum);
                const dateStr = getDateString(dateObj);
                const isSelected = dateStr === value;
                const isToday = dateStr === getDateString(new Date());

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => selectDate(dayNum)}
                    style={{
                      height: 28,
                      width: '100%',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--surface-hover)' : 'transparent',
                      color: isSelected ? '#ffffff' : isToday ? 'var(--accent)' : 'var(--text)',
                      fontWeight: isSelected || isToday ? 600 : 400,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background var(--ease)'
                    }}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

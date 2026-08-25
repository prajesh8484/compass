import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  position?: 'top' | 'bottom';
}

export function CustomSelect({ options, value, onChange, id, placeholder = 'Select...', position = 'bottom' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setFocusedIndex(options.findIndex(o => o.value === value));
      } else if (focusedIndex >= 0) {
        onChange(options[focusedIndex].value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="custom-select-container"
      style={{ position: 'relative', width: '100%' }}
    >
      <div
        id={id}
        tabIndex={0}
        className={`input input--sm custom-select-trigger ${isOpen ? 'open' : ''}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          outline: 'none',
        }}
        onClick={() => {
          setIsOpen(!isOpen);
          setFocusedIndex(options.findIndex(o => o.value === value));
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span style={{ color: selectedOption ? 'var(--text)' : 'var(--text-dim)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} style={{ color: 'var(--text-dim)', transition: 'transform 150ms', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="custom-select-dropdown"
            role="listbox"
            style={{
              position: 'absolute',
              top: position === 'top' ? 'auto' : 'calc(100% + 4px)',
              bottom: position === 'top' ? 'calc(100% + 4px)' : 'auto',
              left: 0,
              right: 0,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 4,
              margin: 0,
              listStyle: 'none',
              zIndex: 500,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              maxHeight: 220,
              overflowY: 'auto'
            }}
          >
            {options.map((option, idx) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className={`custom-select-option ${focusedIndex === idx ? 'focused' : ''} ${option.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--text)',
                  background: focusedIndex === idx ? 'var(--surface-hover)' : 'transparent'
                }}
              >
                {option.label}
                {option.value === value && <Check size={14} color="var(--accent)" />}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

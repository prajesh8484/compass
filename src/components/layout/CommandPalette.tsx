import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Home, FolderOpen, List, Plus, Settings, Search, Zap
} from 'lucide-react';

interface PaletteItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTask?: () => void;
}

export function CommandPalette({ isOpen, onClose, onNewTask }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const items: PaletteItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: <Home size={16} />,
      shortcut: ['Ctrl', '1'],
      action: () => { navigate('/'); onClose(); },
    },
    {
      id: 'projects',
      label: 'Go to Projects',
      icon: <FolderOpen size={16} />,
      shortcut: ['Ctrl', '2'],
      action: () => { navigate('/projects'); onClose(); },
    },
    {
      id: 'tasks',
      label: 'Go to All Tasks',
      icon: <List size={16} />,
      shortcut: ['Ctrl', '3'],
      action: () => { navigate('/tasks'); onClose(); },
    },
    {
      id: 'completed',
      label: 'Go to Completed',
      icon: <Zap size={16} />,
      shortcut: ['Ctrl', '4'],
      action: () => { navigate('/completed'); onClose(); },
    },
    {
      id: 'new-task',
      label: 'Create New Task',
      icon: <Plus size={16} />,
      shortcut: ['N'],
      action: () => { onNewTask?.(); onClose(); },
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: <Settings size={16} />,
      shortcut: ['Ctrl', ','],
      action: () => { navigate('/settings'); onClose(); },
    },
  ];

  const filtered = query.trim()
    ? items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    },
    [isOpen, filtered, selectedIndex, onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => { setSelectedIndex(0); }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={onClose}
        >
          <motion.div
            className="palette-box"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <Search size={16} style={{ marginLeft: 20, color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                className="palette-input"
                style={{ borderBottom: 'none', flex: 1 }}
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Command palette search"
                id="command-palette-input"
              />
              <span className="text-xs text-muted" style={{ marginRight: 16, flexShrink: 0 }}>ESC to close</span>
            </div>

            <div className="palette-results" role="listbox" aria-label="Commands">
              {filtered.length === 0 ? (
                <div className="palette-empty">
                  <Zap size={20} style={{ margin: '0 auto 8px', color: 'var(--text-dim)' }} />
                  No commands found
                </div>
              ) : (
                filtered.map((item, i) => (
                  <button
                    key={item.id}
                    className={`palette-item${i === selectedIndex ? ' selected' : ''}`}
                    role="option"
                    aria-selected={i === selectedIndex}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(i)}
                    id={`palette-item-${item.id}`}
                  >
                    <span className="palette-item__icon">{item.icon}</span>
                    {item.label}
                    {item.shortcut && (
                      <span className="palette-item__shortcut">
                        {item.shortcut.map((k) => <span key={k}>{k}</span>)}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

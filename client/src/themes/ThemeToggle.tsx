import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Palette } from 'lucide-react';
import { useTheme } from './ThemeContext';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, setTheme, availableThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="theme-toggle" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="theme-toggle-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Change color theme"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Palette size={18} aria-hidden />
        <span className="theme-toggle-icon" style={{ background: `var(--accent)` }}>
          {theme.icon}
        </span>
        <ChevronDown size={14} className={open ? 'open' : ''} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="theme-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-label="Select theme"
          >
            {availableThemes.map(t => (
              <button
                key={t.id}
                className={`theme-option ${theme.id === t.id ? 'active' : ''}`}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                role="option"
                aria-selected={theme.id === t.id}
              >
                <span className="theme-option-icon" style={{ background: t.css['--accent'] }}>{t.icon}</span>
                <span className="theme-option-name">{t.name}</span>
                {theme.id === t.id && <span className="theme-option-check" aria-hidden>✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
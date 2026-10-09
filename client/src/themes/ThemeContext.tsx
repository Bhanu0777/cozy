import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { THEMES, type ThemeId, type ThemeDef } from './themes';

type ThemeContextValue = {
  theme: ThemeDef;
  setTheme: (id: ThemeId) => void;
  availableThemes: typeof THEMES;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'warm';
    const stored = localStorage.getItem('cozy-theme') as ThemeId | null;
    return stored && THEMES.some(t => t.id === stored) ? stored : 'warm';
  });

  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.css).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute('data-theme', themeId);
    localStorage.setItem('cozy-theme', themeId);
  }, [themeId, theme.css]);

  const setTheme = (id: ThemeId) => {
    setThemeId(id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
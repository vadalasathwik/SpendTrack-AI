/**
 * SpendTrack AI Theme Utility
 * Manages Light, Dark, System, and pitch-black AMOLED themes with localStorage persistence.
 */

export type ThemeMode = 'light' | 'dark' | 'system' | 'amoled';

const THEME_STORAGE_KEY = 'spendtrack_theme_mode';

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system', 'amoled'].includes(stored)) {
      return stored as ThemeMode;
    }
  } catch (err) {
    console.warn('Failed to read theme mode from localStorage:', err);
  }
  return 'system';
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (err) {
    console.warn('Failed to save theme mode to localStorage:', err);
  }

  const root = document.documentElement;
  root.classList.remove('dark', 'amoled');

  if (mode === 'amoled') {
    root.classList.add('dark', 'amoled');
  } else if (mode === 'dark') {
    root.classList.add('dark');
  } else if (mode === 'light') {
    root.classList.remove('dark', 'amoled');
  } else {
    // System preference
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isSystemDark) {
      root.classList.add('dark');
    }
  }
}

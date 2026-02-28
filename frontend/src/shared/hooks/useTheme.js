import { useCallback, useEffect, useMemo, useState } from 'react';

const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';
const DEFAULT_STORAGE_KEY = 'theme';

const normalizeTheme = (value, fallback = THEME_LIGHT) => {
  if (value === THEME_DARK || value === THEME_LIGHT) return value;
  return fallback;
};

const getStoredTheme = (storageKey) => {
  if (typeof window === 'undefined') return null;
  return normalizeTheme(window.localStorage.getItem(storageKey), null);
};

export const useTheme = ({ initialTheme = THEME_LIGHT, storageKey = DEFAULT_STORAGE_KEY } = {}) => {
  const [hasStoredPreference, setHasStoredPreference] = useState(() => getStoredTheme(storageKey) !== null);
  const [theme, setThemeState] = useState(() => getStoredTheme(storageKey) || normalizeTheme(initialTheme));

  useEffect(() => {
    if (!hasStoredPreference) {
      setThemeState(normalizeTheme(initialTheme));
    }
  }, [hasStoredPreference, initialTheme]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', theme === THEME_DARK);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, theme);
  }, [storageKey, theme]);

  const setTheme = useCallback((nextTheme) => {
    setHasStoredPreference(true);
    setThemeState((currentTheme) => {
      const resolvedTheme = typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme;
      return normalizeTheme(resolvedTheme, currentTheme);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK));
  }, [setTheme]);

  const resetTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
    setHasStoredPreference(false);
    setThemeState(normalizeTheme(initialTheme));
  }, [initialTheme, storageKey]);

  return useMemo(() => ({
    theme,
    isDark: theme === THEME_DARK,
    hasStoredPreference,
    setTheme,
    toggleTheme,
    resetTheme,
  }), [theme, hasStoredPreference, setTheme, toggleTheme, resetTheme]);
};

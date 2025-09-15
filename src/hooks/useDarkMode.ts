import { useState, useEffect } from 'react';

export type DarkModePreference = 'light' | 'dark' | 'system';

interface DarkModeState {
  isDark: boolean;
  isSystemDark: boolean;
  userPreference: DarkModePreference;
}

interface DarkModeActions {
  toggleDarkMode: () => void;
  setDarkMode: (enabled: boolean) => void;
  setPreference: (preference: DarkModePreference) => void;
}

export const useDarkMode = (): DarkModeState & DarkModeActions => {
  // Check system preference
  const getSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Get stored preference or default to 'system'
  const getStoredPreference = (): DarkModePreference => {
    try {
      const stored = localStorage.getItem('darkModePreference');
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as DarkModePreference;
      }
    } catch (error) {
      console.warn('Failed to read dark mode preference from localStorage:', error);
    }
    return 'system';
  };

  const [isSystemDark, setIsSystemDark] = useState(getSystemDark);
  const [userPreference, setUserPreference] = useState<DarkModePreference>(getStoredPreference);
  
  // Calculate current dark mode state
  const isDark = userPreference === 'system' ? isSystemDark : userPreference === 'dark';

  // Apply dark mode class to document
  useEffect(() => {
    const documentElement = document.documentElement;
    if (isDark) {
      documentElement.classList.add('dark');
    } else {
      documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Store preference in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('darkModePreference', userPreference);
    } catch (error) {
      console.warn('Failed to store dark mode preference:', error);
    }
  }, [userPreference]);

  const toggleDarkMode = () => {
    const newPreference = isDark ? 'light' : 'dark';
    setUserPreference(newPreference);
  };

  const setDarkMode = (enabled: boolean) => {
    setUserPreference(enabled ? 'dark' : 'light');
  };

  const setPreference = (preference: DarkModePreference) => {
    setUserPreference(preference);
  };

  return {
    isDark,
    isSystemDark,
    userPreference,
    toggleDarkMode,
    setDarkMode,
    setPreference,
  };
};
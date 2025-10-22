import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadUserData, updateSettings } from '@/utils/storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

// Helper function to determine if current time should be dark mode
// Dark mode: 6 PM (18:00) to 6 AM (06:00)
// Light mode: 6 AM (06:00) to 6 PM (18:00)
const shouldBeDarkBasedOnTime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6;
};

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const userData = loadUserData();
    return userData.settings.themeMode || 'auto';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const userData = loadUserData();
    const mode = userData.settings.themeMode || 'auto';
    
    if (mode === 'light') return false;
    if (mode === 'dark') return true;
    // Auto mode - check time
    return shouldBeDarkBasedOnTime();
  });

  const toggleDarkMode = () => {
    // When toggling, switch to manual mode
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeModeState(newMode);
    setIsDarkMode(!isDarkMode);
    updateSettings({ themeMode: newMode });
  };

  const setDarkMode = (dark: boolean) => {
    setIsDarkMode(dark);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    updateSettings({ themeMode: mode });
    
    // Apply the mode immediately
    if (mode === 'light') {
      setIsDarkMode(false);
    } else if (mode === 'dark') {
      setIsDarkMode(true);
    } else {
      // Auto mode - check time
      setIsDarkMode(shouldBeDarkBasedOnTime());
    }
  };

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check time every minute if in auto mode
  useEffect(() => {
    if (themeMode !== 'auto') return;

    const checkTime = () => {
      const shouldBeDark = shouldBeDarkBasedOnTime();
      if (shouldBeDark !== isDarkMode) {
        setIsDarkMode(shouldBeDark);
      }
    };

    // Check every minute
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [themeMode, isDarkMode]);

  const value: DarkModeContextType = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    themeMode,
    setThemeMode,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}; 
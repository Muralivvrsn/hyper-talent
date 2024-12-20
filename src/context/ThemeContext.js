import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth();
  const db = getFirestore();

  // Function to get system theme preference
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Function to save theme to local storage
  const saveThemeToLocalStorage = (newTheme) => {
    try {
      localStorage.setItem('theme', newTheme);
    } catch (err) {
      console.error('Error saving theme to localStorage:', err);
    }
  };

  // Function to get theme from local storage
  const getThemeFromLocalStorage = () => {
    try {
      return localStorage.getItem('theme');
    } catch (err) {
      console.error('Error reading theme from localStorage:', err);
      return null;
    }
  };

  // Function to save settings to Firestore
  const saveSettings = async (newSettings) => {
    if (!user) return;
    
    try {
      const userSettingsRef = doc(db, 'settings', user.uid);
      await setDoc(userSettingsRef, newSettings);
      setSettings(newSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
    }
  };

  // Function to set theme
  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    saveThemeToLocalStorage(newTheme);
    
    if (settings) {
      const newSettings = {
        ...settings,
        theme: newTheme
      };
      await saveSettings(newSettings);
    }
  };

  // Apply theme class to document
  useEffect(() => {
    if (!theme) return;
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initialize theme with correct priority order
  useEffect(() => {
    const initializeTheme = async () => {
      setLoading(true);
      
      // 1. Check localStorage first
      const localStorageTheme = getThemeFromLocalStorage();
      if (localStorageTheme) {
        setThemeState(localStorageTheme);
        setLoading(false);
        return;
      }

      // 2. If user is logged in, check database
      if (user) {
        try {
          const userSettingsRef = doc(db, 'settings', user.uid);
          const settingsSnap = await getDoc(userSettingsRef);
          
          if (settingsSnap.exists()) {
            const existingSettings = settingsSnap.data();
            setSettings(existingSettings);
            
            if (existingSettings.theme) {
              setThemeState(existingSettings.theme);
              saveThemeToLocalStorage(existingSettings.theme);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Error reading database theme:', err);
        }
      }

      // 3. Try system theme
      const systemTheme = getSystemTheme();
      setThemeState(systemTheme);
      saveThemeToLocalStorage(systemTheme);
      
      // If user exists but no settings, create them
      if (user) {
        const initialSettings = {
          theme: systemTheme,
          name: user.displayName || '',
          email: user.email || '',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          notifications: true,
          language: 'en'
        };
        await saveSettings(initialSettings);
      }

      setLoading(false);
    };

    initializeTheme();
  }, [user]);

  const value = {
    theme,
    settings,
    loading,
    error,
    setTheme,
    saveSettings
  };

  if (loading || !theme) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
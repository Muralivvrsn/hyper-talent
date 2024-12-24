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

  const getSystemTheme = () => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const handleLocalStorage = {
    save: (newTheme) => {
      try {
        localStorage.setItem('theme', newTheme);
        localStorage.setItem('themeLastUpdated', new Date().toISOString());
      } catch (err) {
        console.error('Error saving theme to localStorage:', err);
      }
    },
    get: () => {
      try {
        return {
          theme: localStorage.getItem('theme'),
          lastUpdated: localStorage.getItem('themeLastUpdated')
        };
      } catch (err) {
        console.error('Error reading theme from localStorage:', err);
        return { theme: null, lastUpdated: null };
      }
    }
  };

  const saveSettings = async (newSettings) => {
    if (!user) return;
    
    try {
      const updatedSettings = {
        ...newSettings,
        lastUpdated: new Date().toISOString()
      };
      
      const userSettingsRef = doc(db, 'settings', user.uid);
      await setDoc(userSettingsRef, updatedSettings);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
      throw err;
    }
  };

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    handleLocalStorage.save(newTheme);

    if (settings && user) {
      try {
        const newSettings = {
          ...settings,
          theme: newTheme
        };
        await saveSettings(newSettings);
      } catch (err) {
        // If database update fails, at least local changes are preserved
        console.error('Error updating theme in database:', err);
      }
    }
  };

  useEffect(() => {
    if (!theme) return;
    
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const initializeTheme = async () => {
      setLoading(true);
      
      try {
        const { theme: localTheme, lastUpdated } = handleLocalStorage.get();
        const systemTheme = getSystemTheme();
        
        // Always fetch initial settings if user is logged in
        if (user) {
          const userSettingsRef = doc(db, 'settings', user.uid);
          const settingsSnap = await getDoc(userSettingsRef);
          
          if (settingsSnap.exists()) {
            const dbSettings = settingsSnap.data();
            setSettings(dbSettings);
            
            // If local storage is more recent, prefer it
            if (localTheme && lastUpdated && new Date(lastUpdated) > new Date(dbSettings.lastUpdated)) {
              setThemeState(localTheme);
              // Sync the local theme back to database
              await saveSettings({ ...dbSettings, theme: localTheme });
            } else {
              setThemeState(dbSettings.theme);
              handleLocalStorage.save(dbSettings.theme);
            }
          } else {
            // Create initial settings for new user
            const initialSettings = {
              theme: localTheme || systemTheme,
              name: user.displayName || '',
              email: user.email || '',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              notifications: true,
              language: 'en'
            };
            await saveSettings(initialSettings);
            setThemeState(initialSettings.theme);
            handleLocalStorage.save(initialSettings.theme);
          }
        } else {
          // For non-logged in users, use local storage or system theme
          setThemeState(localTheme || systemTheme);
          handleLocalStorage.save(localTheme || systemTheme);
        }
      } catch (err) {
        console.error('Error during theme initialization:', err);
        // Fallback to system theme if everything fails
        const fallbackTheme = getSystemTheme();
        setThemeState(fallbackTheme);
        handleLocalStorage.save(fallbackTheme);
      } finally {
        setLoading(false);
      }
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


  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
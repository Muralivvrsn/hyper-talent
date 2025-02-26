import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
          th: localStorage.getItem('theme'),
          ll: localStorage.getItem('themeLastUpdated')
        };
      } catch (err) {
        console.error('Error reading theme from localStorage:', err);
        return { theme: null, ll: null };
      }
    }
  };

  const saveSettings = async (newSettings) => {
    if (!user) return;

    try {
      const updates = {
        th: newSettings.th,
        ll: new Date().toISOString()
      };

      const userSettingsRef = doc(db, 'users_v2', user.uid);
      await updateDoc(userSettingsRef, updates);

      setSettings(prev => ({
        ...prev,
        ...updates
      }));

      return {
        ...settings,
        ...updates
      };
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
          th: newTheme
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

  const getRequiredFields = (user, localTheme, systemTheme) => ({
    av: "",
    ca: new Date().toISOString(),
    d: {
      l: [],
      n: [],
      s: [],
      sd: {
        ca: "",
        id: "",
        ls: "",
      },
    },
    e: user?.email || '',
    lg: 'en',
    ll: new Date().toISOString(),
    n: user?.displayName || '',
    ne: true,
    p: "free",
    pe: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    t: [],
    th: localTheme || systemTheme,
  });

  useEffect(() => {
    const initializeTheme = async () => {
      setLoading(true);

      try {
        const { th: localTheme, ll } = handleLocalStorage.get();
        const systemTheme = getSystemTheme();

        // Always fetch initial User Data if user is logged in
        if (user) {
          const userSettingsRef = doc(db, 'users_v2', user.uid);
          const settingsSnap = await getDoc(userSettingsRef);

          if (settingsSnap.exists()) {
            const dbSettings = settingsSnap.data();

            // Get required fields using the function
            const requiredFields = getRequiredFields(user, localTheme, systemTheme);

            // Deep merge function to preserve existing data while adding missing fields
            const mergeDeep = (target, source) => {
              const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);

              if (!isObject(target) || !isObject(source)) {
                return source;
              }

              const output = { ...target };

              Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                  if (!(key in target)) {
                    output[key] = source[key];
                  } else {
                    output[key] = mergeDeep(target[key], source[key]);
                  }
                } else if (!(key in target)) {
                  output[key] = source[key];
                }
              });

              return output;
            };

            // Merge existing settings with required fields, only adding what's missing
            const updatedSettings = mergeDeep(dbSettings, requiredFields);

            // Check if we needed to add any missing fields
            if (JSON.stringify(updatedSettings) !== JSON.stringify(dbSettings)) {
              // Only update if there were actually missing fields
              await setDoc(userSettingsRef, updatedSettings);
            }

            setSettings(updatedSettings);

            // If local storage is more recent, prefer it
            if (localTheme && ll && new Date(ll) > new Date(updatedSettings.ll || 0)) {
              setThemeState(localTheme);
              // Sync the local theme back to database
              await saveSettings({ ...updatedSettings, th: localTheme });
            } else {
              setThemeState(updatedSettings.th || systemTheme);
              handleLocalStorage.save(updatedSettings.th || systemTheme);
            }
          } else {
            // Create initial settings for new user
            const initialSettings = getRequiredFields(user, localTheme, systemTheme);

            // Create new document for first-time user
            await setDoc(userSettingsRef, initialSettings);
            setSettings(initialSettings);
            setThemeState(initialSettings.th);
            handleLocalStorage.save(initialSettings.th);
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
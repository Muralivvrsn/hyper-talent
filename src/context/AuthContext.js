import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticating, setAuthenticating] = useState(false);
  const chrome = window.chrome

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {
        // If no Firebase user, check chrome identity
        try {
          const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
          if (response.token) {
            // If we have a token, sign in with Firebase
            setAuthenticating(true);
            const credential = GoogleAuthProvider.credential(null, response.token);
            const userCredential = await signInWithCredential(auth, credential);
            setUser(userCredential.user);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          setError(error.message);
          setUser(null);
        } finally {
          setLoading(false);
          setAuthenticating(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setAuthenticating(true);
    setError(null);
    
    try {
      const result = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ 
          interactive: true
        }, async function(token) {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          try {
            // Store token in background script
            await chrome.runtime.sendMessage({ type: 'STORE_TOKEN', token });

            // Get user profile
            const userResponse = await fetch(
              'https://www.googleapis.com/oauth2/v3/userinfo',
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (!userResponse.ok) {
              throw new Error('Failed to get user info');
            }

            // Sign in with Firebase
            const credential = GoogleAuthProvider.credential(null, token);
            const result = await signInWithCredential(auth, credential);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });

      setUser(result.user);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setUser(null);
    } finally {
      setAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      setAuthenticating(true); // Show loading state
      const response = await chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' });
      if (!response.success) {
        throw new Error(response.error || 'Failed to clear token');
      }
      await signOut(auth);
      setUser(null);
      // chrome.runtime.reload();
      chrome.storage.local.clear();
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
    } finally {
      setAuthenticating(false); // Hide loading state
    }
  };

  const value = {
    user,
    loading,
    error,
    authenticating,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
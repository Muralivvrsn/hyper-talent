import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const storage = getStorage(app);
const db = getFirestore(app);

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
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authenticating, setAuthenticating] = useState(false);
  const chrome = window.chrome;

  // Listen for Firebase auth state changes and update user data
  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Subscribe to user data changes
        unsubscribeUser = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setUserData({
                name: data.n || '',
                email: data.e || '',
                avatar: data.av || '',
                createdAt: data.ca || null,
                lastLogin: data.ll || null,
                theme: data.th || 'light',
                language: data.lg || 'en',
                notifications: data.ne || false,
                plan: data.p || 'free',
                planExpiry: data.pe || null,
                labelIds: data.d?.l || [],
                noteIds: data.d?.n || [],
                shortcutIds: data.d?.s || [],
                sharedLabels: data.d?.sl || [],
                spreadsheet: {
                  id: data.sd?.id || null,
                  createdAt: data.sd?.ca || null,
                  lastSynced: data.sd?.ls || null
                }
              });
            }
          },
          (error) => {
            console.error('Error fetching user data:', error);
            setError(error.message);
          }
        );

        setLoading(false);
      } else {
        // Check chrome identity
        try {
          const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
          if (response.token) {
            setAuthenticating(true);
            const credential = GoogleAuthProvider.credential(null, response.token);
            const userCredential = await signInWithCredential(auth, credential);
            setUser(userCredential.user);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          setError(error.message);
          setUser(null);
          setUserData(null);
        } finally {
          setLoading(false);
          setAuthenticating(false);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
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

  const addUpdate = async () => {
    const db = getFirestore();
    await setDoc(doc(db, 'updates', '1.3.9'), {
      version: '1.3.9',
      releaseDate: new Date(),
      features: [
        'Added keyboard shortcuts for navigation',
        'Implemented dark mode support'
      ],
      bugs: [
        'Fixed message loading issues',
        'Resolved notification sync problems'
      ],
      suggestions: [
        'Added ability to star messages (suggested by @user123)'
      ]
    });
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
    userData,
    loading,
    error,
    authenticating,
    login,
    logout,
    addUpdate
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
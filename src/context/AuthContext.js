import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
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

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file'
];

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

  const verifyTokenScopes = async (token) => {
    try {
      console.log('Verifying token scopes...');
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`
      );
      console.log(response)
      if (!response.ok) {
        console.error('Token verification failed:', response.status);
        return false;
      }



      const data = await response.json();
      // console.log(data)
      console.log('Token info:', data);

      if (!data.scope) {
        console.error('No scopes found in token');
        return false;
      }

      const grantedScopes = data.scope.split(' ');
      console.log('Granted scopes:', grantedScopes);
      console.log('Required scopes:', REQUIRED_SCOPES);

      const hasAllScopes = REQUIRED_SCOPES.every(scope => grantedScopes.includes(scope));
      console.log('Has all required scopes:', hasAllScopes);
      
      return hasAllScopes;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  // Force interactive auth
  const getAuthToken = async (interactive = true) => {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ 
        interactive: interactive,
        scopes: REQUIRED_SCOPES
      }, async (token) => {
        if (chrome.runtime.lastError) {
          console.error('getAuthToken error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        console.log('Got auth token:', token ? 'token-exists' : 'no-token');
        resolve(token);
      });
    });
  };

  const refreshToken = async (oldToken) => {
    console.log('Refreshing token...');
    try {
      // Remove the old token
      if (oldToken) {
        console.log('Removing old token...');
        await chrome.identity.removeCachedAuthToken({ token: oldToken });
        
        // Revoke old token
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${oldToken}`);
      }

      // Clear all cached tokens to be sure
      await new Promise(resolve => chrome.identity.clearAllCachedAuthTokens(resolve));
      
      // Get new token with interactive auth
      console.log('Getting new token...');
      const newToken = await getAuthToken(true);
      
      if (!newToken) {
        throw new Error('Failed to get new token');
      }

      // Verify new token
      const hasValidScopes = await verifyTokenScopes(newToken);
      if (!hasValidScopes) {
        throw new Error('New token does not have required scopes');
      }

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    let unsubscribeUser = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'user-exists' : 'no-user');
      
      if (firebaseUser) {
        try {
          const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
          console.log('GET_GOOGLE_TOKEN response:', response);

          if (!response.token) {
            console.log('No token found, getting new token...');
            try {
              const newToken = await getAuthToken(true);
              if (newToken) {
                await chrome.runtime.sendMessage({ type: 'STORE_TOKEN', token: newToken });
              }
            } catch (error) {
              console.error('Failed to get new token:', error);
              await logout();
              return;
            }
          } else {
            // Verify existing token
            const hasValidScopes = await verifyTokenScopes(response.token);
            if (!hasValidScopes) {
              console.log('Token missing required scopes, refreshing...');
              try {
                const newToken = await refreshToken(response.token);
                await chrome.runtime.sendMessage({ type: 'STORE_TOKEN', token: newToken });
              } catch (error) {
                console.error('Token refresh failed:', error);
                await logout();
                setError('Please login again to grant necessary permissions');
                return;
              }
            }
          }

          setUser(firebaseUser);
          
          // Subscribe to user data
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
        } catch (error) {
          console.error('Auth state change error:', error);
          await logout();
          return;
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const login = async () => {
    console.log('Starting login process...');
    setAuthenticating(true);
    setError(null);
    
    try {
      // Always force interactive auth
      const token = await getAuthToken(true);
      console.log('Login: Got token');

      // Verify token has correct scopes
      const hasValidScopes = await verifyTokenScopes(token);
      if (!hasValidScopes) {
        console.log('Login: Token missing scopes, refreshing...');
        const newToken = await refreshToken(token);
        token = newToken;
      }

      // Store token
      console.log('Login: Storing token...');
      await chrome.runtime.sendMessage({ type: 'STORE_TOKEN', token });

      // Sign in with Firebase
      console.log('Login: Signing in to Firebase...');
      const credential = GoogleAuthProvider.credential(null, token);
      const userCredential = await signInWithCredential(auth, credential);
      setUser(userCredential.user);
      
      console.log('Login completed successfully');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setUser(null);
      
      // Clean up on error
      try {
        await logout();
      } catch (logoutError) {
        console.error('Logout error during cleanup:', logoutError);
      }
    } finally {
      setAuthenticating(false);
    }
  };

  const logout = async () => {
    console.log('Starting logout process...');
    try {
      setAuthenticating(true);
      
      const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
      if (response.token) {
        // Remove token from Chrome's cache
        await chrome.identity.removeCachedAuthToken({ token: response.token });
        
        // Revoke token
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${response.token}`);
      }
      
      // Clear cached tokens
      await new Promise(resolve => chrome.identity.clearAllCachedAuthTokens(resolve));
      
      // Clear token from background script
      await chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' });
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear states
      setUser(null);
      setUserData(null);
      
      // Clear storage
      await chrome.storage.local.clear();
      
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
    } finally {
      setAuthenticating(false);
    }
  };

  const value = {
    user,
    userData,
    loading,
    error,
    authenticating,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
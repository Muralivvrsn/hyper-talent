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

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file'
];

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

const formatUserProfile = (profileData) => ({
  name: profileData.n || '',
  email: profileData.e || '',
  avatar: profileData.av || '',
  createdAt: profileData.ca || null,
  lastLogin: profileData.ll || null,
  theme: profileData.th || 'light',
  language: profileData.lg || 'en',
  notifications: profileData.ne || false,
  plan: profileData.p || 'free',
  planExpiry: profileData.pe || null,
  data: {
    labelIds: profileData.d?.l || [],
    noteIds: profileData.d?.n || [],
    shortcutIds: profileData.d?.s || [],
    sharedLabels: profileData.d?.sl || []
  },
  spreadsheet: {
    id: profileData.sd?.id || null,
    createdAt: profileData.sd?.ca || null,
    lastSynced: profileData.sd?.ls || null
  }
});

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    userProfile: null,
    isLoading: true,
    error: null,
    isAuthenticating: false
  });

  const chrome = window.chrome;

  const fetchAuthToken = async () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        if (response.success && response.token) {
          resolve(response.token);
        } else {
          reject(new Error(response.error || 'Token fetch failed'));
        }
      });
    });
  };

  const updateUserProfile = (snapshot) => {
    if (snapshot.exists()) {
      const formattedProfile = formatUserProfile(snapshot.data());
      setAuthState(prev => ({ 
        ...prev, 
        userProfile: formattedProfile,
        isLoading: false 
      }));
    } else {
      setAuthState(prev => ({ 
        ...prev, 
        userProfile: null,
        isLoading: false 
      }));
    }
  };

  useEffect(() => {
    let profileUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          try {
            await fetchAuthToken();
          } catch (error) {
            await handleSignOut();
            return;
          }

          setAuthState(prev => ({ 
            ...prev, 
            user: firebaseUser,
            error: null
          }));

          profileUnsubscribe = onSnapshot(
            doc(db, 'users', firebaseUser.uid),
            updateUserProfile,
            () => handleSignOut()
          );
        } else {
          setAuthState(prev => ({ 
            ...prev,
            user: null,
            userProfile: null,
            isLoading: false,
            error: null
          }));
        }
      } catch {
        await handleSignOut();
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) {
        profileUnsubscribe();
      }
    };
  }, []);

  const handleSignIn = async () => {
    setAuthState(prev => ({ 
      ...prev, 
      isAuthenticating: true, 
      isLoading: true,
      error: null 
    }));

    try {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
      const redirectUri = chrome.identity.getRedirectURL();
      
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', OAUTH_SCOPES.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent');

      const authCode = await new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
          url: authUrl.toString(),
          interactive: true
        }, (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            reject(new Error(chrome.runtime.lastError?.message || 'Authorization failed'));
            return;
          }
          const code = new URL(redirectUrl).searchParams.get('code');
          if (!code) {
            reject(new Error('No authorization code received'));
            return;
          }
          resolve(code);
        });
      });

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: authCode,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed');
      }

      const { access_token, refresh_token, expires_in } = await tokenResponse.json();

      await Promise.all([
        chrome.storage.local.set({
          clientId,
          clientSecret
        }),
        chrome.runtime.sendMessage({ 
          type: 'STORE_TOKEN', 
          token: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in 
        })
      ]);

      const credential = GoogleAuthProvider.credential(null, access_token);
      await signInWithCredential(auth, credential);

    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Authentication failed',
        isAuthenticating: false ,
        isLoading: false,
      }));
      await handleSignOut();
    } finally {
      setAuthState(prev => ({ 
        ...prev, 
        isAuthenticating: false ,
        isLoading: false,
      }));
    }
  };

  const handleSignOut = async () => {
    setAuthState(prev => ({ 
      ...prev, 
      isAuthenticating: true,
      error: null 
    }));

    try {
      await Promise.all([
        chrome.runtime.sendMessage({ type: 'CLEAR_TOKEN' }),
        signOut(auth),
        chrome.storage.local.clear(),
        new Promise(resolve => {
          localStorage.clear();
          sessionStorage.clear();
          resolve();
        })
      ]);

      setAuthState({
        user: null,
        userProfile: null,
        isLoading: false,
        error: null,
        isAuthenticating: false
      });
    } catch {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Sign out failed',
        isAuthenticating: false 
      }));
    }
  };

  const contextValue = {
    user: authState.user,
    userProfile: authState.userProfile,
    isLoading: authState.isLoading,
    error: authState.error,
    isAuthenticating: authState.isAuthenticating,
    signIn: handleSignIn,
    signOut: handleSignOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
// services/firebase.js
let db = null;
let auth = null;
let currentUser = null;
let tokenExpiryTime = null;

// Token refresh interval (1 hour before expiry)
const REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes

async function getGoogleToken() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' }, response => {
      if (response.success) {
        // Set token expiry time (Google tokens typically last 1 hour)
        tokenExpiryTime = Date.now() + (60 * 60 * 1000);
        resolve(response.token);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

async function refreshAuthState() {
  try {
    const token = await getGoogleToken();
    const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
    const userCredential = await auth.signInWithCredential(credential);
    currentUser = userCredential.user;
    return currentUser;
  } catch (error) {
    console.error('Failed to refresh auth state:', error);
    throw error;
  }
}

// Set up auto-refresh of authentication
function setupAuthRefresh() {
  setInterval(async () => {
    if (Date.now() > tokenExpiryTime - (5 * 60 * 1000)) { // Refresh 5 minutes before expiry
      try {
        await refreshAuthState();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }
  }, 60000); // Check every minute
}

async function initializeFirebase() {
  try {
    // If we have valid authentication and it's not close to expiring, return existing instances
    if (db && auth && currentUser && Date.now() < tokenExpiryTime - (5 * 60 * 1000)) {
      return { db, auth, currentUser };
    }

    // If Firebase isn't initialized yet, initialize it
    if (!firebase.apps?.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyBFggUUWmz6H53hxr-jL00tGDYr9x4DQg4",
        authDomain: "hyper-75b53.firebaseapp.com",
        projectId: "hyper-75b53"
      });
    }

    // Initialize auth and db if they don't exist
    if (!auth) {
      auth = firebase.auth();
    }
    if (!db) {
      db = firebase.firestore();
    }

    // Always refresh auth state when initializing
    await refreshAuthState();

    // Set up automatic refresh if not already set up
    setupAuthRefresh();

    return { db, auth, currentUser };
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    // Don't null out db and auth on error, they might still be valid
    // Only null out currentUser as it's definitely invalid
    currentUser = null;
    throw error;
  }
}

// Add listener for tab visibility changes
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && currentUser) {
    // Check and refresh auth when tab becomes visible
    try {
      if (Date.now() > tokenExpiryTime - (5 * 60 * 1000)) {
        await refreshAuthState();
      }
    } catch (error) {
      console.error('Visibility change refresh failed:', error);
    }
  }
});

// Export to window object for global access
window.firebaseService = {
  initializeFirebase,
  getGoogleToken
};
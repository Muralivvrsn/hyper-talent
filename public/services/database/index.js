class FirebaseService {
    constructor() {
        // console.log('[FirebaseService] Initializing service');
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.tokenExpiryTime = null;
        this.REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes
        this.authStateListeners = new Set();
        this.dbRefreshListeners = new Set();
        this.initialize()
        // Bind the handler to preserve context
        this._handleVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
        // console.log('[FirebaseService] Visibility change listener registered');
    }

    addAuthStateListener(callback) {
        if (typeof callback !== 'function') {
            // console.error('[FirebaseService] Invalid auth state listener callback');
            return;
        }
        // console.log('[FirebaseService] Adding auth state listener');
        this.authStateListeners.add(callback);
        
        if (this.currentUser) {
            // console.log('[FirebaseService] Calling new listener with current user');
            callback(this.currentUser);
        }
    }

    removeAuthStateListener(callback) {
        // console.log('[FirebaseService] Removing auth state listener');
        this.authStateListeners.delete(callback);
    }

    addDbRefreshListener(callback) {
        if (typeof callback !== 'function') {
            // console.error('[FirebaseService] Invalid db refresh listener callback');
            return;
        }
        // console.log('[FirebaseService] Adding db refresh listener');
        this.dbRefreshListeners.add(callback);
        
        if (this.db) {
            // console.log('[FirebaseService] Calling new listener with current db');
            callback(this.db);
        }
    }

    removeDbRefreshListener(callback) {
        // console.log('[FirebaseService] Removing db refresh listener');
        this.dbRefreshListeners.delete(callback);
    }

    notifyAuthStateListeners() {
 
        
        this.authStateListeners.forEach(callback => {
            try {
                callback(this.currentUser);
            } catch (error) {
                // console.error('[FirebaseService] Error in auth state listener:', error);
            }
        });
    }

    notifyDbRefreshListeners() {

        
        this.dbRefreshListeners.forEach(callback => {
            try {
                callback(this.db);
            } catch (error) {
                // console.error('[FirebaseService] Error in db refresh listener:', error);
            }
        });
    }

    async getGoogleToken() {
        // console.log('[FirebaseService] Requesting Google token');
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' }, response => {
                if (response.success) {
                    this.tokenExpiryTime = Date.now() + (60 * 60 * 1000); // 1 hour
                    
                    resolve(response.token);
                } else {
                    // console.error('[FirebaseService] Failed to get Google token:', response.error);
                    reject(new Error(response.error));
                }
            });
        });
    }

    async refreshAuthState() {
        // console.log('[FirebaseService] Refreshing auth state');
        try {
            const token = await this.getGoogleToken();
            // console.log(token)
            const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
            // console.log(this.auth)
            const userCredential = await this.auth.signInWithCredential(credential);
            this.currentUser = userCredential.user;
            // console.log('[FirebaseService] Auth state refreshed successfully');
            this.notifyAuthStateListeners();
            return this.currentUser;
        } catch (error) {
            // console.error('[FirebaseService] Failed to refresh auth state:', error);
            this.currentUser = null;
            throw error;
        }
    }

    setupAuthRefresh() {
        if (this._refreshInterval) {
            // console.log('[FirebaseService] Clearing existing refresh interval');
            clearInterval(this._refreshInterval);
        }

        // console.log('[FirebaseService] Setting up auth refresh interval');
        this._refreshInterval = setInterval(async () => {
            const timeToExpiry = this.tokenExpiryTime - Date.now();
            if (timeToExpiry < 5 * 60 * 1000) { // Less than 5 minutes until expiry
                // console.log('[FirebaseService] Token expiring soon, refreshing auth');
                try {
                    await this.refreshAuthState();
                    this.notifyDbRefreshListeners();
                } catch (error) {
                    // console.error('[FirebaseService] Auto-refresh failed:', error);
                }
            }
        }, 60000); // Check every minute
    }

    async handleVisibilityChange() {
        // console.log('[FirebaseService] Visibility changed:', document.visibilityState);
        if (document.visibilityState === 'visible' && this.currentUser) {
            const timeToExpiry = this.tokenExpiryTime - Date.now();

            
            try {
                if (timeToExpiry < 5 * 60 * 1000) {
                    // console.log('[FirebaseService] Refreshing auth on visibility change');
                    await this.refreshAuthState();
                    this.notifyDbRefreshListeners();
                }
            } catch (error) {
                // console.error('[FirebaseService] Visibility change refresh failed:', error);
            }
        }
    }

    async initialize() {
        // console.log('[FirebaseService] Initializing Firebase');
        try {
            // Check if we have valid initialized state
            if (this.isInitialized() && 
                Date.now() < this.tokenExpiryTime - (5 * 60 * 1000)) {
                // console.log('[FirebaseService] Already initialized with valid token');
                return { db: this.db, auth: this.auth, currentUser: this.currentUser };
            }

            // Initialize Firebase app if needed
            if (!firebase.apps?.length) {
                // console.log('[FirebaseService] Initializing Firebase app');
                firebase.initializeApp({
                    apiKey: "AIzaSyBFggUUWmz6H53hxr-jL00tGDYr9x4DQg4",
                    authDomain: "hyper-75b53.firebaseapp.com",
                    projectId: "hyper-75b53"
                });
            }

            // Initialize auth if needed
            if (!this.auth) {
                // console.log('[FirebaseService] Initializing Firebase auth');
                this.auth = firebase.auth();
                this.auth.onAuthStateChanged((user) => {
                    // console.log('[FirebaseService] Auth state changed:', !!user);
                    this.currentUser = user;
                    this.notifyAuthStateListeners();
                });
            }
            
            // Initialize Firestore if needed
            if (!this.db) {
                // console.log('[FirebaseService] Initializing Firestore');
                this.db = firebase.firestore();
                this.notifyDbRefreshListeners();
            }

            // Refresh auth state and setup refresh interval
            await this.refreshAuthState();
            this.setupAuthRefresh();

            // console.log('[FirebaseService] Initialization complete');
            return { db: this.db, auth: this.auth, currentUser: this.currentUser };
        } catch (error) {
            // console.error('[FirebaseService] Firebase initialization failed:', error);
            this.currentUser = null;
            throw error;
        }
    }

    isInitialized() {
        const initialized = !!(this.db && this.auth && this.currentUser);
        // console.log('[FirebaseService] Initialization status:', initialized);
        return initialized;
    }

    destroy() {
        // console.log('[FirebaseService] Destroying service');
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
            // console.log('[FirebaseService] Cleared refresh interval');
        }
        
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
        // console.log('[FirebaseService] Removed visibility change listener');
        
        this.authStateListeners.clear();
        this.dbRefreshListeners.clear();
        // console.log('[FirebaseService] Cleared all listeners');
        
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.tokenExpiryTime = null;
    }
}

window.firebaseService = new FirebaseService();

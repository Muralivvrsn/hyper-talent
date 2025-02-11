class FirebaseService {
    constructor() {
        // Core services
        this.db = null;
        this.auth = null;
        this.currentUser = null;

        // Listeners
        this.authStateListeners = new Set();

        // Auth refresh control
        this.lastRefreshTime = 0;
        this.refreshInProgress = false;
        this.REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
        this.refreshTimer = null;

        // Bind token refresh handler
        this._handleTokenRefresh = this._handleTokenRefresh.bind(this);
        
        // Add token refresh listener
        chrome.runtime.onMessage.addListener(this._handleTokenRefresh);
        
        // Initialize
        this.initialize().catch(error => {
            console.error('[FirebaseService] Initialization failed:', error);
        });
    }

    addAuthStateListener(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.add(callback);
            if (this.currentUser) {
                callback(this.currentUser);
            }
        }
    }

    removeAuthStateListener(callback) {
        this.authStateListeners.delete(callback);
    }

    _notifyListeners(data) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('[FirebaseService] Listener notification failed:', error);
            }
        });
    }

    async _getGoogleToken() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' }, response => {
                if (response?.success && response.token) {
                    resolve(response.token);
                } else {
                    reject(new Error(response?.error || 'Failed to get token'));
                }
            });
        });
    }

    async _handleTokenRefresh(message, sender, sendResponse) {
        if (message.type === 'TOKEN_REFRESHED' && message.token) {
            try {
                const now = Date.now();
                if (now - this.lastRefreshTime >= this.REFRESH_INTERVAL) {
                    await this.refreshAuthState(message.token);
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: true, message: 'Refresh skipped - too soon' });
                }
            } catch (error) {
                console.error('[FirebaseService] Auth refresh failed:', error);
                sendResponse({ success: false, error: error.message });
            }
        }
    }

    scheduleNextRefresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        this.refreshTimer = setTimeout(async () => {
            try {
                await this.refreshAuthState();
                this.scheduleNextRefresh();
            } catch (error) {
                console.error('[FirebaseService] Scheduled refresh failed:', error);
                // Retry in 5 minutes if failed
                setTimeout(() => this.scheduleNextRefresh(), 5 * 60 * 1000);
            }
        }, this.REFRESH_INTERVAL);
    }

    async refreshAuthState(token) {
        const now = Date.now();
        
        if (this.refreshInProgress || (now - this.lastRefreshTime < this.REFRESH_INTERVAL)) {
            return this.currentUser;
        }

        try {
            this.refreshInProgress = true;
            const accessToken = token || await this._getGoogleToken();
            const credential = firebase.auth.GoogleAuthProvider.credential(null, accessToken);
            const userCredential = await this.auth.signInWithCredential(credential);
            
            this.lastRefreshTime = now;
            this.currentUser = userCredential.user;
            this._notifyListeners(this.currentUser);
            return this.currentUser;
        } catch (error) {
            this.currentUser = null;
            throw error;
        } finally {
            this.refreshInProgress = false;
        }
    }

    async initialize() {
        try {
            if (!firebase.apps?.length) {
                firebase.initializeApp({
                    apiKey: "AIzaSyBFggUUWmz6H53hxr-jL00tGDYr9x4DQg4",
                    authDomain: "hyper-75b53.firebaseapp.com",
                    projectId: "hyper-75b53"
                });
            }

            if (!this.auth) {
                this.auth = firebase.auth();
                this.auth.onAuthStateChanged(user => {
                    this.currentUser = user;
                    this._notifyListeners(user);
                });
            }
            
            if (!this.db) {
                this.db = firebase.firestore();
            }

            // Initial auth state refresh
            await this.refreshAuthState();
            
            // Schedule next refresh
            this.scheduleNextRefresh();
            
            return {
                db: this.db,
                auth: this.auth,
                currentUser: this.currentUser
            };
        } catch (error) {
            this.currentUser = null;
            throw error;
        }
    }

    isInitialized() {
        return !!(this.db && this.auth && this.currentUser);
    }

    destroy() {
        // Clear refresh timer
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }

        // Remove message listener
        chrome.runtime.onMessage.removeListener(this._handleTokenRefresh);
        
        // Clear auth listeners
        this.authStateListeners.clear();
        
        // Clear services
        this.db = null;
        this.auth = null;
        this.currentUser = null;
    }
}

// Prevent multiple instances
if (!window.firebaseService) {
    window.firebaseService = new FirebaseService();
}
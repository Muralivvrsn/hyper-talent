class FirebaseService {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.tokenExpiryTime = null;
        this.REFRESH_INTERVAL = 55 * 60 * 1000;
        this.authStateListeners = new Set();
        this.dbRefreshListeners = new Set();
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    addAuthStateListener(callback) {
        this.authStateListeners.add(callback);
        if (this.currentUser) {
            callback(this.currentUser);
        }
    }

    removeAuthStateListener(callback) {
        this.authStateListeners.delete(callback);
    }

    addDbRefreshListener(callback) {
        this.dbRefreshListeners.add(callback);
        if (this.db) {
            callback(this.db);
        }
    }

    removeDbRefreshListener(callback) {
        this.dbRefreshListeners.delete(callback);
    }
    notifyAuthStateListeners() {
        this.authStateListeners.forEach(callback => {
            try {
                callback(this.currentUser);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    notifyDbRefreshListeners() {
        this.dbRefreshListeners.forEach(callback => {
            try {
                callback(this.db);
            } catch (error) {
                console.error('Error in db refresh listener:', error);
            }
        });
    }

    async getGoogleToken() {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' }, response => {
                if (response.success) {
                    this.tokenExpiryTime = Date.now() + (60 * 60 * 1000);
                    resolve(response.token);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    async refreshAuthState() {
        try {
            const token = await this.getGoogleToken();
            const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
            const userCredential = await this.auth.signInWithCredential(credential);
            this.currentUser = userCredential.user;
            this.notifyAuthStateListeners();
            return this.currentUser;
        } catch (error) {
            console.error('Failed to refresh auth state:', error);
            throw error;
        }
    }

    setupAuthRefresh() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
        }

        this._refreshInterval = setInterval(async () => {
            if (Date.now() > this.tokenExpiryTime - (5 * 60 * 1000)) {
                try {
                    await this.refreshAuthState();
                    this.notifyDbRefreshListeners();
                } catch (error) {
                    console.error('Auto-refresh failed:', error);
                }
            }
        }, 60000);
    }

    async handleVisibilityChange() {
        if (document.visibilityState === 'visible' && this.currentUser) {
            try {
                if (Date.now() > this.tokenExpiryTime - (5 * 60 * 1000)) {
                    await this.refreshAuthState();
                    this.notifyDbRefreshListeners();
                }
            } catch (error) {
                console.error('Visibility change refresh failed:', error);
            }
        }
    }

    async initialize() {
        try {
            if (this.db && this.auth && this.currentUser && 
                Date.now() < this.tokenExpiryTime - (5 * 60 * 1000)) {
                return { db: this.db, auth: this.auth, currentUser: this.currentUser };
            }

            if (!firebase.apps?.length) {
                firebase.initializeApp({
                    apiKey: "AIzaSyBFggUUWmz6H53hxr-jL00tGDYr9x4DQg4",
                    authDomain: "hyper-75b53.firebaseapp.com",
                    projectId: "hyper-75b53"
                });
            }

            if (!this.auth) {
                this.auth = firebase.auth();
                this.auth.onAuthStateChanged((user) => {
                    this.currentUser = user;
                    this.notifyAuthStateListeners();
                });
            }
            
            if (!this.db) {
                this.db = firebase.firestore();
                this.notifyDbRefreshListeners();
            }

            await this.refreshAuthState();
            this.setupAuthRefresh();

            return { db: this.db, auth: this.auth, currentUser: this.currentUser };
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.currentUser = null;
            throw error;
        }
    }
    isInitialized() {
        return !!(this.db && this.auth && this.currentUser);
    }

    destroy() {
        if (this._refreshInterval) {
            clearInterval(this._refreshInterval);
        }
        this.authStateListeners.clear();
        this.dbRefreshListeners.clear();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}

window.firebaseService = new FirebaseService();
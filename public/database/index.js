class FirebaseService {
    constructor() {
        // Core services
        this.auth = null;
        this.currentUser = null;
        this.db = null;
        this.status = null; // Start with no status
        this.refreshInterval = null;

        // Listeners
        this.authStateListeners = new Set();

        // Bind handlers
        this._handleBackgroundMessages = this._handleBackgroundMessages.bind(this);
        
        // Add message listener
        chrome.runtime.onMessage.addListener(this._handleBackgroundMessages);

        // Initialize
        this.initialize().catch(error => {
            console.error('[FirebaseService] Initialization failed:', error);
            this._updateStatus('logged_out');
        });
    }

    addAuthStateListener(callback) {
        if (typeof callback === 'function') {
            this.authStateListeners.add(callback);
            // Only notify if we have a status
            if (this.status) {
                callback({
                    type: 'status',
                    status: this.status,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    removeAuthStateListener(callback) {
        this.authStateListeners.delete(callback);
    }

    _notifyListeners(status) {
        console.log('auth')
        console.log(status)
        this.authStateListeners.forEach(callback => {
            try {
                callback({
                    type: 'status',
                    status: status,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('[FirebaseService] Listener notification failed:', error);
            }
        });
    }

    _updateStatus(newStatus) {
        // Only update and notify if status actually changed
        if (this.status !== newStatus) {
            this.status = newStatus;
            this._notifyListeners(newStatus);
        }
    }

    _handleBackgroundMessages(message, sender, sendResponse) {
        switch (message.type) {
            case 'LOGGED_OUT':
                this._handleLoggedOut();
                break;
            case 'LOGGED_IN':
                this.initialize();
        }
        sendResponse({ received: true });
        return true;
    }

    _handleLoggedOut() {
        this.stopTokenRefresh();
        this._updateStatus('logged_out');
        this.currentUser = null;
        if (this.auth) {
            this.auth.signOut().catch(error => {
                console.error('[FirebaseService] Sign out failed:', error);
            });
        }
    }

    async _verifyToken(token) {
        try {
            const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
            const userCredential = await this.auth.signInWithCredential(credential);
            this.currentUser = userCredential.user;
            console.log(userCredential.user)
            return true;
        } catch (error) {
            console.error('[FirebaseService] Token verification failed:', error);
            return false;
        }
    }

    async initialize() {
        try {
            // Initialize Firebase if not already initialized
            if (!firebase.apps?.length) {
                firebase.initializeApp({
                    apiKey: "AIzaSyBFggUUWmz6H53hxr-jL00tGDYr9x4DQg4",
                    authDomain: "hyper-75b53.firebaseapp.com",
                    projectId: "hyper-75b53"
                });
            }

            // Initialize auth
            this.auth = firebase.auth();
            this.db = firebase.firestore();

            // Request token
            const response = await chrome.runtime.sendMessage({ type: 'GET_TOKEN' });

            if (response.type === 'logged_in' && response.data?.accessToken) {
                // First set to in_progress while verifying
                // this._updateStatus('in_progress');
                
                // Verify token with Firebase
                const isValid = await this._verifyToken(response.data.accessToken);
                if (isValid) {
                    this._updateStatus('logged_in');
                    this.startTokenRefresh();
                } else {
                    this._updateStatus('logged_out');
                }
            } else {
                this._updateStatus('logged_out');
            }

        } catch (error) {
            console.error('[FirebaseService] Initialization failed:', error);
            this._updateStatus('logged_out');
            throw error;
        }
    }

    startTokenRefresh() {
        // Clear any existing refresh interval
        this.stopTokenRefresh();
        
        // Set up new refresh interval (45 minutes)
        this.refreshInterval = setInterval(async () => {
            try {
                const response = await chrome.runtime.sendMessage({ type: 'GET_TOKEN' });
                
                if (response.type === 'logged_in' && response.data?.accessToken) {
                    const isValid = await this._verifyToken(response.data.accessToken);
                    if (!isValid) {
                        this._handleLoggedOut();
                    }
                } else {
                    this._handleLoggedOut();
                }
            } catch (error) {
                console.error('[FirebaseService] Token refresh failed:', error);
                this._handleLoggedOut();
            }
        }, 45 * 60 * 1000);
    }

    stopTokenRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.stopTokenRefresh();
        chrome.runtime.onMessage.removeListener(this._handleBackgroundMessages);
        this.authStateListeners.clear();
        this.auth = null;
        this.db = null;  // Clear db reference
        this.currentUser = null;
        const wasLoggedIn = this.status === 'logged_in';
        this.status = null;
        if (wasLoggedIn) {
            this._notifyListeners('logged_out');
        }
    }
}

// Prevent multiple instances
if (!window.firebaseService) {
    window.firebaseService = new FirebaseService();
}
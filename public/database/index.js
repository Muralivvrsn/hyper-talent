class FirebaseService {
    constructor() {
        // Core services
        this.auth = null;
        this.currentUser = null;
        this.db = null;
        this.status = null; // Start with no status
        this.refreshInterval = null;
        this.lastSentStatus = null; // Track the last sent status

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
            // Only notify if we have a status and it's different from the last sent status
            if (this.status && this.status !== this.lastSentStatus) {
                callback({
                    type: 'status',
                    status: this.status,
                    timestamp: new Date().toISOString()
                });
                this.lastSentStatus = this.status;
            }
        }
    }

    removeAuthStateListener(callback) {
        this.authStateListeners.delete(callback);
    }

    _notifyListeners(status) {
        // Only notify if the status is different from the last sent status
        if (status !== this.lastSentStatus) {
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
            this.lastSentStatus = status;
        }
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
            console.log(credential)
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

            // console.log(firebase)

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

    async callCloudFunction(functionName, data) {
        try {
            // Check if we're initialized and logged in
            if (!this.db || this.status !== 'logged_in') {
                // console.log('[FirebaseService] Not logged in, waiting for 10 seconds...');

                // Create a promise that will wait for login or timeout after 10 seconds
                const loginWaitResult = await Promise.race([
                    // Wait for login status to change
                    new Promise(resolve => {
                        const checkInterval = setInterval(() => {
                            if (this.db && this.status === 'logged_in') {
                                clearInterval(checkInterval);
                                resolve(true);
                            }
                        }, 500); // Check every 500ms
                    }),
                    // Timeout after 10 seconds
                    new Promise(resolve => {
                        setTimeout(() => {
                            resolve(false);
                        }, 10000);
                    })
                ]);

                // If we still aren't logged in after waiting
                if (!loginWaitResult) {
                    console.error('[FirebaseService] Timeout waiting for login');
                    return { error: 'Authentication timeout' };
                }

                // console.log('[FirebaseService] Successfully logged in after waiting');
            }

            // Use the Firebase functions SDK
            const functions = firebase.functions();
            const functionRef = functions.httpsCallable(functionName);

            // console.log(`[FirebaseService] Calling cloud function: ${functionName}`);
            const result = await functionRef(data);

            // console.log(`[FirebaseService] Function call successful:`, result.data);
            return result.data;
        } catch (error) {
            console.error(`[FirebaseService] Error calling function ${functionName}:`, error);
            return { error: error.message };
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
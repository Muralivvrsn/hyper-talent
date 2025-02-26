; (function () {
    // Only run on LinkedIn pages
    if (!window.location.hostname.includes('linkedin.com')) {
        return;
    }
    if (window.themeManager) {
        return;
    }

    class ThemeManager {
        constructor() {
            this.state = {
                theme: 'light', // Default theme
                loading: true,
                initialized: false,
                listeners: new Set(),
                subscription: null,
                lastNotifiedTheme: 'light' // Track last notified theme
            };

            this.initializeFirebaseListener();
        }

        initializeFirebaseListener() {
            console.log('[ThemeManager] Initializing');
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds with 500ms interval
            
            const checkFirebaseService = setInterval(() => {
                attempts++;
                
                if (window.firebaseService) {
                    clearInterval(checkFirebaseService);
                    console.log('[ThemeManager] Firebase service found');
                    
                    // Check if Firebase is actually initialized with auth and db
                    if (window.firebaseService.auth && window.firebaseService.db) {
                        this.handleFirebaseReady();
                    } else {
                        // Wait for Firebase to be fully initialized
                        const checkFirebaseReady = setInterval(() => {
                            if (window.firebaseService.auth && window.firebaseService.db) {
                                clearInterval(checkFirebaseReady);
                                this.handleFirebaseReady();
                            }
                        }, 500);
                        
                        // Cleanup after 5 seconds if Firebase is not fully initialized
                        setTimeout(() => {
                            clearInterval(checkFirebaseReady);
                            if (!window.firebaseService.auth || !window.firebaseService.db) {
                                this.notifyError('firebase_not_ready', 'Firebase service not fully initialized');
                                this.setLoading(false);
                            }
                        }, 5000);
                    }
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkFirebaseService);
                    this.notifyError('initialization_timeout', 'Firebase service not found');
                    this.setLoading(false);
                }
            }, 500);
        }
        
        handleFirebaseReady() {
            console.log('[ThemeManager] Firebase ready, adding auth listener');
            window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
            
            // If user is already logged in, setup theme sync immediately
            if (window.firebaseService.status === 'logged_in' && window.firebaseService.currentUser) {
                this.setupThemeSync(window.firebaseService.currentUser.uid);
            }
        }

        setLoading(isLoading) {
            if (this.state.loading !== isLoading) {
                this.state.loading = isLoading;
                this.notifyListeners();
            }
        }

        notifyError(code, message) {
            console.error(`[ThemeManager] Error: ${code} - ${message}`);
            this.listeners.forEach(callback => {
                try {
                    callback(this.state.theme, this.state.loading, {
                        type: 'error',
                        code,
                        message,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('[ThemeManager] Error in error notification:', error);
                }
            });
        }

        async handleAuthStateChange(authState) {
            try {
                if (!authState || !authState.status) {
                    return;
                }

                console.log('[ThemeManager] Auth state change:', authState);

                if (authState.type === 'status') {
                    switch (authState.status) {
                        case 'in_progress':
                            this.setLoading(true);
                            break;

                        case 'logged_in':
                            this.setLoading(true);
                            if (authState.user && authState.user.uid) {
                                await this.setupThemeSync(authState.user.uid);
                            } else if (window.firebaseService && window.firebaseService.currentUser) {
                                await this.setupThemeSync(window.firebaseService.currentUser.uid);
                            } else {
                                this.notifyError('no_user_id', 'User ID not available');
                                this.setLoading(false);
                            }
                            break;

                        case 'logged_out':
                            this.resetState();
                            this.setLoading(false);
                            break;
                    }
                }
            } catch (error) {
                console.error('[ThemeManager] Auth state change error:', error);
                this.notifyError('auth_state_change_failed', error.message);
                this.setLoading(false);
            }
        }

        resetState() {
            this.state.theme = 'light';
            this.cleanupSubscription();
            this.state.initialized = false;
            
            // Only notify if theme actually changed
            if (this.state.lastNotifiedTheme !== 'light') {
                this.state.lastNotifiedTheme = 'light';
                this.notifyListeners();
            }
        }

        async setupThemeSync(userId) {
            try {
                console.log('[ThemeManager] Setting up theme sync for user:', userId);
                
                if (!window.firebaseService || !window.firebaseService.db) {
                    this.notifyError('initialization_failed', 'Firebase not initialized');
                    this.setLoading(false);
                    return;
                }

                const db = window.firebaseService.db;
                
                this.cleanupSubscription();
                this.setLoading(true);

                const userRef = db.collection('users_v2').doc(userId);
                
                // First check if the document exists, create it if it doesn't
                const docSnapshot = await userRef.get();
                if (!docSnapshot.exists) {
                    console.log('[ThemeManager] Creating user document');
                    // Create the user document with default theme directly at top level
                    await userRef.set({
                        th: 'light',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } else if (!docSnapshot.data()?.th) {
                    // If document exists but doesn't have theme data
                    console.log('[ThemeManager] Adding theme data to user document');
                    await userRef.update({
                        'th': 'light',
                        'updatedAt': firebase.firestore.FieldValue.serverTimestamp()
                    });
                }

                // Now set up the snapshot listener
                const unsubscribe = userRef.onSnapshot(
                    (doc) => {
                        try {
                            if (!doc.exists) {
                                this.notifyError('user_doc_not_found', 'User document not found after initial setup');
                                this.setLoading(false);
                                return;
                            }

                            // Get theme directly from top level (not nested under 'd')
                            const theme = doc.data()?.th || 'light';
                            const hasThemeChanged = theme !== this.state.theme;
                            
                            if (hasThemeChanged) {
                                console.log(`[ThemeManager] Theme changed: ${this.state.theme} -> ${theme}`);
                                this.state.theme = theme;
                                this.state.lastNotifiedTheme = theme;
                                this.notifyListeners();
                            }

                            if (!this.state.initialized) {
                                this.state.initialized = true;
                                this.setLoading(false);
                            }
                        } catch (error) {
                            console.error('[ThemeManager] Document processing error:', error);
                            this.notifyError('doc_processing_failed', error.message);
                            this.setLoading(false);
                        }
                    },
                    error => {
                        console.error('[ThemeManager] Theme sync error:', error);
                        this.notifyError('theme_sync_failed', error.message);
                        this.setLoading(false);
                    }
                );

                this.state.subscription = unsubscribe;
            } catch (error) {
                console.error('[ThemeManager] Setup theme sync failed:', error);
                this.notifyError('setup_sync_failed', error.message);
                this.cleanupSubscription();
                this.setLoading(false);
            }
        }

        cleanupSubscription() {
            if (this.state.subscription) {
                try {
                    this.state.subscription();
                } catch (error) {
                    console.error('[ThemeManager] Cleanup error:', error);
                }
                this.state.subscription = null;
            }
        }

        addListener(callback) {
            if (typeof callback === 'function') {
                this.state.listeners.add(callback);
                
                // Immediately call the callback with current state
                callback(this.state.theme, this.state.loading);
            }
        }

        removeListener(callback) {
            this.state.listeners.delete(callback);
        }

        notifyListeners() {
            this.state.listeners.forEach(callback => {
                try {
                    callback(this.state.theme, this.state.loading);
                } catch (error) {
                    console.error('[ThemeManager] Error in listener callback:', error);
                }
            });
        }

        getCurrentTheme() {
            return this.state.theme;
        }

        async updateTheme(newTheme) {
            // Don't update if it's the same theme
            if (newTheme === this.state.theme) {
                return true;
            }
            
            this.setLoading(true);
            try {
                if (!window.firebaseService || !window.firebaseService.db || !window.firebaseService.currentUser) {
                    throw new Error('Firebase not initialized or user not logged in');
                }

                const db = window.firebaseService.db;
                const currentUser = window.firebaseService.currentUser;
                
                // Update theme directly at top level
                await db.collection('users_v2').doc(currentUser.uid).update({
                    'th': newTheme,
                    'updatedAt': firebase.firestore.FieldValue.serverTimestamp()
                });

                return true;
            } catch (error) {
                console.error('[ThemeManager] Failed to update theme:', error);
                this.notifyError('theme_update_failed', error.message);
                return false;
            } finally {
                this.setLoading(false);
            }
        }

        destroy() {
            this.setLoading(true);
            this.cleanupSubscription();
            this.state.listeners.clear();
            this.state.initialized = false;
            this.setLoading(false);
        }
    }

    // Initialize only if not already present
    if (!window.themeManager) {
        window.themeManager = new ThemeManager();
    }
})();
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
                theme: 'dark',
                loading: true,
                initialized: false,
                listeners: new Set(),
                subscription: null
            };

            this.initializeFirebaseListener();
        }

        initializeFirebaseListener() {
            const checkFirebaseService = setInterval(() => {
                if (window.firebaseService) {
                    clearInterval(checkFirebaseService);
                    window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
                }
            }, 500);

            // Cleanup after 10 seconds if Firebase service isn't found
            setTimeout(() => {
                clearInterval(checkFirebaseService);
                if (!this.state.initialized) {
                    this.notifyError('initialization_timeout', 'Firebase service not found');
                    this.setLoading(false);
                }
            }, 10000);
        }

        setLoading(isLoading) {
            if (this.state.loading !== isLoading) {
                this.state.loading = isLoading;
                this.notifyListeners();
            }
        }

        notifyError(code, message) {
            this.listeners.forEach(callback => {
                try {
                    callback(this.state.theme, this.state.loading, {
                        type: 'error',
                        code,
                        message,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    // console.error('[ThemeManager] Error in error notification:', error);
                }
            });
        }

        async handleAuthStateChange(authState) {
            try {
                if (!authState || !authState.type || !authState.message) {
                    return;
                }

                // console.log('[ThemeManager] Auth state change:', authState);

                if (authState.type === 'status') {
                    switch (authState.message) {
                        case 'initializing':
                            this.setLoading(true);
                            break;

                        case 'logged_in':
                            this.setLoading(true);
                            if (authState.user && authState.user.uid) {
                                await this.setupThemeSync(authState.user.uid);
                            }
                            break;

                        case 'signing_out':
                            this.setLoading(true);
                            break;

                        case 'signed_out':
                            this.resetState();
                            this.setLoading(false);
                            break;
                    }
                }
            } catch (error) {
                // console.error('[ThemeManager] Auth state change error:', error);
                this.notifyError('auth_state_change_failed', error.message);
            }
        }

        resetState() {
            this.state.theme = 'light';
            this.cleanupSubscription();
            this.state.initialized = false;
            this.notifyListeners();
        }

        async setupThemeSync(userId) {
            try {
                const db = window.firebaseService.db;
                // const currentUser = window.firebaseService.currentUser;
                if (!db) {
                    this.notifyError('initialization_failed', 'Firebase not initialized');
                    return;
                }

                this.cleanupSubscription();
                this.setLoading(true);

                const userRef = db.collection('users_v2').doc(userId);
                const unsubscribe = userRef.onSnapshot(
                    (doc) => {
                        try {
                            if (!doc.exists) {
                                this.notifyError('user_doc_not_found', 'User document not found');
                                this.setLoading(false);
                                return;
                            }

                            const theme = doc.data()?.d?.th || 'light';
                            if (theme !== this.state.theme) {
                                this.state.theme = theme;
                                this.notifyListeners();
                            }

                            if (!this.state.initialized) {
                                this.state.initialized = true;
                                this.setLoading(false);
                            }
                        } catch (error) {
                            // console.error('[ThemeManager] Document processing error:', error);
                            this.notifyError('doc_processing_failed', error.message);
                        }
                    },
                    error => {
                        // console.error('[ThemeManager] Theme sync error:', error);
                        this.notifyError('theme_sync_failed', error.message);
                        this.setLoading(false);
                    }
                );

                this.state.subscription = unsubscribe;
            } catch (error) {
                // console.error('[ThemeManager] Setup theme sync failed:', error);
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
                    // console.error('[ThemeManager] Cleanup error:', error);
                }
                this.state.subscription = null;
            }
        }

        addListener(callback) {
            if (typeof callback === 'function') {
                this.state.listeners.add(callback);
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
                    // console.error('[ThemeManager] Error in listener callback:', error);
                }
            });
        }

        getCurrentTheme() {
            return this.state.theme;
        }

        async updateTheme(newTheme) {
            this.setLoading(true);
            try {
                const db = window.firebaseService.db;
                const currentUser = window.firebaseService.currentUser;
                if (!db || !currentUser) {
                    throw new Error('Firebase not initialized');
                }

                await db.collection('users_v2').doc(currentUser.uid).update({
                    'd.th': newTheme
                });

                return true;
            } catch (error) {
                // console.error('[ThemeManager] Failed to update theme:', error);
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
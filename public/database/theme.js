;(function() {
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
                theme: 'light',
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
            }, 10000);
        }

        async handleAuthStateChange(user) {
            try {
                if (user) {
                    await this.setupThemeSync(user.uid);
                } else {
                    this.resetState();
                }
            } catch (error) {
                console.error('[ThemeManager] Auth state change error:', error);
            }
        }

        resetState() {
            this.state.theme = 'light';
            this.cleanupSubscription();
            this.notifyListeners();
        }

        async setupThemeSync(userId) {
            try {
                const { db } = await window.firebaseService.initialize();
                if (!db) return;

                this.cleanupSubscription();

                const userRef = db.collection('users').doc(userId);
                const unsubscribe = userRef.onSnapshot(
                    (doc) => {
                        if (!doc.exists) return;
                        
                        const theme = doc.data()?.d?.th || 'light';
                        if (theme !== this.state.theme) {
                            this.state.theme = theme;
                            this.notifyListeners();
                        }
                    },
                    error => {
                        console.error('[ThemeManager] Theme sync error:', error);
                    }
                );

                this.state.subscription = unsubscribe;
            } catch (error) {
                console.error('[ThemeManager] Setup theme sync failed:', error);
                this.cleanupSubscription();
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
                callback(this.state.theme);
            }
        }

        removeListener(callback) {
            this.state.listeners.delete(callback);
        }

        notifyListeners() {
            this.state.listeners.forEach(callback => {
                try {
                    callback(this.state.theme);
                } catch (error) {
                    console.error('[ThemeManager] Error in listener callback:', error);
                }
            });
        }

        getCurrentTheme() {
            return this.state.theme;
        }

        async updateTheme(newTheme) {
            try {
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                await db.collection('users').doc(currentUser.uid).update({
                    'd.th': newTheme
                });

                return true;
            } catch (error) {
                console.error('[ThemeManager] Failed to update theme:', error);
                return false;
            }
        }

        destroy() {
            this.cleanupSubscription();
            this.state.listeners.clear();
        }
    }

    // Initialize only if not already present
    if (!window.themeManager) {
        window.themeManager = new ThemeManager();
    }
})();
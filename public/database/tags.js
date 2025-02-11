;(function() {
    // Only run on LinkedIn pages
    if (!window.location.hostname.includes('linkedin.com')) {
        return;
    }

    // Prevent multiple injections
    if (window.labelsDatabase) {
        return;
    }

    class LinkedInLabelsDatabase {
        constructor() {
            this.state = {
                labels: {
                    owned: [],
                    shared: []
                },
                loading: true,
                listeners: new Set(),
                subscriptions: new Map(),
                userDataCache: new Map()
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

            setTimeout(() => {
                clearInterval(checkFirebaseService);
                this.updateLoading(false);
            }, 10000);
        }

        async handleAuthStateChange(user) {
            try {
                this.updateLoading(true);
                if (user) {
                    await this.setupRealtimeSync();
                } else {
                    this.resetState();
                }
            } catch (error) {
                console.error('[LinkedInLabels] Auth state change error:', error);
            } finally {
                this.updateLoading(false);
            }
        }

        resetState() {
            this.state.labels = { owned: [], shared: [] };
            this.cleanupSubscriptions();
            this.notifyListeners();
        }

        updateLoading(loading) {
            if (this.state.loading !== loading) {
                this.state.loading = loading;
                this.notifyListeners();
            }
        }

        async fetchUserName(userId) {
            try {
                const { db } = await window.firebaseService.initialize();
                
                if (this.state.userDataCache.has(userId)) {
                    return this.state.userDataCache.get(userId);
                }

                const userDoc = await db.collection('users').doc(userId).get();
                const userName = userDoc.data()?.d?.n || 'Unknown User';
                
                this.state.userDataCache.set(userId, userName);
                return userName;
            } catch (error) {
                console.error('[LinkedInLabels] Error fetching user name:', error);
                return 'Unknown User';
            }
        }

        async setupRealtimeSync() {
            try {
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) return;

                this.cleanupSubscriptions();
                this.resetState();
                this.updateLoading(true);

                const userRef = db.collection('users').doc(currentUser.uid);
                const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                    try {
                        this.updateLoading(true);
                        if (!userDoc.exists) return;

                        const userData = userDoc.data()?.d || {};
                        await Promise.all([
                            this.setupLabelListeners(userData.l || [], 'owned', currentUser.uid),
                            this.setupLabelListeners(userData.sl || [], 'shared', currentUser.uid)
                        ]);
                    } finally {
                        this.updateLoading(false);
                    }
                }, error => {
                    console.error('[LinkedInLabels] User document sync error:', error);
                    this.updateLoading(false);
                });

                this.state.subscriptions.set('user', userUnsubscribe);
            } catch (error) {
                console.error('[LinkedInLabels] Setup realtime sync failed:', error);
                this.cleanupSubscriptions();
                this.updateLoading(false);
            }
        }

        async setupLabelListeners(labelIds, type, currentUserId) {
            try {
                const { db } = await window.firebaseService.initialize();
                
                this.cleanupLabelListeners(type);
                this.updateLoading(true);

                const labelListeners = labelIds.map(labelId => {
                    const labelRef = db.collection('profile_labels').doc(labelId);
                    return {
                        id: labelId,
                        unsubscribe: labelRef.onSnapshot(async (labelDoc) => {
                            try {
                                this.updateLoading(true);
                                if (!labelDoc.exists) {
                                    this.removeLabel(labelId, type);
                                    return;
                                }

                                const labelData = labelDoc.data();
                                const profiles = await this.fetchProfiles(labelData.p || []);
                                const owned_by = type === 'owned' ? 
                                    'mine' : 
                                    await this.fetchUserName(labelData.lc);

                                this.updateLabel({
                                    type,
                                    label_id: labelDoc.id,
                                    label_name: labelData.n,
                                    label_color: labelData.c,
                                    profiles,
                                    owned_by
                                }, type);
                            } finally {
                                this.updateLoading(false);
                            }
                        }, error => {
                            console.error(`[LinkedInLabels] Label ${labelId} sync error:`, error);
                            this.updateLoading(false);
                        })
                    };
                });

                labelListeners.forEach(({ id, unsubscribe }) => {
                    this.state.subscriptions.set(`${type}_${id}`, unsubscribe);
                });

                this.cleanupRemovedLabels(labelIds, type);
            } catch (error) {
                console.error('[LinkedInLabels] Setup label listeners failed:', error);
            } finally {
                this.updateLoading(false);
            }
        }

        async fetchProfiles(profileIds) {
            this.updateLoading(true);
            const { db } = await window.firebaseService.initialize();
            const profiles = [];

            try {
                await Promise.all(profileIds.map(async profileId => {
                    try {
                        const profileDoc = await db.collection('profiles').doc(profileId).get();
                        if (profileDoc.exists) {
                            const profile = profileDoc.data();
                            profiles.push({
                                profile_id: profileDoc.id,
                                name: profile.n,
                                image_url: profile.img,
                                code: profile.c,
                                user_name: profile.un || null
                            });
                        }
                    } catch (error) {
                        console.error(`[LinkedInLabels] Error fetching profile ${profileId}:`, error);
                    }
                }));
            } finally {
                this.updateLoading(false);
            }

            return profiles;
        }

        updateLabel(newLabel, type) {
            const labelArray = this.state.labels[type];
            const index = labelArray.findIndex(l => l.label_id === newLabel.label_id);
            
            if (index === -1) {
                labelArray.push(newLabel);
            } else {
                labelArray[index] = newLabel;
            }
            
            this.notifyListeners();
        }

        removeLabel(labelId, type) {
            const labelArray = this.state.labels[type];
            const index = labelArray.findIndex(l => l.label_id === labelId);
            if (index !== -1) {
                labelArray.splice(index, 1);
                this.notifyListeners();
            }
        }

        cleanupRemovedLabels(currentLabelIds, type) {
            this.state.labels[type] = this.state.labels[type].filter(label => 
                currentLabelIds.includes(label.label_id)
            );
            this.notifyListeners();
        }

        cleanupLabelListeners(type) {
            for (const [key, unsubscribe] of this.state.subscriptions.entries()) {
                if (key.startsWith(`${type}_`)) {
                    unsubscribe();
                    this.state.subscriptions.delete(key);
                }
            }
        }

        cleanupSubscriptions() {
            Array.from(this.state.subscriptions.values()).forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('[LinkedInLabels] Cleanup error:', error);
                }
            });
            this.state.subscriptions.clear();
            this.state.userDataCache.clear();
        }

        async addLabel(labelData) {
            try {
                this.updateLoading(true);
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                const batch = db.batch();
                const userRef = db.collection('users').doc(currentUser.uid);
                const labelRef = db.collection('profile_labels').doc(labelData.label_id);
                
                batch.update(userRef, {
                    'd.l': firebase.firestore.FieldValue.arrayUnion(labelData.label_id)
                });
                
                batch.set(labelRef, {
                    n: labelData.label_name,
                    c: labelData.label_color,
                    lc: currentUser.uid,
                    lu: new Date().toISOString(),
                    p: []
                });

                await batch.commit();
                return true;
            } catch (error) {
                console.error('[LinkedInLabels] Failed to add label:', error);
                return false;
            } finally {
                this.updateLoading(false);
            }
        }

        async editLabel(labelId, updatedLabel) {
            try {
                this.updateLoading(true);
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                await db.collection('profile_labels').doc(labelId).update({
                    n: updatedLabel.label_name,
                    c: updatedLabel.label_color,
                    lu: new Date().toISOString()
                });

                return true;
            } catch (error) {
                console.error('[LinkedInLabels] Failed to edit label:', error);
                return false;
            } finally {
                this.updateLoading(false);
            }
        }

        async deleteLabel(labelId) {
            try {
                this.updateLoading(true);
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                const batch = db.batch();
                const userRef = db.collection('users').doc(currentUser.uid);
                const labelRef = db.collection('profile_labels').doc(labelId);
                
                batch.update(userRef, {
                    'd.l': firebase.firestore.FieldValue.arrayRemove(labelId)
                });
                
                batch.delete(labelRef);
                
                await batch.commit();
                return true;
            } catch (error) {
                console.error('[LinkedInLabels] Failed to delete label:', error);
                return false;
            } finally {
                this.updateLoading(false);
            }
        }

        async addProfileToLabel(labelId, profileId) {
            try {
                this.updateLoading(true);
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                await db.collection('profile_labels').doc(labelId).update({
                    p: firebase.firestore.FieldValue.arrayUnion(profileId),
                    lu: new Date().toISOString()
                });

                return true;
            } catch (error) {
                console.error('[LinkedInLabels] Failed to add profile to label:', error);
                return false;
            } finally {
                this.updateLoading(false);
            }
        }

        async removeProfileFromLabel(labelId, profileId) {
            try {
                this.updateLoading(true);
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                await db.collection('profile_labels').doc(labelId).update({
                    p: firebase.firestore.FieldValue.arrayRemove(profileId),
                    lu: new Date().toISOString()
                });

                return true;
            } catch (error) {
                console.error('[LinkedInLabels] Failed to remove profile from label:', error);
                return false;
            } finally {
                this.updateLoading(false);
            }
        }

        addListener(callback) {
            if (typeof callback === 'function') {
                this.state.listeners.add(callback);
                callback({ labels: this.state.labels, loading: this.state.loading });
            }
        }

        removeListener(callback) {
            this.state.listeners.delete(callback);
        }

        notifyListeners() {
            this.state.listeners.forEach(callback => {
                try {
                    callback({ labels: this.state.labels, loading: this.state.loading });
                } catch (error) {
                    console.error('[LinkedInLabels] Error in listener callback:', error);
                }
            });
        }

        destroy() {
            this.cleanupSubscriptions();
            this.state.listeners.clear();
        }
    }

    // Initialize only if not already present
    if (!window.labelsDatabase) {
        window.labelsDatabase = new LinkedInLabelsDatabase();
    }
})();
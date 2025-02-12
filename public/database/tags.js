; (function () {
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
                const userName = userDoc.data()?.n || 'Unknown User';

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

                // User document listener
                const userRef = db.collection('users').doc(currentUser.uid);
                const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                    try {
                        this.updateLoading(true);
                        if (!userDoc.exists) return;

                        const userData = userDoc.data()?.d || {};

                        // Handle owned labels (array of strings)
                        const ownedLabelIds = userData.l || [];

                        // Handle shared labels (array of objects with {l: labelId, a: acceptanceStatus})
                        const sharedLabels = userData.sl || [];
                        const acceptedSharedLabelIds = sharedLabels
                            .filter(label => label.a === true)
                            .map(label => label.l);

                        // Get all unique label IDs
                        const allLabelIds = [...new Set([...ownedLabelIds, ...acceptedSharedLabelIds])];

                        // Setup individual label listeners
                        allLabelIds.forEach(labelId => {
                            if (!this.state.subscriptions.has(`label_${labelId}`)) {
                                const labelRef = db.collection('profile_labels').doc(labelId);
                                const labelUnsubscribe = labelRef.onSnapshot(labelDoc => {
                                    if (labelDoc.exists) {
                                        const labelData = labelDoc.data();
                                        if (ownedLabelIds.includes(labelId)) {
                                            this.updateLabel({
                                                type: 'owned',
                                                label_id: labelId,
                                                label_name: labelData.n,
                                                label_color: labelData.c,
                                                profiles: labelData.p || [],
                                                owned_by: 'mine'
                                            }, 'owned');
                                        } else if (acceptedSharedLabelIds.includes(labelId)) {
                                            this.updateLabel({
                                                type: 'shared',
                                                label_id: labelId,
                                                label_name: labelData.n,
                                                label_color: labelData.c,
                                                profiles: labelData.p || [],
                                                owned_by: labelData.lc
                                            }, 'shared');
                                        }
                                    }
                                }, error => {
                                    console.error(`[LinkedInLabels] Label ${labelId} sync error:`, error);
                                });

                                this.state.subscriptions.set(`label_${labelId}`, labelUnsubscribe);
                            }
                        });

                        // Clean up listeners for labels that are no longer in the lists
                        Array.from(this.state.subscriptions.entries()).forEach(([key, unsubscribe]) => {
                            if (key.startsWith('label_')) {
                                const labelId = key.replace('label_', '');
                                if (!allLabelIds.includes(labelId)) {
                                    unsubscribe();
                                    this.state.subscriptions.delete(key);
                                    this.removeLabel(labelId, 'owned');
                                    this.removeLabel(labelId, 'shared');
                                }
                            }
                        });

                        await Promise.all([
                            this.setupLabelListeners(ownedLabelIds, 'owned', currentUser.uid),
                            this.setupLabelListeners(acceptedSharedLabelIds, 'shared', currentUser.uid)
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

                // Guard against non-array or empty labelIds
                if (!Array.isArray(labelIds) || labelIds.length === 0) {
                    this.state.labels[type] = [];
                    this.notifyListeners();
                    return;
                }

                // console.log(type);
                // console.log(labelIds)

                const labelListeners = labelIds.map(labelId => {
                    // console.log(labelId)
                    if (!labelId) {
                        console.error('[LinkedInLabels] Invalid label ID:', labelId);
                        return null;
                    }


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
                }).filter(Boolean); // Remove any null entries from invalid labelIds

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

        async addLabel(labelData, profileData) {
            
            try {
                this.updateLoading(true);
                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                // Validate required fields
                if (!labelData.label_id || !labelData.label_name || !labelData.label_color) {
                    console.error('[LinkedInLabels] Missing required label data:', labelData);
                    return false;
                }

                const batch = db.batch();
                const userRef = db.collection('users').doc(currentUser.uid);
                const labelRef = db.collection('profile_labels').doc(labelData.label_id);

                batch.update(userRef, {
                    'd.l': firebase.firestore.FieldValue.arrayUnion(labelData.label_id)
                });

                if (profileData.profile_id) {
                    const profileRef = db.collection('profiles').doc(profileData.profile_id);

                    // Check if profile exists, if not and profileData is provided, create profile
                    const profileDoc = await profileRef.get();
                    if (!profileDoc.exists && profileData) {
                        await profileRef.set({
                            n: profileData.name || null,
                            u: profileData.url || null,
                            un: profileData.username || null,
                            c: profileData.profile_id || null,
                            img: profileData.imageUrl || null,
                            lu: new Date().toISOString()
                        }, { merge: true });
                    }
                }

                // Initialize document with profile array
                const labelDoc = {
                    n: labelData.label_name,
                    c: labelData.label_color,
                    lc: currentUser.uid,
                    lu: new Date().toISOString(),
                    p: [] // Initialize empty array by default
                };

                // Only add profile_id to p array if it exists and is not null/undefined
                if (profileData.profileId) {
                    labelDoc.p = [profileData.profileId];
                }

                batch.set(labelRef, labelDoc);

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

        async addProfileToLabel(labelId, profileId, profileData) {
            // console.log(labelId);
            // console.log(profileId)
            try {
                this.updateLoading(true);

                // Validate inputs
                if (!labelId || !profileId) {
                    console.error('[LinkedInLabels] Invalid inputs:', { labelId, profileId });
                    return false;
                }

                const { db, currentUser } = await window.firebaseService.initialize();
                if (!db || !currentUser) throw new Error('Firebase not initialized');

                const profileRef = db.collection('profiles').doc(profileId);

                // Check if profile exists, if not and profileData is provided, create profile
                const profileDoc = await profileRef.get();
                if (!profileDoc.exists && profileData) {
                    await profileRef.set({
                        n: profileData.name || null,
                        u: profileData.url || null,
                        un: profileData.username || null,
                        c: profileId || null,
                        img: profileData.imageUrl || null,
                        lu: new Date().toISOString()
                    }, { merge: true });
                }

                const labelRef = db.collection('profile_labels').doc(labelId);
                const labelDoc = await labelRef.get();

                if (!labelDoc.exists) {
                    console.error('[LinkedInLabels] Label document does not exist:', labelId);
                    return false;
                }

                const labelData = labelDoc.data();
                const currentProfiles = labelData.p || [];

                // Update with a new array if p doesn't exist, or use arrayUnion if it does
                await labelRef.update({
                    p: Array.isArray(currentProfiles) ?
                        firebase.firestore.FieldValue.arrayUnion(profileId) :
                        [profileId],
                    lu: new Date().toISOString()
                });

                return true;
            } catch (error) {
                // console.error('[LinkedInLabels] Failed to add profile to label:', error, {
                //     labelId,
                //     profileId,
                //     profileData
                // });
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
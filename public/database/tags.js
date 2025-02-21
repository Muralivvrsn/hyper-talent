

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

        this.status = null; // Add status property
        this.isLoadingLabels = false; // Add loading flag
        this.initialized = false;

        // Bind the auth listener
        this.boundAuthListener = this.handleAuthStateChange.bind(this);
        window.firebaseService.addAuthStateListener(this.boundAuthListener);
    }

    async handleAuthStateChange(authState) {
        try {
            if (!authState || !authState.type || !authState.status) {
                return;
            }

            // If we're already loading labels, don't trigger another load
            if (this.isLoadingLabels) {
                return;
            }

            switch (authState.status) {
                case 'logged_in':
                    if (this.status !== 'in_progress') {
                        this._updateStatus('in_progress');
                        await this.setupRealtimeSync();
                    }
                    break;

                case 'logged_out':
                    this.cleanupSubscriptions();
                    this.resetState();
                    this._updateStatus('logged_out');
                    break;

                case 'in_progress':
                    if (this.status !== 'in_progress') {
                        this._updateStatus('in_progress');
                    }
                    break;
            }
        } catch (error) {
            console.error('[LinkedInLabels] Auth state change error:', error);
            this._updateStatus('logged_out');
        }
    }

    resetState() {
        const hadLabels = this.state.labels.owned.length > 0 || this.state.labels.shared.length > 0;
        this.state.labels = { owned: [], shared: [] };
        this.cleanupSubscriptions();
        if (hadLabels) {
            this.notifyListeners();
        }
    }

    _updateStatus(newStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.notifyListeners();
        }
    }

    async fetchUserName(userId) {
        try {
            const db = window.firebaseService.db;
            // const currentUser = window.firebaseService.currentUser;

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
        console.log('realtimesysnc');
        if (this.isLoadingLabels) {
            return;
        }
        this.isLoadingLabels = true;
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) {
                this._updateStatus('logged_out');
                return;
            }

            this.cleanupSubscriptions();
            this.resetState();

            // User document listener
            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                try {
                    if (!userDoc.exists) return;

                    const userData = userDoc.data()?.d || {};
                    const ownedLabelIds = userData.l || [];
                    const sharedLabels = userData.sl || [];
                    const acceptedSharedLabelIds = sharedLabels
                        .filter(label => label.a === true)
                        .map(label => label.l);

                    const allLabelIds = [...new Set([...ownedLabelIds, ...acceptedSharedLabelIds])];

                    await Promise.all([
                        this.setupLabelListeners(ownedLabelIds, 'owned', currentUser.uid),
                        this.setupLabelListeners(acceptedSharedLabelIds, 'shared', currentUser.uid)
                    ]);

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
                            });
                            this.state.subscriptions.set(`label_${labelId}`, labelUnsubscribe);
                        }
                    });

                } catch (error) {
                    console.error('[LinkedInLabels] User document sync error:', error);
                }
            });

            this.state.subscriptions.set('user', userUnsubscribe);
            this._updateStatus('logged_in');
        } catch (error) {
            console.error('[LinkedInLabels] Setup realtime sync failed:', error);
            this.cleanupSubscriptions();
            this._updateStatus('logged_out');
            
        }
        finally{
            this.isLoadingLabels = false;
        }
    }


    async setupLabelListeners(labelIds, type, currentUserId) {
        try {
            const db = window.firebaseService.db;
            // const currentUser = window.firebaseService.currentUser;

            this.cleanupLabelListeners(type);
            // this.updateLoading(true);

            // Guard against non-array or empty labelIds
            if (!Array.isArray(labelIds) || labelIds.length === 0) {
                this.state.labels[type] = [];
                this.notifyListeners();
                return;
            }

            console.log(type);
            console.log(labelIds)

            const labelListeners = labelIds.map(labelId => {
                console.log(labelId)
                if (!labelId) {
                    console.error('[LinkedInLabels] Invalid label ID:', labelId);
                    return null;
                }


                const labelRef = db.collection('profile_labels').doc(labelId);
                return {
                    id: labelId,
                    unsubscribe: labelRef.onSnapshot(async (labelDoc) => {
                        try {
                            // this.updateLoading(true);
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
                            // this._updateStatus('logged_in');
                            // this.initialized = true;
                        }
                    }, error => {
                        console.error(`[LinkedInLabels] Label ${labelId} sync error:`, error);
                        // this._updateStatus('logged_in');
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
            if (this.status !== 'logged_in') {
                this._updateStatus('logged_in');
            }
        }
    }

    async fetchProfiles(profileIds) {
        // this.updateLoading(true);
        const db = window.firebaseService.db;
        // const currentUser = window.firebaseService.currentUser;
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
            // this._updateStatus('logged_in');
        }

        return profiles;
    }

    updateLabel(newLabel, type) {
        const labelArray = this.state.labels[type];
        const index = labelArray.findIndex(l => l.label_id === newLabel.label_id);
        let changed = false;
    
        if (index === -1) {
            labelArray.push(newLabel);
            changed = true;
        } else if (JSON.stringify(labelArray[index]) !== JSON.stringify(newLabel)) {
            labelArray[index] = newLabel;
            changed = true;
        }
    
        if (changed) {
            this.notifyListeners();
        }
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
        const originalLength = this.state.labels[type].length;
        this.state.labels[type] = this.state.labels[type].filter(label =>
            currentLabelIds.includes(label.label_id)
        );
        if (this.state.labels[type].length !== originalLength) {
            this.notifyListeners();
        }
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
            // this.updateLoading(true);
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
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

            // Initialize document with profile array
            const labelDoc = {
                n: labelData.label_name,
                c: labelData.label_color,
                lc: currentUser.uid,
                lu: new Date().toISOString(),
                p: [] // Initialize empty array by default
            };

            batch.set(labelRef, labelDoc);

            await batch.commit();
            window.userActionsDatabase.addAction("label_added")
            return true;
        } catch (error) {
            console.error('[LinkedInLabels] Failed to add label:', error);
            window.userActionsDatabase.addAction("label_added_failed", error)
            return false;
        } finally {
            // this._updateStatus('logged_in');
        }
    }

    async editLabel(labelId, updatedLabel) {
        try {
            // this.updateLoading(true);
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Firebase not initialized');

            await db.collection('profile_labels').doc(labelId).update({
                n: updatedLabel.label_name,
                c: updatedLabel.label_color,
                lu: new Date().toISOString()
            });
            window.userActionsDatabase.addAction("label_edited")
            return true;
        } catch (error) {
            console.error('[LinkedInLabels] Failed to edit label:', error);
            window.userActionsDatabase.addAction("label_edited_failed", error)
            return false;
        } finally {
            this._updateStatus('logged_in');
        }
    }

    async deleteLabel(labelId) {
        try {
            // this.updateLoading(true);
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Firebase not initialized');

            const batch = db.batch();
            const userRef = db.collection('users').doc(currentUser.uid);
            const labelRef = db.collection('profile_labels').doc(labelId);

            batch.update(userRef, {
                'd.l': firebase.firestore.FieldValue.arrayRemove(labelId)
            });

            batch.delete(labelRef);

            await batch.commit();
            window.userActionsDatabase.addAction("label_deleted")
            return true;
        } catch (error) {
            console.error('[LinkedInLabels] Failed to delete label:', error);
            window.userActionsDatabase.addAction("label_deleted_failed", error)
            return false;
        } finally {
            this._updateStatus('logged_in');
        }
    }

    async addProfileToLabel(labelId, profileId, profileData) {
        try {
            // this.updateLoading(true);

            // Validate inputs
            if (!labelId || !profileId) {
                console.error('[LinkedInLabels] Invalid inputs:', { labelId, profileId });
                return false;
            }

            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Firebase not initialized');

            const labelRef = db.collection('profile_labels').doc(labelId);
            const labelDoc = await labelRef.get();

            if (!labelDoc.exists) {
                console.error('[LinkedInLabels] Label document does not exist:', labelId);
                return false;
            }

            const labelData = labelDoc.data();
            const currentProfiles = labelData.p || [];

            // Check if profile already exists in the label
            if (Array.isArray(currentProfiles) && currentProfiles.includes(profileId)) {
                window.show_warning('This profile has already been added to this label');
                return false;
            }

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

            // Update with a new array if p doesn't exist, or use arrayUnion if it does
            await labelRef.update({
                p: Array.isArray(currentProfiles) ?
                    firebase.firestore.FieldValue.arrayUnion(profileId) :
                    [profileId],
                lu: new Date().toISOString()
            });
            window.userActionsDatabase.addAction("label_applied");
            return true;
        } catch (error) {
            window.userActionsDatabase.addAction("label_applied_failed", error);
            return false;
        } finally {
            this._updateStatus('logged_in');
        }
    }

    async removeProfileFromLabel(labelId, profileId) {
        try {
            // this.updateLoading(true);
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Firebase not initialized');

            await db.collection('profile_labels').doc(labelId).update({
                p: firebase.firestore.FieldValue.arrayRemove(profileId),
                lu: new Date().toISOString()
            });
            window.userActionsDatabase.addAction("label_removed")
            return true;
        } catch (error) {
            console.error('[LinkedInLabels] Failed to remove profile from label:', error);
            window.userActionsDatabase.addAction("label_removed_failed", error)
            return false;
        } finally {
            this._updateStatus('logged_in');
        }
    }

    addListener(callback) {
        if (typeof callback === 'function') {
            this.state.listeners.add(callback);
            // Only notify if we have a status
            if (this.status) {
                callback({
                    type: 'status',
                    status: this.status,
                    labels: this.state.labels,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    removeListener(callback) {
        this.state.listeners.delete(callback);
    }

    notifyListeners() {
        this.state.listeners.forEach(callback => {
            try {
                callback({
                    type: 'status',
                    status: this.status,
                    labels: this.state?.labels,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('[LinkedInLabels] Error in listener callback:', error);
            }
        });
    }

    destroy() {
        this.cleanupSubscriptions();
        this.state.listeners.clear();
        window.firebaseService.removeAuthStateListener(this.boundAuthListener);
        const wasLoggedIn = this.status === 'logged_in';
        this.status = null;
        if (wasLoggedIn) {
            // Pass correct notification object
            this.state.listeners.forEach(callback => {
                try {
                    callback({
                        type: 'status',
                        status: 'logged_out',
                        labels: this.state.labels,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('[LinkedInLabels] Error in destroy notification:', error);
                }
            });
        }
    }
}

if (!window.labelsDatabase) {
    window.labelsDatabase = new LinkedInLabelsDatabase()
}
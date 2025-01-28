class LabelsDatabase {
    constructor() {
        this.labels = [];
        this.listeners = new Set();
        this.currentSubscriptionBatch = new Set();
        this.pendingLabels = new Map();
        this.lastProcessedChunk = -1;
        this.totalChunks = 0;

        window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
    }

    async handleAuthStateChange(user) {
        try {
            if (user) {
                await this.setupRealtimeSync();
            } else {
                this.labels = [];
                this.notifyListeners();
                if (this.unsubscribeSnapshot) {
                    this.unsubscribeSnapshot();
                    this.unsubscribeSnapshot = null;
                }
            }
        } catch (error) {
            console.error('Error handling auth state change:', error);
        }
    }

    async setupRealtimeSync() {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) return;
    
            if (this.currentSubscriptionBatch) {
                this.currentSubscriptionBatch.forEach(unsub => {
                    try { unsub(); } catch (e) { console.error('Cleanup error:', e); }
                });
            }
    
            this.currentSubscriptionBatch = new Set();
            this.labels = [];
    
            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot((userDoc) => {
                this.currentSubscriptionBatch.forEach(unsub => {
                    if (unsub !== userUnsubscribe) {
                        try { unsub(); } catch (e) { console.error('Label listener cleanup error:', e); }
                    }
                });
    
                this.currentSubscriptionBatch = new Set([userUnsubscribe]);
                if (!userDoc.exists) return;
    
                const labelIds = userDoc.data()?.d?.l || [];
    
                labelIds.forEach(labelId => {
                    const labelUnsubscribe = db.collection('profile_labels')
                        .doc(labelId)
                        .onSnapshot(async (labelDoc) => {
                            if (!labelDoc.exists) {
                                const labelIndex = this.labels.findIndex(l => l.label_id === labelId);
                                if (labelIndex !== -1) {
                                    this.labels.splice(labelIndex, 1);
                                    this.notifyListeners();
                                }
                                return;
                            }
    
                            const labelData = labelDoc.data();
                            const profileIds = labelData.p || [];
                            const profiles = [];
    
                            await Promise.all(profileIds.map(async profileId => {
                                const profileDoc = await db.collection('profiles')
                                    .doc(profileId)
                                    .get();
    
                                if (profileDoc.exists) {
                                    const profile = profileDoc.data();
                                    profiles.push({
                                        profile_id: profileDoc.id,
                                        name: profile.n,
                                        image_url: profile.img,
                                        code: profile.c
                                    });
                                }
                            }));
    
                            const labelIndex = this.labels.findIndex(l => l.label_id === labelId);
                            const newLabel = {
                                label_id: labelDoc.id,
                                label_name: labelData.n,
                                label_color: labelData.c,
                                profiles
                            };
    
                            if (labelIndex === -1) {
                                this.labels.push(newLabel);
                            } else {
                                this.labels[labelIndex] = newLabel;
                            }
    
                            this.notifyListeners();
                        }, error => {
                            console.error(`Label ${labelId} listener error:`, error);
                        });
    
                    this.currentSubscriptionBatch.add(labelUnsubscribe);
                });
    
                if (labelIds.length === 0) {
                    this.labels = [];
                    this.notifyListeners();
                }
            }, error => {
                console.error('User document listener error:', error);
            });
    
            this.currentSubscriptionBatch.add(userUnsubscribe);
    
        } catch (error) {
            console.error('Setup realtime sync failed:', error);
            this.cleanupSubscriptions();
        }
    }

    // Make sure cleanup is thorough
    cleanupSubscriptions() {
        if (this.currentSubscriptionBatch) {
            this.currentSubscriptionBatch.forEach(unsub => {
                try {
                    unsub();
                } catch (e) {
                    console.error('Cleanup error:', e);
                }
            });
            this.currentSubscriptionBatch.clear();
        }
        this.labels = [];
    }
    async addLabel(labelData) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');
    
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            const userLabelIds = userData?.d?.l || [];
    
            // Chunk the label IDs to handle Firebase 'in' query limitation
            const checkLabelNames = async (labelIds) => {
                const existingLabelsQuery = await db.collection('profile_labels')
                    .where(firebase.firestore.FieldPath.documentId(), 'in', labelIds)
                    .get();
    
                return existingLabelsQuery.docs.map(doc => doc.data().n);
            };
    
            const chunks = [];
            for (let i = 0; i < userLabelIds.length; i += 10) {
                chunks.push(userLabelIds.slice(i, i + 10));
            }
    
            const existingLabelNames = (await Promise.all(
                chunks.map(checkLabelNames)
            )).flat();
    
            if (existingLabelNames.includes(labelData.label_name)) {
                return false;
            }
    
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.data();
                const userLabels = userData?.d?.l || [];
    
                if (!userLabels.includes(labelData.label_id)) {
                    transaction.update(userRef, {
                        'd.l': firebase.firestore.FieldValue.arrayUnion(labelData.label_id)
                    });
                }
            });
    
            const labelRef = db.collection('profile_labels').doc(labelData.label_id);
            await labelRef.set({
                n: labelData.label_name,
                c: labelData.label_color,
                lc: currentUser.uid,
                lu: new Date().toISOString(),
                lc: currentUser.uid,
                p: []
            });
    
            return true;
        } catch (error) {
            console.error('Failed to add label:', error);
            return false;
        }
    }

    async editLabel(labelId, updatedLabel) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            // Update the label document
            const labelRef = db.collection('profile_labels').doc(labelId);
            await labelRef.update({
                n: updatedLabel.label_name,     // name
                c: updatedLabel.label_color,    // color
                lu: new Date().toISOString()    // last updated
            });

            return true;
        } catch (error) {
            console.error('Failed to edit label:', error);
            return false;
        }
    }

    async deleteLabel(labelId) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            // First, remove the label ID from the user's document
            const userRef = db.collection('users').doc(currentUser.uid);
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.data();
                const userLabels = userData?.d?.l || [];

                if (userLabels.includes(labelId)) {
                    transaction.update(userRef, {
                        'd.l': firebase.firestore.FieldValue.arrayRemove(labelId)
                    });
                }
            });

            // Delete the label document
            const labelRef = db.collection('profile_labels').doc(labelId);
            await labelRef.delete();

            return true;
        } catch (error) {
            console.error('Failed to delete label:', error);
            return false;
        }
    }

    async addProfileToLabel(labelId, profileId) {
        // console.log(profileId)
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            const labelRef = db.collection('profile_labels').doc(labelId);
            await labelRef.update({
                p: firebase.firestore.FieldValue.arrayUnion(profileId),
                lu: new Date().toISOString()
            });

            return true;
        } catch (error) {
            // console.error('Failed to add profile to label:', error);
            return false;
        }
    }

    async removeProfileFromLabel(labelId, profileId) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            const labelRef = db.collection('profile_labels').doc(labelId);
            await labelRef.update({
                p: firebase.firestore.FieldValue.arrayRemove(profileId),
                lu: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('Failed to remove profile from label:', error);
            return false;
        }
    }

    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
            callback(this.labels);
        }
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                // console.log("labels changed");
                // console.log(this.labels)
                callback(this.labels);
            } catch (error) {
                console.error('Error in listener callback:', error);
            }
        });
    }

    destroy() {
        if (this.unsubscribeSnapshot) {
            this.unsubscribeSnapshot();
            this.unsubscribeSnapshot = null;
        }
        this.listeners.clear();
    }
}

// Initialize the labels database
window.labelsDatabase = new LabelsDatabase();
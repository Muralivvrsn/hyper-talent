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
    
            // Cleanup existing subscriptions properly
            this.cleanupSubscriptions();
    
            // Initialize subscription tracking
            this.currentSubscriptionBatch = new Set();
            this.pendingLabels = new Map();
            this.lastProcessedChunk = -1;
            this.totalChunks = 0;
    
            // Function to chunk array into smaller arrays
            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            };
    
            // Set up user document listener first
            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                try {
                    if (!userDoc.exists) {
                        console.warn('User document not found');
                        return;
                    }
    
                    const userData = userDoc.data();
                    const labelIds = userData?.d?.l || [];
    
                    // Split labelIds into chunks of 10 (Firestore limit)
                    const labelIdChunks = chunkArray(labelIds, 10);
                    this.totalChunks = labelIdChunks.length;
    
                    // Create new subscription batch
                    const newBatch = new Set([userUnsubscribe]);
    
                    // Clear existing labels for a fresh start
                    this.labels = [];
                    this.pendingLabels.clear();
                    this.lastProcessedChunk = -1;
    
                    // Set up listeners for each chunk of labels
                    labelIdChunks.forEach((chunk, chunkIndex) => {
                        // Skip empty chunks
                        if (!chunk.length) return;
    
                        const labelUnsubscribe = db.collection('profile_labels')
                            .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                            .onSnapshot(async (labelSnapshot) => {
                                try {
                                    // Collect all profile IDs from this chunk's labels
                                    const allProfileIds = new Set();
                                    const chunkLabelData = new Map();
    
                                    labelSnapshot.docs.forEach(doc => {
                                        const labelData = doc.data();
                                        labelData.p?.forEach(profileId => allProfileIds.add(profileId));
                                        chunkLabelData.set(doc.id, {
                                            label_id: doc.id,
                                            label_name: labelData.n,
                                            label_color: labelData.c,
                                            profiles: [] // Will be populated with profile data
                                        });
                                    });
    
                                    // Fetch profiles in chunks
                                    const profileIds = [...allProfileIds];
                                    const profileChunks = chunkArray(profileIds, 10);
    
                                    // Fetch all profile data
                                    for (const profileChunk of profileChunks) {
                                        if (!profileChunk.length) continue;
    
                                        const profilesSnapshot = await db.collection('profiles')
                                            .where(firebase.firestore.FieldPath.documentId(), 'in', profileChunk)
                                            .get();
    
                                        // Create profile objects
                                        profilesSnapshot.docs.forEach(doc => {
                                            const profile = doc.data();
                                            labelSnapshot.docs.forEach(labelDoc => {
                                                const labelData = labelDoc.data();
                                                if (labelData.p?.includes(doc.id)) {
                                                    const labelState = chunkLabelData.get(labelDoc.id);
                                                    if (labelState) {
                                                        labelState.profiles.push({
                                                            profile_id: doc.id,
                                                            name: profile.n,
                                                            image_url: profile.img,
                                                            code: profile.c
                                                        });
                                                    }
                                                }
                                            });
                                        });
                                    }
    
                                    // Store processed labels
                                    chunkLabelData.forEach((labelState, labelId) => {
                                        this.pendingLabels.set(labelId, labelState);
                                    });
    
                                    // Track chunk processing
                                    this.lastProcessedChunk = Math.max(this.lastProcessedChunk, chunkIndex);
    
                                    // If this was the last chunk, update the final labels array
                                    if (this.lastProcessedChunk === this.totalChunks - 1) {
                                        this.labels = Array.from(this.pendingLabels.values());
                                        this.notifyListeners();
                                    }
                                } catch (error) {
                                    console.error('Error processing label chunk:', error);
                                    window.show_error('Error syncing label data');
                                }
                            }, error => {
                                console.error('Label listener error:', error);
                                window.show_error('Error in label sync');
                            });
    
                        newBatch.add(labelUnsubscribe);
                    });
    
                    // Cleanup old batch and set new one atomically
                    const oldBatch = this.currentSubscriptionBatch;
                    this.currentSubscriptionBatch = newBatch;
                    oldBatch.forEach(unsub => unsub());
    
                } catch (error) {
                    console.error('Error processing user data:', error);
                    window.show_error('Error syncing user data');
                }
            }, error => {
                console.error('User listener error:', error);
                window.show_error('Error in user sync');
            });
    
            // Store initial user subscription
            this.currentSubscriptionBatch.add(userUnsubscribe);
    
        } catch (error) {
            console.error('Setup realtime sync failed:', error);
            window.show_error('Failed to sync labels');
            this.cleanupSubscriptions();
        }
    }
    
    // Helper method to clean up subscriptions
    cleanupSubscriptions() {
        if (this.currentSubscriptionBatch) {
            this.currentSubscriptionBatch.forEach(unsub => {
                try {
                    unsub();
                } catch (error) {
                    console.error('Error cleaning up subscription:', error);
                }
            });
            this.currentSubscriptionBatch.clear();
        }
    }
    async addLabel(labelData) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            // First, update the user's document to include the new label ID
            const userRef = db.collection('users').doc(currentUser.uid);
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.data();
                const userLabels = userData?.d?.l || [];
                
                // Only add if not already present
                if (!userLabels.includes(labelData.label_id)) {
                    transaction.update(userRef, {
                        'd.l': firebase.firestore.FieldValue.arrayUnion(labelData.label_id)
                    });
                }
            });

            // Create the label document
            const labelRef = db.collection('profile_labels').doc(labelData.label_id);
            await labelRef.set({
                n: labelData.label_name,     // name
                c: labelData.label_color,    // color
                lu: new Date().toISOString(), // last updated
                p: []                        // profile IDs array
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
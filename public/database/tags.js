class LinkedInLabelsDatabase {
    constructor() {
        this.state = {
            labels: [],
            listeners: new Set(),
            status: "in_progress",
            subscriptions: new Map()
        };

        this.boundAuthListener = this.handleAuthStateChange.bind(this);
        window.firebaseService.addAuthStateListener(this.boundAuthListener);
    }

    async handleAuthStateChange(authState) {
        if (!authState?.status) return;

        switch (authState.status) {
            case 'logged_in':
                await this.setupRealtimeSync();
                break;
            case 'logged_out':
                this.cleanupSubscriptions();
                this.resetState();
                this._updateStatus('logged_out');
                break;
        }
    }

    async setupRealtimeSync() {
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;

            if (!db || !currentUser) {
                this._updateStatus('logged_out');
                return;
            }

            this.cleanupSubscriptions();

            // Setup user document listener
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                if (!userDoc.exists) return;

                const userData = userDoc.data()?.d || {};
                const labelsList = userData.l || [];

                // Process each label and setup individual listeners
                await this.setupLabelListeners(labelsList);
                console.log('sending message to listenrs')
                await this._updateStatus('logged_in');
            }, error => {
                console.error('[LinkedInLabels] User document sync error:', error);
                // this._updateStatus('logged_out');
            });

            this.state.subscriptions.set('user', userUnsubscribe);
            // this._updateStatus('logged_in');

        } catch (error) {
            console.error('[LinkedInLabels] Setup realtime sync failed:', error);
            this.cleanupSubscriptions();

        }
        finally {
            
        }
    }

    async getProfileDetails(profileIds) {
        try {
            const db = window.firebaseService.db;
            const profiles = [];
    
            // Use Promise.all to fetch all profiles in parallel
            await Promise.all(profileIds.map(async (profileId) => {
                const profileRef = db.collection('profiles').doc(profileId);
                const profileDoc = await profileRef.get();
                
                if (profileDoc.exists) {
                    const profileData = profileDoc.data();
                    profiles.push({
                        profile_id: profileId,
                        name: profileData.n,
                        image_url: profileData.img,
                        username: profileData.un,
                        url: profileData.u
                    });
                }
            }));
    
            return profiles;
        } catch (error) {
            console.error('[LinkedInLabels] Get profile details error:', error);
            return [];
        }
    }
    
    async setupLabelListeners(labelsList) {
        console.log("[setupLabelListeners] Initializing label listeners...");
    
        const db = window.firebaseService.db;
        let firsttime = true;
        const currentLabels = new Set();
    
        console.log("[setupLabelListeners] Received labelsList:", labelsList);
    
        labelsList.forEach(labelData => {
            const labelId = labelData.id;
            console.log(`[setupLabelListeners] Processing label: ${labelId}`);
    
            currentLabels.add(labelId);
    
            // Skip if listener already exists
            if (this.state.subscriptions.has(`label_${labelId}`)) {
                console.warn(`[setupLabelListeners] Listener already exists for label ${labelId}, skipping.`);
                return;
            }
    
            console.log(`[setupLabelListeners] Setting up listener for label: ${labelId}`);
            const labelRef = db.collection('profile_labels_v2').doc(labelId);
    
            const labelUnsubscribe = labelRef.onSnapshot(async (labelDoc) => {
                console.log(`[onSnapshot] Snapshot received for label ${labelId}`);
    
                if (!labelDoc.exists) {
                    console.warn(`[onSnapshot] Label ${labelId} does not exist. Removing from state.`);
                    this.removeLabel(labelId);
                    return;
                }
    
                const label = labelDoc.data();
                console.log(`[onSnapshot] Label data for ${labelId}:`, label);
    
                // Get profile details for each profile ID
                console.log(`[onSnapshot] Fetching profile details for label ${labelId}`);
                const profileDetails = await this.getProfileDetails(label.p || []);
                console.log(`[onSnapshot] Profile details fetched for label ${labelId}:`, profileDetails);
    
                const labelInfo = {
                    label_id: labelId,
                    label_name: label.n,
                    label_color: label.c,
                    profiles: profileDetails, // Now contains full profile objects
                    last_updated: label.lu,
                    type: labelData.t,
                    ...(labelData.t === 'owned' && { created_at: labelData.ca }),
                    ...(labelData.t === 'shared' && {
                        permission: labelData.ps,
                        shared_by: labelData.sbn,
                        shared_at: labelData.sa
                    })
                };
    
                console.log(`[onSnapshot] Constructed labelInfo for ${labelId}:`, labelInfo);
    
                // if (!firsttime) {
                //     console.log(`[onSnapshot] Updating label ${labelId}`);
                    this.updateLabel(labelInfo, firsttime);
                // } else {
                //     console.log(`[onSnapshot] First-time execution, skipping update for ${labelId}`);
                // }
            }, error => {
                console.error(`[onSnapshot] Label ${labelId} sync error:`, error);
            });
    
            this.state.subscriptions.set(`label_${labelId}`, labelUnsubscribe);
            firsttime = false;
            console.log(`[setupLabelListeners] Listener added for label: ${labelId}`);
        });
    
       
        console.log("[setupLabelListeners] First-time flag set to false.");
    
        // Cleanup listeners for removed labels
        console.log("[setupLabelListeners] Checking for removed labels...");
        for (const [key, unsubscribe] of this.state.subscriptions.entries()) {
            if (key.startsWith('label_')) {
                const labelId = key.replace('label_', '');
                if (!currentLabels.has(labelId)) {
                    console.warn(`[setupLabelListeners] Label ${labelId} is no longer in labelsList. Cleaning up.`);
                    unsubscribe();
                    this.state.subscriptions.delete(key);
                    this.removeLabel(labelId);
                    console.log(`[setupLabelListeners] Unsubscribed and removed label: ${labelId}`);
                }
            }
        }
    
        console.log("[setupLabelListeners] Completed label listener setup.");
    }
    
    async removeProfileFromLabel(labelId, profileId) {
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;

            const profileInfo = await window.labelManagerUtils.getProfileInfo();
    
            if (!db || !currentUser) {
                throw new Error('Not authenticated');
            }
    
            // Get the label reference
            const labelRef = db.collection('profile_labels_v2').doc(labelId);
            const labelDoc = await labelRef.get();
    
            if (!labelDoc.exists) {
                throw new Error('Label not found');
            }
    
            const labelData = labelDoc.data();
            
            console.log(profileId)
            console.log(profileInfo.profile_id);

            // Check if profile exists in the profiles array
            if (!labelData.p || !labelData.p.includes(profileInfo.profile_id)) {
                throw new Error('Profile not found in label');
            }
    
            // Remove profile from the profiles array
            await labelRef.update({
                p: firebase.firestore.FieldValue.arrayRemove(profileInfo.profile_id),
                lu: new Date().toISOString() // Update last updated timestamp
            });
    
            return true;
        } catch (error) {
            console.error('[LinkedInLabels] Remove profile from label error:', error);
            throw error;
        }
    }

    updateLabel(newLabel, firsttime) {
        this.state.labels = this.state.labels.map(label =>
            label.label_id === newLabel.label_id ? newLabel : label
        );
    
        // If the label is new, add it
        if (!this.state.labels.some(label => label.label_id === newLabel.label_id)) {
            this.state.labels = [...this.state.labels, newLabel]; // ✅ Replaces array
        }
    
        if (!firsttime) {
            this.notifyListeners(); // ✅ UI should update now
        }
    }

    removeLabel(labelId) {
        this.state.labels = this.state.labels.filter(l => l.label_id !== labelId);
        this.notifyListeners();
    }

    cleanupSubscriptions() {
        for (const unsubscribe of this.state.subscriptions.values()) {
            try {
                unsubscribe();
            } catch (error) {
                console.error('[LinkedInLabels] Cleanup error:', error);
            }
        }
        this.state.subscriptions.clear();
    }

    resetState() {
        this.state.labels = [];
        this.notifyListeners();
    }

    async _updateStatus(newStatus) {
        console.log(this.state.status);
        console.log(newStatus)
        if (this.state.status !== newStatus) {
            this.state.status = newStatus;
            this.notifyListeners();
        }
    }

    addListener(callback) {
        if (typeof callback === 'function') {
            this.state.listeners.add(callback);
            callback({
                type: 'status',
                status: this.state.status,
                labels: this.state.labels,
                timestamp: new Date().toISOString()
            });
        }
    }

    removeListener(callback) {
        this.state.listeners.delete(callback);
    }

    notifyListeners() {
        this.state.labels = [...this.state.labels]; // ✅ Ensure new object reference
    
        this.state.listeners.forEach(callback => {
            console.log("Notifying listeners with labels:", this.state.labels);
            try {
                callback({
                    type: 'status',
                    status: this.state.status,
                    labels: [...this.state.labels], // ✅ Ensure new array reference
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('[LinkedInLabels] Error in listener callback:', error);
            }
        });
    }
    // Add these methods to the LinkedInLabelsDatabase class

    async createLabel(labelName) {
        try {
            // Check for duplicates
            const isDuplicate = this.state.labels.some(label =>
                label.label_name === labelName
            );

            if (isDuplicate) {
                throw new Error('Label with this name already exists');
            }

            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;

            if (!db || !currentUser) {
                throw new Error('Not authenticated');
            }

            // Generate label ID
            const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Random color generation (light colors)
            const generateRandomColor = () => {
                const hue = Math.floor(Math.random() * 360);
                return `hsl(${hue}, 70%, 75%)`;
            };

            // First, create the document in profile_labels_v2
            const labelRef = db.collection('profile_labels_v2').doc(labelId);
            await labelRef.set({
                n: labelName,          // name
                c: generateRandomColor(), // color
                p: [],                 // profiles array
                lu: new Date().toISOString() // last updated
            });

            // Then, update the users_v2 document
            const userRef = db.collection('users_v2').doc(currentUser.uid);

            await userRef.update({
                'd.l': firebase.firestore.FieldValue.arrayUnion({
                    id: labelId,
                    t: 'owned',    // type
                    ca: new Date().toISOString() // created at
                })
            });

            return labelId;
        } catch (error) {
            console.error('[LinkedInLabels] Create label error:', error);
            throw error;
        }
    }

    async deleteLabel(labelId) {
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
    
            if (!db || !currentUser) {
                throw new Error('Not authenticated');
            }
    
            // First, get the current user document to find the exact object to remove
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            const userDoc = await userRef.get();
            const userData = userDoc.data()?.d || {};
            const labelsList = userData.l || [];
            
            // Find the exact label object in the array
            const labelToRemove = labelsList.find(label => label.id === labelId);
            
            if (!labelToRemove) {
                throw new Error('Label not found in user document');
            }
    
            // First, delete from profile_labels_v2
            const labelRef = db.collection('profile_labels_v2').doc(labelId);
            await labelRef.delete();
    
            // Then, remove from users_v2 array using the exact object
            await userRef.update({
                'd.l': firebase.firestore.FieldValue.arrayRemove(labelToRemove)
            });
        } catch (error) {
            console.error('[LinkedInLabels] Delete label error:', error);
            throw error;
        }
    }

    async editLabelName(labelId, newName) {
        try {
            // Check for duplicates excluding the current label
            const isDuplicate = this.state.labels.some(label =>
                label.label_name === newName &&
                label.label_id !== labelId
            );

            if (isDuplicate) {
                throw new Error('Label with this name already exists');
            }

            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;

            if (!db || !currentUser) {
                throw new Error('Not authenticated');
            }

            // Update only the name in profile_labels_v2
            const labelRef = db.collection('profile_labels_v2').doc(labelId);
            await labelRef.update({
                n: newName,
                lu: new Date().toISOString() // Update last updated timestamp
            });
        } catch (error) {
            console.error('[LinkedInLabels] Edit label error:', error);
            throw error;
        }
    }

    async applyLabel(labelId) {
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
    
            if (!db || !currentUser) {
                throw new Error('Not authenticated');
            }
    
            // Get current profile info from the page
            const profileInfo = await window.labelManagerUtils.getProfileInfo();
            console.log(profileInfo)
            if (!profileInfo || !profileInfo.profile_id) {
                throw new Error('Could not get profile information from current page');
            }
    
            // First check if profile exists in profiles collection
            const profileRef = db.collection('profiles').doc(profileInfo.profile_id);
            const profileDoc = await profileRef.get();
    
            if (profileDoc.exists) {
                // Profile exists, update with new info but preserve existing username if new one is null
                const existingData = profileDoc.data();
                await profileRef.update({
                    n: profileInfo.name,
                    u: profileInfo.url,
                    img: profileInfo.image_url,
                    un: profileInfo.username || existingData.un, // Keep existing username if new one is null
                    lu: new Date().toISOString()
                });
            } else {
                // Profile doesn't exist, create new profile
                await profileRef.set({
                    c: profileInfo.profile_id,
                    n: profileInfo.name,
                    u: profileInfo.url,
                    img: profileInfo.image_url,
                    un: profileInfo.username,
                    lu: new Date().toISOString()
                });
            }
    
            // Update the label's profiles array
            const labelRef = db.collection('profile_labels_v2').doc(labelId);
            const labelDoc = await labelRef.get();
    
            if (!labelDoc.exists) {
                throw new Error('Label not found');
            }
    
            // Add profile_id to the profiles array if not already present
            await labelRef.update({
                p: firebase.firestore.FieldValue.arrayUnion(profileInfo.profile_id),
                lu: new Date().toISOString()
            });
    
            return {
                success: true,
                profile_id: profileInfo.profile_id
            };
    
        } catch (error) {
            console.error('[LinkedInLabels] Apply label error:', error);
            throw error;
        }
    }

    destroy() {
        this.cleanupSubscriptions();
        this.state.listeners.clear();
        window.firebaseService.removeAuthStateListener(this.boundAuthListener);
        const wasLoggedIn = this.state.status === 'logged_in';
        this.state.status = null;

        if (wasLoggedIn) {
            this.state.listeners.forEach(callback => {
                callback({
                    type: 'status',
                    status: 'logged_out',
                    labels: this.state.labels,
                    timestamp: new Date().toISOString()
                });
            });
        }
    }
}

if (!window.labelsDatabase) {
    window.labelsDatabase = new LinkedInLabelsDatabase();
}
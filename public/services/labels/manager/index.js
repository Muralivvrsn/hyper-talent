class LabelManagerCore {
    constructor() {
        // console.log('[LabelManagerCore] Initializing LabelManagerCore');
        this.checkInterval = null;
        this.listeners = new Set();
        this.state = {
            currentObserver: null,
            debounceTimer: null,
            isProcessing: false,
            labelsCache: new Map()
        };
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        this.notifyListeners = this.notifyListeners.bind(this);
        // console.log('[LabelManagerCore] Adding labels database listener');
        
    }

    addLabelListener(callback) {
        // console.log('[LabelManagerCore] Adding label listener');
        this.listeners.add(callback);
        // console.log('[LabelManagerCore] Initial callback with cached labels:', [...this.state.labelsCache.values()]);
        callback([...this.state.labelsCache.values()]);
        return () => this.removeLabelListener(callback);
    }

    removeLabelListener(callback) {
        // console.log('[LabelManagerCore] Removing label listener');
        this.listeners.delete(callback);
    }

    notifyListeners() {
        const labelsArray = [...this.state.labelsCache.values()];
        // console.log('[LabelManagerCore] Notifying listeners with labels:', labelsArray);
        this.listeners.forEach(listener => {
            try {
                listener(labelsArray);
            } catch (error) {
                // console.error('[LabelManagerCore] Error in label listener:', error);
            }
        });
    }

    async initialize() {
        // console.log('[LabelManagerCore] Initializing core functionality');
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        window.labelManagerUI.setupLabelButton();
        this.startChecking();
        // console.log('[LabelManagerCore] Initialization complete');
    }

    startChecking() {
        // console.log('[LabelManagerCore] Starting container check');
        const targetContainer = document.querySelector('.msg-overlay-list-bubble');
        if (targetContainer && window.labelManagerUI.setupLabelButton()) {
            // console.log('[LabelManagerCore] Target container found and button setup on first try');
            return;
        }

        // console.log('[LabelManagerCore] Starting interval check for target container');
        this.checkInterval = setInterval(() => {
            const targetContainer = document.querySelector('.msg-overlay-list-bubble');
            if (targetContainer && window.labelManagerUI.setupLabelButton()) {
                // console.log('[LabelManagerCore] Target container found and button setup during interval');
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        }, 2000);
    }

    async handleLabelsUpdate(labels) {
        // console.log('[LabelManagerCore] Handling labels update:', {
        //     labelsCount: Object.keys(labels).length,
        //     labels: labels
        // });
        
        this.updateLabelsCache(labels);
        
        // Make sure UI is initialized before updating dropdown
        if (!this.elements?.dropdown) {
            // console.log('[LabelManagerCore] Dropdown not initialized, setting up UI');
            await window.labelManagerUI.setupLabelButton();
        }
        
        window.labelManagerUI.updateLabelsDropdown(labels);
        this.notifyListeners();
        // console.log('[LabelManagerCore] Labels update complete');
    }

    updateLabelsCache(labels) {
        // console.log('[LabelManagerCore] Updating labels cache');
        this.state.labelsCache.clear();
        labels.forEach(label => {
            this.state.labelsCache.set(label.label_id, {
                id: label.label_id,
                name: label.label_name,
                color: label.label_color,
                profiles: label.profiles || []
            });
        });

    }

    async applyLabel(labelId, profileData) {
        try {
            const { 
                profile_id, 
                name, 
                image_url, 
                url, 
                username, 
                code = 'default'
            } = profileData;
    
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');
            const profileRef = db.collection('profiles').doc(profile_id);
            const profileDoc = await profileRef.get();
            if (!profileDoc.exists) {
                await profileRef.set({
                    n: name,          // name
                    img: image_url,   // image url
                    lu: new Date().toISOString(), // last updated
                    u: url,          // url
                    un: username,    // username
                    c: code          // code
                });
            }
    
            // Now update the label document to include this profile
            const labelRef = db.collection('profile_labels').doc(labelId);
            await db.runTransaction(async (transaction) => {
                const labelDoc = await transaction.get(labelRef);
                if (!labelDoc.exists) {
                    throw new Error('Label not found');
                }
    
                const labelData = labelDoc.data();
                const profiles = labelData.p || []; 
    
                // Only add if not already present
                if (!profiles.includes(profile_id)) {
                    transaction.update(labelRef, {
                        p: firebase.firestore.FieldValue.arrayUnion(profile_id)
                    });
                }
            });
    
            return true;
        } catch (error) {
            // console.error('Failed to apply label:', error);
            return false;
        }
    }

    cleanup() {
        // console.log('[LabelManagerCore] Starting cleanup');
        window.labelsDatabase.removeListener(this.handleLabelsUpdate);

        if (this.checkInterval) {
            // console.log('[LabelManagerCore] Clearing check interval');
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // console.log('[LabelManagerCore] Cleaning up UI');
        window.labelManagerUI.cleanup();

        // console.log('[LabelManagerCore] Clearing state');
        this.state.labelsCache.clear();
        this.listeners.clear();

        // console.log('[LabelManagerCore] Cleanup complete');
    }
}

// console.log('[LabelManagerCore] Creating instance');
window.labelManagerCore = new LabelManagerCore();
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
        // window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        window.labelManagerUI.setupLabelButton();
        this.startChecking();
        // console.log('[LabelManagerCore] Initialization complete');
    }

    startChecking() {
        // console.log('[LabelManagerCore] Starting container check');
        const targetContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container');
        if (targetContainer && window.labelManagerUI.setupLabelButton()) {
            // console.log('[LabelManagerCore] Target container found and button setup on first try');
            return;
        }

        // console.log('[LabelManagerCore] Starting interval check for target container');
        this.checkInterval = setInterval(() => {
            const targetContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container');
            if (targetContainer && window.labelManagerUI.setupLabelButton()) {
                // console.log('[LabelManagerCore] Target container found and button setup during interval');
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        }, 2000);
    }

    async handleLabelsUpdate(labels) {
      
        
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
        const actionType = `apply_label_${labelId}_${profileData.profile_id}`;
        
        // Check if we can start the action
        if (!window.start_action(actionType, `Adding ${profileData.name} to label...`)) {
            return false;
        }
    
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
            if (!db || !currentUser) {
                window.complete_action(actionType, false, 'Firebase initialization failed');
                throw new Error('Not initialized');
            }
    
            // First check if label exists and if profile is already labeled
            const labelRef = db.collection('profile_labels').doc(labelId);
            const labelDoc = await labelRef.get();
            
            if (!labelDoc.exists) {
                window.complete_action(actionType, false, 'Label not found');
                return false;
            }
    
            const labelData = labelDoc.data();
            const existingProfiles = labelData.p || [];
    
            // Check if profile already has this label
            if (existingProfiles.includes(profile_id)) {
                window.complete_action(actionType, false, `${profileData.name} already has this label`);
                return false;
            }
    
            // Create/update profile document if needed
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
            else {
                await profileRef.update({
                    n: name,
                    img: image_url,
                    lu: new Date().toISOString(),
                    u: url,
                    un: username,
                    c: code
                });
            }
    
            // Now update the label document to include this profile
            await labelRef.update({
                p: firebase.firestore.FieldValue.arrayUnion(profile_id)
            });
    
            window.complete_action(actionType, true, `Successfully added ${profileData.name} to the label`);
            window.userActionsDatabase.addAction("label_applied")
            return true;
        } catch (error) {
            const errorMessage = error.message === 'Label not found' 
                ? 'The selected label could not be found'
                : `Failed to add ${profileData.name} to the label`;
            
            window.complete_action(actionType, false, errorMessage);
            window.userActionsDatabase.addAction("label_applied");
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


window.labelManagerCore = new LabelManagerCore();


class LabelProfileManagerCore {
    constructor() {
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
        this.listeners.add(callback);
        callback([...this.state.labelsCache.values()]);
        return () => this.removeLabelListener(callback);
    }

    removeLabelListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        const labelsArray = [...this.state.labelsCache.values()];
        this.listeners.forEach(listener => {
            try {
                listener(labelsArray);
            } catch (error) {
                console.error('Error in label listener:', error);
            }
        });
    }

    async handleLabelsUpdate(labels) {
        this.updateLabelsCache(labels);
        window.labelProfileManagerUI.updateLabelsDropdown(labels);
        this.notifyListeners();
    }

    updateLabelsCache(labels) {
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
        console.log(labelId);
        console.log(profileData)
        try {
            const { 
                profileId, 
                name, 
                image_url, 
                url, 
                username, 
                code = 'default'
            } = profileData;
    

            // console.dir(profileData);
            console.log(profileData)
            // return;
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            // Create or update profile document
            const profileRef = db.collection('profiles').doc(profileId);
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
    
            // Update label document with new profile
            const labelRef = db.collection('profile_labels').doc(labelId);
            await db.runTransaction(async (transaction) => {
                const labelDoc = await transaction.get(labelRef);
                if (!labelDoc.exists) {
                    throw new Error('Label not found');
                }
    
                const labelData = labelDoc.data();
                const profiles = labelData.p || []; 
    
                // Only add if not already present
                if (!profiles.includes(profileId)) {
                    transaction.update(labelRef, {
                        p: firebase.firestore.FieldValue.arrayUnion(profileId),
                        lu: new Date().toISOString() // update last updated timestamp
                    });
                }
            });
    
            return true;
        } catch (error) {
            console.error('Failed to apply label:', error);
            window.show_error('Failed to apply label');
            return false;
        }
    }

    getLabels() {
        return [...this.state.labelsCache.values()];
    }

    cleanup() {
        window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        this.state.labelsCache.clear();
        this.listeners.clear();
    }
}

window.labelProfileManagerCore = new LabelProfileManagerCore();
class LabelsDatabase {
    constructor() {
        this.labels = {};
        this.listeners = new Set();
        this.unsubscribeSnapshot = null;
        
        window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
        window.firebaseService.addDbRefreshListener(this.handleDbRefresh.bind(this));
    }

    async handleAuthStateChange(user) {
        if (user) {
            await this.setupRealtimeSync();
        } else {
            this.labels = {};
            this.notifyListeners();
            if (this.unsubscribeSnapshot) {
                this.unsubscribeSnapshot();
                this.unsubscribeSnapshot = null;
            }
        }
    }

    async handleDbRefresh(db) {
        if (db) {
            await this.setupRealtimeSync();
        }
    }

    async setupRealtimeSync() {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) return;

            if (this.unsubscribeSnapshot) {
                this.unsubscribeSnapshot();
            }

            this.unsubscribeSnapshot = db.collection('labels')
                .doc(currentUser.uid)
                .onSnapshot((doc) => {
                    this.labels = doc.exists ? doc.data().labels || {} : {};
                    this.notifyListeners();
                }, (error) => {
                    console.error('Labels sync error:', error);
                });
        } catch (error) {
            console.error('Setup realtime sync failed:', error);
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
        callback(this.labels);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.labels);
            } catch (error) {
                console.error('Error in labels listener:', error);
            }
        });
    }

    async addLabel(labelName) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            if (this.labels[labelName]) throw new Error('Label already exists');

            const userLabelsRef = db.collection('labels').doc(currentUser.uid);
            const newLabel = {
                color: this.generateRandomColor(),
                createdAt: new Date().toISOString(),
                codes: {}
            };

            await userLabelsRef.set({
                labels: {
                    ...this.labels,
                    [labelName]: newLabel
                }
            }, { merge: true });

            return true;
        } catch (error) {
            console.error('Add label error:', error);
            throw error;
        }
    }

    generateRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async editLabel(oldName, newName) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            if (!this.labels[oldName]) throw new Error('Label not found');
            if (this.labels[newName]) throw new Error('New label name already exists');

            const userLabelsRef = db.collection('labels').doc(currentUser.uid);
            const updatedLabels = { ...this.labels };
            updatedLabels[newName] = { ...updatedLabels[oldName] };
            delete updatedLabels[oldName];

            await userLabelsRef.update({ labels: updatedLabels });
            return true;
        } catch (error) {
            console.error('Edit label error:', error);
            throw error;
        }
    }

    async deleteLabel(labelName) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            if (!this.labels[labelName]) throw new Error('Label not found');

            const userLabelsRef = db.collection('labels').doc(currentUser.uid);
            const updatedLabels = { ...this.labels };
            delete updatedLabels[labelName];

            await userLabelsRef.update({ labels: updatedLabels });
            return true;
        } catch (error) {
            console.error('Delete label error:', error);
            throw error;
        }
    }

    async addProfileToLabel(labelName, profileInfo, profileImage) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            if (!this.labels[labelName]) throw new Error('Label not found');

            const profileId = btoa(profileInfo.url).replace(/[^a-zA-Z0-9]/g, '');
            const userLabelsRef = db.collection('labels').doc(currentUser.uid);

            const updatedLabels = { ...this.labels };
            updatedLabels[labelName].codes = updatedLabels[labelName].codes || {};
            updatedLabels[labelName].codes[profileId] = {
                name: profileInfo.name,
                url: profileInfo.url,
                code: profileImage,
                addedAt: new Date().toISOString()
            };

            await userLabelsRef.update({ labels: updatedLabels });
            return true;
        } catch (error) {
            console.error('Add profile to label error:', error);
            throw error;
        }
    }

    async removeProfileFromLabel(labelName, profileId) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            if (!this.labels[labelName]?.codes?.[profileId]) {
                throw new Error('Profile not found in label');
            }

            const userLabelsRef = db.collection('labels').doc(currentUser.uid);
            const updatedLabels = { ...this.labels };
            delete updatedLabels[labelName].codes[profileId];

            await userLabelsRef.update({ labels: updatedLabels });
            return true;
        } catch (error) {
            console.error('Remove profile from label error:', error);
            throw error;
        }
    }

    getAllLabels() {
        return this.labels;
    }

    destroy() {
        if (this.unsubscribeSnapshot) {
            this.unsubscribeSnapshot();
            this.unsubscribeSnapshot = null;
        }
        this.listeners.clear();
    }
}

window.labelsDatabase = new LabelsDatabase();
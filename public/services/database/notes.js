class NotesDatabase {
    constructor() {
        this.notes = {};
        this.listeners = new Set();
        this.unsubscribeSnapshot = null;

        window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
        window.firebaseService.addDbRefreshListener(this.handleDbRefresh.bind(this));
    }

    async handleAuthStateChange(user) {
        if (user) {
            await this.setupRealtimeSync();
        } else {
            this.notes = {};
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

            this.unsubscribeSnapshot = db.collection('notes')
                .doc(currentUser.uid)
                .onSnapshot((doc) => {
                    this.notes = doc.exists ? doc.data() : {};
                    this.notifyListeners();
                }, (error) => {
                    console.error('Notes sync error:', error);
                });
        } catch (error) {
            console.error('Setup realtime sync failed:', error);
        }
    }

    addListener(callback) {
        this.listeners.add(callback);
        callback(this.notes);
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.notes);
            } catch (error) {
                console.error('Error in notes listener:', error);
            }
        });
    }

    async saveNote(noteKey, profileInfo, profileImage, noteText) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const noteData = {
                [noteKey]: {
                    name: profileInfo.name,
                    url: profileInfo.url,
                    code: profileImage,
                    note: noteText,
                    updatedAt: new Date().toISOString()
                }
            };

            await notesRef.set(noteData, { merge: true });
            return true;
        } catch (error) {
            console.error('Save note error:', error);
            throw error;
        }
    }

    async deleteNote(noteKey) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();

            if (!notesDoc.exists) throw new Error('Notes not found');

            const notes = notesDoc.data();
            delete notes[noteKey];

            await notesRef.set(notes);
            return true;
        } catch (error) {
            console.error('Delete note error:', error);
            throw error;
        }
    }

    async getAllNotes() {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();
            return notesDoc.exists ? notesDoc.data() : {};
        } catch (error) {
            console.error('Get notes error:', error);
            throw error;
        }
    }

    destroy() {
        if (this.unsubscribeSnapshot) {
            this.unsubscribeSnapshot();
            this.unsubscribeSnapshot = null;
        }
        this.listeners.clear();
    }
}

window.notesDatabase = new NotesDatabase();
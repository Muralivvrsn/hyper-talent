class NotesDatabase {
    constructor() {
        this.notes = {};
        this.listeners = new Set();
        this.unsubscribeSnapshot = null;
        this.currentSubscriptionBatch = new Set();
        this.pendingNotes = new Map();
        this.lastProcessedChunk = -1;
        this.totalChunks = 0;

        window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
        // window.firebaseService.addDbRefreshListener(this.handleDbRefresh.bind(this));
    }

    async handleAuthStateChange(user) {
        if (user) {
            await this.setupRealtimeSync();
        } else {
            this.notes = {};
            this.notifyListeners();
            this.cleanupSubscriptions();
        }
    }

    async handleDbRefresh(db) {
        if (db) {
            await this.setupRealtimeSync();
        }
    }

    cleanupSubscriptions() {
        if (this.currentSubscriptionBatch) {
            this.currentSubscriptionBatch.forEach(unsub => {
                if (typeof unsub === 'function') {
                    unsub();
                }
            });
            this.currentSubscriptionBatch.clear();
        }
    }

    async setupRealtimeSync() {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) return;

            this.cleanupSubscriptions();

            this.currentSubscriptionBatch = new Set();
            this.pendingNotes = new Map();
            this.lastProcessedChunk = -1;
            this.totalChunks = 0;

            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            };

            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                try {
                    if (!userDoc.exists) {
                        console.warn('User document not found');
                        return;
                    }

                    const userData = userDoc.data();
                    const noteIds = userData?.d?.n || [];
                    console.log(userData);
                    console.log(noteIds)

                    const noteIdChunks = chunkArray(noteIds, 10);
                    this.totalChunks = noteIdChunks.length;

                    const newBatch = new Set([userUnsubscribe]);

                    this.notes = {};
                    this.pendingNotes.clear();
                    this.lastProcessedChunk = -1;

                    noteIdChunks.forEach((chunk, chunkIndex) => {
                        if (!chunk.length) return;

                        const noteUnsubscribe = db.collection('profile_notes')
                            .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                            .onSnapshot(async (noteSnapshot) => {
                                try {
                                    // Process notes in this chunk
                                    noteSnapshot.docs.forEach(doc => {
                                        const noteData = doc.data();
                                        this.pendingNotes.set(doc.id, {
                                            id: doc.id,
                                            note: noteData.n,           // note content
                                            lastUpdated: noteData.lu,   // last updated
                                            profileId: noteData.p     // profile data
                                        });
                                    });

                                    this.lastProcessedChunk = Math.max(this.lastProcessedChunk, chunkIndex);

                                    // if (this.lastProcessedChunk === this.totalChunks - 1) {
                                        this.notes = Object.fromEntries(this.pendingNotes);
                                        console.log(this.notes)
                                        this.notifyListeners();
                                    // }
                                } catch (error) {
                                    console.error('Error processing note chunk:', error);
                                }
                            }, error => {
                                console.error('Note listener error:', error);
                            });

                        newBatch.add(noteUnsubscribe);
                    });

                    const oldBatch = this.currentSubscriptionBatch;
                    this.currentSubscriptionBatch = newBatch;
                    oldBatch.forEach(unsub => unsub());

                } catch (error) {
                    console.error('Error processing user data:', error);
                }
            }, error => {
                console.error('User listener error:', error);
            });

            this.currentSubscriptionBatch.add(userUnsubscribe);

        } catch (error) {
            console.error('Setup realtime sync failed:', error);
            this.cleanupSubscriptions();
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

    async saveNote(noteId, profileId, noteText) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            // Update note with profile data
            await db.collection('profile_notes').doc(noteId).set({
                n: noteText,                   // note content
                lu: new Date().toISOString(),  // last updated
                p: profileId
            });

            // Update user's note list if new note
            const userRef = db.collection('users').doc(currentUser.uid);
            const userDoc = await userRef.get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const noteIds = userData?.d?.n || [];
                
                if (!noteIds.includes(noteId)) {
                    await userRef.update({
                        'd.n': firebase.firestore.FieldValue.arrayUnion(noteId)
                    });
                }
            }

            return true;
        } catch (error) {
            console.error('Save note error:', error);
            throw error;
        }
    }

    async deleteNote(noteId) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            await db.collection('users').doc(currentUser.uid).update({
                'd.n': firebase.firestore.FieldValue.arrayRemove(noteId)
            });

            await db.collection('profile_notes').doc(noteId).delete();

            return true;
        } catch (error) {
            console.error('Delete note error:', error);
            throw error;
        }
    }
    async getNotes(profileId) {
        try {
            // Search through the notes object for matching profileId
            console.log(this.notes)
            for (const [noteId, noteData] of Object.entries(this.notes)) {
                if (noteData.profileId === profileId) {
                    return {
                        id: noteId,
                        note: noteData.note,
                        lastUpdated: noteData.lastUpdated,
                        profileId: noteData.profileId
                    };
                }
            }
            
            // If no matching note found, return null
            return null;
        } catch (error) {
            console.error('Get notes error:', error);
            return null;
        }
    }


    async createNote(profileId, noteText) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');
            
            // Generate a unique note ID with timestamp and random string
            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create note reference with custom ID
            const noteRef = db.collection('profile_notes').doc(noteId);
            
            // Create note with profile data
            await noteRef.set({
                n: noteText,                   // note content
                lu: new Date().toISOString(),  // last updated
                p: profileId,                  // profile ID
            });
            
            // Add note ID to user's note list
            const userRef = db.collection('users').doc(currentUser.uid);
            await userRef.update({
                'd.n': firebase.firestore.FieldValue.arrayUnion(noteId)
            });
            
            return noteId;
        } catch (error) {
            console.error('Create note error:', error);
            throw error;
        }
    }

    async updateNote(noteId, noteText) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');
    
            // Update existing note
            await db.collection('profile_notes').doc(noteId).update({
                n: noteText,                   // note content
                lu: new Date().toISOString(),  // last updated
            });
    
            return true;
        } catch (error) {
            console.error('Update note error:', error);
            throw error;
        }
    }


    destroy() {
        this.cleanupSubscriptions();
        this.listeners.clear();
    }
}

window.notesDatabase = new NotesDatabase();
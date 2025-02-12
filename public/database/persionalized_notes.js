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


    async setupRealtimeSync() {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) return;
    
            // First, ensure complete cleanup
            if (this.currentSubscriptionBatch) {
                this.currentSubscriptionBatch.forEach(unsub => {
                    try {
                        unsub();
                    } catch (e) {
                        console.error('Notes Cleanup error:', e);
                    }
                });
            }
    
            // Reset all subscriptions and state
            this.currentSubscriptionBatch = new Set();
            this.notes = {};
    
            // Set up the user document listener first
            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(
                (userDoc) => {
                    // Clear existing note listeners first
                    this.currentSubscriptionBatch.forEach(unsub => {
                        if (unsub !== userUnsubscribe) { // Keep user listener active
                            try {
                                unsub();
                            } catch (e) {
                                console.error('Notes listener cleanup error:', e);
                            }
                        }
                    });
    
                    // Reset to only user listener
                    this.currentSubscriptionBatch = new Set([userUnsubscribe]);
    
                    if (!userDoc.exists) {
                        // console.log('User doc not found');
                        return;
                    }
    
                    const noteIds = userDoc.data()?.d?.n || [];
                    // console.log('User doc updated, note IDs:', noteIds);
    
                    // Set up new listeners for each note
                    noteIds.forEach(noteId => {
                        const noteUnsubscribe = db.collection('profile_notes')
                            .doc(noteId)
                            .onSnapshot(
                                async (noteDoc) => {
                                    if (!noteDoc.exists) {
                                        // console.log(`Note ${noteId} does not exist`);
                                        return;
                                    }
    
                                    const noteData = noteDoc.data();
                                    // console.log(`Note ${noteId} updated:`, noteData);
    
                                    // Update notes object
                                    this.notes[noteId] = {
                                        id: noteDoc.id,
                                        note: noteData.n,         // note content
                                        lastUpdated: noteData.lu, // last updated
                                        profileId: noteData.p     // profile data
                                    };
    
                                    // console.log('Notes updated:', this.notes);
                                    this.notifyListeners();
                                },
                                error => {
                                    console.error(`Note ${noteId} listener error:`, error);
                                }
                            );
    
                        this.currentSubscriptionBatch.add(noteUnsubscribe);
                    });
    
                    if (noteIds.length === 0) {
                        this.notes = {};
                        this.notifyListeners();
                    }
                },
                error => {
                    console.error('User document listener error:', error);
                }
            );
    
            // Add initial user subscription
            this.currentSubscriptionBatch.add(userUnsubscribe);
            // console.log('Notes sync setup completed');
    
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
        this.notes = {};
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

    async saveNote(noteId, profileId, noteText, profileData) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');

            // Update note with profile data

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
            // console.log(this.notes)
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


    async createNote(profileId, noteText, profileData = null) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');
            
            // Generate a unique note ID with timestamp and random string
            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create note reference with custom ID
            const noteRef = db.collection('profile_notes').doc(noteId);
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

    async updateNote(noteId, noteText, profileId, profileData) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Authentication error');
    
            // Update existing note
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
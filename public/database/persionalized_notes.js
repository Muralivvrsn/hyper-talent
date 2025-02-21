class NotesDatabase {
    constructor() {
        this.notes = {};
        this.listeners = new Set();
        this.currentSubscriptionBatch = new Set();
        this.status = 'in_progress';
        this.initialized = false;

        window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
    }

    async handleAuthStateChange(authState) {
        try {
            if (!authState || !authState.type || !authState.status) {
                return;
            }

            // Update status immediately
            if (authState.status === 'logged_in') {
                // For logged_in, first set to in_progress while loading data
                this._updateStatus('in_progress');
                await this.loadNotes();
            } else {
                // For other statuses (logged_out, in_progress), update immediately
                this._updateStatus(authState.status);
                this.notes = {};
                this.cleanupSubscriptions();
            }
        } catch (error) {
            console.error('[NotesDB] Error handling auth state change:', error);
            this._notifyError('auth_state_change_failed', error.message);
            this._updateStatus('logged_out');
        }
    }

    _updateStatus(newStatus) {
        this.status = newStatus;
        this.notifyListeners();
    }

    _notifyError(code, message) {
        this.listeners.forEach(callback => {
            try {
                callback({
                    type: 'error',
                    status: this.status,
                    notes: this.notes,
                    error: {
                        code,
                        message,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                console.error('[NotesDB] Error in error notification:', error);
            }
        });
    }

    async loadNotes() {
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) {
                this._notifyError('initialization_failed', 'Firebase not initialized');
                this._updateStatus('logged_out');
                return;
            }

            // Clean up existing subscriptions
            this.cleanupSubscriptions();
            this.notes = {};

            // Set up the user document listener
            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(
                async (userDoc) => {
                    try {
                        this.cleanupNoteSubscriptions();

                        if (!userDoc.exists) {
                            this.notes = {};
                            this._updateStatus('logged_in');
                            return;
                        }

                        const noteIds = userDoc.data()?.d?.n || [];
                        if (noteIds.length === 0) {
                            this.notes = {};
                            this._updateStatus('logged_in');
                            return;
                        }

                        await this.setupNoteListeners(db, noteIds);
                    } catch (error) {
                        console.error('[NotesDB] User doc processing error:', error);
                        this._notifyError('user_doc_processing_failed', error.message);
                        this._updateStatus('logged_out');
                    }
                },
                error => {
                    console.error('[NotesDB] User document listener error:', error);
                    this._notifyError('user_listener_failed', error.message);
                    this._updateStatus('logged_out');
                }
            );

            this.currentSubscriptionBatch.add(userUnsubscribe);
            this.initialized = true;

        } catch (error) {
            console.error('[NotesDB] Load notes failed:', error);
            this._notifyError('load_notes_failed', error.message);
            this.cleanupSubscriptions();
            this._updateStatus('logged_out');
        }
    }

    async setupNoteListeners(db, noteIds) {
        let loadedNotes = 0;
        const totalNotes = noteIds.length;

        noteIds.forEach(noteId => {
            const noteUnsubscribe = db.collection('profile_notes')
                .doc(noteId)
                .onSnapshot(
                    async (noteDoc) => {
                        try {
                            if (!noteDoc.exists) {
                                loadedNotes++;
                                return;
                            }

                            const noteData = noteDoc.data();
                            this.notes[noteId] = {
                                id: noteDoc.id,
                                note: noteData.n,
                                lastUpdated: noteData.lu,
                                profileId: noteData.p
                            };

                            loadedNotes++;
                            if (loadedNotes >= totalNotes) {
                                this._updateStatus('logged_in');
                            }
                        } catch (error) {
                            console.error(`[NotesDB] Note processing error:`, error);
                            this._notifyError('note_processing_failed', error.message);
                        }
                    },
                    error => {
                        console.error(`[NotesDB] Note listener error:`, error);
                        this._notifyError('note_listener_failed', error.message);
                        loadedNotes++;
                        if (loadedNotes >= totalNotes) {
                            this._updateStatus('logged_in');
                        }
                    }
                );

            this.currentSubscriptionBatch.add(noteUnsubscribe);
        });
    }

    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
            callback({
                type: 'status',
                status: this.status,
                notes: this.notes
            });
        }
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback({
                    type: 'status',
                    status: this.status,
                    notes: this.notes
                });
            } catch (error) {
                console.error('[NotesDB] Error in listener callback:', error);
            }
        });
    }

    // async setupRealtimeSync() {
    //     if (!this.loading) {
    //         this.setLoading(true);
    //     }

    //     try {
    //         const { db, currentUser } = await window.firebaseService.initialize();
    //         if (!db || !currentUser) {
    //             this.notifyError('initialization_failed', 'Firebase not initialized');
    //             return;
    //         }

    //         // Clean up existing subscriptions
    //         this.cleanupSubscriptions();
    //         this.notes = {};

    //         // Set up the user document listener
    //         const userRef = db.collection('users').doc(currentUser.uid);
    //         const userUnsubscribe = userRef.onSnapshot(
    //             async (userDoc) => {
    //                 try {
    //                     // Clear note listeners but keep user listener
    //                     this.cleanupNoteSubscriptions();

    //                     if (!userDoc.exists) {
    //                         this.notes = {};
    //                         this.notifyListeners();
    //                         this.setLoading(false);
    //                         return;
    //                     }

    //                     const noteIds = userDoc.data()?.d?.n || [];
    //                     if (noteIds.length === 0) {
    //                         this.notes = {};
    //                         this.notifyListeners();
    //                         this.setLoading(false);
    //                         return;
    //                     }

    //                     await this.setupNoteListeners(db, noteIds);
    //                 } catch (error) {
    //                     console.error('[NotesDB] User doc processing error:', error);
    //                     this.notifyError('user_doc_processing_failed', error.message);
    //                 }
    //             },
    //             error => {
    //                 console.error('[NotesDB] User document listener error:', error);
    //                 this.notifyError('user_listener_failed', error.message);
    //                 this.setLoading(false);
    //             }
    //         );

    //         this.currentSubscriptionBatch.add(userUnsubscribe);
    //         this.initialized = true;

    //     } catch (error) {
    //         console.error('[NotesDB] Setup realtime sync failed:', error);
    //         this.notifyError('sync_setup_failed', error.message);
    //         this.cleanupSubscriptions();
    //         this.setLoading(false);
    //     }
    // }

    cleanupNoteSubscriptions() {
        // Keep only the user listener, remove note listeners
        const userListener = Array.from(this.currentSubscriptionBatch)
            .find(listener => listener.toString().includes('users'));

        this.currentSubscriptionBatch.forEach(unsub => {
            if (unsub !== userListener) {
                try {
                    unsub();
                } catch (e) {
                    console.error('[NotesDB] Note cleanup error:', e);
                }
            }
        });

        this.currentSubscriptionBatch = new Set();
        if (userListener) {
            this.currentSubscriptionBatch.add(userListener);
        }
    }

    cleanupSubscriptions() {
        this.currentSubscriptionBatch.forEach(unsub => {
            try {
                unsub();
            } catch (e) {
                console.error('[NotesDB] Cleanup error:', e);
            }
        });
        this.currentSubscriptionBatch.clear();
        this.initialized = false;
    }

    async createNote(profileId, noteText, profileData = null) {
        this.setLoading(true);
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const noteRef = db.collection('profile_notes').doc(noteId);
            const profileRef = db.collection('profiles').doc(profileId);

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

            await noteRef.set({
                n: noteText,
                lu: new Date().toISOString(),
                p: profileId
            });

            await db.collection('users').doc(currentUser.uid).update({
                'd.n': firebase.firestore.FieldValue.arrayUnion(noteId)
            });

            return noteId;
        } catch (error) {
            console.error('[NotesDB] Create note error:', error);
            this.notifyError('note_creation_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async updateNote(noteId, noteText, profileId, profileData) {
        this.setLoading(true);
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            const profileRef = db.collection('profiles').doc(profileId);
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
                n: noteText,
                lu: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('[NotesDB] Update note error:', error);
            this.notifyError('note_update_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async deleteNote(noteId) {
        this.setLoading(true);
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            await db.collection('users').doc(currentUser.uid).update({
                'd.n': firebase.firestore.FieldValue.arrayRemove(noteId)
            });

            await db.collection('profile_notes').doc(noteId).delete();

            return true;
        } catch (error) {
            console.error('[NotesDB] Delete note error:', error);
            this.notifyError('note_deletion_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async getNotes(profileId) {
        try {
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
            return null;
        } catch (error) {
            console.error('[NotesDB] Get notes error:', error);
            this.notifyError('get_notes_failed', error.message);
            return null;
        }
    }


    destroy() {
        this.setLoading(true);
        this.cleanupSubscriptions();
        this.notes = {};
        this.listeners.clear();
        this.initialized = false;
        this.setLoading(false);
    }
}

// Initialize only if not already present
if (!window.notesDatabase) {
    window.notesDatabase = new NotesDatabase();
}
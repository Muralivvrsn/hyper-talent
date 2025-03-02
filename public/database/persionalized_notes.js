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



    // Modify the setupNoteListeners method in NotesDatabase class to emit note update events

    async setupNoteListeners(db, noteItems) {
        let loadedNotes = 0;
        const totalNotes = noteItems.length;

        noteItems.forEach(noteItem => {
            const noteId = noteItem.id;

            const noteUnsubscribe = db.collection('profile_notes_v2')
                .doc(noteId)
                .onSnapshot(
                    async (noteDoc) => {
                        try {
                            if (!noteDoc.exists) {
                                loadedNotes++;
                                return;
                            }

                            const noteData = noteDoc.data();
                            const previousNote = this.notes[noteId];

                            this.notes[noteId] = {
                                id: noteDoc.id,
                                note: noteData.n,
                                lastUpdated: noteData.lu,
                                profileId: noteData.p,
                                // Add the metadata from user document
                                metadata: {
                                    createdAt: noteItem.ca,
                                    type: noteItem.t,
                                    // Include sharing info if available
                                    ...(noteItem.t === 'shared' && {
                                        sharedAt: noteItem.sa,
                                        sharedByName: noteItem.sbn,
                                        permission: noteItem.ps,
                                        accepted: noteItem.a
                                    })
                                }
                            };

                            if (previousNote && noteData) {
                                this.listeners.forEach(callback => {
                                    try {
                                        callback({
                                            type: 'status_changed',  // New event type
                                            noteId: noteId,
                                            profileId: noteData.p,
                                            note: this.notes[noteId],
                                            lastUpdated: noteData.lu,  // Important for time updates
                                            status: this.status,
                                            notes: this.notes
                                        });
                                    } catch (error) {
                                        console.error('[NotesDB] Error in status update callback:', error);
                                    }
                                });
                            }

                            // Emit note update event if this is an update (not initial load)
                            if (previousNote && (previousNote.note !== noteData.n || previousNote.lastUpdated !== noteData.lu)) {
                                this.listeners.forEach(callback => {
                                    try {
                                        callback({
                                            type: 'note_updated',
                                            noteId: noteId,
                                            profileId: noteData.p,
                                            note: this.notes[noteId],
                                            status: this.status,
                                            notes: this.notes
                                        });
                                    } catch (error) {
                                        console.error('[NotesDB] Error in note update callback:', error);
                                    }
                                });
                            }

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

    // Add a listener function for the user document to detect changes in the notes list
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
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(
                async (userDoc) => {
                    try {
                        this.cleanupNoteSubscriptions();

                        if (!userDoc.exists) {
                            this.notes = {};
                            this._updateStatus('logged_in');
                            return;
                        }

                        const noteItems = userDoc.data()?.d?.n || [];

                        // Store previous note IDs to detect changes
                        const previousNoteIds = Object.keys(this.notes);
                        const currentNoteIds = noteItems.map(item => item.id);

                        // Detect added or removed notes
                        const addedNotes = currentNoteIds.filter(id => !previousNoteIds.includes(id));
                        const removedNotes = previousNoteIds.filter(id => !currentNoteIds.includes(id));

                        // Notify about removed notes
                        if (removedNotes.length > 0) {
                            removedNotes.forEach(noteId => {
                                const profileId = this.notes[noteId]?.profileId;
                                if (profileId) {
                                    // Notify listeners about note removal
                                    this.listeners.forEach(callback => {
                                        try {
                                            callback({
                                                type: 'note_removed',
                                                noteId: noteId,
                                                profileId: profileId,
                                                status: this.status,
                                                notes: this.notes
                                            });
                                        } catch (error) {
                                            console.error('[NotesDB] Error in note removal callback:', error);
                                        }
                                    });
                                }

                                // Remove from local cache
                                delete this.notes[noteId];
                            });
                        }

                        // Emit an event for any changes to the user's notes list
                        if (addedNotes.length > 0 || removedNotes.length > 0) {
                            this.listeners.forEach(callback => {
                                try {
                                    callback({
                                        type: 'notes_list_updated',
                                        addedNotes: addedNotes,
                                        removedNotes: removedNotes,
                                        status: this.status,
                                        notes: this.notes
                                    });
                                } catch (error) {
                                    console.error('[NotesDB] Error in notes list update callback:', error);
                                }
                            });
                        }

                        if (noteItems.length === 0) {
                            this.notes = {};
                            this._updateStatus('logged_in');
                            return;
                        }

                        await this.setupNoteListeners(db, noteItems);
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

            this.setLoading(false)

            this.currentSubscriptionBatch.add(userUnsubscribe);
            this.initialized = true;

        } catch (error) {
            console.error('[NotesDB] Load notes failed:', error);
            this._notifyError('load_notes_failed', error.message);
            this.cleanupSubscriptions();
            this._updateStatus('logged_out');
        }
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

    cleanupNoteSubscriptions() {
        // Keep only the user listener, remove note listeners
        const userListener = Array.from(this.currentSubscriptionBatch)
            .find(listener => listener.toString().includes('users_v2'));

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
        // this.setLoading(true);
        if(!window.start_action('notes saving','notes saving'))
            return;

        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const noteRef = db.collection('profile_notes_v2').doc(noteId);

            // First create the note
            await noteRef.set({
                n: noteText,
                lu: new Date().toISOString(),
                p: profileId
            });

            // If profileData is provided, check and update profile
            if (profileData) {
                const profileRef = db.collection('profiles').doc(profileId);
                const profileDoc = await profileRef.get();

                if (!profileDoc.exists) {
                    await profileRef.set({
                        n: profileData.name || null,
                        u: profileData.url || null,
                        un: profileData.username || null,
                        c: profileId || null,
                        img: profileData.imageUrl || null,
                        lu: new Date().toISOString()
                    }, { merge: true });
                }
            }

            // Create note metadata object
            const noteMetadata = {
                id: noteId,
                ca: new Date().toISOString(),
                t: 'owned'
            };

            // Update user document
            await db.collection('users_v2').doc(currentUser.uid).update({
                'd.n': firebase.firestore.FieldValue.arrayUnion(noteMetadata)
            });

            window.complete_action('notes saving', true, 'notes saved')
            return noteId;
        } catch (error) {
            console.error('[NotesDB] Create note error:', error);
            window.complete_action('notes saving', false, 'someting wrong.')
            this._notifyError('note_creation_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async getNotesByProfileId(profileId) {
        return this.getNotes(profileId); // Just call the existing method for compatibility
    }

    async updateNote(noteId, noteText, profileId, profileData) {
        // this.setLoading(true);
        if(!window.start_action('notes saving','notes saving'))
            return;
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

            await db.collection('profile_notes_v2').doc(noteId).update({
                n: noteText,
                lu: new Date().toISOString()
            });
            window.complete_action('notes saving', true, 'notes saved')

            return true;
        } catch (error) {
            console.error('[NotesDB] Update note error:', error);
            window.complete_action('notes saving', false, 'notes failed')
            this._notifyError('note_update_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async deleteNote(noteId) {
        // this.setLoading(true);
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            // Get the current user's document
            const userDoc = await db.collection('users_v2').doc(currentUser.uid).get();
            if (!userDoc.exists) throw new Error('User document not found');

            const userData = userDoc.data();
            const notesArray = userData?.d?.n || [];

            // Find and remove the note from the array
            const updatedNotesArray = notesArray.filter(note => note.id !== noteId);

            // Update the user document with the filtered array
            await db.collection('users_v2').doc(currentUser.uid).update({
                'd.n': updatedNotesArray
            });

            // Delete the note document
            await db.collection('profile_notes_v2').doc(noteId).delete();
            window.complete_action('notes saving', true, 'notes saved')

            return true;
        } catch (error) {
            console.error('[NotesDB] Delete note error:', error);
            window.complete_action('notes saving', false, 'notes failed sved')
            this._notifyError('note_deletion_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async getNotes(profileId) {
        try {
            const result = [];
            for (const [noteId, noteData] of Object.entries(this.notes)) {
                if (noteData.profileId === profileId) {
                    result.push({
                        id: noteId,
                        note: noteData.note,
                        lastUpdated: noteData.lastUpdated,
                        profileId: noteData.profileId,
                        metadata: noteData.metadata
                    });
                }
            }
            return result.length > 0 ? result : null;
        } catch (error) {
            console.error('[NotesDB] Get notes error:', error);
            this._notifyError('get_notes_failed', error.message);
            return null;
        }
    }

    async shareNote(noteId, recipientUserId, permission = 'read', recipientName = null) {
        // this.setLoading(true);
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            // Check if note exists and user has permission
            const noteRef = db.collection('profile_notes_v2').doc(noteId);
            const noteDoc = await noteRef.get();

            if (!noteDoc.exists) throw new Error('Note does not exist');

            // Verify current user owns this note
            const userDoc = await db.collection('users_v2').doc(currentUser.uid).get();
            if (!userDoc.exists) throw new Error('User document not found');

            const userData = userDoc.data();
            const notesArray = userData?.d?.n || [];
            const noteMetadata = notesArray.find(note => note.id === noteId);

            if (!noteMetadata || noteMetadata.t !== 'owned') {
                throw new Error('You do not have permission to share this note');
            }

            // Create share metadata
            const shareMetadata = {
                id: noteId,
                ca: noteMetadata.ca, // Original creation date
                t: 'shared',
                sa: new Date().toISOString(), // Shared at timestamp
                sbn: currentUser.displayName || 'Unknown User', // Shared by name
                ps: permission, // Permission: 'read' or 'edit'
                a: null // Acceptance status: null (pending), true (accepted), false (rejected)
            };

            // Add to recipient's notes list
            await db.collection('users_v2').doc(recipientUserId).update({
                'd.n': firebase.firestore.FieldValue.arrayUnion(shareMetadata)
            });

            return true;
        } catch (error) {
            console.error('[NotesDB] Share note error:', error);
            this._notifyError('note_sharing_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async acceptSharedNote(noteId, accept = true) {
        // this.setLoading(true);
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            // Get the user's document
            const userDoc = await db.collection('users_v2').doc(currentUser.uid).get();
            if (!userDoc.exists) throw new Error('User document not found');

            const userData = userDoc.data();
            const notesArray = userData?.d?.n || [];

            // Find the shared note in the array
            const noteIndex = notesArray.findIndex(note => note.id === noteId && note.t === 'shared');
            if (noteIndex === -1) throw new Error('Shared note not found');

            // Update the acceptance status
            const updatedNotesArray = [...notesArray];
            updatedNotesArray[noteIndex] = {
                ...updatedNotesArray[noteIndex],
                a: accept
            };

            // Update the user document
            await db.collection('users_v2').doc(currentUser.uid).update({
                'd.n': updatedNotesArray
            });

            return true;
        } catch (error) {
            console.error('[NotesDB] Accept shared note error:', error);
            this._notifyError('accept_shared_note_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    async removeSharedNote(noteId) {
        // this.setLoading(true);
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Not initialized');

            // Get the user's document
            const userDoc = await db.collection('users_v2').doc(currentUser.uid).get();
            if (!userDoc.exists) throw new Error('User document not found');

            const userData = userDoc.data();
            const notesArray = userData?.d?.n || [];

            // Filter out the shared note from the array
            const updatedNotesArray = notesArray.filter(note => !(note.id === noteId && note.t === 'shared'));

            // Update the user document
            await db.collection('users_v2').doc(currentUser.uid).update({
                'd.n': updatedNotesArray
            });

            return true;
        } catch (error) {
            console.error('[NotesDB] Remove shared note error:', error);
            this._notifyError('remove_shared_note_failed', error.message);
            throw error;
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (isLoading) {
            this._updateStatus('in_progress');
        } else if (this.status === 'in_progress') {
            this._updateStatus('logged_in');
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
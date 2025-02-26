import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const NotesContext = createContext(null);

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (!context) {
        throw new Error('useNotes must be used within a NotesProvider');
    }
    return context;
};

export const NotesProvider = ({ children }) => {
    const { userProfile } = useAuth();
    const [notes, setNotes] = useState({});
    const [sharedNotes, setSharedNotes] = useState({});
    const [noteProfiles, setNoteProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const db = getFirestore();

    useEffect(() => {
        if (!userProfile?.data) {
            setNotes({});
            setSharedNotes({});
            setNoteProfiles({});
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribers = [];
        const profileUnsubscribers = new Map();

        // Get all notes from userProfile.data.notes
        const allNotes = userProfile?.data?.notes || [];

        // Create a map of note metadata from userProfile
        const noteMetadataMap = {};
        allNotes.forEach(note => {
            noteMetadataMap[note.id] = {
                a: note.a,
                ps: note.ps,
                sa: note.sa,
                sb: note.sb,
                sbn: note.sbn,
                ca: note.ca,
                t: note.t
            };
        });

        // Divide notes based on type (t)
        const ownedNoteIds = allNotes
            .filter(note => note.t !== 'shared')
            .map(note => note.id);

        const sharedNoteIds = allNotes
            .filter(note => note.t === 'shared')
            .map(note => note.id);

        const subscribeToNotes = (noteIds, setNotesState, isShared = false) => {
            if (!noteIds?.length) {
                setNotesState({});
                return;
            }

            noteIds.forEach(noteId => {
                const unsubscribe = onSnapshot(
                    doc(db, 'profile_notes_v2', noteId),
                    (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const noteData = docSnapshot.data();
                            const metaData = noteMetadataMap[noteId] || {};

                            // Merge Firestore data with metadata from userProfile
                            const mergedNoteData = {
                                id: noteId,
                                content: noteData.n,
                                lastUpdated: noteData.lu,
                                profileId: noteData.p,
                                sbn: metaData.sbn || noteData.sbn || null,
                                sa: metaData.sa || noteData.sa || null,
                                sb: metaData.sb || noteData.sb || null,
                                ca: metaData.ca || noteData.ca || null,
                                ps: metaData.ps || null,
                                a: metaData.a || null,
                                t: metaData.t || null
                            };

                            setNotesState(prev => ({
                                ...prev,
                                [noteId]: mergedNoteData
                            }));

                            // Subscribe to profile if needed
                            if (noteData.p && !profileUnsubscribers.has(noteData.p)) {
                                const profileUnsub = onSnapshot(
                                    doc(db, 'profiles', noteData.p),
                                    (profileSnapshot) => {
                                        if (profileSnapshot.exists()) {
                                            const profileData = profileSnapshot.data();
                                            setNoteProfiles(prev => ({
                                                ...prev,
                                                [noteData.p]: {
                                                    name: profileData.n,
                                                    url: profileData.u,
                                                    image: profileData.img,
                                                    code: profileData.c,
                                                    lastUpdated: profileData.lu,
                                                    username: profileData.un
                                                }
                                            }));
                                        }
                                    },
                                    error => {
                                        console.error(`Error subscribing to profile ${noteData.p}:`, error);
                                    }
                                );
                                profileUnsubscribers.set(noteData.p, profileUnsub);
                            }
                        } else {
                            setNotesState(prev => {
                                const updated = { ...prev };
                                delete updated[noteId];
                                return updated;
                            });
                        }
                    },
                    error => {
                        console.error('Error subscribing to note:', error);
                        setError(error.message);
                    }
                );

                unsubscribers.push(unsubscribe);
            });
        };

        // Subscribe to owned notes
        subscribeToNotes(ownedNoteIds, setNotes, false);

        // Subscribe to shared notes
        subscribeToNotes(sharedNoteIds, setSharedNotes, true);

        setLoading(false);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            profileUnsubscribers.forEach(unsub => unsub());
        };
    }, [userProfile?.data, db]);

    const getNoteWithProfile = (noteId) => {
        const ownedNote = notes[noteId];
        const sharedNote = sharedNotes[noteId];
        const note = ownedNote || sharedNote;

        if (!note) return null;

        return {
            id: noteId,
            content: note.content,
            lastUpdated: note.lastUpdated,
            profile: note.profileId ? noteProfiles[note.profileId] : null,
            isShared: !!sharedNote,
            ...note
        };
    };

    const value = {
        notes,
        sharedNotes,
        loading,
        error,
        getNoteWithProfile
    };

    return (
        <NotesContext.Provider value={value}>
            {children}
        </NotesContext.Provider>
    );
};
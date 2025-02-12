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
    const [noteProfiles, setNoteProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const db = getFirestore();

    useEffect(() => {
        if (!userProfile?.data?.noteIds?.length) {
            setNotes({});
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribers = [];
        const profileUnsubscribers = new Map();

        // Subscribe to notes
        userProfile?.data.noteIds.forEach(noteId => {
            const unsubscribe = onSnapshot(
                doc(db, 'profile_notes', noteId),
                (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const noteData = docSnapshot.data();
                        
                        setNotes(prev => ({
                            ...prev,
                            [noteId]: {
                                content: noteData.n,
                                lastUpdated: noteData.lu,
                                profileId: noteData.p
                            }
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
                    }
                },
                error => {
                    console.error('Error subscribing to note:', error);
                    setError(error.message);
                }
            );

            unsubscribers.push(unsubscribe);
        });

        setLoading(false);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            profileUnsubscribers.forEach(unsub => unsub());
        };
    }, [userProfile?.data?.noteIds]);

    const getNoteWithProfile = (noteId) => {
        const note = notes[noteId];
        if (!note) return null;

        return {
            id: noteId,
            content: note.content,
            lastUpdated: note.lastUpdated,
            profile: note.profileId ? noteProfiles[note.profileId] : null
        };
    };

    const value = {
        notes,
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
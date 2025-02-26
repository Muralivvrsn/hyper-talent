import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const LabelContext = createContext(null);

export const useLabels = () => {
    const context = useContext(LabelContext);
    if (!context) {
        throw new Error('useLabels must be used within a LabelProvider');
    }
    return context;
};

export const LabelProvider = ({ children }) => {
    const { userProfile } = useAuth();
    const [labels, setLabels] = useState({});
    const [activeSharedLabels, setActiveSharedLabels] = useState({});
    const [pendingSharedLabels, setPendingSharedLabels] = useState({});
    const [labelProfiles, setLabelProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const db = getFirestore();

    useEffect(() => {
        if (!userProfile?.data) {
            setLabels({});
            setActiveSharedLabels({});
            setPendingSharedLabels({});
            setLabelProfiles({});
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribers = [];
        const profileUnsubscribers = new Map();

        // Get all labels from userProfile.data.labels
        const allLabels = userProfile?.data?.labels || [];
        
        // Divide labels based on type (t)
        const ownedLabelIds = allLabels
            .filter(label => label.t !== 'shared')
            .map(label => label.id);
            
        const sharedLabels = allLabels
            .filter(label => label.t === 'shared');
            
        // Subscribe to owned labels
        const subscribeToOwnedLabels = () => {
            if (ownedLabelIds.length) {
                ownedLabelIds.forEach(labelId => {
                    const unsubscribe = onSnapshot(
                        doc(db, 'profile_labels_v2', labelId),
                        (docSnapshot) => {
                            if (docSnapshot.exists()) {
                                const labelData = docSnapshot.data();
                                setLabels(prev => ({
                                    ...prev,
                                    [labelId]: {
                                        id: labelId,
                                        name: labelData.n,
                                        color: labelData.c,
                                        createdBy: labelData.lc,
                                        lastUpdated: labelData.lu,
                                        profileIds: labelData.p || []
                                    }
                                }));

                                subscribeToProfiles(labelData.p || [], profileUnsubscribers);
                            } else {
                                setLabels(prev => {
                                    const updated = { ...prev };
                                    delete updated[labelId];
                                    return updated;
                                });
                            }
                        },
                        error => {
                            console.error('Error subscribing to label:', error);
                            setError(error.message);
                        }
                    );
                    unsubscribers.push(unsubscribe);
                });
            }
        };

        // Subscribe to shared labels
        const subscribeToSharedLabels = () => {
            if (!sharedLabels.length) {
                setActiveSharedLabels({});
                setPendingSharedLabels({});
                return;
            }

            const currentSharedLabelIds = new Set(sharedLabels.map(sl => sl.id));

            setPendingSharedLabels(prev => {
                const updated = {};
                Object.entries(prev).forEach(([id, label]) => {
                    if (currentSharedLabelIds.has(id)) {
                        updated[id] = label;
                    }
                });
                return updated;
            });

            setActiveSharedLabels(prev => {
                const updated = {};
                Object.entries(prev).forEach(([id, label]) => {
                    if (currentSharedLabelIds.has(id)) {
                        updated[id] = label;
                    }
                });
                return updated;
            });

            // Subscribe to each shared label
            sharedLabels.forEach(sharedLabel => {
                const unsubscribe = onSnapshot(
                    doc(db, 'profile_labels_v2', sharedLabel.id),
                    (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const labelData = docSnapshot.data();
                            const labelInfo = {
                                id: sharedLabel.id,
                                name: labelData.n,
                                color: labelData.c,
                                createdBy: labelData.lc,
                                lastUpdated: labelData.lu,
                                profileIds: labelData.p || [],
                                accessType: sharedLabel.a
                            };

                            // Handle all possible states
                            if (sharedLabel.a === true) {
                                // When accepted, move to active and remove from pending
                                setActiveSharedLabels(prev => ({
                                    ...prev,
                                    [sharedLabel.id]: labelInfo
                                }));
                                setPendingSharedLabels(prev => {
                                    const updated = { ...prev };
                                    delete updated[sharedLabel.id];
                                    return updated;
                                });
                                subscribeToProfiles(labelData.p || [], profileUnsubscribers);
                            } else if (sharedLabel.a === false) {
                                // When declined, remove from both states
                                setActiveSharedLabels(prev => {
                                    const updated = { ...prev };
                                    delete updated[sharedLabel.id];
                                    return updated;
                                });
                                setPendingSharedLabels(prev => {
                                    const updated = { ...prev };
                                    delete updated[sharedLabel.id];
                                    return updated;
                                });
                            } else if (sharedLabel.a === null) {
                                // When pending, add to pending and remove from active
                                setPendingSharedLabels(prev => ({
                                    ...prev,
                                    [sharedLabel.id]: labelInfo
                                }));
                                setActiveSharedLabels(prev => {
                                    const updated = { ...prev };
                                    delete updated[sharedLabel.id];
                                    return updated;
                                });
                            }
                        } else {
                            // If document doesn't exist, remove from both states
                            setActiveSharedLabels(prev => {
                                const updated = { ...prev };
                                delete updated[sharedLabel.id];
                                return updated;
                            });
                            setPendingSharedLabels(prev => {
                                const updated = { ...prev };
                                delete updated[sharedLabel.id];
                                return updated;
                            });
                        }
                    },
                    error => {
                        console.error('Error subscribing to shared label:', error);
                        setError(error.message);
                    }
                );
                unsubscribers.push(unsubscribe);
            });
        };

        const subscribeToProfiles = (profileIds, profileUnsubscribers) => {
            profileIds.forEach(profileId => {
                if (!profileUnsubscribers.has(profileId)) {
                    const profileUnsub = onSnapshot(
                        doc(db, 'profiles', profileId),
                        (profileSnapshot) => {
                            if (profileSnapshot.exists()) {
                                const profileData = profileSnapshot.data();
                                setLabelProfiles(prev => ({
                                    ...prev,
                                    [profileId]: {
                                        id: profileId,
                                        name: profileData.n,
                                        url: profileData.u,
                                        image: profileData.img,
                                        code: profileData.c,
                                        lastUpdated: profileData.lu,
                                        username: profileData.un
                                    }
                                }));
                            } else {
                                setLabelProfiles(prev => {
                                    const updated = { ...prev };
                                    delete updated[profileId];
                                    return updated;
                                });
                            }
                        },
                        error => {
                            console.error(`Error subscribing to profile ${profileId}:`, error);
                        }
                    );
                    profileUnsubscribers.set(profileId, profileUnsub);
                }
            });
        };

        subscribeToOwnedLabels();
        subscribeToSharedLabels();
        setLoading(false);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            profileUnsubscribers.forEach(unsub => unsub());
        };
    }, [userProfile?.data, db]);

    const getLabelProfiles = (labelId, isShared = false) => {
        const labelCollection = isShared ? activeSharedLabels : labels;
        const label = labelCollection[labelId];
        if (!label) return [];

        return label.profileIds
            .map(profileId => ({
                id: profileId,
                ...labelProfiles[profileId]
            }))
            .filter(profile => profile.name || profile.url);
    };

    const value = {
        labels,
        activeSharedLabels,
        pendingSharedLabels,
        loading,
        error,
        getLabelProfiles
    };

    return (
        <LabelContext.Provider value={value}>
            {children}
        </LabelContext.Provider>
    );
};
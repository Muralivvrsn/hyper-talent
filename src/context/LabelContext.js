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
    const { userData } = useAuth();
    const [labels, setLabels] = useState({});
    const [labelProfiles, setLabelProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const db = getFirestore();

    useEffect(() => {
        if (!userData?.labelIds?.length) {
            setLabels({});
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribers = [];
        const profileUnsubscribers = new Map();

        // Subscribe to labels
        userData.labelIds.forEach(labelId => {
            const unsubscribe = onSnapshot(
                doc(db, 'profile_labels', labelId),
                (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const labelData = docSnapshot.data();
                        
                        setLabels(prev => ({
                            ...prev,
                            [labelId]: {
                                name: labelData.n,
                                color: labelData.c,
                                lastUpdated: labelData.lu,
                                profileIds: labelData.p || []
                            }
                        }));

                        // Subscribe to each profile
                        labelData.p?.forEach(profileId => {
                            if (!profileUnsubscribers.has(profileId)) {
                                const profileUnsub = onSnapshot(
                                    doc(db, 'profiles', profileId),
                                    (profileSnapshot) => {
                                        if (profileSnapshot.exists()) {
                                            const profileData = profileSnapshot.data();
                                            setLabelProfiles(prev => ({
                                                ...prev,
                                                [profileId]: {
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
                                        console.error(`Error subscribing to profile ${profileId}:`, error);
                                    }
                                );
                                profileUnsubscribers.set(profileId, profileUnsub);
                            }
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

        setLoading(false);

        return () => {
            unsubscribers.forEach(unsub => unsub());
            profileUnsubscribers.forEach(unsub => unsub());
        };
    }, [userData?.labelIds]);

    const getLabelProfiles = (labelId) => {
        const label = labels[labelId];
        if (!label) return [];
        
        return label.profileIds.map(profileId => ({
            id: profileId,
            ...labelProfiles[profileId]
        })).filter(profile => profile.name || profile.url);
    };

    const value = {
        labels,
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
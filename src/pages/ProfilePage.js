import React, { useState, useEffect } from 'react';
import { User, FileText, Edit2, Loader2 } from 'lucide-react';
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { useProfileNote } from '../context/ProfileNoteContext';

const ProfilePage = () => {
    const { user } = useAuth();
    const [profileInfo, setProfileInfo] = useState(null);
    const { profileData, loading, setLoading } = useProfileNote();
    const [labels, setLabels] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(true);
    const [editedNote, setEditedNote] = useState('');
    const [originalNote, setOriginalNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    const createProfileId = (connectionCode) => {
        if (!connectionCode) return null;
        const profileUrl = `https://www.linkedin.com/in/${connectionCode}`;
        return btoa(profileUrl).replace(/=/g, '');
    };

    const extractUsername = (url) => {
        if (!url) return null;
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        return match ? match[1] : null;
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            const diffInHours = Math.floor(diffInMinutes / 60);
            const diffInDays = Math.floor(diffInHours / 24);
            const diffInWeeks = Math.floor(diffInDays / 7);
            const diffInMonths = Math.floor(diffInDays / 30);
            const diffInYears = Math.floor(diffInDays / 365);

            if (diffInSeconds < 60) return 'just now';
            if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
            if (diffInHours < 24) return `${diffInHours}h ago`;
            if (diffInDays < 7) return `${diffInDays}d ago`;
            if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
            if (diffInMonths < 12) return `${diffInMonths}mo ago`;
            return `${diffInYears}y ago`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !profileData?.connectionCode) {
                setLoading(false);
                return;
            }


            console.log('runnning proifle note')
            try {
                // Reset states
                setProfileInfo(null);
                setLabels([]);
                setEditedNote('');
                setOriginalNote('');
                setError(null);
                // setLoading(true);

                const db = getFirestore();
                const profileId = createProfileId(profileData.connectionCode);

                if (!profileId) {
                    throw new Error('Invalid profile ID');
                }

                const notesRef = doc(db, 'notes', user.uid);
                const notesDoc = await getDoc(notesRef);
                const url = `https://www.linkedin.com/in/${profileData.connectionCode}`;

                // Initialize profile info with provided data
                let currentProfileInfo = {
                    name: profileData.name || 'Unknown',
                    note: '',
                    imageCode: profileData.imageUrl || null,
                    updatedAt: null,
                    url: url
                };

                if (notesDoc.exists()) {
                    const notesData = notesDoc.data();
                    if (notesData[profileId]) {
                        currentProfileInfo = {
                            name: profileData.name || notesData[profileId].name || 'Unknown',
                            note: notesData[profileId].note || '',
                            imageCode: profileData.imageUrl || notesData[profileId].code || null,
                            updatedAt: notesData[profileId].updatedAt || null,
                            url: url
                        };
                        if (!notesData[profileId].username) {
                            const username = extractUsername(profileData.url);
                            if (username) {
                                await updateDoc(notesRef, {
                                    [`${profileId}.username`]: username
                                });
                            }
                        }
                    }
                    

                }

                setProfileInfo(currentProfileInfo);
                setEditedNote(currentProfileInfo.note);
                setOriginalNote(currentProfileInfo.note);

                // Fetch labels
                try {
                    const labelsRef = doc(db, 'labels', user.uid);
                    const labelsDoc = await getDoc(labelsRef);

                    if (labelsDoc.exists()) {
                        const labelsData = labelsDoc.data().labels || {};
                        const matchingLabels = [];

                        for (const [labelName, labelData] of Object.entries(labelsData)) {
                            if (labelData.codes && Object.keys(labelData.codes).includes(profileId)) {
                                matchingLabels.push({
                                    name: labelName,
                                    color: labelData.color || '#000000'
                                });
                            }
                        }

                        setLabels(matchingLabels);
                    }
                } catch (labelError) {
                    console.error('Error fetching labels:', labelError);
                    setLabels([]);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, profileData]);

    const handleSaveNote = async () => {
        if (!user || !profileData?.connectionCode) return;

        setIsSaving(true);
        try {
            const db = getFirestore();
            const profileId = createProfileId(profileData.connectionCode);

            if (!profileId) {
                throw new Error('Invalid profile ID');
            }

            const notesRef = doc(db, 'notes', user.uid);
            const notesDoc = await getDoc(notesRef);
            const url = `https://www.linkedin.com/in/${profileData.connectionCode}`;

            const noteData = {
                note: editedNote,
                updatedAt: new Date().toISOString(),
                name: profileData.name || 'Unknown',
                code: profileData.imageUrl || null,
                url: url,
                username: extractUsername(profileData.url)
            };

            if (notesDoc.exists()) {
                const notesData = notesDoc.data();
                await updateDoc(notesRef, {
                    [profileId]: {
                        ...(notesData[profileId] || {}),
                        ...noteData
                    }
                });
            } else {
                await setDoc(notesRef, {
                    [profileId]: noteData
                });
            }

            setProfileInfo(prev => ({
                ...prev,
                ...noteData
            }));
            setOriginalNote(editedNote);
            //   setIsEditing(false);
        } catch (error) {
            console.error('Error saving note:', error);
            setError('Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearNote = () => {
        setEditedNote('');
    };

    const hasChanges = editedNote !== originalNote;

    if (error) {
        return (
            <div className="p-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-red-500">{error}</div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-2">
            <Card>
                <CardContent className="p-3 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <p className="mt-2 text-xs text-muted-foreground">Loading profile data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Profile Header */}
                            <div className="flex items-center gap-2">
                                <Avatar className="h-10 w-10">
                                    {profileInfo?.imageCode && !profileInfo.imageCode.startsWith('data:') ? (
                                        <AvatarImage src={profileInfo.imageCode} alt={profileInfo?.name || 'Profile'} />
                                    ) : (
                                        <AvatarFallback>
                                            <User className="h-5 w-5" />
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <h1 className="text-sm font-medium">
                                    {profileInfo?.name || 'Unknown Profile'}
                                </h1>
                            </div>

                            <div className="space-y-3">
                                {/* Labels Section */}
                                <div>
                                    <h3 className="text-sm font-medium mb-2">Labels</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {labels && labels.length > 0 ? (
                                            labels.map((label, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="text-xs py-0"
                                                    style={{
                                                        borderColor: label.color || '#000000',
                                                        color: 'inherit'
                                                    }}
                                                >
                                                    {label.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                No labels assigned
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium">Notes</h3>
                                        {profileInfo?.updatedAt && !isEditing && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatTimeAgo(profileInfo.updatedAt)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-2">

                                        <div className="space-y-2">
                                            <Textarea
                                                value={editedNote}
                                                onChange={(e) => setEditedNote(e.target.value)}
                                                rows={3}
                                                placeholder="Enter your notes here..."
                                                className="w-full text-xs resize-none"
                                            />
                                            <div className="flex gap-1.5">
                                                <Button
                                                    onClick={handleSaveNote}
                                                    disabled={isSaving || !hasChanges}
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                >
                                                    {isSaving && (
                                                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                                    )}
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={handleClearNote}
                                                    disabled={isSaving}
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                >
                                                    Clear
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setEditedNote(originalNote);
                                                    }}
                                                    disabled={isSaving}
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfilePage;
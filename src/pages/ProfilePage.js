import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Clock, Link, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { useAuth } from '../context/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const ProfilePage = ({ profileData }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);

  const createProfileId = (connectionCode) => {
    // Convert connection code to full URL
    const profileUrl = `https://www.linkedin.com/in/${connectionCode}`;
    // Convert to base64 and remove padding
    return btoa(profileUrl).replace(/=/g, '');
  };

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user || !profileData?.connectionCode) return;

      try {
        const db = getFirestore();
        const profileId = createProfileId(profileData.connectionCode);
        const notesRef = doc(db, 'notes', user.uid);
        const notesDoc = await getDoc(notesRef);

        if (notesDoc.exists()) {
          const notesData = notesDoc.data();
          if (notesData[profileId]) {
            setNotes(notesData[profileId].note);
          }
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user, profileData]);

  // Convert connection code to profile URL
  const getProfileUrl = () => {
    if (profileData?.connectionCode) {
      return `https://www.linkedin.com/in/${profileData.connectionCode}`;
    }
    return profileData?.url || '#';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profileData?.avatar} alt="Profile" />
            <AvatarFallback>
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">LinkedIn Profile</h1>
            <div className="flex items-center gap-2 text-blue-600">
              <Link className="h-4 w-4" />
              <a href={getProfileUrl()} target="_blank" rel="noopener noreferrer" 
                 className="hover:underline">{profileData?.url || 'View Profile'}</a>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Add Note</Button>
              <Button variant="outline" size="sm">View History</Button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm break-all">{getProfileUrl()}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{profileData?.connectionCode || 'Connection Code'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-muted-foreground">Loading notes...</p>
                ) : notes ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                      <p className="text-sm">{notes}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No notes found for this profile</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
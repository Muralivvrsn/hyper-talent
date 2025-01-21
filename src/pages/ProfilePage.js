import React, { useState, useMemo } from 'react';
import { useLabels } from '../context/LabelContext';
import { useNotes } from '../context/NotesContext';
import ProfileCard from '../components/ProfileCard';
import FilterBar from '../components/FilterBar';

export default function ProfilePage() {
  const { labels, getLabelProfiles, loading: labelsLoading } = useLabels();
  const { notes, getNoteWithProfile, loading: notesLoading } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);

  // Combine profiles from labels and notes
  const profilesData = useMemo(() => {
    const profileMap = new Map();

    // Add profiles from labels
    Object.entries(labels).forEach(([labelId, label]) => {
      const labelProfiles = getLabelProfiles(labelId) || [];
      labelProfiles.forEach(profile => {
        if (!profileMap.has(profile.id)) {
          profileMap.set(profile.id, {
            profile: {
              id: profile.id,
              name: profile.name,
              url: profile.url,
              image: profile.image,
              code: profile.code,
              lastUpdated: profile.lastUpdated,
              username: profile.username
            },
            labels: [{
              id: labelId,
              name: label.name,
              color: label.color
            }],
            note: null
          });
        } else {
          profileMap.get(profile.id).labels.push({
            id: labelId,
            name: label.name,
            color: label.color
          });
        }
      });
    });

    // Add notes to existing profiles or create new entries
    Object.entries(notes).forEach(([noteId, noteData]) => {
      if (noteData.profileId) {
        const noteWithProfile = getNoteWithProfile(noteId);
        if (noteWithProfile?.profile) {
          if (profileMap.has(noteData.profileId)) {
            profileMap.get(noteData.profileId).note = {
              id: noteId,
              content: noteData.content
            };
          } else {
            profileMap.set(noteData.profileId, {
              profile: {
                id: noteData.profileId,
                name: noteWithProfile.profile.name,
                url: noteWithProfile.profile.url,
                image: noteWithProfile.profile.image,
                code: noteWithProfile.profile.code,
                lastUpdated: noteWithProfile.profile.lastUpdated,
                username: noteWithProfile.profile.username
              },
              labels: [],
              note: {
                id: noteId,
                content: noteData.content
              }
            });
          }
        }
      }
    });

    return Array.from(profileMap.values());
  }, [labels, notes, getLabelProfiles, getNoteWithProfile]);

  // console.log(labels)

  // Filter profiles based on search and selected labels
  const filteredProfiles = useMemo(() => {
    return profilesData.filter(({ profile, labels }) => {
      const matchesSearch = !searchTerm || 
        profile.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLabels = !selectedLabels.length || 
        labels.some(label => selectedLabels.includes(label.id));
      
      return matchesSearch && matchesLabels;
    });
  }, [profilesData, searchTerm, selectedLabels]);

  const handleLabelToggle = (labelId) => {
    setSelectedLabels(prev => 
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  if (labelsLoading || notesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Profiles</h1>
      
      <FilterBar
        labels={Object.values(labels)}
        selectedLabels={selectedLabels}
        onLabelToggle={handleLabelToggle}
        onSearchChange={setSearchTerm}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.map(({ profile, labels, note }) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            labels={labels}
            note={note}
          />
        ))}
      </div>
    </div>
  );
}
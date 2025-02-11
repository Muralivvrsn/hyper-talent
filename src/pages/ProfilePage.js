import React, { useState, useMemo } from 'react';
import { useLabels } from '../context/LabelContext';
import { useNotes } from '../context/NotesContext';
import ProfileCard from '../components/ProfileCard';
import FilterBar from '../components/FilterBar';
import PendingLabelsAlert from '../components/PendingLabelsAlert';

export default function ProfilePage() {
  const {
    labels,
    activeSharedLabels,
    getLabelProfiles,
    loading: labelsLoading
  } = useLabels();
  const { notes, getNoteWithProfile, loading: notesLoading } = useNotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [filterMode, setFilterMode] = useState('any');

  const profilesData = useMemo(() => {
    const profileMap = new Map();

    Object.entries(labels).forEach(([labelId, label]) => {
      const labelProfiles = getLabelProfiles(labelId, false) || [];
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
              color: label.color,
              createdBy: label.createdBy,
              isShared: false
            }],
            note: null
          });
        } else {
          profileMap.get(profile.id).labels.push({
            id: labelId,
            name: label.name,
            color: label.color,
            createdBy: label.createdBy,
            isShared: false
          });
        }
      });
    });

    Object.entries(activeSharedLabels).forEach(([labelId, label]) => {
      const labelProfiles = getLabelProfiles(labelId, true) || [];
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
              color: label.color,
              createdBy: label.createdBy,
              isShared: true
            }],
            note: null
          });
        } else {
          profileMap.get(profile.id).labels.push({
            id: labelId,
            name: label.name,
            color: label.color,
            createdBy: label.createdBy,
            isShared: true
          });
        }
      });
    });

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
  }, [labels, activeSharedLabels, notes, getLabelProfiles, getNoteWithProfile]);

  const filteredProfiles = useMemo(() => {
    return profilesData.filter(({ profile, labels }) => {
      const matchesSearch = !searchTerm ||
        profile.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLabels = !selectedLabels.length || (
        filterMode === 'all'
          ? selectedLabels.every(selectedId =>
            labels.some(label => label.id === selectedId)
          )
          : labels.some(label =>
            selectedLabels.includes(label.id)
          )
      );

      return matchesSearch && matchesLabels;
    });
  }, [profilesData, searchTerm, selectedLabels, filterMode]);

  const handleLabelToggle = (labelId) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleFilterModeChange = (mode) => {
    setFilterMode(mode);
  };

  if (labelsLoading || notesLoading) {
    return <div>Loading...</div>;
  }

  const ownedLabelsList = Object.entries(labels).map(([id, label]) => ({
    id,
    name: label.name,
    color: label.color,
    isShared: false
  }));

  const sharedLabelsList = Object.entries(activeSharedLabels).map(([id, label]) => ({
    id,
    name: label.name,
    color: label.color,
    isShared: true,
    createdBy: label.createdBy
  }));

  return (
    <div>
      <div className="flex items-center space-x-3 pb-4">
        <h1 className="text-lg font-semibold">Profile Management</h1>
      </div>

      <FilterBar
        ownedLabels={ownedLabelsList}
        sharedLabels={sharedLabelsList}
        selectedLabels={selectedLabels}
        onLabelToggle={handleLabelToggle}
        onSearchChange={setSearchTerm}
        filterMode={filterMode}
        onFilterModeChange={handleFilterModeChange}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3">
        {filteredProfiles.map(({ profile, labels, note }) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            labels={labels}
            note={note}
          />
        ))}
      </div>
      <PendingLabelsAlert />
    </div>
  );
}
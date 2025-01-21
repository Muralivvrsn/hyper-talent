import React, { createContext, useContext, useState } from 'react';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

const MigrationContext = createContext(null);

export const useMigration = () => {
  const context = useContext(MigrationContext);
  if (!context) throw new Error('useMigration must be used within MigrationProvider');
  return context;
};

const COLLECTIONS = {
  PROFILES: 'profiles',
  USERS: 'users',
  LABELS: 'profile_labels',
  NOTES: 'profile_notes',
  SHORTCUTS: 'message_templates'
};

// Extract LinkedIn ID from URL and clean it
const extractLinkedInId = (url) => {
  if (!url) return null;
  // Extract everything after /in/ in the URL
  const match = url.match(/\/in\/([^/?#)]+)/);
  if (!match) return null;
  return match[1].replace(/[^a-zA-Z0-9_-]/g, '');
};

export const MigrationProvider = ({ children }) => {
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const db = getFirestore();

  const migrateDatabase = async () => {
    setMigrating(true);
    setError(null);
    setProgress('Starting migration...');

    try {
      const labelsSnapshot = await getDocs(collection(db, 'labels'));
      const totalUsers = labelsSnapshot.size;
      let processedUsers = 0;

      for (const labelDoc of labelsSnapshot.docs) {
        const userId = labelDoc.id;
        // console.log('Processing user:', userId);
        
        const oldData = await fetchOldData(userId);
        const batch = writeBatch(db);
        
        setProgress(`Processing user ${processedUsers + 1} of ${totalUsers}`);

        // Process LinkedIn profiles from labels and notes
        const profilesData = processProfiles(oldData.labels, oldData.notes);
        // console.log('Profiles data:', profilesData);

        // Process labels
        const { labelsData, userLabelsAccess } = processLabels(oldData.labels, profilesData);
        // console.log('Labels data:', labelsData);

        // Process notes
        const { notesData, userNotesAccess } = processNotes(oldData.notes, profilesData);
        // console.log('Notes data:', notesData);

        // Process shortcuts
        const { shortcutsData, userShortcutsAccess } = processShortcuts(oldData.shortcuts);
        // console.log('Shortcuts data:', shortcutsData);

        // Create user structure
        const newUserData = createNewUserStructure(oldData, {
          labels: userLabelsAccess,
          notes: userNotesAccess,
          shortcuts: userShortcutsAccess
        });

        // Write everything to Firestore
        await writeMigrationUpdates(db, batch, {
          userId,
          profilesData,
          labelsData,
          notesData,
          shortcutsData,
          newUserData
        });

        processedUsers++;
      }

      setProgress('Migration completed successfully');
      return { success: true, usersProcessed: totalUsers };

    } catch (error) {
      // console.error('Migration error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setMigrating(false);
    }
  };

  const fetchOldData = async (userId) => {
    const [oldLabels, oldSettings, oldNotes, oldShortcuts, oldSheets] = await Promise.all([
      getDoc(doc(db, 'labels', userId)),
      getDoc(doc(db, 'settings', userId)),
      getDoc(doc(db, 'notes', userId)),
      getDoc(doc(db, 'shortcuts', userId)),
      getDoc(doc(db, 'sheets', userId))
    ]);

    return {
      labels: oldLabels.exists() ? oldLabels.data() : {},
      settings: oldSettings.exists() ? oldSettings.data() : {},
      notes: oldNotes.exists() ? oldNotes.data() : {},
      shortcuts: oldShortcuts.exists() ? oldShortcuts.data() : {},
      sheets: oldSheets.exists() ? oldSheets.data() : {}
    };
  };

  const processProfiles = (oldLabels, oldNotes) => {
    const profilesData = {};

    // Process profiles from labels
    if (oldLabels.labels) {
      Object.entries(oldLabels.labels).forEach(([labelName, labelData]) => {
        if (labelData.codes) {
          Object.entries(labelData.codes).forEach(([_, data]) => {
            if (data.url) {
              const profileId = extractLinkedInId(data.url);
              if (profileId && !profilesData[profileId]) {
                const isImageUrl = data.code?.startsWith('https://media.licdn.com');
                const profileData = {
                  n: data.name || null,
                  u: data.url || null,
                  img: isImageUrl ? data.code : null,
                  c: isImageUrl ? null : (data.code || null),
                  lu: data.addedAt || new Date().toISOString(),
                  un: null
                };
                
                // Only add if we have valid data
                if (profileId && (profileData.n || profileData.u)) {
                  profilesData[profileId] = profileData;
                }
              }
            }
          });
        }
      });
    }

    // Add notes data to profiles
    Object.entries(oldNotes).forEach(([_, noteData]) => {
      if (noteData.url) {
        const profileId = extractLinkedInId(noteData.url);
        if (profileId && !profilesData[profileId]) {
          const isImageUrl = noteData.code?.startsWith('https://media.licdn.com');
          const profileData = {
            n: noteData.name || null,
            u: noteData.url || null,
            img: isImageUrl ? noteData.code : null,
            c: isImageUrl ? null : (noteData.code || null),
            lu: noteData.updatedAt || new Date().toISOString(),
            un: null
          };
          
          // Only add if we have valid data
          if (profileId && (profileData.n || profileData.u)) {
            profilesData[profileId] = profileData;
          }
        }
      }
    });

    return profilesData;
  };

  const processLabels = (oldLabels, profilesData) => {
    const labelsData = {};
    const userLabelsAccess = [];

    if (oldLabels.labels) {
      Object.entries(oldLabels.labels).forEach(([labelName, data]) => {
        const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const associatedProfiles = data.codes ? 
          Object.entries(data.codes)
            .map(([_, profileData]) => extractLinkedInId(profileData.url))
            .filter(id => id && profilesData[id]) : [];

        labelsData[labelId] = {
          n: labelName,
          c: data.color || '#000000',
          lu: data.createdAt || new Date().toISOString(),
          p: associatedProfiles,
          r: [],
          w: []
        };
        
        userLabelsAccess.push(labelId);
      });
    }

    return { labelsData, userLabelsAccess };
  };

  const processNotes = (oldNotes, profilesData) => {
    const notesData = {};
    const userNotesAccess = [];

    Object.entries(oldNotes).forEach(([_, data]) => {
      if (data.url) {
        const profileId = extractLinkedInId(data.url);
        if (profileId && profilesData[profileId]) {
          const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          notesData[noteId] = {
            n: data.note || '',
            lu: data.updatedAt || new Date().toISOString(),
            p: profileId
          };

          userNotesAccess.push(noteId);
        }
      }
    });

    return { notesData, userNotesAccess };
  };

  const processShortcuts = (oldShortcuts) => {
    const shortcutsData = {};
    const userShortcutsAccess = [];

    if (oldShortcuts.shortcuts) {
      Object.entries(oldShortcuts.shortcuts).forEach(([_, data]) => {
        const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        shortcutsData[templateId] = {
          n: data.content || '',
          t: data.title || '',
          lu: data.lastUpdated || new Date().toISOString()
        };

        userShortcutsAccess.push(templateId);
      });
    }

    return { shortcutsData, userShortcutsAccess };
  };

  const createNewUserStructure = (oldData, accessData) => {
    const { settings, sheets } = oldData;
    
    return {
      n: settings?.name || '',
      e: settings?.email || '',
      av: '',
      ca: settings?.createdAt || new Date().toISOString(),
      ll: settings?.lastUpdated || new Date().toISOString(),
      th: settings?.theme || 'light',
      lg: settings?.language || 'en',
      ne: settings?.notifications || false,
      p: 'free',
      pe: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      d: {
        l: accessData.labels,
        n: accessData.notes,
        s: accessData.shortcuts
      },
      sd: {
        id: sheets?.spreadsheetId || null,
        ca: sheets?.createdAt || null,
        ls: sheets?.lastSynced || null
      }
    };
  };

  const writeMigrationUpdates = async (db, batch, { 
    userId, 
    profilesData, 
    labelsData, 
    notesData, 
    shortcutsData, 
    newUserData 
  }) => {
    // Write LinkedIn profiles - don't overwrite existing ones
    for (const [profileId, data] of Object.entries(profilesData)) {
      const profileRef = doc(db, COLLECTIONS.PROFILES, profileId);
      const existingProfile = await getDoc(profileRef);
      if (!existingProfile.exists()) {
        batch.set(profileRef, data);
      }
    }

    // Write to new collections without deleting old data
    Object.entries(labelsData).forEach(([labelId, data]) => {
      batch.set(doc(db, COLLECTIONS.LABELS, labelId), data);
    });

    Object.entries(notesData).forEach(([noteId, data]) => {
      batch.set(doc(db, COLLECTIONS.NOTES, noteId), data);
    });

    Object.entries(shortcutsData).forEach(([shortcutId, data]) => {
      batch.set(doc(db, COLLECTIONS.SHORTCUTS, shortcutId), data);
    });

    // Write user data
    batch.set(doc(db, COLLECTIONS.USERS, userId), newUserData);

    await batch.commit();
  };

  const value = {
    migrating,
    error,
    progress,
    migrateDatabase
  };

  return (
    <MigrationContext.Provider value={value}>
      {children}
    </MigrationContext.Provider>
  );
};

export default MigrationProvider;
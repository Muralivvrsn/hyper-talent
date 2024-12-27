import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { openDB } from 'idb';
import { useAuth } from './AuthContext';

const ProfileNoteContext = createContext();

const initDB = async () => {
  try {
    const db = await openDB('notesDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes');
        }
        if (!db.objectStoreNames.contains('labels')) {
          db.createObjectStore('labels');
        }
      },
    });
    return db;
  } catch (error) {
    throw error;
  }
};

export function useProfileNote() {
  return useContext(ProfileNoteContext);
}

export function ProfileNoteProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [currentPage, setCurrentPage] = useState('messages');
  const [lastProfileData, setLastProfileData] = useState(null);
  const { user } = useAuth();
  const chrome = window.chrome;

  useEffect(() => {
    const checkStoredData = async (key) => {
      try {
        chrome.storage.local.get(['profileData'], function(result) {
          if (result.profileData) {
            if (!lastProfileData || 
                lastProfileData.url !== result.profileData.url || 
                lastProfileData.name !== result.profileData.name) {
              setLoading(true);
              setProfileData(result.profileData);
              setLastProfileData(result.profileData);
              if(key){
                setCurrentPage('profile');
              }
            }
            chrome.storage.local.remove(['profileData']);
          }
        });
      } catch (error) {
        console.error('Error checking stored data:', error);
      }
    };

    const messageListener = (message) => {
      if (message.action === 'ProfileNotesTriggered') {
        checkStoredData(message.page);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    checkStoredData();

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [lastProfileData]);

  useEffect(() => {
    let unsubscribeNotes;
    let unsubscribeLabels;

    const syncData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const notesRef = doc(db, 'notes', user.uid);
        const labelsRef = doc(db, 'labels', user.uid);
        const idb = await initDB();

        unsubscribeNotes = onSnapshot(notesRef, async (snapshot) => {
          if (snapshot.exists()) {
            const notesData = snapshot.data();
            try {
              await idb.put('notes', notesData, user.uid);
            } catch (error) {
              console.error('Error storing notes:', error);
            }
          }
        });

        unsubscribeLabels = onSnapshot(labelsRef, async (snapshot) => {
          if (snapshot.exists()) {
            const labelsData = snapshot.data();
            try {
              await idb.put('labels', labelsData, user.uid);
            } catch (error) {
              console.error('Error storing labels:', error);
            }
          }
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncData();

    return () => {
      if (unsubscribeNotes) unsubscribeNotes();
      if (unsubscribeLabels) unsubscribeLabels();
    };
  }, [user?.uid]);

  const getNotes = async () => {
    if (!user?.uid) return null;
    try {
      const idb = await initDB();
      return await idb.get('notes', user.uid);
    } catch (err) {
      return null;
    }
  };

  const getLabels = async () => {
    if (!user?.uid) return null;
    try {
      const idb = await initDB();
      return await idb.get('labels', user.uid);
    } catch (err) {
      return null;
    }
  };

  const value = {
    loading,
    error,
    getNotes,
    getLabels,
    profileData,
    currentPage,
    setLoading,
    setCurrentPage
  };

  return (
    <ProfileNoteContext.Provider value={value}>
      {children}
    </ProfileNoteContext.Provider>
  );
}
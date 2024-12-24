import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileNoteContext = createContext();

export function useProfileNote() {
  return useContext(ProfileNoteContext);
}

export function ProfileNoteProvider({ children }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('messages');
  const [lastProfileData, setLastProfileData] = useState(null);
  const chrome = window.chrome

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        chrome.storage.local.get(['profileData'], function(result) {
          if (result.profileData) {
            // Check if the profile is different from the last one
            if (!lastProfileData || 
                lastProfileData.url !== result.profileData.url || 
                lastProfileData.name !== result.profileData.name) {
              setLoading(true);
              setProfileData(result.profileData);
              setLastProfileData(result.profileData);
              setCurrentPage('profile');
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
        checkStoredData();
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    checkStoredData();

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [lastProfileData]);

  const value = {
    profileData,
    loading,
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
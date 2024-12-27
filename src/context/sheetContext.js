import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const SheetContext = createContext();

export const SheetProvider = ({ children }) => {
  const { user } = useAuth();
  const [sheetData, setSheetData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const chrome = window.chrome;

  useEffect(() => {
    if (user?.uid) initializeSheetData();
  }, [user]);

  const initializeSheetData = async () => {
    try {
      const db = getFirestore();
      const snap = await getDoc(doc(db, 'sheets', user.uid));
      if (snap.exists()) setSheetData(snap.data());
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGoogleToken = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' });
    return response.token;
  };

  const contextValue = {
    sheetData,
    setSheetData,
    isLoading,
    getGoogleToken
  };

  return (
    <SheetContext.Provider value={contextValue}>
      {children}
    </SheetContext.Provider>
  );
};

export const useSheet = () => {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('useSheet must be used within a SheetProvider');
  }
  return context;
};
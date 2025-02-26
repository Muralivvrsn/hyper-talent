import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SheetContext = createContext();

export const SheetProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [sheetData, setSheetData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const chrome = window.chrome;

  useEffect(() => {
    if (userProfile?.data) {
      try {
        if (userProfile?.data?.spreadsheet?.id) {
          setSheetData(userProfile.data.spreadsheet);
        } else {
          setSheetData(null);
        }
      } catch (error) {
        console.error('Error fetching sheet data:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSheetData(null);
      setIsLoading(false);
    }
  }, [userProfile?.data?.spreadsheet]);

  const getGoogleToken = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TOKEN' });
    return response.data.accessToken;
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
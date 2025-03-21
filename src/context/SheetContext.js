import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const SheetContext = createContext();

export const SheetProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [sheetData, setSheetData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [access, setAccess] = useState(null);
  const chrome = window.chrome;

  useEffect(() => {
    const initializeSheetData = async () => {
      try {
        setIsLoading(true);

        if (userProfile?.data?.spreadsheet?.id) {
          setSheetData(userProfile.data.spreadsheet);
        } else {
          setSheetData(null);
        }

        await checkPermission();
      } catch (error) {
        console.error('Error initializing sheet data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSheetData();
  }, [userProfile]);

  const checkPermission = async () => {
    try {
      const token = await getGoogleToken();
      const hasDrivePermission = await verifyDrivePermission(token);

      if (userProfile?.data?.spreadsheet?.id) {
        if (hasDrivePermission) {
          setAccess('accepted');
        }
        else {
          setAccess('connect');
        }
      } else {
        setAccess('create');
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      setAccess('connect');
    }
  };

  const verifyDrivePermission = async (token) => {
    try {
      await axios.get('https://www.googleapis.com/drive/v3/files', {
        params: {
          pageSize: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return true;
    } catch (error) {
      console.error('Error verifying drive permission:', error);
      return false;
    }
  };

  const getGoogleToken = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TOKEN' });
    return response.data.accessToken;
  };

  const contextValue = {
    sheetData,
    isLoading,
    access,
    getGoogleToken,
    checkPermission,
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

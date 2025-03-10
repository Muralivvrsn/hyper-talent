import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const SheetContext = createContext();

export const SheetProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [sheetData, setSheetData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [access, setAccess] = useState(null); // New state for permission access
  const chrome = window.chrome;

  useEffect(() => {
    if (userProfile?.data?.spreadsheet) initializeSheetData();
  }, [userProfile?.data?.spreadsheet]);

  const initializeSheetData = async () => {
    try {
      if (userProfile?.data?.spreadsheet?.id) {
        setSheetData(userProfile?.data?.spreadsheet);
        // Check permission after setting sheet data
        checkPermission();
      } else {
        setSheetData(null);
        // Also check permission if no sheet data exists
        checkPermission();
      }
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermission = async () => {
    try {
      // Try to get the token to check drive.file permission
      const token = await getGoogleToken();
      
      // Check if token includes drive.file scope
      // This could be done by checking the token's scopes or making a test request
      const hasDrivePermission = await verifyDrivePermission(token);
      
      if (userProfile?.data?.spreadsheet?.id) {
        // Case 2: Has sheet data and permission
        if (hasDrivePermission) {
          setAccess('accepted');
        } 
        // Case 1: Has sheet data but no permission
        else {
          setAccess('connect');
        }
      } else {
        // Case 3: No sheet data and no permission
        setAccess('create');
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      // Default to 'connect' if we can't verify permissions
      setAccess('connect');
    }
  };

  const verifyDrivePermission = async (token) => {
    try {
      // You might need to implement a more specific check for your use case
      // This is a simple example that attempts to list files to verify permission
      const response = await axios.get('https://www.googleapis.com/drive/v3/files', {
        params: {
          pageSize: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      return true; // If the request was successful, the permission exists
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
    access, // Expose the new access state
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
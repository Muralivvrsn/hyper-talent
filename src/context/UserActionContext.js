import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  arrayUnion,
  setDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const UserActionContext = createContext(null);

export const useUserAction = () => {
  const context = useContext(UserActionContext);
  if (!context) {
    throw new Error('useUserAction must be used within a UserActionProvider');
  }
  return context;
};

export const UserActionProvider = ({ children }) => {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    let unsubscribe = null;

    const fetchUserActions = async () => {
      if (!user?.uid) {
        setData({});
        setLoading(false);
        return;
      }

      try {
        // Create a query for the user_actions collection
        const actionsQuery = query(collection(db, 'user_actions'));
        
        // Set up real-time listener for user actions
        unsubscribe = onSnapshot(actionsQuery, (snapshot) => {
          const actionsData = {};

          snapshot.forEach((doc) => {
            // Each document contains an array of actions for a user
            const userData = doc.data();
            if (userData.actions && Array.isArray(userData.actions)) {
              actionsData[doc.id] = userData.actions.map(action => ({
                timestamp: action.timestamp,
                title: action.title
              }));
            }
          });

          setData(actionsData);
          setLoading(false);
        }, (err) => {
          setError('Failed to fetch user actions');
          console.error('Fetch error:', err);
          setLoading(false);
        });
      } catch (err) {
        setError('Failed to initialize user actions');
        console.error('Init error:', err);
        setLoading(false);
      }
    };

    fetchUserActions();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Helper function to get all unique action types
  const getUniqueActionTypes = () => {
    const actionTypes = new Set();
    Object.values(data).forEach(actions => {
      actions.forEach(action => actionTypes.add(action.title));
    });
    return Array.from(actionTypes);
  };

  // Helper function to get data for a specific user
  const getUserActions = (userId) => {
    return data[userId] || [];
  };

  // Helper function to get all user IDs
  const getUserIds = () => {
    return Object.keys(data);
  };

  const addUserAction = async (title) => {
    if (!user || !title) {
      console.error('User and title are required');
      return false;
    }
  
    try {
      const userActionRef = doc(db, 'user_actions', user.uid);
      
      // Create action object with serverTimestamp
      const action = {
        timestamp: new Date().toISOString(),
        title: title
      };
      
      // Try to update the document first (if it exists)
      try {
        await updateDoc(userActionRef, {
          actions: arrayUnion(action)
        });
      } catch (error) {
        // If document doesn't exist, create it
        await setDoc(userActionRef, {
          actions: [action]
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding user action:', error);
      setError('Failed to add user action');
      return false;
    }
  };

  const value = {
    data,
    loading,
    error,
    getUniqueActionTypes,
    getUserActions,
    getUserIds,
    addUserAction
  };

  return (
    <UserActionContext.Provider value={value}>
      {children}
    </UserActionContext.Provider>
  );
};
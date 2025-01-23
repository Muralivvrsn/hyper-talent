import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  getDocs,
  onSnapshot 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const OtherUsersContext = createContext(null);

export const useOtherUsers = () => {
  const context = useContext(OtherUsersContext);
  if (!context) {
    throw new Error('useOtherUsers must be used within an OtherUsersProvider');
  }
  return context;
};

export const OtherUsersProvider = ({ children }) => {
  const { user } = useAuth();
  const [otherUsers, setOtherUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    if (!user?.uid) {
      console.log('not users')
      setOtherUsers([]);
      setLoading(false);
      return;
    }

    console.log('users')
    try {
      const usersRef = collection(db, 'users');

      // Set up a real-time listener for all users
      const unsubscribe = onSnapshot(usersRef, (querySnapshot) => {
        const usersList = querySnapshot.docs
          .filter(doc => {
            const userData = doc.data();
            // Skip current user and users with name or email
            return userData.uid !== user.uid;
          })
          .map(doc => ({
            id: doc.id,
            email: doc.data().e,
            name: doc.data().n
          }));

        console.log(usersList);
        setOtherUsers(usersList);
        setLoading(false);
      }, (err) => {
        setError('Failed to fetch other users');
        console.error('Other users fetch error:', err);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (err) {
      setError('Failed to initialize other users data');
      console.error('Other users init error:', err);
      setLoading(false);
    }
  }, [user]);

  const value = {
    otherUsers,
    loading,
    error
  };

  return (
    <OtherUsersContext.Provider value={value}>
      {children}
    </OtherUsersContext.Provider>
  );
};
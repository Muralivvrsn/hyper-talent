// context/DataContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { onSnapshot } from 'firebase/firestore';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    let unsubscribe;

    const initializeData = async () => {
      if (!user?.uid) {
        setMessages([]);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'shortcuts', user.uid);
        
        // Set up real-time listener
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const messagesList = Object.entries(data.shortcuts || {}).map(([id, message]) => ({
              id,
              ...message
            }));

            const sortedMessages = messagesList.sort((a, b) =>
              new Date(b.lastUpdate) - new Date(a.lastUpdate)
            );

            setMessages(sortedMessages);
          } else {
            // Initialize empty document if it doesn't exist
            setDoc(docRef, { shortcuts: {} });
            setMessages([]);
          }
          setLoading(false);
        }, (err) => {
          setError('Failed to fetch messages');
          console.error('Fetch error:', err);
          setLoading(false);
        });
      } catch (err) {
        setError('Failed to initialize data');
        console.error('Init error:', err);
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const addMessage = async (newMessage) => {
    try {
      const docRef = doc(db, 'shortcuts', user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data() || { shortcuts: {} };

      const newId = crypto.randomUUID();
      const newData = {
        ...currentData,
        shortcuts: {
          ...currentData.shortcuts,
          [newId]: {
            title: newMessage.title,
            content: newMessage.content,
            lastUpdate: new Date().toISOString()
          }
        }
      };

      await setDoc(docRef, newData);
      return true;
    } catch (err) {
      setError('Failed to add message');
      console.error('Add error:', err);
      return false;
    }
  };

  const editMessage = async (id, editedMessage) => {
    try {
      const docRef = doc(db, 'shortcuts', user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();

      const updatedShortcuts = {
        ...currentData.shortcuts,
        [id]: {
          title: editedMessage.title,
          content: editedMessage.content,
          lastUpdate: new Date().toISOString()
        }
      };

      await updateDoc(docRef, { shortcuts: updatedShortcuts });
      return true;
    } catch (err) {
      setError('Failed to update message');
      console.error('Update error:', err);
      return false;
    }
  };

  const deleteMessage = async (id) => {
    try {
      const docRef = doc(db, 'shortcuts', user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();

      const { [id]: removed, ...remainingShortcuts } = currentData.shortcuts;
      await updateDoc(docRef, { shortcuts: remainingShortcuts });
      return true;
    } catch (err) {
      setError('Failed to delete message');
      console.error('Delete error:', err);
      return false;
    }
  };

  const value = {
    messages,
    loading,
    error,
    addMessage,
    editMessage,
    deleteMessage
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
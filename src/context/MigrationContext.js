import React, { createContext, useContext, useState } from 'react';
import { 
  getFirestore, 
  doc,
  writeBatch,
  collection,
  getDocs
} from 'firebase/firestore';

const MigrationContext = createContext(null);

export const useMigration = () => {
  const context = useContext(MigrationContext);
  if (!context) throw new Error('useMigration must be used within a MigrationProvider');
  return context;
};

export const MigrationProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const db = getFirestore();

  const add_label_user = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      let currentBatch = writeBatch(db);
      let operationCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const labelIds = userDoc.data().d?.l || [];
        
        for (const labelId of labelIds) {
          const labelRef = doc(db, 'profile_labels', labelId);
          currentBatch.update(labelRef, { lc: userId });
          operationCount++;
          
          if (operationCount >= 500) {
            await currentBatch.commit();
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        }
      }
      
      if (operationCount > 0) {
        await currentBatch.commit();
      }
      
      return true;
    } catch (err) {
      console.error('Error updating labels:', err);
      setError('Failed to update labels');
      return false;
    }
  };

  return (
    <MigrationContext.Provider value={{ error, add_label_user }}>
      {children}
    </MigrationContext.Provider>
  );
};
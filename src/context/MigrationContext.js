import React, { createContext, useContext, useState } from 'react';
import {
  getFirestore,
  doc,
  writeBatch,
  collection,
  getDocs,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const MigrationContext = createContext(null);

export const useMigration = () => {
  const context = useContext(MigrationContext);
  if (!context) throw new Error('useMigration must be used within a MigrationProvider');
  return context;
};

export const MigrationProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    processed: 0,
    skipped: 0
  });
  const db = getFirestore();

  // Helper function to find owner of a document
  const findDocumentOwner = async (docId, docType) => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        if (docType === 'label' && userData.d?.l?.includes(docId)) {
          return { id: userDoc.id, name: userData.n || 'Unknown User' };
        }
        if (docType === 'note' && userData.d?.n?.includes(docId)) {
          return { id: userDoc.id, name: userData.n || 'Unknown User' };
        }
        if (docType === 'template' && userData.d?.s?.includes(docId)) {
          return { id: userDoc.id, name: userData.n || 'Unknown User' };
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding document owner:', error);
      return null;
    }
  };

  const migrateData = async () => {
    console.log('migration started');
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      let currentBatch = writeBatch(db);
      let operationCount = 0;
      let processedCount = 0;
      let skippedCount = 0;

      const BATCH_SIZE = 250;
      const currentDate = new Date().toISOString();

      for (const userDoc of usersSnapshot.docs) {
        try {
          const userId = userDoc.id;
          const userData = userDoc.data();

          // Prepare the new user document structure
          const newUserData = {
            e: userData.e,
            n: userData.n,
            av: userData.av,
            ca: userData.ca,
            p: userData.p,
            th: userData.th,
            pe: userData.pe,
            lg: userData.lg,
            ne: null,
            d: {
              l: [], // Will be populated with labels
              n: [], // Will be populated with notes
              s: [], // Will be populated with templates
              sd: userData?.sd || { id: null, ca: null, ls: null }
            },
            t: [] // New team field
          };

          // Process labels (both owned and shared)
          const ownedLabels = userData.d?.l || [];
          const sharedLabels = userData.d?.sl || [];

          // Process owned labels
          for (const labelId of ownedLabels) {
            try {
              const labelDoc = await getDoc(doc(db, 'profile_labels', labelId));
              if (labelDoc.exists()) {
                const labelData = labelDoc.data();
                newUserData.d.l.push({
                  id: labelId,
                  t: 'owned',
                  ca: labelData.lu || currentDate
                });

                // Create new profile_labels_v2 document
                const newLabelRef = doc(db, 'profile_labels_v2', labelId);
                const { lc, ...labelDataWithoutLc } = labelData;
                currentBatch.set(newLabelRef, {
                  ...labelDataWithoutLc,
                  lu: labelData.lu || currentDate
                });
                operationCount++;
              }
            } catch (e) {
              console.warn(`Error processing label ${labelId}:`, e);
              skippedCount++;
            }
          }

          // Process shared labels
          for (const sharedLabel of sharedLabels) {
            if (sharedLabel && sharedLabel.l) {
              try {
                const labelDoc = await getDoc(doc(db, 'profile_labels', sharedLabel.l));
                if (labelDoc.exists()) {
                  const labelData = labelDoc.data();
                  const owner = await findDocumentOwner(sharedLabel.l, 'label');
                  
                  newUserData.d.l.push({
                    id: sharedLabel.l,
                    t: 'shared',
                    sa: currentDate,
                    sb: owner?.id || null,
                    sbn: owner?.name || 'Unknown User',
                    ps: 'read',
                    a: null
                  });
                }
              } catch (e) {
                console.warn(`Error processing shared label ${sharedLabel.l}:`, e);
                skippedCount++;
              }
            }
          }

          // Process owned notes
          const ownedNotes = userData.d?.n || [];
          const sharedNotes = userData.d?.sn || [];

          for (const noteId of ownedNotes) {
            try {
              const noteDoc = await getDoc(doc(db, 'profile_notes', noteId));
              if (noteDoc.exists()) {
                const noteData = noteDoc.data();
                newUserData.d.n.push({
                  id: noteId,
                  t: 'owned',
                  ca: noteData.lu || currentDate
                });

                // Create new profile_notes_v2 document
                const newNoteRef = doc(db, 'profile_notes_v2', noteId);
                const { lc, ...noteDataWithoutLc } = noteData;
                currentBatch.set(newNoteRef, {
                  ...noteDataWithoutLc,
                  lu: noteData.lu || currentDate
                });
                operationCount++;
              }
            } catch (e) {
              console.warn(`Error processing note ${noteId}:`, e);
              skippedCount++;
            }
          }

          // Process shared notes
          for (const noteId of sharedNotes) {
            try {
              const noteDoc = await getDoc(doc(db, 'profile_notes', noteId));
              if (noteDoc.exists()) {
                const noteData = noteDoc.data();
                const owner = await findDocumentOwner(noteId, 'note');

                newUserData.d.n.push({
                  id: noteId,
                  t: 'shared',
                  sa: currentDate,
                  sb: owner?.id || null,
                  sbn: owner?.name || 'Unknown User',
                  ps: 'read',
                  a: null
                });
              }
            } catch (e) {
              console.warn(`Error processing shared note ${noteId}:`, e);
              skippedCount++;
            }
          }

          // Process templates
          const templates = userData.d?.s || [];
          for (const templateId of templates) {
            try {
              const templateDoc = await getDoc(doc(db, 'message_templates', templateId));
              if (templateDoc.exists()) {
                const templateData = templateDoc.data();
                newUserData.d.s.push({
                  id: templateId,
                  t: 'owned',
                  ca: templateData.lu || currentDate
                });

                // Create new message_templates_v2 document
                const newTemplateRef = doc(db, 'message_templates_v2', templateId);
                currentBatch.set(newTemplateRef, {
                  ...templateData,
                  lu: templateData.lu || currentDate
                });
                operationCount++;
              }
            } catch (e) {
              console.warn(`Error processing template ${templateId}:`, e);
              skippedCount++;
            }
          }

          // Create the new user document
          const newUserRef = doc(db, 'users_v2', userId);
          currentBatch.set(newUserRef, newUserData);
          operationCount++;
          processedCount++;

          console.log('Processed user:', processedCount);

          if (operationCount >= BATCH_SIZE) {
            try {
              await currentBatch.commit();
              console.log(`Batch committed successfully. Processed ${processedCount} users so far.`);
            } catch (batchError) {
              console.warn('Batch commit failed, skipping batch:', batchError);
              skippedCount += BATCH_SIZE;
              processedCount -= BATCH_SIZE;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            currentBatch = writeBatch(db);
            operationCount = 0;
          }
        } catch (userError) {
          console.error(`Error processing user ${userDoc.id}:`, userError);
          skippedCount++;
        }
      }

      // Commit any remaining operations
      if (operationCount > 0) {
        try {
          await currentBatch.commit();
          console.log(`Final batch committed. Total processed: ${processedCount}`);
        } catch (finalBatchError) {
          console.warn('Final batch failed, skipping:', finalBatchError);
          skippedCount += operationCount;
          processedCount -= operationCount;
        }
      }

      setStats({
        processed: processedCount,
        skipped: skippedCount
      });

      console.log('Migration completed:', {
        processed: processedCount,
        skipped: skippedCount
      });

      return true;
    } catch (err) {
      console.error('Error during migration:', err);
      setError('Failed to migrate data');
      return false;
    }
  };

  return (
    <MigrationContext.Provider value={{ error, stats, migrateData }}>
      {children}
    </MigrationContext.Provider>
  );
};
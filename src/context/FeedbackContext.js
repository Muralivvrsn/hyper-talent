import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from './AuthContext';
import { useAuth } from './AuthContext';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  collection
} from 'firebase/firestore';

const FeedbackContext = createContext(null);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

export const FeedbackProvider = ({ children }) => {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const db = getFirestore();

  // Generate unique feedback ID
  const generateFeedbackId = (type) => {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substr(2, 5);
    return `${type.toLowerCase()}_${date}_${random}`;
  };

  // File validation
  const validateFile = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${file.name}`);
    }
    return true;
  };

  // Upload files to storage
  const uploadFiles = async (files, feedbackId) => {
    if (!files.length) return [];
    if (!user?.uid) throw new Error('User not authenticated');
    
    const uploadPromises = files.map(async (file) => {
      try {
        validateFile(file);
        const timestamp = new Date().getTime();
        const fileName = `${feedbackId}_${file.name}`;
        const fileRef = ref(storage, `feedback/${user.uid}/${fileName}`);
        
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return { url, name: file.name, ref: fileRef.fullPath };
      } catch (error) {
        throw new Error(`Error uploading ${file.name}: ${error.message}`);
      }
    });
    
    return Promise.all(uploadPromises);
  };

  // Cleanup files in case of error
  const cleanup = async (uploadedFiles) => {
    if (!uploadedFiles?.length) return;
    
    const deletePromises = uploadedFiles.map(async (file) => {
      try {
        if (file.ref) {
          const fileRef = ref(storage, file.ref);
          await deleteObject(fileRef);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    });

    await Promise.all(deletePromises);
  };

  // Submit new feedback
  const submitFeedback = async (type, description, files = []) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    if (!description.trim()) {
      throw new Error('Description is required');
    }

    let uploadedFiles = [];
    
    try {
      const feedbackId = generateFeedbackId(type);
      const docRef = doc(db, 'feedback', user.uid);
      
      // Upload files first
      uploadedFiles = await uploadFiles(files, feedbackId);

      // Get existing document or create new one
      const docSnap = await getDoc(docRef);
      
      // Prepare new feedback entry
      const feedbackEntry = {
        t: type.charAt(0).toLowerCase(),
        d: description.trim(),
        u: uploadedFiles.map(file => file.url),
        s: 'ns',
        ca: new Date().toISOString()
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          [feedbackId]: feedbackEntry
        });
      } else {
        await setDoc(docRef, {
          [feedbackId]: feedbackEntry
        });
      }

      return { success: true, id: feedbackId };
    } catch (error) {
      await cleanup(uploadedFiles);
      throw error;
    }
  };

  // Update feedback status
  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    if (!user?.uid || !feedbackId) return;

    try {
      const docRef = doc(db, 'feedback', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Feedback document not found');
      }

      const data = docSnap.data();
      if (!data[feedbackId]) {
        throw new Error('Feedback item not found');
      }

      await updateDoc(docRef, {
        [`${feedbackId}.s`]: newStatus
      });

      return true;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw error;
    }
  };

  // Delete feedback
  const deleteFeedback = async (feedbackId) => {
    if (!user?.uid || !feedbackId) return;

    try {
      const docRef = doc(db, 'feedback', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Feedback document not found');
      }

      const data = docSnap.data();
      if (!data[feedbackId]) {
        throw new Error('Feedback item not found');
      }

      // Delete associated files first
      if (data[feedbackId].u && data[feedbackId].u.length > 0) {
        await cleanup(data[feedbackId].u.map(url => ({ ref: url })));
      }

      // Remove the feedback entry
      const { [feedbackId]: removed, ...rest } = data;
      await setDoc(docRef, rest);

      return true;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  };

  const updateSheetToDatabase = async (sheetData) => {
    const db = getFirestore();
    const statusMap = {
      'Not Started': 'ns',
      'In Progress': 'ip',
      'Under Review': 'ur',
      'In Testing': 'it',
      'Resolved': 'rs',
      'Declined': 'dc',
      'Deferred': 'df',
      'Completed': 'cp'
    };
  
    try {
      // First, get all users to match emails
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userEmailMap = {};
      usersSnapshot.forEach(doc => {
        userEmailMap[doc.data().e] = doc.id;
      });
  
      // Process each row from sheet
      for (const row of sheetData) {
        const email = row.email;
        const userId = userEmailMap[email];
  
        if (!userId) {
          // console.log(`No user found for email: ${email}`);
          continue;
        }
  
        // Generate feedback ID based on type
        const type = row.type.toLowerCase();
        const feedbackId = generateFeedbackId(type);
  
        // Create feedback entry
        const feedbackEntry = {
          t: type.charAt(0).toLowerCase(), // 'b' for Bug, 'f' for Feature, 's' for Suggestion
          d: row.description.trim(),
          s: statusMap[row.status] || 'ns',
          u: [], // Empty array for URLs as specified
          ca: new Date().toISOString()
        };
  
        // Get reference to user's feedback document
        const docRef = doc(db, 'feedback', userId);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          // Update existing document
          await updateDoc(docRef, {
            [feedbackId]: feedbackEntry
          });
        } else {
          // Create new document
          await setDoc(docRef, {
            [feedbackId]: feedbackEntry
          });
        }
  
        // console.log(`Successfully processed feedback for ${email}`);
      }
  
      return { success: true, message: 'Sheet data processed successfully' };
    } catch (error) {
      console.error('Error processing sheet data:', error);
      throw error;
    }
  };

  // Set up real-time listener for feedback
  useEffect(() => {
    let unsubscribe;

    const setupFeedbackListener = async () => {
      if (!user?.uid) {
        setFeedbackItems([]);
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'feedback', user.uid);
        
        unsubscribe = onSnapshot(docRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const items = Object.entries(data).map(([id, item]) => ({
              id,
              ...item
            }));
            
            // Sort by creation date, newest first
            items.sort((a, b) => new Date(b.ca) - new Date(a.ca));
            setFeedbackItems(items);
          } else {
            setFeedbackItems([]);
          }
          setIsLoading(false);
        }, (error) => {
          console.error('Error in feedback listener:', error);
          setError(error.message);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error setting up feedback listener:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    setupFeedbackListener();


    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid, db]);

  const value = {
    feedbackItems,
    isLoading,
    error,
    submitFeedback,
    updateFeedbackStatus,
    deleteFeedback,
    validateFile,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
    updateSheetToDatabase
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

export default FeedbackProvider;
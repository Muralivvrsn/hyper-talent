import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
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
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    let unsubscribe = null;

    const fetchUserTemplates = async () => {
      if (!user?.uid) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Set up real-time listener for user document
        unsubscribe = onSnapshot(userDocRef, async (userDocSnap) => {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const templateIds = userData.d?.s || []; // Get template IDs

            // Fetch template details from message_template collection
            if (templateIds.length > 0) {
              const templatePromises = templateIds.map(async (templateId) => {
                const templateDocRef = doc(db, 'message_templates', templateId);
                const templateDocSnap = await getDoc(templateDocRef);
                
                if (templateDocSnap.exists()) {
                  const templateData = templateDocSnap.data();
                  console.log(templateData)
                  return {
                    id: templateId,
                    title: templateData.t,
                    content: templateData.n,
                    lastUpdated: templateData.lu
                  };
                }
                return null;
              });

              const fetchedTemplates = await Promise.all(templatePromises);
              // // Filter out any null values (in case a template was not found)
              setTemplates(fetchedTemplates.filter(Boolean).sort((a, b) => 
                new Date(b.lastUpdated) - new Date(a.lastUpdated)
              ));
            } else {
              setTemplates([]);
            }
          } else {
            setTemplates([]);
          }
          setLoading(false);
        }, (err) => {
          setError('Failed to fetch templates');
          console.error('Fetch error:', err);
          setLoading(false);
        });
      } catch (err) {
        setError('Failed to initialize templates');
        console.error('Init error:', err);
        setLoading(false);
      }
    };

    fetchUserTemplates();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const addTemplate = async (newTemplate) => {
    try {
      // Generate unique template ID
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add template to message_template collection
      const templateDocRef = doc(db, 'message_templates', templateId);
      await setDoc(templateDocRef, {
        t: newTemplate.title,
        n: newTemplate.content,
        lu: new Date().toISOString()
      });

      // Update user's template list
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      
      const updatedTemplateIds = [...(userData.d?.s || []), templateId];
      
      await updateDoc(userDocRef, {
        'd.s': updatedTemplateIds
      });

      return true;
    } catch (err) {
      setError('Failed to add template');
      console.error('Add error:', err);
      return false;
    }
  };

  const editTemplate = async (id, editedTemplate) => {
    try {
      // Update template in message_template collection
      const templateDocRef = doc(db, 'message_templates', id);
      await updateDoc(templateDocRef, {
        t: editedTemplate.title,
        n: editedTemplate.content,
        lu: new Date().toISOString()
      });

      return true;
    } catch (err) {
      setError('Failed to update template');
      console.error('Update error:', err);
      return false;
    }
  };

  const deleteTemplate = async (id) => {
    try {
      // Remove template from message_template collection
      const templateDocRef = doc(db, 'message_template', id);
      await deleteDoc(templateDocRef);
  
      // Remove template ID from user's template list
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      
      const updatedTemplateIds = (userData.d?.s || []).filter(templateId => templateId !== id);
      
      await updateDoc(userDocRef, {
        'd.s': updatedTemplateIds
      });
  
      return true;
    } catch (err) {
      setError('Failed to delete template');
      console.error('Delete error:', err);
      return false;
    }
  };

  const value = {
    templates,
    loading,
    error,
    addTemplate,
    editTemplate,
    deleteTemplate
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!user?.uid || !userProfile?.data?.shortcuts?.length) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get template IDs from userProfile
        const shortcutItems = userProfile.data.shortcuts;

        // Fetch template details from message_template collection
        const templatePromises = shortcutItems.map(async (shortcut) => {
          const templateId = shortcut.id;
          const templateDocRef = doc(db, 'message_templates_v2', templateId);
          const templateDocSnap = await getDoc(templateDocRef);
          
          if (templateDocSnap.exists()) {
            const templateData = templateDocSnap.data();
            return {
              id: templateId,
              title: templateData.t,
              content: templateData.n,
              lastUpdated: templateData.lu,
              type: shortcut.t || null,
              sharedBy: shortcut.sb || null,
              sharedByName: shortcut.sbn || null
            };
          }
          return null;
        });

        const fetchedTemplates = await Promise.all(templatePromises);
        setTemplates(fetchedTemplates.filter(Boolean).sort((a, b) => 
          new Date(b.lastUpdated) - new Date(a.lastUpdated)
        ));
      } catch (err) {
        setError('Failed to fetch templates');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateDetails();
  }, [user, userProfile?.data?.shortcuts, db]);

  const addTemplate = async (newTemplate) => {
    try {
      // Generate unique template ID
      const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Add template to message_template collection
      const templateDocRef = doc(db, 'message_templates_v2', templateId);
      await setDoc(templateDocRef, {
        t: newTemplate.title,
        n: newTemplate.content,
        lu: new Date().toISOString()
      });

      // Update user's template list
      const userDocRef = doc(db, 'users_v2', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      
      // Create the template object for the user profile
      const templateObject = {
        ca: new Date().getTime(),
        id: templateId,
        t: 'owned',
      };
      
      // Get current shortcuts array or create new one
      const currentShortcuts = Array.isArray(userData.d?.s) 
        ? userData.d.s 
        : [];
      
      // Add new template to shortcuts
      await updateDoc(userDocRef, {
        'd.s': [...currentShortcuts, templateObject]
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
      const templateDocRef = doc(db, 'message_templates_v2', id);
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
      const templateDocRef = doc(db, 'message_templates_v2', id);
      await deleteDoc(templateDocRef);
  
      // Remove template from user's shortcuts list
      const userDocRef = doc(db, 'users_v2', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      
      // Filter out the template from shortcuts
      const updatedShortcuts = (userData.d?.s || []).filter(shortcut => 
        typeof shortcut === 'string' ? shortcut !== id : shortcut.id !== id
      );
      
      await updateDoc(userDocRef, {
        'd.s': updatedShortcuts
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
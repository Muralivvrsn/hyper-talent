import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const TemplateContext = createContext(null);

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};

export const TemplateProvider = ({ children }) => {
  const { userProfile } = useAuth();
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore();

  // Fetch and subscribe to templates when userProfile?.data changes
  useEffect(() => {
    if (!userProfile?.data?.shortcuts?.length) {
      setTemplates({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribers = [];

    // Get template IDs from shortcuts array in the new structure
    const templateIds = userProfile?.data?.shortcuts
      .filter(shortcut => shortcut.t !== 'shared') // Filter out shared shortcuts if needed
      .map(shortcut => shortcut.id);

    // Subscribe to each template
    templateIds.forEach(templateId => {
      const unsubscribe = onSnapshot(
        doc(db, 'message_templates_v2', templateId),
        (doc) => {
          if (doc.exists()) {
            const templateData = doc.data();
            
            setTemplates(prev => ({
              ...prev,
              [templateId]: {
                content: templateData.n,
                title: templateData.t,
                lastUpdated: templateData.lu
              }
            }));
          } else {
            // If template doesn't exist, remove it from state
            setTemplates(prev => {
              const updated = { ...prev };
              delete updated[templateId];
              return updated;
            });
          }
        },
        (error) => {
          console.error('Error fetching template:', error);
          setError(error.message);
        }
      );

      unsubscribers.push(unsubscribe);
    });

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [userProfile?.data, db]);

  const getTemplateById = (templateId) => {
    const template = templates[templateId];
    if (!template) return null;

    return {
      id: templateId,
      content: template.content,
      title: template.title,
      lastUpdated: template.lastUpdated
    };
  };

  const getTemplatesByTitle = (searchTerm) => {
    if (!searchTerm) return [];
    
    return Object.entries(templates)
      .filter(([_, template]) => 
        template.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(([id, template]) => ({
        id,
        content: template.content,
        title: template.title,
        lastUpdated: template.lastUpdated
      }));
  };
  const value = {
    templates,
    loading,
    error,
    getTemplateById,
    getTemplatesByTitle
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getFirestore, 
  collection, 
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState({
    updates: true,
    feedback: true,
    users: true
  });
  const [error, setError] = useState({
    updates: null,
    feedback: null,
    users: null
  });
  
  const db = getFirestore();
  
  // Admin emails check
  const ADMIN_EMAILS = ['murali.g@hyperverge.co', 'satish.d@hyperverge.co', 'muralivvrsn75683@gmail.com'];
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  // Fetch updates
  useEffect(() => {
    const fetchUpdates = async () => {
      if (!isAdmin) return;
      
      setLoading(prev => ({ ...prev, updates: true }));
      try {
        const updatesRef = collection(db, 'updates');
        const q = query(updatesRef, orderBy('releaseDate', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const updatesData = [];
        querySnapshot.forEach((doc) => {
          updatesData.push({
            id: doc.id,
            ...doc.data(),
            releaseDate: doc.data().releaseDate?.toDate() || new Date()
          });
        });
        
        setUpdates(updatesData);
      } catch (err) {
        console.error('Error fetching updates:', err);
        setError(prev => ({ ...prev, updates: 'Failed to fetch updates' }));
      } finally {
        setLoading(prev => ({ ...prev, updates: false }));
      }
    };
    
    fetchUpdates();
  }, [db, isAdmin]);
  
  // Fetch feedback with user details
  useEffect(() => {
    const fetchFeedback = async () => {
      if (!isAdmin) return;
      
      setLoading(prev => ({ ...prev, feedback: true }));
      try {
        const feedbackRef = collection(db, 'feedback');
        const querySnapshot = await getDocs(feedbackRef);
        
        const feedbackData = [];
        const userPromises = [];
        
        querySnapshot.forEach((feedbackDoc) => {
          const data = feedbackDoc.data();
          
          // Get user details for each feedback
          if (data.userId) {
            const userPromise = getDoc(doc(db, 'users_v2', data.userId))
              .then(userDoc => {
                if (userDoc.exists()) {
                  return {
                    userId: data.userId,
                    name: userDoc.data().n || 'Unknown',
                    email: userDoc.data().e || 'No email'
                  };
                }
                return { userId: data.userId, name: 'Unknown', email: 'No email' };
              })
              .catch(() => ({ userId: data.userId, name: 'Unknown', email: 'Error fetching user' }));
              
            userPromises.push(userPromise);
          }
          
          feedbackData.push({
            id: feedbackDoc.id,
            ...data,
            ca: data.ca ? new Date(data.ca) : new Date(),
            userId: data.userId || 'anonymous'
          });
        });
        
        // Resolve all user promises
        const userDetails = await Promise.all(userPromises);
        
        // Merge user details with feedback data
        const mergedFeedback = feedbackData.map(feedback => {
          const userDetail = userDetails.find(u => u.userId === feedback.userId);
          return {
            ...feedback,
            userName: userDetail?.name || 'Anonymous',
            userEmail: userDetail?.email || 'No email'
          };
        });
        
        setFeedback(mergedFeedback);
      } catch (err) {
        console.error('Error fetching feedback:', err);
        setError(prev => ({ ...prev, feedback: 'Failed to fetch feedback' }));
      } finally {
        setLoading(prev => ({ ...prev, feedback: false }));
      }
    };
    
    fetchFeedback();
  }, [db, isAdmin]);
  
  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const usersRef = collection(db, 'users_v2');
      const querySnapshot = await getDocs(usersRef);
      
      const usersData = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        usersData.push({
          id: doc.id,
          name: userData.n || 'No name',
          email: userData.e || 'No email',
          createdAt: userData.ca ? new Date(userData.ca) : null,
          // Add any other relevant user fields
        });
      });
      
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(prev => ({ ...prev, users: 'Failed to fetch users' }));
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, [db, isAdmin]);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Status configuration
  const statusConfig = {
    'ns': {
      label: 'New',
      style: 'bg-secondary',
      description: "🌱 Fresh as a daisy - waiting to bloom!"
    },
    'ip': {
      label: 'In Progress',
      style: 'bg-blue-500',
      description: "🏃 We're on it like a superhero on a mission!"
    },
    'ur': {
      label: 'Under Review',
      style: 'bg-purple-500',
      description: "🔍 Our experts are examining it with their finest monocles"
    },
    'it': {
      label: 'In Testing',
      style: 'bg-yellow-500',
      description: "🧪 Being poked and prodded (gently, we promise)"
    },
    'rs': {
      label: 'Resolved',
      style: 'bg-green-500',
      description: "✨ Fixed and polished until it sparkles!"
    },
    'dc': {
      label: 'Declined',
      style: 'bg-red-500',
      description: "🤔 Not this time - but we appreciate the thought!"
    },
    'df': {
      label: 'Deferred',
      style: 'bg-orange-500',
      description: "⏳ On the back burner, but not forgotten"
    },
    'cp': {
      label: 'Completed',
      style: 'bg-emerald-500',
      description: "🎉 Done and dusted - high fives all around!"
    }
  };

  // Type configuration
  const typeConfig = {
    'b': {
      label: 'Bug',
      style: 'bg-destructive text-destructive-foreground'
    },
    'f': {
      label: 'Feature',
      style: 'bg-blue-500 text-primary-foreground'
    },
    's': {
      label: 'Suggestion',
      style: 'bg-green-500 text-primary-foreground'
    }
  };

  // Update feedback status
  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      const feedbackRef = doc(db, 'feedback', feedbackId);
      await updateDoc(feedbackRef, {
        s: newStatus
      });
      
      // Update local state
      setFeedback(prevFeedback => 
        prevFeedback.map(item => 
          item.id === feedbackId ? { ...item, s: newStatus } : item
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating feedback status:', err);
      return false;
    }
  };

  // Update user data
  const updateUser = async (userId, userData) => {
    try {
      const userRef = doc(db, 'users_v2', userId);
      await updateDoc(userRef, userData);
      
      // Refresh users list
      await fetchUsers();
      
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      return false;
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      const userRef = doc(db, 'users_v2', userId);
      await deleteDoc(userRef);
      
      // Update local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      return false;
    }
  };

  const value = {
    isAdmin,
    updates,
    feedback,
    users,
    loading,
    error,
    statusConfig,
    typeConfig,
    updateFeedbackStatus,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
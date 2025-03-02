import React, { useState } from 'react';
import { Bell, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import UpdatesTab from '../components/UpdatesTab';
import FeedbackTab from '../components/FeedbackTab';
// import UserManagerTab from '../components/UserManagerTab';

// Import Shadcn UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const AdminPage = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // Check admin access
  const ADMIN_EMAILS = ['murali.g@hyperverge.co', 'satish.d@hyperverge.co', 'muralivvrsn75683@gmail.com'];
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="updates" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span>Updates</span>
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Feedback</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>User Manager</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="updates">
          <UpdatesTab />
        </TabsContent>
        
        <TabsContent value="feedback">
          <FeedbackTab />
        </TabsContent>
        
        <TabsContent value="users">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">User Management</h2>
              <div className="text-sm text-gray-500">Coming Soon</div>
            </div>
            
            <div className="p-8 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <User className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">User Manager</h3>
                <p className="text-gray-500 mb-4">
                  This feature is under development. Check back soon to manage user accounts.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import Navigation from './components/Navigation';
import CandidateMessages from './pages/CandidateMessages';
import Shortcuts from './pages/Shortcuts';
import Sheet from './pages/Sheet';
import Feedback from './pages/Feedback';
import ProfilePage from './pages/ProfilePage';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('messages');
  const [isExpanded, setIsExpanded] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const chrome = window.chrome
  useEffect(() => {
    // Check chrome.storage.local when component mounts
    const checkStoredData = async () => {
      try {
        chrome.storage.local.get(['profileData'], function(result) {
          if (result.profileData) {
            setProfileData(result.profileData);
            setCurrentPage('profile');
            // Clear the stored data after retrieving it
            chrome.storage.local.remove(['profileData']);
          }
        });
      } catch (error) {
        console.error('Error checking stored data:', error);
      }
    };

    checkStoredData();
  
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'messages':
        return <CandidateMessages />;
      case 'shortcuts':
        return <Shortcuts />;
      case 'sheet':
        return <Sheet />;
      case 'feedback':
        return <Feedback />;
      case 'profile':
        return <ProfilePage profileData={profileData} />;
      default:
        return <CandidateMessages />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <aside className={`border-r min-h-[calc(100vh-4rem)] transition-all duration-300 ${
          isExpanded ? "w-64" : "w-16"
        }`}>
          <Navigation 
            setCurrentPage={setCurrentPage} 
            isExpanded={isExpanded} 
            setIsExpanded={setIsExpanded}
            onLogout={logout}
            user={user}
            currentPage={currentPage}
          />
        </aside>
        <main className="flex-1">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      {user ? <MainLayout /> : <LoginPage />}
    </ThemeProvider>
  );
}

export default App;
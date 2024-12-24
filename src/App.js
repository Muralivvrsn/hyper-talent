import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import Navigation from './components/Navigation';
import CandidateMessages from './pages/CandidateMessages';
import Shortcuts from './pages/Shortcuts';
import Sheet from './pages/Sheet';
import Feedback from './pages/Feedback';
import ProfilePage from './pages/ProfilePage';
import { useProfileNote } from './context/ProfileNoteContext';
const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  // const [currentPage, setCurrentPage] = useState('messages');
  const {currentPage, setCurrentPage} = useProfileNote()

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
        return <ProfilePage />;
      default:
        return <CandidateMessages />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="h-16 flex items-center justify-between">
          <Navigation 
            setCurrentPage={setCurrentPage} 
            onLogout={logout}
            user={user}
            currentPage={currentPage}
          />
        </div>
      </header>
      <main className="mx-auto py-2 px-6">
        {renderPage()}
      </main>
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

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { loading: themeLoading } = useTheme();
  const { loading: dataLoading } = useData();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!authLoading && !themeLoading && !dataLoading) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, themeLoading, dataLoading]);
  if (initialLoad || authLoading || themeLoading || dataLoading) {
    return <LoadingScreen />;
  }
  return user ? <MainLayout /> : <LoginPage />;
}
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
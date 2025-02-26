import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useData } from './context/DataContext';
import LoginPage from './pages/LoginPage';
import Navigation from './components/Navigation';
import CandidateMessages from './pages/StandardizedReplies';
import Shortcuts from './pages/Shortcuts';
import Sheet from './pages/Sheet';
import Feedback from './pages/Feedback';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import UpdateModal from './components/UpdateModel';
import { useProfileNote } from './context/ProfileNoteContext';
const MainLayout = ({ children }) => {
  const { user, signOut } = useAuth();
  const { currentPage, setCurrentPage } = useProfileNote();

  const ADMIN_EMAILS = ['murali.g@hyperverge.co', 'satish.d@hyperverge.co', 'muralivvrsn75683@gmail.com'];

  const renderPage = () => {
    switch (currentPage) {
      case 'messages':
        return <CandidateMessages />;
      case 'shortcuts':
        return <Shortcuts />;
      case 'sheet':
        return (
          <>
            <Sheet />
            {/* <SlackConnect /> */}
          </>
        );
      case 'feedback':
        return <Feedback />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <CandidateMessages />;
    }
  };


  return (
    <div className="bg-background h-full">
      <header className="border-b fixed top-0 w-full bg-background z-50">
        <div className="flex items-center justify-between">
          <Navigation
            setCurrentPage={setCurrentPage}
            onLogout={signOut}
            user={user}
            currentPage={currentPage}
            isAdmin={ADMIN_EMAILS.includes(user?.email)}
          />
        </div>
      </header>
      <main className="mx-auto p-3 mt-[60px] relative overflow-hidden h-full">
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
  const { user, status } = useAuth();
  console.log(status)
  const { loading: themeLoading } = useTheme();
  const { loading: dataLoading } = useData();
  const [initialLoad, setInitialLoad] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateVersions, setUpdateVersions] = useState({ current: '', previous: '' });
  const chrome = window.chrome;

  useEffect(() => {
    // Check for updates
    chrome.storage.local.get(['hasUnseenUpdate', 'currentVersion', 'previousVersion'], (result) => {
      if (result.hasUnseenUpdate) {
        setUpdateVersions({
          current: result.currentVersion,
          previous: result.previousVersion
        });
        setShowUpdateModal(true);
      }
    });

  }, []);

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    // Clear update flag and badge
    chrome.storage.local.set({ hasUnseenUpdate: false });
    chrome.action.setBadgeText({ text: '' });
  };

  useEffect(() => {
    if (status!=='in_progress' && !themeLoading && !dataLoading) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, themeLoading, dataLoading]);

  if (initialLoad || status==='in_progress' || themeLoading || dataLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Toaster position='bottom-center' />
      {user ? (
        <>
          <MainLayout />
          <UpdateModal
            isOpen={showUpdateModal}
            onClose={handleCloseUpdateModal}
            currentVersion={updateVersions.current}
            previousVersion={updateVersions.previous}
          />
        </>
      ) : (
        <LoginPage />
      )}
      {/* <button onClick={()=>addUpdate()}>add update</button> */}
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
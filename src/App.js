import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SheetsPage from './pages/SheetsPage';
import EmailPage from './pages/EmailPage';
import RolesPage from './pages/RolesPage';
import MessagesPage from './pages/MessagesPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import LoadingPage from './pages/LoadingPage';
import Navbar from './components/Navbar';

const App = () => {
  const [state, setState] = useState('initial');
  const [currentPage, setCurrentPage] = useState('home');

  const handleLogin = () => {
    setState('loading');
    setTimeout(() => {
      setState('loggedIn');
    }, 2000);
  };

  const handleLogout = () => {
    setState('initial');
    setCurrentPage('home');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'sheets':
        return <SheetsPage onNavigate={handleNavigate} />;
      case 'email':
        return <EmailPage onNavigate={handleNavigate} />;
      case 'roles':
        return <RolesPage onNavigate={handleNavigate} />;
      case 'messages':
        return <MessagesPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      {state === 'initial' && <LoginPage onLogin={handleLogin} />}
      {state === 'loading' && <LoadingPage />}
      {state === 'loggedIn' && (
        <>
          <Navbar onLogout={handleLogout} onNavigate={handleNavigate} />
          <div className="pt-16">
            {renderPage()}
          </div>
        </>
      )}
    </>
  );
};

export default App;
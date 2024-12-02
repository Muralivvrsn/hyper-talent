import React from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import CandidateMessages from './pages/CandidateMessages';

const WelcomePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0C1844] via-[#1a2c6b] to-[#0C1844] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-white/95 backdrop-blur-sm shadow-2xl animate-in fade-in duration-700 rounded-xl">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center space-y-8">
          {/* User Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Welcome, {user.displayName}!
            </h2>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>

          {/* Logout Button */}
          <Button
            onClick={logout}
            className="w-full h-12 bg-gradient-to-r from-[#C80036] to-[#FF6969] hover:from-[#FF6969] hover:to-[#C80036] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </Button>
        </CardContent>
      </Card>
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

  return user ? <CandidateMessages/> : <LoginPage />;
}

export default App;
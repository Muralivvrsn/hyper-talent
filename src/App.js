import React, { useState } from 'react';
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "./components/ui/card";
import { 
  Loader2, 
  Home, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  Sheet as Sheet1, 
  Mail, 
  Users, 
  MessageSquare,
  ChevronRight 
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";

// Login Page Component
const LoginPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px] border-navy-600">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <svg
              className="w-16 h-16 text-[#1a2e4a]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5Z" />
              <path d="m2 17 10 5 10-5" />
              <path d="m2 12 10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1a2e4a]">Welcome Back</h2>
          <p className="text-gray-600 mt-2">
            "Innovation is the outcome of a habit, not a random act."
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            Sign in to access your dashboard and continue your journey.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={onLogin}
            className="w-full bg-[#556b2f] hover:bg-[#4a5c28] text-white"
          >
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const Navbar = ({ onLogout, onNavigate }) => {
  const menuItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Home', action: () => onNavigate('home') },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', action: () => onNavigate('settings') },
    { icon: <User className="h-5 w-5" />, label: 'Profile', action: () => onNavigate('profile') },
    { icon: <LogOut className="h-5 w-5" />, label: 'Logout', action: onLogout },
  ];

  return (
    <nav className="bg-[#1a2e4a] py-3 px-4 shadow-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5Z" />
            <path d="m2 17 10 5 10-5" />
            <path d="m2 12 10 5 10-5" />
          </svg>
          <span className="text-white text-xl font-semibold">HyperTalent</span>
        </div>

        <div className="hidden sm:flex items-center space-x-6">
          {menuItems.map((item, index) => (
            <React.Fragment key={item.label}>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-[#284674] transition-colors"
                size="icon"
                onClick={item.action}
              >
                {item.icon}
              </Button>
              {index === menuItems.length - 2 && (
                <div className="h-6 w-px bg-gray-400/30" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-[#284674]"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-white">
              <SheetHeader>
                <SheetTitle className="text-[#1a2e4a]">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-4">
                {menuItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start text-[#1a2e4a] hover:bg-gray-100"
                    onClick={item.action}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.label}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

// Loading Page Component
const LoadingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardContent className="flex flex-col items-center py-8">
          <Loader2 className="w-12 h-12 text-[#1a2e4a] animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-[#1a2e4a]">Getting Things Ready</h2>
          <p className="text-gray-600">Just a moment while we log you in...</p>
        </CardContent>
      </Card>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, status, onClick }) => (
  <Card 
    className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-[#1a2e4a]"
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center space-x-4 pb-2">
      <div className="p-2 bg-[#1a2e4a]/10 rounded-lg">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#1a2e4a]">{title}</h3>
          {status && (
            <span className={`px-3 py-1 rounded-full text-sm ${
              status === 'Connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status}
            </span>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600">{description}</p>
      <div className="mt-4 flex items-center text-[#556b2f] font-medium">
        <span>Learn More</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </CardContent>
  </Card>
);

const HomePage = ({ onNavigate }) => {
  const features = [
    {
      icon: <Sheet1 className="w-6 h-6 text-[#1a2e4a]" />,
      title: "Sheets Integration Hub",
      description: "Seamlessly connect and manage your spreadsheet data. Monitor real-time connection status and automate data synchronization across your recruitment workflow.",
      status: "Initialized",
      page: "sheets"
    },
    {
      icon: <Mail className="w-6 h-6 text-[#1a2e4a]" />,
      title: "Advanced Communication Suite",
      description: "Create and manage professional email campaigns with rich media support. Customize templates and track engagement with comprehensive analytics.",
      page: "email"
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-[#1a2e4a]" />,
      title: "Message Template Studio",
      description: "Design and customize your communication templates. Manage message formats, styling, and create reusable snippets for consistent messaging.",
      page: "messages"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-[#1a2e4a] mb-4">
            Welcome to Your Recruitment Command Center
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access and manage all your recruitment tools in one place. Select a feature below to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              {...feature}
              onClick={() => onNavigate(feature.page)}
            />
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-[#1a2e4a] mb-4">System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Sheets Connected</p>
              <p className="text-2xl font-semibold text-[#1a2e4a]">3/5</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Email Templates</p>
              <p className="text-2xl font-semibold text-[#1a2e4a]">12</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Active Roles</p>
              <p className="text-2xl font-semibold text-[#1a2e4a]">4</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Message Templates</p>
              <p className="text-2xl font-semibold text-[#1a2e4a]">8</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    switch(currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'sheets':
      case 'email':
      case 'roles':
      case 'messages':
      case 'settings':
      case 'profile':
        // These pages would be implemented separately
        return (
          <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold text-[#1a2e4a] mb-4">
                {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} Page
              </h1>
              <p className="text-gray-600">This page is under construction.</p>
            </div>
          </div>
        );
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
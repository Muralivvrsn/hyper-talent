import React, { useState } from 'react';
import { Home, Settings, Menu, X, Loader2 } from 'lucide-react';
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  const handleLogout = () => {
    setAuthenticating(true);
    // Simulate logout
    setTimeout(() => setAuthenticating(false), 1000);
  };

  return (
    <div className="bg-gradient-to-r from-[#0C1844] via-[#1a2c6b] to-[#0C1844]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 backdrop-blur-sm bg-white/5">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6969] to-[#C80036] rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-[#FF6969] to-[#C80036] rounded-full flex items-center justify-center transform group-hover:scale-105 transition duration-300">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink icon={<Home className="h-5 w-5" />}>Home</NavLink>
              <NavLink icon={<Settings className="h-5 w-5" />}>Settings</NavLink>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-gradient-to-br from-[#FF6969] to-[#C80036] hover:from-[#C80036] hover:to-[#FF6969] transition-all duration-300">
                  <span className="sr-only">Open user menu</span>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm">
                <DropdownMenuItem className="hover:bg-gray-100">Profile</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-100">Account</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-[#C80036] hover:bg-red-50">
                  {authenticating ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Logging out...</span>
                    </div>
                  ) : (
                    'Logout'
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden bg-white/5 backdrop-blur-sm">
            <div className="pt-2 pb-3 space-y-1">
              <MobileNavLink icon={<Home className="h-5 w-5" />}>Home</MobileNavLink>
              <MobileNavLink icon={<Settings className="h-5 w-5" />}>Settings</MobileNavLink>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

function NavLink({ icon, children }) {
  return (
    <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-lg transition-colors duration-200">
      {icon}
      <span className="ml-2">{children}</span>
    </button>
  );
}

function MobileNavLink({ icon, children }) {
  return (
    <button className="flex items-center w-full px-3 py-2 text-base font-medium text-white hover:bg-white/10 transition-colors duration-200">
      {icon}
      <span className="ml-2">{children}</span>
    </button>
  );
}

export default Navbar;
import React from "react";
import { Button } from ".//ui/button";
import { 
  Home, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";


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
  
export default Navbar;
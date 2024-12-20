import React, {useEffect} from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from "./ui/button";
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

console.log(theme)
  return (
    <nav className="w-full bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
        <div className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-medium">{user.displayName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
              </div>
            </div>
          </div>
          <div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
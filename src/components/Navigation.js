import React, { useState } from 'react';
import { MessageSquare, Command, FileSpreadsheet, MessageCircle, LogOut, User, Sun, Moon } from 'lucide-react';
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from '../context/ThemeContext';

const Navigation = ({ setCurrentPage, onLogout, user, currentPage }) => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Show messages',
      page: 'messages'
    },
    {
      icon: <Command className="h-4 w-4" />,
      label: 'Show shortcuts',
      page: 'shortcuts'
    },
    {
      icon: <FileSpreadsheet className="h-4 w-4" />,
      label: 'Open sheet',
      page: 'sheet'
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'Give feedback',
      page: 'feedback'
    },
    {
      icon: <User className="h-4 w-4" />,
      label: 'Profile',
      page: 'profile'
    }
];

  return (
    <nav className="w-full flex items-center justify-between px-4 h-14 bg-background">
      <div className="flex items-center space-x-2">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Button
              key={item.page}
              variant={isActive ? "default" : "ghost"}
              size="icon"
              className={cn(
                "h-9 w-9 relative group",
                isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => setCurrentPage(item.page)}
            >
              {item.icon}
              
              <div className="absolute top-full mt-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                {item.label}
              </div>
            </Button>
          );
        })}
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 m-0 w-fit h-fit rounded-full"
          >
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="h-8 w-8 rounded-full object-cover"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user.displayName && (
                <p className="font-medium text-sm">{user.displayName}</p>
              )}
              {user.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 mr-2" />
            ) : (
              <Moon className="h-4 w-4 mr-2" />
            )}
            <span>Toggle theme</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onLogout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default Navigation;
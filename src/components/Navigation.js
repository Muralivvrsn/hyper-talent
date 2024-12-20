import React from 'react';
import { MessageSquare, Command, FileSpreadsheet, MessageCircle, X, Menu, LogOut, User } from 'lucide-react';
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const Navigation = ({ setCurrentPage, isExpanded, setIsExpanded, onLogout, user, currentPage }) => {
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
    <div className="flex flex-col h-full">
      {/* Toggle Button */}
      <div className={cn(
        "p-4",
        isExpanded ? "flex justify-end" : "flex justify-center"
      )}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col space-y-2 p-4">
        {navItems.map((item) => {
          const isActive = currentPage === item.page;
          return (
            <Button
              key={item.page}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "transition-all duration-300",
                isExpanded ? "w-full justify-start" : "w-full justify-center",
                "relative group",
                isActive ? "!bg-black !text-white" :""
              )}
              onClick={() => setCurrentPage(item.page)}
            >
              <div className={cn(
                "flex items-center",
                isExpanded ? "space-x-2" : "space-x-0"
              )}>
                <span className={isExpanded ? "mr-2" : "mr-0"}>
                  {item.icon}
                </span>
                {isExpanded && (
                  <span>{item.label}</span>
                )}
              </div>

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="p-4 mt-auto border-t">
        <Button
          onClick={onLogout}
          variant="destructive"
          className={cn(
            "transition-all duration-300",
            isExpanded ? "w-full justify-start" : "w-full justify-center",
            "relative group"
          )}
        >
          <LogOut className={cn("h-4 w-4", isExpanded ? "mr-2" : "mr-0")} />
          {isExpanded && <span>Sign Out</span>}
          
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              Sign Out
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Navigation;
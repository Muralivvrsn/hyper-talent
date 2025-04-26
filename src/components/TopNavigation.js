import React from "react";
import { motion } from "framer-motion";
import { Home, Users, MessageSquare, UserPlus, Settings, Bell, BarChart3, Link2 } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "../lib/utils";
import { usePage } from "../context/PageContext"; // Import from PageContext
import { useAuth } from "../context/AuthContext"; // Import from your existing AuthContext

const mainNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Profiles", href: "/profiles", icon: Users },
  { name: "Messages", href: "/shortcuts", icon: MessageSquare },
  { name: "Teams", href: "/teams", icon: UserPlus },
];

export function TopNavigation() {
  const { currentPath, setCurrentPath } = usePage();
  const { profileData, signOut } = useAuth(); // Using your existing useAuth
  console.log()
  const reminderCount = 0;
  const notificationCount = 0;

  const navItemVariants = {
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    tap: { scale: 0.95 },
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <TooltipProvider>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 w-full border-b"
        style={{ background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)" }}
      >
        <div className="container mx-auto px-4 flex h-14 items-center justify-between max-w-7xl">
          {/* Main Navigation */}
          <nav className="flex items-center space-x-2">
            {mainNavItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <motion.div
                    variants={navItemVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setCurrentPath(item.href)}
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-md cursor-pointer transition-colors",
                      currentPath === item.href
                        ? "bg-[#1a5f7a] text-white"
                        : "text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-[#0c2e3b] text-white">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>

          {/* User Controls */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                  >
                    <Bell className="h-5 w-5" />
                    {reminderCount + notificationCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF6B6B]" />
                    )}
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[300px] bg-white border-[#e9ecef]"
                as={motion.div}
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
              >
                <DropdownMenuLabel className="text-[#333333]">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#e9ecef]" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setCurrentPath("/reminders")}
                    className="cursor-pointer text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                  >
                    <span>Reminders</span>
                    {reminderCount > 0 && (
                      <Badge className="ml-auto bg-[#1a5f7a] hover:bg-[#0c2e3b]">
                        {reminderCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]">
                    <span>New Messages</span>
                    {notificationCount > 0 && (
                      <Badge className="ml-auto bg-[#1A85FF] hover:bg-[#144272]">
                        {notificationCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-[#e9ecef]" />
                <DropdownMenuItem
                  onClick={() => setCurrentPath("/settings")}
                  className="justify-center text-[#888888] hover:text-[#666666]"
                >
                  Manage notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> */}

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full ring-2 ring-[#888888] hover:ring-[#666666]"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profileData?.image} alt={profileData?.name} />
                      <AvatarFallback className="bg-[#f8f9fa] text-[#666666]">
                        {profileData?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white border-[#e9ecef]"
                as={motion.div}
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
              >
                <DropdownMenuLabel className="text-[#333333]">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profileData?.name || "Guest"}</p>
                    <p className="text-xs text-[#888888]">{profileData?.email || "Not signed in"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#e9ecef]" />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setCurrentPath("/analytics")}
                    className="cursor-pointer text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Analytics</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCurrentPath("/integrations")}
                    className="cursor-pointer text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    <span>Integrations</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCurrentPath("/reminders")}
                    className="cursor-pointer text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Reminders</span>
                    {reminderCount > 0 && (
                      <Badge className="ml-auto bg-[#1a5f7a] hover:bg-[#0c2e3b]">
                        {reminderCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setCurrentPath("/settings")}
                    className="cursor-pointer text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-[#e9ecef]" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-[#666666] hover:bg-[#f8f9fa] hover:text-[#333333]"
                >
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>
    </TooltipProvider>
  );
}

// Responsive CSS (add to your CSS file)
const styles = `
  @media (max-width: 640px) {
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    nav {
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .w-10 {
      width: 2rem;
    }
    .h-10 {
      height: 2rem;
    }
  }
`;
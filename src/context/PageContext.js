import React, { createContext, useContext, useState } from "react";

const PageContext = createContext();
export const usePage = () => useContext(PageContext);

const pageTitles = {
  "/": "Home",
  "/profiles": "Profiles",
  "/shortcuts": "Messages",
  "/teams": "Teams",
  "/settings": "Settings",
  "/analytics": "Analytics",
  "/integrations": "Integrations",
  "/reminders": "Reminders",
};

export function PageProvider({ children }) {
  const [currentPath, setCurrentPath] = useState("/");

  return (
    <PageContext.Provider value={{ currentPath, setCurrentPath, pageTitle: pageTitles[currentPath] }}>
      {children}
    </PageContext.Provider>
  );
}
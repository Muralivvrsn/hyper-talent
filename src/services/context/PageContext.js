import React, { createContext, useState } from 'react';
import CompanyGen from '../../pages/CompanyGen';
import ProfileGen from '../../pages/ProfileGen';
import ProfileData from  '../../pages/ProfileData';
import Highlight from '../../pages/Hightlight';
import GetCookie from '../../pages/GetCookie';
import CompanyIcon from '../../assets/images/company-svgrepo-com.svg';
import ProfileGenIcon from '../../assets/images/profile-2user-svgrepo-com.svg';
import HighlightIcon from '../../assets/images/highlight-filled-svgrepo-com.svg';
import CookieIcon from '../../assets/images/cookie-svgrepo-com.svg';

export const PageContext = createContext();

const pageConfig = {
  "Company Gen": {
    component: CompanyGen,
    text: "Generate essential company details including LinkedIn URL, code, location, and name effortlessly.",
    header: "Company Generation",
    icon: CompanyIcon,
  },
  "Profile Gen": {
    component: ProfileGen,
    text: "Use a company link to generate comprehensive LinkedIn profiles quickly and efficiently.",
    header: "Profile Generation",
    icon: ProfileGenIcon,
  },
  "Profile Data": {
    component: ProfileData,
    text: "Retrieve detailed profile data from individual LinkedIn profile URLs seamlessly.",
    header: "Profile Data Retrieval",
    icon: ProfileGenIcon,
  },
  "Highlight": {
    component: Highlight,
    text: "Automatically highlight key names on LinkedIn pages based on specified conditions using content scripts.",
    header: "Highlighting",
    icon: HighlightIcon,
  },
  "Get Cookie": {
    component: GetCookie,
    text: "Access and display your LinkedIn cookie information for streamlined integration.",
    header: "Cookie Access",
    icon: CookieIcon,
  },
};

export const PageProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('Company Gen');

  return (
    <PageContext.Provider value={{ currentPage, setCurrentPage, pageConfig }}>
      {children}
    </PageContext.Provider>
  );
};
import React, { useState, useEffect, useContext } from 'react';
import { CssBaseline, Box, Typography, CircularProgress } from '@mui/material';
import { PageContext, PageProvider } from './services/context/PageContext';
import Navbar from './components/navbar';
import Login from './components/Login';
import axios from 'axios';

const AppContent = ({ token }) => {
  const { currentPage, pageConfig } = useContext(PageContext);
  const { component: PageComponent, text, header } = pageConfig[currentPage];

  return (
    <Box sx={{ marginLeft: '50px', padding: '16px' }}>
      <PageComponent token={token} />
    </Box>
  );
};

const App = () => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const chrome = window.chrome

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      chrome.storage.local.get(['accessToken', 'expirationTime'], async (result) => {
        const { accessToken, expirationTime } = result;
        console.log(accessToken);
        console.log(expirationTime)
        if (accessToken && expirationTime && Date.now() < expirationTime) {
          const response = await axios.get(`https://hypertalent-server.onrender.com/auth/check-authorization?token=${accessToken}`);
          console.log(response.data.accessToken)
          if (response.data.success) {
            chrome.storage.local.set({ accessToken: response.data.accessToken, expirationTime: response.data.expirationTime }, () => {
              setToken(response.data.accessToken);
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      });

    } catch (error) {
      console.error('Error checking authorization:', error);
      setLoading(false);
    }
  };

  const handleLogin = (accessToken) => {
    setToken(accessToken);
    setLoading(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Login onLogin={handleLogin} />
      </Box>
    );
  }

  return (
    <PageProvider>
      <CssBaseline />
      <Navbar />
      <AppContent token={token} />
    </PageProvider>
  );
};

export default App;
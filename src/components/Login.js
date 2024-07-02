import React, { useEffect, useState } from 'react';
import { Button, Typography, Box } from '@mui/material';
import axios from 'axios';

function Login({ onLogin }) {
  const [error, setError] = useState(null);
  const chrome = window.chrome;

  const handleLogin = () => {
    clearSession();
    chrome.runtime.sendMessage({ type: 'login' }, (response) => {
      if (response.success) {
        fetchToken(response.code);
      } else {
        setError('OAuth flow error: ' + response.error);
      }
    });
  };

  const fetchToken = async (code) => {
    try {
      const response = await axios.get(`https://hypertalent-server.onrender.com/auth/google/callback?code=${code}`);
      if (response.data.success) {
        const { accessToken, expirationTime } = response.data;
        chrome.storage.local.set({ accessToken, expirationTime }, () => {
          onLogin(accessToken);
        });
      } else {
        setError('Failed to fetch token: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      setError('Error fetching token');
    }
  };

  const clearSession = () => {
    chrome.storage.local.remove(['accessToken', 'expirationTime'], () => {
      console.log('Session cleared');
    });
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['accessToken', 'expirationTime'], () => {
      setError(null);
      window.location.reload();
    });
  };

  return (
    <Box>
      {error && <Typography color="error">{error}</Typography>}
      <Button variant="contained" color="primary" onClick={handleLogin}>
        Login with Google
      </Button>
      <Button variant="outlined" color="secondary" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
}

export default Login;
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, IconButton, Paper } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { styled, useTheme } from '@mui/system';
import 'tailwindcss/tailwind.css';

const GetCookie = () => {
  const [cookieValue, setCookieValue] = useState(null);
  const [error, setError] = useState(false);
  const theme = useTheme();
  const chrome = window.chrome;

  const checkCookie = async () => {
    try {
      const cookie = await new Promise((resolve) => {
        chrome.cookies.get(
          {
            url: `https://www.linkedin.com`,
            name: 'li_at',
          },
          (cookie) => {
            resolve(cookie);
          }
        );
      });
      if (cookie) {
        const decodedValue = cookie.value;
        setCookieValue(decodedValue);
        setError(false);
      } else {
        setCookieValue(null);
        setError(true);
      }
    } catch (error) {
      console.error('Error checking cookie:', error);
      setCookieValue(null);
      setError(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cookieValue).then(() => {
      alert('Cookie value copied to clipboard!');
    });
  };

  useEffect(() => {
    checkCookie();

    const handleCookieChange = (changeInfo) => {
      if (changeInfo.cookie.name === 'li_at' && changeInfo.cookie.domain.includes('linkedin.com')) {
        if (!changeInfo.removed) {
          setCookieValue(changeInfo.cookie.value);
          setError(false);
        } else {
          setCookieValue(null);
          setError(true);
        }
      }
    };

    chrome.cookies.onChanged.addListener(handleCookieChange);

    return () => {
      chrome.cookies.onChanged.removeListener(handleCookieChange);
    };
  }, []);

  const Container = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    textAlign: 'center',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: theme.spacing(3),
  }));

  const Content = styled(Box)(({ theme }) => ({
    width: '100%',
    maxWidth: '600px',
    minWidth: '300px',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.shape?.borderRadius || 8,
    boxShadow: theme.shadows?.[3] || '0px 3px 6px rgba(0,0,0,0.16)',
  }));

  const CookieDisplay = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    wordBreak: 'break-all',
    backgroundColor: '#f9fafb',
  }));

  const CopyButton = styled(IconButton)(({ theme }) => ({
    marginLeft: theme.spacing(1),
    color: theme.palette?.primary?.main || '#1976d2',
  }));

  return (
    <Container>
      <Content>
        <Typography variant="h4" className="text-blue-600" gutterBottom>
         LinkedIn Cookie
        </Typography>
        {cookieValue ? (
          <CookieDisplay>
            <Typography variant="body1" sx={{ flex: '1 1 auto' }}>
              {cookieValue}
            </Typography>
            <CopyButton onClick={handleCopy}>
              <ContentCopy />
            </CopyButton>
          </CookieDisplay>
        ) : error ? (
          <Box>
            <Typography variant="body1" gutterBottom>
              Please log in to your LinkedIn account.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              href="https://www.linkedin.com"
              target="_blank"
            >
              Go to LinkedIn
            </Button>
          </Box>
        ) : (
          <Typography variant="body1" gutterBottom>
            Checking cookie...
          </Typography>
        )}
      </Content>
    </Container>
  );
};

export default GetCookie;
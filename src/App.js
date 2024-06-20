import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [authCode, setAuthCode] = useState('');
  const [token, setToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const chrome = window.chrome
  useEffect(() => {
    // Check if the access token is stored in local storage on component mount
    chrome.storage.local.get(['accessToken', 'expirationTime'], (result) => {
      const { accessToken, expirationTime } = result;
      if (accessToken && expirationTime && Date.now() < expirationTime) {
        setToken(accessToken);
        setLoggedIn(true);
        fetchProfile(accessToken);
      } else {
        // Token is expired or not available, clear stored data
        chrome.storage.local.remove(['accessToken', 'expirationTime']);
      }
    });
  }, []);

  const handleLogin = () => {
    const redirectUri = chrome.identity.getRedirectURL('oauth2');
    const clientId = '17747105090-t6mavvu1bcaldmkc5nurr65f5l0d5r27.apps.googleusercontent.com'; // Replace with your actual client ID

    chrome.identity.launchWebAuthFlow(
      {
        url: 'https://accounts.google.com/o/oauth2/auth' +
             '?client_id=' + clientId +
             '&redirect_uri=' + encodeURIComponent(redirectUri) +
             '&response_type=code' +
             '&scope=profile email',
        interactive: true
      },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          console.error(chrome.runtime.lastError);
          return;
        }

        const params = new URLSearchParams(new URL(redirectUrl).search);
        const code = params.get('code');
        setAuthCode(code);
        fetchToken(code);
      }
    );
  };

  const fetchToken = (code) => {
    chrome.runtime.sendMessage(
      { action: 'fetchToken', code: code },
      (response) => {
        if (response.success) {
          chrome.storage.local.get(['accessToken'], (result) => {
            const accessToken = result.accessToken;
            setToken(accessToken);
            setLoggedIn(true);
            fetchProfile(accessToken);
          });
        } else {
          console.error('Failed to fetch token');
        }
      }
    );
  };

  const fetchProfile = (accessToken) => {
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => response.json())
    .then(profile => {
      console.log(profile)
      setProfile(profile);
    })
    .catch(error => {
      console.error('Error fetching profile', error);
    });
  };

  const handleLogout = () => {
    chrome.storage.local.remove(['accessToken', 'expirationTime'], () => {
      setToken(null);
      setLoggedIn(false);
      setProfile(null);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        {!loggedIn ? (
          <button onClick={handleLogin}>Login</button>
        ) : (
          <div>
            {profile && (
              <div>
                <img src={profile.picture} alt="Profile" />
                <p>Welcome, {profile.name}!</p>
                <p>Email: {profile.email}</p>
              </div>
            )}
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>
      <div className='box'></div>
    </div>
  );
}

export default App;
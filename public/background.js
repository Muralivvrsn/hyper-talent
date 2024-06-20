chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchToken') {
      const clientId = '17747105090-t6mavvu1bcaldmkc5nurr65f5l0d5r27.apps.googleusercontent.com'; // Replace with your actual client ID
      const clientSecret = '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'; // Replace with your actual client secret
      const redirectUri = chrome.identity.getRedirectURL('oauth2');
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    params.append('code', request.code);

    fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })
    .then(response => response.json())
    .then(data => {
      if (data.access_token) {
        const expiresIn = data.expires_in; // Expiration time in seconds
        const expirationTime = Date.now() + expiresIn * 1000; // Calculate expiration time in milliseconds

        chrome.storage.local.set({ 
          accessToken: data.access_token, 
          expirationTime: expirationTime 
        }, () => {
          console.log('Token stored successfully');
          sendResponse({ success: true });
        });
      } else {
        console.error('Error fetching token', data);
        sendResponse({ success: false });
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      sendResponse({ success: false });
    });

    return true; // Indicates to Chrome that the response is asynchronous
  } else if (request.action === 'revokeToken') {
    const token = request.token;
    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${token}`;

    fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(response => {
      if (response.ok) {
        console.log('Token revoked successfully');
        sendResponse({ success: true });
      } else {
        console.error('Error revoking token');
        sendResponse({ success: false });
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      sendResponse({ success: false });
    });

    return true; // Indicates to Chrome that the response is asynchronous
  }
});
  chrome.runtime.onInstalled.addListener(() => {
    const redirectUri = chrome.identity.getRedirectURL('oauth2');
    console.log('Redirect URI:', redirectUri);
  });
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

  

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'login') {
      const redirectUri = chrome.identity.getRedirectURL('oauth2');
      const clientId = '17747105090-t6mavvu1bcaldmkc5nurr65f5l0d5r27.apps.googleusercontent.com';
      const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile%20https://www.googleapis.com/auth/drive%20https://www.googleapis.com/auth/spreadsheets&access_type=offline&prompt=consent`;
  
      chrome.identity.launchWebAuthFlow(
        { url: authUrl, interactive: true },
        (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
            return;
          }
  
          const params = new URLSearchParams(new URL(redirectUrl).search);
          const code = params.get('code');
  
          if (code) {
            sendResponse({ success: true, code });
          } else {
            sendResponse({ success: false, error: 'No code returned' });
          }
        }
      );
      return true; // Indicates that the response is asynchronous
    }
  });

  chrome.runtime.onInstalled.addListener(() => {
    const redirectUri = chrome.identity.getRedirectURL('oauth2');
    console.log('Redirect URI:', redirectUri);
  });
  
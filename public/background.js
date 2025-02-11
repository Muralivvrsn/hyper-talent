// Panel behavior setup
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let windowId;

chrome.tabs.onActivated.addListener(function (activeInfo) {
  windowId = activeInfo.windowId;
});


const REFRESH_BUFFER = 10 * 60 * 1000; // 10 minutes buffer before token expiry
const REFRESH_INTERVAL = 50 * 60 * 1000; // Refresh every 50 minutes

// Tab update listener
// Helper function to check if URL is a LinkedIn URL
function isLinkedInUrl(url) {
  return url?.includes('linkedin.com');
}

function sendMessageForUrl(tabId, url, isOnFocusEvent = false) {
  if (!url) return;

  if (isOnFocusEvent && isLinkedInUrl(url) && url.includes('linkedin.com/in')) {
    chrome.tabs.sendMessage(tabId, {
      type: "PROFILE_TAB",
      url: url
    });
  }

  if (url.includes('linkedin.com/messaging')) {
    chrome.tabs.sendMessage(tabId, {
      type: "URL_UPDATED",
      url: url
    });
  } else if (url.includes('linkedin.com/in')) {
    chrome.tabs.sendMessage(tabId, {
      type: "URL_PROFILE",
      url: url
    });
    chrome.tabs.sendMessage(tabId, {
      type: "PROFILE_TAB",
      url: url
    });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isLinkedInUrl(tab.url)) return;

  if (changeInfo.status === 'complete' || changeInfo.url) {
    sendMessageForUrl(tabId, tab.url, true);
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (isLinkedInUrl(tab.url) && tab.status === 'complete') {
    sendMessageForUrl(tab.id, tab.url, true);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (isLinkedInUrl(tab.url) && tab.status === 'complete') {
      sendMessageForUrl(tab.id, tab.url, true);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      windowId: windowId
    });

    if (activeTab && isLinkedInUrl(activeTab.url) && activeTab.status === 'complete') {
      sendMessageForUrl(activeTab.id, activeTab.url, true);
    }
  } catch (error) {
    console.error('Error handling window focus:', error);
  }
});

chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
  try {
    const tab = await chrome.tabs.get(addedTabId);
    if (isLinkedInUrl(tab.url) && tab.status === 'complete') {
      sendMessageForUrl(tab.id, tab.url, true);
    }
  } catch (error) {
    console.error('Error handling tab replacement:', error);
  }
});

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  return 0;
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update') {
    const currentVersion = chrome.runtime.getManifest().version;
    // console.log(details)
    const previousVersion = details.previousVersion;

    // Only show update if current version is higher than previous version
    if (compareVersions(currentVersion, previousVersion) > 0) {
      // Store the versions and set update flag
      chrome.storage.local.set({
        currentVersion,
        previousVersion,
        hasUnseenUpdate: true
      });

      // Show update badge
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      chrome.action.setBadgeText({ text: 'New' });
    }
    else {
      chrome.storage.local.set({
        currentVersion,
        previousVersion,
        hasUnseenUpdate: false
      });
    }
  }
});

// Listen for when the extension popup is opened
chrome.action.onClicked.addListener(() => {
  // Clear the badge when they open the extension
  chrome.action.setBadgeText({ text: '' });

  // Mark update as seen
  chrome.storage.local.set({
    hasUnseenUpdate: false
  });
});

// Optional: Restore badge if browser is restarted and update hasn't been seen
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['hasUnseenUpdate', 'currentVersion', 'previousVersion'], (result) => {
    if (result.hasUnseenUpdate &&
      result.currentVersion &&
      result.previousVersion &&
      compareVersions(result.currentVersion, result.previousVersion) > 0) {
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      chrome.action.setBadgeText({ text: 'New' });
    }
  });
});





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_GOOGLE_TOKEN') {
    handleAsyncMessage(async () => {
      try {
        const { accessToken, tokenExpiration } = await chrome.storage.local.get(['accessToken', 'tokenExpiration']);
        const currentTime = Date.now();
        
        // Check if token exists and is not near expiration (50 minutes threshold)
        if (accessToken && tokenExpiration && currentTime < tokenExpiration - 50 * 60 * 1000) {
          return { token: accessToken, success: true };
        }
        
        // Token is expired or near expiration, try to refresh
        const newToken = await refreshToken();
        return { token: newToken, success: true };
      } catch (error) {
        return { token: null, success: false, error: error.message };
      }
    }, sendResponse);
    return true;
  }

  if (message.type === 'STORE_TOKEN') {
    handleAsyncMessage(async () => {
      try {
        const expirationTime = Date.now() + message.expiresIn * 1000;
        await chrome.storage.local.set({
          accessToken: message.token,
          refreshToken: message.refreshToken,
          tokenExpiration: expirationTime
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, sendResponse);
    return true;
  }

  if (message.type === 'CLEAR_TOKEN') {
    handleAsyncMessage(async () => {
      try {
        await chrome.storage.local.remove(['accessToken', 'refreshToken', 'tokenExpiration']);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, sendResponse);
    return true;
  }
});

const handleAsyncMessage = (asyncFn, sendResponse) => {
  asyncFn().then(sendResponse);
};

const refreshToken = async () => {
  try {
    const { refreshToken, clientId, clientSecret } = await chrome.storage.local.get([
      'refreshToken',
      'clientId',
      'clientSecret'
    ]);
    
    if (!refreshToken || !clientId || !clientSecret) {
      throw new Error('Missing required credentials');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    const expirationTime = Date.now() + data.expires_in * 1000;
    
    await chrome.storage.local.set({
      accessToken: data.access_token,
      tokenExpiration: expirationTime
    });

    return data.access_token;
  } catch (error) {
    throw error;
  }
};


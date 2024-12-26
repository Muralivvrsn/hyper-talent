// Panel behavior setup
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let windowId;

chrome.tabs.onActivated.addListener(function (activeInfo) {
  windowId = activeInfo.windowId;
});

// Tab update listener
// Helper function to check if URL is a LinkedIn URL
function isLinkedInUrl(url) {
  return url?.includes('linkedin.com');
}

function sendMessageForUrl(tabId, url, isOnFocusEvent = false) {
  if (!url) return;

  if (isOnFocusEvent && isLinkedInUrl(url)) {
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
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!isLinkedInUrl(tab.url)) return;

  if (changeInfo.status === 'complete' || changeInfo.url) {
    sendMessageForUrl(tabId, tab.url, false);
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (isLinkedInUrl(tab.url) && tab.status === 'complete') {
    sendMessageForUrl(tab.id, tab.url, false);
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
      sendMessageForUrl(tab.id, tab.url, false);
    }
  } catch (error) {
    console.error('Error handling tab replacement:', error);
  }
});

// Message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_GOOGLE_TOKEN') {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      sendResponse({ token, success: true });
    });
    return true;
  }

  if (message.type === 'CLEAR_TOKEN') {
    chrome.identity.getAuthToken({ interactive: false }, function(token) {
      if (token) {
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .then(() => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
              chrome.identity.clearAllCachedAuthTokens(() => {
                sendResponse({ success: true });
              });
            });
          })
          .catch(error => {
            console.error('Error revoking token:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: false, error: 'No token found' });
      }
    });
    return true;
  }

  if (message.action === 'hypertalent-keyPressed') {
    // Get the current tab to verify URL or perform actions
    console.log('create pressed')
    console.log(message.data)
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.storage.local.set({ 'profileData': message.data }, function () {
        // Send message after storage is complete
        chrome.runtime.sendMessage({ action: 'ProfileNotesTriggered', page: message.key });
      });
      chrome.sidePanel.open({
        windowId: windowId,
      });
    });
}

});
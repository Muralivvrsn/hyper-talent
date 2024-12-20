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

// Helper function to send messages based on URL type
function sendMessageForUrl(tabId, url) {
  if (!url) return;

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

// Listen for any changes to the tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if it's a LinkedIn URL
  if (!isLinkedInUrl(tab.url)) return;

  // Check for all possible status changes that might need a refresh
  if (changeInfo.status === 'complete' ||
    changeInfo.url || // URL changes without page reload
    changeInfo.status === 'loading') { // Catch early load states too

    sendMessageForUrl(tabId, tab.url);
  }
});

// Listen for tab activation (when user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);

    // Only proceed if it's a LinkedIn URL and tab is fully loaded
    if (isLinkedInUrl(tab.url) && tab.status === 'complete') {
      sendMessageForUrl(tab.id, tab.url);
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

// Listen for window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;

  try {
    // Get the active tab in the focused window
    const [activeTab] = await chrome.tabs.query({
      active: true,
      windowId: windowId
    });

    if (activeTab && isLinkedInUrl(activeTab.url) && activeTab.status === 'complete') {
      sendMessageForUrl(activeTab.id, activeTab.url);
    }
  } catch (error) {
    console.error('Error handling window focus:', error);
  }
});

// Listen for tab replacement (when tab is restored or history state changes)
chrome.tabs.onReplaced.addListener(async (addedTabId, removedTabId) => {
  try {
    const tab = await chrome.tabs.get(addedTabId);
    if (isLinkedInUrl(tab.url) && tab.status === 'complete') {
      sendMessageForUrl(tab.id, tab.url);
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
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false });
      }
    });
    return true;
  }

  if (message.action === 'keyPressed' && message.key === 'n') {
    // Get the current tab to verify URL or perform actions
    console.log('create prssed')
    console.log(message.data)
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.storage.local.set({ 'profileData': message.data }, function () {
      });
      chrome.sidePanel.open({
        windowId: windowId,
      });

    });
  }

});
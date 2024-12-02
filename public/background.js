chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));



let windowId;


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes("linkedin.com/messaging")) {
    console.log('sending message')
    chrome.tabs.sendMessage(tabId, {
      type: "URL_UPDATED",
      url: tab.url
    });
  }
});

// Also handle when a tab is activated (switched to)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  windowId = activeInfo.windowId;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url?.includes("linkedin.com/messaging") && tab.status === 'complete') {
      console.log('sending msage')
      chrome.tabs.sendMessage(tab.id, {
        type: "URL_UPDATED",
        url: tab.url
      });
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_GOOGLE_TOKEN') {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      console.log(token)
      sendResponse({ token, success: true });
    });
    return true;
  }
});


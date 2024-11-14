chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

  

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if URL is available and contains linkedin.com/messaging
    if (changeInfo.url && changeInfo.url.includes("linkedin.com/messaging")) {
      console.log('linkedin messaging page')
      chrome.tabs.sendMessage(tabId, {
        type: "URL_UPDATED",
        url: changeInfo.url
      });
    }
    // Also check when page load completes
    else if (changeInfo.status === 'complete' && tab.url?.includes("linkedin.com/messaging")) {
      console.log('sending message')
      chrome.tabs.sendMessage(tabId, {
        type: "URL_UPDATED",
        url: tab.url
      });
    }
  });
  
  // Also handle when a tab is activated (switched to)
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url?.includes("linkedin.com/messaging")) {
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
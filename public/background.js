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
    // console.log('create pressed')
    // console.log(message.data)
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.storage.local.set({ 'profileData': message.data }, function () {
        // Send message after storage is complete
        chrome.runtime.sendMessage({ action: 'ProfileNotesTriggered', page: message.key });
      });
      if(message.key){
        chrome.sidePanel.open({
          windowId: windowId,
        });
      }
    });
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
    else{
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



function scrapeProfile() {
  const getData = () => {
    // Basic Info
    const basicInfo = {
      name: document.querySelector('h1')?.innerText || '',
      role: document.querySelector('.text-body-medium')?.innerText || '',
      location: document.querySelector('.text-body-small.inline')?.innerText || ''
    };

    // Experience
    const experienceSection = document.querySelector('#experience');
    const experienceItems = experienceSection?.closest('section').querySelectorAll('.artdeco-list__item');
    const experience = Array.from(experienceItems || []).map(item => {
      const roleElement = item.querySelector('.t-bold');
      const companyElement = item.querySelector('.t-14.t-normal:not(.t-black--light)');
      const dateElement = item.querySelector('.t-14.t-normal.t-black--light');
      const locationElement = item.querySelector('.t-14.t-normal.t-black--light:last-child');
      const descriptionElement = item.querySelector('.pvs-list__outer-container .pvs-list');

      return {
        role: roleElement?.innerText || '',
        company: companyElement?.innerText || '',
        duration: dateElement?.innerText || '',
        location: locationElement?.innerText || '',
        description: descriptionElement?.innerText || ''
      };
    });

    // Education
    const educationSection = document.querySelector('#education');
    const educationItems = educationSection?.closest('section').querySelectorAll('.artdeco-list__item');
    const education = Array.from(educationItems || []).map(item => {
      const schoolElement = item.querySelector('.t-bold');
      const degreeElement = item.querySelector('.t-14.t-normal');
      const dateElement = item.querySelector('.t-14.t-normal.t-black--light');

      return {
        school: schoolElement?.innerText || '',
        degree: degreeElement?.innerText || '',
        date: dateElement?.innerText || ''
      };
    });

    // Skills
    const skillsSection = document.querySelector('#skills');
    const skillItems = skillsSection?.closest('section').querySelectorAll('.artdeco-list__item');
    const skills = Array.from(skillItems || []).map(item => 
      item.querySelector('.t-bold')?.innerText || ''
    );

    // Certifications
    const certSection = document.querySelector('#licenses_and_certifications');
    const certItems = certSection?.closest('section').querySelectorAll('.artdeco-list__item');
    const certifications = Array.from(certItems || []).map(item => {
      const nameElement = item.querySelector('.t-bold');
      const issuerElement = item.querySelector('.t-14.t-normal');
      const dateElement = item.querySelector('.t-14.t-normal.t-black--light');

      return {
        name: nameElement?.innerText || '',
        issuer: issuerElement?.innerText || '',
        date: dateElement?.innerText || ''
      };
    });

    // Projects
    const projectSection = document.querySelector('#projects');
    const projectItems = projectSection?.closest('section').querySelectorAll('.artdeco-list__item');
    const projects = Array.from(projectItems || []).map(item => {
      const titleElement = item.querySelector('.t-bold');
      const descriptionElement = item.querySelector('.inline-show-more-text');
      const linkElement = item.querySelector('a[href*="Show project"]');

      return {
        title: titleElement?.innerText || '',
        description: descriptionElement?.innerText || '',
        link: linkElement?.href || ''
      };
    });

    return {
      basicInfo,
      experience,
      education,
      skills,
      certifications,
      projects
    };
  };

  return getData();
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CREATE_HIDDEN_WINDOW') {
    chrome.windows.create({
      url: request.url,
      width: 1,
      height: 1,
      left: -10000,
      top: -10000,
      focused: false,
      type: 'popup'
    }, (window) => {
      chrome.windows.update(window.id, { state: 'minimized' });
      
      // setTimeout(() => {
        chrome.scripting.executeScript({
          target: { tabId: window.tabs[0].id },
          function: scrapeProfile
        }, (results) => {
          if (results && results[0]) {
            // console.log(results)
            sendResponse(results[0].result);
            chrome.windows.remove(window.id);
          }
        });
      // }, 5000);
    });
    return true;
  }
});
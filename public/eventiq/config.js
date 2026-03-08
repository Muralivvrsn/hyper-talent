// EventIQ Bridge Configuration
// API key is stored in chrome.storage.sync — NEVER hardcoded
window.EVENTIQ_CONFIG = {
  apiBase: 'https://us.hyperverge.space/api/tools',
  toolKey: null, // Loaded from chrome.storage.sync at runtime
  enabled: true,
  cache: {
    ttlMs: 30 * 60 * 1000, // 30 minutes
    maxEntries: 50
  }
};

// Load API key from chrome.storage on init
(async function loadEventIQKey() {
  try {
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(['eventiq_tool_key'], resolve);
    });
    if (result.eventiq_tool_key) {
      window.EVENTIQ_CONFIG.toolKey = result.eventiq_tool_key;
    }
  } catch (e) {
    // Content scripts may not have chrome.storage access in all contexts
    console.debug('[EventIQ] Could not load API key from storage');
  }
})();

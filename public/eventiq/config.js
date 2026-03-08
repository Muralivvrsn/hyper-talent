// EventIQ Bridge Configuration
// API key is stored in chrome.storage.sync — NEVER hardcoded
window.EVENTIQ_CONFIG = {
  apiBase: 'https://us.hyperverge.space/api/tools',
  toolKey: null, // Loaded from chrome.storage.sync at runtime
  enabled: true,
  cache: {
    ttlMs: 30 * 60 * 1000, // 30 minutes
    maxEntries: 50
  },
  ready: false,
  _readyPromise: null,
  _readyResolve: null
};

// Promise that resolves when config is loaded
window.EVENTIQ_CONFIG._readyPromise = new Promise((resolve) => {
  window.EVENTIQ_CONFIG._readyResolve = resolve;
});

window.EVENTIQ_CONFIG.waitReady = function() {
  return window.EVENTIQ_CONFIG._readyPromise;
};

// Load API key from chrome.storage on init
(function loadEventIQKey() {
  try {
    chrome.storage.sync.get(['eventiq_tool_key', 'eventiq_enabled'], (result) => {
      if (result.eventiq_tool_key) {
        window.EVENTIQ_CONFIG.toolKey = result.eventiq_tool_key;
      }
      if (result.eventiq_enabled === false) {
        window.EVENTIQ_CONFIG.enabled = false;
      }
      window.EVENTIQ_CONFIG.ready = true;
      window.EVENTIQ_CONFIG._readyResolve();
      console.debug('[EventIQ] Config loaded — key:', !!result.eventiq_tool_key, 'enabled:', window.EVENTIQ_CONFIG.enabled);
    });
  } catch (e) {
    console.debug('[EventIQ] Could not load API key from storage:', e.message);
    window.EVENTIQ_CONFIG.ready = true;
    window.EVENTIQ_CONFIG._readyResolve();
  }
})();

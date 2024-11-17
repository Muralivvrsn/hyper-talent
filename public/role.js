(() => {


  log('Extension initializing...');

  // Shared state


  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    log('Received message: ' + JSON.stringify(message));
    if (message.type === "URL_UPDATED") {
      init();
    }
  });

  // Initial setup
  init();
})();
// content.js

function waitForElement(selector, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function checkElement() {
      console.log(`Checking for element '${selector}', attempt ${attempts + 1}/${maxAttempts}`);
      const element = document.querySelector(selector);
      if (element) {
        console.log(`Element '${selector}' found successfully`);
        resolve(element);
      } else if (attempts >= maxAttempts) {
        console.error(`Failed to find element '${selector}' after ${maxAttempts} attempts`);
        reject(new Error(`Element not found after ${maxAttempts} attempts: ${selector}`));
      } else {
        attempts++;
        setTimeout(checkElement, 500);
      }
    }

    checkElement();
  });
}



// Variable to track whether the dark theme is active
window.isDarkTheme = false;

// Function to update the dark theme variable
function updateDarkThemeStatus(mutationsList) {
  for (const mutation of mutationsList) {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      const htmlElement = mutation.target;
      isDarkTheme = htmlElement.classList.contains('theme--dark');
      console.log(`Dark theme active: ${isDarkTheme}`);
    }
  }
}
const observeThemeChanges = () => {
  const htmlElement = document.documentElement;
  const observer = new MutationObserver(updateDarkThemeStatus);
  observer.observe(htmlElement, {
    attributes: true, // Observe attribute changes
    attributeFilter: ['class'] // Only observe the 'class' attribute
  });

  // Initialize the status immediately
  isDarkTheme = htmlElement.classList.contains('theme--dark');
  console.log(`Initial dark theme status: ${isDarkTheme}`);
};

// Start observing


// content.js

// Add this function near your other waitForElement function
function waitForNotesManager(maxAttempts = 20) {
  console.log('Waiting for NotesManager to be available...');
  return new Promise((resolve, reject) => {
    let attempts = 0;

    function checkNotesManager() {
      console.log(`Checking for NotesManager, attempt ${attempts + 1}/${maxAttempts}`);
      if (window.getNotesManager && typeof window.getNotesManager === 'function') {
        console.log('NotesManager found successfully');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.error(`Failed to find NotesManager after ${maxAttempts} attempts`);
        reject(new Error('NotesManager not available'));
      } else {
        attempts++;
        setTimeout(checkNotesManager, 500);
      }
    }

    checkNotesManager();
  });
}

// Modify your message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message.type);

  if (message.type === "URL_UPDATED" || message.type === "google-sheet-has-been-clicked") {
    console.log('Starting initialization process');

    waitForElement('.msg-conversations-container__title-row')
      .then(async () => {
        console.log('Container found, initializing managers');
        observeThemeChanges();

        // Initialize label manager
        window.getLabelManager();

        // Cleanup existing observers
        console.log('Cleaning up existing observers');
        if (window.labelsObserver?.observer) {
          window.labelsObserver.observer.cleanup();
        }
        if (window.shortcutsObserver?.observer) {
          window.shortcutsObserver.observer.cleanup();
        }
        if (window.labelsFilter?.observer) {
          window.labelsFilter.observer.cleanup();
        }
        if (window.notes?.observer) {
          window.notes.observer.cleanup();
        }
        if (window.notesObserver?.observer) {
          window.notesObserver.observer.cleanup();
        }

        try {
          // Wait for message box to be available
          // await waitForElement('.msg-form__contenteditable');

          // Wait for NotesManager to be available
          await waitForNotesManager();
          console.log('Initializing NotesManager');
          const notesManager = window.getNotesManager();
          console.log('NotesManager initialized:', !!notesManager);

          console.log('Initializing observers');
          window.notesObserver.observer.initialize();
          window.labelsObserver.observer.initialize();
          window.shortcutsObserver.observer.initialize();
          window.labelsFilter.observer.initialize();
          window.keyboard.shortcuts.observer();

          console.log('All observers initialized successfully');
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error in initialization:', error);
          sendResponse({ success: false, error: error.message });
        }
      })
      .catch(error => {
        console.error('Error in initialization process:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
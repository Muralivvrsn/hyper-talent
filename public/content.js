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

  if (message.type === "URL_UPDATED") {
    console.log('Starting initialization process');

    waitForElement('.msg-conversations-container__title-row')
      .then(async () => {
        console.log('Container found, initializing managers');
        
        // Track initialization results
        const initResults = {
          success: true,
          errors: []
        };

        try {
          observeThemeChanges();
        } catch (error) {
          console.error('Theme observer error:', error);
          initResults.errors.push('Theme observer failed');
        }

        try {
          window.labelManager.initialize();
        } catch (error) {
          console.error('Label manager error:', error);
          initResults.errors.push('Label manager failed');
        }

        // Cleanup existing observers
        console.log('Cleaning up existing observers');
        const observers = [
          { name: 'labels', obj: window.labelsObserver?.observer },
          { name: 'shortcuts', obj: window.shortcutsObserver?.observer },
          // { name: 'labelsFilter', obj: window.labelsFilter?.observer },
          { name: 'notes', obj: window.notes?.observer },
          { name: 'notesObserver', obj: window.notesObserver?.observer }
        ];

        observers.forEach(({ name, obj }) => {
          try {
            if (obj) obj.cleanup();
          } catch (error) {
            console.error(`${name} cleanup error:`, error);
            initResults.errors.push(`${name} cleanup failed`);
          }
        });

        // Initialize NotesManager independently
        try {
          await waitForNotesManager();
          console.log('Initializing NotesManager');
          const notesManager = window.getNotesManager();
          console.log('NotesManager initialized:', !!notesManager);
        } catch (error) {
          console.error('NotesManager initialization error:', error);
          initResults.errors.push('NotesManager initialization failed');
        }

        // Initialize each observer independently
        const observersToInit = [
          { name: 'notesObserver', obj: window.notesObserver?.observer },
          { name: 'labelsObserver', obj: window.labelsObserver?.observer },
          { name: 'shortcutsObserver', obj: window.shortcutsObserver?.observer },
          // { name: 'labelsFilter', obj: window.labelFilterCore?.observer }
        ];

        observersToInit.forEach(({ name, obj }) => {
          try {
            if (obj) {
              obj.initialize();
              console.log(`${name} initialized successfully`);
            }
          } catch (error) {
            console.error(`${name} initialization error:`, error);
            initResults.errors.push(`${name} initialization failed`);
          }
        });

        // Initialize keyboard shortcuts independently
        try {
          window.keyboard.shortcuts.observer();
          console.log('Keyboard shortcuts initialized');
        } catch (error) {
          console.error('Keyboard shortcuts initialization error:', error);
          initResults.errors.push('Keyboard shortcuts initialization failed');
        }

        window.labelFilterCore.initialize()
        console.log('Initialization complete with results:', initResults);
        sendResponse({ 
          success: true, 
          partialFailures: initResults.errors.length > 0,
          errors: initResults.errors 
        });
      })
      .catch(error => {
        console.error('Critical error in initialization process:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  else if(message.type === "URL_PROFILE") {
    waitForElement('.text-body-small a.ember-view')
      .then(() => {
        try {
          // window.profileNotesManager.init();
          window.profileNotes.init();
          window.labelProfiles.init();
        } catch (error) {
          console.error('Profile notes manager initialization error:', error);
        }
      })
      .catch((err) => {
        console.error('Profile element wait error:', err);
      });
  }
});



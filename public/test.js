function initShort() {
    const mainElement = document.querySelector('.scaffold-layout__main');
    const firstSection = mainElement?.querySelector('section');
    const existingSection = document.getElementById('connection-id');
  
    // Add CSS for hover and loading animation
    const style = document.createElement('style');
    style.textContent = `
      .sync-option:hover {
        background-color: #f8fafc !important;
      }
  
      .email-shimmer {
        background: linear-gradient(90deg, 
          rgba(125, 98, 236, 0.05) 25%, 
          rgba(125, 98, 236, 0.1) 37%, 
          rgba(125, 98, 236, 0.05) 63%
        );
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
      }
  
      @keyframes shimmer {
        0% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0 50%;
        }
      }
  
      .email-fade-in {
        opacity: 0;
        transform: translateY(10px);
        animation: fadeIn 0.3s ease forwards;
      }
  
      @keyframes fadeIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  
    if (firstSection && !existingSection) {
      const newSection = document.createElement('section');
      newSection.className = 'artdeco-card';
      newSection.id = 'connection-id';
      newSection.style.height = 'fit-content';
      newSection.style.marginTop = '0.8rem';
      newSection.style.padding = '24px';
  
      const containerWrapper = document.createElement('div');
      containerWrapper.style.display = 'flex';
      containerWrapper.style.gap = '20px';
      containerWrapper.style.justifyContent = 'space-between';
      containerWrapper.style.width = '100%';
  
      // Export Container
      const exportContainer = document.createElement('div');
      exportContainer.className = 'sync-container';
      exportContainer.style.fontFamily = '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto';
      exportContainer.style.flex = '1';
      exportContainer.style.backgroundColor = 'rgba(125, 98, 236, 0.05)';
      exportContainer.style.padding = '15px';
      exportContainer.style.borderRadius = '12px';
  
      // Email Container
      const emailContainer = document.createElement('div');
      emailContainer.className = 'email-container';
      emailContainer.style.fontFamily = '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto';
      emailContainer.style.flex = '1';
      emailContainer.style.backgroundColor = 'rgba(125, 98, 236, 0.05)';
      emailContainer.style.padding = '15px';
      emailContainer.style.borderRadius = '12px';
  
      // Export Header
      const exportHeader = document.createElement('div');
      exportHeader.style.marginBottom = '12px';
      const exportTitle = document.createElement('h2');
      exportTitle.style.color = 'rgb(125, 98, 236)';
      exportTitle.style.fontSize = '14px';
      exportTitle.style.fontWeight = '600';
      exportTitle.style.margin = '0';
      exportTitle.textContent = 'Export Data';
  
      // Email Header with loading state
      const emailHeader = document.createElement('div');
      emailHeader.style.marginBottom = '12px';
      const emailTitle = document.createElement('h2');
      emailTitle.style.color = 'rgb(125, 98, 236)';
      emailTitle.style.fontSize = '14px';
      emailTitle.style.fontWeight = '600';
      emailTitle.style.margin = '0';
      emailTitle.textContent = 'Loading Profile...';
  
      // Email content with loading state
      const emailContent = document.createElement('div');
      emailContent.style.height = '20px';
      emailContent.style.borderRadius = '4px';
      emailContent.className = 'email-shimmer';
  
      // Export options
      const exportOptions = document.createElement('div');
      exportOptions.style.display = 'flex';
      exportOptions.style.flexDirection = 'column';
      exportOptions.style.gap = '8px';
  
      const sheetsOption = document.createElement('div');
      sheetsOption.className = 'sync-option';
      sheetsOption.style.background = 'white';
      sheetsOption.style.padding = '6px';
      sheetsOption.style.borderRadius = '8px';
      sheetsOption.style.display = 'flex';
      sheetsOption.style.alignItems = 'center';
      sheetsOption.style.cursor = 'pointer';
      sheetsOption.style.transition = 'background-color 0.2s';
      sheetsOption.style.border = '1px solid #E2E8F0';
      sheetsOption.style.width = '100%';
  
      // Add click handler for Google Sheets
      sheetsOption.addEventListener('click', () => {
        // console.log('google-sheet-has-been-clicked');
        chrome.runtime.sendMessage({
          type: "google-sheet-has-been-clicked"
        });
      });
  
      const sheetsImg = document.createElement('img');
      sheetsImg.src = 'https://w7.pngwing.com/pngs/530/917/png-transparent-g-suite-google-docs-spreadsheet-google-sheets-google-angle-rectangle-logo-thumbnail.png';
      sheetsImg.style.width = '20px';
      sheetsImg.style.height = '20px';
      sheetsImg.style.marginRight = '8px';
      sheetsImg.style.objectFit = 'contain';
      sheetsImg.alt = 'Google Sheets';
  
      const sheetsText = document.createElement('span');
      sheetsText.style.fontSize = '13px';
      sheetsText.style.fontWeight = '400';
      sheetsText.textContent = 'Google Sheets';
  
      const notionOption = document.createElement('div');
      notionOption.className = 'sync-option';
      notionOption.style.background = 'white';
      notionOption.style.padding = '6px';
      notionOption.style.borderRadius = '8px';
      notionOption.style.display = 'flex';
      notionOption.style.alignItems = 'center';
      notionOption.style.cursor = 'pointer';
      notionOption.style.transition = 'background-color 0.2s';
      notionOption.style.border = '1px solid #E2E8F0';
      notionOption.style.width = '100%';
  
      const notionImg = document.createElement('img');
      notionImg.src = 'https://w7.pngwing.com/pngs/589/804/png-transparent-notion-logo.png';
      notionImg.style.width = '20px';
      notionImg.style.height = '20px';
      notionImg.style.marginRight = '8px';
      notionImg.style.objectFit = 'contain';
      notionImg.alt = 'Notion';
  
      const notionText = document.createElement('span');
      notionText.style.fontSize = '13px';
      notionText.style.fontWeight = '400';
      notionText.textContent = 'Notion';
  
      // Function to update email section with actual data
      const updateEmailSection = (name, email) => {
        emailTitle.textContent = `${name}'s Email`;
        emailContent.className = 'email-fade-in';
        emailContent.style.height = 'auto';
        emailContent.style.margin = '0';
        emailContent.style.fontSize = '13px';
        emailContent.style.lineHeight = '1.5';
        emailContent.style.color = '#4a5568';
        emailContent.textContent = email;
      };
  
      // Start checking for profile image
      const checkProfileImage = setInterval(() => {
        const profileImg = document.querySelector('.pv-top-card-profile-picture__image--show');
        if (profileImg) {
          clearInterval(checkProfileImage);
          const name = profileImg.alt || 'Profile';
          // Here you would typically make an API call or get the email from your data source
          setTimeout(() => {
            updateEmailSection(name, 'muralivvrsn75683@gmail.com');
          }, 800); // Simulate loading time
        }
      }, 500);
  
      // Assemble DOM
      sheetsOption.appendChild(sheetsImg);
      sheetsOption.appendChild(sheetsText);
      notionOption.appendChild(notionImg);
      notionOption.appendChild(notionText);
  
      exportOptions.appendChild(sheetsOption);
      exportOptions.appendChild(notionOption);
  
      exportHeader.appendChild(exportTitle);
      emailHeader.appendChild(emailTitle);
  
      exportContainer.appendChild(exportHeader);
      exportContainer.appendChild(exportOptions);
  
      emailContainer.appendChild(emailHeader);
      emailContainer.appendChild(emailContent);
  
      containerWrapper.appendChild(exportContainer);
      containerWrapper.appendChild(emailContainer);
  
      newSection.appendChild(containerWrapper);
      firstSection.parentNode.insertBefore(newSection, firstSection.nextSibling);
    }
  }
  
  const log = (message) => {
    // console.log(`[LinkedIn Extension] ${message}`);
  };
  
  let db = null;
  let auth = null;
  let currentUser = null;
  let shortcutsCache = [];
  let profilesData = [];
  let pTagObserver;
  let profileListObserver;
  let isProcessing = false;
  let pendingUpdate = false;
  let shouldCancelProcessing = false;
  
  // Global flag to track if the event listener is already attached
  let isProfileTriggerInitialized = false;
  function openProfileTrigger() {
    if (isProfileTriggerInitialized) {
      // console.log('openProfileTrigger already initialized, skipping...');
      return;
    }
    isProfileTriggerInitialized = true;
  
    // console.log('Initializing openProfileTrigger');
  
    // Add event listener for keyboard shortcuts
    document.addEventListener('keydown', function (e) {
      // Check if it's CMD+O (Mac) or CTRL+O (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        // console.log('CMD+O detected');
        e.preventDefault(); // Prevent default browser behavior
  
        // Find the profile link
        const profileLink = document.querySelector('a.msg-thread__link-to-profile');
  
        if (profileLink) {
          const profileUrl = profileLink.href;
          // console.log('Profile URL found:', profileUrl);
  
          // Open in new tab and focus
          const newTab = window.open(profileUrl, '_blank');
          if (newTab) {
            newTab.focus();
            // console.log('Profile opened in new tab');
          } else {
            // console.warn('Popup was blocked by the browser');
          }
        } else {
          // console.warn('Profile link not found');
        }
      }
    });
  
    // Set the flag to true after initialization
    isProfileTriggerInitialized = true;
  }
  
  
  
  let isShortcutsInitialized = false;
  
  function initializeShortcuts() {
    if (isShortcutsInitialized) {
      // console.log('Shortcuts already initialized, skipping...');
      return;
    }
  
    isShortcutsInitialized = true;
    function findAndClickOption(optionText) {
      function pollForOption() {
        const profileLink = document.querySelector('.msg-title-bar');
        const activeConversation = profileLink.querySelector('.msg-thread-actions__dropdown');
        if (activeConversation) {
          const inboxShortcuts = activeConversation.querySelector('.msg-thread-actions__dropdown-options');
  
          if (inboxShortcuts) {
            const children = inboxShortcuts.querySelector('.artdeco-dropdown__content-inner');
            const ul = children?.getElementsByTagName('ul')[0];
            if (ul) {
              const targetItem = Array.from(ul.querySelectorAll('div')).find(item =>
                item.textContent.includes(optionText)
              );
  
              if (targetItem) {
                targetItem.click();
                // console.log(`${optionText} option clicked`);
                // Reset opacity after operation is complete
                const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
                if (dropdown) {
                  dropdown.style.opacity = '1';
                }
              } else {
                // console.log(`${optionText} option not found`);
                // Reset opacity if option not found
                const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
                if (dropdown) {
                  dropdown.style.opacity = '1';
                }
              }
            } else {
              setTimeout(pollForOption, 500);
            }
          } else {
            // console.log('Inbox shortcuts not found');
            setTimeout(pollForOption, 500);
          }
        } else {
          // console.log('Active conversation not found');
          // Reset opacity if conversation not found
          const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
          if (dropdown) {
            dropdown.style.opacity = '1';
          }
        }
      }
  
      const profileLink = document.querySelector('.msg-title-bar');
      // console.log(profileLink)
      const activeConversation = profileLink.querySelector('.msg-thread-actions__dropdown');
      // console.log(activeConversation)
      if (activeConversation) {
        // console.log('Active conversation found');
        const button = activeConversation.querySelector('button.msg-thread-actions__control');
        const dropdown = activeConversation.querySelector('.msg-thread-actions__dropdown-container');
        // console.log(button);
        if (button) {
          dropdown.style.opacity = '0';
          button.click();
          // console.log('Menu button clicked');
          setTimeout(pollForOption, 500);
        }
      }
    }
  
    function handleKeyboardShortcuts(event) {
  
      if (!(event.metaKey || event.ctrlKey)) return;
  
      let optionToFind = null;
  
      switch (event.code) {
        case 'KeyA':
          if (event.shiftKey) {
            event.preventDefault();
            optionToFind = 'Archive';
          }
          break;
        case 'KeyU':
          event.preventDefault();
          optionToFind = 'Mark as unread';
          break;
        case 'KeyI':
          event.preventDefault();
          optionToFind = 'Mark as read';
          break;
        case 'KeyD':
          event.preventDefault();
          optionToFind = 'Delete conversation';
          break;
        case 'KeyM':
          event.preventDefault();
          optionToFind = 'Mute';
          if (event.shiftKey) {
            optionToFind = 'Unmute'
          }
          break;
        case 'KeyR':
          event.preventDefault();
          if (event.shiftKey) {
            optionToFind = 'Restore'
          }
          else {
            optionToFind = 'Report';
          }
          break;
        case 'KeyS':
          event.preventDefault();
          if (event.shiftKey) {
            optionToFind = 'Remove star'
          }
          else {
            optionToFind = 'Star';
          }
          break;
        case 'KeyB':
          if (event.shiftKey) {
            event.preventDefault();
            optionToFind = 'Move to Other';
          }
          break;
        case 'KeyL':
          if (event.shiftKey) {
            event.preventDefault();
            // Dispatch our custom event
            document.dispatchEvent(new CustomEvent(TOGGLE_FLOATING_PANEL_EVENT));
          }
          break;
      }
  
      if (optionToFind) {
        // console.log(`Shortcut detected for: ${optionToFind}`);
        findAndClickOption(optionToFind);
      }
    }
  
    document.addEventListener('keydown', handleKeyboardShortcuts);
    isShortcutsInitialized = true;
    // console.log('Shortcuts initialized successfully');
  }
  
  
  const TOGGLE_FLOATING_PANEL_EVENT = 'toggleFloatingPanel';
  
  // Function to set up the floating panel and event listeners
  let floatingPanel;
  
  
  function setupFloatingPanel() {
    if (floatingPanel) return floatingPanel;
  
    // Create floating panel
    floatingPanel = document.createElement('div');
    if (document.getElementById('floatingPanel')) return;
    floatingPanel.setAttribute('data-artdeco-is-focused', 'true');
    floatingPanel.className = "scaffold-layout__list-detail";
  
    // Initial setup without position
    floatingPanel.style.cssText = `
      position: fixed;
      height: auto;
      max-height: 300px;
      display: none;
      z-index: 1000;
      padding: 16px;
      font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Fira Sans', Ubuntu, Oxygen, 'Oxygen Sans', Cantarell, 'Droid Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Lucida Grande', Helvetica, Arial, sans-serif;
      transition: all 0.3s ease-in-out;
      opacity: 0;
      transform: translateY(10px);
      overflow: hidden;
      border-radius: 8px;
    `;
  
    // Inject necessary CSS styles
    // const styles = document.createElement('style');
    // styles.textContent = `
    //   .search-global-typeahead__typeahead {
    //     position: relative;
    //     width: 100%;
    //   }
  
    //   .search-global-typeahead__input {
    //     background-color: rgba(0,0,0,0.03);
    //     border: none;
    //     border-radius: 4px;
    //     font-size: 14px;
    //     height: 34px;
    //     line-height: 20px;
    //     outline: none;
    //     padding: 0 8px 0 40px;
    //     width: 100%;
    //     color: rgba(0,0,0,0.9);
    //   }
  
    //   .search-global-typeahead__input:focus {
    //     background-color: rgba(0,0,0,0.08);
    //     outline: none;
    //   }
  
    //   .search-global-typeahead__search-icon-container {
    //     align-items: center;
    //     color: rgba(0,0,0,0.6);
    //     display: flex;
    //     height: 34px;
    //     justify-content: center;
    //     left: 0;
    //     pointer-events: none;
    //     position: absolute;
    //     top: 0;
    //     width: 40px;
    //   }
  
    //   .search-global-typeahead__search-icon {
    //     color: rgba(0,0,0,0.6);
    //     height: 16px;
    //     width: 16px;
    //   }
    // `;
    // document.head.appendChild(styles);
  
    // Add click outside listener
    document.addEventListener('click', (event) => {
      if (floatingPanel.style.display === 'block' &&
        !floatingPanel.contains(event.target) &&
        !event.target.closest('.msg-form__contenteditable')) {
        hideFloatingPanel();
      }
    });
  
    // Add escape key listener
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && floatingPanel.style.display === 'block') {
        hideFloatingPanel();
      }
    });
  
    const updatePosition = () => {
      const messageBox = document.querySelector('.msg-form__contenteditable');
      if (messageBox) {
        const messageBoxRect = messageBox.getBoundingClientRect();
        floatingPanel.style.width = `${messageBoxRect.width}px`;
        floatingPanel.style.left = `${messageBoxRect.left}px`;
        floatingPanel.style.bottom = `${window.innerHeight - messageBoxRect.top + 10}px`;
      }
    };
  
    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver(updatePosition);
  
    // Set up MutationObserver to watch for messageBox
    const observer = new MutationObserver((mutations, obs) => {
      const messageBox = document.querySelector('.msg-form__contenteditable');
      if (messageBox) {
        updatePosition();
        resizeObserver.observe(messageBox);
      }
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  
    // Initial position setup if messageBox exists
    const initialMessageBox = document.querySelector('.msg-form__contenteditable');
    if (initialMessageBox) {
      updatePosition();
      resizeObserver.observe(initialMessageBox);
    }
  
    // Create search container with LinkedIn styling
    floatingPanel.innerHTML = `
      <div id="global-nav-typeahead" class="search-global-typeahead__typeahead">
        <input class="search-global-typeahead__input" 
               placeholder="Search" 
               dir="auto" 
               role="combobox" 
               aria-autocomplete="list" 
               aria-label="Search" 
               data-view-name="search-global-typeahead-input" 
               aria-activedescendant="" 
               aria-expanded="false" 
               type="text">
        <div aria-hidden="true" class="search-global-typeahead__search-icon-container">
          <svg role="none" aria-hidden="true" class="search-global-typeahead__search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <path d="M14.56 12.44L11.3 9.18a5.51 5.51 0 10-2.12 2.12l3.26 3.26a1.5 1.5 0 102.12-2.12zM3 6.5A3.5 3.5 0 116.5 10 3.5 3.5 0 013 6.5z" fill="currentColor"></path>
          </svg>
        </div>
        <div class="search-global-typeahead__overlay global-alert-offset-top"></div>
      </div>
      <ul style="height: 230px; overflow-y: auto; margin: 0; padding: 0; margin-top: 10px; list-style: none;"></ul>
    `;
  
    // Prevent clicks inside the panel from closing it
    floatingPanel.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  
    document.body.appendChild(floatingPanel);
  
    // Attach panel functionality
    const searchInput = floatingPanel.querySelector('.search-global-typeahead__input');
    const resultsContainer = floatingPanel.querySelector('ul');
    attachPanelFunctionality(searchInput, resultsContainer);
  
    return floatingPanel;
  }
  
  function attachPanelFunctionality(searchInput, resultsContainer) {
    console.log("Attaching panel functionality");
    let selectedIndex = -1;
    let filteredResults = [];
   
    function updateResults(searchTerm = '') {
      console.log("Updating results with search term:", searchTerm);
      resultsContainer.innerHTML = '';
      
      console.log("Current shortcuts cache:", shortcutsCache);
      filteredResults = shortcutsCache.filter(shortcut =>
        shortcut.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shortcut.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
   
      console.log("Filtered results:", filteredResults);
   
      filteredResults.forEach((result, index) => {
        console.log("Creating result item:", result, "Selected:", index === selectedIndex);
        const resultItem = createResultItem(result, index === selectedIndex);
        resultsContainer.appendChild(resultItem);
      });
    }
   
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      console.log("Keyboard event:", e.key);
      
      switch (e.key) {
        case 'ArrowDown':
          console.log("Arrow down - Current index:", selectedIndex);
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, filteredResults.length - 1);
          console.log("New index:", selectedIndex);
          updateResults(searchInput.value);
          if (selectedIndex >= 0) {
            console.log("Scrolling to index:", selectedIndex);
            const selectedElement = resultsContainer.children[selectedIndex];
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          break;
          
        case 'ArrowUp':
          console.log("Arrow up - Current index:", selectedIndex);
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, -1);
          console.log("New index:", selectedIndex);
          updateResults(searchInput.value);
          if (selectedIndex >= 0) {
            console.log("Scrolling to index:", selectedIndex);
            const selectedElement = resultsContainer.children[selectedIndex];
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          break;
          
        case 'Enter':
          console.log("Enter pressed - Selected index:", selectedIndex);
          if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
            console.log("Applying shortcut:", filteredResults[selectedIndex]);
            applyShortcut(filteredResults[selectedIndex]);
          }
          break;
          
        case 'Escape':
          console.log("Escape pressed - Hiding panel");
          hideFloatingPanel();
          break;
      }
    });
   
    searchInput.addEventListener('input', (e) => {
      console.log("Input event - Resetting selection");
      selectedIndex = -1;
      updateResults(e.target.value);
    });
   }
  
  function createResultItem(shortcut, isSelected = false) {
    const item = document.createElement('li');
    item.className = "msg-conversation-card__content--selectable msg-s-event-listitem__message-bubble msg-s-event-listitem__message-bubble--msg-fwd-enabled"
    const contentDiv = document.createElement('div');
  
    Object.assign(contentDiv.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      width: '100%'
    });
  
    const titleDiv = document.createElement('div');
    titleDiv.textContent = shortcut.title;
    titleDiv.className = 'msg-s-message-group__profile-link msg-s-message-group__name t-14 t-black t-bold'
  
    const previewDiv = document.createElement('div');
    previewDiv.textContent = shortcut.content.substring(0, 50) + '...';
    previewDiv.className = "t-black--light t-normal"
    Object.assign(previewDiv.style, {
      fontSize: '1.2rem',
    });
  
    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(previewDiv);
  
    Object.assign(item.style, {
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex',
      height: 'fit-content',
      alignItems: 'flex-start',
      background: isSelected && 'rgba(0, 0, 0, 0.08)'
    });
  
    item.addEventListener('click', () => {
      applyShortcut(shortcut);
    });
  
    item.appendChild(contentDiv);
    return item;
  }
  
  function applyShortcut(shortcut) {
    try {
      const messageBox = document.querySelector('.msg-form__contenteditable p');
      const messageInput = document.querySelector('.msg-form__contenteditable');
  
      if (messageBox) {
        messageBox.textContent = replaceName(shortcut.content);
  
        ['input', 'keyup', 'keydown'].forEach(eventType => {
          messageBox.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
  
        if (messageInput) {
          messageInput.focus();
  
          const range = document.createRange();
          const selection = window.getSelection();
  
          const lastChild = messageBox.lastChild || messageBox;
          range.selectNodeContents(lastChild);
          range.collapse(false);
  
          selection.removeAllRanges();
          selection.addRange(range);
  
          const shiftEnterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            shiftKey: true,
            bubbles: true,
            cancelable: true
          });
          messageInput.dispatchEvent(shiftEnterEvent);
        }
      }
  
      hideFloatingPanel();
  
    } catch (err) {
      // console.error('Failed to update message:', err);
    }
  }
  
  function showFloatingPanel(searchTerm = '') {
    const panel = setupFloatingPanel();
    const searchInput = panel.querySelector('input');
  
    panel.style.display = 'block';
    panel.offsetHeight; // Force reflow
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  
    searchInput.value = searchTerm;
    searchInput.focus();
    searchInput.dispatchEvent(new Event('input'));
  }
  
  function hideFloatingPanel() {
    if (floatingPanel) {
      floatingPanel.style.opacity = '0';
      floatingPanel.style.transform = 'translateY(10px)';
      setTimeout(() => {
        floatingPanel.style.display = 'none';
      }, 300);
    }
  }
  
  function handleInputChanges(mutations) {
    try {
      mutations.forEach(mutation => {
        // console.log(mutation)
        if (mutation.type === 'characterData') {
          const inputText = mutation.target.textContent.trim();
  
          if (inputText === '') {
            hideFloatingPanel();
            return;
          }
  
          if (inputText.startsWith('/')) {
            const command = inputText.slice(1).trim().toLowerCase();
            log('Command detected: ' + command);
            showFloatingPanel(command);
          } else {
            hideFloatingPanel();
          }
        }
      });
    } catch (err) {
      // console.error('Failed to handle input changes:', err);
    }
  }
  
  function addMessageBoxObserver(pTag) {
    if (pTag) {
      if (pTagObserver) {
        pTagObserver.disconnect();
      }
  
      pTagObserver = new MutationObserver(handleInputChanges);
      pTagObserver.observe(pTag, { characterData: true, subtree: true });
      log('Observer added to message box');
    }
  }
  
  
  // Color schemes for profile tags (needed from original code)
  const colorSchemes = [
    { bg: '#EBF5FB', textColor: '#1B4F72' },  // Light Blue & Dark Navy
    { bg: '#F9EBEA', textColor: '#943126' },  // Light Red & Dark Red
    { bg: '#E8F6F3', textColor: '#0E6251' },  // Light Teal & Dark Teal
    { bg: '#F4ECF7', textColor: '#4A235A' },  // Light Purple & Deep Purple
    { bg: '#F8F9F9', textColor: '#2C3E50' },  // Light Gray & Dark Blue Gray
    { bg: '#FDF2E9', textColor: '#A04000' },  // Light Orange & Dark Orange
    { bg: '#EAFAF1', textColor: '#196F3D' },  // Light Green & Dark Green
    { bg: '#F6DDCC', textColor: '#784212' },  // Light Brown & Dark Brown
    { bg: '#D6EAF8', textColor: '#21618C' },  // Sky Blue & Dark Blue
    { bg: '#F2D7D5', textColor: '#922B21' },  // Rose & Dark Red
    { bg: '#D4EFDF', textColor: '#196F3D' },  // Mint & Forest Green
    { bg: '#E8DAEF', textColor: '#6C3483' },  // Lavender & Royal Purple
    { bg: '#D5D8DC', textColor: '#2E4053' },  // Light Gray & Charcoal
    { bg: '#FAE5D3', textColor: '#BA4A00' },  // Peach & Rust
    { bg: '#D1F2EB', textColor: '#0B5345' }   // Aqua & Deep Green
  ];
  
  
  
  
  // Shortcuts Feature Functions
  function getName() {
    const nameElement = document.querySelector('h2.msg-entity-lockup__entity-title');
    const name = nameElement ? nameElement.textContent.trim() : "there";
    return name;
  }
  
  function replaceName(text) {
    const name = getName().split(' ')[0];
    return text.replace(/<<name>>/g, name);
  }
  
  function showShortcutsList(filteredShortcuts) {
    try {
      log('Showing shortcuts list');
  
      const existingList = document.getElementById('shortcut-list');
      if (existingList) existingList.remove();
  
  
  
      // Add Poppins font
      if (!document.querySelector('link[href*="Poppins"]')) {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
  
      const messageEditor = document.querySelector('.msg-form__message-texteditor');
      const editorWidth = messageEditor ? messageEditor.offsetWidth : 600; // 600px as fallback
      // console.log(`editor width ${editorWidth}`)
  
      const list = document.createElement('ul');
      list.id = 'shortcut-list';
      Object.assign(list.style, {
        position: 'absolute',
        backgroundColor: '#ffffff',
        padding: '8px 0',
        margin: '0',
        listStyle: 'none',
        zIndex: '9999',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        maxHeight: '300px',
        overflowY: 'auto',
        overflowX: 'hidden',
        width: `${editorWidth}`,
        fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease'
      });
  
      // Add scrollbar styles if not already added
      if (!document.getElementById('shortcuts-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'shortcuts-styles';
        styleSheet.textContent = `
          #shortcut-list::-webkit-scrollbar {
            width: 6px;
          }
          #shortcut-list::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 12px;
          }
          #shortcut-list::-webkit-scrollbar-thumb {
            background: #c7c7c7;
            border-radius: 12px;
          }
          #shortcut-list::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
        `;
        document.head.appendChild(styleSheet);
      }
  
      if (filteredShortcuts.length === 0) {
        const noCommandsItem = document.createElement('li');
        Object.assign(noCommandsItem.style, {
          padding: '12px 16px',
          color: '#666666',
          fontSize: '13px',
          borderBottom: '1px solid #eef3f8',
          fontWeight: '400'
        });
        noCommandsItem.textContent = 'No commands available';
        list.appendChild(noCommandsItem);
      } else {
        filteredShortcuts.forEach(shortcut => {
          const item = createShortcutItem(shortcut, list);
          list.appendChild(item);
        });
      }
  
      document.body.appendChild(list);
      positionShortcutsList(list);
  
    } catch (err) {
      // console.error('Failed to show shortcuts list:', err);
    }
  }
  
  function createShortcutItem(shortcut, list) {
    const item = document.createElement('li');
  
    const contentDiv = document.createElement('div');
    Object.assign(contentDiv.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      width: '100%'
    });
  
    const titleDiv = document.createElement('div');
    titleDiv.textContent = shortcut.title;
    Object.assign(titleDiv.style, {
      fontSize: '13px',
      fontWeight: '500',
      color: '#191919',
      marginBottom: '4px',
      padding: '2px 6px',
      borderRadius: '4px',
      background: '#f0f2f5',
      display: 'inline-block',
      maxWidth: '100%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    });
  
    const previewDiv = document.createElement('div');
    previewDiv.textContent = shortcut.content.substring(0, 60) + '...';
    Object.assign(previewDiv.style, {
      fontSize: '12px',
      color: '#666666',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontWeight: '400',
      letterSpacing: '0.1px'
    });
  
    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(previewDiv);
  
    Object.assign(item.style, {
      padding: '12px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #eef3f8',
      transition: 'background-color 0.15s ease',
      display: 'flex',
      alignItems: 'flex-start'
    });
  
    item.addEventListener('mouseover', () => {
      item.style.backgroundColor = '#f3f6f8';
    });
    item.addEventListener('mouseout', () => {
      item.style.backgroundColor = 'transparent';
    });
  
    item.addEventListener('click', () => {
      try {
        const messageBox = document.querySelector('.msg-form__contenteditable p');
        if (messageBox) {
          messageBox.textContent = replaceName(shortcut.content);
          ['input', 'keyup', 'keydown'].forEach(eventType => {
            messageBox.dispatchEvent(new Event(eventType, { bubbles: true }));
          });
        }
        list.remove();
      } catch (err) {
        // console.error('Failed to update message:', err);
      }
    });
  
    item.appendChild(contentDiv);
    return item;
  }
  
  function positionShortcutsList(list) {
    const messageBox = document.querySelector('.msg-form__contenteditable');
    const rect = messageBox.getBoundingClientRect();
  
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
  
    if (spaceAbove > spaceBelow) {
      list.style.top = `${window.scrollY + rect.top - list.offsetHeight - 5}px`;
    } else {
      list.style.top = `${window.scrollY + rect.bottom + 5}px`;
    }
  
    list.style.left = `${rect.left + (rect.width / 2) - (list.offsetWidth / 2)}px`;
  }
  
  
  
  // Profile Tagger Feature Functions
  function processProfilesData(profiles) {
    profilesData = [];
    Object.entries(profiles).forEach(([key, roleData], index) => {
      if (Array.isArray(roleData.profiles)) {
        roleData.profiles.forEach((profile) => {
          profilesData.push({
            name: profile.name ? profile.name.replace(/\n/g, "") : "",
            role: roleData.role ? roleData.role.replace(/\n/g, "") : "",
            bg: colorSchemes[index]?.bg || "#ffffff",
            textColor: colorSchemes[index]?.textColor || "#000000",
            profile_url: profile.profile_url ? profile.profile_url.replace(/\n/g, "") : "",
            username: profile.username ? profile.username.replace(/\n/g, "") : "",
            profile_pic_url: profile.profile_pic_url ? profile.profile_pic_url.replace(/\n/g, "") : "",
            id: profile.id ? profile.id.replace(/\n/g, "") : "",
            code: profile.code ? profile.code.replace(/\n/g, "") : ""
          });
        });
      }
    });
  
    updateProfileTags();
  }
  
  function createProfileTag(profile, profileTagId, li) {
    const profileTagContainer = document.createElement('div');
    profileTagContainer.id = profileTagId;
    profileTagContainer.style.display = 'flex';
    profileTagContainer.style.alignItems = 'center';
    profileTagContainer.classList.add('profile-tag-container');
  
    const roleSpan = document.createElement('span');
    roleSpan.textContent = profile.role;
    roleSpan.style.borderRadius = '5px';
    roleSpan.style.backgroundColor = profile.bg;
    roleSpan.style.color = profile.textColor;
    roleSpan.style.padding = '3px 5px';
    roleSpan.style.fontSize = '12px';
    roleSpan.style.marginRight = '5px';
  
    const idSpan = document.createElement('span');
    idSpan.textContent = profile.id;
    idSpan.style.marginLeft = '5px';
    idSpan.style.backgroundColor = profile.textColor;
    idSpan.style.color = profile.bg;
    idSpan.style.padding = '3px 5px';
    idSpan.style.borderRadius = '5px';
    idSpan.style.fontSize = '12px';
    idSpan.style.marginRight = '5px';
  
    const imgSpan = document.createElement('div');
    imgSpan.classList.add('id-tag');
    imgSpan.style.marginLeft = '5px';
    imgSpan.style.width = '10px';
    imgSpan.style.height = '10px';
    imgSpan.style.borderRadius = '50%';
  
    const anchorElement = li.querySelector('a.msg-conversation-listitem__link');
    const imgElement = anchorElement?.querySelector('img.presence-entity__image');
    imgSpan.style.backgroundColor = (profile.code && imgElement?.src.includes(profile.code)) ? 'green' : 'orange';
  
    profileTagContainer.appendChild(roleSpan);
    profileTagContainer.appendChild(idSpan);
    profileTagContainer.appendChild(imgSpan);
  
    return profileTagContainer;
  }
  
  let unsubscribe = null
  
  function updateProfileTags() {
    if (isProcessing) {
      pendingUpdate = true;
      shouldCancelProcessing = true;
      return;
    }
  
    isProcessing = true;
    shouldCancelProcessing = false;
  
    try {
      const mainID = document.getElementById('main');
      // const doc = document.querySelector('.scaffold-layout-container--reflow');
  
      // if (doc && mainID) {
      //   doc.style.marginLeft = '100px';
      //   mainID.style.width = '85vw';
      //   mainID.style.position = 'relative';
      //   mainID.style.zIndex = '99';
      // }
  
      const ulElement = document.querySelector('ul.msg-conversations-container__conversations-list');
  
      if (ulElement && profilesData.length > 0) {
        let liElements = Array.from(ulElement.querySelectorAll('li'));
        const batchSize = 100;
        let index = 0;
  
        function processBatch() {
          if (shouldCancelProcessing) {
            log('Processing canceled');
            isProcessing = false;
            if (pendingUpdate) {
              pendingUpdate = false;
              updateProfileTags();
            }
            return;
          }
  
          const batch = liElements.slice(index, index + batchSize);
          batch.forEach(li => {
            const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
            if (nameTag) {
              const name = nameTag.textContent.trim();
              const matchedProfile = profilesData.find(profile => profile.name === name);
              const profileTagId = 'profile-tag-' + name.replace(/\s+/g, '-');
              let existingProfileTag = document.getElementById(profileTagId);
  
              li.style.display = 'block';
  
              if (matchedProfile) {
                if (!existingProfileTag) {
                  const profileTagContainer = createProfileTag(matchedProfile, profileTagId, li);
                  const parentDiv = li.querySelector('.msg-conversation-card__content--selectable');
                  if (parentDiv) {
                    parentDiv.insertAdjacentElement('afterbegin', profileTagContainer);
                    parentDiv.style.height = '110px';
                  }
                } else {
                  existingProfileTag.style.display = 'flex';
                }
              }
            }
          });
  
          index += batchSize;
          if (index < liElements.length) {
            setTimeout(processBatch, 50);
          } else {
            isProcessing = false;
            if (pendingUpdate) {
              pendingUpdate = false;
              updateProfileTags();
            }
          }
        }
  
        processBatch();
      } else {
        handleEmptyList(ulElement);
      }
    } catch (error) {
      log('Error updating profile tags: ' + error.message);
      isProcessing = false;
    }
  }
  
  function handleEmptyList(ulElement) {
    if (ulElement) {
      ulElement.querySelectorAll('li').forEach(li => {
        li.style.display = 'block';
        const nameTag = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
        if (nameTag) {
          const name = nameTag.textContent.trim();
          const profileTagId = 'profile-tag-' + name.replace(/\s+/g, '-');
          let existingProfileTag = document.getElementById(profileTagId);
        }
      });
    }
    isProcessing = false;
  }
  
  
  function monitorMessageBox() {
    const messageBox = document.querySelector('.msg-form__contenteditable');
  
    // console.log(messageBox);
  
    if (messageBox) {
      // Initial check
      const initialPTag = messageBox.querySelector('p');
      if (initialPTag && !initialPTag.dataset.shortcutsEnabled) {
        log('Found message box initially, adding observer');
        initialPTag.dataset.shortcutsEnabled = 'true';
        addMessageBoxObserver(initialPTag);
      }
  
      // Set up observer for future changes
      const observer = new MutationObserver(() => {
        const pTag = messageBox.querySelector('p');
        // console.log(pTag);
        if (pTag && !pTag.dataset.shortcutsEnabled) {
          log('Found message box from mutation, adding observer');
          pTag.dataset.shortcutsEnabled = 'true';
          addMessageBoxObserver(pTag);
        }
      });
  
      observer.observe(messageBox, { childList: true, subtree: true });
    } else {
      log('didn\'t find message box, checking again...');
      setTimeout(monitorMessageBox, 500);
    }
  }
  
  // Data Fetching
  async function fetchShortcuts() {
    try {
      // Initialize Firestore if not already initialized
      if (!db) {
        const { db: initializedDb, currentUser } = await initializeFirebase();
        db = initializedDb;
      }
  
      // Check for authenticated user
      if (!currentUser || !currentUser.uid) {
        console.error('User is not authenticated.');
        return [];
      }
  
      // Remove any existing listener
      if (unsubscribe) {
        unsubscribe();
      }
  
      // Create a new real-time listener
      const docRef = db.collection('shortcuts').doc(currentUser.uid);
      unsubscribe = docRef.onSnapshot((doc) => {
        const shortcutsCache = [];
  
        if (doc.exists) {
          const data = doc.data();
          console.log(data.shortcuts);
          
          if (data.shortcuts) {
            // Include the unique key in each shortcut
            Object.entries(data.shortcuts).forEach(([key, shortcut]) => {
              shortcutsCache.push({
                id: key,  // Include the unique key
                title: shortcut.title,
                content: shortcut.content
              });
            });
          }
        }
  
        console.log(shortcutsCache);
        // Log results
        if (shortcutsCache.length > 0) {
          console.log(`Shortcuts loaded for user ${currentUser.uid}:`, shortcutsCache.length);
        } else {
          console.log(`No shortcuts found for user ${currentUser.uid}.`);
        }
  
        // Call the callback with updated data
        if (typeof onShortcutsUpdate === 'function') {
          onShortcutsUpdate(shortcutsCache);
        }
      }, (error) => {
        console.error('Error fetching shortcuts:', error);
      });
  
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
      return [];
    }
  }
  
  // Function to clean up listener when needed
  function cleanup() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }
  
  // Usage example:
  let onShortcutsUpdate = (shortcuts) => {
    // Handle the updated shortcuts here
    shortcutsCache = shortcuts
    console.log('Shortcuts updated:', shortcuts);
  };
  async function initializeProfilesListener() {
    try {
      // Initialize Firestore if not already initialized
      if (!db) {
        const { db: initializedDb } = await initializeFirebase(); // Ensure this function returns `db`
        db = initializedDb;
      }
  
      // Reference the `roles` collection
      const profilesRef = db.collection('roles');
  
      // Set up a real-time listener
      profilesRef.onSnapshot((snapshot) => {
        const profiles = {};
  
        // Iterate through documents in the snapshot
        snapshot.forEach(doc => {
          profiles[doc.id] = doc.data();
        });
  
        // Process the profiles data
        processProfilesData(profiles);
      });
  
      console.log('Profiles listener initialized.');
    } catch (error) {
      console.error('Failed to initialize profiles listener:', error);
    }
  }
  
  // Event Listeners
  function setupEventListeners() {
    document.addEventListener('click', (event) => {
      const list = document.getElementById('shortcut-list');
      if (list && !list.contains(event.target)) {
        list.remove();
      }
    });
  
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const list = document.getElementById('shortcut-list');
        if (list) list.remove();
      }
    });
  }
  
  // Initialization
  async function init() {
    // log('Initializing combined extension...');
    try {
  
  
      //
      await fetchShortcuts();
    
      monitorMessageBox();
      setupEventListeners();
  
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }
  
  
  
  let isNavigationInitialized = false;
  let currentActiveIndex = -1;
  
  function initializeConversationNavigation() {
    if (isNavigationInitialized) {
      // console.log('Navigation already initialized');
      return;
    }
  
    function handleConversationNavigation(e) {
      // Only handle Cmd/Ctrl + up/down arrows
      if (!((e.metaKey || e.ctrlKey) && !e.shiftKey) || (e.code !== 'ArrowDown' && e.code !== 'ArrowUp')) {
        return;
      }
  
      e.preventDefault(); // Prevent page scrolling
  
      // Get the conversations list
      const conversationsList = document.querySelector('.msg-conversations-container__conversations-list');
      if (!conversationsList) {
        // console.log('Conversations list not found');
        return;
      }
  
      // Get all conversation items
      const conversations = Array.from(conversationsList.getElementsByTagName('li'));
      if (!conversations.length) {
        // console.log('No conversations found');
        return;
      }
  
      // Find current active conversation if we don't have it
      if (currentActiveIndex === -1) {
        currentActiveIndex = conversations.findIndex(li =>
          li.querySelector('.msg-conversation-listitem__active-text.visually-hidden')
        );
  
        // If still no active conversation found, start from the beginning
        if (currentActiveIndex === -1) {
          currentActiveIndex = 0;
        }
      }
  
      // Calculate new index based on arrow key
      let newIndex;
      if (e.code === 'ArrowDown') {
        newIndex = currentActiveIndex + 1;
        if (newIndex >= conversations.length) {
          newIndex = 0; // Wrap to start
        }
      } else { // ArrowUp
        newIndex = currentActiveIndex - 1;
        if (newIndex < 0) {
          newIndex = conversations.length - 1; // Wrap to end
        }
      }
  
      // Find and click the selectable content element
      const selectableContent = conversations[newIndex].querySelector('.msg-conversation-card__content--selectable');
      if (selectableContent) {
        selectableContent.click();
        currentActiveIndex = newIndex;
        // console.log(`Navigated to conversation ${newIndex + 1} of ${conversations.length}`);
      } else {
        // console.log('Selectable content not found in conversation');
      }
    }
  
    // Handle manual clicks to update the active index
    function handleManualClick(e) {
      const conversationsList = document.querySelector('.msg-conversations-container__conversations-list');
      if (!conversationsList) return;
  
      const clickedLi = e.target.closest('li');
      if (clickedLi && conversationsList.contains(clickedLi)) {
        const conversations = Array.from(conversationsList.getElementsByTagName('li'));
        currentActiveIndex = conversations.indexOf(clickedLi);
        // console.log(`Manually selected conversation ${currentActiveIndex + 1}`);
      }
    }
  
    // Add event listeners
    document.addEventListener('keydown', handleConversationNavigation);
    document.addEventListener('click', handleManualClick);
  
    isNavigationInitialized = true;
    // console.log('Conversation navigation initialized');
  }
  let isInputShortcutInitialized = false;
  
  function initializeMessageInputShortcut() {
    if (isInputShortcutInitialized) {
      // console.log('Message input shortcut already initialized');
      return;
    }
  
    function handleMessageInput(e) {
      // Check for Cmd/Ctrl + R
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isMessageInput = activeElement?.classList.contains('msg-form__contenteditable');
        const isInputField = activeElement?.tagName?.toLowerCase() === 'input';
  
        if (!isMessageInput && !isInputField) {
          e.preventDefault();
          const messageInput = document.querySelector('.msg-form__contenteditable');
          if (messageInput) {
            messageInput.focus();
  
            // Create a range to set cursor at the end
            const range = document.createRange();
            const selection = window.getSelection();
  
            // If there's a paragraph element, select its last text node
            const paragraph = messageInput.querySelector('p');
            if (paragraph) {
              const lastChild = paragraph.lastChild || paragraph;
              range.selectNodeContents(lastChild);
              range.collapse(false); // false means collapse to end
            } else {
              // If no paragraph, select the input itself
              range.selectNodeContents(messageInput);
              range.collapse(false);
            }
  
            // Apply the selection
            selection.removeAllRanges();
            selection.addRange(range);
  
            // console.log('Message input focused with cursor at end');
          } else {
            // console.log('Message input not found');
          }
        }
      }
    }
  
    document.addEventListener('keydown', handleMessageInput);
    isInputShortcutInitialized = true;
    // console.log('Message input shortcut initialized');
  }
  
  
  
  
  
  function setupLabelManager() {
    if (document.getElementById('labelManager')) return;
  
    let currentFocusIndex = -1;
  
    function generateRandomColor() {
      const colors = [
        '#0A66C2', '#057642', '#B24020', '#7A3E98',
        '#0084BD', '#E7A33E', '#DD5143', '#598527',
        '#8C6A4E', '#5E6D77', '#2557A7', '#C74634',
        '#0E8A7D', '#6E4B9E', '#9E6B52', '#4C8C40',
        '#A85C32', '#4A6484', '#8E562E', '#6B8068',
        '#A13F3F', '#458B74', '#7D6544', '#366DA0'
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }
  
    function showToast(message, type = 'info') {
      const existingToast = document.querySelector('.label-toast');
      if (existingToast) existingToast.remove();
  
      const toast = document.createElement('div');
      toast.className = 'label-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${type === 'error' ? '#FEE2E2' : '#EFF6FF'};
        color: ${type === 'error' ? '#991B1B' : '#1E40AF'};
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.style.opacity = '1');
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  
    const labelManager = document.createElement('div');
    labelManager.id = 'labelManager';
    labelManager.className = 'scaffold-layout__list-detail';
    labelManager.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 380px;
    border-radius: 8px;
    display: none;
    z-index: 1000;
    height: fit-content;
    font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto;
  `;
  
    const header = document.createElement('div');
    header.className = 'pl4 pr1';
    header.style.cssText = `
    padding: 16px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
    const title = document.createElement('h2');
    title.textContent = 'Manage labels';
    title.className = 't-16 t-black t-bold';
    title.style.cssText = `
    margin: 0;
    line-height: 28px;
  `;
  
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-supported-dps="24x24" fill="currentColor" width="24" height="24">
      <path d="M13.42 12L20 18.58 18.58 20 12 13.42 5.42 20 4 18.58 10.58 12 4 5.42 5.42 4 12 10.58 18.58 4 20 5.42z"></path>
    </svg>
  `;
    closeBtn.className = 'artdeco-modal__dismiss';
    closeBtn.style.cssText = `
    background: transparent;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }
  `;
  
    const content = document.createElement('div');
    content.style.cssText = `
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  `;
    const mainSearchContainer = document.createElement('div');
    mainSearchContainer.style.display = 'flex';
    mainSearchContainer.style.justifyContent = 'space-around';
    mainSearchContainer.style.gap = '10px';
    const searchContainer = document.createElement('div');
    searchContainer.style.flexGrow = '1'
    searchContainer.innerHTML = `
      <div id="global-nav-typeahead" class="search-global-typeahead__typeahead">
        <input class="search-global-typeahead__input" 
               placeholder="Search or create new label" 
               dir="auto" 
               role="combobox" 
               aria-autocomplete="list" 
               type="text">
        <div aria-hidden="true" class="search-global-typeahead__search-icon-container">
          <svg role="none" aria-hidden="true" class="search-global-typeahead__search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
            <path d="M14.56 12.44L11.3 9.18a5.51 5.51 0 10-2.12 2.12l3.26 3.26a1.5 1.5 0 102.12-2.12zM3 6.5A3.5 3.5 0 116.5 10 3.5 3.5 0 013 6.5z" fill="currentColor"></path>
          </svg>
        </div>
        <div class="search-global-typeahead__overlay global-alert-offset-top"></div>
      </div>
    `;
  
    const searchInput = searchContainer.querySelector('.search-global-typeahead__input');
  
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add';
    addBtn.className = 'msg-form__send-button artdeco-button artdeco-button--1';
  
    const labelsContainer = document.createElement('div');
    labelsContainer.style.cssText = `
    max-height: 320px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;
  
    const label = document.createElement('span');
    label.className = 't-12 break-words block t-black--light t-normal global-nav__primary-link-text';
  
    const shortcutInfo = document.createElement('div');
    shortcutInfo.className = 'msg-s-message-group__timestamp t-12 t-black--light t-normal';
    shortcutInfo.style.cssText = `
    padding: 12px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  `;
    shortcutInfo.textContent = 'Keyboard shortcuts: ↑↓ navigate • Enter select • Delete remove • Esc close';
  
    function handleClose() {
      labelManager.style.display = 'none';
      currentFocusIndex = -1;
    }
  
    async function handleLabelSelect(labelName) {
      // Ensure labelName is provided
      if (!labelName) {
        showToast('Label name is required', 'error');
        return;
      }
    
      const profileInfo = getProfileInfo();
      const profileImage = getProfileImage();
    
      if (!profileInfo || !profileImage) {
        showToast('Could not find profile information', 'error');
        return;
      }
    
      const { name, url } = profileInfo;
    
      try {
        // Initialize Firestore if not already initialized
        if (!db) {
          const { db: initializedDb, currentUser } = await initializeFirebase(); // Ensure this function returns `db` and `currentUser`
          db = initializedDb;
        }
    
        // Reference to the current user's labels document
        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
    
        // Fetch the current user's labels document
        const userLabelsDoc = await userLabelsRef.get();
        const labelsData = userLabelsDoc.exists ? userLabelsDoc.data().labels || {} : {};
    
        // Generate a unique ID for the new code entry
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
        // Generate a new code object
        const newCode = {
          name,
          url,
          code: profileImage,
          updatedAt: new Date().toISOString(),
        };
    
        // Check if the label already exists
        if (!labelsData[labelName]) {
          // Create the label and add the new code as an object with unique ID
          labelsData[labelName] = {
            codes: { [uniqueId]: newCode }, // Initialize codes as an object with unique ID as key
          };
        } else {
          // Add the new code to the existing codes object
          const existingCodes = labelsData[labelName].codes || {};
          labelsData[labelName].codes = {
            ...existingCodes,
            [uniqueId]: newCode, // Add the new code with the unique ID
          };
        }
    
        // Update the Firestore document
        await userLabelsRef.set({ labels: labelsData }, { merge: true });
    
        showToast(`Added ${name} to ${labelName}`);
        handleClose();
      } catch (error) {
        showToast('Error adding profile to label', 'error');
        console.error('Error adding profile to label:', error);
      }
    }
  
    function createLabelItem(labelName, color, index) {
      const item = document.createElement('div');
      item.setAttribute('tabindex', '0');
      item.setAttribute('data-index', index);
      item.setAttribute('role', 'button');
      item.style.cssText = `
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 4px;
        cursor: pointer;
        background: transparent;
        justify-content: space-between;
        transition: background-color 0.15s;
        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
      `;
  
      const checkboxcontainer = document.createElement('div');
      checkboxcontainer.style.cssText = `
        display: flex;
        gap: 10px;
      `;
      const checkbox = document.createElement('div');
      checkbox.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid ${color};
        border-radius: 4px;
        margin-right: 12px;
        position: relative;
      `;
  
      const text = document.createElement('span');
      text.textContent = labelName;
      text.className = "t-14 t-black--light t-normal";
  
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'artdeco-button artdeco-button--circle artdeco-button--muted artdeco-button--1';
      deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" data-supported-dps="16x16" fill="currentColor" width="16" height="16">
          <path d="M14 3.41L9.41 8 14 12.59 12.59 14 8 9.41 3.41 14 2 12.59 6.59 8 2 3.41 3.41 2 8 6.59 12.59 2z"></path>
        </svg>
      `;
      deleteBtn.style.opacity = '0';
  
      checkboxcontainer.appendChild(checkbox);
      checkboxcontainer.appendChild(text);
      item.appendChild(checkboxcontainer);
      // item.appendChild(text);
      item.appendChild(deleteBtn);
  
      item.addEventListener('mouseenter', () => {
        deleteBtn.style.opacity = '1';
      });
  
      item.addEventListener('mouseleave', () => {
        if (!deleteBtn.matches(':focus')) {
          deleteBtn.style.opacity = '0';
        }
      });
  
      item.addEventListener('focus', () => {
        item.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        deleteBtn.style.opacity = '1';
        currentFocusIndex = parseInt(item.getAttribute('data-index'));
      });
  
      item.addEventListener('blur', () => {
        if (!item.contains(document.activeElement)) {
          item.style.backgroundColor = 'transparent';
          deleteBtn.style.opacity = '0';
        }
      });
  
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteLabel(labelName);
      };
  
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleLabelSelect(labelName);
        }
      });
  
      item.addEventListener('click', () => {
        handleLabelSelect(labelName);
      });
  
      return item;
    }
  
  // Delete a label
  async function deleteLabel(labelName) {
    try {
      if (!db) {
        const { db: initializedDb, currentUser } = await initializeFirebase();
        db = initializedDb;
      }
  
      const userLabelsRef = db.collection('labels').doc(currentUser.uid);
  
      // Fetch the current labels
      const userLabelsDoc = await userLabelsRef.get();
  
      if (!userLabelsDoc.exists) {
        showToast(`Label "${labelName}" does not exist`, 'error');
        return;
      }
  
      const labels = userLabelsDoc.data().labels || {};
      delete labels[labelName]; // Remove the label
  
      // Update the labels field in Firestore
      await userLabelsRef.update({ labels });
  
      showToast(`Label "${labelName}" deleted`);
      await loadLabels(searchInput.value);
    } catch (error) {
      showToast('Error deleting label', 'error');
      console.error('Error deleting label:', error);
    }
  }
  
  // Check if a label exists
  async function labelExists(labelName) {
    try {
      if (!db) {
        const { db: initializedDb, currentUser } = await initializeFirebase();
        db = initializedDb;
      }
  
      const userLabelsRef = db.collection('labels').doc(currentUser.uid);
      const userLabelsDoc = await userLabelsRef.get();
  
      if (!userLabelsDoc.exists) {
        return false;
      }
  
      const labels = userLabelsDoc.data().labels || {};
      return labels.hasOwnProperty(labelName.toLowerCase());
    } catch (error) {
      console.error('Error checking label existence:', error);
      return false;
    }
  }
  
  // Add a new label
  async function addNewLabel(labelName) {
    try {
      const exists = await labelExists(labelName);
      if (exists) {
        showToast(`Label "${labelName}" already exists`, 'error');
        return;
      }
  
      if (!db) {
        const { db: initializedDb, currentUser } = await initializeFirebase();
        db = initializedDb;
      }
  
      const userLabelsRef = db.collection('labels').doc(currentUser.uid);
  
      // Fetch the current labels and add the new one
      const userLabelsDoc = await userLabelsRef.get();
      const labels = userLabelsDoc.exists ? userLabelsDoc.data().labels || {} : {};
  
      labels[labelName] = {
        color: generateRandomColor(),
        createdAt: new Date().toISOString(),
      };
  
      // Update Firestore
      await userLabelsRef.set({ labels }, { merge: true });
  
      showToast(`Label "${labelName}" added`);
      searchInput.value = '';
      await loadLabels();
    } catch (error) {
      showToast('Error adding label', 'error');
      console.error('Error adding label:', error);
    }
  }
  
  // Load all labels
  async function loadLabels(searchTerm = '') {
    try {
      if (!db) {
        const { db: initializedDb, currentUser } = await initializeFirebase();
        db = initializedDb;
      }
  
      const userLabelsRef = db.collection('labels').doc(currentUser.uid);
      const userLabelsDoc = await userLabelsRef.get();
  
      labelsContainer.innerHTML = '';
      if (!userLabelsDoc.exists) {
        console.log('No labels found.');
        return;
      }
  
      const labels = userLabelsDoc.data().labels || {};
  
      // Filter and display labels
      Object.entries(labels)
        .filter(([name]) =>
          !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .forEach(([name, data], index) => {
          const item = createLabelItem(name, data.color, index);
          labelsContainer.appendChild(item);
        });
  
      // Handle focus for navigation
      if (currentFocusIndex >= 0) {
        const items = labelsContainer.children;
        if (items.length > currentFocusIndex) {
          items[currentFocusIndex].focus();
        } else if (items.length > 0) {
          items[items.length - 1].focus();
        }
      }
    } catch (error) {
      showToast('Error loading labels', 'error');
      console.error('Error loading labels:', error);
    }
  }
  
    function handleKeyboardNavigation(e) {
      const items = Array.from(labelsContainer.children);
  
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }
  
      if (!items.length) return;
  
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (document.activeElement === searchInput) {
          currentFocusIndex = 0;
          items[currentFocusIndex].focus();
        } else {
          currentFocusIndex = (currentFocusIndex + 1) % items.length;
          items[currentFocusIndex].focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentFocusIndex === 0 || currentFocusIndex === -1) {
          searchInput.focus();
          currentFocusIndex = -1;
        } else {
          currentFocusIndex = (currentFocusIndex - 1 + items.length) % items.length;
          items[currentFocusIndex].focus();
        }
      } else if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === searchInput) {
          e.preventDefault();
          closeBtn.focus();
        }
      }
    }
  
    function getProfileInfo() {
      const detailContainer = document.querySelector('.scaffold-layout__detail');
      if (!detailContainer) return null;
  
      const profileLink = detailContainer.querySelector('.msg-thread__link-to-profile');
      if (!profileLink) return null;
  
      const name = profileLink.querySelector('h2')?.textContent?.trim();
      const url = profileLink.href;
  
      return { name, url };
    }
  
    function getProfileImage() {
      const activeConvo = document.querySelector('.msg-conversations-container__convo-item-link--active');
      if (!activeConvo) return null;
  
      const img = activeConvo.querySelector('img');
      return img?.src || null;
    }
  
    // Event Listeners
    searchInput.addEventListener('input', (e) => {
      loadLabels(e.target.value);
    });
  
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        addNewLabel(searchInput.value.trim());
      } else if (e.key === 'Tab' && !e.shiftKey) {
        if (labelsContainer.children.length > 0) {
          e.preventDefault();
          currentFocusIndex = 0;
          labelsContainer.children[0].focus();
        }
      }
    });
  
    addBtn.addEventListener('click', () => {
      if (searchInput.value.trim()) {
        addNewLabel(searchInput.value.trim());
      }
    });
  
    addBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (searchInput.value.trim()) {
          addNewLabel(searchInput.value.trim());
        }
      }
    });
  
    closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleClose();
      }
    });
  
    closeBtn.addEventListener('click', handleClose);
  
    // Global keyboard handlers
    labelManager.addEventListener('keydown', handleKeyboardNavigation);
  
    // Trap focus within the modal
    labelManager.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusableElements = labelManager.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
  
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });
  
    // Global shortcut handler
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isMessageInput = activeElement?.classList.contains('msg-form__contenteditable');
  
        if (!isMessageInput && !activeElement?.tagName?.toLowerCase() === 'input') {
          e.preventDefault();
          if (labelManager.style.display === 'none') {
            labelManager.style.display = 'block';
            loadLabels();
            searchInput.focus();
          } else {
            handleClose();
          }
        }
      }
    });
  
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (labelManager.style.display === 'block' && !labelManager.contains(e.target)) {
        handleClose();
      }
    });
  
    // Assemble the modal
    header.appendChild(title);
    header.appendChild(closeBtn);
  
    searchContainer.appendChild(searchInput);
    mainSearchContainer.appendChild(searchContainer);
    mainSearchContainer.appendChild(addBtn)
    content.appendChild(mainSearchContainer);
    content.appendChild(labelsContainer);
    labelManager.appendChild(header);
    labelManager.appendChild(content);
    labelManager.appendChild(shortcutInfo);
    document.body.appendChild(labelManager);
  
    // Initialize button click handler
    const labelButton = document.querySelector('#linkedin-label-btn');
    if (labelButton) {
      labelButton.addEventListener('click', () => {
        labelManager.style.display = 'block';
        loadLabels();
        searchInput.focus();
      });
    }
  
    return {
      show: () => {
        // console.log('Showing label manager');
        labelManager.style.display = 'block';
        loadLabels();
        searchInput.focus();
      },
      hide: handleClose,
      refresh: () => loadLabels()
    };
  }
  
  function initializeLabelSystem() {
    let labelManagerInstance = null;
  
  
    // Set up keyboard shortcut handler
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isMessageInput = activeElement?.classList.contains('msg-form__contenteditable');
        const isInputField = activeElement?.tagName?.toLowerCase() === 'input';
  
        if (!isMessageInput && !isInputField) {
          e.preventDefault();
          if (!labelManagerInstance) {
            labelManagerInstance = setupLabelManager();
          }
          labelManagerInstance.show();
        }
      }
    });
  
  
    // Return the API
    return {
      show: () => {
        if (!labelManagerInstance) {
          labelManagerInstance = setupLabelManager();
        }
        labelManagerInstance.show();
      },
      hide: () => {
        if (labelManagerInstance) {
          labelManagerInstance.hide();
        }
      },
      refresh: () => {
        if (labelManagerInstance) {
          labelManagerInstance.refresh();
        }
      }
    };
  }
  
  function setupConversationLabelsObserver() {
    let currentObserver = null;
    let labelCache = {};
  
  
    async function removeLabelFromPerson(labelName, codeId, labelElement) {
      console.log(labelName);
      console.log(codeId);
      console.log(labelElement)
      try {
        // Ensure Firestore is initialized
        if (!db) {
          const { db: initializedDb, currentUser } = await initializeFirebase();
          db = initializedDb;
        }
    
        // Reference the user's labels document
        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
        const userLabelsDoc = await userLabelsRef.get();
    
        if (!userLabelsDoc.exists) {
          showToast('Label does not exist', 'error');
          return;
        }
    
        // Fetch the current labels
        const labels = userLabelsDoc.data().labels || {};
    
        // Remove the specified code from the label
        if (labels[labelName] && labels[labelName].codes && labels[labelName].codes[codeId]) {
          delete labels[labelName].codes[codeId];
    
          // If no more codes in the label, delete the label entirely
         
    
          // Update the labels in Firestore
          await userLabelsRef.update({ labels });
        } else {
          showToast('Code or label not found', 'error');
          return;
        }
    
        // Immediate UI update using the specific element that was clicked
        if (labelElement) {
          const labelsContainer = labelElement.parentElement;
          labelElement.remove();
    
          // If no more labels, remove container and reset height
          if (labelsContainer && labelsContainer.children.length === 0) {
            const card = labelsContainer.closest('.msg-conversation-card__content--selectable');
            if (card) {
              card.style.height = '';
            }
            labelsContainer.remove();
          }
        }
    
        // Update `labelCache`
        for (const [key, value] of Object.entries(labelCache)) {
          const newLabels = value.labels.filter(label => !(label.name === labelName && label.codeId === codeId));
          if (newLabels.length !== value.labels.length) {
            if (newLabels.length === 0) {
              delete labelCache[key];
            } else {
              labelCache[key] = { ...value, labels: newLabels };
            }
          }
        }
    
        showToast('Label removed');
      } catch (error) {
        console.error('Error removing label:', error);
        showToast('Error removing label', 'error');
      }
    }
  
    function showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 16px;
        background: ${type === 'error' ? '#FEE2E2' : '#EFF6FF'};
        color: ${type === 'error' ? '#991B1B' : '#1E40AF'};
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 9999;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  
    function createLabelTag(labelData, profileUrl) {
      const container = document.createElement('div');
      container.setAttribute('data-label-name', labelData.name);
      container.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 2px 6px;
        margin: 1px;
        border-radius: 3px;
        background-color: ${labelData.color}E6;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        position: relative;
        transition: padding-right 0.2s ease;
      `;
  
      const text = document.createElement('span');
      text.textContent = labelData.name;
      text.style.cssText = `
        color: white;
        font-size: 9px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        line-height: 1.1;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
  
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.style.cssText = `
        display: none;
        align-items: center;
        justify-content: center;
        width: 12px;
        height: 12px;
        padding: 0;
        margin-left: 4px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 10px;
        line-height: 1;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `;
  
      // Hover effect
      container.addEventListener('mouseenter', () => {
        container.style.paddingRight = '6px';
        deleteBtn.style.display = 'flex';
        setTimeout(() => deleteBtn.style.opacity = '1', 0);
      });
  
      container.addEventListener('mouseleave', () => {
        deleteBtn.style.opacity = '0';
        setTimeout(() => {
          deleteBtn.style.display = 'none';
          container.style.paddingRight = '6px';
        }, 200);
      });
  
      // Delete handler
      deleteBtn.addEventListener('click', async (e) => {
  
        e.stopPropagation();
        // console.log('delete button clicked')
        // if (profileUrl === labelData.profileUrl) {
        await removeLabelFromPerson(labelData.name, labelData.codeId, container);
        // }
      });
  
      container.appendChild(text);
      container.appendChild(deleteBtn);
      return container;
    }
  
    function handleLabelsUpdate(li, labelData) {
      const namesContainer = li.querySelector('.msg-conversation-listitem__participant-names');
      if (!namesContainer) {
        return;
      }
    
      let labelsContainer = li.querySelector('[id^="label-container-"]');
      if (!labelsContainer && labelData) {
        labelsContainer = document.createElement('div');
        labelsContainer.id = `label-container-${labelData.code.replace(/[^a-zA-Z0-9]/g, '-')}`;
        labelsContainer.style.cssText = `
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          margin-top: 4px;
        `;
        namesContainer.appendChild(labelsContainer);
      }
    
      if (labelsContainer) {
        const existingLabels = new Set(
          Array.from(labelsContainer.querySelectorAll('[data-label-key]'))
            .map(el => el.getAttribute('data-label-key'))
        );
    
        if (labelData) {
          labelData.labels.forEach(label => {
            if (!existingLabels.has(label.key)) {
              const labelTag = createLabelTag(label, labelData.url);
              labelTag.setAttribute('data-label-key', label.key); // Use the unique key
              labelsContainer.appendChild(labelTag);
            }
            existingLabels.delete(label.key); // Remove from existing labels to avoid duplicates
          });
    
          // Remove labels that are no longer valid
          existingLabels.forEach(labelKey => {
            const labelElement = labelsContainer.querySelector(`[data-label-key="${labelKey}"]`);
            if (labelElement) {
              labelElement.remove();
            }
          });
        }
      }
    
      const card = li.querySelector('.msg-conversation-card__content--selectable');
      if (card) {
        if (labelsContainer?.children.length > 0) {
          card.style.height = '105px';
        } else {
          card.style.height = '';
        }
      }
    }
  
  
    function processConversationItem(li) {
      const img = li.querySelector('img.presence-entity__image');
      const nameSpan = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
  
      if (!img?.src || !nameSpan) {
        // console.log('Missing image or name element:', { hasImg: !!img, hasSrc: !!img?.src, hasNameSpan: !!nameSpan });
        return;
      }
  
      const name = nameSpan.textContent.trim();
  
      function extractMediaCode(url) {
        if (url.startsWith('data:image')) {
          return url;
        }
        const match = url.match(/\/v2\/([^/]+)\//);
        return match ? match[1] : null;
      }
  
      const imgSrc = img.src;
      let uniqueKey;
      let labelData;
  
      // console.log('Label Cache:', labelCache);
  
      // if (imgSrc.startsWith('data:image')) {
      //   // For data URLs, use the full URL as the key
      //   uniqueKey = `${imgSrc}|${name.toLowerCase()}`;
      //   labelData = labelCache[uniqueKey];
      // } else {
        // For LinkedIn media URLs, use the extracted code
        const mediaCode = extractMediaCode(imgSrc);
  
        if (mediaCode) {
          labelData = {
            codeName: name,
            code: imgSrc,
            url: null,
            labels: [] // Initialize an empty array for labels
          };
        
          // Search through labelCache for matching mediaCode and collect all labels
          Object.entries(labelCache).forEach(([key, value]) => {
            if (
              value.code &&
              extractMediaCode(value.code) === mediaCode &&
              value.codeName.toLowerCase() === name.toLowerCase()
            ) {
              labelData.url = value.url; // Assign URL (assuming it remains consistent for the same mediaCode)
        
              value.labels.forEach(label => {
                // Add each label as a separate entry, ensuring no duplicates
                if (!labelData.labels.some(l => l.name === label.name)) {
                  labelData.labels.push({
                    ...label, // Copy label details (name, color, etc.)
                    key // Include the unique key
                  });
                }
              });
            }
          });
        }
  
      console.log(labelCache)
      handleLabelsUpdate(li, labelData);
    }
  
    function cleanupDeletedLabels(newLabelCache) {
      // console.log('Starting cleanup of deleted labels');
      const list = document.querySelector('ul.msg-conversations-container__conversations-list');
      if (!list) {
        // console.log('No list found for cleanup');
        return;
      }
  
      function extractMediaCode(url) {
        if (url.startsWith('data:image')) {
          return url;
        }
        const match = url.match(/\/v2\/([^/]+)\//);
        return match ? match[1] : null;
      }
  
      list.querySelectorAll('li').forEach(li => {
        const img = li.querySelector('img.presence-entity__image');
        const nameSpan = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
  
        if (img?.src && nameSpan) {
          const name = nameSpan.textContent.trim();
          const imgSrc = img.src;
          let shouldCleanup = true;
  
          if (imgSrc.startsWith('data:image')) {
            // For data URLs, use direct key comparison
            const uniqueKey = `${imgSrc}|${name.toLowerCase()}`;
            shouldCleanup = !newLabelCache[uniqueKey];
          } else {
            // For LinkedIn media URLs, compare the extracted codes
            const mediaCode = extractMediaCode(imgSrc);
            if (mediaCode) {
              // Check if any entry in newLabelCache matches this media code and name
              shouldCleanup = !Object.values(newLabelCache).some(value =>
                value.code &&
                extractMediaCode(value.code) === mediaCode &&
                value.codeName.toLowerCase() === name.toLowerCase()
              );
            }
          }
  
          // console.log('Cleanup check:', {
          //   name,
          //   imgSrc,
          //   shouldCleanup,
          //   isDataUrl: imgSrc.startsWith('data:image')
          // });
  
          if (shouldCleanup) {
            // console.log('Cleaning up labels for:', name);
            handleLabelsUpdate(li, null);
          }
        }
      });
  
      // console.log('Cleanup complete');
    }
  
    async function initialize() {
      // Prevent re-initialization if already observing
      if (currentObserver) {
        return;
      }
    
      // Function to handle the list when it appears
      async function handleListFound(list) {
        labelCache = await fetchLabelsData();
        console.log(labelCache)
    
        const items = list.querySelectorAll('li');
        items.forEach((item) => {
          processConversationItem(item);
        });
      }
    
      // Function to observe the messaging container for the list
      function observeMessagingContainer() {
        const container = document.querySelector('.msg-conversations-container__conversations-list');
    
        if (!container) {
          setTimeout(observeMessagingContainer, 500);
          return;
        }
    
        currentObserver = new MutationObserver(async (mutations) => {
          for (const mutation of mutations) {
            const addedList = Array.from(mutation.addedNodes).find(node =>
              node.classList?.contains('msg-conversations-container__conversations-list')
            );
    
            if (addedList) {
              await handleListFound(addedList);
            }
    
            const existingList = container.querySelector('.msg-conversations-container__conversations-list');
            if (
              existingList &&
              (mutation.target === existingList || mutation.target.closest('.msg-conversations-container__conversations-list'))
            ) {
              const items = existingList.querySelectorAll('li');
              items.forEach(processConversationItem);
            }
          }
        });
    
        // Start observing the container
        currentObserver.observe(container, {
          childList: true,
          subtree: true,
          attributes: false,
        });
    
        // Check if the list already exists and process it
        const existingList = container.querySelector('.msg-conversations-container__conversations-list');
        if (existingList) {
          handleListFound(existingList);
        }
      }
    
      // Start observing the messaging container
      observeMessagingContainer();
    
      // Set up Firestore listener for labels
      if (!db) {
        const { db: initializedDb, currentUser } = await initializeFirebase();
        db = initializedDb;
      }
    
      const userLabelsRef = db.collection('labels').doc(currentUser.uid);
      const unsubscribe = userLabelsRef.onSnapshot(async (doc) => {
        if (!doc.exists) {
          console.log('No labels found for user.');
          return;
        }
    
        const newLabelCache = await fetchLabelsData();
    
        const list = document.querySelector('.msg-conversations-container__conversations-list');
        if (list) {
          cleanupDeletedLabels(newLabelCache);
    
          const oldCacheSize = Object.keys(labelCache).length;
          labelCache = newLabelCache;
    
          const items = list.querySelectorAll('li');
          items.forEach(processConversationItem);
        }
      });
    
      return {
        stop: () => {
          if (currentObserver) {
            currentObserver.disconnect();
            currentObserver = null;
          }
          unsubscribe(); // Stop Firestore listener
        },
      };
    }
  
    return {
      start: initialize,
      stop: () => {
        if (currentObserver) {
          currentObserver.disconnect();
          currentObserver = null;
        }
        db.ref('labels').off();
      }
    };
  }
  
  // Single instance setup
  let observerInstance = null;
  
  function initializeLabelObserver() {
    if (!observerInstance) {
      observerInstance = setupConversationLabelsObserver();
      observerInstance.start();
    }
  }
  
  function waitForTitleRow() {
    return new Promise((resolve) => {
      function checkForElement() {
        const titleRow = document.querySelector('.msg-conversations-container__title-row');
        if (titleRow) {
          resolve();
        } else {
          setTimeout(checkForElement, 500); // Check every 500ms
        }
      }
      checkForElement();
    });
  }
  const allowedLabels = [];
  async function checkLabelMatch(imgSrc, name, allowedLabels) {
    // Early returns for edge cases
    if (!allowedLabels?.length || !imgSrc || !name) {
      return true;
    }
  
    try {
      // Helper function to extract media code from the URL
      function extractMediaCode(url) {
        if (url.startsWith('data:image')) {
          return url;
        }
        const match = url.match(/\/v2\/([^/]+)\//);
        return match ? match[1] : null;
      }
  
      // Extract the image code we're checking
      const currentImgCode = extractMediaCode(imgSrc);
      if (!currentImgCode) {
        return true; // Invalid image format, allow profile
      }
  
      // Ensure Firestore is initialized
      if (!db) {
        const { db: initializedDb, currentUser } = await initializeFirebase();
        db = initializedDb;
      }
  
      // Reference the user's labels document
      const userLabelsRef = db.collection('labels').doc(currentUser.uid);
      const userLabelsDoc = await userLabelsRef.get();
  
      if (!userLabelsDoc.exists) {
        return true; // No labels found, allow profile
      }
  
      const labelsData = userLabelsDoc.data().labels || {};
  
      // Filter allowed labels from the user's labels
      const filteredLabels = Object.entries(labelsData).filter(([labelName]) =>
        allowedLabels.includes(labelName)
      );
  
      // Check for matches in the allowed labels
      for (const [labelName, labelInfo] of filteredLabels) {
        if (!labelInfo?.codes) {
          continue; // Skip labels without codes
        }
  
        const codes = Object.values(labelInfo.codes);
  
        for (const codeData of codes) {
          const codeMatch = extractMediaCode(codeData.code) === currentImgCode;
          const nameMatch = codeData.name.toLowerCase() === name.toLowerCase();
  
          if (codeMatch && nameMatch) {
            return true; // Match found
          }
        }
      }
  
      return false; // No matches found
    } catch (error) {
      console.error('Label matching error:', error);
      return true; // On error, allow profile
    }
  }
  
  // Function to filter conversations
  async function filterConversations(allowedLabels) {
    const conversations = document.querySelectorAll('.msg-conversations-container__conversations-list > li');
  
    for (const conversation of conversations) {
      const imgEl = conversation.querySelector('.msg-selectable-entity__entity img') || conversation.querySelector('.msg-facepile-grid--no-facepile img');
      const nameEl = conversation.querySelector('.msg-conversation-listitem__participant-names .truncate');
  
      if (!imgEl || !nameEl) {
        // console.log(imgEl);
        // console.log(nameEl)
        // conversation.style.display = 'none';
        continue;
      }
  
      const imgSrc = imgEl.getAttribute('src');
      const name = nameEl.textContent.trim();
  
      const isMatch = await checkLabelMatch(imgSrc, name, allowedLabels);
      // console.log(name)
      // console.log(isMatch)
      conversation.style.display = isMatch ? 'block' : 'none';
    }
  }
  
  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  // Initialize the observer
  function initializeConversationFilter(allowedLabels) {
    // Debounced version of filterConversations
    const debouncedFilter = debounce(() => filterConversations(allowedLabels), 300);
  
    // Function to start observing
    function startObserving() {
      const listElement = document.querySelector('.msg-conversations-container__conversations-list');
  
      if (!listElement) {
        setTimeout(startObserving, 500); // Retry if element not found
        return;
      }
  
      // Create observer
      const observer = new MutationObserver(debouncedFilter);
  
      // Start observing
      observer.observe(listElement, {
        childList: true,
        subtree: true,
        attributes: true
      });
  
      // Initial filter
      filterConversations(allowedLabels);
  
      return observer;
    }
  
    return startObserving();
  }
  
  function createLabelDropdown(labels) {
    const labelButton = document.querySelector('#linkedin-label-btn');
    const buttonRect = labelButton.getBoundingClientRect();
  
    const dropdown = document.createElement('div');
    dropdown.className = 'scaffold-layout__list-detail';
    dropdown.id = 'linkedin-label-dropdown';
    dropdown.style.cssText = `
      position: fixed;
      top: ${buttonRect.bottom + window.scrollY + 5}px;
      left: ${buttonRect.left + window.scrollX}px;
      border-radius: 4px;
      padding: 8px;
      z-index: 1000;
      min-width: 200px;
      width: 200px;
      padding-top:0;
      height: fit-content;
    `;
  
    const labelList = document.createElement('ul');
    labelList.className = 'list-style-none relative search-reusables__collection-values-container search-reusables__collection-values-container--50vh';
    labelList.style.maxHeight = '300px';
    labelList.style.overflowY = 'auto';
  
    Object.keys(labels).forEach(labelName => {
      const labelContainer = document.createElement('li');
      labelContainer.className = 'search-reusables__collection-values-item';
  
      const checkbox = document.createElement('input');
      checkbox.className = 'search-reusables__select-input';
      checkbox.type = 'checkbox';
      checkbox.id = `label-${labelName}`;
      checkbox.name = 'label-filter-value';
      // Set initial checkbox state based on allowedLabels
      checkbox.checked = allowedLabels.includes(labelName);
  
      const label = document.createElement('label');
      label.className = 'search-reusables__value-label';
      label.htmlFor = `label-${labelName}`;
  
      const paragraph = document.createElement('p');
      paragraph.className = 'display-flex';
  
      const textSpan = document.createElement('span');
      textSpan.className = 't-14 t-black--light t-normal';
      textSpan.setAttribute('aria-hidden', 'true');
      textSpan.textContent = labelName;
      // Set text color to the label's color if available
      // if (labels[labelName].color) {
      //   textSpan.style.color = labels[labelName].color;
      // }
  
      const visibleSpan = document.createElement('span');
      visibleSpan.className = 'visually-hidden';
      visibleSpan.textContent = `Filter by ${labelName}`;
  
      checkbox.onchange = () => {
        if (checkbox.checked) {
          allowedLabels.push(labelName);
        } else {
          const index = allowedLabels.indexOf(labelName);
          if (index > -1) {
            allowedLabels.splice(index, 1);
          }
        }
  
        filterConversations(allowedLabels);
      };
  
      paragraph.appendChild(textSpan);
      paragraph.appendChild(visibleSpan);
      label.appendChild(paragraph);
      labelContainer.appendChild(checkbox);
      labelContainer.appendChild(label);
      labelList.appendChild(labelContainer);
    });
  
    dropdown.appendChild(labelList);
  
    // Handle window resize
    window.addEventListener('resize', () => {
      const newRect = labelButton.getBoundingClientRect();
      dropdown.style.top = `${newRect.bottom + window.scrollY + 5}px`;
      dropdown.style.left = `${newRect.left + window.scrollX}px`;
    });
  
    return dropdown;
  }
  
  async function setupLabelButton() {
    const titleRow = document.querySelector('.msg-conversations-container__title-row');
    if (!titleRow || document.querySelector('#linkedin-label-btn')) return;
  
    // Create the label button
    const labelButton = document.createElement('button');
    labelButton.id = 'linkedin-label-btn';
    labelButton.setAttribute('role', 'radio');
    labelButton.setAttribute('aria-checked', 'false');
    labelButton.className = 'vertical-align-middle artdeco-pill artdeco-pill--slate artdeco-pill--3 artdeco-pill--choice ember-view';
    labelButton.style.marginLeft = '5px';
    labelButton.innerHTML = `
      <span class="artdeco-pill__text">
        Labels
      </span>
    `;
  
    let dropdown = null;
  
    // Add click handler
    labelButton.onclick = async () => {
      // Toggle dropdown
      if (dropdown && dropdown.parentNode) {
        dropdown.remove();
        return;
      }
  
      // Fetch labels from Firestore
      try {
        if (!db) {
          const { db: initializedDb, currentUser } = await initializeFirebase();
          db = initializedDb;
        }
  
        // Fetch the labels for the authenticated user
        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
        const userLabelsDoc = await userLabelsRef.get();
  
        const labels = userLabelsDoc.exists ? userLabelsDoc.data().labels || {} : {};
  
        // Create and show dropdown
        dropdown = createLabelDropdown(labels);
        labelButton.parentNode.appendChild(dropdown);
  
        // Close dropdown when clicking outside
        const closeDropdown = (event) => {
          if (!dropdown.contains(event.target) && !labelButton.contains(event.target)) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
          }
        };
  
        // Add slight delay to prevent immediate closure
        setTimeout(() => {
          document.addEventListener('click', closeDropdown);
        }, 0);
  
      } catch (error) {
        console.error('Error fetching labels:', error);
      }
    };
  
    titleRow.appendChild(labelButton);
    return labelButton;
  }
  
  
  
  const shortcuts = [
    { title: "Show Shortcuts", keys: "⌘ + ⇧ + S", description: "Open shortcuts dialog" },
    { title: "Navigation", keys: "⌘ + ←", description: "Go back" },
    { title: "Search", keys: "⌘ + K", description: "Focus search bar" },
    // Add more shortcuts here
  ];
  
  // Create and inject HTML
  function createShortcutsDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 80%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      display: none;
      max-height: 500px;
      // overflow-y: auto;
      border-radius: 8px;
      width: 400px;
      // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      // background-color: white;
    `;
    dialog.className = 'scaffold-layout__list-detail';
  
    const content = `
      <div style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 class="t-14 t-black--light t-normal">Keyboard Shortcuts</h2>
          <div id="global-nav-typeahead" class="search-global-typeahead__typeahead" style="width: 200px;">
            <input class="search-global-typeahead__input" 
                   placeholder="Search shortcuts" 
                   dir="auto" 
                   role="combobox" 
                   aria-autocomplete="list" 
                   aria-label="Search shortcuts" 
                   type="text">
            <div aria-hidden="true" class="search-global-typeahead__search-icon-container">
              <svg role="none" aria-hidden="true" class="search-global-typeahead__search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                <path d="M14.56 12.44L11.3 9.18a5.51 5.51 0 10-2.12 2.12l3.26 3.26a1.5 1.5 0 102.12-2.12zM3 6.5A3.5 3.5 0 116.5 10 3.5 3.5 0 013 6.5z" fill="currentColor"></path>
              </svg>
            </div>
            <div class="search-global-typeahead__overlay global-alert-offset-top"></div>
          </div>
        </div>
        <div id="shortcuts-list"></div>
      </div>
    `;
  
    dialog.innerHTML = content;
    document.body.appendChild(dialog);
    return dialog;
  }
  
  
  // Render shortcuts list
  function renderShortcuts(searchTerm = '') {
    const shortcutsList = document.getElementById('shortcuts-list');
    const filteredShortcuts = shortcuts.filter(shortcut =>
      shortcut.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    shortcutsList.innerHTML = filteredShortcuts.map(shortcut => `
      <div style="display: flex; justify-content: space-between; padding: 12px 0; height:auto;" class="msg-conversation-card__content--selectable msg-s-event-listitem__message-bubble msg-s-event-listitem__message-bubble--msg-fwd-enabled msg-conversation-card__content--selectable">
        <div>
          <div class="msg-s-message-group__profile-link msg-s-message-group__name t-14 t-black t-bold" style="margin-bottom: 4px;">${shortcut.title}</div>
          <div class="t-14 t-black--light t-normal" style="opacity: 0.7;">${shortcut.description}</div>
        </div>
        <code class="t-14 t-black--light t-normal" style="background: rgba(0,0,0,0.03); padding: 4px 8px; border-radius: 4px;">
          ${shortcut.keys}
        </code>
      </div>
    `).join('');
  }
  
  // Initialize shortcuts dialog
  function initShortcuts() {
    // injectStyles();
    const dialog = createShortcutsDialog();
    let isVisible = false;
  
    // Handle keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        isVisible = !isVisible;
        dialog.style.display = isVisible ? 'block' : 'none';
        if (isVisible) {
          renderShortcuts();
          // Focus on search input immediately
          setTimeout(() => {
            dialog.querySelector('.search-global-typeahead__input').focus();
          }, 0);
        }
      }
  
      // Close on escape
      if (e.key === 'Escape' && isVisible) {
        isVisible = false;
        dialog.style.display = 'none';
      }
    });
  
    // Handle search
    dialog.querySelector('.search-global-typeahead__input').addEventListener('input', (e) => {
      renderShortcuts(e.target.value);
    });
  
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (isVisible && !dialog.contains(e.target)) {
        isVisible = false;
        dialog.style.display = 'none';
      }
    });
  }
  
  
  
  // Get token from background script
  async function getGoogleToken() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'GET_GOOGLE_TOKEN' }, response => {
        console.log(response)
        if (response.success) resolve(response.token);
        else reject(new Error(response.error));
      });
    });
  }
  
  async function listCollections() {
    try {
      const collections = await db.listCollections();
      console.log('Collections:', collections.map(col => col.id));
      return collections;
    } catch (error) {
      console.error('Error listing collections:', error);
      throw error;
    }
  }
  async function getUserData(uid) {
    console.log(uid)
    try {
      console.log(await db.collection('refreshTokens'))
      const userDoc = await db.collection('refreshTokens').doc(uid).get();
      console.log(userDoc);
      // await listCollections()
      if (userDoc.exists) {
        // Print and return the data
        console.log('User Data:', userDoc.data());
        return userDoc.data();
      } else {
        console.log('No user found with the given uid in refreshToken collection:', uid);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data from refreshToken:', error);
      throw error;
    }
  }
  // Initialize Firebase
  async function initializeFirebase() {
    try {
      if (db && auth && currentUser) {
        return { db, auth, currentUser };
      }
  
      const token = await getGoogleToken();
  
      console.log(token)
  
      if (!firebase.apps?.length) {
        firebase.initializeApp({
          apiKey: "AIzaSyBFggUUWmz6H53hxr-jL00tGDYr9x4DQg4",
          authDomain: "hyper-75b53.firebaseapp.com",
          projectId: "hyper-75b53"
        });
      }
  
      auth = firebase.auth();
      const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
      const userCredential = await auth.signInWithCredential(credential);
      currentUser = userCredential.user;
      console.log(currentUser)
      db = firebase.firestore();
  
  
      return { db, auth, currentUser };
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      db = null;
      auth = null;
      currentUser = null;
      throw error;
    }
  }
  
  
  
  chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    // console.log('Received message: ' + JSON.stringify(message));
    if (message.type === "URL_UPDATED" || message.type === "google-sheet-has-been-clicked") {
      // console.log('Waiting for title row...');
      console.log('initilized');
      await initializeFirebase();
      waitForTitleRow().then(() => {
      });
    }
  });
  
  
  
  
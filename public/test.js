
  
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
  
        if (!isMessageInput && !isInputField) {  function initializeConversationNavigation() {
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
  
  
  
  
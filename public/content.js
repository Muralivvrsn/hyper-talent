(() => {
  const log = (message) => {
    console.log(`[LinkedIn Extension] ${message}`);
  };

  log('Extension initializing...');

  // Shared state
  let db;
  let shortcutsCache = [];
  let profilesData = [];
  let pTagObserver;
  let profileListObserver;
  let isProcessing = false;
  let pendingUpdate = false;
  let shouldCancelProcessing = false;

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
  

  // Firebase initialization
  function initializeFirebase() {
    log('Initializing Firebase...');
    if (!window.firebase || !firebase.apps.length) {
      const firebaseConfig = {
        apiKey: "AIzaSyAAavSNC0K81cizrIADe0bZHZwBvGoNunc",
        authDomain: "hypertalent-91dff.firebaseapp.com",
        databaseURL: "https://hypertalent-91dff-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "hypertalent-91dff",
        storageBucket: "hypertalent-91dff.appspot.com",
        messagingSenderId: "443567784407",
        appId: "1:443567784407:web:647e6bcedcc61fec428b92",
        measurementId: "G-EPWD53GJ99"
      };
      try {
        firebase.initializeApp(firebaseConfig);
        log('Firebase initialized successfully');
      } catch (error) {
        console.error('Firebase initialization failed:', error);
      }
    }
    return firebase.database();
  }

  // Shortcuts Feature Functions
  function getName() {
    const nameElement = document.querySelector('h2.msg-entity-lockup__entity-title');
    const name = nameElement ? nameElement.textContent.trim() : "there";
    return name;
  }

  function replaceName(text) {
    const name = getName();
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
      console.log(`editor width ${editorWidth}`)

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
      console.error('Failed to show shortcuts list:', err);
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
        console.error('Failed to update message:', err);
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

  function handleInputChanges(mutations) {
    try {
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') {
          const inputText = mutation.target.textContent.trim();

          if (inputText === '') {
            const list = document.getElementById('shortcut-list');
            if (list) list.remove();
            return;
          }

          if (inputText.startsWith('/')) {
            const command = inputText.slice(1).trim().toLowerCase();
            log('Command detected: ' + command);

            const filteredShortcuts = command
              ? shortcutsCache
                .filter(shortcut => shortcut.title.toLowerCase().startsWith(command))
                .sort((a, b) => a.title.localeCompare(b.title))
              : shortcutsCache.sort((a, b) => a.title.localeCompare(b.title));

            showShortcutsList(filteredShortcuts);
          } else {
            const list = document.getElementById('shortcut-list');
            if (list) list.remove();
          }
        }
      });
    } catch (err) {
      console.error('Failed to handle input changes:', err);
    }
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
      const doc = document.querySelector('.scaffold-layout-container--reflow');

      if (doc && mainID) {
        doc.style.marginLeft = '100px';
        mainID.style.width = '85vw';
        mainID.style.position = 'relative';
        mainID.style.zIndex = '99';
      }

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

  // Message Box Observer Setup
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

  function monitorMessageBox() {
    const messageBox = document.querySelector('.msg-form__contenteditable');

    if (messageBox) {
      const observer = new MutationObserver(() => {
        const pTag = messageBox.querySelector('p');
        if (pTag && !pTag.dataset.shortcutsEnabled) {
          log('Found message box, adding observer');
          pTag.dataset.shortcutsEnabled = 'true';
          addMessageBoxObserver(pTag);
        }
      });

      observer.observe(messageBox, { childList: true, subtree: true });
    } else {
      setTimeout(monitorMessageBox, 500);
    }
  }

  // Data Fetching
  function fetchShortcuts() {
    if (!db) {
      db = initializeFirebase();
    }

    db.ref('shortcuts').once('value')
      .then(snapshot => {
        shortcutsCache = [];
        snapshot.forEach(child => {
          shortcutsCache.push({
            title: child.val().title,
            content: child.val().content
          });
        });
        log('Shortcuts loaded: ' + shortcutsCache.length);
      })
      .catch(error => console.error('Failed to load shortcuts:', error));
  }

  function initializeProfilesListener() {
    if (!db) {
      db = initializeFirebase();
    }

    const profilesRef = db.ref('roles');
    profilesRef.on('value', (snapshot) => {
      const profiles = snapshot.val() || {};
      processProfilesData(profiles);
    });
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
  function init() {
    log('Initializing combined extension...');
    try {
      db = initializeFirebase();

      // Initialize shortcuts feature
      fetchShortcuts();
      monitorMessageBox();

      // Initialize profile tagger feature
      initializeProfilesListener();
      updateProfileTags();

      // Setup shared event listeners
      setupEventListeners();

    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }

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
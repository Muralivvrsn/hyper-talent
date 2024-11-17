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
      console.log('google-sheet-has-been-clicked');
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
  console.log(`[LinkedIn Extension] ${message}`);
};

// Global flag to track if the event listener is already attached
let isProfileTriggerInitialized = false;

function openProfileTrigger() {
  if (isProfileTriggerInitialized) {
    console.log('openProfileTrigger already initialized, skipping...');
    return;
  }
  isProfileTriggerInitialized = true;

  console.log('Initializing openProfileTrigger');

  // Add event listener for keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // Check if it's CMD+O (Mac) or CTRL+O (Windows)
    if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
      console.log('CMD+O detected');
      e.preventDefault(); // Prevent default browser behavior

      // Find the profile link
      const profileLink = document.querySelector('a.app-aware-link.msg-thread__link-to-profile');

      if (profileLink) {
        const profileUrl = profileLink.href;
        console.log('Profile URL found:', profileUrl);

        // Open in new tab and focus
        const newTab = window.open(profileUrl, '_blank');
        if (newTab) {
          newTab.focus();
          console.log('Profile opened in new tab');
        } else {
          console.warn('Popup was blocked by the browser');
        }
      } else {
        console.warn('Profile link not found');
      }
    }
  });

  // Set the flag to true after initialization
  isProfileTriggerInitialized = true;
}



let isShortcutsInitialized = false;

function initializeShortcuts() {
  if (isShortcutsInitialized) {
    console.log('Shortcuts already initialized, skipping...');
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
              console.log(`${optionText} option clicked`);
              // Reset opacity after operation is complete
              const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
              if (dropdown) {
                dropdown.style.opacity = '1';
              }
            } else {
              console.log(`${optionText} option not found`);
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
          console.log('Inbox shortcuts not found');
          setTimeout(pollForOption, 500);
        }
      } else {
        console.log('Active conversation not found');
        // Reset opacity if conversation not found
        const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
        if (dropdown) {
          dropdown.style.opacity = '1';
        }
      }
    }

    const profileLink = document.querySelector('.msg-title-bar');
    console.log(profileLink)
    const activeConversation = profileLink.querySelector('.msg-thread-actions__dropdown');
    console.log(activeConversation)
    if (activeConversation) {
      console.log('Active conversation found');
      const button = activeConversation.querySelector('button.msg-thread-actions__control');
      const dropdown = activeConversation.querySelector('.msg-thread-actions__dropdown-container');
      console.log(button);
      if (button) {
        dropdown.style.opacity = '0';
        button.click();
        console.log('Menu button clicked');
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
        if(event.shiftKey){
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
      console.log(`Shortcut detected for: ${optionToFind}`);
      findAndClickOption(optionToFind);
    }
}

  document.addEventListener('keydown', handleKeyboardShortcuts);
  isShortcutsInitialized = true;
  console.log('Shortcuts initialized successfully');
}


const TOGGLE_FLOATING_PANEL_EVENT = 'toggleFloatingPanel';

// Function to set up the floating panel and event listeners
function setupFloatingPanel() {
  // Create floating panel element
  const floatingPanel = document.createElement('div');
  if(document.getElementById('floatingPanel'))
    return;
  floatingPanel.id = 'floatingPanel';
  floatingPanel.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    width: 200px;
    height: 300px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    display: none;
    z-index: 1000;
  `;
  
  document.body.appendChild(floatingPanel);

  // Listen for our custom event
  document.addEventListener(TOGGLE_FLOATING_PANEL_EVENT, () => {
    if (floatingPanel.style.display === 'none') {
      floatingPanel.style.display = 'block';
    } else {
      floatingPanel.style.display = 'none';
    }
  });
}


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
  // log('Initializing combined extension...');
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
// Message listener for initialization
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message: ' + JSON.stringify(message));
  if (message.type === "URL_UPDATED" || message.type === "google-sheet-has-been-clicked") {
    console.log('Initializing functions');
    init();
    initShort();
    initializeShortcuts();
    openProfileTrigger();
    setupFloatingPanel()

  }
});


init()
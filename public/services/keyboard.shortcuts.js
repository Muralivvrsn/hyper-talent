// keyboard-shortcuts.js
window.keyboard = window.keyboard || {};
window.keyboard.shortcuts = {
  isInitialized: false,
  isNavigationInitialized: false,
  currentActiveIndex: -1,
  dialog: null,
  shortcuts: [
    { title: "Archive", keys: "⌘ + ⇧ + A", description: "Archive conversation" },
    { title: "Mark as unread", keys: "⌘ + U", description: "Mark conversation as unread" },
    { title: "Mark as read", keys: "⌘ + I", description: "Mark conversation as read" },
    { title: "Delete conversation", keys: "⌘ + D", description: "Delete conversation" },
    { title: "Mute", keys: "⌘ + M", description: "Mute conversation" },
    { title: "Unmute", keys: "⌘ + ⇧ + M", description: "Unmute conversation" },
    { title: "Report", keys: "⌘ + R", description: "Report conversation" },
    { title: "Restore", keys: "⌘ + ⇧ + R", description: "Restore conversation" },
    { title: "Star", keys: "⌘ + S", description: "Star conversation" },
    { title: "Remove star", keys: "⌘ + ⇧ + S", description: "Remove star from conversation" },
    { title: "Move to Other", keys: "⌘ + ⇧ + B", description: "Move conversation to Other folder" },
    { title: "Toggle floating panel", keys: "⌘ + ⇧ + L", description: "Toggle floating panel" },
    { title: "Navigate Up", keys: "⌘ + ↑", description: "Go to previous conversation" },
    { title: "Navigate Down", keys: "⌘ + ↓", description: "Go to next conversation" },
    { title: "Open Profile", keys: "⌘ + O", description: "Open profile in new tab" },
    { title: "Show Shortcuts", keys: "⌘ + ⌥ + S", description: "Show keyboard shortcuts" }
  ],

  createShortcutsDialog() {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 80%; 
      transform: translate(-50%, -50%);
      z-index: 50;
      display: none;
      width: 400px;  
      background: white;
      border-radius: 16px; 
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.15), 0 10px 10px -5px rgb(0 0 0 / 0.10); 
      overflow: hidden;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
  
    const content = `
      <div class="header" style="
        background: rgb(37 99 235);
        padding: 2rem 2.5rem;  
        position: relative;
      ">
        <h2 style="
          line-height: 1.3;
          font-weight: 700; 
          color: white;
          margin: 0;
          letter-spacing: -0.02em; 
        ">Keyboard Shortcuts</h2>
        
        <button class="close-button" style="
          position: absolute;
          right: 10px;
          top: 10px;
          background: transparent;
          border: none;
          padding: 0.75rem;
          border-radius: 12px; 
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.2s ease; 
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
  
        <div style="
          position: relative;
          margin-top: 1.25rem; 
        ">
          <input type="text" placeholder="Search shortcuts..." style="
            width: 100%;
            padding: 1rem 1.5rem 1rem 3.5rem;  
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2); 
            color: white;
            border-radius: 12px;  
            font-weight: 500;
            outline: none;
            transition: all 0.2s ease;
          ">
          <svg style="
            position: absolute;
            left: 1.25rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1.25rem;
            height: 1.25rem;
            color: rgba(255, 255, 255, 0.6); 
          " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>
  
      <div id="shortcuts-list" style="
        max-height: 70vh;  
        overflow-y: auto;
        padding: 0.5rem 0; 
      "></div>
    `;
  
    dialog.innerHTML = content;
    document.body.appendChild(dialog);
  
    // Style the scrollbar
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      #shortcuts-list::-webkit-scrollbar {
        width: 12px;  
      }
      #shortcuts-list::-webkit-scrollbar-track {
        background: transparent;
      }
      #shortcuts-list::-webkit-scrollbar-thumb {
        background-color: rgba(0,0,0,0.2);
        border-radius: 6px; 
      }
      .close-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      input:focus {
        background: white;
        color: rgb(17 24 39);
      }
      input:focus::placeholder {
        color: rgb(156 163 175);
      }
    `;
    document.head.appendChild(styleSheet);
  
    // Add search functionality
    const searchInput = dialog.querySelector('input');
    searchInput.addEventListener('input', (e) => {
      this.renderShortcuts(e.target.value);
    });
  
    // Close button functionality
    const closeButton = dialog.querySelector('.close-button');
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dialog.style.display = 'none';
    });
  
    // Close dialog when clicking outside
    document.addEventListener('click', (e) => {
      if (this.dialog && !this.dialog.contains(e.target) && this.dialog.style.display === 'block') {
        this.dialog.style.display = 'none';
      }
    });
  
    return dialog;
  },
  
  renderShortcuts(searchTerm = '') {
    const shortcutsList = document.getElementById('shortcuts-list');
    const filteredShortcuts = this.shortcuts.filter(shortcut =>
      shortcut.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    shortcutsList.innerHTML = filteredShortcuts.map(shortcut => `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center; 
        padding: 1rem 2.5rem;  
        border-bottom: 1px solid rgb(243 244 246);
        transition: all 0.2s ease;
        cursor: pointer;
      " class="shortcut-item">
        <div style="flex: 1;">  
          <div style="
            font-weight: 600; 
            color: rgb(17 24 39);
            margin-bottom: 0.25rem; 
          ">${shortcut.title}</div>
          <div style="
            color: rgb(107 114 128);
            font-weight: 400; 
            font-size: 1.25rem;
          ">${shortcut.description}</div>
        </div>
        <code style="
          background: rgb(243 244 246);
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-family: ui-monospace, 'SF Mono', Menlo, monospace;
          color: rgb(31 41 55);
          font-weight: 500;
          margin-left: 2rem; 
          white-space: nowrap;  
        ">${shortcut.keys}</code>
      </div>
    `).join('');
  
    // Add hover effect
    const items = shortcutsList.querySelectorAll('.shortcut-item');
    items.forEach(item => {
      item.addEventListener('mouseover', () => {
        item.style.backgroundColor = 'rgb(249 250 251)';
      });
      item.addEventListener('mouseout', () => {
        item.style.backgroundColor = 'transparent';
      });
    });
  },

  toggleShortcutsDialog() {
    if (!this.dialog) {
      this.dialog = this.createShortcutsDialog();
    }

    if (this.dialog.style.display === 'block') {
      this.dialog.style.display = 'none';
    } else {
      this.dialog.style.display = 'block';
      this.renderShortcuts();
    }
  },

  handleConversationNavigation(e) {
    // Only handle Cmd/Ctrl + up/down arrows
    if (!((e.metaKey || e.ctrlKey) && !e.shiftKey) || (e.code !== 'ArrowDown' && e.code !== 'ArrowUp')) {
        return;
    }

    e.preventDefault(); // Prevent page scrolling

    // Get the conversations list
    const conversationsList = document.querySelector('.msg-conversations-container__conversations-list');
    if (!conversationsList) {
        return;
    }

    // Get all visible conversation items
    const conversations = Array.from(conversationsList.getElementsByTagName('li')).filter(li => {
        const computedStyle = window.getComputedStyle(li);
        return computedStyle.display !== 'none';
    });

    if (!conversations.length) {
        return;
    }

    // Find current active conversation if we don't have it
    if (this.currentActiveIndex === -1) {
        this.currentActiveIndex = conversations.findIndex(li =>
            li.querySelector('.msg-conversation-listitem__active-text.visually-hidden')
        );

        // If still no active conversation found, start from the beginning
        if (this.currentActiveIndex === -1) {
            this.currentActiveIndex = 0;
        }
    }

    // Calculate new index based on arrow key
    let newIndex;
    if (e.code === 'ArrowDown') {
        newIndex = this.currentActiveIndex + 1;
        if (newIndex >= conversations.length) {
            newIndex = 0; // Wrap to start
        }
    } else { // ArrowUp
        newIndex = this.currentActiveIndex - 1;
        if (newIndex < 0) {
            newIndex = conversations.length - 1; // Wrap to end
        }
    }

    // Find and click the selectable content element
    const selectableContent = conversations[newIndex].querySelector('.msg-conversation-card__content--selectable');
    if (selectableContent) {
        selectableContent.click();
        this.currentActiveIndex = newIndex;

        // Get the height of the selected conversation element
        const conversationHeight = conversations[newIndex].offsetHeight;
        
        // Calculate scroll position
        const containerTop = conversationsList.scrollTop;
        const elementTop = conversations[newIndex].offsetTop;
        const containerHeight = conversationsList.clientHeight;
        
        // Scroll based on direction
        if (e.code === 'ArrowDown') {
            // If element is below viewport
            if (elementTop + conversationHeight > containerTop + containerHeight) {
                conversationsList.scrollTop = elementTop - containerHeight + conversationHeight;
            }
        } else {
            // If element is above viewport
            if (elementTop < containerTop) {
                conversationsList.scrollTop = elementTop;
            }
        }
    }
},

  handleManualClick(e) {
    const conversationsList = document.querySelector('.msg-conversations-container__conversations-list');
    if (!conversationsList) return;

    const clickedLi = e.target.closest('li');
    if (clickedLi && conversationsList.contains(clickedLi)) {
      const conversations = Array.from(conversationsList.getElementsByTagName('li'));
      this.currentActiveIndex = conversations.indexOf(clickedLi);
    }
  },

  openProfileInNewTab() {
    const profileLink = document.querySelector('.msg-thread__link-to-profile');
    if (profileLink) {
      window.open(profileLink.href, '_blank');
    } else {

      window.labelUtil.showToast('Profile link not found', 'error');
    }
  },

  findAndClickOption(optionText) {
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
              const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
              if (dropdown) {
                dropdown.style.opacity = '1';
              }
            } else {
              const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
              if (dropdown) {
                dropdown.style.opacity = '1';
              }
            }
          } else {
            setTimeout(pollForOption, 500);
          }
        } else {
          setTimeout(pollForOption, 500);
        }
      } else {
        const dropdown = document.querySelector('.msg-thread-actions__dropdown-container');
        if (dropdown) {
          dropdown.style.opacity = '1';
        }
      }
    }

    const profileLink = document.querySelector('.msg-title-bar');
    const activeConversation = profileLink?.querySelector('.msg-thread-actions__dropdown');
    if (activeConversation) {
      const button = activeConversation.querySelector('button.msg-thread-actions__control');
      const dropdown = activeConversation.querySelector('.msg-thread-actions__dropdown-container');
      if (button) {
        dropdown.style.opacity = '0';
        button.click();
        setTimeout(pollForOption, 500);
      }
    }
  },

  handleKeyboardShortcuts(event) {
    if (!(event.metaKey || event.ctrlKey)) return;

    // Handle shortcuts dialog
    if (event.altKey && event.code === 'KeyS') {
      event.preventDefault();
      this.toggleShortcutsDialog();
      return;
    }

    // Handle profile opening
    if (event.code === 'KeyO') {
      event.preventDefault();
      this.openProfileInNewTab();
      return;
    }

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
          optionToFind = 'Unmute';
        }
        break;
      case 'KeyS':
        event.preventDefault();
        if (event.shiftKey) {
          optionToFind = 'Remove star';
        } else {
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
          document.dispatchEvent(new CustomEvent('TOGGLE_FLOATING_PANEL_EVENT'));
        }
        break;
    }

    if (optionToFind) {
      this.findAndClickOption(optionToFind);
    }
  },

  observer() {
    if (this.isInitialized) {
      return;
    }

    // Initialize keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    
    // Initialize conversation navigation
    document.addEventListener('keydown', this.handleConversationNavigation.bind(this));
    document.addEventListener('click', this.handleManualClick.bind(this));

    this.isInitialized = true;
    console.log('Keyboard shortcuts and navigation initialized successfully');
  }
};
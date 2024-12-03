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
      width: 600px;  /* Increased from 400px */
      background: white;
      border-radius: 12px; /* Increased from 8px */
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      overflow: hidden;
    `;
  
    const content = `
      <div class="header" style="
        background: rgb(37 99 235);
        padding: 2.25rem;  /* Increased from 1.5rem */
        position: relative;
      ">
        <h2 style="
          font-size: 1.6875rem;  /* Increased from 1.125rem */
          line-height: 2.625rem;  /* Increased from 1.75rem */
          font-weight: 600;
          color: white;
          margin: 0;
          padding-right: 3rem;  /* Increased from 2rem */
        ">Keyboard Shortcuts</h2>
        
        <button class="close-button" style="
          position: absolute;
          right: 1.5rem;  /* Increased from 1rem */
          top: 1.5rem;  /* Increased from 1rem */
          background: transparent;
          border: none;
          padding: 0.75rem;  /* Increased from 0.5rem */
          border-radius: 9999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
  
        <div style="
          position: relative;
          margin-top: 0.75rem;  /* Increased from 0.5rem */
        ">
          <svg style="
            position: absolute;
            left: 1.125rem;  /* Increased from 0.75rem */
            top: 50%;
            transform: translateY(-50%);
            width: 1.5rem;  /* Increased from 1rem */
            height: 1.5rem;  /* Increased from 1rem */
            color: rgb(156 163 175);
          " xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          
          <input type="text" placeholder="Search shortcuts" style="
            width: 100%;
            padding: 0.75rem 1.5rem 0.75rem 3.75rem;  /* Increased padding */
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            border-radius: 9999px;
            font-size: 1.3125rem;  /* Increased from 0.875rem */
            outline: none;
            transition: all 300ms;
          ">
        </div>
      </div>
  
      <div id="shortcuts-list" style="
        max-height: calc(80vh - 270px);  /* Increased from 180px */
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(0,0,0,0.2) transparent;
      "></div>
    `;
  
    dialog.innerHTML = content;
    document.body.appendChild(dialog);
  
    // Style the scrollbar
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      #shortcuts-list::-webkit-scrollbar {
        width: 12px;  /* Increased from 8px */
      }
      #shortcuts-list::-webkit-scrollbar-track {
        background: transparent;
      }
      #shortcuts-list::-webkit-scrollbar-thumb {
        background-color: rgba(0,0,0,0.2);
        border-radius: 6px;  /* Increased from 4px */
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
        padding: 1.5rem;  /* Increased from 1rem */
        border-bottom: 1px solid rgb(243 244 246);
        transition: background-color 200ms;
        cursor: pointer;
      " class="shortcut-item">
        <div style="display: flex; flex-direction: column; gap: 0.375rem;">  /* Increased from 0.25rem */
          <div style="
            font-size: 1.3125rem;  /* Increased from 0.875rem */
            font-weight: 500;
            color: rgb(17 24 39);
          ">${shortcut.title}</div>
          <div style="
            font-size: 1.125rem;  /* Increased from 0.75rem */
            color: rgb(107 114 128);
          ">${shortcut.description}</div>
        </div>
        <code style="
          font-size: 1.125rem;  /* Increased from 0.75rem */
          background: rgb(243 244 246);
          padding: 0.375rem 0.75rem;  /* Increased padding */
          border-radius: 0.5625rem;  /* Increased from 0.375rem */
          font-family: ui-monospace, monospace;
          color: rgb(31 41 55);
          align-self: flex-start;
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

    // Get all conversation items
    const conversations = Array.from(conversationsList.getElementsByTagName('li'));
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
      showToast('Profile link not found', 'error');
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
      case 'KeyR':
        event.preventDefault();
        if (event.shiftKey) {
          optionToFind = 'Restore';
        } else {
          optionToFind = 'Report';
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
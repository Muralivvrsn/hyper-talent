// keyboard-shortcuts.js
window.keyboard = window.keyboard || {};
window.keyboard.shortcuts = {
  isInitialized: false,
  currentActiveIndex: -1,
  debug: true, // Enable/disable logging

  log(...args) {
    if (this.debug) {
      console.log('[Keyboard Shortcuts]', ...args);
    }
  },

  shouldIgnoreShortcut() {
    const activeElement = document.activeElement;
    const isIgnorable =
      (activeElement.tagName !== 'INPUT' &&
        activeElement.tagName !== 'TEXTAREA' &&
        activeElement.getAttribute('contenteditable') !== 'true' &&
        !activeElement.classList.contains('msg-form__contenteditable'));

    if (isIgnorable) {
      this.log('Ignoring shortcut - Active element:', activeElement.tagName, activeElement.className);
    }
    return isIgnorable;
  },

  handleConversationNavigation(e) {
    // Only handle Cmd/Ctrl + up/down arrows
    if (!((e.metaKey || e.ctrlKey) && !e.shiftKey) ||
      (e.code !== 'ArrowDown' && e.code !== 'ArrowUp')) {
      return;
    }

    this.log('Navigation key pressed:', e.code);
    e.preventDefault();

    const conversationsList = document.querySelector('.msg-conversations-container__conversations-list');
    if (!conversationsList) {
      this.log('Conversations list not found');
      return;
    }

    // Get all visible conversations
    const conversations = Array.from(conversationsList.getElementsByTagName('li')).filter(li => {
      const computedStyle = window.getComputedStyle(li);
      return computedStyle.display !== 'none';
    });

    if (!conversations.length) {
      this.log('No visible conversations found');
      return;
    }

    // Find current active conversation
    if (this.currentActiveIndex === -1) {
      this.currentActiveIndex = conversations.findIndex(li =>
        li.querySelector('.msg-conversation-listitem__active-text.visually-hidden')
      );
      if (this.currentActiveIndex === -1) {
        this.currentActiveIndex = 0;
      }
    }

    this.log('Current active index:', this.currentActiveIndex);

    // Calculate new index
    let newIndex;
    if (e.code === 'ArrowDown') {
      newIndex = (this.currentActiveIndex + 1) % conversations.length;
    } else {
      newIndex = this.currentActiveIndex - 1;
      if (newIndex < 0) newIndex = conversations.length - 1;
    }

    this.log('New index:', newIndex);

    // Click the conversation
    const selectableContent = conversations[newIndex].querySelector('.msg-conversation-card__content--selectable');
    if (selectableContent) {
      this.log('Clicking conversation at index:', newIndex);
      selectableContent.click();
      this.currentActiveIndex = newIndex;

      // Handle scrolling
      this.handleConversationScroll(conversations[newIndex], conversationsList, e.code === 'ArrowDown');
    } else {
      this.log('Selectable content not found for conversation');
    }
  },

  handleConversationScroll(element, container, isDownward) {
    const elementHeight = element.offsetHeight;
    const containerTop = container.scrollTop;
    const elementTop = element.offsetTop;
    const containerHeight = container.clientHeight;

    if (isDownward) {
      if (elementTop + elementHeight > containerTop + containerHeight) {
        container.scrollTop = elementTop - containerHeight + elementHeight;
        this.log('Scrolling down to:', container.scrollTop);
      }
    } else {
      if (elementTop < containerTop) {
        container.scrollTop = elementTop;
        this.log('Scrolling up to:', container.scrollTop);
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
      this.log('Manual click - Updated active index:', this.currentActiveIndex);
    }
  },

  openProfileInNewTab() {
    this.log('Attempting to open profile in new tab');
    const profileLink = document.querySelector('.msg-thread__link-to-profile');
    if (profileLink) {
      this.log('Opening profile:', profileLink.href);
      window.open(profileLink.href, '_blank');
    } else {
      this.log('Profile link not found');
      window.labelUtil.showToast('Profile link not found', 'error');
    }
  },

  findAndClickOption(optionText) {
    this.log('Looking for option:', optionText);

    const pollForOption = () => {
      const titleBar = document.querySelector('.msg-title-bar');
      const dropdown = titleBar?.querySelector('.msg-thread-actions__dropdown');

      if (!dropdown) {
        this.log('Dropdown not found');
        return;
      }

      const button = dropdown.querySelector('button.msg-thread-actions__control');
      if (!button) {
        this.log('Dropdown button not found');
        return;
      }

      // Click the dropdown button
      this.log('Clicking dropdown button');
      button.click();

      setTimeout(() => {
        const options = document.querySelectorAll('.msg-thread-actions__dropdown-option');
        this.log('Found options:', options.length);

        const targetOption = Array.from(options).find(option =>
          option.textContent.trim().includes(optionText)
        );

        if (targetOption) {
          this.log('Found target option, clicking:', optionText);
          targetOption.click();
        } else {
          this.log('Target option not found:', optionText);
        }
      }, 100);
    };

    pollForOption();
  },

  handleKeyboardShortcuts(event) {

    if (event.key === 'Escape') {
      const focusedElement = document.querySelector('.msg-form__contenteditable:focus');
      if (focusedElement) {
        this.log('Unfocusing message form with Escape');
        focusedElement.blur();
        document.body.focus();
        return;
      }
    }
    if (!this.shouldIgnoreShortcut()) return;
    const isCtrlCmd = event.metaKey || event.ctrlKey;
    if (isCtrlCmd) return;




    this.log('Keyboard shortcut detected:', event.code, {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      meta: event.metaKey
    });

    let optionToFind = null;

    switch (event.code) {
      case 'KeyE':
        event.preventDefault();
        this.log('Archive shortcut triggered');
        optionToFind = 'Archive';
        break;

      case 'KeyR':
        event.preventDefault();
        if (event.shiftKey) {
          this.log('Unfocus shortcut triggered (Shift + R)');
          // Find any focused input or contenteditable
          const focusedElement = document.querySelector('.msg-form__contenteditable:focus');
          if (focusedElement) {
            focusedElement.blur();
            // Focus the body to ensure keyboard shortcuts work
            document.body.focus();
            this.log('Message form unfocused');
          } else {
            this.log('No message form to unfocus');
          }
        } else {
          this.log('Focus reply shortcut triggered (R)');
          const msgForm = document.querySelector('.msg-form__contenteditable');
          if (msgForm) {
            msgForm.focus();
            this.log('Message form focused');
          } else {
            this.log('Message form not found');
          }
        }
        break;

      case 'KeyO':
        event.preventDefault();
        this.log('Open profile shortcut triggered');
        this.openProfileInNewTab();
        break;

      case 'KeyI':
        if (event.shiftKey) {
          event.preventDefault();
          this.log('Mark as read shortcut triggered');
          optionToFind = 'Mark as read';
        }
        break;

      case 'KeyU':
        if (event.shiftKey) {
          event.preventDefault();
          this.log('Mark as unread shortcut triggered');
          optionToFind = 'Mark as unread';
        }
        break;

      case 'KeyD':
        event.preventDefault();
        this.log('Delete shortcut triggered');
        optionToFind = 'Delete conversation';
        break;

      case 'KeyM':
        event.preventDefault();
        this.log('Mute/Unmute shortcut triggered');
        optionToFind = event.shiftKey ? 'Unmute' : 'Mute';
        break;

      case 'KeyS':
        event.preventDefault();
        this.log('Star/Unstar shortcut triggered');
        optionToFind = event.shiftKey ? 'Remove star' : 'Star';
        break;
    }

    if (optionToFind) {
      this.findAndClickOption(optionToFind);
    }
  },

  observer() {
    if (this.isInitialized) {
      this.log('Already initialized');
      return;
    }

    this.log('Initializing keyboard shortcuts');

    // Initialize keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Initialize conversation navigation
    document.addEventListener('keydown', (e) => this.handleConversationNavigation(e));
    document.addEventListener('click', (e) => this.handleManualClick(e));

    this.isInitialized = true;
    this.log('Initialization complete');
  }
};

// Initialize keyboard shortcuts
window.keyboard.shortcuts.observer();
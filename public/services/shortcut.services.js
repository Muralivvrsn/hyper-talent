window.floatingPanel = null;

window.hideFloatingPanel = () => {
    if (floatingPanel) {
        floatingPanel.style.opacity = '0';
        floatingPanel.style.transform = 'translateY(10px)';
        setTimeout(() => {
            floatingPanel.style.display = 'none';
        }, 300);
    }
};

window.setupFloatingPanel = () => {
    if (floatingPanel) return floatingPanel;

    floatingPanel = document.createElement('div');
    if (document.getElementById('floatingPanel')) return;
    // Add this at the beginning of setupFloatingPanel
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

    // Add Poppins font

    floatingPanel.style.cssText = `
        position: fixed;
        height: auto;
        max-height: 300px;
        display: none;
        z-index: 1000;
        padding: 16px;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Fira Sans', Ubuntu, Oxygen, 'Oxygen Sans', Cantarell, 'Droid Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Lucida Grande', Helvetica, Arial, sans-serif;
        transition: all 0.3s ease-in-out;
        opacity: 0;
        transform: translateY(10px);
        overflow: hidden;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    // Event listeners
    document.addEventListener('click', (event) => {
        if (floatingPanel.style.display === 'block' &&
            !floatingPanel.contains(event.target) &&
            !event.target.closest('.msg-form__contenteditable')) {
            window.hideFloatingPanel();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && floatingPanel.style.display === 'block') {
            window.hideFloatingPanel();
        }
    });

    // Replace the updatePosition function in setupFloatingPanel
    const updatePosition = () => {
        const messageBox = document.querySelector('.msg-form__contenteditable');
        if (messageBox) {
          const messageBoxRect = messageBox.getBoundingClientRect();
          floatingPanel.style.width = `${messageBoxRect.width}px`;
          floatingPanel.style.left = `${messageBoxRect.left}px`;
          floatingPanel.style.bottom = `${window.innerHeight - messageBoxRect.top + 10}px`;
        }
      };

    // ResizeObserver setup
    const resizeObserver = new ResizeObserver(updatePosition);

    const observer = new MutationObserver(() => {
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

    const initialMessageBox = document.querySelector('.msg-form__contenteditable');
    if (initialMessageBox) {
        updatePosition();
        resizeObserver.observe(initialMessageBox);
    }

    floatingPanel.innerHTML = `
        <div id="shortcuts-nav-typeahead" class="search-global-typeahead__typeahead">
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
        </div>
        <ul style="height: 230px; overflow-y: auto; margin: 0; padding: 0; margin-top: 10px; list-style: none;"></ul>
    `;

    floatingPanel.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    document.body.appendChild(floatingPanel);
    return floatingPanel;
};

window.shortcutsObserver = {
    observer: {
        currentObserver: null,
        debounceTimer: null,
        unsubscribeFirestore: null,
        isProcessing: false,
        shortcutsCache: new Map(),
        isFirestoreInitialized: false,
        selectedIndex: -1,
        maxIndex: -1,
        filteredResults: [],
        pTagObserver: null,

        // Helper function for name replacement
        replaceName(content, name = '') {
            if (!name) {
                const messageThread = document.querySelector('.msg-thread');
                if (messageThread) {
                    const nameElement = messageThread.querySelector('.msg-s-message-group__name');
                    if (nameElement) {
                        name = nameElement.textContent.trim().split(' ')[0];
                    }
                }
                // console.log(name)
            }
            // console.log(content.replace(/<<name>>/g, name || '[Name]'));
            return content.replace(/<<name>>/g, name || '[Name]');
        },

        debounce(func, wait) {
            return (...args) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => func.apply(this, args), wait);
            };
        },

        async initializeFirestoreListener() {
            if (this.isFirestoreInitialized) return;

            try {
                const { db, currentUser } = await window.firebaseService.initializeFirebase();
                // console.log('Initializing Firestore listener for shortcuts');

                this.unsubscribeFirestore = db.collection('shortcuts')
                    .doc(currentUser.uid)
                    .onSnapshot(doc => {
                        if (!doc.exists) {
                            // console.log('No shortcuts document found');
                            return;
                        }
                        const shortcuts = doc.data().shortcuts || {};
                        this.updateShortcutsCache(shortcuts);
                    });

                this.isFirestoreInitialized = true;
            } catch (error) {
                // console.error('Error initializing Firestore listener:', error);
                this.isFirestoreInitialized = false;
            }
        },

        updateShortcutsCache(shortcuts) {
            const previousSize = this.shortcutsCache.size;
            this.shortcutsCache.clear();
        
            Object.entries(shortcuts).forEach(([key, data]) => {
                this.shortcutsCache.set(key, data);
            });
        
            if (this.shortcutsCache.size !== previousSize) {
                // console.log(`Shortcuts cache updated: ${this.shortcutsCache.size} shortcuts available`);
            }
        
            // Add this part - Update UI if panel is open
            if (window.floatingPanel && window.floatingPanel.style.display === 'block') {
                const searchInput = window.floatingPanel.querySelector('.search-global-typeahead__input');
                const searchTerm = searchInput ? searchInput.value : '';
                this.updateSearchResults(searchTerm);
            }
        },

        createResultItem(shortcut, isSelected = false) {
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
                alignItems: 'flex-start',
                backgroundColor: isSelected ? '#f3f6f8' : 'transparent'
            });

            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f3f6f8';
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = isSelected ? '#f3f6f8' : 'transparent';
            });

            item.addEventListener('click', () => {
                this.applyShortcut(shortcut);
            });

            item.appendChild(contentDiv);
            return item;
        },

        applyShortcut(shortcut) {
            // console.log(shortcut)
            try {
                const messageBox = document.querySelector('.msg-form__contenteditable p');
                if (messageBox) {
                    messageBox.textContent = this.replaceName(shortcut.content);

                    ['input', 'keyup', 'keydown'].forEach(eventType => {
                        messageBox.dispatchEvent(new Event(eventType, { bubbles: true }));
                    });

                    const messageInput = document.querySelector('.msg-form__contenteditable');
                    if (messageInput) {
                        messageInput.focus();
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.selectNodeContents(messageBox);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
                window.hideFloatingPanel();
            } catch (err) {
                // console.error('Failed to apply shortcut:', err);
            }
        },

        handleMessageBoxChanges(mutations) {
            if (this.isProcessing) return;
            this.isProcessing = true;
        
            try {
                const messageBox = document.querySelector('.msg-form__contenteditable');
                if (!messageBox) return;
        
                for (const mutation of mutations) {
                    if (mutation.type === 'characterData' || mutation.type === 'childList') {
                        const content = messageBox.textContent.trim();
        
                        if (content === '') {
                            window.hideFloatingPanel();
                            continue;
                        }
        
                        if (content.startsWith('/')) {
                            const searchTerm = content.slice(1).trim().toLowerCase();
                            // Always update results even if panel is already showing
                            this.showFloatingPanel(messageBox);
                            this.updateSearchResults(searchTerm);
                        } else {
                            window.hideFloatingPanel();
                        }
                    }
                }
            } finally {
                this.isProcessing = false;
            }
        },

        updateSearchResults(searchTerm = '') {
            if (!window.floatingPanel) return;

            // console.log(window.floatingPanel)
            const resultsContainer = window.floatingPanel.querySelector('ul');
            if (!resultsContainer) return;

            const searchLower = searchTerm.toLowerCase();
            resultsContainer.innerHTML = '';

            const filteredResults = Array.from(this.shortcutsCache.entries())
                .filter(([_, shortcut]) =>
                    shortcut.title.toLowerCase().includes(searchLower) ||
                    shortcut.content.toLowerCase().includes(searchLower)
                )
                .map(([_, shortcut]) => shortcut);

            const fragment = document.createDocumentFragment();
            
            filteredResults.forEach((shortcut, index) => {
                const resultItem = this.createResultItem(shortcut, index === this.selectedIndex);
                fragment.appendChild(resultItem);
            });

            // console.log(filteredResults)

            resultsContainer.appendChild(fragment);
            this.maxIndex = filteredResults.length - 1;
            this.selectedIndex = Math.min(this.selectedIndex, this.maxIndex);
            this.filteredResults = filteredResults;
        },

        showFloatingPanel(messageBox) {
            const panel = window.setupFloatingPanel();
            if (!panel) return;
        
            const isNewlyOpened = panel.style.display !== 'block';
            
            panel.style.display = 'block';
            setTimeout(() => {
                panel.style.opacity = '1';
                panel.style.transform = 'translateY(0)';
            }, 0);
        
            const searchInput = panel.querySelector('.search-global-typeahead__input');
            if (searchInput) {
                // Only reset if newly opened
                if (isNewlyOpened) {
                    this.selectedIndex = -1;
                    this.maxIndex = -1;
                    this.filteredResults = [];
                    searchInput.value = '';
                    
                    // Remove existing listeners
                    searchInput.removeEventListener('input', this.handleSearch);
                    searchInput.removeEventListener('keydown', this.handleKeyboardNavigation);
        
                    // Add new listeners
                    searchInput.addEventListener('input', this.debounce((e) => {
                        this.selectedIndex = -1;
                        this.updateSearchResults(e.target.value);
                    }, 150));
        
                    searchInput.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
                }
        
                // Always focus and update results
                searchInput.focus();
                this.updateSearchResults(searchInput.value);
            }
        },

        handleKeyboardNavigation(event) {
            const { key } = event;

            switch (key) {
                case 'ArrowDown':
                    event.preventDefault();
                    this.selectedIndex = Math.min(this.selectedIndex + 1, this.maxIndex);
                    this.updateSearchResults(this.getCurrentSearchTerm());
                    this.scrollToSelected();
                    break;

                case 'ArrowUp':
                    event.preventDefault();
                    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                    this.updateSearchResults(this.getCurrentSearchTerm());
                    this.scrollToSelected();
                    break;

                case 'Enter':
                    if (this.selectedIndex >= 0 && this.filteredResults[this.selectedIndex]) {
                        this.applyShortcut(this.filteredResults[this.selectedIndex]);
                    }
                    break;
            }
        },

        scrollToSelected() {
            if (this.selectedIndex >= 0) {
                const resultsContainer = window.floatingPanel?.querySelector('ul');
                const selectedElement = resultsContainer?.children[this.selectedIndex];
                if (selectedElement) {
                    selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        },

        getCurrentSearchTerm() {
            return window.floatingPanel?.querySelector('.search-global-typeahead__input')?.value || '';
        },

        async setupMessageBoxObserver() {
            const messageBox = document.querySelector('.msg-form__contenteditable');
            if (!messageBox) {
                setTimeout(() => this.setupMessageBoxObserver(), 1000);
                return;
            }

            this.currentObserver = new MutationObserver(
                this.debounce((mutations) => this.handleMessageBoxChanges(mutations), 200)
            );

            this.currentObserver.observe(messageBox, {
                childList: true,
                subtree: true,
                characterData: true
            });

            await this.initializeFirestoreListener();
        },

        initialize() {
            if (this.currentObserver) {
                this.cleanup();
            }
            this.setupMessageBoxObserver();
        },

        cleanup() {
            if (this.currentObserver) {
                this.currentObserver.disconnect();
                this.currentObserver = null;
            }

            if (this.unsubscribeFirestore) {
                this.unsubscribeFirestore();
                this.unsubscribeFirestore = null;
                this.isFirestoreInitialized = false;
            }

            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
            }

            if (this.pTagObserver) {
                this.pTagObserver.disconnect();
                this.pTagObserver = null;
            }

            this.selectedIndex = -1;
            this.maxIndex = -1;
            this.filteredResults = [];
            this.shortcutsCache.clear();
            this.isProcessing = false;

            if (window.floatingPanel) {
                window.floatingPanel.remove();
                window.floatingPanel = null;
            }
        }
    }
};
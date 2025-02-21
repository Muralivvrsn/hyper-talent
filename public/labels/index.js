;(function() {
    // Early return if not on LinkedIn
    if (!window.location.hostname.includes('linkedin.com')) {
        // console.log('⚪ Init: Not on LinkedIn, aborting');
        return;
    }

    // Early return if manager already exists
    if (window.labelManager) {
        // console.log('⚪ Init: Label manager already exists');
        return;
    }

    class LabelManagerState {
        constructor() {
            if (window.labelManager) {
                // console.log('🔵 State: Instance already exists, returning existing instance');
                return window.labelManager;
            }

            // console.log('🔵 State: Constructor initialized');
            this.isInitialized = false;
            this.loading = true;
            this.labels = null;
            this.loadingTimeout = null;
            this.currentPath = '';
            
            // Components
            this.mainContainer = null;
            this.searchContainer = null;
            this.dropdownContainer = null;
            this.mainContainerId = 'label-manager-main';
            this.keyboardManager = null;

            this.urlObserver = null;
            this.lastUrl = location.href;
            this.lastContainer = null;
            this.debounceTimeout = null;

            this.handleLabelsUpdate = this.handleLabelsUpdate.bind(this);
            this.handleSearch = this.handleSearch.bind(this);
            this.handleKeyboardNavigation = this.handleKeyboardNavigation.bind(this);
            
            // Store the instance immediately
            window.labelManager = this;
            
            // console.log('🔵 State: Initial state set', { loading: this.loading });
            
            // Auto initialize
            this.initialize();
        }

        initialize() {
            // console.log('🔵 State: Initializing...');
            if (this.isInitialized) {
                // console.log('🔵 State: Already initialized, skipping');
                return;
            }
    
            this.currentPath = location.pathname;
            this.setupListeners();
            this.setupLoadingTimeout();
            this.setupObservers();
            this.initializeComponents();
            this.initializeKeyboardNavigation();
    
            this.isInitialized = true;
            // console.log('🔵 State: Initialization complete');
        }
        setupObservers() {
            // URL changes observer
            this.urlObserver = new MutationObserver(() => {
                const currentUrl = location.href;
                if (currentUrl !== this.lastUrl) {
                    this.lastUrl = currentUrl;
                    // Only trigger update if path changed
                    if (location.pathname !== this.currentPath) {
                        this.currentPath = location.pathname;
                        this.debounceUIUpdate();
                    }
                }
            });
        
            this.urlObserver.observe(document, {
                subtree: true,
                childList: true
            });
        
            // Only observe messaging container changes if we're on a messaging page
            if (location.pathname.includes('/messaging/thread')) {
                const bodyObserver = new MutationObserver(() => {
                    const currentContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
                    if (currentContainer && currentContainer !== this.lastContainer) {
                        this.lastContainer = currentContainer;
                        this.debounceUIUpdate();
                    }
                });
        
                bodyObserver.observe(document.body, {
                    subtree: true,
                    childList: true
                });
            }
        }
    
        debounceUIUpdate() {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
    
            this.debounceTimeout = setTimeout(() => {
                this.updateUI();
            }, 300); // 300ms debounce
        }
    
        updateUI() {
            // Remove existing elements
            const existingButton = document.querySelector('.label-manager-toggle');
            if (existingButton) {
                existingButton.remove();
            }
        
            if (this.mainContainer) {
                this.mainContainer.remove();
                this.mainContainer = null;  // Reset to null
                this.searchContainer = null; // Reset components
                this.dropdownContainer = null;
            }
        
            // Reinitialize components
            this.initializeComponents();
        
            // Reload labels if available
            if (this.labels) {
                this.dropdownContainer.updateContent(this.labels);
            }
        }
    
        createMainContainer() {
            let container = document.getElementById(this.mainContainerId);
            if (!container) {
                container = document.createElement('div');
                container.id = this.mainContainerId;
                
                // Determine page type and set appropriate class
                const isMessaging = location.pathname.includes('/messaging/thread');
                const isProfile = /linkedin\.com\/in\//.test(location.href);
                
                container.className = `label-manager-main-container ${isMessaging ? 'messaging' : 'profile'}`;
                container.setAttribute('role', 'application');
                container.setAttribute('aria-label', 'Label Manager');
                container.style.display = 'none'; // Initially hidden
            }
            return container;
        }

        initializeKeyboardNavigation() {
            this.keyboardManager = new window.KeyboardNavigationManager(this.mainContainerId);
            this.keyboardManager.initialize(`${this.searchContainer.id}-input`);

            // Listen for keyboard navigation events
            window.addEventListener('initiateKeyboardNavigation', this.handleKeyboardNavigation);
            window.addEventListener('dropdownContentUpdated', () => {
                this.keyboardManager.updateFocusableElements();
            });
        }

        handleKeyboardNavigation() {
            if (this.dropdownContainer) {
                this.keyboardManager.updateFocusableElements();
                this.keyboardManager.focusNext();
            }
        }
    
        initializeComponents() {
            // Check for existing button and remove it first
            const existingButton = document.querySelector('.label-manager-toggle');
            if (existingButton) {
                existingButton.remove();
            }
        
            // Create new button
            const toggleButton = document.createElement('button');
            toggleButton.className = 'label-manager-toggle';
            toggleButton.textContent = 'Labels';
            toggleButton.onclick = () => this.keyboardManager?.toggleVisibility();
        
            // Rest of the component initialization...
            this.mainContainer = this.createMainContainer();
            this.searchContainer = new window.SearchContainer('label-manager-search', {
                placeholder: 'Search labels...'
            });
            this.dropdownContainer = new window.DropdownContainer('label-manager-dropdown', {
                onLabelClick: async (label) => {
                    console.log('Label clicked:', label);
                    await window.labelCore.applyLabel(label.label_id)    
                },
                onLabelEdit: async (label) => {
                    try {
                        console.log('edit button clicked')
                    } catch (error) {
                        console.error('Edit label error:', error);
                    }
                },
                onLabelDelete: async (label) => {
                    try {
                        console.log(label)
                        await window.labelCore.deleteLabel(label.label_id, label.label_name)    
                        console.log('delete button clicked')
                    } catch (error) {
                        console.error('Delete label error:', error);
                    }
                },
                onLabelHover: (label, isHovered) => {
                    console.log('Label hover:', label.label_name, isHovered);
                }
            });
        
            this.mainContainer.innerHTML = '';
            this.mainContainer.appendChild(this.searchContainer.element);
            this.mainContainer.appendChild(this.dropdownContainer.element);
        
            // Set initial state
            if (this.status) {
                this.dropdownContainer.handleStateUpdate({
                    status: this.status,
                    labels: this.labels
                });
                
                // Only hide search during loading
                this.searchContainer.element.style.display = 
                    this.status === 'in_progress' ? 'none' : '';
            } else {
                // Initial loading state
                this.dropdownContainer.handleStateUpdate({
                    status: 'in_progress',
                    labels: null
                });
                this.searchContainer.element.style.display = 'none';
            }
        
            // Add container to the appropriate location
            const isMessaging = location.pathname.includes('/messaging/thread');
            if (isMessaging) {
                const startTime = Date.now();
                const maxWaitTime = 10000;
        
                const waitForMessagingContainer = () => {
                    const messageContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
                    
                    if (messageContainer) {
                        messageContainer.appendChild(toggleButton);
                        messageContainer.appendChild(this.mainContainer);
                    } else if (Date.now() - startTime < maxWaitTime) {
                        setTimeout(waitForMessagingContainer, 500);
                    } else {
                        document.body.appendChild(toggleButton);
                        document.body.appendChild(this.mainContainer);
                    }
                };
        
                waitForMessagingContainer();
            } else {
                document.body.appendChild(toggleButton);
                document.body.appendChild(this.mainContainer);
            }
        
            window.removeEventListener('searchValueChanged', this.handleSearch);
            window.addEventListener('searchValueChanged', this.handleSearch);
        }
    
        handleSearch(event) {
            const { value } = event.detail;
            if (this.dropdownContainer) {
                if (!value || value?.trim() === '' || value?.length===0) {
                    console.log('updaigng since we dont have the thing for filter')
                    this.dropdownContainer.updateContent(this.labels || {});
                } else {
                    this.dropdownContainer.filterContent(value);
                }
            }
        }
    
        setupListeners() {
            if (window.labelsDatabase) {
                window.labelsDatabase.removeListener(this.handleLabelsUpdate);
                window.labelsDatabase.addListener(this.handleLabelsUpdate);
            }
        }
    
        setupLoadingTimeout() {
            if (this.loadingTimeout) {
                clearTimeout(this.loadingTimeout);
            }
            
            this.loadingTimeout = setTimeout(() => {
                if (this.loading) {
                    this.loading = false;
                    this.onStateChange?.();
                    window.show_error('Database connection timeout. Please try again later.');
                }
            }, 60000);
        }
    
        handleLabelsUpdate(data) {
            console.log('Labels update:', data);
            this.status = data.status;
            this.labels = data.labels;
            
            if (this.loading && data.status !== 'in_progress') {
                clearTimeout(this.loadingTimeout);
                this.loading = false;
            }
        
            if (this.dropdownContainer) {
                // Pass both status and labels to dropdown
                this.dropdownContainer.handleStateUpdate({
                    status: data.status,
                    labels: data.labels
                });
        
                // Hide search only during loading
                this.searchContainer.element.style.display = 
                    data.status === 'in_progress' ? 'none' : '';
            }
        }
    
        destroy() {
            // console.log('🔵 State: Destroying state manager');
            
            if (window.labelsDatabase) {
                window.labelsDatabase.removeListener(this.handleLabelsUpdate);
            }
            window.removeEventListener('searchValueChanged', this.handleSearch);
            window.removeEventListener('initiateKeyboardNavigation', this.handleKeyboardNavigation);
            window.removeEventListener('dropdownContentUpdated', () => {
                this.keyboardManager?.updateFocusableElements();
            });
            
            if (this.loadingTimeout) {
                clearTimeout(this.loadingTimeout);
            }
            
            this.keyboardManager?.destroy();
            this.dropdownContainer?.destroy();
            this.searchContainer?.destroy();
            
            if (this.mainContainer) {
                this.mainContainer.remove();
                this.mainContainer = null;
            }
            
            this.isInitialized = false;
            window.labelManager = null;
        }
    }

    // Create the single instance
    // console.log('⚪ Init: Creating new label manager instance');
    window.labelManager = new LabelManagerState();
})();
// content.js
class LabelManager {
    constructor() {
        if (window.labelManager) return window.labelManager;

        this.state = {
            status: 'in_progress',
            isOpen: false,
            labels: [],
            currentPath: location.pathname,
            containerCheckTimeout: null,
            containerCheckInterval: null,
            initialized: false,
            activeTooltip: null,
            lastUrl: location.href,
            lastContainer: null,
            debounceTimeout: null
        };


        this.elements = {
            button: null,
            dropdown: null
        };

        // Bind methods
        this.handlers = {
            labelsUpdate: this.handleLabelsUpdate.bind(this),
            // urlChange: this.handleURLChange.bind(this),
            buttonClick: this.handleButtonClick.bind(this),
            outsideClick: this.handleOutsideClick.bind(this),
            resize: this.handleResize.bind(this),
            labelAction: this.handleLabelAction.bind(this)
        };

        window.labelManager = this;
        this.setupKeyboardNavigation();
        this.initialize();
    }

    initialize() {
        if (this.state.initialized || !window.location.hostname.includes('linkedin.com')) return;

        this.setupListeners();
        this.setupObservers();
        this.initializeUI();

        this.state.initialized = true;
    }


    setupListeners() {
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
            window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this)); // Fixed binding
        }

        document.addEventListener('click', this.handlers.outsideClick);
        window.addEventListener('resize', this.handlers.resize);
    }

    setupKeyboardNavigation() {
        const setupNavigation = () => {
            const dropdown = this.elements.dropdown;
            if (!dropdown) return;

            const searchInput = dropdown.querySelector('.label_search_input');

            const getNavigableLabels = () => {
                return Array.from(dropdown.querySelectorAll('.label_item'));
            };

            const handleKeydown = (event) => {
                if (!this.state.isOpen) return;

                // Don't handle navigation if editing
                if (event.target.classList.contains('label_edit_input')) return;

                const labels = getNavigableLabels();
                const currentIndex = labels.findIndex(label => label.classList.contains('focused'));

                switch (event.key) {
                    case 'ArrowDown':
                        event.preventDefault();
                        if (currentIndex === -1) {
                            // Focus first label
                            labels[0]?.classList.add('focused');
                            labels[0]?.focus();
                        } else if (currentIndex < labels.length - 1) {
                            // Focus next label
                            labels[currentIndex].classList.remove('focused');
                            labels[currentIndex + 1].classList.add('focused');
                            labels[currentIndex + 1].focus();
                        }
                        break;

                    case 'ArrowUp':
                        event.preventDefault();
                        if (currentIndex === 0) {
                            // Focus search input
                            labels[0].classList.remove('focused');
                            searchInput.focus();
                        } else if (currentIndex > 0) {
                            // Focus previous label
                            labels[currentIndex].classList.remove('focused');
                            labels[currentIndex - 1].classList.add('focused');
                            labels[currentIndex - 1].focus();
                        }
                        break;

                    case 'Enter':
                        if (document.activeElement.classList.contains('label_item')) {
                            event.preventDefault();
                            const labelId = document.activeElement.dataset.labelId;
                            this.handleLabelClick(labelId);
                        }
                        break;

                    case 'Escape':
                        this.state.isOpen = false;
                        this.updateDropdownVisibility();
                        break;
                }
            };

            dropdown.addEventListener('keydown', handleKeydown);
        };

        // Global keyboard listener for 'l' key
        const handleGlobalKeydown = (event) => {
            // Only trigger on 'l' key when not in an input or editable element
            if (event.key === 'l' &&
                !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
                !document.activeElement.isContentEditable) {

                // Check if on a profile page
                const isProfilePage = window.location.pathname.startsWith('/in/');

                // Prevent default 'l' key behavior
                event.preventDefault();

                // Open dropdown, position at top right
                this.state.isOpen = true;
                this.updateDropdownVisibility();

                // Focus on search input
                const searchInput = this.elements.dropdown?.querySelector('.label_search_input');
                searchInput?.focus();
            }
        };

        // Add global keydown listener
        document.addEventListener('keydown', handleGlobalKeydown);

        // Setup navigation after dropdown is created
        const originalCreateElements = this.createElements;
        this.createElements = (...args) => {
            originalCreateElements.apply(this, args);
            setupNavigation();
        };
    }

    createElements(container) {
        if (!container) return;
    
        this.cleanupElements();
    
        // Create button first
        this.elements.button = document.createElement('button');
        this.elements.button.className = 'hyper_label_button';
        this.elements.button.id = 'hyper_label_button';
        this.updateButtonState();
        this.elements.button.addEventListener('click', this.handlers.buttonClick);
    
        // Create dropdown
        this.elements.dropdown = document.createElement('div');
        this.elements.dropdown.className = 'hyper_label_dropdown';
        this.elements.dropdown.id = 'hyper_label_dropdown';
        this.elements.dropdown.style.display = 'none';
    
        // Add search input with icon
        const searchContainer = document.createElement('div');
        searchContainer.className = 'label_search_container';
        searchContainer.style.position = 'relative'; // For positioning the icon
    
        // Create search icon
        const searchIcon = document.createElement('div');
        searchIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="search-icon">
                <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 14L11 11" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        // searchIcon.style.position = 'absolute';
        // searchIcon.style.left = '12px';
        // searchIcon.style.top = '50%';
        // searchIcon.style.transform = 'translateY(-50%)';
        // searchIcon.style.pointerEvents = 'none'; // Ensure it doesn't interfere with input
    
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'label_search_input';
        searchInput.placeholder = 'Search or create label...';
        searchInput.style.paddingLeft = '36px'; // Make room for the icon
        searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
    
        // Append search icon and input to container
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
    
        // Create content container
        const isProfilePage = /linkedin\.com\/in\//.test(window.location.href);
    
        if (isProfilePage) {
            this.elements.button.style.position = 'fixed';
            this.elements.button.style.top = '20px';
            this.elements.button.style.right = '20px';
            this.elements.button.style.zIndex = '1000';
        }
        const contentContainer = document.createElement('div');
        contentContainer.className = 'dropdown_content';
    
        // Build dropdown structure
        this.elements.dropdown.appendChild(searchContainer);
        this.elements.dropdown.appendChild(contentContainer);
    
        // Insert into DOM
        container.appendChild(this.elements.button);
        document.body.appendChild(this.elements.dropdown);
    
        // Update content after structure is ready
        this.updateDropdownContent();
    }

    handleSearchInput(event) {
        const searchText = event.target.value.trim().toLowerCase();

        if (!searchText) {
            // If search is empty, show all labels
            this.updateDropdownContent();
            return;
        }

        // Group labels by type
        const owned = this.state.labels
            .filter(l => l.type === 'owned' && l.label_name.toLowerCase().includes(searchText));
        const shared = this.state.labels
            .filter(l => l.type === 'shared' && l.label_name.toLowerCase().includes(searchText));

        const content = `
            ${owned.length ? `
                <div class="label_section">
                    <div class="section_header">Owned</div>
                    ${owned.map(label => this.createLabelElement(label)).join('')}
                </div>
            ` : ''}
            ${shared.length ? `
                <div class="label_section">
                    <div class="section_header">Shared</div>
                    ${shared.map(label => this.createLabelElement(label)).join('')}
                </div>
            ` : ''}
            ${!owned.length && !shared.length ?
                '<div class="no_labels">No matching labels found. Press Enter to create.</div>' : ''
            }
        `;

        this.elements.dropdown.querySelector('.dropdown_content').innerHTML = content;

        // Reattach event listeners
        this.elements.dropdown.querySelectorAll('.action_btn').forEach(btn => {
            btn.addEventListener('click', this.handlers.labelAction);
        });
    }


    async handleLabelClick(labelId) {
        // console.log('Label clicked:', labelId);
        await window.labelsDatabase.applyLabel(labelId);
        // Your label click logic here
    }

    createLabelElement(label) {
        const id = `label_${label.label_id}`;
        return `
            <div id="${id}" 
                 class="label_item" 
                 data-label-id="${label.label_id}" 
                 tabindex="0">
                <div class="label_content">
                    <span class="color_dot" style="background-color: ${label.label_color}"></span>
                    <span class="label_name">${label.label_name}</span>
                </div>
                <div class="label_actions">
                    <button 
                        id="${id}_info" 
                        class="action_btn info_btn" 
                        data-action="info" 
                        data-label-id="${label.label_id}"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                        </svg>
                    </button>
                    ${label.type === 'owned' ? `
                        <button 
                            id="${id}_edit" 
                            class="action_btn edit_btn" 
                            data-action="edit" 
                            data-label-id="${label.label_id}"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button 
                            id="${id}_delete" 
                            class="action_btn delete_btn" 
                            data-action="delete" 
                            data-label-id="${label.label_id}"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                        
                    ` : ''}
                </div>
                <span class="label_count">${label.profiles.length}</span>
            </div>
        `;
    }

    async handleSearchKeydown(event) {
        if (event.key === 'Enter') {
            const searchText = event.target.value.trim();
            if (!searchText) return;

            // Get filtered labels
            const filteredLabels = this.state.labels.filter(label =>
                label.label_name.toLowerCase().includes(searchText.toLowerCase())
            );

            if (filteredLabels.length === 0) {
                // console.log('creating label:', searchText);
                await window.labelsDatabase.createLabel(searchText);
                event.target.value = '';
                this.updateDropdownContent();
            } else {
                // Programmatically trigger click
                const firstLabelId = filteredLabels[0].label_id;
                // console.log('Clicking first label:', firstLabelId);
                // await window.labelsDatabase.deleteLabel(firstLabelId);
                await window.labelsDatabase.applyLabel(firstLabelId);
                // Your click handling logic here
            }
        }
    }

    createTooltip(label) {
        const formattedDate = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        const isOwned = label.type === 'owned';
        const date = isOwned ? label.created_at : label.shared_at;
        const dateText = isOwned ? 'Created' : 'Shared';

        return `
            <div class="label_tooltip">
                <div class="tooltip_header">
                    <span class="tooltip_title">${label.label_name}</span>
                    <span class="tooltip_type">${label.type}</span>
                </div>
                <div class="tooltip_content">
                    <div class="tooltip_row">
                        <span>Profiles:</span>
                        <span>${label.profiles.length}</span>
                    </div>
                    <div class="tooltip_row">
                        <span>${dateText}:</span>
                        <span>${formattedDate(date)}</span>
                    </div>
                    ${!isOwned ? `
                        <div class="tooltip_row">
                            <span>Shared by:</span>
                            <span>${label.shared_by}</span>
                        </div>
                        <div class="tooltip_row">
                            <span>Permission:</span>
                            <span>${label.permission}</span>
                        </div>
                    ` : ''}
                    <div class="tooltip_row">
                        <span>Last updated:</span>
                        <span>${formattedDate(label.last_updated)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    updateDropdownContent() {
        if (!this.elements.dropdown) return;

        // Clear old content
        const contentContainer = this.elements.dropdown.querySelector('.dropdown_content') ||
            document.createElement('div');
        contentContainer.className = 'dropdown_content';

        if (this.state.status === 'in_progress') {
            contentContainer.innerHTML = '<div class="loading_message">Loading labels...</div>';
        } else if (this.state.status === 'logged_out') {
            // Show login prompt for logged out users
            contentContainer.innerHTML = `
            <div class="login_container">
                <p class="login_message">Please login through the extension to access your labels</p>
                <button class="login_button">Login</button>
            </div>
        `;

            // Add event listener to the login button
            setTimeout(() => {
                const loginButton = contentContainer.querySelector('.login_button');
                if (loginButton) {
                    loginButton.addEventListener('click', () => {
                        chrome.runtime.sendMessage({ type: 'HYPER_TALENT_LOGGIN' });
                    });
                }
            }, 0);
        } else {
            // Group labels by type
            const owned = this.state.labels.filter(l => l.type === 'owned');
            const shared = this.state.labels.filter(l => l.type === 'shared');

            contentContainer.innerHTML = `
        ${owned.length ? `
            <div class="label_section">
                <div class="section_header">Owned</div>
                ${owned.map(label => this.createLabelElement(label)).join('')}
            </div>
        ` : ''}
        ${shared.length ? `
            <div class="label_section">
                <div class="section_header">Shared</div>
                ${shared.map(label => this.createLabelElement(label)).join('')}
            </div>
        ` : ''}
        ${!owned.length && !shared.length ?
                    '<div class="no_labels">No labels available</div>' : ''
                }
        `;
        }

        // Update DOM if needed
        if (!contentContainer.parentNode) {
            this.elements.dropdown.appendChild(contentContainer);
        }

        this.elements.dropdown.querySelectorAll('.label_item').forEach(item => {
            item.addEventListener('click', async () => {
                const labelId = item.dataset.labelId;
                // console.log('Label clicked:', labelId);
                // await window.labelsDatabase.deleteLabel(labelId);
                await window.labelsDatabase.applyLabel(labelId);
                // Your click handling logic here
            });
        });

        this.elements.dropdown.querySelectorAll('.action_btn').forEach(btn => {
            btn.addEventListener('click', this.handlers.labelAction);
        });
    }

    async handleLabelAction(event) {
        event.stopPropagation();
        const { action, labelId } = event.currentTarget.dataset;
        const label = this.state.labels.find(l => l.label_id === labelId);

        if (!label) return;

        // If it's a direct label click (not button)
        if (!action) {
            // console.log('Label clicked:', labelId);
            // await window.labelsDatabase.deleteLabel(labelId);
            await window.labelsDatabase.applyLabel(labelId);
            return;
        }

        switch (action) {
            case 'delete':
                this.handleDeleteLabel(event.currentTarget, labelId);
                break;
            case 'edit':
                this.handleEditLabel(event.currentTarget.closest('.label_item'), label, labelId);
                break;
            case 'info':
                this.showTooltip(event.currentTarget, label);
                break;
        }
    }
    async handleDeleteLabel(deleteButton, labelId) {
        const label = this.state.labels.find(l => l.label_id === labelId);
        if (!label) return;

        // Store reference to label element
        const labelElement = deleteButton.closest('.label_item');

        // Show confirmation dialog
        window.alertDialog.show({
            title: 'Delete Label',
            message: `Are you sure you want to delete the label "${label.label_name}"?`,
            confirmText: 'Delete',
            confirmStyle: 'danger',
            onConfirm: async () => {
                try {
                    // Show loading state
                    labelElement.classList.add('deleting');
                    labelElement.style.pointerEvents = 'none';
                    deleteButton.innerHTML = '<div class="loading_spinner"></div>';
                    deleteButton.disabled = true;

                    // Delete from database
                    await window.labelsDatabase.deleteLabel(labelId);

                    // Remove from UI with animation
                    labelElement.style.opacity = '0';
                    labelElement.style.transform = 'translateX(10px)';
                    labelElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

                    setTimeout(() => {
                        labelElement.remove();
                    }, 300);
                } catch (error) {
                    console.error('Error deleting label:', error);
                    // Restore button state on error
                    deleteButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                `;
                    deleteButton.disabled = false;
                    labelElement.classList.remove('deleting');
                    labelElement.style.pointerEvents = '';

                    // Show error message
                    window.alertDialog.show({
                        title: 'Error',
                        message: 'Failed to delete label. Please try again.',
                        confirmText: 'OK',
                        confirmStyle: 'danger'
                    });
                }
            }
        });
    }

    async handleEditLabel(labelElement, label, labelId) {
        // Get elements
        const labelName = labelElement.querySelector('.label_name');
        const actionsContainer = labelElement.querySelector('.label_actions');

        // Store original content
        const originalContent = labelElement.innerHTML;

        // Create input container with specific class
        const inputContainer = document.createElement('div');
        inputContainer.className = 'label-edit-container';

        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = label.label_name;
        input.className = 'label_edit_input';

        // Add input to container
        inputContainer.appendChild(input);

        // Create save button
        const saveButton = document.createElement('button');
        saveButton.className = 'action_btn save_btn';
        saveButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 13l4 4L19 7"/>
            </svg>
        `;

        // Replace elements
        labelName.replaceWith(inputContainer);
        actionsContainer.innerHTML = '';
        actionsContainer.appendChild(saveButton);

        // Track editing state
        let isEditing = true;

        // Save changes function
        const saveChanges = async () => {
            const newName = input.value.trim();
            if (!newName || newName === label.label_name) {
                exitEditMode();
                return;
            }

            try {
                saveButton.innerHTML = '<div class="loading_spinner"></div>';
                saveButton.disabled = true;
                await window.labelsDatabase.editLabelName(labelId, newName);
                exitEditMode();

                // Show success state
                const nameElement = labelElement.querySelector('.label_name');
                if (nameElement) {
                    nameElement.textContent = newName;
                    nameElement.style.backgroundColor = 'rgba(52, 199, 89, 0.2)';
                    setTimeout(() => {
                        nameElement.style.backgroundColor = 'transparent';
                    }, 1500);
                }
            } catch (error) {
                console.error('Error updating label:', error);
                exitEditMode();
            }
        };

        // Handle outside clicks
        const handleClickOutside = (e) => {
            // Don't handle click events on the input or save button
            if (input === e.target || saveButton === e.target || inputContainer === e.target) {
                return;
            }

            // Exit edit mode if clicking outside the label element
            if (!labelElement.contains(e.target)) {
                exitEditMode();
            }
        };

        // Exit edit mode function
        function exitEditMode() {
            if (!isEditing) return;
            isEditing = false;
            document.removeEventListener('mousedown', handleClickOutside);
            labelElement.innerHTML = originalContent;
            this.attachLabelEventListeners(labelElement);
        }

        // Add event listeners
        document.addEventListener('mousedown', handleClickOutside);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                exitEditMode();
            }
        });

        saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            saveChanges();
        });

        // Focus input
        input.focus();
        input.select();
    }

    // Helper method to reattach event listeners
    attachLabelEventListeners(labelElement) {
        if (!labelElement) return;

        // Reattach action button listeners
        labelElement.querySelectorAll('.action_btn').forEach(btn => {
            btn.addEventListener('click', this.handlers.labelAction);
        });

        // Reattach label click listener
        const labelId = labelElement.dataset.labelId;
        labelElement.onclick = () => this.handleLabelClick(labelId);
    }
    showTooltip(element, label) {
        // Remove existing tooltip
        this.hideTooltip();

        // Create tooltip element directly instead of using innerHTML
        const tooltipElement = document.createElement('div');
        tooltipElement.className = 'label_tooltip';
        tooltipElement.innerHTML = `
            <div class="tooltip_header">
                <span class="tooltip_title">${label.label_name}</span>
                <span class="tooltip_type">${label.type}</span>
            </div>
            <div class="tooltip_content">
                <div class="tooltip_row">
                    <span>Profiles:</span>
                    <span>${label.profiles.length}</span>
                </div>
                <div class="tooltip_row">
                    <span>${label.type === 'owned' ? 'Created' : 'Shared'}:</span>
                    <span>${this.formatDate(label.type === 'owned' ? label.created_at : label.shared_at)}</span>
                </div>
                ${label.type === 'shared' ? `
                    <div class="tooltip_row">
                        <span>Shared by:</span>
                        <span>${label.shared_by}</span>
                    </div>
                    <div class="tooltip_row">
                        <span>Permission:</span>
                        <span>${label.permission}</span>
                    </div>
                ` : ''}
                <div class="tooltip_row">
                    <span>Last updated:</span>
                    <span>${this.formatDate(label.last_updated)}</span>
                </div>
            </div>
        `;

        // Add tooltip to body
        document.body.appendChild(tooltipElement);

        // Add enter animation class after append
        requestAnimationFrame(() => {
            tooltipElement.classList.add('tooltip_enter');
        });

        // Position tooltip
        const buttonRect = element.getBoundingClientRect();
        tooltipElement.style.position = 'fixed';
        tooltipElement.style.top = `${buttonRect.top - tooltipElement.offsetHeight - 10}px`;
        tooltipElement.style.left = `${buttonRect.left - (tooltipElement.offsetWidth / 2) + (buttonRect.width / 2)}px`;

        this.state.activeTooltip = tooltipElement;

        // Hide tooltip on outside click
        const hideOnOutsideClick = (e) => {
            if (!tooltipElement.contains(e.target) && !element.contains(e.target)) {
                this.hideTooltip();
                document.removeEventListener('click', hideOnOutsideClick);
            }
        };

        document.addEventListener('click', hideOnOutsideClick);
    }

    // Add this helper method for date formatting
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    hideTooltip() {
        if (this.state.activeTooltip) {
            this.state.activeTooltip.classList.remove('tooltip_enter');
            setTimeout(() => {
                this.state.activeTooltip?.remove();
                this.state.activeTooltip = null;
            }, 200); // Match CSS transition duration
        }
    }

    updateButtonState() {
        if (!this.elements.button) return;

        const loading = this.state.status === 'in_progress';
        this.elements.button.innerHTML = loading ?
            '<div class="loading_spinner"></div>' :
            'Labels';
        this.elements.button.disabled = loading;
    }

    handleLabelsUpdate(data) {
        // console.log(data)
        this.state.status = data.status;
        this.state.labels = data.labels || [];
        this.updateButtonState();
        this.updateDropdownContent();
    }
    setupObservers() {
        // URL changes observer
        const observer = new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== this.state.lastUrl) {
                this.state.lastUrl = currentUrl;

                // Only trigger update if path changed
                if (location.pathname !== this.state.currentPath) {
                    this.state.currentPath = location.pathname;
                    this.debounceUIUpdate();
                }
            }
        });

        observer.observe(document, {
            subtree: true,
            childList: true
        });

        // Only observe messaging container changes if we're on a messaging page
        if (location.pathname.includes('/messaging/thread')) {
            const bodyObserver = new MutationObserver(() => {
                const currentContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
                if (currentContainer && currentContainer !== this.state.lastContainer) {
                    this.state.lastContainer = currentContainer;
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
        if (this.state.debounceTimeout) {
            clearTimeout(this.state.debounceTimeout);
        }

        this.state.debounceTimeout = setTimeout(() => {
            const isMessaging = location.pathname.includes('/messaging/thread');

            if (isMessaging) {
                const container = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
                if (container) {
                    const existingButton = container.querySelector('.hyper_label_button');
                    if (!existingButton) {
                        this.createElements(container);
                    }
                }
            } else {
                const existingButton = document.querySelector('.hyper_label_button');
                if (!existingButton) {
                    this.createElements(document.body);
                }
            }
        }, 300);
    }

    initializeUI() {
        const isMessaging = location.pathname.includes('/messaging/thread');

        if (isMessaging) {
            this.waitForContainer();
        } else {
            const existingButton = document.querySelector('.hyper_label_button');
            if (!existingButton) {
                this.createElements(document.body);
            }
        }
    }

    waitForContainer() {
        clearInterval(this.state.containerCheckInterval);
        clearTimeout(this.state.containerCheckTimeout);

        const startTime = Date.now();
        const MAX_WAIT_TIME = 20000;
        const CHECK_INTERVAL = 50;

        const checkAndCreateButton = () => {
            const container = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
            const existingButton = container?.querySelector('.hyper_label_button');

            if (container && !existingButton) {
                clearInterval(this.state.containerCheckInterval);
                clearTimeout(this.state.containerCheckTimeout);
                this.createElements(container);
            } else if (Date.now() - startTime >= MAX_WAIT_TIME) {
                clearInterval(this.state.containerCheckInterval);
                clearTimeout(this.state.containerCheckTimeout);
            }
        };

        this.state.containerCheckInterval = setInterval(checkAndCreateButton, CHECK_INTERVAL);

        this.state.containerCheckTimeout = setTimeout(() => {
            clearInterval(this.state.containerCheckInterval);
        }, MAX_WAIT_TIME);
    }


    handleButtonClick() {
        if (this.state.status === 'in_progress') return;

        this.state.isOpen = !this.state.isOpen;
        this.updateDropdownVisibility();
    }

    updateDropdownVisibility() {
        if (!this.elements.dropdown) return;

        if (this.state.isOpen) {
            this.updateDropdownPosition();
            this.elements.dropdown.style.display = 'block';
            requestAnimationFrame(() => {
                this.elements.dropdown.classList.add('visible');
            });
        } else {
            this.elements.dropdown.classList.remove('visible');
            setTimeout(() => {
                if (!this.state.isOpen) {
                    this.elements.dropdown.style.display = 'none';
                }
            }, 200);
        }
    }

    handleOutsideClick(event) {
        if (!this.state.isOpen) return;

        // Don't close dropdown if we're editing a label
        if (this.elements.dropdown?.classList.contains('editing-mode')) {
            return;
        }

        if (!this.elements.dropdown?.contains(event.target) &&
            !this.elements.button?.contains(event.target)) {
            this.state.isOpen = false;
            this.updateDropdownVisibility();
        }
    }

    handleResize() {
        if (this.state.isOpen) {
            this.updateDropdownPosition();
        }
    }

    updateDropdownPosition() {
        if (!this.elements.button || !this.elements.dropdown) return;

        const buttonRect = this.elements.button.getBoundingClientRect();
        const isProfilePage = /linkedin\.com\/in\//.test(window.location.href);

        if (isProfilePage) {
            // Position at top right corner for profile pages
            this.elements.dropdown.style.position = 'fixed';
            this.elements.dropdown.style.top = '60px'; // Adjust this value based on the page layout
            this.elements.dropdown.style.right = '20px'; // Adjust this value for right margin
            this.elements.dropdown.style.left = 'auto'; // Override previous left positioning
            this.elements.dropdown.style.minWidth = '250px'; // Set a fixed width or adjust as needed
        } else {
            // Existing positioning logic for other pages
            this.elements.dropdown.style.position = 'fixed';
            this.elements.dropdown.style.top = `${buttonRect.bottom + 5}px`;
            this.elements.dropdown.style.left = `${buttonRect.left}px`;
            this.elements.dropdown.style.minWidth = `${buttonRect.width}px`;
        }
    }

    cleanupElements() {
        this.elements.button?.remove();
        this.elements.dropdown?.remove();
        this.elements.button = null;
        this.elements.dropdown = null;
    }

    destroy() {
        // Remove listeners
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        }
        document.removeEventListener('click', this.handleOutsideClick);
        window.removeEventListener('resize', this.handleResize);

        // Clear timers
        clearInterval(this.state.containerCheckInterval);
        clearTimeout(this.state.containerCheckTimeout);

        // Cleanup DOM
        this.cleanupElements();

        // Reset state
        document.removeEventListener('keydown', this.handleGlobalKeydown);
        this.state.initialized = false;
        window.labelManager = null;
    }
}

const styles = {
    styleId: 'linkedin-label-manager-styles',
    css: `
    .keyboard-hint {
    font-size: 12px;
    color: #666666;
    margin-left: 8px;
    opacity: 0.8;
}

.theme-dark .keyboard-hint {
    color: #a6a6a6;
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}
        .label-manager-container {
            position: relative;
        }

        .label-manager-container.messaging {
            margin-left: 16px;
        }

        .label-manager-container.profile {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        }

        .create-label-btn {
    width: 100%;
    text-align: left;
    padding: 4px 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font: inherit;
}
        .label-manager-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            border: none;
            outline: none;
            height: 32px;
            min-width: 90px;
            justify-content: center;
        }

        .theme-light .label-manager-button {
            background-color: #f3f6f8;
            color: #666666;
            box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }

        .theme-dark .label-manager-button {
            background-color: rgba(255, 255, 255, 0.1);
            color: #e7e7e7;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .label-manager-button:hover {
            transform: translateY(-1px);
        }

        .loading-spinner {
            width: 12px;
            height: 12px;
            border: 2px solid;
            border-radius: 50%;
            border-top-color: transparent !important;
            animation: spin 0.6s linear infinite;
            margin: 0 4px;
        }

        .theme-light .loading-spinner {
            border-color: rgba(0, 0, 0, 0.2);
        }

        .theme-dark .loading-spinner {
            border-color: rgba(255, 255, 255, 0.2);
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .loading-placeholder {
            animation: pulse 1.5s ease-in-out infinite;
            background: currentColor;
            border-radius: 4px;
            opacity: 0.1;
            height: 12px;
        }

        @keyframes pulse {
            0% { opacity: 0.1; }
            50% { opacity: 0.2; }
            100% { opacity: 0.1; }
        }

        .theme-light .label-manager-button:hover {
            background-color: #e7e9eb;
        }

        .theme-dark .label-manager-button:hover {
            background-color: rgba(255, 255, 255, 0.15);
        }

        .label-count {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
        }

        .theme-light .label-count {
            background-color: #e0e0e0;
            color: #666666;
        }

        .theme-dark .label-count {
            background-color: rgba(255, 255, 255, 0.2);
            color: #ffffff;
        }

        .labels-dropdown {
            position: absolute;
            margin-top: 8px;
            width: 280px;
            border-radius: 8px;
            overflow: hidden;
            opacity: 0;
            transform: translateY(-10px);
            visibility: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
        }

        .label-manager-container.messaging .labels-dropdown {
            left: 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .label-manager-container.profile .labels-dropdown {
            right: 0;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }

        .theme-light .labels-dropdown {
            background: #ffffff !important;
            border: 1px solid #e0e0e0;
        }

        .theme-dark .labels-dropdown {
            background: #1d2226 !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .labels-dropdown.show {
            background: white !important;
            opacity: 1;
            transform: translateY(0);
            visibility: visible;
        }

        .labels-section {
            padding: 12px;
        }

        .labels-section-title {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
            padding: 0 4px;
        }

        .theme-light .labels-section-title {
            color: #666666;
        }

        .theme-dark .labels-section-title {
            color: #a6a6a6;
        }

        .labels-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .label-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .label-item.loading {
            pointer-events: none;
        }

        .theme-light .label-item:hover {
            background-color: #f3f6f8;
        }

        .theme-dark .label-item:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .label-color {
            width: 12px;
            height: 12px;
            border-radius: 3px;
            margin-right: 8px;
        }

        .label-name {
            font-size: 14px;
            flex: 1;
        }

        .theme-light .label-name {
            color: #333333;
        }

        .theme-dark .label-name {
            color: #e7e7e7;
        }

        .label-profile-count {
            font-size: 12px;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: 500;
        }

        .theme-light .label-profile-count {
            background-color: #f3f6f8;
            color: #666666;
        }

        .theme-dark .label-profile-count {
            background-color: rgba(255, 255, 255, 0.1);
            color: #a6a6a6;
        }

        .labels-divider {
            height: 1px;
            margin: 8px 0;
        }

        .theme-light .labels-divider {
            background-color: #e0e0e0;
        }

        .theme-dark .labels-divider {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .labels-search-container {
            padding: 12px 12px 8px 12px;
            border-bottom: 1px solid;
        }

        .theme-light .labels-search-container {
            border-color: #e0e0e0;
        }

        .theme-dark .labels-search-container {
            border-color: rgba(255, 255, 255, 0.1);
        }

        .labels-search-input {
            width: 100%;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid;
            font-size: 14px;
            outline: none;
            transition: all 0.2s ease;
        }

        .theme-light .labels-search-input {
            background: #f3f6f8;
            border-color: #e0e0e0;
            color: #333333;
        }

        .theme-dark .labels-search-input {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);
            color: #e7e7e7;
        }

        .labels-search-input:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .labels-search-input:focus {
            border-color: #0a66c2;
        }

        .label-item.selected {
            background-color: rgba(10, 102, 194, 0.1);
        }

        .theme-dark .label-item.selected {
            background-color: rgba(10, 102, 194, 0.2);
        }

        .create-label-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            color: #0a66c2;
            font-weight: 500;
        }

        .theme-dark .create-label-item {
            color: #70b5f9;
        }

        .create-label-item:hover {
            background-color: rgba(10, 102, 194, 0.1);
        }

        .theme-dark .create-label-item:hover {
            background-color: rgba(112, 181, 249, 0.1);
        }

        .label-actions {
    display: none;
    gap: 8px;
    margin-left: auto;
}

.label-item:hover .label-actions {
    display: flex;
}

.edit-label-btn,
.delete-label-btn {
    padding: 2px;
    border-radius: 4px;
    border: none;
    background: none;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: all 0.2s ease;
}

.edit-label-btn:hover,
.delete-label-btn:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.1);
}

.theme-dark .edit-label-btn:hover,
.theme-dark .delete-label-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.label-item.editing .label-name {
    display: none;
}

.label-edit-input {
    flex: 1;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid #0a66c2;
    font-size: inherit;
    margin: 0 8px;
}

.theme-dark .label-edit-input {
    background: rgba(255, 255, 255, 0.1);
    border-color: #70b5f9;
    color: white;
}

        .empty-state {
            padding: 16px;
            text-align: center;
            color: #666666;
            font-size: 14px;
        }

        .theme-dark .empty-state {
            color: #a6a6a6;
        }
            // Add these CSS rules to improve visibility
.label-item {
    position: relative; // Add this to ensure proper positioning of actions
}

.label-item:hover, .label-item.selected {
    background-color: rgba(10, 102, 194, 0.1);
}

// Always show actions for selected items
.label-item.selected .label-actions {
    display: flex;
}

// Make actions more visible
.label-actions {
    position: absolute;
    right: 8px;
    display: none;
    gap: 8px;
    margin-left: auto;
    background: inherit; // This ensures buttons are visible on hover
}

// Make buttons more visible
.edit-label-btn,
.delete-label-btn {
    padding: 4px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.05);
    opacity: 0.8;
}

.theme-dark .edit-label-btn,
.theme-dark .delete-label-btn {
    background: rgba(255, 255, 255, 0.1);
}

// Add keyboard focus styles
.label-item:focus-visible {
    outline: 2px solid #0a66c2;
    outline-offset: -2px;
}

// Add visual cue for keyboard navigation
.label-item.selected {
    background-color: rgba(10, 102, 194, 0.15);
    box-shadow: inset 0 0 0 2px rgba(10, 102, 194, 0.3);
}

.theme-dark .label-item.selected {
    background-color: rgba(10, 102, 194, 0.25);
    box-shadow: inset 0 0 0 2px rgba(10, 102, 194, 0.4);
}
    `
};

class LinkedInManager {
    constructor() {
        this.isInitialized = false;
        this.container = null;
        this.dropdownVisible = false;
        this.labelsData = { owned: [], shared: [] };
        this.loading = true;
        this.theme = 'light';
        this.currentPath = '';
        this.searchTerm = '';
        this.selectedIndex = -1;
        this.filteredLabels = [];

        this.initialize();
    }

    initialize() {
        if (this.isInitialized) return;

        this.injectStyles();
        this.setupThemeListener();
        this.setupKeyboardListener();
        this.setupDatabaseListener();
        this.setupUrlChangeListener();
        this.updateUIBasedOnURL();

        this.isInitialized = true;
    }

    injectStyles() {
        if (!document.getElementById(styles.styleId)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = styles.styleId;
            styleSheet.textContent = styles.css;
            document.head.appendChild(styleSheet);
        }
    }

    setupThemeListener() {
        if (window.themeManager) {
            window.themeManager.addListener((theme) => {
                this.theme = theme;
                this.updateTheme();
            });
        }
    }

    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            // 'L' key to open dropdown
            if (e.key.toLowerCase() === 'l' && !this.isInputFocused()) {
                // console.log('Opening dropdown with L key');
                e.preventDefault(); // Add this to prevent 'l' from being typed

                // Only open if not already visible
                if (!this.dropdownVisible) {
                    this.showDropdown();
                    const searchInput = this.container?.querySelector('.labels-search-input');
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
                return; // Add return to prevent further processing
            }

            // Handle navigation when dropdown is visible
            if (this.dropdownVisible) {
                const searchInput = this.container?.querySelector('.labels-search-input');

                switch (e.key) {
                    case 'Escape':
                        // console.log('Closing dropdown with Escape');
                        e.preventDefault();
                        this.hideDropdown();
                        break;
                }
            }

            if (!this.isInputFocused()) {
                switch (e.key.toLowerCase()) {
                    case 'e':
                        if (this.selectedIndex !== -1) {
                            e.preventDefault();
                            const selectedItem = this.container.querySelector('.label-item.selected');
                            if (selectedItem) {
                                const labelId = selectedItem.dataset.labelId;
                                this.handleLabelEdit(labelId, selectedItem);
                            }
                        }
                        break;

                    case 'd':
                        if (this.selectedIndex !== -1) {
                            e.preventDefault();
                            const selectedItem = this.container.querySelector('.label-item.selected');
                            if (selectedItem) {
                                const labelId = selectedItem.dataset.labelId;
                                const labelName = selectedItem.querySelector('.label-name').textContent;
                                this.handleLabelDelete(labelId, labelName);
                            }
                        }
                        break;
                }
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.container && !this.container.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable;
    }

    setupDatabaseListener() {
        if (window.labelsDatabase) {
            window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        }
    }

    handleLabelsUpdate({ labels, loading }) {
        this.labelsData = labels;
        this.loading = loading;
        this.updateFilteredLabels();
        this.updateUI();
    }

    setupUrlChangeListener() {
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.updateUIBasedOnURL();
            }
        }).observe(document, { subtree: true, childList: true });

        this.updateUIBasedOnURL();
    }

    isMessagingPage() {
        return location.pathname.includes('/messaging/thread');
    }

    isProfilePage() {
        return location.pathname.match(/\/in\/[^/]+\/?$/);
    }

    updateUIBasedOnURL() {
        if (!this.isMessagingPage() && !this.isProfilePage()) {
            this.destroyUI();
            return;
        }

        if (this.isMessagingPage()) {
            this.watchForMessagingContainer();
        }

        if (this.isProfilePage()) {
            this.createProfileUI();
        }
    }

    watchForMessagingContainer() {
        const observer = new MutationObserver(() => {
            const targetContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
            if (targetContainer && !document.querySelector('.label-manager-container.messaging')) {
                this.createMessagingUI(targetContainer);
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    createMessagingUI(targetContainer) {
        this.destroyUI();
        this.container = this.createBaseContainer('messaging');
        targetContainer.insertBefore(this.container, targetContainer.children[2]);
        this.updateUI();
    }

    createProfileUI() {
        if (document.querySelector('.label-manager-container.profile')) return;

        this.destroyUI();
        this.container = this.createBaseContainer('profile');
        document.body.appendChild(this.container);
        this.updateUI();
    }

    getTotalLabels() {
        return this.labelsData.owned.length + this.labelsData.shared.length;
    }

    createBaseContainer(type) {
        const container = document.createElement('div');
        container.className = `label-manager-container ${type}`;
        container.innerHTML = `
            <button class="label-manager-button">
                <span>Labels</span>
                ${this.loading ?
                '<span class="loading-spinner"></span>' :
                `<span class="label-count">${this.getTotalLabels()}</span>`
            }
            </button>
            <div class="labels-dropdown">
               <div class="labels-search-container">
                    <input type="text" 
                        class="labels-search-input" 
                        placeholder="Search or create label..."
                        autocomplete="off"
                        ${this.loading ? 'disabled' : ''}
                    >
                </div>
                <div class="labels-section">
                    <div class="labels-section-title">My Labels</div>
                    <div class="labels-list owned-labels">
                        ${this.loading ? this.getLoadingPlaceholders() : ''}
                    </div>
                </div>
                <div class="labels-divider"></div>
                <div class="labels-section">
                    <div class="labels-section-title">Shared Labels</div>
                    <div class="labels-list shared-labels">
                        ${this.loading ? this.getLoadingPlaceholders() : ''}
                    </div>
                </div>
            </div>
        `;

        const button = container.querySelector('.label-manager-button');
        button.addEventListener('click', () => this.toggleDropdown());

        const searchInput = container.querySelector('.labels-search-input');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchInput.addEventListener('keydown', (e) => this.handleSearchKeydown(e));

        this.updateTheme();
        return container;
    }

    getLoadingPlaceholders() {
        return Array(3).fill(0).map(() => `
            <div class="label-item loading">
                <span class="loading-placeholder" style="width: 12px; height: 12px; border-radius: 3px; margin-right: 8px;"></span>
                <span class="loading-placeholder" style="flex: 1; height: 14px;"></span>
                <span class="loading-placeholder" style="width: 24px; height: 14px; margin-left: 8px;"></span>
            </div>
        `).join('');
    }

    handleSearch(value) {
        this.searchTerm = value.trim().toLowerCase();
        this.selectedIndex = -1;
        this.updateFilteredLabels();
        this.updateUI();
    }

    updateFilteredLabels() {
        const searchTerm = this.searchTerm.toUpperCase();
        const allLabels = [...this.labelsData.owned, ...this.labelsData.shared];
        this.filteredLabels = allLabels.filter(label =>
            label.label_name.toUpperCase().includes(searchTerm)
        );
    }

    handleSearchKeydown(e) {
        if (this.loading) return;

        const totalItems = this.filteredLabels.length + (this.searchTerm ? 1 : 0);
        const searchInput = e.target;

        // console.log('Search keydown:', e.key, 'Selected index:', this.selectedIndex);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, totalItems - 1);
                if (this.selectedIndex === -1) this.selectedIndex = 0;
                searchInput.blur(); // Unfocus input when navigating
                this.updateUI();
                break;
    
            case 'ArrowUp':
                e.preventDefault();
                if (this.selectedIndex <= 0) {
                    // If at first item or no selection, focus input
                    this.selectedIndex = -1;
                    searchInput.focus();
                } else {
                    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                    searchInput.blur();
                }
                this.updateUI();
                break;

            case 'Enter':
                e.preventDefault();
                // console.log('Enter pressed with index:', this.selectedIndex);

                // If no item is selected and we have search text, create new label
                if (this.selectedIndex === -1 && this.searchTerm) {
                    // console.log('Creating new label from search');
                    this.createNewLabel(this.searchTerm);
                    return;
                }

                // If selection is on create option
                if (this.selectedIndex === this.filteredLabels.length) {
                    // console.log('Creating new label from selection');
                    this.createNewLabel(this.searchTerm);
                    return;
                }

                // If a label is selected
                if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredLabels.length) {
                    // console.log('Selecting existing label');
                    const label = this.filteredLabels[this.selectedIndex];
                    this.handleLabelSelect(label);
                }
                break;

            case 'Tab':
                // Prevent closing dropdown on tab
                e.preventDefault();
                if (e.shiftKey) {
                    this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                } else {
                    this.selectedIndex = Math.min(this.selectedIndex + 1, totalItems - 1);
                }
                this.updateUI();
                break;

            case 'Escape':
                searchInput.blur();
                this.hideDropdown();
                break;
        }
    }

    async createNewLabel(labelName) {
        if (this.loading || !labelName) {
            // console.log('Cannot create label: loading or no name provided');
            window.show_error('Cannot create empty label');
            return;
        }
    
        // Clean up and capitalize the label name
        const cleanLabelName = labelName.trim().toUpperCase();
        if (!cleanLabelName) {
            // console.log('Cannot create label: empty name after trimming');
            window.show_error('Label name cannot be empty');
            return;
        }
    
        // Check for duplicate names
        const allLabels = [...this.labelsData.owned, ...this.labelsData.shared];
        const isDuplicate = allLabels.some(label => 
            label.label_name.toUpperCase() === cleanLabelName
        );
    
        if (isDuplicate) {
            // console.log('Cannot create label: duplicate name');
            window.show_error(`Label "${cleanLabelName}" already exists`);
            return;
        }
    
        // console.log('Creating new label:', cleanLabelName);
        window.start_action('create-label', 'Creating new label...');
    
        try {
            const labelColor = this.generateRandomColor();
            const labelId = `label_${Date.now()}`;
    
            const labelData = {
                label_id: labelId,
                label_name: cleanLabelName, // Store as uppercase
                label_color: labelColor,
                profiles: []
            };
    
            // console.log('Label data:', labelData);
            
            const success = await window.labelsDatabase.addLabel(labelData);
            if (success) {
                // console.log('Label created successfully');
                window.show_success(`Label "${cleanLabelName}" created successfully`);
    
                if (this.isProfilePage()) {
                    const profileId = this.getProfileIdFromURL();
                    if (profileId) {
                        // console.log('Adding profile to new label:', profileId);
                        await window.labelsDatabase.addProfileToLabel(labelId, profileId);
                    }
                }
    
                window.complete_action('create-label', true, 'Label created successfully');
                this.hideDropdown();
                
                // Clear the search input
                const searchInput = this.container?.querySelector('.labels-search-input');
                if (searchInput) {
                    searchInput.value = '';
                    this.handleSearch('');
                }
            }
        } catch (error) {
            console.error('Failed to create label:', error);
            window.show_error('Failed to create label');
            window.complete_action('create-label', false, 'Failed to create label');
        }
    
        // Ensure action is completed after 5 seconds
        setTimeout(() => {
            if (window.get_active_actions().includes('create-label')) {
                // console.log('Create label action timed out');
                window.complete_action('create-label', false, 'Create operation timed out');
            }
        }, 5000);
    }

    generateRandomColor() {
        const colors = [
            '#4CAF50', '#2196F3', '#9C27B0', '#F44336', '#FF9800',
            '#009688', '#673AB7', '#3F51B5', '#E91E63', '#FFC107'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    async handleLabelSelect(label) {
        if (this.loading) return;

        if (this.isProfilePage()) {
            await this.handleProfileLabelClick(label.label_id);
        } else {
            await this.handleMessageLabelClick(label.label_id);
        }
    }

    toggleDropdown() {
        this.dropdownVisible ? this.hideDropdown() : this.showDropdown();
    }

    showDropdown() {
        if (!this.container) return;
    
        const dropdown = this.container.querySelector('.labels-dropdown');
        dropdown.classList.add('show');
        this.dropdownVisible = true;
    
        // Focus input after a small delay to ensure dropdown is visible
        setTimeout(() => {
            const searchInput = this.container.querySelector('.labels-search-input');
            if (searchInput && !this.loading) {
                searchInput.focus();
            }
        }, 50);
    }

    hideDropdown() {
        if (!this.container) return;

        const dropdown = this.container.querySelector('.labels-dropdown');
        dropdown.classList.remove('show');
        this.dropdownVisible = false;

        this.searchTerm = '';
        this.selectedIndex = -1;
        this.updateUI();
    }

    updateTheme() {
        if (!this.container) return;

        this.container.classList.remove('theme-light', 'theme-dark');
        this.container.classList.add(`theme-${this.theme}`);
    }

    updateUI() {
        if (!this.container) return;

        // Update button state
        const button = this.container.querySelector('.label-manager-button');
        if (this.loading) {
            button.innerHTML = `<span>Labels</span><span class="loading-spinner"></span>`;
        } else {
            button.innerHTML = `<span>Labels</span><span class="label-count">${this.getTotalLabels()}</span>`;
        }

        // Update search input state
        const searchInput = this.container.querySelector('.labels-search-input');
        searchInput.disabled = this.loading;

        if (this.searchTerm) {
            this.updateSearchResults();
        } else {
            this.updateLabelsList('owned');
            this.updateLabelsList('shared');
        }
    }

    updateSearchResults() {
        const ownedContainer = this.container.querySelector('.owned-labels');
        const sharedContainer = this.container.querySelector('.shared-labels');

        if (this.loading) {
            ownedContainer.innerHTML = this.getLoadingPlaceholders();
            sharedContainer.innerHTML = '';
            return;
        }

        // Clear both containers
        ownedContainer.innerHTML = '';
        sharedContainer.innerHTML = '';

        // Show filtered results in owned container
        if (this.filteredLabels.length === 0 && !this.searchTerm) {
            ownedContainer.innerHTML = '<div class="empty-state">No labels found</div>';
        } else {
            ownedContainer.innerHTML = this.filteredLabels
                .map((label, index) => this.labelItemTemplate(label, index))
                .join('');

            // Show create option if search term doesn't match any existing labels
            if (this.searchTerm && !this.filteredLabels.some(l =>
                l.label_name.toLowerCase() === this.searchTerm.toLowerCase()
            )) {
                ownedContainer.innerHTML += `
                    <div class="create-label-item ${this.selectedIndex === this.filteredLabels.length ? 'selected' : ''}"
                         role="button"
                         tabindex="0">
                        <button class="create-label-btn">
                            <span>Create "${this.searchTerm}"</span>
                        </button>
                    </div>
                `;
            }
        }

        this.addLabelClickHandlers();
    }

    updateLabelsList(type) {
        const container = this.container.querySelector(`.${type}-labels`);

        if (this.loading) {
            container.innerHTML = this.getLoadingPlaceholders();
            return;
        }

        const labels = this.labelsData[type];

        if (labels.length === 0) {
            container.innerHTML = `<div class="empty-state">No ${type} labels</div>`;
            return;
        }

        container.innerHTML = labels
            .map(label => this.labelItemTemplate(label))
            .join('');

        this.addLabelClickHandlers();
    }

    addLabelClickHandlers() {
        if (this.loading) return;

        this.container.querySelectorAll('.label-item').forEach((item, index) => {
            const labelId = item.dataset.labelId;
            const label = [...this.labelsData.owned, ...this.labelsData.shared]
                .find(l => l.label_id === labelId);

            // Edit button handler
            const editBtn = item.querySelector('.edit-label-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleLabelEdit(labelId, item);
                });
            }

            // Delete button handler
            const deleteBtn = item.querySelector('.delete-label-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const labelName = item.querySelector('.label-name').textContent;
                    this.handleLabelDelete(labelId, labelName);
                });
            }

            // Label click handler
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.label-actions')) {
                    if (label) {
                        this.handleLabelSelect(label);
                    }
                }
            });

            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateUI();
            });
        });



        const createItem = this.container.querySelector('.create-label-item');
        if (createItem) {
            const handleCreate = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.searchTerm) {
                    // console.log('Creating label:', this.searchTerm);
                    this.createNewLabel(this.searchTerm);
                }
            };
    
            createItem.addEventListener('click', handleCreate);
            createItem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleCreate(e);
            });
        }
    }

    async handleProfileLabelClick(labelId) {
        if (this.loading) return;

        const profileId = this.getProfileIdFromURL();
        if (!profileId) return;

        const label = [...this.labelsData.owned, ...this.labelsData.shared]
            .find(l => l.label_id === labelId);

        if (!label) return;

        const hasProfile = label.profiles.some(p => p.profile_id === profileId);

        try {
            if (hasProfile) {
                await window.labelsDatabase.removeProfileFromLabel(labelId, profileId);
            } else {
                await window.labelsDatabase.addProfileToLabel(labelId, profileId);
            }
            this.hideDropdown();
        } catch (error) {
            console.error('Failed to update label:', error);
        }
    }

    handleMessageLabelClick(labelId) {
        // Implement message-specific label click handling
        // console.log('Message label clicked:', labelId);
    }

    getProfileIdFromURL() {
        const match = location.pathname.match(/\/in\/([^/]+)\/?$/);
        return match ? match[1] : null;
    }

    async handleLabelEdit(labelId, labelElement) {
        // Start the edit action with loading message
        window.show_loading('Editing label...');
        window.start_action('edit-label', 'Editing label...');

        const nameSpan = labelElement.querySelector('.label-name');
        const originalName = nameSpan.dataset.originalName;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'label-edit-input';
        input.value = originalName;

        nameSpan.after(input);
        labelElement.classList.add('editing');
        input.focus();

        const handleSave = async () => {
            const newName = input.value.trim();
            if (newName && newName !== originalName) {
                try {
                    await window.labelsDatabase.updateLabel(labelId, { label_name: newName });
                    window.show_success('Label updated successfully');
                    window.complete_action('edit-label', true, 'Label updated successfully');
                } catch (error) {
                    window.show_error('Failed to update label');
                    window.complete_action('edit-label', false, 'Failed to update label');
                }
            }
            labelElement.classList.remove('editing');
            input.remove();
        };

        input.addEventListener('blur', handleSave);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
                labelElement.classList.remove('editing');
                input.remove();
                window.complete_action('edit-label', false, 'Edit cancelled');
            }
        });

    }

    async handleLabelDelete(labelId, labelName) {
        window.alertDialog.show({
            title: 'Delete Label',
            message: `Are you sure you want to delete "${labelName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmStyle: 'danger',
            onConfirm: async () => {
                window.start_action('delete-label', 'Deleting label...');

                try {
                    await window.labelsDatabase.deleteLabel(labelId);
                    window.show_success('Label deleted successfully');
                    window.complete_action('delete-label', true, 'Label deleted successfully');
                } catch (error) {
                    window.show_error('Failed to delete label');
                    window.complete_action('delete-label', false, 'Failed to delete label');
                }
            }
        });
    }

    labelItemTemplate(label, index = -1) {
        const isSelected = index >= 0 && index === this.selectedIndex;
        
        return `
            <div class="label-item ${isSelected ? 'selected' : ''}" 
                 data-label-id="${label.label_id}"
                 role="button"
                 tabindex="0">
                <span class="label-color" style="background-color: ${label.label_color}"></span>
                <span class="label-name" data-original-name="${label.label_name}">
                    ${label.label_name}
                    ${isSelected ? '<span class="keyboard-hint">(E to edit, D to delete)</span>' : ''}
                </span>
                <span class="label-profile-count">${label.profiles?.length || 0}</span>
                <div class="label-actions">
                    <button class="edit-label-btn" title="Edit label (Press 'E')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span class="sr-only">Edit</span>
                    </button>
                    <button class="delete-label-btn" title="Delete label (Press 'D')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        <span class="sr-only">Delete</span>
                    </button>
                </div>
            </div>
        `;
    }

    destroyUI() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }

    destroy() {
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        }
        if (window.themeManager) {
            window.themeManager.removeListener(this.handleThemeUpdate);
        }

        document.removeEventListener('keydown', this.handleKeydown);
        document.removeEventListener('click', this.handleOutsideClick);

        this.destroyUI();

        const styleSheet = document.getElementById(styles.styleId);
        if (styleSheet) {
            styleSheet.remove();
        }

        this.isInitialized = false;
        this.dropdownVisible = false;
        this.labelsData = { owned: [], shared: [] };
    }
}

// Initialize only on LinkedIn
; (function () {
    if (!window.location.hostname.includes('linkedin.com')) return;
    if (window.linkedInManager) return;

    window.linkedInManager = new LinkedInManager();
})();
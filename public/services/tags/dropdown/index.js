// labelManagerState.js
class LabelManagerState {
    constructor() {
        console.log('🔵 State: Constructor initialized');
        this.isInitialized = false;
        this.loading = true;
        this.labels = null;
        this.currentTheme = 'light';
        this.loadingTimeout = null;
        this.currentPath = '';

        this.handleLabelsUpdate = this.handleLabelsUpdate.bind(this);
        this.handleThemeChange = this.handleThemeChange.bind(this);
        console.log('🔵 State: Initial state set', { loading: this.loading, theme: this.currentTheme });
    }

    initialize() {
        console.log('🔵 State: Initializing...');
        if (this.isInitialized) {
            console.log('🔵 State: Already initialized, skipping');
            return;
        }
        this.currentPath = location.pathname;
        console.log('🔵 State: Current path set to:', this.currentPath);
        this.setupListeners();
        this.setupLoadingTimeout();
        this.isInitialized = true;
        console.log('🔵 State: Initialization complete');
    }

    setupListeners() {
        console.log('🔵 State: Setting up listeners');
        if (window.labelsDatabase) {
            console.log('🔵 State: labelsDatabase found, adding listener');
            window.labelsDatabase.addListener(this.handleLabelsUpdate);
        }
        if (window.themeManager) {
            console.log('🔵 State: themeManager found, adding listener');
            window.themeManager.addListener(this.handleThemeChange);
        }
    }

    setupLoadingTimeout() {
        console.log('🔵 State: Setting up loading timeout');
        this.loadingTimeout = setTimeout(() => {
            if (this.loading) {
                console.log('🔵 State: Loading timeout triggered');
                this.loading = false;
                this.onStateChange?.();
                window.show_error('Database connection timeout. Please try again later.');
            }
        }, 60000);
    }

    handleLabelsUpdate({ labels, loading }) {
        console.log(labels)
        console.log('🔵 State: Labels updated', { 
            labelsReceived: !!labels, 
            loadingState: loading,
            currentLoading: this.loading
        });
        this.labels = labels;
        if (this.loading && !loading) {
            console.log('🔵 State: First load complete, clearing timeout');
            clearTimeout(this.loadingTimeout);
            this.loading = false;
        }
        this.onStateChange?.();
    }

    handleThemeChange(theme) {
        console.log('🔵 State: Theme changed', { newTheme: theme, oldTheme: this.currentTheme });
        this.currentTheme = theme;
        this.onThemeChange?.();
    }

    setStateChangeListener(callback) {
        console.log('🔵 State: State change listener set');
        this.onStateChange = callback;
    }

    setThemeChangeListener(callback) {
        console.log('🔵 State: Theme change listener set');
        this.onThemeChange = callback;
    }

    destroy() {
        console.log('🔵 State: Destroying state manager');
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        }
        if (window.themeManager) {
            window.themeManager.removeListener(this.handleThemeChange);
        }
        clearTimeout(this.loadingTimeout);
        this.isInitialized = false;
    }
}

// labelManagerUI.js
class LabelManagerUI {
    constructor(state) {
        console.log('🟡 UI: Constructor initialized');
        this.state = state;
        this.uiElements = new Map();
        this.isDropdownOpen = false;
        this.observer = null;
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
    }

    initialize() {
        console.log('🟡 UI: Initializing');
        this.state.setStateChangeListener(() => this.updateUI());
        this.state.setThemeChangeListener(() => this.updateThemeStyles());
        this.setupPageObserver();
        console.log('🟡 UI: Initialization complete');
    }

    // Add similar detailed logging to each method...
    toggleDropdown() {
        console.log('🟡 UI: Toggle dropdown called', { 
            currentState: this.isDropdownOpen,
            hasContainer: !!this.uiElements.get('container')
        });

        if (this.state.loading) {
            window.show_loading('Loading labels...', 2000);
            return;
        }
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    isMessagingPage() {
        return location.pathname.includes('/messaging/thread');
    }

    isProfilePage() {
        return location.pathname.match(/\/in\/[^/]+\/?$/);
    }

    setupPageObserver() {
        // Watch for URL changes
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.handlePageChange();
            }
        }).observe(document, { subtree: true, childList: true });

        this.handlePageChange();
    }

    handlePageChange() {
        if (this.isMessagingPage()) {
            this.watchForMessagingContainer();
        } else if (this.isProfilePage()) {
            this.createProfileUI();
        } else {
            this.destroyUI();
        }
    }

    watchForMessagingContainer() {
        if (this.observer) {
            this.observer.disconnect();
        }

        const targetSelector = '.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)';
        
        const checkAndCreate = () => {
            const targetContainer = document.querySelector(targetSelector);
            const existingUI = document.querySelector('.label-manager-container');

            if (targetContainer && !existingUI) {
                this.createMessagingUI(targetContainer);
                return true;
            }
            return false;
        };

        if (checkAndCreate()) return;

        this.observer = new MutationObserver(() => {
            if (checkAndCreate()) {
                this.observer.disconnect();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    updateLabelText(labelText, loadingSpinner) {
        if (this.state.loading) {
            labelText.textContent = 'Loading Labels ';
            loadingSpinner.style.display = 'inline-block';
            loadingSpinner.style.animation = 'spin 1s linear infinite';
        } else {
            labelText.textContent = 'Labels ';
            loadingSpinner.style.display = 'none';
        }
    }
    createMessagingUI(targetContainer) {
        const container = document.createElement('div');
        container.className = 'label-manager-container messaging';
        
        const labelText = document.createElement('span');
        labelText.className = 'label-text';
        
        // Add loading spinner next to text
        const loadingSpinner = document.createElement('span');
        loadingSpinner.className = 'label-loading-spinner';
        loadingSpinner.innerHTML = '↻';
        loadingSpinner.style.cssText = 'display: none; margin-right: 4px;';
        
        // Update the text based on loading state
        this.updateLabelText(labelText, loadingSpinner);
        
        const countBadge = document.createElement('span');
        countBadge.className = 'label-count-badge';
        
        container.appendChild(loadingSpinner);
        container.appendChild(labelText);
        container.appendChild(countBadge);
        
        container.addEventListener('click', () => this.toggleDropdown());
        
        targetContainer.insertBefore(container, targetContainer.children[2]);
        
        this.uiElements.set('container', container);
        this.uiElements.set('countBadge', countBadge);
        this.uiElements.set('labelText', labelText);
        this.uiElements.set('loadingSpinner', loadingSpinner);
        
        this.updateUI();
        this.updateThemeStyles();
    }

    createProfileUI() {
        const container = document.createElement('div');
        container.className = 'label-manager-container profile';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 300px;
            z-index: 99999;
        `;
        
        // Rest of the profile UI creation...
        this.uiElements.set('container', container);
        document.body.appendChild(container);
    }


    openDropdown() {
        const container = this.uiElements.get('container');
        if (!container) return;

        const dropdown = new LabelManagerDropdown(this.state, this).create();
        if (dropdown) {
            container.appendChild(dropdown);
            this.uiElements.set('dropdown', dropdown);
            this.isDropdownOpen = true;
            document.addEventListener('click', this.handleOutsideClick);
        }
    }

    closeDropdown() {
        const dropdown = this.uiElements.get('dropdown');
        if (dropdown) {
            dropdown.remove();
            this.uiElements.delete('dropdown');
            this.isDropdownOpen = false;
            document.removeEventListener('click', this.handleOutsideClick); 
        }
    }

    handleOutsideClick(e) {
        const container = this.uiElements.get('container');
        if (container && !container.contains(e.target)) {
            this.closeDropdown();
        }
    }

    updateUI() {
        const countBadge = this.uiElements.get('countBadge');
        const labelText = this.uiElements.get('labelText');
        const loadingSpinner = this.uiElements.get('loadingSpinner');
        
        if (!countBadge) return;
    
        if (labelText && loadingSpinner) {
            this.updateLabelText(labelText, loadingSpinner);
        }
    
        if (this.state.loading) {
            countBadge.innerHTML = '...';
            countBadge.style.backgroundColor = '#e5e7eb';
        } else if (!this.state.labels) {
            countBadge.textContent = '!';
            countBadge.style.backgroundColor = '#f87171';
        } else {
            const totalLabels = Object.values(this.state.labels).reduce((sum, arr) => sum + (arr?.length || 0), 0);
            countBadge.textContent = totalLabels;
            countBadge.style.backgroundColor = totalLabels > 0 ? 'rgb(209, 213, 219)' : 'rgb(229, 231, 235)';
        }
    }

    updateThemeStyles() {
        const container = this.uiElements.get('container');
        const dropdown = this.uiElements.get('dropdown');

        if (container) {
            const styles = window.labelManagerStyles.getContainerStyles(this.state.currentTheme);
            container.style.cssText += styles.base + styles.theme;
        }

        if (dropdown) {
            const styles = window.labelManagerStyles.getDropdownStyles(this.state.currentTheme);
            dropdown.style.cssText += styles.base + styles.theme;
        }
    }

    destroyUI() {
        if (this.observer) {
            this.observer.disconnect();
        }
        const container = this.uiElements.get('container');
        if (container) {
            container.remove();
        }
        this.uiElements.clear();
        this.isDropdownOpen = false;
    }

    destroy() {
        this.destroyUI();
        document.removeEventListener('click', (e) => this.handleOutsideClick(e));
    }
}

class LabelManagerDropdown {
    constructor(state, ui) {
        this.state = state;
        this.ui = ui;
    }

    create() {
        const container = this.ui.uiElements.get('container');
        if (!container) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'label-manager-dropdown';

        if (this.state.loading) {
            dropdown.innerHTML = '<div style="text-align: center; padding: 20px;">Loading labels...</div>';
        } else if (!this.state.labels) {
            dropdown.innerHTML = '<div style="text-align: center; padding: 20px;">No labels database found</div>';
        } else if (Object.keys(this.state.labels).length === 0) {
            dropdown.innerHTML = '<div style="text-align: center; padding: 20px;">No labels found. Create your first label!</div>';
        }

        if (this.state.labels && Object.keys(this.state.labels).length > 0) {
            const labelsList = document.createElement('div');
            labelsList.className = 'labels-list';
            
            Object.entries(this.state.labels).forEach(([category, labels]) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'label-category';
                categoryDiv.textContent = category;
                
                const labelsDiv = document.createElement('div');
                labelsDiv.className = 'labels-group';
                labels.forEach(label => {
                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'label-item';
                    labelDiv.textContent = label;
                    labelsDiv.appendChild(labelDiv);
                });
                
                categoryDiv.appendChild(labelsDiv);
                labelsList.appendChild(categoryDiv);
            });
            
            dropdown.appendChild(labelsList);
        }

        dropdown.addEventListener('click', (e) => e.stopPropagation());
        
        return dropdown;
    }
}

// labelManagerStyles.js - Handles all styling
// labelManagerStyles.js
window.labelManagerStyles = {
    injectStyles() {
        const styleId = 'label-manager-styles';
        if (document.getElementById(styleId)) return;

        const styleSheet = document.createElement('style');
        styleSheet.id = styleId;
        styleSheet.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .label-loading-spinner {
                display: inline-block;
                margin-right: 4px;
                font-size: 14px;
            }

            .label-text {
                margin-right: 4px;
            }

            .label-count-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 18px;
                height: 18px;
                padding: 0 4px;
                border-radius: 9px;
                font-size: 12px;
                font-weight: 500;
                line-height: 1;
            }

            .labels-list {
                padding: 4px 0;
            }

            .label-category {
                padding: 8px 12px;
                font-weight: 600;
                color: #666;
            }

            .labels-group {
                padding: 4px 12px;
            }

            .label-item {
                padding: 4px 8px;
                margin: 2px 0;
                border-radius: 4px;
                cursor: pointer;
            }

            .label-item:hover {
                background-color: #f3f4f6;
            }
        `;
        document.head.appendChild(styleSheet);
    },

    getContainerStyles: (theme) => ({
        base: `
            display: flex;
            align-items: center;
            padding: 4px 8px;
            margin-left: 8px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            position: relative;
        `,
        theme: theme === 'dark' ? `
            background-color: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            .label-item:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
        ` : `
            background-color: white;
            border: 1px solid rgb(229, 231, 235);
            color: black;
            .label-item:hover {
                background-color: #f3f4f6;
            }
        `
    }),

    getDropdownStyles: (theme) => ({
        base: `
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 4px;
            border-radius: 4px;
            min-width: 280px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1000;
            padding: 8px;
        `,
        theme: theme === 'dark' ? `
            background-color: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
        ` : `
            background-color: white;
            border: 1px solid rgb(229, 231, 235);
            color: black;
        `
    })
};

// labelManagerKey.js - Handles keyboard shortcuts
window.labelManagerKey = {
    initialize: (labelManager) => {
        console.log('🟢 Key: Initializing keyboard shortcuts');
        
        const handleKeyPress = (e) => {
            console.log('🟢 Key: Keypress detected', {
                key: e.key,
                target: e.target.tagName,
                isInput: window.labelManagerKey.isTargetInput(e.target)
            });
            
            if (e.key === 'l' && !window.labelManagerKey.isTargetInput(e.target)) {
                console.log('🟢 Key: "l" shortcut triggered');
                e.preventDefault();
                
                // Add loading check
                if (labelManager.state.loading) {
                    window.show_loading('Loading labels...', 2000);
                    return;
                }
                
                labelManager.ui.toggleDropdown();
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        console.log('🟢 Key: Keyboard listener added');
        
        return () => {
            console.log('🟢 Key: Cleaning up keyboard listener');
            document.removeEventListener('keydown', handleKeyPress);
        };
    },

    isTargetInput: (target) => {
        const result = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.contentEditable === 'true';
        console.log('🟢 Key: Input check', { 
            element: target.tagName, 
            isInput: result 
        });
        return result;
    }
};


class LabelManager {
    constructor() {
        console.log('🔴 Manager: Constructor initialized');
        this.state = new LabelManagerState();
        this.ui = new LabelManagerUI(this.state);
        this.initialize();
    }

    initialize() {
        console.log('🔴 Manager: Initializing');
        this.state.initialize();
        this.ui.initialize();
        this.cleanup = window.labelManagerKey.initialize(this);
        console.log('🔴 Manager: Initialization complete');
    }

    destroy() {
        console.log('🔴 Manager: Destroying instance');
        this.state.destroy();
        this.ui.destroy();
        this.cleanup?.();
    }
}

;(function() {
    console.log('⚪ Init: Starting LinkedIn check');
    if (!window.location.hostname.includes('linkedin.com')) {
        console.log('⚪ Init: Not on LinkedIn, aborting');
        return;
    }
    if (window.labelManager) {
        console.log('⚪ Init: Label manager already exists');
        return;
    }
    console.log('⚪ Init: Creating new instance');
    window.labelManager = new LabelManager();
})();
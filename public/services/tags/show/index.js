// label-manager.js
class LabelManager {
    constructor() {
        this.isInitialized = false;
        this.currentPath = '';
        this.uiElements = new Map();
        this.isDropdownOpen = false;
        this.selectedIndex = -1;
        this.labels = {};
        this.currentTheme = 'light';

        this.handleLabelsUpdate = this.handleLabelsUpdate.bind(this);
        this.handleThemeChange = this.handleThemeChange.bind(this);

        this.initialize();
    }

    initialize() {
        if (this.isInitialized) return;

        this.setupLabelsListener();
        this.setupThemeListener();
        this.setupUrlChangeListener();
        this.setupKeyboardListener();

        this.currentPath = location.pathname;
        this.isInitialized = true;
    }

    setupThemeListener() {
        if (window.themeManager) {
            window.themeManager.addListener(this.handleThemeChange);
        }
    }

    handleThemeChange(theme) {
        this.currentTheme = theme;
        this.updateThemeStyles();
    }

    updateThemeStyles() {
        const container = this.uiElements.get('container');
        const dropdown = this.uiElements.get('dropdown');
        const searchInput = this.uiElements.get('searchInput');
        const countBadge = this.uiElements.get('countBadge');

        if (container) {
            if (this.currentTheme === 'dark') {
                container.style.backgroundColor = 'rgba(0,0,0, 0.7)';
                container.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                container.style.color = 'white';
            } else {
                container.style.backgroundColor = 'white';
                container.style.borderColor = 'rgb(229, 231, 235)';
                container.style.color = 'black';
            }
        }

        if (dropdown) {
            if (this.currentTheme === 'dark') {
                dropdown.style.backgroundColor = '#1a1a1a';
                dropdown.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                dropdown.style.color = 'white';
            } else {
                dropdown.style.backgroundColor = 'white';
                dropdown.style.borderColor = 'rgb(229, 231, 235)';
                dropdown.style.color = 'black';
            }
        }

        if (searchInput) {
            if (this.currentTheme === 'dark') {
                searchInput.style.backgroundColor = '#2d2d2d';
                searchInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                searchInput.style.color = 'white !important';
            } else {
                searchInput.style.backgroundColor = 'white';
                searchInput.style.borderColor = 'rgb(229, 231, 235)';
                searchInput.style.color = 'black !important';
            }
        }

        // Update all label elements
        const labelElements = document.querySelectorAll('.label-element');
        labelElements.forEach(labelElement => {
            const labelId = labelElement.getAttribute('data-label-id');
            const label = this.findLabelById(labelId);
            if (label) {
                this.applyLabelThemeStyles(labelElement, label);
            }
        });
    }

    findLabelById(labelId) {
        const allLabels = [...(this.labels.owned || []), ...(this.labels.shared || [])];
        return allLabels.find(label => label.label_id === labelId);
    }

    applyLabelThemeStyles(labelElement, label) {
        if (this.currentTheme === 'dark') {
            labelElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            labelElement.style.color = label.label_color;
            
            // Update hover styles for dark theme
            labelElement.addEventListener('mouseenter', () => {
                if (!labelElement.isEditing) {
                    labelElement.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }
            });
            
            labelElement.addEventListener('mouseleave', () => {
                if (!labelElement.isEditing) {
                    labelElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
            });
        } else {
            labelElement.style.backgroundColor = 'transparent';
            labelElement.style.color = 'black';
            
            // Update hover styles for light theme
            labelElement.addEventListener('mouseenter', () => {
                if (!labelElement.isEditing) {
                    labelElement.style.backgroundColor = 'rgb(243, 244, 246)';
                }
            });
            
            labelElement.addEventListener('mouseleave', () => {
                if (!labelElement.isEditing) {
                    labelElement.style.backgroundColor = 'transparent';
                }
            });
        }

        // Update color dot
        const colorDot = labelElement.querySelector('.label-color-dot');
        if (colorDot) {
            colorDot.style.backgroundColor = label.label_color;
        }
    }


    setupLabelsListener() {
        if (window.labelsDatabase) {
            window.labelsDatabase.addListener(this.handleLabelsUpdate);
        }
    }

    handleLabelsUpdate({ labels }) {
        this.labels = labels
        this.updateUI(labels);
        if (this.isDropdownOpen) {
            this.updateDropdown(labels);
        }
    }

    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' && !this.isTargetInput(e.target)) {
                e.preventDefault();
                // Check if we're on either valid page
                if (this.isMessagingPage() || this.isProfilePage()) {
                    // console.log("this.toggledropdown")
                    this.toggleDropdown();
                    const searchInput = this.uiElements.get('searchInput');
                    // console.log('search input')
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
            }
        });
    }

    isTargetInput(target) {
        return target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.contentEditable === 'true';
    }


    isMessagingPage() {
        return location.pathname.includes('/messaging/thread');
    }

    isProfilePage() {
        return location.pathname.match(/\/in\/[^/]+\/?$/);
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

    updateUIBasedOnURL() {
        if (!this.isMessagingPage() && !this.isProfilePage()) {
            this.destroyUI();
            return;
        }

        if (this.isMessagingPage()) {
            const containerToRemove = document.querySelector('.label-manager-container.profile');
            if (containerToRemove) {
                containerToRemove.remove();
            }
            this.watchForMessagingContainer();


        }

        if (this.isProfilePage()) {
            this.watchForProfileContainer();
        }
    }

    watchForProfileContainer() {
        const checkAndCreate = () => {
            const targetContainer = document.querySelector('body');

            const existingUI = document.querySelector('.label-manager-container.profile');

            if (targetContainer && !existingUI) {
                this.createProfileUI(targetContainer);
                return true;
            }
            return false;
        };

        if (checkAndCreate()) return;

        const observer = new MutationObserver(() => {
            if (checkAndCreate()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    createProfileUI(container) {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-manager-container profile';
        labelContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 300px;
            z-index: 99999;

        `;

        labelContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        container.insertBefore(labelContainer, container.firstChild);
        this.uiElements.set('container', labelContainer);
    }

    checkAndCreateUI() {
        if (!this.currentPath.includes('messaging/thread')) {
            this.destroyUI();
            return;
        }

        // Only create if we're on messaging/thread page
        const checkAndCreate = () => {
            const targetContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
            const existingUI = document.querySelector('.label-manager-container.messaging');

            if (targetContainer && !existingUI && this.currentPath.includes('messaging/thread')) {
                this.createMessagingUI(targetContainer);
                return true;
            }
            return false;
        };

        // Initial check
        if (checkAndCreate()) return;

        // Setup observer for DOM changes
        const observer = new MutationObserver(() => {
            if (this.currentPath.includes('messaging/thread')) {
                if (checkAndCreate()) {
                    observer.disconnect();
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }


    watchForMessagingContainer() {
        const checkAndCreate = () => {
            const targetContainer = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
            const existingUI = document.querySelector('.label-manager-container.messaging');

            if (targetContainer && !existingUI) {
                this.createMessagingUI(targetContainer);
                return true;
            }
            return false;
        };

        // Initial check
        if (checkAndCreate()) return;

        // Setup observer for DOM changes
        const observer = new MutationObserver(() => {
            if (checkAndCreate()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    createMessagingUI(container) {
        const labelContainer = document.createElement('div');
        labelContainer.className = 'label-manager-container messaging';
        labelContainer.style.cssText = `
            display: flex;
            align-items: center;
            padding: 4px 8px;
            margin-left: 8px;
            border: 1px solid rgb(229, 231, 235);
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            position: relative;
        `;


        const labelText = document.createElement('span');
        labelText.textContent = 'Labels';
        labelText.style.marginRight = '4px';

        const countBadge = document.createElement('span');
        countBadge.className = 'label-count-badge';
        countBadge.style.cssText = `
            background-color: rgb(229, 231, 235);
            border-radius: 9999px;
            padding: 2px 6px;
            font-size: 12px;
            font-weight: 500;
        `;

        labelContainer.appendChild(labelText);
        labelContainer.appendChild(countBadge);

        labelContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        container.insertBefore(labelContainer, container.children[2]);

        this.uiElements.set('countBadge', countBadge);
        this.uiElements.set('container', labelContainer);

        if (window.labelsDatabase) {
            const { labels } = window.labelsDatabase.state;
            this.updateUI(labels);
        }
    }

    createDropdown(labels) {
        const dropdown = document.createElement('div');
        dropdown.className = 'label-manager-dropdown';
        const baseDropdownStyles = `
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 4px;
            border-radius: 4px;
            min-width: 280px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        
        dropdown.style.cssText = baseDropdownStyles + (this.currentTheme === 'dark' 
            ? `background: #1a1a1a; border: 1px solid rgba(255, 255, 255, 0.2); color: white;`
            : `background: white; border: 1px solid rgb(229, 231, 235); color: black;`);

        // Search input
        const searchContainer = document.createElement('div');
        searchContainer.style.padding = '8px';
        searchContainer.style.borderBottom = '1px solid rgb(229, 231, 235)';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search or create label...';
        searchInput.className = 'label-search-input';
        searchInput.style.cssText = `
            width: 100%;
            padding: 6px 8px;
            border: 1px solid rgb(229, 231, 235);
            border-radius: 4px;
            font-size: 14px;
            outline: none;
        `;

        searchContainer.appendChild(searchInput);
        dropdown.appendChild(searchContainer);

        // Store reference to search input
        this.uiElements.set('searchInput', searchInput);

        // Owned Tags Section with filtered labels
        const ownedSection = this.createLabelSection('Owned Labels', labels.owned || []);
        dropdown.appendChild(ownedSection);

        // Shared Tags Section
        const sharedSection = this.createLabelSection('Shared Labels', labels.shared || []);
        dropdown.appendChild(sharedSection);

        dropdown.addEventListener('keydown', (e) => {
            const visibleLabels = Array.from(document.querySelectorAll('.label-element'))
                .filter(el => el.style.display !== 'none');
            const searchInput = this.uiElements.get('searchInput');

            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0 && visibleLabels[this.selectedIndex]) {
                        // console.log('Label clicked:', visibleLabels[this.selectedIndex].getAttribute('data-label-id'));
                        this.applyLabel(visibleLabels[this.selectedIndex].getAttribute('data-label-id'))
                        const searchInput = this.uiElements.get('searchInput');
                        if (searchInput) {
                            // Reset selection index to keep focus on search
                            this.selectedIndex = -1;
                            searchInput.focus();
                        }
                    }
                    break;

                case 'e':
                    if (this.selectedIndex >= 0 && visibleLabels[this.selectedIndex]) {
                        e.preventDefault();
                        // console.log('Edit button clicked for label:', visibleLabels[this.selectedIndex].getAttribute('data-label-id'));
                    }
                    break;

                case 'd':
                    if (this.selectedIndex >= 0 && visibleLabels[this.selectedIndex]) {
                        e.preventDefault();
                        // console.log('Delete button clicked for label:', visibleLabels[this.selectedIndex].getAttribute('data-label-id'));
                    }
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    if (visibleLabels.length > 0) {
                        if (document.activeElement === searchInput) {
                            this.selectedIndex = 0;
                        } else {
                            this.selectedIndex = Math.min(
                                this.selectedIndex + 1,
                                visibleLabels.length - 1
                            );
                        }
                        this.updateSelection(visibleLabels);
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (this.selectedIndex <= 0) {
                        this.selectedIndex = -1;
                        searchInput.focus();
                    } else {
                        this.selectedIndex = this.selectedIndex - 1;
                        this.updateSelection(visibleLabels);
                    }
                    break;
            }
        });

        searchInput.addEventListener('input', () => {
            this.filterLabels(searchInput.value);
        });

        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });


        searchInput.addEventListener('keydown', (e) => {
            const visibleLabels = Array.from(document.querySelectorAll('.label-element'))
                .filter(el => el.style.display !== 'none');

            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = searchInput.value.trim().toLowerCase();
                if (searchTerm && !visibleLabels.length) {
                    // console.log('Creating label:', searchTerm);
                    this.createLabelItem(searchTerm);
                } else if (visibleLabels.length > 0) {
                    // console.log('Label clicked:', visibleLabels[0].getAttribute('data-label-id'));
                    const searchInput = this.uiElements.get('searchInput');
                    if (searchInput) {
                        // Reset selection index to keep focus on search
                        this.selectedIndex = -1;
                        searchInput.focus();
                    }
                    this.applyLabel(visibleLabels[0].getAttribute('data-label-id'))
                }
            }
        });

        return dropdown;
    }

    createLabelSection(title, labels) {
        const section = document.createElement('div');
        section.className = 'label-section';
        section.style.padding = '8px';

        const titleElement = document.createElement('div');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            font-weight: 600;
            margin-bottom: 8px;
            color: rgb(107, 114, 128);
            font-size: 12px;
        `;
        section.appendChild(titleElement);

        labels.forEach(label => {
            const labelElement = this.createLabelElement(label);
            section.appendChild(labelElement);
        });

        return section;
    }

    async createLabelItem(searchTerm) {
        const capitalizedTerm = searchTerm.trim().toUpperCase();
        const actionId = `${capitalizedTerm}`;

        // Check if action can be started
        if (!window.start_action(actionId, 'Creating new label...')) {
            window.show_warning('A label creation is already in progress. Please wait.');
            return false;
        }

        try {
            // Check if label already exists
            const existingLabel = [...(this.labels.owned || [])]
                .find(label => label.label_name.toUpperCase() === capitalizedTerm);

            if (existingLabel) {
                window.complete_action(actionId, false, 'Label already exists');
                window.show_warning('Label already exists');
                return false;
            }

            // Get profile data and create label
            const profileData = await window.labelManagerUtils.getProfileInfo();
            console.log(profileData)
            const result = await window.labelsDatabase.addLabel({
                label_name: capitalizedTerm,
                label_id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                label_color: window.labelManagerUtils.getRandomColor(),
            }, profileData);

            if (result) {
                window.complete_action(actionId, true, 'Label created successfully');
                
                // window.show_success(`Label "${capitalizedTerm}" created successfully`);
                return true;
            } else {
                throw new Error('Failed to create label');
            }
        } catch (error) {
            console.error('Failed to create label:', error);
            window.complete_action(actionId, false, 'Failed to create label');
            // window.show_error('Failed to create label');
            return false;
        }
    }

    createLabelElement(label) {
        const labelElement = document.createElement('div');
        labelElement.className = 'label-element';
        labelElement.tabIndex = 0;
        labelElement.role = 'button';
        labelElement.setAttribute('data-label-name', label.label_name);
        labelElement.setAttribute('data-label-id', label.label_id);
        labelElement.style.cssText = `
            display: flex;
            align-items: center;
            padding: 6px 8px;
            margin: 2px 0;
            border-radius: 4px;
            cursor: pointer;
            position: relative;
        `;
        this.applyLabelThemeStyles(labelElement, label);
        // Color indicator
        const colorDot = document.createElement('span');
        colorDot.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
            background-color: ${label.label_color};
        `;

        // Label name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = label.label_name;
        nameSpan.style.cssText = `
            flex: 1;
            outline: none;
            padding: 2px 4px;
            border-radius: 2px;
            min-width: 50px;
        `;

        // Profile count
        const countSpan = document.createElement('span');
        countSpan.textContent = (label.profiles?.length || 0);
        countSpan.style.cssText = `
            background-color: rgb(229, 231, 235);
            border-radius: 9999px;
            padding: 2px 6px;
            font-size: 12px;
            margin-left: 8px;
        `;

        // Actions container (visible on hover)
        const actionsContainer = document.createElement('div');
        actionsContainer.style.cssText = `
            display: none;
            position: absolute;
            right: 8px;
            gap: 4px;
        `;

        let isEditing = false;

        const finishEditing = async (shouldSave = false) => {
            if (!isEditing) return;
        
            isEditing = false;
            nameSpan.contentEditable = 'false';
            nameSpan.style.backgroundColor = '';
            nameSpan.style.border = '';
        
            if (shouldSave) {
                const newName = nameSpan.textContent.trim().toUpperCase();
                if (newName && newName !== label.label_name) {
                    try {
                        const success = await window.labelsDatabase.editLabel(label.label_id, {
                            label_name: newName,
                            label_color: label.label_color
                        });
        
                        if (success) {
                            label.label_name = newName;
                            labelElement.setAttribute('data-label-name', newName);
                            window.show_success('Label updated');
                        } else {
                            nameSpan.textContent = label.label_name;
                            window.show_error('Failed to update label');
                        }
                    } catch (error) {
                        console.error('Error updating label:', error);
                        nameSpan.textContent = label.label_name;
                        window.show_error('Failed to update label');
                    }
                }
            } else {
                // If not saving, revert to original name
                nameSpan.textContent = label.label_name;
            }
        };

        const startEditing = (e) => {
            e.stopPropagation();
            if (isEditing) return;

            isEditing = true;
            nameSpan.contentEditable = 'true';
            nameSpan.style.backgroundColor = 'white';
            nameSpan.style.border = '1px solid #e5e7eb';

            // Select all text and focus
            const range = document.createRange();
            range.selectNodeContents(nameSpan);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            nameSpan.focus();
        };

        // Edit button
        const editButton = document.createElement('button');
        editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        editButton.style.marginRight = '4px';
        editButton.onclick = startEditing;

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
        deleteButton.onclick = async (e) => {
            e.stopPropagation();
            try {
                if (!window.start_action('delete-label', 'Deleting a label...')) {
                    window.show_warning('Deleting another label, please wait.');
                    return;
                }
                const success = await window.labelsDatabase.deleteLabel(label.label_id);
                if (success) {
                    window.complete_action('delete-label', true, 'Label deleted');
                } else {
                    window.complete_action('delete-label',false,'Failed to delete label');
                }
            } catch (error) {
                console.error('Error deleting label:', error);
                window.complete_action('delete-label',false, 'Failed to delete label');
            }
        };

        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(deleteButton);

        labelElement.appendChild(colorDot);
        labelElement.appendChild(nameSpan);
        labelElement.appendChild(countSpan);
        if (!label.owned_by || label.owned_by === 'mine') {
            labelElement.appendChild(actionsContainer);
        }

        nameSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                isEditing = false;
                nameSpan.contentEditable = 'false';
                nameSpan.textContent = label.label_name;
                nameSpan.style.backgroundColor = '';
                nameSpan.style.border = '';
            }
        });

        // Hover effects
        labelElement.addEventListener('mouseenter', () => {
            if (!isEditing) {
                labelElement.style.backgroundColor = 'rgb(243, 244, 246)';
                actionsContainer.style.display = 'flex';
                countSpan.style.display = 'none';
            }
        });

        labelElement.addEventListener('mouseleave', () => {
            if (!isEditing) {
                labelElement.style.backgroundColor = '';
                actionsContainer.style.display = 'none';
                countSpan.style.display = 'inline';
            }
        });

        // Owner tooltip for shared labels
        if (label.owned_by && label.owned_by !== 'mine') {
            labelElement.title = `Owned by ${label.owned_by}`;
        }

        // Label click handler
        labelElement.addEventListener('click', () => {
            if (!isEditing) {
                const searchInput = this.uiElements.get('searchInput');
                if (searchInput) {
                    this.selectedIndex = -1;
                    searchInput.focus();
                }
                this.applyLabel(label.label_id);
            }
        });

        return labelElement;
    }


    toggleDropdown() {
        // console.log(this.isDropdownOpen)
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        const container = this.uiElements.get('container');
        // console.log(container)
        if (!container) return;

        this.closeDropdown();

        if (window.labelsDatabase) {
            const { labels } = window.labelsDatabase.state;
            const dropdown = this.createDropdown(labels);
            container.appendChild(dropdown);
            this.uiElements.set('dropdown', dropdown);
            this.isDropdownOpen = true;

            // Focus search input
            const searchInput = this.uiElements.get('searchInput');
            if (searchInput) {
                // Reset selection index to keep focus on search
                this.selectedIndex = -1;
                searchInput.focus();
            }

            // Add outside click handler
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick);
            }, 0);
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

    handleOutsideClick = (e) => {
        const container = this.uiElements.get('container');
        const dropdown = this.uiElements.get('dropdown');
        const targetEl = e.target;

        // Don't close if clicking inside dropdown or container
        if (container && dropdown &&
            !dropdown.contains(targetEl) &&
            !container.contains(targetEl)) {
            this.closeDropdown();
        }
    }

    updateUI(labels) {
        const countBadge = this.uiElements.get('countBadge');
        if (!countBadge) return;

        const totalLabels = (labels.owned?.length || 0) + (labels.shared?.length || 0);
        countBadge.textContent = totalLabels;
        countBadge.style.backgroundColor = totalLabels > 0 ? 'rgb(209, 213, 219)' : 'rgb(229, 231, 235)';
    }

    updateSelection(visibleLabels) {
        const allLabels = document.querySelectorAll('.label-element');
        const searchInput = this.uiElements.get('searchInput');

        allLabels.forEach(el => {
            el.style.backgroundColor = '';
        });

        if (this.selectedIndex >= 0 && visibleLabels[this.selectedIndex]) {
            const selectedLabel = visibleLabels[this.selectedIndex];
            selectedLabel.style.backgroundColor = 'rgb(243, 244, 246)';
            selectedLabel.focus(); // Add focus to the selected label
            selectedLabel.scrollIntoView({ block: 'nearest' });
        }
    }

    async applyLabel(labelId) {
        const profileData = await window.labelManagerUtils.getProfileInfo();
        console.log(profileData)
        window.labelsDatabase.addProfileToLabel(labelId, profileData.profile_id, profileData);
    }
    filterLabels(searchTerm) {
        const labelElements = document.querySelectorAll('.label-element');
        const sections = document.querySelectorAll('.label-section');
        searchTerm = searchTerm.toLowerCase();
        let hasVisibleLabels = false;

        labelElements.forEach(el => {
            const labelName = el.getAttribute('data-label-name').toLowerCase();
            const isVisible = labelName.includes(searchTerm);
            el.style.display = isVisible ? 'flex' : 'none';
            if (isVisible) hasVisibleLabels = true;
        });

        // Hide sections if no matching labels
        sections.forEach(section => {
            const hasVisibleChildren = Array.from(section.querySelectorAll('.label-element'))
                .some(el => el.style.display !== 'none');
            section.style.display = hasVisibleChildren ? 'block' : 'none';
        });

        // Don't set selectedIndex or update selection when filtering
        // Let it happen only on arrow key navigation
        // const visibleLabels = Array.from(document.querySelectorAll('.label-element'))
        //     .filter(el => el.style.display !== 'none');
    }

    updateDropdown(labels) {
        const container = this.uiElements.get('container');
        if (!container || !this.isDropdownOpen) return;

        const oldDropdown = this.uiElements.get('dropdown');
        if (oldDropdown) {
            const newDropdown = this.createDropdown(labels);
            container.replaceChild(newDropdown, oldDropdown);
            this.uiElements.set('dropdown', newDropdown);
        }
    }

    destroyUI() {
        const container = this.uiElements.get('container');
        if (container) {
            container.remove();
            this.uiElements.clear();
        }
        this.isDropdownOpen = false;
    }

    destroy() {
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        }
        if (window.themeManager) {
            window.themeManager.removeListener(this.handleThemeChange);
        }
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('keydown', this.setupKeyboardListener);

        this.destroyUI();
        this.isInitialized = false;
        this.currentPath = '';
    }
}

// Initialize only on LinkedIn and if not already present
; (function () {
    if (!window.location.hostname.includes('linkedin.com')) return;
    if (window.labelManager) return;

    window.labelManager = new LabelManager();
})();
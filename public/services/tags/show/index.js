// label-manager.js
class LabelManager {
    constructor() {
        this.isInitialized = false;
        this.currentPath = '';
        this.uiElements = new Map();
        this.isDropdownOpen = false;
        this.selectedIndex = -1;

        this.handleLabelsUpdate = this.handleLabelsUpdate.bind(this);

        this.initialize();
    }

    initialize() {
        if (this.isInitialized) return;

        this.setupLabelsListener();
        this.setupUrlChangeListener();
        this.setupKeyboardListener();

        this.currentPath = location.pathname;
        // this.checkAndCreateUI();

        this.isInitialized = true;
    }


    setupLabelsListener() {
        if (window.labelsDatabase) {
            window.labelsDatabase.addListener(this.handleLabelsUpdate);
        }
    }

    handleLabelsUpdate({ labels }) {
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
                    console.log("this.toggledropdown")
                    this.toggleDropdown();
                    const searchInput = this.uiElements.get('searchInput');
                    console.log('search input')
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
        labelText.textContent = 'Tags';
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
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 4px;
            background: white;
            border: 1px solid rgb(229, 231, 235);
            border-radius: 4px;
            min-width: 280px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1000;
        `;

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
        const ownedSection = this.createLabelSection('Owned Tags', labels.owned || []);
        dropdown.appendChild(ownedSection);

        // Shared Tags Section
        const sharedSection = this.createLabelSection('Shared Tags', labels.shared || []);
        dropdown.appendChild(sharedSection);

        dropdown.addEventListener('keydown', (e) => {
            const visibleLabels = Array.from(document.querySelectorAll('.label-element'))
                .filter(el => el.style.display !== 'none');
            const searchInput = this.uiElements.get('searchInput');

            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    if (this.selectedIndex >= 0 && visibleLabels[this.selectedIndex]) {
                        console.log('Label clicked:', visibleLabels[this.selectedIndex].getAttribute('data-label-id'));
                        window.labelManagerUtils.getProfileInfo();
                    }
                    break;

                case 'e':
                    if (this.selectedIndex >= 0 && visibleLabels[this.selectedIndex]) {
                        e.preventDefault();
                        console.log('Edit button clicked for label:', visibleLabels[this.selectedIndex].getAttribute('data-label-id'));
                    }
                    break;

                case 'd':
                    if (this.selectedIndex >= 0 && visibleLabels[this.selectedIndex]) {
                        e.preventDefault();
                        console.log('Delete button clicked for label:', visibleLabels[this.selectedIndex].getAttribute('data-label-id'));
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
                    console.log('Creating label:', searchTerm);
                } else if (visibleLabels.length > 0) {
                    console.log('Label clicked:', visibleLabels[0].getAttribute('data-label-id'));
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
        nameSpan.style.flex = '1';

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
        `;

        const editButton = document.createElement('button');
        editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        editButton.style.marginRight = '4px';
        editButton.onclick = (e) => {
            e.stopPropagation();
            console.log('Edit button clicked for label:', label.label_id);
        };

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            console.log('Delete button clicked for label:', label.label_id);
        };

        actionsContainer.appendChild(editButton);
        actionsContainer.appendChild(deleteButton);

        labelElement.appendChild(colorDot);
        labelElement.appendChild(nameSpan);
        labelElement.appendChild(countSpan);
        if (!label.owned_by || label.owned_by === 'mine') {
            labelElement.appendChild(actionsContainer);
        }

        // Hover effects
        labelElement.addEventListener('mouseenter', () => {
            labelElement.style.backgroundColor = 'rgb(243, 244, 246)';
            actionsContainer.style.display = 'flex';
            countSpan.style.display = 'none';
        });

        labelElement.addEventListener('mouseleave', () => {
            labelElement.style.backgroundColor = '';
            actionsContainer.style.display = 'none';
            countSpan.style.display = 'inline';
        });

        // Owner tooltip for shared labels
        if (label.owned_by && label.owned_by !== 'mine') {
            labelElement.title = `Owned by ${label.owned_by}`;
        }

        // Label click handler
        labelElement.addEventListener('click', () => {
            console.log('Label clicked:', label.label_id);
        });

        return labelElement;
    }


    toggleDropdown() {
        console.log(this.isDropdownOpen)
        if (this.isDropdownOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        const container = this.uiElements.get('container');
        console.log(container)
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

        if (this.urlObserver) {
            this.urlObserver.disconnect();
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
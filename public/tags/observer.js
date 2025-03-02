
class LinkedInLabelsManager {
    constructor() {
        this.initialized = false;
        this.labelsData = [];
        this.observer = null;
        this.labelContainerRef = null;
        this.status = 'in_progress';
        this.initialize();
        this.urlObserver = null;
        this.listObserver = null;
        this.updateTimer = null;
        this.currentTheme = 'light';

        // Add theme listener
        if (window.themeManager) {
            window.themeManager.addListener(this.handleThemeChange.bind(this));
        }
    }
    getStatusContent(labels) {
        const containerDiv = document.createElement('div');

        switch (this.status) {
            case 'in_progress':
                containerDiv.className = 'labels-loading-state';
                containerDiv.innerHTML = '⏳ Loading labels...';
                break;
            case 'logged_out':
                containerDiv.className = 'no-labels-state';
                containerDiv.innerHTML = '🔒 Please login to view and manage labels';
                break;
            case 'logged_in':
                if (!labels.length > 0) {
                    containerDiv.className = 'no-labels-state';
                    containerDiv.innerHTML = '✨ Fresh profile discovered! Add labels to categorize and remember this connection';
                }
                break;
            default:
                containerDiv.className = 'no-labels-state';
                containerDiv.innerHTML = '✨ Fresh profile discovered! Add labels to categorize and remember this connection';
        }

        return containerDiv;
    }

    handleThemeChange(theme) {
        this.currentTheme = theme;
        this.updateLabelStyles();
    }

    // Updated method to find label data by ID
    findLabelById(labelId) {
        return this.labelsData.find(label => label.label_id === labelId);
    }

    updateLabelStyles() {
        const labelContainers = document.querySelectorAll('.profile-labels-container-message, .hypertalent-profile-labels-container');

        labelContainers.forEach(container => {
            const labels = container.querySelectorAll('.profile-label');
            labels.forEach(label => {
                const labelId = label.dataset.labelId;
                const labelData = this.findLabelById(labelId);

                if (labelData) {
                    const originalColor = labelData.label_color;

                        label.style.backgroundColor = originalColor;
                        // console.log(originalColor)
                        // console.log(window.labelManagerUtils.generateTextColor(originalColor))
                        label.style.color = window.labelManagerUtils.generateTextColor(originalColor)
                        label.style.border = 'none';
                }
            });
        });
    }


    async initialize() {
        if (this.initialized) {
            return;
        }

        if (!this.isValidPage()) {
            return;
        }

        // console.log('Starting initialization');
        this.setupDatabaseListener();
        this.setupUrlChangeListener();

        // Initial page setup
        if (this.isProfilePage()) {
            await this.processProfilePage();
        } else if (this.isMessagingPage()) {
            const conversationsList = await this.waitForElement(
                'ul.msg-conversations-container__conversations-list',
                5000
            );
            if (conversationsList) {
                this.processConversationsList();
                // this.setupMessagingObserver();
            }
        }

        this.initialized = true;
    }
    isValidPage() {
        return this.isMessagingPage() || this.isProfilePage();
    }

    async waitForElement(selector, timeout = 5000) {
        // console.log(`Waiting for element: ${selector}`);
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const element = document.querySelector(selector);
            if (element) {
                // console.log('Element found');
                return element;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // console.log('Element not found within timeout');
        return null;
    }
    

    isMessagingPage() {
        return location.pathname.includes('/messaging/thread');
    }

    isProfilePage() {
        return location.pathname.match(/\/in\/[^/]+\/?$/);
    }

    setupDatabaseListener() {
        // console.log('Setting up database listener');
        if (window.labelsDatabase) {
            window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
            // console.log('Database listener setup complete');
        }
    }
    async handleLabelsUpdate(data) {
        // console.log('Labels update received:', data);

        // Check if status is the same as before for in_progress
        if (data.status === 'in_progress' && this.status === 'in_progress') {
            // console.log('Already in progress, skipping update');
            return;
        }

        // Check if status is the same as before for logged_out
        if (data.status === 'logged_out' && this.status === 'logged_out') {
            // console.log('Already logged out, skipping update');
            return;
        }

        // Update status
        this.status = data.status;

        // Only process data updates when logged in
        if (data.status === 'logged_in') {
            if (Array.isArray(data.labels)) {
                this.labelsData = data.labels;
            } else {
                this.labelsData = [];
            }
            // Only update display when logged in
            this.updateCurrentPage();
        } else {
            this.labelsData = [];
            // For non-logged in states, just update the status display if we're on a profile page
            if (this.isProfilePage() && this.labelContainerRef) {
                const profileInfo = await window.labelManagerUtils.getProfileInfo();
                if (profileInfo) {
                    this.updateLabelsDisplay(profileInfo);
                }
            }
        }
    }


    async updateCurrentPage() {
        if (this.isMessagingPage()) {
            this.processConversationsList();
        } else if (this.isProfilePage()) {
            await this.processProfilePage();
        }
    }

    async initializeCurrentPage() {
        // console.log('Initializing current page');

        // Wait for critical elements before proceeding
        if (this.isMessagingPage()) {
            const conversationsList = await this.waitForElement('ul.msg-conversations-container__conversations-list', 10000);
            if (conversationsList) {
                // console.log('Messaging page elements found, processing conversations list');
                this.processConversationsList();
            } else {
                // console.log('Messaging page elements not found');
            }
        } else if (this.isProfilePage()) {
            const profileSection = await this.waitForElement('section[data-member-id]', 10000);
            if (profileSection) {
                // console.log('Profile page elements found, processing profile page');
                await this.processProfilePage();
            } else {
                // console.log('Profile page elements not found');
            }
        }
    }

    setupUrlChangeListener() {
        // console.log('Setting up URL change listener');
        let lastUrl = location.href;
        let isProcessing = false;

        // URL change handler
        const handleUrlChange = async () => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl && !isProcessing) {
                // console.log('URL changed:', { from: lastUrl, to: currentUrl });
                isProcessing = true;


                // Add small delay to let LinkedIn's navigation complete
                await new Promise(resolve => setTimeout(resolve, 300));
                let isLastProfileUrl = lastUrl.match(/\/in\/[^/]+\/?$/);
                // console.log(isLastProfileUrl)
                if (this.isProfilePage() && !isLastProfileUrl) {
                    await this.processProfilePage();

                } else if (this.isMessagingPage()) {
                    const conversationsList = await this.waitForElement(
                        'ul.msg-conversations-container__conversations-list',
                        5000
                    );
                    if (conversationsList) {
                        this.processConversationsList();
                        // this.setupMessagingObserver();
                    }
                }
                lastUrl = currentUrl;

                isProcessing = false;
            }
        };

        // Set up mutation observer for the body element
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    handleUrlChange();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });

        // Store references for cleanup
        this.urlObserver = observer;
    }


    extractConnectionCode(url) {
        // console.log('[ProfileLabels] Extracting connection code from:', url);
        const connectionMatch = url.match(/connectionOf=%5B%22(.*?)%22%5D/) ||
            url.match(/connectionOf=\["([^"]+)"\]/);
        const mutualMatch = url.match(/facetConnectionOf=%22(.*?)%22/) ||
            url.match(/facetConnectionOf="([^"]+)"/);
        const code = (connectionMatch || mutualMatch)?.[1] || null;
        // console.log('[ProfileLabels] Extracted connection code:', code);
        return code;
    }


    createProfileId(username) {
        return `profile_${username}`;
    }

    extractUsername(url) {
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        return match ? match[1] : '';
    }

    findMatchingLabels(name, imageUrl) {
        if (!name || !this.labelsData || !Array.isArray(this.labelsData)) {
            return [];
        }

        return this.labelsData.filter(label => {
            if (!label || !Array.isArray(label.profiles)) return false;

            const matchingProfile = label.profiles.find(profile =>
                profile && profile.name &&
                profile.name.trim().toLowerCase() === name.toLowerCase()
            );

            if (matchingProfile) {
                // Add verification status
                const profileImageId = this.extractImageId(matchingProfile.image_url);
                const currentImageId = this.extractImageId(imageUrl);
                matchingProfile.isVerified = profileImageId === currentImageId;
                return true;
            }
            return false;
        });
    }

    // Helper function for image verification
    extractImageId(url) {
        if (!url) return null;
        const match = url.match(/image\/[^/]+\/([^/]+)/);
        return match ? match[1] : null;
    }


    async processProfilePage() {
        // console.log('Processing profile page');
        const profileInfo = await window.labelManagerUtils.getProfileInfo();
        if (!profileInfo) return;

        const targetElement = await this.waitForElement('section[data-member-id] > .ph5 > div:nth-child(2)');
        if (!targetElement) return;

        let container = document.querySelector('.hypertalent-profile-labels-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'hypertalent-profile-labels-container';
            targetElement.insertBefore(container, targetElement.firstChild);
        }

        this.labelContainerRef = container;
        this.updateLabelsDisplay(profileInfo);
    }

    getProfileFromLabel(label, name) {
        if (!label || !Array.isArray(label.profiles)) return null;

        return label.profiles.find(profile =>
            profile && profile.name &&
            profile.name.trim().toLowerCase() === name.toLowerCase()
        );
    }
    updateLabelsDisplay(profileInfo) {
        if (!this.labelContainerRef) return;

        // Clear the container
        this.labelContainerRef.innerHTML = '';

        // Handle non-logged_in states or empty labels
        if (this.status !== 'logged_in' || (this.status === 'logged_in' && (!this.labelsData || this.labelsData.length === 0))) {
            const statusContent = this.getStatusContent();
            this.labelContainerRef.appendChild(statusContent);
            this.labelContainerRef.style.display = 'flex';
            return;
        }

        // Continue with normal label processing for logged_in state with labels
        const matchingLabels = this.findMatchingLabels(profileInfo.name, profileInfo.image_url);

        // If we have matching labels, show them
        if (matchingLabels.length > 0) {
            matchingLabels.forEach(label => {
                const labelElement = this.createLabel(
                    label,
                    {
                        name: profileInfo.name,
                        profile_id: profileInfo.profile_id,
                        isVerified: true
                    }
                );
                this.labelContainerRef.appendChild(labelElement);
            });
            this.labelContainerRef.style.display = 'flex';
        } else {
            // Show "fresh profile" message when logged in but no matching labels
            const noLabelsMessage = this.getStatusContent(matchingLabels);
            this.labelContainerRef.appendChild(noLabelsMessage);
            this.labelContainerRef.style.display = 'flex';
        }
    }

    createLabel(labelData, matchingProfile) {
        // console.log(labelData);
        // console.log(matchingProfile)
        const labelContainer = document.createElement('div');
        labelContainer.className = 'profile-label-container';

        const label = document.createElement('div');
        label.className = `profile-label ${matchingProfile.isVerified ? '' : 'unverified'}`;
        label.dataset.labelId = labelData.label_id;

        // Store original color in data attribute for theme switching
        label.dataset.originalColor = labelData.label_color;

        label.style.backgroundColor = labelData.label_color;
        // console.log(labelData.label_color)
        // console.log(window.labelManagerUtils.generateTextColor(labelData.label_color))
        label.style.color = window.labelManagerUtils.generateTextColor(labelData.label_color);
        label.style.border = 'none';


        // Set label text
        label.innerHTML = labelData.label_name;

        // Add shared icon if label is shared
        if (labelData.type === 'shared') {
            const sharedIconSpan = document.createElement('span');
            sharedIconSpan.className = 'profile-label-shared-icon';
            sharedIconSpan.textContent = '↗';
            label.appendChild(sharedIconSpan);

            const tooltip = document.createElement('div');
            tooltip.className = 'profile-label-tooltip';
            tooltip.textContent = `Shared by ${labelData.shared_by} on ${new Date(labelData.shared_at).toLocaleDateString()}`;
            label.appendChild(tooltip);
        }

        // Add remove button
        const removeBtn = document.createElement('span');
        removeBtn.className = 'profile-label-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                // if (!window.start_action('removing-label', 'Removing Label')) {
                //     return;
                // }
                const success = await window.labelsDatabase.removeProfileFromLabel(
                    labelData.label_id,
                    matchingProfile.profile_id
                );
                if (success) {
                    // window.complete_action('removing-label', true, `${labelData.label_name} has been removed for ${matchingProfile?.name}`);
                    labelContainer.remove(); // Remove the label from DOM on success
                } else {
                    // window.complete_action('removing-label', false, 'Something went wrong while removing label');
                }
            } catch (error) {
                console.error('[LinkedInLabels] Error removing label:', error);
                // window.complete_action('removing-label', false, 'Something went wrong while removing label');
            }
        });
        label.appendChild(removeBtn);

        labelContainer.appendChild(label);
        return labelContainer;
    }

    updateLabel(labelsContainer, labelsData) {
        // console.log(labelsData);
        
        const labelElement = labelsContainer.querySelector(`div[data-label-id="${labelsData.label_id}"]`);
        
        // If the element exists
        if (labelElement) {
            // This will change the text of the first text node
            // The span (remove button) will remain untouched
            labelElement.firstChild.textContent = labelsData.label_name;
        }
    }

    processListItem(listItem) {
        if (!listItem || !listItem.classList.contains('scaffold-layout__list-item')) {
            return;
        }

        const contentElement = listItem.querySelector('.msg-conversation-card__content--selectable');
        const rowsContainer = contentElement?.querySelector('.msg-conversation-card__rows');
        const nameElement = listItem.querySelector('.msg-conversation-listitem__participant-names span.truncate');
        const imageElement = listItem.querySelector('img');

        if (!rowsContainer || !nameElement || !imageElement) {
            return;
        }

        const name = nameElement.textContent?.trim();
        const imageUrl = imageElement.src;

        if (!name) {
            return;
        }

        let labelsContainer = rowsContainer.querySelector('.profile-labels-container-message');
        if (!labelsContainer) {
            labelsContainer = document.createElement('div');
            labelsContainer.className = 'profile-labels-container-message';
            rowsContainer.insertBefore(labelsContainer, rowsContainer.children[1]);
        }

        const matchingLabels = this.findMatchingLabels(name, imageUrl);
        const currentLabelIds = new Set();

        // First, collect all current label IDs in the container
        labelsContainer.querySelectorAll('.profile-label').forEach(labelElement => {
            currentLabelIds.add(labelElement.dataset.labelId);
        });

        // Remove labels that no longer exist or don't match
        Array.from(labelsContainer.children).forEach(child => {
            const labelElement = child.querySelector('.profile-label');
            if (labelElement) {
                const labelId = labelElement.dataset.labelId;
                if (!matchingLabels.some(label => label.label_id === labelId)) {
                    child.remove();
                }
            }
        });

        // Add new matching labels that aren't already displayed
        matchingLabels.forEach(label => {
            if (!currentLabelIds.has(label.label_id)) {
                const matchingProfile = label.profiles.find(p =>
                    p.name.trim().toLowerCase() === name.toLowerCase()
                );

                if (matchingProfile) {
                    const labelElement = this.createLabel(
                        label,
                        {
                            name: name,
                            profile_id: matchingProfile.profile_id,
                            isVerified: true
                        }
                    );
                    labelsContainer.appendChild(labelElement);
                }
            }
            else{
                const matchingProfile = label.profiles.find(p =>
                    p.name.trim().toLowerCase() === name.toLowerCase()
                );
                if (matchingProfile) {
                    this.updateLabel(
                        labelsContainer,
                        label
                    );
                    // labelsContainer.appendChild(labelElement);
                }
            }
        });

        // Update container visibility
        labelsContainer.style.display = matchingLabels.length > 0 ? 'flex' : 'none';
    }

    processConversationsList() {
        const conversationsList = document.querySelector('ul.msg-conversations-container__conversations-list');
        if (!conversationsList) return;

        // Process existing items
        const listItems = conversationsList.querySelectorAll('li');
        if (listItems && listItems.length > 0) {
            listItems.forEach(listItem => {
                try {
                    this.processListItem(listItem);
                } catch (error) {
                    console.error('[LinkedInLabels] Error processing list item:', error);
                }
            });
        }

        // Set up observer for the conversations list
        if (this.listObserver) {
            this.listObserver.disconnect();
        }

        this.listObserver = new MutationObserver(mutations => {
            let shouldProcess = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList' ||
                    (mutation.type === 'attributes' &&
                        (mutation.attributeName === 'class' || mutation.attributeName === 'style'))) {
                    shouldProcess = true;
                }
            });

            if (shouldProcess) {
                if (this.updateTimer) {
                    cancelAnimationFrame(this.updateTimer);
                }
                this.updateTimer = requestAnimationFrame(() => {
                    const currentItems = conversationsList.querySelectorAll('li');
                    if (currentItems && currentItems.length > 0) {
                        currentItems.forEach(listItem => {
                            try {
                                this.processListItem(listItem);
                            } catch (error) {
                                console.error('[LinkedInLabels] Error processing list item:', error);
                            }
                        });
                    }
                });
            }
        });

        this.listObserver.observe(conversationsList, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    destroy() {
        // Restore original pushState
        if (this.originalPushState) {
            history.pushState = this.originalPushState;
        }

        // Remove URL change listeners
        if (this.handleUrlChange) {
            window.removeEventListener('popstate', this.handleUrlChange);
        }

        // Rest of the cleanup remains the same
        if (this.urlObserver) {
            this.urlObserver.disconnect();
        }
        if (this.listObserver) {
            this.listObserver.disconnect();
        }
        if (this.updateTimer) {
            cancelAnimationFrame(this.updateTimer);
        }
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        }
        if (window.themeManager) {
            window.themeManager.removeListener(this.handleThemeChange);
        }
        if (this.labelContainerRef) {
            this.labelContainerRef.remove();
            this.labelContainerRef = null;
        }
        this.initialized = false;
    }
}

// Initialize only on LinkedIn
(function () {
    if (!window.location.hostname.includes('linkedin.com')) {
        // console.log('Not on LinkedIn, skipping initialization');
        return;
    }
    if (window.linkedInLabelsManager) {
        // console.log('Manager already exists, skipping initialization');
        return;
    }

    // console.log('Creating new LinkedInLabelsManager instance');
    window.linkedInLabelsManager = new LinkedInLabelsManager();
})();
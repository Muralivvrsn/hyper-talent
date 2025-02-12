// Unified LinkedIn Labels Manager
const stylish = {
    styleId: 'linkedin-labels-styles',
    css: `
        .profile-labels-container-message,
        .hypertalent-profile-labels-container {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            padding: 4px 0;
            min-height: 24px;
        }

        .hypertalent-profile-labels-container {
            margin-top: 8px;
            margin-bottom: 8px;
        }

        .profile-label {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            color: white;
            cursor: default;
            position: relative;
            transition: all 0.2s ease;
            height: 20px;
            line-height: 20px;
        }

        .profile-label:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .profile-label.unverified::after {
            content: '';
            position: absolute;
            top: -2px;
            right: -2px;
            width: 6px;
            height: 6px;
            background: #f5a623;
            border-radius: 50%;
            border: 1px solid white;
        }

        .profile-label-remove {
            display: none;
            margin-left: 4px;
            cursor: pointer;
            opacity: 0.7;
            font-size: 12px;
            padding: 0 2px;
        }

        .profile-label-remove:hover {
            opacity: 1;
            // background: rgba(0,0,0,0.1);
            border-radius: 50%;
        }

        .profile-label:hover .profile-label-remove {
            display: inline-flex;
        }

        .profile-label[data-shared-by] {
            position: relative;
        }

        .profile-label[data-shared-by]:hover::before {
            content: attr(data-shared-by);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            margin-bottom: 4px;
            z-index: 1000;
            pointer-events: none;
        }
    `
};

class LinkedInLabelsManager {
    constructor() {
        // console.log('Initializing LinkedInLabelsManager');
        this.initialized = false;
        this.labelsData = { owned: [], shared: [] };
        this.observer = null;
        this.labelContainerRef = null;
        this.initialize();
        this.urlObserver = null;
        this.listObserver = null;
        this.updateTimer = null;
    }

    initialize() {
        if (this.initialized) {
            // console.log('Already initialized');
            return;
        }

        if (!this.isValidPage()) {
            // console.log('Not a valid page for initialization');
            return;
        }

        // console.log('Starting initialization');
        this.injectStyles();
        this.setupDatabaseListener();
        this.setupUrlChangeListener();
        this.initializeCurrentPage();
        this.initialized = true;
        // console.log('Initialization complete');
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

    injectStyles() {
        // console.log('Injecting styles');
        if (!document.getElementById(stylish.styleId)) {
            const styleSheet = document.createElement('style');
            styleSheet.id = stylish.styleId;
            styleSheet.textContent = stylish.css;
            document.head.appendChild(styleSheet);
            // console.log('Styles injected successfully');
        }
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

    handleLabelsUpdate({ labels }) {
        // console.log('Labels updated:', labels);
        this.labelsData = labels;
        this.updateCurrentPage();
    }

    async updateCurrentPage() {
        if (this.isMessagingPage()) {
            this.processConversationsList();
        } else if (this.isProfilePage()) {
            await this.processProfilePage();
        }
    }

    setupUrlChangeListener() {
        // console.log('Setting up URL and UI change listener');
        let lastUrl = location.href;
        let lastPath = location.pathname;
        
        // Create a single observer for both URL and UI changes
        const observer = new MutationObserver(() => {
            // Check for URL changes
            const currentUrl = location.href;
            const currentPath = location.pathname;
            
            if (currentUrl !== lastUrl || currentPath !== lastPath) {
                // console.log('URL changed:', { from: lastUrl, to: currentUrl });
                lastUrl = currentUrl;
                lastPath = currentPath;
                if (this.isValidPage()) {
                    this.initializeCurrentPage();
                }
                return;
            }
    
            // For messaging page, check for conversation list changes
            if (this.isMessagingPage()) {
                const conversationsList = document.querySelector('ul.msg-conversations-container__conversations-list');
                if (conversationsList) {
                    this.processConversationsList();
                }
            }
    
            // For profile page, check for profile section changes
            if (this.isProfilePage()) {
                const profileSection = document.querySelector('section[data-member-id]');
                if (profileSection) {
                    this.processProfilePage();
                }
            }
        });
    
        // Use a more specific target for observation
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'], // Only watch for relevant attribute changes
        });
    
        // Store the observer for cleanup
        this.urlObserver = observer;
    }

    async initializeCurrentPage() {
        if (this.isMessagingPage()) {
            // console.log('Initializing messaging page');
            this.processConversationsList();
        } else if (this.isProfilePage()) {
            // console.log('Initializing profile page');
            await this.processProfilePage();
        }
    }

    extractImageId(url) {
        if (!url) return null;
        const match = url.match(/image\/[^/]+\/([^/]+)/);
        const imageId = match ? match[1] : null;
        // console.log('Extracted image ID:', { url, imageId });
        return imageId;
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


    async getProfileInfo() {
        // console.log('Getting profile info');
        try {
            const connectionLink = document.querySelector('a[href*="/search/results/people"]');
            const mutualConnectionLink = document.querySelector('section[data-member-id] > .ph5 > a');
            const url = connectionLink?.href || mutualConnectionLink?.href || window.location.href;
            
            const nameElement = document.querySelector('a[aria-label] h1');
            const name = nameElement?.textContent.trim() || '';
            const username = this.extractUsername(url);
            const connectionCode = this.extractConnectionCode(url) || username;
            const imgElement = document.querySelector('img.pv-top-card-profile-picture__image--show');
            const imageUrl = imgElement?.getAttribute('src') || '';

            const profileInfo = {
                url:window.location.href,
                profileId: connectionCode,
                name,
                username,
                imageUrl,
                addedAt: new Date().toISOString()
            };

            // console.log('Profile info collected:', profileInfo);
            return profileInfo;
        } catch (error) {
            // console.error('Error getting profile info:', error);
            return null;
        }
    }

    createProfileId(username) {
        return `profile_${username}`;
    }

    extractUsername(url) {
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        return match ? match[1] : '';
    }

    findMatchingLabels(name, imageUrl) {
        // console.log('Finding matching labels for:', { name, imageUrl });
        const imageId = this.extractImageId(imageUrl);
        const allLabels = [...this.labelsData.owned, ...this.labelsData.shared];

        return allLabels.filter(label => {
            const matchingProfile = label.profiles?.find(profile => 
                profile.name.trim().toLowerCase() === name.toLowerCase()
            );

            if (matchingProfile) {
                const profileImageId = this.extractImageId(matchingProfile.image_url);
                matchingProfile.isVerified = imageId === profileImageId;
                // console.log('Found matching profile:', {
                //     labelName: label.label_name,
                //     isVerified: matchingProfile.isVerified
                // });
                return true;
            }
            return false;
        });
    }

    createLabel(labelId, labelName, labelColor, matchingProfile, isShared = false, sharedBy = '') {
        // console.log('Creating label:', { labelId, labelName, isShared });

        const label = document.createElement('div');
        label.className = `profile-label ${matchingProfile.isVerified ? '' : 'unverified'}`;
        label.dataset.labelId = labelId;
        label.style.backgroundColor = labelColor;

        if (isShared && sharedBy) {
            label.dataset.sharedBy = `Shared by ${sharedBy}`;
        }

        label.innerHTML = `
            ${labelName}
            <span class="profile-label-remove">×</span>
        `;

        const removeBtn = label.querySelector('.profile-label-remove');
        removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                await window.labelsDatabase.removeProfileFromLabel(
                    labelId,
                    matchingProfile.profile_id
                );
                // console.log('Profile removed from label');
            } catch (error) {
                // console.error('Failed to remove profile from label:', error);
            }
        });

        return label;
    }

    async processProfilePage() {
        // console.log('Processing profile page');
        const profileInfo = await this.getProfileInfo();
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

    updateLabelsDisplay(profileInfo) {
        if (!this.labelContainerRef) return;

        const matchingLabels = this.findMatchingLabels(profileInfo.name, profileInfo.imageUrl);
        const currentLabels = new Set();

        // Remove outdated labels
        this.labelContainerRef.querySelectorAll('.profile-label').forEach(labelElement => {
            const labelId = labelElement.dataset.labelId;
            if (!matchingLabels.some(label => label.label_id === labelId)) {
                labelElement.remove();
            } else {
                currentLabels.add(labelId);
            }
        });

        // Add new labels
        matchingLabels.forEach(label => {
            if (!currentLabels.has(label.label_id)) {
                const isShared = this.labelsData.shared.includes(label);
                const sharedBy = isShared ? label.shared_by : '';

                const labelElement = this.createLabel(
                    label.label_id,
                    label.label_name,
                    label.label_color,
                    label.profiles.find(p => p.name.trim().toLowerCase() === profileInfo.name.toLowerCase()),
                    isShared,
                    sharedBy
                );
                this.labelContainerRef.appendChild(labelElement);
            }
        });

        this.labelContainerRef.style.display = matchingLabels.length > 0 ? 'flex' : 'none';
    }

    processListItem(listItem) {
        if (!listItem.classList.contains('scaffold-layout__list-item')) return;

        const contentElement = listItem.querySelector('.msg-conversation-card__content--selectable');
        const rowsContainer = contentElement?.querySelector('.msg-conversation-card__rows');
        const nameElement = listItem.querySelector('.msg-conversation-listitem__participant-names span.truncate');
        const imageElement = listItem.querySelector('img');

        if (!rowsContainer || !nameElement || !imageElement) return;

        const name = nameElement.textContent.trim();
        const imageUrl = imageElement.src;
        const currentLabels = new Set();

        let labelsContainer = rowsContainer.querySelector('.profile-labels-container-message');
        if (!labelsContainer) {
            labelsContainer = document.createElement('div');
            labelsContainer.className = 'profile-labels-container-message';
            rowsContainer.insertBefore(labelsContainer, rowsContainer.children[1]);
        }

        const matchingLabels = this.findMatchingLabels(name, imageUrl);

        // Remove outdated labels
        labelsContainer.querySelectorAll('.profile-label').forEach(labelElement => {
            const labelId = labelElement.dataset.labelId;
            if (!matchingLabels.some(label => label.label_id === labelId)) {
                labelElement.remove();
            } else {
                currentLabels.add(labelId);
            }
        });

        // Add new labels
        matchingLabels.forEach(label => {
            if (!currentLabels.has(label.label_id)) {
                const isShared = this.labelsData.shared.includes(label);
                const sharedBy = isShared ? label.shared_by : '';

                const labelElement = this.createLabel(
                    label.label_id,
                    label.label_name,
                    label.label_color,
                    label.profiles.find(p => p.name.trim().toLowerCase() === name.toLowerCase()),
                    isShared,
                    sharedBy
                );
                labelsContainer.appendChild(labelElement);
            }
        });

        labelsContainer.style.display = matchingLabels.length > 0 ? 'flex' : 'none';
    }

    processConversationsList() {
        // console.log('Processing conversations list');
        const conversationsList = document.querySelector('ul.msg-conversations-container__conversations-list');
        if (!conversationsList) return;
    
        // Process existing items
        conversationsList.querySelectorAll('li').forEach(listItem => {
            this.processListItem(listItem);
        });
    
        // Set up a more specific observer for the conversations list
        if (this.listObserver) {
            this.listObserver.disconnect();
        }
    
        this.listObserver = new MutationObserver(mutations => {
            let shouldProcess = false;
            
            mutations.forEach(mutation => {
                // Check if the mutation is relevant
                if (mutation.type === 'childList' || 
                    (mutation.type === 'attributes' && 
                     (mutation.attributeName === 'class' || mutation.attributeName === 'style'))) {
                    shouldProcess = true;
                }
            });
    
            if (shouldProcess) {
                // Use requestAnimationFrame to prevent multiple rapid updates
                if (this.updateTimer) {
                    cancelAnimationFrame(this.updateTimer);
                }
                this.updateTimer = requestAnimationFrame(() => {
                    conversationsList.querySelectorAll('li').forEach(listItem => {
                        this.processListItem(listItem);
                    });
                });
            }
        });
    
        this.listObserver.observe(conversationsList, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
    }

    destroy() {
        // console.log('Destroying LinkedInLabelsManager');
        if (this.observer) {
            this.observer.disconnect();
        }
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
        const styleSheet = document.getElementById(stylish.styleId);
        if (styleSheet) {
            styleSheet.remove();
        }
        if (this.labelContainerRef) {
            this.labelContainerRef.remove();
            this.labelContainerRef = null;
        }
        this.initialized = false;
        // console.log('Cleanup complete');
    }
}

// Initialize only on LinkedIn
(function() {
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
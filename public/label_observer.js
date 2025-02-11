// LinkedIn Label Manager Content Script
class LinkedInLabelManager {
    constructor() {
        this.messageListObserver = null;
        this.urlObserver = null;
        this.lastUrl = '';
        this.labelsData = [];
        
        this.handleUrlChange = this.handleUrlChange.bind(this);
        this.processMessageList = this.processMessageList.bind(this);
        
        // Initialize
        this.injectStyles();
        this.setupUrlObserver();
        this.setupMessageListObserver();
        
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
    }

    injectStyles() {
        if (!document.querySelector('#linkedin-label-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'linkedin-label-styles';
            styleSheet.textContent = `
                .profile-labels-container-message {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    align-items: center;
                    width: 100%;
                    box-sizing: border-box;
                    padding: 4px 0;
                }

                .profile-label-message {
                    display: inline-flex;
                    align-items: center;
                    padding: 0px 8px;
                    border-radius: 12px;
                    font-size: 9px;
                    font-family: "Poppins", serif !important;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: default;
                    position: relative;
                    animation: labelAppear 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                    text-transform: uppercase;
                    height: 20px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                @media (prefers-color-scheme: dark) {
                    .profile-label-message {
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    }
                }

                .profile-label-message:hover {
                    transform: translateY(-1px);
                    filter: brightness(0.95);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                @keyframes labelAppear {
                    0% {
                        opacity: 0;
                        transform: scale(0.8) translateY(5px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                .profile-label-message.removing {
                    animation: labelRemove 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    pointer-events: none;
                }

                @keyframes labelRemove {
                    0% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(0.8) translateY(5px);
                    }
                }

                .label-remove {
                    width: 16px;
                    height: 16px;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    margin-left: 6px;
                    font-size: 14px;
                    font-family: "Poppins", serif !important;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }

                .profile-label-message:hover .label-remove {
                    display: flex;
                }

                .label-remove:hover {
                    opacity: 1 !important;
                    transform: scale(1.1);
                }

                .label-text {
                    line-height: 1.2;
                    font-family: "Poppins", serif !important;
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    adjustColor(hexColor, opacity = 0.3) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const adjustedOpacity = isDarkMode ? opacity * 1.2 : opacity;
        
        const bgColor = `rgba(${r}, ${g}, ${b}, ${adjustedOpacity})`;
        const textColor = isDarkMode 
            ? `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)})`
            : `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;

        return { bgColor, textColor };
    }

    findMatchingLabels(name, imageUrl) {
        return this.labelsData.filter(label =>
            label.profiles.some(profile =>
                profile.name === name && profile.image_url === imageUrl
            )
        ).map(label => ({
            ...label,
            matchingProfile: label.profiles.find(profile =>
                profile.name === name && profile.image_url === imageUrl
            )
        }));
    }

    createLabel(labelId, labelName, labelColor, matchingProfile) {
        const label = document.createElement('div');
        label.className = `profile-label-message label-${labelId}`;
        label.setAttribute('data-label-id', labelId);
        label.setAttribute('data-profile-id', matchingProfile.profile_id);

        const { bgColor, textColor } = this.adjustColor(labelColor);

        label.style.backgroundColor = bgColor;
        label.style.color = textColor;

        const labelText = document.createElement('span');
        labelText.className = 'label-text';
        labelText.textContent = labelName;
        label.appendChild(labelText);

        const removeButton = document.createElement('span');
        removeButton.className = 'label-remove';
        removeButton.innerHTML = '×';
        removeButton.addEventListener('click', async (e) => {
            await this.handleRemoveLabel(labelId, matchingProfile.profile_id, label);
        });
        label.appendChild(removeButton);

        return label;
    }

    async handleRemoveLabel(labelId, profileId, labelElement) {
        try {
            const success = await window.labelsDatabase.removeProfileFromLabel(labelId, profileId);
            if (success) {
                labelElement.classList.add('removing');
                setTimeout(() => labelElement.remove(), 300);
                window.show_success('Label removed');
            }
        } catch (error) {
            console.error('Error removing label:', error);
            window.show_error('Failed to remove label');
        }
    }

    processListItem(listItem) {
        if (!listItem.classList.contains('scaffold-layout__list-item')) {
            return;
        }

        const contentElement = listItem.querySelector('.msg-conversation-card__content--selectable');
        const rowsContainer = contentElement?.querySelector('.msg-conversation-card__rows');
        const nameElement = listItem.querySelector('.msg-conversation-listitem__participant-names span.truncate');
        const imageElement = listItem.querySelector('img');

        if (!rowsContainer || !nameElement || !imageElement) {
            return;
        }

        const name = nameElement.textContent.trim();
        const imageUrl = imageElement.src;

        let labelsContainer = rowsContainer.querySelector('.profile-labels-container-message');

        if (!labelsContainer) {
            labelsContainer = document.createElement('div');
            labelsContainer.className = 'profile-labels-container-message';

            const titleRow = rowsContainer.querySelector('.msg-conversation-card__row.msg-conversation-card__title-row');
            if (titleRow) {
                titleRow.nextSibling 
                    ? rowsContainer.insertBefore(labelsContainer, titleRow.nextSibling)
                    : rowsContainer.appendChild(labelsContainer);
            } else {
                rowsContainer.insertBefore(labelsContainer, rowsContainer.firstChild);
            }
        }

        const matchingLabels = this.findMatchingLabels(name, imageUrl);

        // Add new labels
        matchingLabels.forEach(label => {
            if (!labelsContainer.querySelector(`[data-label-id="${label.label_id}"]`)) {
                const labelElement = this.createLabel(
                    label.label_id,
                    label.label_name,
                    label.label_color,
                    label.matchingProfile
                );
                labelsContainer.appendChild(labelElement);
            }
        });

        labelsContainer.style.display = matchingLabels.length > 0 ? 'flex' : 'none';
    }

    processMessageList() {
        const messageList = document.querySelector('.scaffold-layout__list.msg__list');
        if (messageList) {
            const listItems = messageList.querySelectorAll('li');
            listItems.forEach(item => this.processListItem(item));
        }
    }

    handleUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== this.lastUrl) {
            this.lastUrl = currentUrl;
                this.setupMessageListObserver();
        }
    }

    setupMessageListObserver() {
        if (this.messageListObserver) {
            this.messageListObserver.disconnect();
        }

        this.messageListObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' ||
                    (mutation.type === 'attributes' && mutation.target.tagName === 'LI')) {
                    this.processMessageList();
                    break;
                }
            }
        });

        const messageList = document.querySelector('.scaffold-layout__list.msg__list');
        if (messageList) {
            this.messageListObserver.observe(messageList, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            });
            this.processMessageList();
        }
    }

    setupUrlObserver() {
        if (!this.urlObserver) {
            this.urlObserver = new MutationObserver(() => {
                this.handleUrlChange();
            });

            this.urlObserver.observe(document.body, {
                childList: true,
                subtree: true
            });

            window.addEventListener('popstate', this.handleUrlChange);
        }
    }

    handleLabelsUpdate(newLabels) {
        this.labelsData = newLabels;
        this.processMessageList();
    }

    destroy() {
        if (this.messageListObserver) {
            this.messageListObserver.disconnect();
        }
        if (this.urlObserver) {
            this.urlObserver.disconnect();
        }
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        }
        window.removeEventListener('popstate', this.handleUrlChange);
    }

    refresh() {
        this.processMessageList();
    }
}

// Initialize and expose the manager globally
window.linkedInLabelManager = new LinkedInLabelManager();


const observeMessagingPage = () => {
    let lastUrl = '';

    const isMessagingPage = (url) => {
        return url.includes('messaging/thread/');
    };

    const waitForMessagingContainer = async () => {
        const maxAttempts = 50; // 5 seconds total
        let attempts = 0;

        while (attempts < maxAttempts) {
            const container = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container');
            
            if (container) {
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        return false;
    };

    const initializeLabelManager = () => {
        // Only initialize if it doesn't exist
        if (!window.linkedInLabelManager) {
            window.linkedInLabelManager = new LinkedInLabelManager();
            // window.linkedInLabelManager.initialize();
        }
    };

    const cleanupLabelManager = () => {
        if (window.linkedInLabelManager) {
            window.linkedInLabelManager.destroy();
            window.linkedInLabelManager = null;
        }
    };

    const observer = new MutationObserver(async () => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;

            if (!isMessagingPage(currentUrl)) {
                cleanupLabelManager();
            } else {
                const containerExists = await waitForMessagingContainer();
                if (containerExists) {
                    initializeLabelManager();
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Handle initial page load
    const initialUrl = window.location.href;
    if (isMessagingPage(initialUrl)) {
        waitForMessagingContainer().then(containerExists => {
            if (containerExists) {
                initializeLabelManager();
            }
        });
    }
};

observeMessagingPage()
class LinkedInSearchLabelManager {
    constructor() {
        this.searchListObserver = null;
        this.urlObserver = null;
        this.lastUrl = '';
        this.labelsData = [];
        this.initialized = false;
        
        // Only bind handleLabelsUpdate as it's used as a callback
        this.handleLabelsUpdate = this.handleLabelsUpdate.bind(this);
        
        // Initialize only if not already initialized
        if (!this.initialized) {
            this.injectStyles();
            this.initialized = true;
        }
        
        this.setupUrlObserver();
        this.setupSearchListObserver();
        
        window.labelsDatabase.addListener(this.handleLabelsUpdate);
    }

    injectStyles() {
        if (!document.querySelector('#linkedin-search-label-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'linkedin-search-label-styles';
            styleSheet.textContent = `
                .profile-labels-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    align-items: center;
                    width: 100%;
                    box-sizing: border-box;
                    padding: 4px 0;
                    margin-top: 4px;
                    z-index: 9999999 !important;
                }

                .profile-label {
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
                    .profile-label {
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    }
                }

                .profile-label:hover {
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

                .profile-label.removing {
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

                .profile-label:hover .label-remove {
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

    findMatchingLabels(profileId) {
        const allLabels = [
            ...(this.labelsData?.owned || []),
            ...(this.labelsData?.shared || [])
        ];

        return allLabels.filter(label =>
            label.profiles?.some(profile => profile.profile_id === profileId)
        ).map(label => ({
            ...label,
            matchingProfile: label.profiles.find(profile => 
                profile.profile_id === profileId
            )
        }));
    }

    createLabel(labelId, labelName, labelColor, matchingProfile) {
        const label = document.createElement('div');
        label.className = `profile-label label-${labelId}`;
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
        removeButton.onclick = async () => {
            await this.handleRemoveLabel(labelId, matchingProfile.profile_id, label);
        };
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

    extractProfileId(url) {
        const match = url.match(/miniProfileUrn=urn%3Ali%3Afs_miniProfile%3A(.*?)(?:&|$)/);
        return match ? match[1] : null;
    }

    processListItem(listItem) {
        const profileLink = listItem.querySelector('a[href*="miniProfileUrn"]');
        if (!profileLink) return;

        const profileId = this.extractProfileId(profileLink.href);
        if (!profileId) return;

        let labelsContainer = listItem.querySelector('.profile-labels-container');
        if (!labelsContainer) {
            labelsContainer = document.createElement('div');
            labelsContainer.className = 'profile-labels-container';

            const targetContainer = listItem.querySelector('.linked-area div div:nth-child(2) div.t-roman');
            if (targetContainer) {
                const firstChild = targetContainer.firstChild;
                if (firstChild) {
                    targetContainer.insertBefore(labelsContainer, firstChild.nextSibling);
                } else {
                    targetContainer.appendChild(labelsContainer);
                }
            }
        }

        const matchingLabels = this.findMatchingLabels(profileId);

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

    processSearchList() {
        const searchList = document.querySelector('ul[role="list"]');
        if (searchList) {
            const listItems = searchList.querySelectorAll('li');
            listItems.forEach(item => this.processListItem(item));
        }
    }

    handleUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== this.lastUrl) {
            this.lastUrl = currentUrl;
            if (currentUrl.includes('search/results/people')) {
                this.setupSearchListObserver();
            }
        }
    }

    setupSearchListObserver() {
        if (this.searchListObserver) {
            this.searchListObserver.disconnect();
        }

        this.searchListObserver = new MutationObserver(() => {
            this.processSearchList();
        });

        const searchList = document.querySelector('ul[role="list"]');
        if (searchList) {
            this.searchListObserver.observe(searchList, {
                childList: true,
                subtree: true,
                attributes: true
            });
            this.processSearchList();
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

            window.addEventListener('popstate', () => this.handleUrlChange());
        }
    }

    handleLabelsUpdate(data) {
        this.labelsData = data.labels;
        this.processSearchList();
    }

    destroy() {
        if (this.searchListObserver) {
            this.searchListObserver.disconnect();
        }
        if (this.urlObserver) {
            this.urlObserver.disconnect();
        }
        window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        window.removeEventListener('popstate', () => this.handleUrlChange());
    }

    refresh() {
        this.processSearchList();
    }
}

// Initialize observer
const observeSearchPage = () => {
    if (window.searchPageObserver) return;

    let lastUrl = '';
    let checkInterval = null;

    const isSearchPage = (url) => url.includes('search/results/people');

    const tryInitialize = () => {
        const container = document.querySelector('ul[role="list"]');
        if (container) {
            if (!window.linkedInSearchLabelManager) {
                window.linkedInSearchLabelManager = new LinkedInSearchLabelManager();
            }
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
        }
    };

    const cleanupLabelManager = () => {
        if (window.linkedInSearchLabelManager) {
            window.linkedInSearchLabelManager.destroy?.();
            window.linkedInSearchLabelManager = null;
        }
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    };

    const observer = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            cleanupLabelManager();

            if (isSearchPage(currentUrl)) {
                tryInitialize();
                checkInterval = setInterval(tryInitialize, 2000);
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.searchPageObserver = observer;

    // Handle initial page load
    if (isSearchPage(window.location.href)) {
        tryInitialize();
        checkInterval = setInterval(tryInitialize, 2000);
    }
};

// Start observation
observeSearchPage();
class LabelFilterCore {
    constructor() {
        // console.log('[LabelFilterCore] Initializing LabelFilterCore');
        this.selectedLabels = new Set();
        this.checkInterval = null;
        this.listeners = new Set();
        this.state = {
            currentObserver: null,
            debounceTimer: null,
            isProcessing: false,
            labelsCache: new Map(),
            allowedLabels: []
        };
        
        this.toggleLabel = this.toggleLabel.bind(this);
        this.removeLabel = this.removeLabel.bind(this);
        this.notifyListeners = this.notifyListeners.bind(this);
        
        // console.log('[LabelFilterCore] Adding labels database listener');
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
    }

    addSelectedLabelsListener(callback) {
        // console.log('[LabelFilterCore] Adding selected labels listener');
        this.listeners.add(callback);
        // console.log('[LabelFilterCore] Initial callback with labels:', [...this.selectedLabels]);
        callback([...this.selectedLabels]);
        return () => this.removeSelectedLabelsListener(callback);
    }

    removeSelectedLabelsListener(callback) {
        // console.log('[LabelFilterCore] Removing selected labels listener');
        this.listeners.delete(callback);
    }

    notifyListeners() {
        const selectedLabelsArray = [...this.selectedLabels];
        // console.log('[LabelFilterCore] Notifying listeners with labels:', selectedLabelsArray);
        this.listeners.forEach(listener => {
            try {
                listener(selectedLabelsArray);
            } catch (error) {
                console.error('[LabelFilterCore] Error in label filter listener:', error);
            }
        });
    }

    async initialize() {
        // console.log('[LabelFilterCore] Initializing core functionality');
        // window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        window.labelFilterUI?.setupFilterButton();
        this.setupConversationObserver();
        this.startChecking();
        // console.log('[LabelFilterCore] Initialization complete');
    }

    startChecking() {
        // console.log('[LabelFilterCore] Starting container check');
        const targetContainer = window.labelFilterUtils.findTargetContainer();
        if (targetContainer && window.labelFilterUI?.setupFilterButton()) {
            // console.log('[LabelFilterCore] Target container found and button setup on first try');
            return;
        }

        // console.log('[LabelFilterCore] Starting interval check for target container');
        this.checkInterval = setInterval(() => {
            const targetContainer = window.labelFilterUtils.findTargetContainer();
            if (targetContainer && window.labelFilterUI?.setupFilterButton()) {
                // console.log('[LabelFilterCore] Target container found and button setup during interval');
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
        }, 2000);
    }

    async handleLabelsUpdate(data) {
        console.log(data)
        if(data.labels.length <= 0)
            return;
        this.updateLabelsCache(data.labels);
        
        window.labelFilterUI?.updateLabelsDropdown(data.labels);
        window.labelFilterUI?.updateSelectedLabels();
        this.updateAllowedLabels();
    }

    updateLabelsCache(labels) {
        // console.log('[LabelFilterCore] Updating labels cache');
        this.state.labelsCache.clear();
        labels.forEach(label => {
            this.state.labelsCache.set(label.label_id, {
                name: label.label_name,
                color: label.label_color,
                profiles: label.profiles || []
            });
        });

    }

    updateAllowedLabels() {
        const previousAllowed = [...this.state.allowedLabels];
        this.state.allowedLabels = [...this.selectedLabels].filter(labelId => 
            this.state.labelsCache.has(labelId)
        );

    }

    extractMediaCode(url) {
        // console.log('[LabelFilterCore] Extracting media code from:', url);
        if (!url) {
            // console.log('[LabelFilterCore] No URL provided');
            return null;
        }
        if (url.startsWith('data:image')) {
            // console.log('[LabelFilterCore] Data URL detected');
            return url;
        }
        const match = url.match(/\/v2\/([^/]+)\//);
        const result = match ? match[1] : null;
        // console.log('[LabelFilterCore] Extracted media code:', result);
        return result;
    }

    async checkLabelMatch(imgSrc, name) {

        
        if (!this.state.allowedLabels.length) {
            // console.log('[LabelFilterCore] No allowed labels, returning true');
            return true;
        }
        
        if (!imgSrc || !name) {
            // console.log('[LabelFilterCore] Missing imgSrc or name, returning true');
            return true;
        }

        try {
            const currentImgCode = this.extractMediaCode(imgSrc);
            if (!currentImgCode) {
                // console.log('[LabelFilterCore] No media code extracted, returning true');
                return true;
            }

            for (const labelId of this.state.allowedLabels) {
                // console.log('[LabelFilterCore] Checking label:', labelId);
                const labelInfo = this.state.labelsCache.get(labelId);
                
                if (!labelInfo?.profiles?.length) {
                    // console.log(`[LabelFilterCore] No profiles found for label: ${labelId}`);
                    continue;
                }

                const matchingProfile = labelInfo.profiles.find(profile => {
                    const profileImgCode = this.extractMediaCode(profile.image_url);
                    const codeMatch = profileImgCode === currentImgCode;
                    const nameMatch = profile.name.toLowerCase() === name.toLowerCase();



                    return codeMatch && nameMatch;
                });

                if (matchingProfile) {
                    // console.log('[LabelFilterCore] Match found for label:', labelId);
                    return true;
                }
            }

            // console.log('[LabelFilterCore] No matching labels found');
            return false;
        } catch (error) {
            console.error('[LabelFilterCore] Error in label matching:', error);
            return true;
        }
    }

    setupConversationObserver() {
        // console.log('[LabelFilterCore] Setting up conversation observer');
        const listElement = document.querySelector('.msg-conversations-container__conversations-list');
        if (!listElement) {
            // console.log('[LabelFilterCore] Conversation list element not found');
            return;
        }

        let previousLength = listElement.children.length;
        let previousFirstChild = listElement.firstElementChild;

        const observer = new MutationObserver(window.labelFilterUtils.debounce((mutations) => {

            const hasRelevantChanges = mutations.some(mutation => {
                if (mutation.type === 'childList') return true;
                if (mutation.type === 'attributes') {
                    const relevantAttributes = ['style', 'class', 'hidden'];
                    return relevantAttributes.includes(mutation.attributeName);
                }
                return false;
            });

            const currentLength = listElement.children.length;
            const currentFirstChild = listElement.firstElementChild;
            const hasStructuralChanges = 
                previousLength !== currentLength || 
                previousFirstChild !== currentFirstChild;



            previousLength = currentLength;
            previousFirstChild = currentFirstChild;

            if (hasRelevantChanges && hasStructuralChanges && this.state.allowedLabels.length > 0) {
                const hasLoadedConversations = Array.from(listElement.children).some(child => 
                    child.querySelector('.msg-conversation-listitem__participant-names')
                );



                if (hasLoadedConversations) {
                    window.labelFilterUI?.filterConversations(false);
                }
            }
        }, 300));

        observer.observe(listElement, {
            childList: true,
            subtree: false,
            attributes: true,
            attributeFilter: ['style', 'class', 'hidden']
        });

        this.state.currentObserver = observer;
        // console.log('[LabelFilterCore] Conversation observer setup complete');
    }

    toggleLabel(labelId) {
        // console.log('[LabelFilterCore] Toggling label:', labelId);
        if (this.selectedLabels.has(labelId)) {
            // console.log('[LabelFilterCore] Removing label from selection:', labelId);
            this.selectedLabels.delete(labelId);
        } else {
            // console.log('[LabelFilterCore] Adding label to selection:', labelId);
            this.selectedLabels.add(labelId);
        }
        
        window.userActionsDatabase.addAction("label_filter")
        this.updateAllowedLabels();
        window.labelFilterUI?.filterConversations(false);
        window.labelFilterUI?.updateSelectedLabels();
        this.notifyListeners();
        
    }

    removeLabel(labelId) {
        // console.log('[LabelFilterCore] Removing label:', labelId);
        this.selectedLabels.delete(labelId);
        this.updateAllowedLabels();
        window.labelFilterUI?.filterConversations(false);
        window.labelFilterUI?.updateSelectedLabels();
        const checkbox = window.labelFilterUI?.elements.dropdown
            .querySelector(`input[type="checkbox"][value="${labelId}"]`);
        if (checkbox) {
            // console.log('[LabelFilterCore] Updating checkbox state for:', labelId);
            checkbox.checked = false;
        }
        
        this.notifyListeners();

    }

    destroy() {
        // console.log('[LabelFilterCore] Starting cleanup');
        window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        window.labelFilterUI?.cleanup()

        if (this.state.currentObserver) {
            // console.log('[LabelFilterCore] Disconnecting observer');
            this.state.currentObserver.disconnect();
            this.state.currentObserver = null;
        }

        if (this.checkInterval) {
            // console.log('[LabelFilterCore] Clearing check interval');
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // console.log('[LabelFilterCore] Cleaning up UI');
        window.labelFilterUI?.cleanup();

        // console.log('[LabelFilterCore] Clearing state');
        this.state.labelsCache.clear();
        this.state.allowedLabels = [];
        this.selectedLabels.clear();
        this.listeners.clear();


        // console.log('[LabelFilterCore] Cleanup complete');
    }
}


window.labelFilterCore = new LabelFilterCore();


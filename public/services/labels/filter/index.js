
window.labelFilterCore = {
    state: {
        currentObserver: null,
        debounceTimer: null,
        isProcessing: false,
        labelsCache: new Map(),
        allowedLabels: [],
        themeCache: 'light',
        unsubscribeTheme: null
    },

    async initialize() {
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        window.labelFilterUI.setupFilterButton();
        this.setupConversationObserver();
        await this.initializeThemeListener();
    },

    async handleLabelsUpdate(labels) {
        this.updateLabelsCache(labels);
        window.labelFilterUI.updateFilterButton();
    },

    async initializeThemeListener() {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) return;

            if (this.state.unsubscribeTheme) {
                this.state.unsubscribeTheme();
            }

            this.state.unsubscribeTheme = db.collection('settings')
                .doc(currentUser.uid)
                .onSnapshot(doc => {
                    if (doc.exists) {
                        const newTheme = doc.data().theme || 'light';
                        if (this.state.themeCache !== newTheme) {
                            this.state.themeCache = newTheme;
                            window.labelFilterUI.updateThemeUI();
                        }
                    }
                });
        } catch (error) {
            console.error('Theme listener setup failed:', error);
        }
    },

    updateLabelsCache(labels) {
        this.state.labelsCache.clear();
        Object.entries(labels).forEach(([key, data]) => {
            this.state.labelsCache.set(key, data);
        });
    },

    extractMediaCode(url) {
        if (!url) return null;
        if (url.startsWith('data:image')) return url;
        const match = url.match(/\/v2\/([^/]+)\//);
        return match ? match[1] : null;
    },

    async checkLabelMatch(imgSrc, name) {
        if (!this.state.allowedLabels.length) return true;
        if (!imgSrc || !name) return true;

        try {
            const currentImgCode = this.extractMediaCode(imgSrc);
            if (!currentImgCode) return true;

            for (const labelName of this.state.allowedLabels) {
                const labelInfo = this.state.labelsCache.get(labelName);
                if (!labelInfo?.codes) continue;

                const codes = Object.values(labelInfo.codes);
                for (const codeData of codes) {
                    const codeMatch = this.extractMediaCode(codeData.code) === currentImgCode;
                    const nameMatch = codeData.name.toLowerCase() === name.toLowerCase();

                    if (codeMatch && nameMatch) return true;
                }
            }

            return false;
        } catch (error) {
            console.error('Error in label matching:', error);
            return true;
        }
    },

    setupConversationObserver() {
        const listElement = document.querySelector('.msg-conversations-container__conversations-list');
        if (!listElement) return;

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
                    window.labelFilterUI.filterConversations();
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
    },

    cleanup() {
        window.labelsDatabase.removeListener(this.handleLabelsUpdate);

        if (this.state.unsubscribeTheme) {
            this.state.unsubscribeTheme();
            this.state.unsubscribeTheme = null;
        }

        if (this.state.currentObserver) {
            this.state.currentObserver.disconnect();
            this.state.currentObserver = null;
        }

        window.labelFilterUI.cleanup();
        this.state.labelsCache.clear();
        this.state.allowedLabels = [];
    }
};

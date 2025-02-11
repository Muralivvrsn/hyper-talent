class LabelObserverCore {
    constructor() {
        this.state = {
            currentObserver: null,
            routeObserver: null,
            debounceTimer: null,
            unsubscribeFirestore: null,
            profileLabelMap: new Map(),
            isProcessing: false,
            currentView: null,
            updateTimer: null,
            lastUpdate: 0,
            UPDATE_INTERVAL: 1000
        };

        this.initialize = this.initialize.bind(this);
        this.cleanup = this.cleanup.bind(this);
        this.handleLabelsUpdate = this.handleLabelsUpdate.bind(this);
        this.processConversationItem = this.processConversationItem.bind(this);
        
        // Initialize immediately
        this.initialize();
        
        // Add route change listener
        this.setupRouteObserver();
    }

    debounce(func, wait) {
        return (...args) => {
            clearTimeout(this.state.debounceTimer);
            this.state.debounceTimer = setTimeout(() => func.apply(this, args), wait);
        };
    }

    validateProfile(li) {
        const img = li.querySelector('img.presence-entity__image') ||
            li.querySelector('img.msg-facepile-grid__img.msg-facepile-grid__img--person.evi-image');
        const nameSpan = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');

        if (!img?.src || !nameSpan) return null;

        const name = nameSpan.textContent.trim();
        const mediaCode = this.extractMediaCode(img.src);

        return {
            name,
            mediaCode,
            imgSrc: img.src,
            element: li
        };
    }

    findLabelContainer(li) {
        const namesContainer = li.querySelector('.msg-conversation-listitem__participant-names');
        if (!namesContainer) return null;

        return Array.from(namesContainer.children).find(child =>
            (child.style.display === 'flex' && child.style.flexWrap === 'wrap') ||
            child.id.startsWith('label-container-') ||
            child.querySelector('[data-label-key]')
        );
    }

    detectViewChange(mutations) {
        return mutations.some(mutation => 
            mutation.target.classList.contains('msg-conversations-container__conversations-list')
        );
    }

    async handleLabelsUpdate(labelCache) {
        const now = Date.now();
        if (now - this.state.lastUpdate < this.state.UPDATE_INTERVAL) {
            clearTimeout(this.state.updateTimer);
            this.state.updateTimer = setTimeout(() => this.handleLabelsUpdate(labelCache), this.state.UPDATE_INTERVAL);
            return;
        }

        this.state.lastUpdate = now;
        const list = document.querySelector('.msg-conversations-container__conversations-list');
        if (!list) return;

        const items = list.querySelectorAll('li');
        for (const item of items) {
            await this.processConversationItem(item, labelCache);
        }
    }

    async processConversationItem(li, labelCache) {
        const profileInfo = this.validateProfile(li);
        if (!profileInfo) return;

        const existingLabels = this.state.profileLabelMap.get(profileInfo.mediaCode);
        if (existingLabels?.name !== profileInfo.name) {
            const container = this.findLabelContainer(li);
            if (container) {
                container.remove();
                const card = li.querySelector('.msg-conversation-card__content--selectable');
                if (card) card.style.height = '';
            }
        }

        const labelData = {
            code: profileInfo.mediaCode,
            codeName: profileInfo.name,
            labels: [],
            url: null
        };

        // Process labels from cache
        Object.entries(labelCache).forEach(([labelName, labelInfo]) => {
            if (labelInfo.codes) {
                Object.entries(labelInfo.codes).forEach(([codeId, codeInfo]) => {
                    const codeMediaCode = this.extractMediaCode(codeInfo.code);
                    if (codeMediaCode === profileInfo.mediaCode && profileInfo.name === codeInfo.name) {
                        labelData.labels.push({
                            code: profileInfo.imgSrc,
                            codeId: codeId,
                            color: labelInfo.color,
                            name: labelName
                        });

                        if (codeInfo.url) {
                            labelData.url = codeInfo.url;
                        }
                    }
                });
            }
        });

        // Update profile-label map
        this.state.profileLabelMap.set(profileInfo.mediaCode, {
            name: profileInfo.name,
            labels: labelData.labels
        });

        if (labelData.labels.length > 0 || this.findLabelContainer(li)) {
            await this.updateLabelsInDOM(li, labelData);
        }
    }

    async updateLabelsInDOM(li, labelData) {
        const namesContainer = li.querySelector('.msg-conversation-listitem__participant-names');
        if (!namesContainer) return;

        let labelsContainer = this.findLabelContainer(li);
        const mediaCode = this.extractMediaCode(labelData.code);

        if (labelsContainer) {
            const containerPerson = labelsContainer.getAttribute('data-label-person');
            if (containerPerson !== labelData.codeName) {
                labelsContainer.remove();
                labelsContainer = null;
            }
        }

        if (!labelsContainer && labelData?.labels?.length) {
            labelsContainer = this.createLabelContainer(mediaCode, labelData.codeName);
            namesContainer.appendChild(labelsContainer);
        }

        if (labelsContainer && labelData?.labels?.length) {
            this.updateLabelsInContainer(labelsContainer, labelData, mediaCode);

            const card = li.querySelector('.msg-conversation-card__content--selectable');
            if (card && card.style.height !== '110px') {
                card.style.height = '110px';
            }
        }
    }

    createLabelContainer(mediaCode, personName) {
        const container = document.createElement('div');
        container.id = `label-container-${mediaCode}`;
        container.setAttribute('data-label-person', personName);
        container.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-top: 4px;
        `;
        return container;
    }

    updateLabelsInContainer(container, labelData, mediaCode) {
        const existingLabels = new Set(
            Array.from(container.querySelectorAll('[data-label-key]'))
                .map(el => el.getAttribute('data-label-key'))
        );

        labelData.labels.forEach(label => {
            const key = `${label.name}-${mediaCode}`;
            if (!existingLabels.has(key)) {
                const labelTag = this.createLabelTag({
                    ...label,
                    key,
                    mediaCode
                });
                container.appendChild(labelTag);
            }
        });
    }

    createLabelTag(labelData) {
        const container = document.createElement('div');
        container.setAttribute('data-label-name', labelData.name);
        container.setAttribute('data-label-key', labelData.key);
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            margin: 1px;
            border-radius: 20px;
            background-color: ${labelData.color}33;
            color: ${labelData.color} !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
            position: relative;
            transition: padding-right 0.2s ease;
        `;

        const text = document.createElement('span');
        text.textContent = labelData.name;
        text.style.cssText = `
            color: ${labelData.color} !important;
            font-size: 9px;
            font-family: "Poppins", serif !important;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1.1;
        `;

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.cssText = `
            display: none;
            align-items: center;
            justify-content: center;
            padding: 0 2px;
            margin-left: 4px;
            border: none;
            border-radius: 50%;
            color: ${labelData.color} !important;
            font-size: 12px;
            font-family: "Poppins", serif !important;
            line-height: 1;
            cursor: pointer;
            margin-top: -1px;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;

        this.setupLabelInteractions(container, deleteBtn, labelData);

        container.appendChild(text);
        container.appendChild(deleteBtn);
        return container;
    }

    setupLabelInteractions(container, deleteBtn, labelData) {
        container.addEventListener('mouseenter', () => {
            container.style.paddingRight = '6px';
            deleteBtn.style.display = 'flex';
            setTimeout(() => deleteBtn.style.opacity = '1', 0);
        });

        container.addEventListener('mouseleave', () => {
            deleteBtn.style.opacity = '0';
            setTimeout(() => {
                deleteBtn.style.display = 'none';
                container.style.paddingRight = '6px';
            }, 200);
        });

        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.removeLabelFromPerson(labelData.name, labelData.codeId, container);
        });
    }

    async removeLabelFromPerson(labelName, codeId, labelElement) {
        try {
            const { db, currentUser } = await window.firebaseServices.initializeFirebase();
            const userLabelsRef = db.collection('labels').doc(currentUser.uid);
            const userLabelsDoc = await userLabelsRef.get();

            if (!userLabelsDoc.exists) return;

            const labels = userLabelsDoc.data().labels || {};
            if (labels[labelName]?.codes?.[codeId]) {
                delete labels[labelName].codes[codeId];
                await userLabelsRef.update({ labels });

                if (labelElement) {
                    const labelsContainer = labelElement.parentElement;
                    labelElement.remove();

                    if (labelsContainer?.children.length === 0) {
                        const card = labelsContainer.closest('.msg-conversation-card__content--selectable');
                        if (card) card.style.height = '';
                        labelsContainer.remove();
                    }
                }
            }
            window.show_info('Label has been removed');
        } catch (error) {
            console.error('Error removing label:', error);
        }
    }

    extractMediaCode(url) {
        if (!url) return null;
        if (url.startsWith('data:image')) return url;
        const match = url.match(/\/v2\/([^/]+)\//);
        return match ? match[1] : null;
    }

    setupRouteObserver() {
        // Observe URL changes
        this.state.routeObserver = new MutationObserver(this.debounce((mutations) => {
            const currentPath = window.location.pathname;
            if (this.state.currentView !== currentPath) {
                this.state.currentView = currentPath;
                this.cleanup();
                this.initialize();
            }
        }, 500));

        this.state.routeObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async initialize() {
        if (this.state.currentObserver) {
            this.cleanup();
        }

        const observeList = async () => {
            const container = document.querySelector('.msg-conversations-container__conversations-list');
            if (!container) {
                setTimeout(() => observeList(), 1000);
                return;
            }

            const { db, currentUser } = await window.firebaseServices.initializeFirebase();

            // DOM observer
            this.state.currentObserver = new MutationObserver((mutations) => {
                const hasNewNodes = mutations.some(mutation =>
                    mutation.type === 'childList' &&
                    Array.from(mutation.addedNodes).some(node =>
                        node.nodeType === 1 && node.tagName === 'LI'
                    )
                );

                if (!hasNewNodes) return;
            });

            this.state.currentObserver.observe(container, {
                childList: true,
                subtree: true
            });
        };

        observeList();
    }

    cleanup() {
        if (this.state.currentObserver) {
            this.state.currentObserver.disconnect();
            this.state.currentObserver = null;
        }

        if (this.state.unsubscribeFirestore) {
            this.state.unsubscribeFirestore();
            this.state.unsubscribeFirestore = null;
        }

        // Clean up any mismatched containers
        document.querySelectorAll('[id^="label-container-"]').forEach(container => {
            const li = container.closest('li');
            if (li) {
                const nameSpan = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
                if (nameSpan) {
                    const currentName = nameSpan.textContent.trim();
                    const containerPerson = container.getAttribute('data-label-person');

                    if (containerPerson !== currentName) {
                        const card = container.closest('.msg-conversation-card__content--selectable');
                        if (card) card.style.height = '';
                        container.remove();
                    }
                }
            }
        });
    }
}

// Initialize the observer
window.labelObserver = new LabelObserverCore();
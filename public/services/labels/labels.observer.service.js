window.labelsObserver = {
    observer: {
        currentObserver: null,
        routeObserver: null,
        debounceTimer: null,
        unsubscribeFirestore: null,
        profileLabelMap: new Map(), // Track profile-label relationships
        isProcessing: false,
        currentView: null,

        // Your existing helper functions...
        debounce(func, wait) {
            return (...args) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => func.apply(this, args), wait);
            };
        },

        // Enhanced profile validation
        validateProfile(li) {
            const img = li.querySelector('img.presence-entity__image') ||
                li.querySelector('img.msg-facepile-grid__img.msg-facepile-grid__img--person.evi-image');
            const nameSpan = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');

            if (!img?.src || !nameSpan) {
                // console.log('Invalid profile elements:', { hasImg: !!img, hasSrc: !!img?.src, hasNameSpan: !!nameSpan });
                return null;
            }

            const name = nameSpan.textContent.trim();
            const mediaCode = this.extractMediaCode(img.src);

            return {
                name,
                mediaCode,
                imgSrc: img.src,
                element: li
            };
        },

        // Enhanced container finding
        findLabelContainer(li) {
            const namesContainer = li.querySelector('.msg-conversation-listitem__participant-names');
            if (!namesContainer) return null;

            // Try multiple methods to find the container
            return Array.from(namesContainer.children).find(child =>
                (child.style.display === 'flex' && child.style.flexWrap === 'wrap') ||
                child.id.startsWith('label-container-') ||
                child.querySelector('[data-label-key]')
            );
        },

        // Track view changes
        detectViewChange(mutations) {
            for (const mutation of mutations) {
                const target = mutation.target;
                if (target.classList.contains('msg-conversations-container__conversations-list')) {
                    // console.log('View change detected');
                    return true;
                }
            }
            return false;
        },

        // Enhanced process conversation item
        processConversationItem(li, labelCache) {
            const profileInfo = this.validateProfile(li);
            if (!profileInfo) return;

            // console.log('Processing profile:', profileInfo.name, 'with mediaCode:', profileInfo.mediaCode);

            // Check if we have this profile in our map
            const existingLabels = this.profileLabelMap.get(profileInfo.mediaCode);
            if (existingLabels?.name !== profileInfo.name) {
                // Profile changed, clean up old labels
                // console.log('Profile mismatch, cleaning up:', existingLabels?.name, 'vs', profileInfo.name);
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
                        // console.log(codeInfo)
                        if (codeMediaCode === profileInfo.mediaCode && profileInfo.name === codeInfo.name) {
                            // console.log('Found matching label:', labelName, 'for profile:', profileInfo.name);

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
            this.profileLabelMap.set(profileInfo.mediaCode, {
                name: profileInfo.name,
                labels: labelData.labels
            });

            if (labelData.labels.length > 0 || this.findLabelContainer(li)) {
                this.handleLabelsUpdate(li, labelData);
            }
        },

        createLabelTag(labelData) {
            const container = document.createElement('div');
            container.setAttribute('data-label-name', labelData.name);
            container.setAttribute('data-label-key', labelData.key);
            container.style.cssText = `
                display: inline-flex;
                align-items: center;
                padding: 2px 6px;
                margin: 1px;
                border-radius: 3px;
                background-color: ${labelData.color}E6;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
                position: relative;
                transition: padding-right 0.2s ease;
            `;

            const text = document.createElement('span');
            text.textContent = labelData.name;
            text.style.cssText = `
                color: white;
                font-size: 9px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                line-height: 1.1;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.style.cssText = `
                display: none;
                align-items: center;
                justify-content: center;
                padding: 0 2px;
                margin-left: 4px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                color: white;
                font-size: 10px;
                line-height: 1;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;

            this.setupLabelInteractions(container, deleteBtn, labelData);

            container.appendChild(text);
            container.appendChild(deleteBtn);
            return container;
        },

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
        },

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
                window.labelUtil.showToast('Label has been removed', 'info')
            } catch (error) {
                // console.error('Error removing label:', error);
            }
        },
        extractMediaCode(url) {
            if (!url) return null;
            if (url.startsWith('data:image')) return url;
            const match = url.match(/\/v2\/([^/]+)\//);
            return match ? match[1] : null;
        },
        // Continuing from the previous code...

        debounce(func, wait) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
        updateLabelsInContainer(container, labelData, mediaCode) {
            // Only get existing labels for comparison
            const existingLabels = new Set(
                Array.from(container.querySelectorAll('[data-label-key]'))
                    .map(el => el.getAttribute('data-label-key'))
            );

            // Only add new labels that don't exist
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
        },

        createLabelContainer(mediaCode, personName) {
            const container = document.createElement('div');
            container.id = `label-container-${mediaCode}`;
            container.setAttribute('data-label-person', personName); // Add person identifier
            container.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 3px;
                margin-top: 4px;
            `;
            return container;
        },
        handleLabelsUpdate(li, labelData) {
            const namesContainer = li.querySelector('.msg-conversation-listitem__participant-names');
            if (!namesContainer) return;

            let labelsContainer = this.findLabelContainer(li);
            const mediaCode = this.extractMediaCode(labelData.code);

            // Check if container exists but belongs to wrong person
            if (labelsContainer) {
                const containerPerson = labelsContainer.getAttribute('data-label-person');
                if (containerPerson !== labelData.codeName) {
                    labelsContainer.remove();
                    labelsContainer = null;
                }
            }

            // Create new container if needed
            if (!labelsContainer && labelData?.labels?.length) {
                labelsContainer = this.createLabelContainer(mediaCode, labelData.codeName);
                namesContainer.appendChild(labelsContainer);
            }

            if (labelsContainer && labelData?.labels?.length) {
                this.updateLabelsInContainer(labelsContainer, labelData, mediaCode);

                const card = li.querySelector('.msg-conversation-card__content--selectable');
                if (card && card.style.height !== '105px') {
                    card.style.height = '105px';
                }
            }
        },

        initialize() {
            if (this.currentObserver) {
                this.cleanup();
            }

            let updateTimer = null;
            let lastUpdate = 0;
            const UPDATE_INTERVAL = 1000; // Minimum time between updates

            const handleUpdates = (labelCache) => {
                const now = Date.now();
                if (now - lastUpdate < UPDATE_INTERVAL) {
                    clearTimeout(updateTimer);
                    updateTimer = setTimeout(() => handleUpdates(labelCache), UPDATE_INTERVAL);
                    return;
                }

                lastUpdate = now;
                const list = document.querySelector('.msg-conversations-container__conversations-list');
                if (!list) return;

                list.querySelectorAll('li').forEach(item =>
                    this.processConversationItem(item, labelCache)
                );
            };

            const observeList = async () => {
                const container = document.querySelector('.msg-conversations-container__conversations-list');
                if (!container) {
                    setTimeout(() => observeList(), 1000);
                    return;
                }

                const { db, currentUser } = await window.firebaseServices.initializeFirebase();

                // Firestore listener with rate limiting
                this.unsubscribeFirestore = db.collection('labels')
                    .doc(currentUser.uid)
                    .onSnapshot(doc => {
                        if (!doc.exists) return;
                        handleUpdates(doc.data().labels || {});
                    });

                // Optimized mutation observer
                this.currentObserver = new MutationObserver((mutations) => {
                    const hasNewNodes = mutations.some(mutation =>
                        mutation.type === 'childList' &&
                        Array.from(mutation.addedNodes).some(node =>
                            node.nodeType === 1 && node.tagName === 'LI'
                        )
                    );

                    if (!hasNewNodes) return;

                    db.collection('labels')
                        .doc(currentUser.uid)
                        .get()
                        .then(doc => {
                            if (doc.exists) {
                                handleUpdates(doc.data().labels || {});
                            }
                        });
                });

                this.currentObserver.observe(container, {
                    childList: true,
                    subtree: true
                });
            };

            observeList();
        },

        // Enhanced cleanup with complete state reset
        cleanup() {
            if (this.currentObserver) {
                this.currentObserver.disconnect();
                this.currentObserver = null;
            }

            if (this.unsubscribeFirestore) {
                this.unsubscribeFirestore();
                this.unsubscribeFirestore = null;
            }

            // Clean up mismatched containers
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
};
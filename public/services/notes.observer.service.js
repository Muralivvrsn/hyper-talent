// notes.observer.service.js

window.notesObserver = {
    observer: {
        currentObserver: null,
        unsubscribeFirestore: null,
        profileNotesMap: new Map(),
        isProcessing: false,

        extractMediaCode(url) {
            if (!url) {
                // console.log('No URL provided for media code extraction');
                return null;
            }
            if (url.startsWith('data:image')) return url;
            const match = url.match(/\/v2\/([^/]+)\//);
            // console.log('Extracted media code:', match ? match[1] : 'none');
            return match ? match[1] : null;
        },

        validateProfile(li) {
            // console.log('Validating profile for:', li);
            const img = li.querySelector('img.presence-entity__image') ||
                li.querySelector('img.msg-facepile-grid__img.msg-facepile-grid__img--person.evi-image');
            const nameSpan = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');

            if (!img?.src || !nameSpan) {
                // // console.log('Invalid profile elements:', { 
                //     hasImg: !!img, 
                //     hasSrc: !!img?.src, 
                //     hasNameSpan: !!nameSpan
                // });
                return null;
            }

            const profileInfo = {
                name: nameSpan.textContent.trim(),
                mediaCode: this.extractMediaCode(img.src),
                imgSrc: img.src,
                element: li
            };

            // console.log('Validated profile info:', profileInfo);
            return profileInfo;
        },

        findNoteIndicator(li) {
            const indicator = li.querySelector('.note-indicator-container');
            // console.log('Found note indicator:', !!indicator);
            return indicator;
        },
        createNoteIndicator(noteData) {
            // console.log('Creating note indicator for:', noteData.name);
            const container = document.createElement('div');
            container.className = 'note-indicator-container';
            container.setAttribute('data-note-key', noteData.key);
            container.setAttribute('data-profile-name', noteData.name);
            container.setAttribute('data-media-code', noteData.code);
            container.style.cssText = `
                position: absolute;
                top: 3px;
                right: 5px;
                z-index: 2;
                display: flex;
                align-items: center;
                gap: 4px;
            `;

            const indicator = document.createElement('div');
            indicator.className = 'note-indicator';
            indicator.style.cssText = `
                width: 16px;
                height: 16px;
                background-color: #0A66C2;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;

            indicator.innerHTML = `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            `;

            const truncatedNote = noteData.noteText.length > 50 
                ? noteData.noteText.substring(0, 50) + '...' 
                : noteData.noteText;
            indicator.title = truncatedNote;

            container.appendChild(indicator);
            return container;
        },

        updateNoteIndicator(li, noteData) {
            // console.log('Updating note indicator:', noteData);
            let indicatorContainer = this.findNoteIndicator(li);

            if (indicatorContainer) {
                const currentName = indicatorContainer.getAttribute('data-profile-name');
                const currentCode = indicatorContainer.getAttribute('data-media-code');
                if (currentName !== noteData.name || currentCode !== noteData.code) {
                    // console.log('Removing mismatched indicator');
                    indicatorContainer.remove();
                    indicatorContainer = null;
                }
            }

            if (noteData.hasNote) {
                if (!indicatorContainer) {
                    // console.log('Creating new indicator');
                    indicatorContainer = this.createNoteIndicator(noteData);
                    const card = li.querySelector('.msg-conversation-card__content--selectable');
                    // console.log(card)
                    if (card) {
                        card.style.position = 'relative';
                        card.appendChild(indicatorContainer);
                    }
                }
            }
        },

        async processConversationItem(li, notesCache) {
            // console.log('Processing conversation item');
            const profileInfo = this.validateProfile(li);
            if (!profileInfo) {
                // Remove any existing indicators if profile is invalid
                const existingIndicator = this.findNoteIndicator(li);
                if (existingIndicator) {
                    existingIndicator.remove();
                }
                // console.log('Invalid profile info, removing any existing indicators');
                return;
            }

            // console.log('Processing profile:', {
            //     name: profileInfo.name,
            //     mediaCode: profileInfo.mediaCode
            // });

            let hasMatchingNote = false;

            // Process notes for this profile
            Object.entries(notesCache).forEach(([key, noteData]) => {
                const noteMediaCode = this.extractMediaCode(noteData.code);
                if (noteMediaCode === profileInfo.mediaCode && profileInfo.name === noteData.name) {
                    hasMatchingNote = true;
                    // Update profile-notes map
                    this.profileNotesMap.set(key, {
                        name: profileInfo.name,
                        mediaCode: profileInfo.mediaCode,
                        noteText: noteData.note
                    });

                    // Update UI
                    this.updateNoteIndicator(li, {
                        code: profileInfo.mediaCode,
                        name: profileInfo.name,
                        hasNote: true,
                        noteText: noteData.note,
                        key: key
                    });
                }
            });

            // If no matching note was found, remove any existing indicator
            if (!hasMatchingNote) {
                const existingIndicator = this.findNoteIndicator(li);
                if (existingIndicator) {
                    // console.log('Removing indicator for profile without matching note');
                    existingIndicator.remove();
                }
            }
        },

        handleUpdates(notesCache) {
            // console.log('Handling updates with cache:', notesCache);
            const list = document.querySelector('.msg-conversations-container__conversations-list');
            if (!list) {
                // console.log('No conversation list found');
                return;
            }

            // Get all current note indicators
            const existingIndicators = document.querySelectorAll('.note-indicator-container');
            const validKeys = new Set(Object.keys(notesCache));

            // Remove indicators whose notes no longer exist in the database
            existingIndicators.forEach(indicator => {
                const noteKey = indicator.getAttribute('data-note-key');
                if (!validKeys.has(noteKey)) {
                    // console.log(`Removing indicator for deleted note: ${noteKey}`);
                    indicator.remove();
                }
            });

            // Process all conversation items
            const items = list.querySelectorAll('li');
            // console.log(`Processing ${items.length} conversation items`);
            items.forEach(item => this.processConversationItem(item, notesCache));
        },

        initialize() {
            // console.log('Initializing notes observer');
            if (this.currentObserver) {
                this.cleanup();
            }

            let updateTimer = null;
            const UPDATE_INTERVAL = 1000;

            const observeList = async () => {
                const container = document.querySelector('.msg-conversations-container__conversations-list');
                if (!container) {
                    // console.log('No container found, retrying...');
                    setTimeout(() => observeList(), 1000);
                    return;
                }

                try {
                    const { db, currentUser } = await window.firebaseService.initializeFirebase();
                    // console.log('Firebase initialized');

                    // Listen for database changes
                    this.unsubscribeFirestore = db.collection('notes')
                        .doc(currentUser.uid)
                        .onSnapshot(doc => {
                            // console.log('Received Firestore update');
                            if (doc.exists) {
                                clearTimeout(updateTimer);
                                updateTimer = setTimeout(() => {
                                    this.handleUpdates(doc.data() || {});
                                }, UPDATE_INTERVAL);
                            } else {
                                // If document doesn't exist, remove all indicators
                                document.querySelectorAll('.note-indicator-container').forEach(container => {
                                    container.remove();
                                });
                            }
                        });

                    // Observe DOM changes
                    this.currentObserver = new MutationObserver((mutations) => {
                        const hasRelevantChanges = mutations.some(mutation =>
                            mutation.type === 'childList' ||
                            (mutation.type === 'attributes' && mutation.target.matches('img.presence-entity__image, img.msg-facepile-grid__img'))
                        );

                        if (!hasRelevantChanges) return;
                        // console.log('Relevant DOM changes detected');

                        db.collection('notes')
                            .doc(currentUser.uid)
                            .get()
                            .then(doc => {
                                if (doc.exists) {
                                    this.handleUpdates(doc.data() || {});
                                }
                            });
                    });

                    this.currentObserver.observe(container, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['src']
                    });
                    // console.log('Observers set up successfully');

                } catch (error) {
                    // console.error('Error initializing notes observer:', error);
                }
            };

            observeList();
        },

        cleanup() {
            // console.log('Cleaning up notes observer');
            if (this.currentObserver) {
                this.currentObserver.disconnect();
                this.currentObserver = null;
            }

            if (this.unsubscribeFirestore) {
                this.unsubscribeFirestore();
                this.unsubscribeFirestore = null;
            }

            document.querySelectorAll('.note-indicator-container').forEach(container => {
                container.remove();
            });

            this.profileNotesMap.clear();
            // console.log('Cleanup complete');
        }
    }
};
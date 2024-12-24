window.labelsFilter = {
    observer: {
        currentObserver: null,
        debounceTimer: null,
        unsubscribeFirestore: null,
        isProcessing: false,
        labelsCache: new Map(),
        isFirestoreInitialized: false,
        allowedLabels: [],
        db: null,
        themeCache: 'light',

        async initializeFirestoreListener() {
            if (this.isFirestoreInitialized) {
                return;
            }
        
            try {
                const { db, currentUser } = await window.firebaseService.initializeFirebase();
                this.db = db;
        
                // Labels listener
                this.unsubscribeFirestore = db.collection('labels')
                    .doc(currentUser.uid)
                    .onSnapshot(doc => {
                        if (!doc.exists) return;
                        const labels = doc.data().labels || {};
                        this.updateLabelsCache(labels);
                        this.updateFilterButton();
                    });
        
                // Theme listener with UI update
                this.unsubscribeTheme = db.collection('settings')
                    .doc(currentUser.uid)
                    .onSnapshot(doc => {
                        if (doc.exists) {
                            console.log(doc.data())
                            const newTheme = doc.data().theme || 'light';
                            console.log(newTheme)
                            if (this.themeCache !== newTheme) {
                                this.themeCache = newTheme;
                                console.log(this.themeCache)
                                this.updateThemeUI();
                            }
                        }
                    });
        
                this.isFirestoreInitialized = true;
            } catch (error) {
                this.isFirestoreInitialized = false;
            }
        },
        
        // Add new method to update UI when theme changes
        updateThemeUI() {
            const isDarkTheme = this.themeCache === 'dark';
            
            // Update dropdown if it exists
            const dropdown = document.querySelector('#linkedin-label-dropdown');
            if (dropdown) {
                dropdown.style.backgroundColor = isDarkTheme ? '#1D2226' : '#ffffff';
                dropdown.style.boxShadow = isDarkTheme ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)';
                dropdown.style.border = `1px solid ${isDarkTheme ? '#38434F' : '#e0e0e0'}`;
        
                // Update all list items in the dropdown
                const items = dropdown.querySelectorAll('li');
                items.forEach(item => {
                    item.style.backgroundColor = isDarkTheme ? '#1D2226' : '#ffffff';
                    
                    // Update checkbox in each item
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.style.backgroundColor = isDarkTheme ? '#1D2226' : '#ffffff';
                        checkbox.style.borderColor = checkbox.checked ? '#0a66c2' : (isDarkTheme ? '#666666' : '#00000099');
                    }
        
                    // Update text in each item
                    const textSpan = item.querySelector('span');
                    if (textSpan) {
                        textSpan.style.color = isDarkTheme ? '#ffffff' : 'rgba(0, 0, 0, 0.9)';
                    }
                });
            }
        },
        

        updateLabelsCache(labels) {
            const previousSize = this.labelsCache.size;
            this.labelsCache.clear();
            Object.entries(labels).forEach(([key, data]) => {
                // console.log(`Caching label: ${key}`, data);
                this.labelsCache.set(key, data);
            });
            // console.log(`Labels cache updated: ${this.labelsCache.size} labels available (previous: ${previousSize})`);
        },

        extractMediaCode(url) {
            if (!url) {
                // console.log('No URL provided for media code extraction');
                return null;
            }
            if (url.startsWith('data:image')) {
                // console.log('Data URL detected, using as is');
                return url;
            }
            const match = url.match(/\/v2\/([^/]+)\//);
            const result = match ? match[1] : null;
            // console.log(`Extracted media code from ${url}: ${result}`);
            return result;
        },

        async checkLabelMatch(imgSrc, name) {
            if (!this.allowedLabels.length) {
                // console.log('No filters active, showing all');
                return true;
            }
        
            if (!imgSrc || !name) {
                // console.log('Missing image or name, showing by default');
                return true;
            }
        
            try {
                const currentImgCode = this.extractMediaCode(imgSrc);
                if (!currentImgCode) return true;
        
                for (const labelName of this.allowedLabels) {
                    const labelInfo = this.labelsCache.get(labelName);
                    if (!labelInfo?.codes) continue;
        
                    const codes = Object.values(labelInfo.codes);
                    for (const codeData of codes) {
                        const codeMatch = this.extractMediaCode(codeData.code) === currentImgCode;
                        const nameMatch = codeData.name.toLowerCase() === name.toLowerCase();
        
                        if (codeMatch && nameMatch) {
                            // console.log(`Match found for ${name} with label ${labelName}`);
                            return true;
                        }
                    }
                }
        
                return false;
            } catch (error) {
                // console.error('Error in label matching:', error);
                return true;
            }
        },
        
        async filterConversations() {
            const conversations = document.querySelectorAll('.msg-conversations-container__conversations-list > li');
            const conversationsList = conversations[0]?.parentNode;
            
            // Check if loading message already exists
            let loadingEl = document.querySelector('.prism-loading-message');
            
            if (!loadingEl) {
                loadingEl = document.createElement('div');
                loadingEl.className = 'prism-loading-message';
                loadingEl.style.cssText = `
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 13px;
                    background: rgba(255, 255, 255, 0.95);
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    z-index: 100;
                    border-top: 1px solid #eee;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;
                loadingEl.innerHTML = 'Filtering conversations...';
                conversationsList.style.position = 'relative';  // Ensure absolute positioning works
                conversationsList.appendChild(loadingEl);
            }
        
            // Hide all conversations initially
            conversations.forEach(conv => {
                conv.style.display = 'none';
                conv.style.opacity = '0';
            });
        
            let foundFirstMatch = false;
            
            for (const [index, conversation] of Array.from(conversations).entries()) {
                const imgEl = conversation.querySelector('.msg-selectable-entity__entity img') || 
                             conversation.querySelector('.msg-facepile-grid--no-facepile img');
                const nameEl = conversation.querySelector('.msg-conversation-listitem__participant-names .truncate');
        
                if (!imgEl || !nameEl) continue;
        
                const imgSrc = imgEl.getAttribute('src');
                const name = nameEl.textContent.trim();
        
                const isMatch = await this.checkLabelMatch(imgSrc, name);
                
                if (isMatch) {
                    if (!foundFirstMatch) {
                        foundFirstMatch = true;
                        // Modify loading message position to be below matches
                        loadingEl.style.top = 'auto';
                        loadingEl.style.bottom = '0';
                        loadingEl.style.background = 'linear-gradient(rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)';
                    }
                    
                    conversation.style.transition = 'opacity 0.3s ease';
                    conversation.style.display = 'block';
                    await new Promise(resolve => setTimeout(resolve, 50));
                    conversation.style.opacity = '1';
                }
        
                loadingEl.textContent = `Filtering conversations... (${index + 1}/${conversations.length})`;
            }
            
            loadingEl.remove();
        },

        
        createFilterDropdown() {
            const labelButton = document.querySelector('#hypertalent-filter-btn');
            const buttonRect = labelButton.getBoundingClientRect();
        
            const dropdown = document.createElement('div');
            dropdown.id = 'hypertalent-dropdown';
            dropdown.className = 'hypertalent-dropdown';
            
            // Function to update position
            const updatePosition = () => {
                const newRect = labelButton.getBoundingClientRect();
                dropdown.style.position = 'fixed';
                dropdown.style.top = `${newRect.bottom + window.scrollY + 5}px`;
                dropdown.style.left = `${newRect.left + window.scrollX}px`;
                dropdown.style.zIndex = '1000';
            };
        
            // Initial position
            updatePosition();
        
            const labelList = document.createElement('ul');
            labelList.className = 'hypertalent-list';
            labelList.setAttribute('data-hypertalent', 'true'); // Add this attribute
        
            this.labelsCache.forEach((labelData, labelName) => {
                const labelItem = this.createLabelItem(labelName);
                labelList.appendChild(labelItem);
            });
        
            dropdown.appendChild(labelList);
        
            // Better resize and scroll handlers
            const handleResize = () => {
                requestAnimationFrame(updatePosition);
            };
        
            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleResize);
        
            // Cleanup listeners when dropdown is removed
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.removedNodes.forEach((node) => {
                        if (node === dropdown) {
                            window.removeEventListener('resize', handleResize);
                            window.removeEventListener('scroll', handleResize);
                            observer.disconnect();
                        }
                    });
                });
            });
        
            observer.observe(document.body, { childList: true });
        
            return dropdown;
        },
        
        createLabelItem(labelName) {
            const labelContainer = document.createElement('li');
            labelContainer.className = 'hypertalent-list-item';
            labelContainer.setAttribute('data-hypertalent', 'true');
        
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'hypertalent-checkbox';
            checkbox.id = `hypertalent-checkbox-${labelName}`; // More specific ID
            checkbox.name = 'label-filter-value';
            checkbox.checked = this.allowedLabels.includes(labelName);
            checkbox.setAttribute('data-hypertalent', 'true');
        
            const label = document.createElement('label');
            label.className = 'hypertalent-checkbox-label';
            label.htmlFor = `hypertalent-checkbox-${labelName}`;
            label.textContent = labelName;
            label.setAttribute('data-hypertalent', 'true');
        
            labelContainer.appendChild(checkbox);
            labelContainer.appendChild(label);
        
            checkbox.onchange = () => {
                if (checkbox.checked) {
                    this.allowedLabels.push(labelName);
                } else {
                    const index = this.allowedLabels.indexOf(labelName);
                    if (index > -1) {
                        this.allowedLabels.splice(index, 1);
                    }
                }
                this.filterConversations();
            };
        
            return labelContainer;
        },

        setupFilterButton() {
            const titleRow = document.querySelector('.msg-conversations-container__title-row');
            if (!titleRow || document.querySelector('#hypertalent-filter-btn')) {
                // console.log('Title row not found or button already exists');
                return;
            }

            const filterButton = document.createElement('button');
            filterButton.id = 'hypertalent-filter-btn';
            filterButton.className = 'artdeco-pill artdeco-pill--slate artdeco-pill--3 artdeco-pill--choice ember-view';
            filterButton.style.marginLeft = '8px';
            
            filterButton.innerHTML = `
                <span class="artdeco-pill__text">
                    Filters
                </span>
            `;

            let dropdown = null;

            filterButton.addEventListener('click', () => {
                const existingDropdown = document.querySelector('#hypertalent-dropdown');
                if (existingDropdown) {
                    existingDropdown.remove();
                    return;
                }
            
                const dropdown = this.createFilterDropdown();
                document.body.appendChild(dropdown);
            
                // Close dropdown when clicking outside
                const handleClickOutside = (event) => {
                    if (!dropdown.contains(event.target) && !filterButton.contains(event.target)) {
                        dropdown.remove();
                        document.removeEventListener('click', handleClickOutside);
                    }
                };
            
                setTimeout(() => {
                    document.addEventListener('click', handleClickOutside);
                }, 0);
            });

            titleRow.appendChild(filterButton);
            // console.log('Filter button added to title row');
        },

        updateFilterButton() {
            // console.log('Updating filter button');
            this.setupFilterButton();
        },

        debounce(func, wait) {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        initialize() {
            // console.log('Initializing labels filter');
            this.initializeFirestoreListener();
            this.setupFilterButton();
            
            // Add conversation list observer with optimization
            const listElement = document.querySelector('.msg-conversations-container__conversations-list');
            if (listElement) {
                let previousLength = listElement.children.length;
                let previousFirstChild = listElement.firstElementChild;
        
                const observer = new MutationObserver(this.debounce((mutations) => {
                    // Check if mutations actually affect the conversation list
                    const hasRelevantChanges = mutations.some(mutation => {
                        // Check for added or removed nodes
                        if (mutation.type === 'childList') {
                            return true;
                        }
                        
                        // For attribute changes, only care about display/visibility related ones
                        if (mutation.type === 'attributes') {
                            const relevantAttributes = ['style', 'class', 'hidden'];
                            return relevantAttributes.includes(mutation.attributeName);
                        }
                        
                        return false;
                    });
        
                    // Check if the list structure has actually changed
                    const currentLength = listElement.children.length;
                    const currentFirstChild = listElement.firstElementChild;
                    const hasStructuralChanges = 
                        previousLength !== currentLength || 
                        previousFirstChild !== currentFirstChild;
        
                    // Update previous values
                    previousLength = currentLength;
                    previousFirstChild = currentFirstChild;
        
                    // Only proceed if there are relevant changes and we have active filters
                    if (hasRelevantChanges && hasStructuralChanges && this.allowedLabels.length > 0) {
                        // Check if the list is actually loaded
                        const hasLoadedConversations = Array.from(listElement.children).some(child => 
                            child.querySelector('.msg-conversation-listitem__participant-names')
                        );
        
                        if (hasLoadedConversations) {
                            this.filterConversations();
                        }
                    }
                }, 300));
        
                observer.observe(listElement, {
                    childList: true,
                    subtree: false, // Only watch direct children
                    attributes: true,
                    attributeFilter: ['style', 'class', 'hidden'] // Only watch relevant attributes
                });
        
                // Store observer reference for cleanup
                this.currentObserver = observer;
            }
        },
        
        // Add this to cleanup method
        cleanup() {
            if (this.unsubscribeFirestore) {
                this.unsubscribeFirestore();
                this.unsubscribeFirestore = null;
            }
        
            if (this.unsubscribeTheme) {
                this.unsubscribeTheme();
                this.unsubscribeTheme = null;
            }
        
            if (this.currentObserver) {
                this.currentObserver.disconnect();
                this.currentObserver = null;
            }
        
            const button = document.querySelector('#hypertalent-filter-btn');
            if (button) button.remove();
        
            const dropdown = document.querySelector('#linkedin-label-filter-dropdown');
            if (dropdown) dropdown.remove();
        
            this.labelsCache.clear();
            this.allowedLabels = [];
            this.isFirestoreInitialized = false;
        }
    }
};
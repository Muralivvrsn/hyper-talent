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

        async initializeFirestoreListener() {
            if (this.isFirestoreInitialized) {
                // console.log('Firestore already initialized for labels filter');
                return;
            }

            try {
                const { db, currentUser } = await window.firebaseService.initializeFirebase();
                this.db = db;
                // console.log('Initializing Firestore listener for labels filter with user:', currentUser.uid);

                this.unsubscribeFirestore = db.collection('labels')
                    .doc(currentUser.uid)
                    .onSnapshot(doc => {
                        // console.log('Labels document update received');
                        if (!doc.exists) {
                            // console.log('No labels document found for user');
                            return;
                        }
                        const labels = doc.data().labels || {};
                        // console.log('Fetched labels:', labels);
                        this.updateLabelsCache(labels);
                        this.updateFilterButton();
                    });

                this.isFirestoreInitialized = true;
                // console.log('Firestore listener initialized successfully');
            } catch (error) {
                // console.error('Error initializing Firestore listener:', error);
                this.isFirestoreInitialized = false;
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
            // console.log('Filtering conversations with labels:', this.allowedLabels);
            const conversations = document.querySelectorAll('.msg-conversations-container__conversations-list > li');
        
            for (const conversation of conversations) {
                const imgEl = conversation.querySelector('.msg-selectable-entity__entity img') || 
                             conversation.querySelector('.msg-facepile-grid--no-facepile img');
                const nameEl = conversation.querySelector('.msg-conversation-listitem__participant-names .truncate');
        
                if (!imgEl || !nameEl) continue;
        
                const imgSrc = imgEl.getAttribute('src');
                const name = nameEl.textContent.trim();
        
                const isMatch = await this.checkLabelMatch(imgSrc, name);
                conversation.style.display = isMatch ? 'block' : 'none';
                // console.log(`${name}: ${isMatch ? 'showing' : 'hiding'}`);
            }
        },

        createFilterDropdown() {
            const labelButton = document.querySelector('#linkedin-label-filter-btn');
            const buttonRect = labelButton.getBoundingClientRect();
        
            const dropdown = document.createElement('div');
            dropdown.className = 'scaffold-layout__list-detail';
            dropdown.id = 'linkedin-label-dropdown';
            dropdown.style.cssText = `
                position: fixed;
                top: ${buttonRect.bottom + window.scrollY + 5}px;
                left: ${buttonRect.left + window.scrollX}px;
                border-radius: 4px;
                padding: 8px;
                z-index: 1000;
                min-width: 200px;
                width: 200px;
                padding-top: 0;
                height: fit-content;
                background-color: white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
        
            const labelList = document.createElement('ul');
            labelList.className = 'list-style-none relative search-reusables__collection-values-container search-reusables__collection-values-container--50vh';
            labelList.style.maxHeight = '300px';
            labelList.style.overflowY = 'auto';
        
            // Add your labels here
            this.labelsCache.forEach((labelData, labelName) => {
                const labelItem = this.createLabelItem(labelName, labelData);
                labelList.appendChild(labelItem);
            });
        
            dropdown.appendChild(labelList);
        
            // Handle window resize
            window.addEventListener('resize', () => {
                const newRect = labelButton.getBoundingClientRect();
                dropdown.style.top = `${newRect.bottom + window.scrollY + 5}px`;
                dropdown.style.left = `${newRect.left + window.scrollX}px`;
            });
        
            return dropdown;
        },

        createSelectAllItem() {
            const item = document.createElement('li');
            item.style.cssText = `
                padding: 8px;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: background-color 0.15s ease;
                font-weight: bold;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.marginRight = '8px';
            checkbox.checked = this.allowedLabels.length === this.labelsCache.size;

            const label = document.createElement('span');
            label.textContent = 'Select All';
            label.style.fontSize = '14px';

            item.appendChild(checkbox);
            item.appendChild(label);

            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f3f6f8';
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.allowedLabels = Array.from(this.labelsCache.keys());
                } else {
                    this.allowedLabels = [];
                }
                
                // Update all other checkboxes
                const dropdown = document.querySelector('#linkedin-label-filter-dropdown');
                if (dropdown) {
                    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => {
                        if (cb !== checkbox) {
                            cb.checked = checkbox.checked;
                        }
                    });
                }
                
                // console.log('Select all toggled:', checkbox.checked);
                this.filterConversations();
            });

            return item;
        },

        createLabelItem(labelName, labelData) {
            const labelContainer = document.createElement('li');
            labelContainer.className = 'search-reusables__collection-values-item';
        
            const checkbox = document.createElement('input');
            checkbox.className = 'search-reusables__select-input';
            checkbox.type = 'checkbox';
            checkbox.id = `label-${labelName}`;
            checkbox.name = 'label-filter-value';
            checkbox.checked = this.allowedLabels.includes(labelName);
        
            const label = document.createElement('label');
            label.className = 'search-reusables__value-label';
            label.htmlFor = `label-${labelName}`;
        
            const paragraph = document.createElement('p');
            paragraph.className = 'display-flex';
        
            const textSpan = document.createElement('span');
            textSpan.className = 't-14 t-black--light t-normal';
            textSpan.setAttribute('aria-hidden', 'true');
            textSpan.textContent = labelName;
        
            const visibleSpan = document.createElement('span');
            visibleSpan.className = 'visually-hidden';
            visibleSpan.textContent = `Filter by ${labelName}`;
        
            paragraph.appendChild(textSpan);
            paragraph.appendChild(visibleSpan);
            label.appendChild(paragraph);
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
            // console.log('Setting up filter button');
            const titleRow = document.querySelector('.msg-conversations-container__title-row');
            if (!titleRow || document.querySelector('#linkedin-label-filter-btn')) {
                // console.log('Title row not found or button already exists');
                return;
            }

            const filterButton = document.createElement('button');
            filterButton.id = 'linkedin-label-filter-btn';
            filterButton.className = 'artdeco-pill artdeco-pill--slate artdeco-pill--3 artdeco-pill--choice ember-view';
            filterButton.style.marginLeft = '8px';
            
            filterButton.innerHTML = `
                <span class="artdeco-pill__text">
                    Labels
                </span>
            `;

            let dropdown = null;

            filterButton.addEventListener('click', () => {
                // console.log('Filter button clicked');
                if (dropdown?.parentNode) {
                    // console.log('Removing existing dropdown');
                    dropdown.remove();
                    dropdown = null;
                    return;
                }

                dropdown = this.createFilterDropdown();
                document.body.appendChild(dropdown);

                const closeDropdown = (event) => {
                    if (!dropdown?.contains(event.target) && !filterButton.contains(event.target)) {
                        // console.log('Closing dropdown due to outside click');
                        dropdown?.remove();
                        dropdown = null;
                        document.removeEventListener('click', closeDropdown);
                    }
                };

                setTimeout(() => {
                    document.addEventListener('click', closeDropdown);
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
            
            // Add conversation list observer
            const listElement = document.querySelector('.msg-conversations-container__conversations-list');
            if (listElement) {
                const observer = new MutationObserver(this.debounce(() => {
                    if (this.allowedLabels.length > 0) {
                        this.filterConversations();
                    }
                }, 300));
        
                observer.observe(listElement, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });
            }
        },

        cleanup() {
            // console.log('Cleaning up labels filter');
            if (this.unsubscribeFirestore) {
                this.unsubscribeFirestore();
                this.unsubscribeFirestore = null;
                this.isFirestoreInitialized = false;
            }

            const button = document.querySelector('#linkedin-label-filter-btn');
            if (button) button.remove();

            const dropdown = document.querySelector('#linkedin-label-filter-dropdown');
            if (dropdown) dropdown.remove();

            this.labelsCache.clear();
            this.allowedLabels = [];
            // console.log('Labels filter cleanup complete');
        }
    }
};
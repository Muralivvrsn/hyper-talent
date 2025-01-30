// ProfileLabels.js
class ProfileLabels {
    constructor() {
        console.log('[ProfileLabels] Initializing...');
        this.labels = {};
        this.currentProfileId = null;
        this.initialized = false;
        this.styles = this.createStyles();
        this.labelContainerRef = null;
        this.boundHandleLabelsUpdate = this.handleLabelsUpdate.bind(this);
        this.setupUrlListener();
    }

    setupUrlListener() {
        console.log('[ProfileLabels] Setting up URL listener');
        let lastUrl = window.location.href;
        
        setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                console.log('[ProfileLabels] URL changed:', currentUrl);
                lastUrl = currentUrl;
                
                if (currentUrl.includes('linkedin.com/in/')) {
                    console.log('[ProfileLabels] Profile page detected, initializing...');
                    this.init();
                } else {
                    console.log('[ProfileLabels] Not a profile page, destroying...');
                    this.destroy();
                }
            }
        }, 2000);
    }

    createStyles() {
        console.log('[ProfileLabels] Creating styles');
        const styles = document.createElement('style');
        styles.textContent = `
            .hypertalent-profile-labels-container {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                margin: 8px 0 !important;
                width: 350px !important;
            }
    
            .hypertalent-profile-label {
                display: inline-flex !important;
                align-items: center !important;
                padding: 2px 8px !important;
                border-radius: 20px !important;
                font-size: 9px !important;
                font-family: "Poppins", serif !important;
                font-weight: 500 !important;
                cursor: default !important;
                position: relative !important;
                transition: padding-right 0.3s ease !important;
            }
    
            .hypertalent-profile-label-text {
                transition: margin-right 0.3s ease !important;
            }
    
            .hypertalent-profile-label-delete {
                position: absolute !important;
                right: -20px !important;
                opacity: 0 !important;
                visibility: hidden !important;
                margin-left: 6px !important;
                cursor: pointer !important;
                font-weight: bold !important;
                font-size: 14px !important;
                font-family: "Poppins", serif !important;
                transition: all 0.3s ease !important;
            }
    
            .hypertalent-profile-label:hover .hypertalent-profile-label-text {
                margin-right: 20px !important;
            }
    
            .hypertalent-profile-label:hover .hypertalent-profile-label-delete {
                right: 4px !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
    
            .hypertalent-profile-label-delete:hover {
                opacity: 1 !important;
                transform: scale(1.2) !important;
                // color: red !important;
            }
    
            .hypertalent-profile-no-labels {
                font-size: 12px !important;
                color: #666 !important;
                padding: 8px 12px !important;
                background-color: #f3f6f8 !important;
                border-radius: 6px !important;
                margin: 4px 0 !important;
                display: inline-flex !important;
                align-items: center !important;
                font-style: italic !important;
                transition: all 0.2s ease !important;
            }
        `;
        return styles;
    }

    async init() {
        console.log('[ProfileLabels] Initializing profile labels');
        if (this.initialized) {
            console.log('[ProfileLabels] Already initialized, skipping');
            return;
        }
        document.head.appendChild(this.styles);
        window.labelsDatabase.addListener(this.boundHandleLabelsUpdate);
        await this.setupProfile();
        this.initialized = true;
        console.log('[ProfileLabels] Initialization complete');
    }

    async setupProfile() {
        console.log('[ProfileLabels] Setting up profile');
        const profileInfo = await this.getProfileInfo();
        if (!profileInfo) {
            console.log('[ProfileLabels] No profile info found');
            return;
        }
        console.log('[ProfileLabels] Profile info:', profileInfo);
        this.currentProfileId = this.createProfileId(profileInfo.connectionCode);
        await this.createLabelsContainer();
    }

    extractUsername(url) {
        console.log('[ProfileLabels] Extracting username from:', url);
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        const username = match ? match[1] : '';
        console.log('[ProfileLabels] Extracted username:', username);
        return username;
    }

    extractConnectionCode(url) {
        console.log('[ProfileLabels] Extracting connection code from:', url);
        const connectionMatch = url.match(/connectionOf=%5B%22(.*?)%22%5D/) || 
                              url.match(/connectionOf=\["([^"]+)"\]/);
        const mutualMatch = url.match(/facetConnectionOf=%22(.*?)%22/) || 
                           url.match(/facetConnectionOf="([^"]+)"/);
        const code = (connectionMatch || mutualMatch)?.[1] || null;
        console.log('[ProfileLabels] Extracted connection code:', code);
        return code;
    }

    createProfileId(connectionCode) {
        console.log('[ProfileLabels] Creating profile ID from:', connectionCode);
        return connectionCode || null;
    }

    async waitForElement(selector, timeout = 5000) {
        console.log('[ProfileLabels] Waiting for element:', selector);
        const element = document.querySelector(selector);
        if (element) {
            console.log('[ProfileLabels] Element found immediately');
            return element;
        }

        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    console.log('[ProfileLabels] Element found after waiting');
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                console.log('[ProfileLabels] Element wait timeout');
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    async getProfileInfo() {
        console.log('[ProfileLabels] Getting profile info');
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
                url,
                profileId: this.createProfileId(connectionCode),
                connectionCode,
                name,
                username,
                imageUrl,
                addedAt: new Date().toISOString()
            };
            
            console.log('[ProfileLabels] Profile info collected:', profileInfo);
            return profileInfo;
        } catch (error) {
            console.error('[ProfileLabels] Error getting profile info:', error);
            window.show_error('Error getting profile info');
            return null;
        }
    }

    async createLabelsContainer() {
        console.log('[ProfileLabels] Creating labels container');
        const targetElement = await this.waitForElement('section[data-member-id] > .ph5 > div:nth-child(2)');
        if (!targetElement) {
            console.log('[ProfileLabels] Target element not found');
            return;
        }

        console.log('[ProfileLabels] Target element found:', targetElement);
        let container = document.querySelector('.hypertalent-profile-labels-container');
        
        if (!container) {
            console.log('[ProfileLabels] Creating new container');
            container = document.createElement('div');
            container.className = 'hypertalent-profile-labels-container';
            targetElement.insertBefore(container, targetElement.firstChild);
        } else {
            console.log('[ProfileLabels] Container already exists');
        }

        this.labelContainerRef = container;
        this.updateLabelsDisplay();
    }

    handleLabelsUpdate(newLabels) {
        console.log('[ProfileLabels] Handling labels update:', newLabels);
        if (!Array.isArray(newLabels)) {
            console.log('[ProfileLabels] Invalid labels data');
            return;
        }
        
        this.labels = newLabels.reduce((acc, label) => {
            acc[label.label_name] = {
                color: label.label_color,
                label_id: label.label_id,
                codes: label.profiles.reduce((profileAcc, profile) => {
                    if (profile?.profile_id) {
                        profileAcc[profile.profile_id] = {
                            addedAt: new Date().toISOString(),
                            name: profile.name,
                            url: profile.image_url,
                            code: profile.code
                        };
                    }
                    return profileAcc;
                }, {})
            };
            return acc;
        }, {});

        console.log('[ProfileLabels] Processed labels:', this.labels);
        this.updateLabelsDisplay();
    }

    updateLabelsDisplay() {
        console.log('[ProfileLabels] Updating labels display');
        if (!this.labelContainerRef) {
            console.log('[ProfileLabels] No container reference');
            return;
        }

        this.labelContainerRef.innerHTML = '';
        console.log('[ProfileLabels] Current profile ID:', this.currentProfileId);

        const matchingLabels = Object.entries(this.labels)
            .filter(([, labelData]) => {
                const hasLabel = labelData.codes && Object.keys(labelData.codes).includes(this.currentProfileId);
                console.log('[ProfileLabels] Checking label match:', hasLabel);
                return hasLabel;
            })
            .map(([name, data]) => ({
                name,
                color: data.color,
                label_id: data.label_id
            }));

        console.log('[ProfileLabels] Matching labels:', matchingLabels);

        if (matchingLabels.length === 0) {
            console.log('[ProfileLabels] No matching labels found');
            const noLabels = document.createElement('div');
            noLabels.className = 'hypertalent-profile-no-labels';
            noLabels.textContent = 'Found a fresh face! Want to add them to your circles?';
            this.labelContainerRef.appendChild(noLabels);
            return;
        }

        matchingLabels.forEach(this.createLabelElement.bind(this));
    }

    createLabelElement(label) {
        console.log('[ProfileLabels] Creating label element:', label);
        const labelElement = document.createElement('div');
        labelElement.className = 'hypertalent-profile-label';
        const {bgColor, textColor} = this.adjustColor(label.color, 0.3);
        labelElement.style.backgroundColor = bgColor;
        labelElement.style.color = textColor;
        
        labelElement.innerHTML = `
            <span class="hypertalent-profile-label-text">${label.name}</span>
            <span class="hypertalent-profile-label-delete" data-label-id="${label.label_id}">×</span>
        `;
    
        labelElement.querySelector('.hypertalent-profile-label-delete')
            .addEventListener('click', (e) => {
                console.log('[ProfileLabels] Delete button clicked for label:', label.name);
                e.stopPropagation();
                this.removeLabel(label.name, e.target.dataset.labelId);
            });
    
        this.labelContainerRef.appendChild(labelElement);
    }

    async removeLabel(labelName, labelId) {
        console.log('[ProfileLabels] Removing label:', labelName, labelId);
        try {
            if (!labelId || !this.currentProfileId) {
                console.error('[ProfileLabels] Missing label or profile ID');
                throw new Error('Missing label or profile ID');
            }

            const success = await window.labelsDatabase.removeProfileFromLabel(
                labelId,
                this.currentProfileId
            );

            if (success) {
                console.log('[ProfileLabels] Label removed successfully');
                window.show_success('Label removed');
                window.userActionsDatabase.addAction("label_removed")
            } else {
                console.error('[ProfileLabels] Failed to remove label');
                window.userActionsDatabase.addAction("label_removed_failed")
                throw new Error('Failed to remove label');
                // window.userActionsDatabase.addAction("label_edited")
            }
        } catch (error) {
            console.error('[ProfileLabels] Error removing label:', error);
            window.show_error('Failed to remove label');
        }

    }

    adjustColor(hexColor, opacity = 0.3) {
        console.log('[ProfileLabels] Adjusting color:', hexColor);
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);

        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const adjustedOpacity = isDarkMode ? opacity * 1.2 : opacity;
        
        const colors = {
            bgColor: `rgba(${r}, ${g}, ${b}, ${adjustedOpacity})`,
            textColor: isDarkMode 
                ? `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)})`
                : `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`
        };
        console.log('[ProfileLabels] Adjusted colors:', colors);
        return colors;
    }

    destroy() {
        console.log('[ProfileLabels] Destroying profile labels');
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.boundHandleLabelsUpdate);
        }
        
        if (this.labelContainerRef) {
            this.labelContainerRef.remove();
            this.labelContainerRef = null;
        }

        if (this.styles.parentNode) {
            this.styles.parentNode.removeChild(this.styles);
        }
        
        this.initialized = false;
        console.log('[ProfileLabels] Cleanup complete');
    }
}

// Start the manager
console.log('[ProfileLabels] Creating new instance');
window.profileManagerLabels = new ProfileLabels();
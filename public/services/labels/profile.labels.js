// ProfileLabels.js
class ProfileLabels {
    constructor() {
        this.unsubscribeFirestore = null;
        this.labels = {};
        this.currentProfileId = null;
        this.initialized = false;
        this.styles = this.createStyles();
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
    }

    createStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            .profile-labels-container {
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
                margin: 8px 0 !important;
                width: 350px !important;
            }

            .profile-label {
                display: inline-flex !important;
                align-items: center !important;
                padding: 0px 8px !important;
                border-radius: 20px !important;
                font-size: 9px !important;
                font-family: "Poppins", serif !important;
                font-weight: 500 !important;
                cursor: default !important;
            }

            .profile-label-delete {
                margin-left: 6px !important;
                cursor: pointer !important;
                opacity: 0.8 !important;
                font-weight: bold !important;
                font-size: 14px !important;
                font-family: "Poppins", serif !important;
            }

            .profile-label-delete:hover {
                opacity: 1 !important;
            }

            .no-labels {
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
        if (this.initialized) return;
        document.head.appendChild(this.styles);
        await this.setupProfile();
        this.initialized = true;
    }

    async setupProfile() {
        const profileInfo = await this.getProfileInfo();
        if (!profileInfo) return;

        this.currentProfileId = this.createProfileId(profileInfo.connectionCode);
        
        await this.createLabelsContainer();
    }

    async getProfileInfo() {
        try {
            const connectionLink = document.querySelector('a[href*="/search/results/people"]');
            const mutualConnectionLink = document.querySelector('section[data-member-id] > .ph5 > a');
            const url = connectionLink?.href || mutualConnectionLink?.href || window.location.href;
            
            const nameElement = document.querySelector('a[aria-label] h1');
            const name = nameElement ? nameElement.textContent.trim() : '';
            
            const username = this.extractUsername(url);
            let connectionCode = this.extractConnectionCode(url);
            
            if (!connectionCode) {
                connectionCode = this.extractConnectionCodeFromMutual(url);
            }
            
            if (!connectionCode) {
                connectionCode = username;
            }

            const imgElement = document.querySelector('img.pv-top-card-profile-picture__image--show');
            const imageUrl = imgElement ? imgElement.getAttribute('src') : '';

            const profileId = this.createProfileId(connectionCode);
            
            return {
                url,
                profileId,
                connectionCode,
                name,
                username,
                imageUrl,
                addedAt: new Date().toISOString()
            };
        } catch (error) {
            window.show_error('Error getting profile info');
            return null;
        }
    }

    extractUsername(url) {
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        return match ? match[1] : '';
    }

    extractConnectionCode(url) {
        const match = url.match(/connectionOf=%5B%22(.*?)%22%5D/);
        if (match) return match[1];
        
        const directMatch = url.match(/connectionOf=\["([^"]+)"\]/);
        return directMatch ? directMatch[1] : null;
    }

    extractConnectionCodeFromMutual(url) {
        const match = url.match(/facetConnectionOf=%22(.*?)%22/);
        if (match) return match[1];
        
        const directMatch = url.match(/facetConnectionOf="([^"]+)"/);
        return directMatch ? directMatch[1] : null;
    }

    createProfileId(connectionCode) {
        if (!connectionCode) return null;
        return connectionCode;
    }

    async waitForElement(selector, timeout = 5000) {
        const element = document.querySelector(selector);
        if (element) return element;

        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    async createLabelsContainer() {
        const targetElement = await this.waitForElement('section[data-member-id] > .ph5 > div:nth-child(2)');
        console.log(targetElement)
        if (!targetElement) return;

        let container = document.querySelector('.profile-labels-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'profile-labels-container';
            targetElement.insertBefore(container, targetElement.firstChild);
        }

        this.updateLabelsDisplay();
    }

    handleLabelsUpdate(newLabels) {
        // console.log(newLabels);
        // console.log('profile labels')
        if (!Array.isArray(newLabels)) return;
        
        // Convert new structure to old format for compatibility
        this.labels = {};
        newLabels.forEach(label => {
            this.labels[label.label_name] = {
                color: label.label_color,
                label_id: label.label_id,
                codes: {}
            };
            
            // Convert profiles to codes format
            label.profiles.forEach(profile => {
                if (profile && profile.profile_id) {
                    this.labels[label.label_name].codes[profile.profile_id] = {
                        addedAt: new Date().toISOString(),
                        name: profile.name,
                        url: profile.image_url,
                        code: profile.code
                    };
                }
            });
        });

        // console.log(this.labels)
        
        this.updateLabelsDisplay();
    }

    updateLabelsDisplay() {
        const container = document.querySelector('.profile-labels-container');
        if (!container) return;

        container.innerHTML = '';

        const matchingLabels = [];

        for (const [labelName, labelData] of Object.entries(this.labels)) {
            // console.log(this.currentProfileId);
            // console.log(labelData.codes)
            if (labelData.codes && Object.keys(labelData.codes).includes(this.currentProfileId)) {
                matchingLabels.push({
                    name: labelName,
                    color: labelData.color,
                    label_id: labelData.label_id
                });
            }
        }

        if (matchingLabels.length === 0) {
            const noLabels = document.createElement('div');
            noLabels.className = 'no-labels';
            noLabels.textContent = 'Found a fresh face! Want to add them to your circles?';
            container.appendChild(noLabels);
            return;
        }

        
        matchingLabels.forEach(label => {
            const labelElement = document.createElement('div');
            labelElement.className = 'profile-label';
            const {bgColor, textColor} = this.adjustColor(label.color, 0.3);
            labelElement.style.backgroundColor = bgColor;
            labelElement.style.color = textColor;
            
            labelElement.innerHTML = `
                ${label.name}
                <span class="profile-label-delete" data-label-id="${label.label_id}">×</span>
            `;

            labelElement.querySelector('.profile-label-delete').addEventListener('click', async (e) => {
                e.stopPropagation();
                const labelId = e.target.getAttribute('data-label-id');
                await this.removeLabel(label.name, labelId);
            });

            container.appendChild(labelElement);
        });
    }

    async removeLabel(labelName, labelId) {
        try {
            if (!labelId || !this.currentProfileId) {
                throw new Error('Missing label or profile ID');
            }

            const success = await window.labelsDatabase.removeProfileFromLabel(
                labelId,
                this.currentProfileId
            );

            if (success) {
                window.show_success('Label removed');
            } else {
                throw new Error('Failed to remove label');
            }
        } catch (error) {
            console.error('Error removing label:', error);
            window.show_error('Failed to remove label');
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

    destroy() {
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate.bind(this));
        }
        
        const container = document.querySelector('.profile-labels-container');
        if (container) {
            container.remove();
        }
        
        if (this.styles.parentNode) {
            this.styles.parentNode.removeChild(this.styles);
        }
        
        this.initialized = false;
    }
}

const initLabelManager = () => {
    let profileLabels = null;
    let checkInterval = null;
   
    const isProfileUrl = () => window.location.href.includes('linkedin.com/in/');
   
    const handleProfileChange = () => {
      if (!isProfileUrl() && profileLabels) {
        profileLabels.destroy();
        profileLabels = null;
      } else if (isProfileUrl() && !profileLabels) {
        profileLabels = new ProfileLabels();
        profileLabels.init();
      }
    };
   
    // Check URL changes every 2 seconds
    setInterval(handleProfileChange, 2000);
   
    // Watch for DOM changes
    const observer = new MutationObserver(handleProfileChange);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
   
    // Initial check
    handleProfileChange();
   };
   
   initLabelManager();
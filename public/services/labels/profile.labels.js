// ProfileLabels.js
class ProfileLabels {
    constructor() {
        this.unsubscribeFirestore = null;
        this.labels = {};
        this.currentProfileId = null;
        this.initialized = false;
        this.styles = this.createStyles();
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
                border-radius: 4px !important;
                font-size: 12px !important;
                font-weight: 500 !important;
                color: #fff !important;
                cursor: default !important;
            }

            .profile-label-delete {
                margin-left: 6px !important;
                cursor: pointer !important;
                opacity: 0.8 !important;
                font-weight: bold !important;
                font-size: 14px !important;
            }

            .profile-label-delete:hover {
                opacity: 1 !important;
            }

            .no-labels {
                color: #666 !important;
                font-size: 12px !important;
                font-style: italic !important;
                margin: 8px 0 !important;
            }
        `;
        return styles;
    }

    async getFirebaseInstance() {
        try {
            const { db, currentUser } = await window.firebaseService.initializeFirebase();
            if (!db || !currentUser) {
                throw new Error('Authentication failed');
            }
            return { db, currentUser };
        } catch (error) {
            console.error('Error getting Firebase instance:', error);
            return null;
        }
    }

    async init() {
        if (this.initialized) return;
        
        console.log('ProfileLabels: Initializing...');
        
        // Add styles to document
        document.head.appendChild(this.styles);

        // Get initial profile info and set up listeners
        await this.setupProfile();
        this.initialized = true;
    }

    async setupProfile() {
        const profileInfo = await this.getProfileInfo();
        if (!profileInfo) return;

        this.currentProfileId = this.createProfileId(profileInfo.connectionCode);
        
        // Set up Firestore listener
        this.subscribeToLabels();
        
        // Create labels container
        await this.createLabelsContainer();
    }

    async getProfileInfo() {
        try {
            // Get URLs from both possible locations
            const connectionLink = document.querySelector('a[href*="/search/results/people"]');
            const mutualConnectionLink = document.querySelector('section[data-member-id] > .ph5 > a');
            console.log(connectionLink)
            const url = connectionLink?.href || mutualConnectionLink?.href || window.location.href;
            
            // Get the profile name
            const nameElement = document.querySelector('a[aria-label] h1');
            const name = nameElement ? nameElement.textContent.trim() : '';
            
            // Extract username from URL
            const username = this.extractUsername(url);
            
            // Try to get connection code
            let connectionCode = this.extractConnectionCode(url);
            
            // If no connection code found, try mutual connection code
            if (!connectionCode) {
                connectionCode = this.extractConnectionCodeFromMutual(url);
            }
            
            // If still no code found, use username as fallback
            if (!connectionCode) {
                connectionCode = username;
            }

            // Get profile image
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
            console.error('Error getting profile info:', error);
            return null;
        }
    }

    extractUsername(url) {
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        return match ? match[1] : '';
    }

    extractConnectionCode(url) {
        // Handle encoded connection code
        const match = url.match(/connectionOf=%5B%22(.*?)%22%5D/);
        console.log(match)
        if (match) return match[1];
        
        // Handle direct connection links
        const directMatch = url.match(/connectionOf=\["([^"]+)"\]/);
        return directMatch ? directMatch[1] : null;
    }

    extractConnectionCodeFromMutual(url) {
        // Handle encoded mutual connection code
        const match = url.match(/facetConnectionOf=%22(.*?)%22/);
        if (match) return match[1];
        
        // Handle direct mutual connection links
        const directMatch = url.match(/facetConnectionOf="([^"]+)"/);
        return directMatch ? directMatch[1] : null;
    }

    createProfileId(connectionCode) {
        console.log(connectionCode)
        if (!connectionCode) return null;
        
        const profileUrl = `https://www.linkedin.com/in/${connectionCode}`;
        return btoa(profileUrl).replace(/=/g, '');
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
        if (!targetElement) return;

        let container = document.querySelector('.profile-labels-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'profile-labels-container';
            targetElement.insertBefore(container, targetElement.firstChild);
        }

        this.updateLabelsDisplay();
    }

    async subscribeToLabels() {
        if (this.unsubscribeFirestore) {
            this.unsubscribeFirestore();
        }

        const firebase = await this.getFirebaseInstance();
        if (!firebase) return;

        const { db, currentUser } = firebase;

        this.unsubscribeFirestore = db.collection('labels')
            .doc(currentUser.uid)
            .onSnapshot(async (doc) => {
                if (!doc.exists) return;
                this.labels = doc.data().labels || {};
                this.updateLabelsDisplay();
            }, async (error) => {
                console.error('Firestore subscription error:', error);
                // If there's an error, try to resubscribe after a short delay
                setTimeout(() => this.subscribeToLabels(), 5000);
            });
    }

    updateLabelsDisplay() {
        const container = document.querySelector('.profile-labels-container');
        if (!container) return;

        // Clear existing labels
        container.innerHTML = '';

        // Find matching labels for current profile
        const matchingLabels = [];
        console.log(this.labels)
        for (const [labelName, labelData] of Object.entries(this.labels)) {
            console.log(labelData);
            console.log(this.currentProfileId)
            if (labelData.codes && Object.keys(labelData.codes).includes(this.currentProfileId)) {
                
                matchingLabels.push({
                    name: labelName,
                    color: labelData.color
                });
            }
        }
        console.log(matchingLabels)
        if (matchingLabels.length === 0) {
            const noLabels = document.createElement('div');
            noLabels.className = 'no-labels';
            noLabels.textContent = 'No labels available';
            container.appendChild(noLabels);
            return;
        }

        matchingLabels.forEach(label => {
            const labelElement = document.createElement('div');
            labelElement.className = 'profile-label';
            labelElement.style.backgroundColor = label.color;
            
            labelElement.innerHTML = `
                ${label.name}
                <span class="profile-label-delete" data-label="${label.name}">×</span>
            `;

            labelElement.querySelector('.profile-label-delete').addEventListener('click', async () => {
                await this.removeLabel(label.name);
            });

            container.appendChild(labelElement);
        });
    }

    async removeLabel(labelName) {
        try {
            const firebase = await this.getFirebaseInstance();
            if (!firebase) return;

            const { db, currentUser } = firebase;
            
            const labelRef = db.collection('labels').doc(currentUser.uid);
            const doc = await labelRef.get();
            
            if (!doc.exists) return;
            
            const labels = doc.data().labels || {};
            const label = labels[labelName];
            
            if (!label || !label.codes) return;
            
            // Remove the current profile from the codes object
            if (label.codes) {
                const { [this.currentProfileId]: removed, ...remainingCodes } = label.codes;
                
                // Update Firestore
                await labelRef.update({
                    [`labels.${labelName}.codes`]: remainingCodes
                });
            }
            
        } catch (error) {
            console.error('Error removing label:', error);
        }
    }

    destroy() {
        if (this.unsubscribeFirestore) {
            this.unsubscribeFirestore();
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

// Create global instance
window.labelProfiles = new ProfileLabels();
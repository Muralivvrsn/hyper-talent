class ProfileNotes {

    async init() {
        console.log('ProfileNotes: Starting initialization');
        if (this.initialized) {
            console.log('ProfileNotes: Already initialized, skipping...');
            return;
        }

        // Setup key listener
        this.setupEventListeners();
        this.initialized = true;
        console.log('ProfileNotes: Initialization complete');
    }

    async waitForElement(selector, timeout = 10000) {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelectorAll(selector));
            }

            const observer = new MutationObserver((mutations) => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    observer.disconnect();
                    resolve(elements);
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

    extractConnectionCode(url) {
        console.log('ProfileNotes: Extracting connection code from:', url);
        
        // Array of different regex patterns to try
        const patterns = [
            /connectionOf=%5B%22(.*?)%22%5D/, // Original pattern
            /followerOf=%22(.*?)%22/, // Follower pattern
            /profileUrn=urn%3Ali%3Afsd_profile%3A(.*?)(?:&|$)/, // Profile URN pattern
            /overlay\/urn:li:fsd_profilePosition:\((.*?),/, // Position overlay pattern
            /details\/.*?\?profileUrn=urn%3Ali%3Afsd_profile%3A(.*?)(?:&|$)/ // Details page pattern
        ];
    
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                console.log('ProfileNotes: Extracted code:', match[1]);
                return match[1];
            }
        }
        
        console.log('ProfileNotes: No connection code found');
        return null;
    }
    
    async getProfileInfo() {
        try {
            const url = window.location.href;
            
            // Wait for profile to load by checking for verification element
            await this.waitForElement('a[aria-label]');
                
            // Get name from the verification link
            let name = null;
            const nameElement = document.querySelector('a[aria-label] h1');
            if (nameElement) {
                name = nameElement.textContent.trim();
            }
    
            // Get image URL
            let imageUrl = null;
            const profileImage = document.querySelector('img.pv-top-card-profile-picture__image--show');
            if (profileImage) {
                imageUrl = profileImage.getAttribute('src');
            }
    
            // Get connection code using multiple selectors and patterns
            let connectionCode = null;
            const potentialAnchors = [
                // Main connections link
                ...document.querySelectorAll('a[href*="connectionOf"]'),
                // Follower links
                ...document.querySelectorAll('a[href*="followerOf"]'),
                // Profile links
                ...document.querySelectorAll('a[href*="miniProfileUrn"]'),
                // Experience section links
                ...document.querySelectorAll('a[href*="fsd_profilePosition"]'),
                // Details page links (education, certifications, etc.)
                ...document.querySelectorAll('a[href*="details"][href*="profileUrn"]'),
                // Skills overlay links
                ...document.querySelectorAll('a[href*="skill-associations-details"]')
            ];
    
            for (const anchor of potentialAnchors) {
                const href = anchor?.getAttribute('href');
                if (href) {
                    connectionCode = this.extractConnectionCode(href);
                    if (connectionCode) {
                        break;
                    }
                }
            }
    
            return {
                url,
                connectionCode,
                name,
                imageUrl
            };
        } catch (error) {
            console.error('Error getting profile info:', error);
            return null;
        }
    }
    
    async setupEventListeners() {
        // Handle 'n' key press
        document.addEventListener('keydown', async (event) => {
            if (event.key === 'n') {
                await this.handleProfileAction(true);
            }
        });
    
        // Handle messages from background script
        chrome.runtime.onMessage.addListener(async (message) => {
            if (message.type === 'PROFILE_TAB') {
                await this.handleProfileAction(false);
            }
        });
    }
    
    async handleProfileAction(isKey) {
        const activeElement = document.activeElement;
        
        // Don't trigger if we're in a notes textarea
        if (activeElement && 
            activeElement.tagName === 'TEXTAREA' && 
            activeElement.classList.contains('notes-textarea')) {
            return;
        }
    
        try {
            const profileInfo = await this.getProfileInfo();
            console.log('Profile info:', profileInfo);
            
            chrome.runtime.sendMessage({
                action: 'hypertalent-keyPressed',
                key: isKey,
                data: {
                    url: profileInfo?.url || window.location.href,
                    connectionCode: profileInfo?.connectionCode || null,
                    name: profileInfo?.name || null,
                    imageUrl: profileInfo?.imageUrl || null
                }
            });
    
        } catch (error) {
            console.error('Error handling profile action:', error);
            chrome.runtime.sendMessage({
                action: 'hypertalent-keyPressed',
                key: isKey,
                data: {
                    url: window.location.href,
                    connectionCode: null,
                    name: null,
                    imageUrl: null
                }
            });
        }
    }
}


window.profileNotes = new ProfileNotes();

window.autoUpdateProfiles = {
    async init() {
        if (!window.location.href.includes('linkedin.com/in/')) return;
        try {
            // Only need to check if Firebase service is available
            if (!window.firebaseService) throw new Error('Firebase service not available');
            await this.startProfileExtraction();
        } catch (error) {
            console.error('Init error:', error);
        }
    },

    async startProfileExtraction() {
        try {
            const username = this.extractUsernameFromURL();
            if (!username) throw new Error('Username extraction failed');

            const profileCode = await this.extractProfileCode();
            if (!profileCode) throw new Error('Profile code extraction failed');

            // Call Cloud Function instead of directly updating database
            await this.sendProfileToCloudFunction(profileCode, username);
        } catch (error) {
            console.error('Extraction error:', error);
        }
    },

    extractUsernameFromURL() {
        try {
            const matches = window.location.pathname.match(/\/in\/([^/]+)/);
            return matches ? matches[1] : null;
        } catch (error) {
            console.error('Username parse error:', error);
            return null;
        }
    },

    async extractProfileCode() {
        try {
            const element = await this.waitForAnyElement([
                'a[id*="navigation"][href*="profileUrn"]',
                'a[href*="/search/results/people"]'
            ]);
            if (!element) return null;

            const href = element.getAttribute('href');
            const match = href.match(/profileUrn=([^&]+)/);
            return match ? decodeURIComponent(match[1]).split(':').pop() : null;
        } catch (error) {
            console.error('Profile code parse error:', error);
            return null;
        }
    },

    async waitForAnyElement(selectors, timeout = 10000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) return element;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
    },

    async sendProfileToCloudFunction(profileCode, username) {
        try {
            // Create data object to send
            const profileData = {
                profileCode: profileCode,
                username: username,
                url: window.location.href,
                title: document.title,
                timestamp: Date.now()
            };
            
            // Add pageInfo if possible
            try {
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    profileData.description = metaDesc.getAttribute('content');
                }
            } catch (e) {
                // Ignore meta extraction errors
            }
            
            console.log('Sending profile data to Cloud Function:', profileData);
            
            // Call the Cloud Function using the Firebase service
            if (window.firebaseService.callCloudFunction) {
                const result = await window.firebaseService.callCloudFunction('processData', profileData);
                console.log('Cloud Function response:', result);
                return result;
            } else {
                // Fallback if the method doesn't exist
                console.error('Firebase service missing callCloudFunction method');
                
                // Try to use Firebase functions directly
                const functions = firebase.functions();
                const processData = functions.httpsCallable('processData');
                const result = await processData(profileData);
                console.log('Cloud Function response:', result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Error calling Cloud Function:', error);
            throw error;
        }
    }
};

window.autoUpdateProfiles.init();

// Re-run when URL changes (SPA navigation)
let lastUrl = window.location.href;
new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        window.autoUpdateProfiles.init();
    }
}).observe(document.body, { subtree: true, childList: true });
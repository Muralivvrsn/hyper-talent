window.autoUpdateProfiles = {
    async init() {
        if (!window.location.href.includes('linkedin.com/in/')) return;
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Firebase init failed');
            await this.startProfileExtraction(db);
        } catch (error) {
            console.error('Init error:', error);
        }
    },

    async startProfileExtraction(db) {
        try {
            const username = this.extractUsernameFromURL();
            if (!username) throw new Error('Username extraction failed');

            const profileCode = await this.extractProfileCode();
            if (!profileCode) throw new Error('Profile code extraction failed');

            await this.updateProfileInDatabase(db, profileCode, username);
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

    async updateProfileInDatabase(db, profileCode, username) {
        try {
            const usernameRef = db.collection('profiles').doc(username);
            const usernameDoc = await usernameRef.get();
            // console.log(profileCode)

            if (usernameDoc.exists) {
                const oldData = usernameDoc.data();
                const profileRef = db.collection('profiles').doc(profileCode);
                
                await profileRef.set({
                    ...oldData,
                    un: username,
                    c: profileCode,
                    lu: new Date()
                });
                
                await usernameRef.delete();
                return;
            }

            const profileRef = db.collection('profiles').doc(profileCode);
            await profileRef.update({
                un: username,
                c: profileCode,
                lu: new Date()
            });
        } catch (error) {
            console.error('DB update error:', error);
            throw error;
        }
    }
};

window.autoUpdateProfiles.init();

let lastUrl = window.location.href;
new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        window.autoUpdateProfiles.init();
    }
}).observe(document.body, { subtree: true, childList: true });
window.autoUpdateProfiles = {
    STORAGE_KEY: "processedProfiles",
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    MAX_RETRIES: 10, // Maximum number of retries
    RETRY_DELAY: 1000, // Delay between retries in milliseconds

    async init() {
        if (!window.location.href.includes("linkedin.com/in/")) return;
        if (!window.firebaseService) {
            console.error("Firebase service not available");
            return;
        }

        try {
            const profileInfo = await this.waitForProfileInfo();
            if (!profileInfo || !profileInfo.profile_id) {
                console.log("No profile info found after retries");
                return;
            }

            if (this.isRecentlyProcessed(profileInfo.profile_id)) {
                console.log("Profile recently processed, skipping");
                return;
            }

            await this.sendProfileToCloudFunction(
                profileInfo.profile_id,
                profileInfo.username || profileInfo.name,
                profileInfo.name,
                profileInfo.image_url
            );
            this.markProcessed(profileInfo.profile_id);
        } catch (error) {
            console.error("Init error:", error);
        }
    },

    async waitForProfileInfo() {
        for (let i = 0; i < this.MAX_RETRIES; i++) {
            try {
                // Wait for the DOM to be ready
                await this.sleep(this.RETRY_DELAY);
                
                // Check if page is fully loaded
                if (document.readyState !== 'complete') {
                    console.log("Page still loading, retry:", i + 1);
                    continue;
                }

                const profileInfo = await window.labelManagerUtils.getProfileInfo();
                
                // Validate required fields
                if (profileInfo && 
                    profileInfo.profile_id && 
                    profileInfo.name && 
                    profileInfo.image_url) {
                    console.log("Profile info found on attempt:", i + 1);
                    return profileInfo;
                }
                
                console.log("Incomplete profile info, retry:", i + 1);
            } catch (error) {
                console.log("Error getting profile info, retry:", i + 1);
            }
        }
        return null;
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    isRecentlyProcessed(profileId) {
        try {
            const processed = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "{}");
            const timestamp = processed[profileId];
            return timestamp && (Date.now() - timestamp) < this.CACHE_DURATION;
        } catch {
            return false;
        }
    },

    markProcessed(profileId) {
        try {
            const processed = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "{}");
            processed[profileId] = Date.now();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(processed));
        } catch (error) {
            console.error("Error updating storage:", error);
        }
    },

    async sendProfileToCloudFunction(profileId, username, name, imageUrl) {
        if (!profileId || !username || !name) return;
    
        try {
            // Ensure authentication
            if (!firebase.auth().currentUser) {
                await firebase.auth().signInAnonymously();
            }
    
            const profileData = {
                profileId,
                username,
                name,
                imageUrl,
                url: window.location.href
            };
    
            const firebaseService = window.firebaseService;
            let result;
    
            if (firebaseService?.callCloudFunction) {
                result = await firebaseService.callCloudFunction("processData", profileData);
            } else {
                const functions = firebase.functions();
                const processData = functions.httpsCallable("processData");
                const response = await processData(profileData);
                result = response.data;
            }
    
            console.log("Profile update success:", result);
            return result;
        } catch (error) {
            console.error("Error calling Cloud Function:", error.message);
            if (error.code === "unauthenticated") {
                console.error("Authentication failed. Retrying...");
                await firebase.auth().signInAnonymously();
                // Retry the operation once after authentication
                return this.sendProfileToCloudFunction(profileId, username, name, imageUrl);
            }
            throw error;
        }
    }
};

setTimeout(() => {
    window.autoUpdateProfiles.init();
}, 1000);

// Modified URL observer to include delay
let lastUrl = window.location.href;
new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // Add delay before initializing on URL change
        setTimeout(() => {
            window.autoUpdateProfiles.init();
        }, 1000);
    }
}).observe(document.body, { subtree: true, childList: true });
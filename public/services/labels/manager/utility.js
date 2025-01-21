window.labelManagerUtils = {
    extractProfileId(url) {
        const match = url.match(/ACoAA[A-Za-z0-9_-]+/);
        return match ? match[0] : null;
    },

    getProfileInfo() {
        // Get detail container
        const detailContainer = document.querySelector('.scaffold-layout__detail');
        if (!detailContainer) return null;

        // Get profile link
        const profileLink = detailContainer.querySelector('.msg-thread__link-to-profile');
        if (!profileLink) return null;

        // Get name and URL
        const name = profileLink.querySelector('h2')?.textContent?.trim();
        const url = profileLink.href;
        
        // Get profile image from active conversation
        const activeConvo = document.querySelector('.msg-conversations-container__convo-item-link--active');
        const img = activeConvo?.querySelector('img')?.src || null;

        // Extract profile ID from URL
        const profile_id = this.extractProfileId(url);

        // Only return if we have all required information
        if (!name || !url || !img || !profile_id) {
            return null;
        }
        return {
            profile_id,
            name,
            url,
            image_url : img,
            username: null // Using name as username since it's not separately available
        };
    }
};
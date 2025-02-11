async function getProfileInfo() {
    try {
        const url = window.location.href;
        await this.waitForElement('a[aria-label]');
        let name = null;
        const nameElement = document.querySelector('a[aria-label] h1');
        if (nameElement) {
            name = nameElement.textContent.trim();
        }
        let imageUrl = null;
        const profileImage = document.querySelector('img.pv-top-card-profile-picture__image--show');
        if (profileImage) {
            imageUrl = profileImage.getAttribute('src');
        }
        let connectionCode = null;
        const potentialAnchors = [
            ...document.querySelectorAll('a[href*="connectionOf"]'),
            ...document.querySelectorAll('a[href*="followerOf"]'),
            ...document.querySelectorAll('a[href*="miniProfileUrn"]'),
            ...document.querySelectorAll('a[href*="fsd_profilePosition"]'),
            ...document.querySelectorAll('a[href*="details"][href*="profileUrn"]'),
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
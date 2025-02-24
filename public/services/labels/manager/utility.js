window.labelManagerUtils = {
    async getProfileInfo() {
        try {
            const url = window.location.href;
            
            // Check if we're on a messaging page
            if (url.includes('messaging/thread')) {
                // Get detail container
                const detailContainer = document.querySelector('.scaffold-layout__detail');
                if (!detailContainer) return null;
    
                // Get profile link
                const profileLink = detailContainer.querySelector('.msg-thread__link-to-profile');
                if (!profileLink) return null;
    
                // Get name and URL
                const name = profileLink.querySelector('h2')?.textContent?.trim();
                const profileUrl = profileLink.href;
                
                // Get profile image from active conversation
                const activeConvo = document.querySelector('.msg-conversations-container__convo-item-link--active');
                const img = activeConvo?.querySelector('img')?.src || null;
    
                // Extract profile ID from URL
                const profile_id = extractProfileId(profileUrl);
    
                // Only return if we have all required information
                if (!name || !profileUrl || !img || !profile_id) {
                    return null;
                }
                return {
                    profile_id,
                    name,
                    url: profileUrl,
                    image_url: img,
                    username: null // Using name as username since it's not separately available
                };
            } 
            // Handle profile page
            else {
                await waitForElement('a[aria-label]');
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
                console.log(connectionCode)
    
                return {
                    url,
                    profile_id:connectionCode,
                    name,
                    imageUrl
                };
            }
        } catch (error) {
            console.error('Error getting profile info:', error);
            return null;
        }
    },
    
    // Helper function to extract profile ID
    extractProfileId(url) {
        const match = url.match(/ACoAA[A-Za-z0-9_-]+/);
        return match ? match[0] : null;
    },

    // Helper function to extract connection code
    extractConnectionCode(href) {
        const connectionMatch = href.match(/(?:connectionOf|followerOf|miniProfileUrn|profileUrn|fsd_profilePosition)=([^&]+)/);
        return connectionMatch ? connectionMatch[1] : null;
    },

    // Wait for an element to be present in the DOM
    async waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            // If element is already in the DOM, resolve immediately
            const element = document.querySelector(selector);
            if (element) {
                return resolve(element);
            }

            // Set up a MutationObserver to watch for the element
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            // Start observing the entire document
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Set a timeout to reject the promise if element not found
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }
};
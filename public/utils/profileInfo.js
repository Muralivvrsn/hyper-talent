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
                const profile_id = this.extractProfileId(profileUrl);
    
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
                let username = this.extractUsername(url)
                return {
                    url,
                    profile_id: connectionCode,
                    name,
                    username,
                    image_url: imageUrl
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

    extractUsername(url) {
        const match = url.match(/\/in\/([^\/]+)/);
        return match ? match[1] : null;
    },
    // Helper function to extract connection code
    extractConnectionCode(href) {
        // First, try matching with original regex pattern
        let connectionMatch = href.match(/(?:connectionOf|followerOf|miniProfileUrn|profileUrn|fsd_profilePosition)=([^&]+)/);
        if (connectionMatch) {
            connectionMatch = connectionMatch[1].match(/%22([^%]+)%22/);
        }
        
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
    },
    getRandomColor (){
        // 20 distinct, visually appealing colors
        const colors = [
            '#191970', // midnightBlue
            '#800020', // burgundy
            '#36454F', // charcoal
            '#228B22', // forestGreen
            '#301934', // deepPurple
            '#002147', // oxfordBlue
            '#654321', // darkBrown
            '#2F4F4F', // darkSlateGray
            '#4B0082', // indigo
            '#8B0000', // darkCrimson
            '#556B2F', // darkOlive
            '#004D4D', // darkTeal
            '#555D50', // ebony
            '#702963', // byzantium
            '#8B008B', // darkMagenta
            '#008B8B', // darkCyan
            '#242124', // raisinBlack
            '#1F2D1B', // verdunGreen
            '#003153', // prussianBlue
            '#3C1414'  // darkSienna
          ];
        
        // Return a random color from the array
        return colors[Math.floor(Math.random() * colors.length)];
    },
};
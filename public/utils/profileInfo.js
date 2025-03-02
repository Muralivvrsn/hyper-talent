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
                await this.waitForElement('main a[aria-label]');
                let name = null;
                const nameElement = document.querySelector('main a[aria-label] h1');
                if (nameElement) {
                    name = nameElement.textContent.trim();
                }
                let imageUrl = null;
                const profileImage = document.querySelector('main img.pv-top-card-profile-picture__image--show');
                if (profileImage) {
                    imageUrl = profileImage.getAttribute('src');
                }
                let connectionCode = null;
                const potentialAnchors = [
                    ...document.querySelectorAll('main a[href*="connectionOf"]'),
                    ...document.querySelectorAll('main a[href*="followerOf"]'),
                    ...document.querySelectorAll('main a[href*="miniProfileUrn"]'),
                    ...document.querySelectorAll('main a[href*="fsd_profilePosition"]'),
                    ...document.querySelectorAll('main a[href*="details"][href*="profileUrn"]'),
                    ...document.querySelectorAll('main a[href*="skill-associations-details"]'),
                    ...document.querySelectorAll('main a[id*="navigation"]')
                ];
    
                for (const anchor of potentialAnchors) {
                    const href = anchor?.getAttribute('href');
                    // console.log(href)
                    if (href) {
                        // console.log(href)
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
        if (!href) return null;
    
        // Pattern 1: Extract from profileUrn or miniProfileUrn
        const urnMatch = href.match(/profileUrn=([^&]*)|miniProfileUrn=([^&]*)/);
        if (urnMatch) {
            const urn = urnMatch[1] || urnMatch[2]; // Use the first non-null match
            if (urn) {
                const decodedUrn = decodeURIComponent(urn);
                const codeMatch = decodedUrn.match(/fsd_profile:([\w-]+)|fs_miniProfile:([\w-]+)/);
                if (codeMatch) {
                    return codeMatch[1] || codeMatch[2]; // Return the first non-null match
                }
            }
        }
    
        // Pattern 2: Extract from connectionOf, followerOf, or fsd_profilePosition
        const connectionMatch = href.match(/(?:connectionOf|followerOf|fsd_profilePosition)=([^&]+)/);
        if (connectionMatch) {
            const encodedCode = connectionMatch[1];
            const decodedCode = decodeURIComponent(encodedCode);
            const codeMatch = decodedCode.match(/%22([^%]+)%22/);
            if (codeMatch) {
                return codeMatch[1];
            }
        }
    
        // Pattern 3: Extract from skill-associations-details or other similar patterns
        const skillMatch = href.match(/skill-associations-details.*profileUrn=([^&]*)/);
        if (skillMatch) {
            const decodedUrn = decodeURIComponent(skillMatch[1]);
            const codeMatch = decodedUrn.match(/fsd_profile:([\w-]+)/);
            if (codeMatch) {
                return codeMatch[1];
            }
        }
    
        // If no match is found, return null
        return null;
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
    hexToHSL(hex) {
        // Remove the # if present
        hex = hex.replace(/^#/, '');
    
        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
    
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
    
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
    
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    parseHSL(hslString) {
        const matches = hslString.match(/hsl\((\d+),\s*(\d+)%?,\s*(\d+)%?\)/);
        if (!matches) return null;
        return {
            h: parseInt(matches[1]),
            s: parseInt(matches[2]),
            l: parseInt(matches[3])
        };
    },
    
    // Generate a random color that's different from existing colors
    async generateRandomColor (existingColors = []) {
        const minDistance = 30; // Minimum hue distance between colors
        
        // Convert all existing colors to HSL for comparison
        const existingHSL = existingColors.map(color => {
            if (color.startsWith('#')) {
                return this.hexToHSL(color);
            } else {
                return this.parseHSL(color);
            }
        });
    
        let attempts = 0;
        const maxAttempts = 50;
    
        while (attempts < maxAttempts) {
            const hue = Math.floor(Math.random() * 360);
            const saturation = Math.floor(Math.random() * (80 - 60) + 60); // Random saturation between 60-80%
            const lightness = Math.floor(Math.random() * (85 - 25) + 25);  // Random lightness between 25-85%
    
            // Check if this color is far enough from existing colors
            const isFarEnough = existingHSL.every(existing => {
                if (!existing) return true;
                const hueDiff = Math.min(
                    Math.abs(hue - existing.h),
                    360 - Math.abs(hue - existing.h)
                );
                return hueDiff > minDistance;
            });
    
            if (isFarEnough || attempts === maxAttempts - 1) {
                return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            }
    
            attempts++;
        }
    
        // Fallback if we couldn't find a distinct color
        const hue = Math.floor(Math.random() * 360);
        const saturation = Math.floor(Math.random() * (80 - 60) + 60);
        const lightness = Math.floor(Math.random() * (85 - 25) + 25);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    
    // Generate appropriate text color (black or white) based on background color
    generateTextColor (backgroundColor) {
        let h, s, l;
    
        if (backgroundColor.startsWith('#')) {
            const hsl = this.hexToHSL(backgroundColor);
            h = hsl.h;
            s = hsl.s;
            l = hsl.l;
        } else {
            const hslValues = this.parseHSL(backgroundColor);
            if (!hslValues) return '#000000'; // Default to black if parsing fails
            h = hslValues.h;
            s = hslValues.s;
            l = hslValues.l;
        }
    
        // For very light colors (high lightness), use black text
        // For darker colors, use white text
        // We can also consider saturation in the calculation
        const threshold = 50; // Adjust this value to fine-tune the switch point
        
        // If the color is very light (high lightness) or has very low saturation, use black
        if (l > threshold || (l > 60 && s < 15)) {
            return '#000000';
        }
        return '#FFFFFF';
    }
};

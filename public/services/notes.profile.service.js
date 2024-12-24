class ProfileNotes {

    async init() {
        console.log('ProfileNotes: Starting initialization');
        if (this.initialized) {
            console.log('ProfileNotes: Already initialized, skipping...');
            return;
        }

        // Setup key listener
        this.setupKeyListener();
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
        const match = url.match(/connectionOf=%5B%22(.*?)%22%5D/);
        console.log('ProfileNotes: Extracted code:', match ? match[1] : 'none');
        return match ? match[1] : null;
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
    
            // Get connection code
            let connectionCode = null;
            const connectionLinks = document.querySelectorAll('a');
            if (connectionLinks) {
                for (const link of connectionLinks) {
                    const href = link?.getAttribute('href');
                    if (href?.includes('connectionOf')) {
                        connectionCode = this.extractConnectionCode(href);
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
    
    setupKeyListener() {
        document.addEventListener('keydown', async (event) => {
            if (event.key === 'n') {
                const activeElement = document.activeElement;
                
                if (!(activeElement && 
                      activeElement.tagName === 'TEXTAREA' && 
                      activeElement.classList.contains('notes-textarea'))) {
                    
                    try {
                        const profileInfo = await this.getProfileInfo();
                        console.log(profileInfo)
                        chrome.runtime.sendMessage({
                            action: 'keyPressed',
                            key: 'n',
                            data: {
                                url: profileInfo?.url || window.location.href,
                                connectionCode: profileInfo?.connectionCode || null,
                                name: profileInfo?.name || null,
                                imageUrl: profileInfo?.imageUrl || null
                            }
                        });
    
                    } catch (error) {
                        console.error('Error in key press handler:', error);
                        chrome.runtime.sendMessage({
                            action: 'keyPressed',
                            key: 'n',
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
        });
    }
}


window.profileNotes = new ProfileNotes();

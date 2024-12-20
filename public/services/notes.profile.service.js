class ProfileNotes {
    constructor() {
        console.log('ProfileNotes: Initializing...');
        // Check if already initialized
        if (window.profileNotes) {
            console.log('ProfileNotes: Already initialized, skipping...');
            return;
        }
        this.initialized = false;
        window.profileNotes = this;
        this.init();
    }

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

    waitForElement(selector, timeout = 10000) {
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
            const connectionLinks = await this.waitForElement('.text-body-small a.ember-view');
            let connectionCode = null;
            const url = window.location.href;

            if (connectionLinks) {
                console.log('Connection links found:', connectionLinks);
                for (const link of connectionLinks) {
                    const href = link?.getAttribute('href');
                    if (href?.includes('connectionOf')) {
                        connectionCode = this.extractConnectionCode(href);
                        break;
                    }
                }
            }

            return {
                url: url,
                connectionCode: connectionCode
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
                        
                        chrome.runtime.sendMessage({
                            action: 'keyPressed',
                            key: 'n',
                            data: {
                                url: profileInfo?.url || window.location.href,
                                connectionCode: profileInfo?.connectionCode || null
                            }
                        });

                    } catch (error) {
                        console.error('Error in key press handler:', error);
                        chrome.runtime.sendMessage({
                            action: 'keyPressed',
                            key: 'n',
                            data: {
                                url: window.location.href,
                                connectionCode: null
                            }
                        });
                    }
                }
            }
        });
    }
}

// Initialize only if not already initialized
if (!window.profileNotes) {
    console.log('Creating new ProfileNotes instance');
    new ProfileNotes();
}
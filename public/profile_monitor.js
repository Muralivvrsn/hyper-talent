window.profileMonitor = (function() {
    const processedProfiles = new Set();
    let observer = null;
    let checkInterval = null;
    let debounceTimer = null;

    function extractProfileId(url) {
        const match = url.match(/ACoAA[A-Za-z0-9_-]+/);
        return match ? match[0] : null;
    }

    function getCurrentImageUrl() {
        const activeConvo = document.querySelector('.msg-conversations-container__convo-item-link--active');
        if (!activeConvo) return null;
        
        const img = activeConvo.querySelector('img');
        return img ? img.src : null;
    }

    async function checkAndUpdateProfile() {
        const profileLink = document.querySelector('a[class*="msg-thread__link-to-profile"]');
        if (!profileLink) return false;

        const profileId = extractProfileId(profileLink.href);
        if (!profileId || processedProfiles.has(profileId)) return false;

        const imageUrl = getCurrentImageUrl();
        if (!imageUrl) return false;

        try {
            const db = firebase.firestore();
            const profileRef = db.collection('profiles').doc(profileId);
            const profile = await profileRef.get();

            if (profile.exists) {
                const data = profile.data();
                if (data.img !== imageUrl) {
                    await profileRef.update({
                        img: imageUrl,
                        lu: new Date().toISOString()
                    });
                    // console.log(`Updated profile ${profileId} with new image URL`);
                }
                processedProfiles.add(profileId);
            }


            return true;

        } catch (error) {
            // console.error('Error updating profile:', error);
            return false;
        }
    }

    function debouncedCheck() {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(async () => {
            await checkAndUpdateProfile();
        }, 500);
    }

    function setupThreadObserver() {
        if (observer) {
            observer.disconnect();
        }

        observer = new MutationObserver((mutations) => {
            let shouldCheck = false;

            for (const mutation of mutations) {
                // Check for class changes
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    shouldCheck = true;
                    break;
                }

                // Check for DOM changes
                if (mutation.type === 'childList' && 
                    (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                    shouldCheck = true;
                    break;
                }

                // Check for specific element changes
                if (mutation.target.matches('img') || 
                    mutation.target.matches('a[class*="msg-thread__link-to-profile"]')) {
                    shouldCheck = true;
                    break;
                }
            }

            if (shouldCheck) {
                debouncedCheck();
            }
        });

        function observeThread() {
            const threadPillar = document.querySelector('.msg-thread--pillar');
            if (threadPillar) {
                observer.observe(threadPillar, {
                    childList: true,          // Watch for added/removed elements
                    attributes: true,         // Watch for attribute changes
                    characterData: true,      // Watch for text changes
                    subtree: true,            // Watch all descendants
                    attributeOldValue: true,  // Track old attribute values
                    characterDataOldValue: true // Track old text values
                });
                // console.log('Thread observer attached');
            }
        }

        // Initial observation
        observeThread();

        // Set up a periodic check for the thread element in case it gets recreated
        setInterval(() => {
            const threadPillar = document.querySelector('.msg-thread--pillar');
            if (threadPillar && !observer.takeRecords().length) {
                observer.disconnect();
                observeThread();
            }
        }, 1000);
    }

    function startLocationObserver() {
        let lastUrl = window.location.href;
        
        // Watch for URL changes
        setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                processedProfiles.clear(); // Reset processed profiles on URL change
                debouncedCheck();
            }
        }, 500);
    }

    return {
        start() {
            setupThreadObserver();
            startLocationObserver();
            // console.log('Enhanced profile monitor started');
        },

        stop() {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            if (checkInterval) {
                clearInterval(checkInterval);
                checkInterval = null;
            }
            if (debounceTimer) {
                clearTimeout(debounceTimer);
                debounceTimer = null;
            }
            processedProfiles.clear();
            // console.log('Profile monitor stopped');
        },

        reset() {
            processedProfiles.clear();
            debouncedCheck();
            // console.log('Profile monitor reset');
        }
    };
})();

// Auto-start the monitor
window.profileMonitor.start();
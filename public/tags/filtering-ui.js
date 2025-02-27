// filtering-ui.js

window.filteringUI = (function () {
    // Private variables
    let debounceTimeout = null;
    const DEBOUNCE_DELAY = 300; // ms
    let contentObserver = null;
    let continuousObserverInterval = null;
    let isObserverStopped = false;

    // Apply filters to the conversation list
    async function applyFilters(selectedLabels) {
        // Skip filtering if observer is stopped
        if (isObserverStopped) return;

        // Get all conversation list items
        const conversationList = document.querySelector('.msg-conversations-container__conversations-list');
        if (!conversationList) return;

        const conversationItems = conversationList.querySelectorAll('.msg-conversation-listitem');

        // If no filters selected, show all conversations
        if (!selectedLabels || selectedLabels.size === 0) {
            conversationItems.forEach(item => {
                item.style.display = '';
            });
            return;
        }

        // Get label data to match names with IDs
        const labelData = window.filterManager?.state?.labels || [];
        const selectedProfileNames = new Set();

        // Convert label IDs to names
        selectedLabels.forEach(labelId => {
            const label = labelData.find(l => l.label_id === labelId);
            if (label) {
                const profiles = label.profiles.map(profile => profile.name.toLowerCase());
                profiles.forEach(name => selectedProfileNames.add(name));
            }
        });

        // Filter conversations based on participant names with sequential removal
        for (const item of conversationItems) {
            const nameElement = item.querySelector('.msg-conversation-listitem__participant-names .truncate');

            if (!nameElement) {
                item.style.display = 'none';
                continue;
            }

            const participantName = nameElement.textContent.trim().toLowerCase();
            let matchFound = false;

            // Check if any selected label name appears in the participant name
            for (const labelName of selectedProfileNames) {
                if (participantName === labelName) {
                    matchFound = true;
                    break;
                }
            }

            // Sequentially hide items with a small delay
            if (!matchFound) {
                await new Promise(resolve => {
                    setTimeout(() => {
                        item.style.display = 'none';
                        resolve();
                    }, 10);
                });
            } else {
                item.style.display = '';
            }
        }

        // Update filter count in UI
        updateFilteredCount(conversationItems);
    }

    function updateFilteredCount(items) {
        // Find all visible message items
        const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
    
        // Get the date from the last item (regardless of visibility)
        let lastDate = '';
        if (items.length > 0) {
            const lastItem = items[items.length - 1];
            const dateElement = lastItem.querySelector('.msg-conversation-listitem__time-stamp');
            if (dateElement) {
                lastDate = dateElement.textContent.trim();
            }
        }
    
        // Create or update counter element
        let counterElement = document.getElementById('filter-results-counter');
    
        if (!counterElement) {
            counterElement = document.createElement('div');
            counterElement.id = 'filter-results-counter';
            counterElement.className = 'filter-results-counter';
            counterElement.style.display = 'flex';
            counterElement.style.alignItems = 'center';
            counterElement.style.justifyContent = 'space-between';
            counterElement.style.padding = '8px 16px';
            counterElement.style.fontSize = '14px';
            counterElement.style.color = 'var(--lm-text, #333)';
            counterElement.style.borderBottom = '1px solid var(--lm-border, #e0e0e0)';
        }
    
        // Create text span
        const textSpan = document.createElement('span');
        textSpan.id = 'filter-results-text';
    
        // Create control buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '8px';
    
        // Stop button
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop';
        stopButton.style.backgroundColor = '#f44336';
        stopButton.style.color = 'white';
        stopButton.style.border = 'none';
        stopButton.style.borderRadius = '4px';
        stopButton.style.padding = '4px 8px';
        stopButton.style.fontSize = '12px';
        stopButton.style.cursor = 'pointer';
        stopButton.onclick = () => {
            window.filteringUI.stopObserver();
            stopButton.disabled = true;
            resumeButton.disabled = false;
        };
    
        // Resume button
        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'Resume';
        resumeButton.style.backgroundColor = '#4CAF50';
        resumeButton.style.color = 'white';
        resumeButton.style.border = 'none';
        resumeButton.style.borderRadius = '4px';
        resumeButton.style.padding = '4px 8px';
        resumeButton.style.fontSize = '12px';
        resumeButton.style.cursor = 'pointer';
        resumeButton.onclick = () => {
            window.filteringUI.resumeObserver();
            resumeButton.disabled = true;
            stopButton.disabled = false;
        };
    
        // Initial state
        resumeButton.disabled = true;
    
        // Add buttons to container
        buttonsContainer.appendChild(stopButton);
        buttonsContainer.appendChild(resumeButton);
    
        // Clear previous content
        counterElement.innerHTML = '';
    
        // Append text and buttons
        if (visibleItems.length < items.length) {
            textSpan.textContent = `Messages until ${lastDate}`;
            counterElement.appendChild(textSpan);
            counterElement.appendChild(buttonsContainer);
            counterElement.style.display = 'flex';
        } else {
            counterElement.style.display = 'none';
        }
    
        // Insert before the conversation list if not already in the DOM
        const listParent = document.querySelector('.msg-conversations-container__conversations-list');
        if (listParent && listParent.parentNode && !counterElement.parentNode) {
            listParent.parentNode.insertBefore(counterElement, listParent);
        }
    }

    // Debounced filter function to improve performance
    function debouncedApplyFilters(selectedLabels) {
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
            applyFilters(selectedLabels);
        }, DEBOUNCE_DELAY);
    }

    // Continuous observer to check for list changes
    function setupContinuousObserver() {
        let lastItemCount = 0;
        let lastSelectedLabels = new Set();

        continuousObserverInterval = setInterval(() => {
            // Skip if observer is stopped
            if (isObserverStopped) return;

            const conversationList = document.querySelector('.msg-conversations-container__conversations-list');
            if (!conversationList) return;

            const currentItems = conversationList.querySelectorAll('.msg-conversation-listitem');
            const activeFilters = window.filterManager?.state?.selectedLabels || new Set();

            // Check if items have changed or filters have changed
            const itemsChanged = currentItems.length !== lastItemCount;
            const filtersChanged = !areSetsEqual(activeFilters, lastSelectedLabels);

            if (itemsChanged || filtersChanged) {
                // Update last known state
                lastItemCount = currentItems.length;
                lastSelectedLabels = new Set(activeFilters);

                // Apply filters if any are active
                if (activeFilters.size > 0) {
                    debouncedApplyFilters(activeFilters);
                }
            }
        }, 1000); // Check every second
    }

    // Utility function to compare Sets
    function areSetsEqual(setA, setB) {
        if (setA.size !== setB.size) return false;
        for (const item of setA) {
            if (!setB.has(item)) return false;
        }
        return true;
    }

    // Stop the observer
    function stopObserver() {
        isObserverStopped = true;
        
        // Clear the interval
        if (continuousObserverInterval) {
            clearInterval(continuousObserverInterval);
            continuousObserverInterval = null;
        }

        // Clear any pending debounce timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
            debounceTimeout = null;
        }
    }

    // Resume the observer
    function resumeObserver() {
        isObserverStopped = false;
        
        // Restart the continuous observer
        setupContinuousObserver();
    }

    // Initialize the filtering UI
    function init() {
        // Reset observer stopped state
        isObserverStopped = false;

        // Setup integration with filter manager
        if (window.filterManager) {
            // Monitor changes to the selected filters
            const originalHandleFilterClick = window.filterManager.handleFilterClick;

            window.filterManager.handleFilterClick = function (filterId) {
                // Skip if observer is stopped
                if (isObserverStopped) return;

                // Call the original method
                originalHandleFilterClick.call(window.filterManager, filterId);

                // Apply filters with the updated selection
                debouncedApplyFilters(window.filterManager.state.selectedLabels);
            };

            // Monitor clear all action
            const originalClearAllFilters = window.filterManager.clearAllFilters;

            window.filterManager.clearAllFilters = function () {
                // Skip if observer is stopped
                if (isObserverStopped) return;

                // Call the original method
                originalClearAllFilters.call(window.filterManager);

                // Clear all filters in UI
                debouncedApplyFilters(new Set());
            };
        }

        // Set up continuous observer for content changes
        setupContinuousObserver();

        // Return cleanup function
        return function cleanup() {
            if (continuousObserverInterval) {
                clearInterval(continuousObserverInterval);
            }

            if (debounceTimeout) {
                clearTimeout(debounceTimeout);
            }
        };
    }

    // Public API
    return {
        init,
        applyFilters: debouncedApplyFilters,
        stopObserver,
        resumeObserver
    };
})();

(function () {
    if (window.location.hostname.includes('linkedin.com')) {
        const cleanup = window.filteringUI.init();

        window.addEventListener('unload', cleanup);
    }
})();
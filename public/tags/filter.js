// filter-manager.js
class FilterManager {
    constructor() {
        if (window.filterManager) return window.filterManager;

        this.state = {
            isOpen: false,
            labels: [], // Will be populated from labelsDatabase
            selectedLabels: new Set(), // Track selected labels
            currentPath: location.pathname,
            initialized: false,
            lastUrl: location.href,
            debounceTimeout: null
        };

        this.elements = {
            button: null,
            dropdown: null
        };

        // Bind methods
        this.handlers = {
            labelsUpdate: this.handleLabelsUpdate.bind(this),
            buttonClick: this.handleButtonClick.bind(this),
            outsideClick: this.handleOutsideClick.bind(this),
            resize: this.handleResize.bind(this),
            filterClick: this.handleFilterClick.bind(this)
        };

        window.filterManager = this;
        this.setupKeyboardNavigation();
        this.initialize();
    }

    initialize() {
        if (this.state.initialized || !window.location.hostname.includes('linkedin.com')) return;

        this.setupListeners();
        this.setupObservers();
        if (window?.firebaseService?.currentUser?.email?.includes("hyperverge.co")) {
            this.initializeUI();
        }
        

        this.state.initialized = true;
    }

    setupListeners() {
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
            window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        }


        document.addEventListener('click', this.handlers.outsideClick);
        window.addEventListener('resize', this.handlers.resize);
    }

    setupKeyboardNavigation() {
        // Global keyboard listener for 'f' key
        const handleGlobalKeydown = (event) => {
            // Only trigger on 'f' key when not in an input or editable element
            if (event.key === 'f' &&
                !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) &&
                !document.activeElement.isContentEditable) {

                // Prevent default 'f' key behavior
                event.preventDefault();

                // Open dropdown
                this.state.isOpen = true;
                this.updateDropdownVisibility();

                // Focus on search input
                const searchInput = this.elements.dropdown?.querySelector('.filter_search_input');
                searchInput?.focus();
            }
        };

        // Add global keydown listener
        document.addEventListener('keydown', handleGlobalKeydown);
    }

    createElements(container) {
        if (!container) return;

        this.cleanupElements();

        // Create button
        this.elements.button = document.createElement('button');
        this.elements.button.className = 'hyper_filter_button';
        this.elements.button.id = 'hyper_filter_button';
        this.elements.button.innerHTML = 'Filters';
        this.elements.button.addEventListener('click', this.handlers.buttonClick);

        // Add count badge if filters are selected
        this.updateFilterCountBadge();

        // Create dropdown
        this.elements.dropdown = document.createElement('div');
        this.elements.dropdown.className = 'hyper_filter_dropdown';
        this.elements.dropdown.id = 'hyper_filter_dropdown';
        this.elements.dropdown.style.display = 'none';

        // Add search input with icon
        const searchContainer = document.createElement('div');
        searchContainer.className = 'filter_search_container';
        searchContainer.style.position = 'relative'; // For icon positioning

        // Create search icon
        const searchIcon = document.createElement('div');
        searchIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="search-icon">
                <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M14 14L11 11" stroke="#94A3B8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'filter_search_input';
        searchInput.placeholder = 'Search filters...';
        searchInput.style.paddingLeft = '36px'; // Space for icon
        searchInput.addEventListener('input', this.handleSearchInput.bind(this));

        // Append search icon and input to container
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'dropdown_content';

        // Build dropdown structure
        this.elements.dropdown.appendChild(searchContainer);
        this.elements.dropdown.appendChild(contentContainer);

        // Insert into DOM
        container.appendChild(this.elements.button);
        document.body.appendChild(this.elements.dropdown);

        // Update content after structure is ready
        this.updateDropdownContent();
    }

    updateFilterCountBadge() {
        // Remove existing badge if any
        const existingBadge = this.elements.button?.querySelector('.hyper_filter_button_count');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Add badge if we have selected filters
        if (this.state.selectedLabels.size > 0 && this.elements.button) {
            const badge = document.createElement('span');
            badge.className = 'hyper_filter_button_count';
            badge.textContent = this.state.selectedLabels.size;
            this.elements.button.appendChild(badge);
        }
    }

    handleSearchInput(event) {
        const searchText = event.target.value.trim().toLowerCase();
        const filterItems = this.elements.dropdown.querySelectorAll('.filter_item');

        filterItems.forEach(item => {
            const filterName = item.querySelector('.filter_name').textContent.toLowerCase();
            if (searchText === '' || filterName.includes(searchText)) {
                item.classList.remove('filter-hidden');
            } else {
                item.classList.add('filter-hidden');
            }
        });

        // Check if any items are visible in each section
        const sections = this.elements.dropdown.querySelectorAll('.filter_section');
        sections.forEach(section => {
            const visibleItems = section.querySelectorAll('.filter_item:not(.filter-hidden)');
            if (visibleItems.length === 0) {
                section.classList.add('filter-hidden');
            } else {
                section.classList.remove('filter-hidden');
            }
        });

        // Show no results message if needed
        let noResultsElem = this.elements.dropdown.querySelector('.no_filters');
        if (!noResultsElem && this.elements.dropdown.querySelectorAll('.filter_item:not(.filter-hidden)').length === 0) {
            const contentContainer = this.elements.dropdown.querySelector('.dropdown_content');
            noResultsElem = document.createElement('div');
            noResultsElem.className = 'no_filters';
            noResultsElem.textContent = 'No matching filters found.';
            contentContainer.appendChild(noResultsElem);
        } else if (noResultsElem && this.elements.dropdown.querySelectorAll('.filter_item:not(.filter-hidden)').length > 0) {
            noResultsElem.remove();
        }
    }

    handleFilterClick(filterId) {
        // Toggle selected state
        if (this.state.selectedLabels.has(filterId)) {
            this.state.selectedLabels.delete(filterId);
        } else {
            this.state.selectedLabels.add(filterId);
        }

        // Update UI to reflect selection
        this.updateFilterSelection();

        // Update the count badge on the button
        this.updateFilterCountBadge();

        // console.log('Selected filters:', Array.from(this.state.selectedLabels));
    }

    updateFilterSelection() {
        // Update all filter items to reflect current selection state
        this.elements.dropdown.querySelectorAll('.filter_item').forEach(item => {
            const filterId = item.dataset.filterId;
            if (this.state.selectedLabels.has(filterId)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    clearAllFilters() {
        this.state.selectedLabels.clear();
        this.updateFilterSelection();
        this.updateFilterCountBadge();
    }

    createFilterElement(label) {
        const isSelected = this.state.selectedLabels.has(label.label_id);

        return `
            <div class="filter_item ${isSelected ? 'selected' : ''}" 
                 data-filter-id="${label.label_id}" 
                 tabindex="0">
                <span class="color_dot" style="background-color: ${label.label_color}"></span>
                <span class="filter_name">${label.label_name}</span>
                <span class="filter_count">${label.profiles.length}</span>
                <svg class="filter_check" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        `;
    }

    updateDropdownContent() {
        if (!this.elements.dropdown) return;

        // Clear old content
        const contentContainer = this.elements.dropdown.querySelector('.dropdown_content');

        // Group labels by type for display
        const owned = this.state.labels.filter(l => l.type === 'owned');
        const shared = this.state.labels.filter(l => l.type === 'shared');

        // Create content with clear filters button if any filters are selected
        let clearFiltersButton = '';
        if (this.state.selectedLabels.size > 0) {
            clearFiltersButton = `
                <button class="clear_filters">Clear all filters (${this.state.selectedLabels.size})</button>
            `;
        }

        contentContainer.innerHTML = `
            ${clearFiltersButton}
            ${owned.length ? `
                <div class="filter_section">
                    <div class="section_header">Owned Filters</div>
                    ${owned.map(label => this.createFilterElement(label)).join('')}
                </div>
            ` : ''}
            ${shared.length ? `
                <div class="filter_section">
                    <div class="section_header">Shared Filters</div>
                    ${shared.map(label => this.createFilterElement(label)).join('')}
                </div>
            ` : ''}
            ${!owned.length && !shared.length ?
                '<div class="no_filters">No filters available</div>' : ''
            }
        `;

        // Add event listeners to filter items
        this.elements.dropdown.querySelectorAll('.filter_item').forEach(item => {
            item.addEventListener('click', (e) => {
                const filterId = e.currentTarget.dataset.filterId;
                this.handleFilterClick(filterId);
            });
        });

        // Add event listener to clear filters button
        const clearButton = this.elements.dropdown.querySelector('.clear_filters');
        if (clearButton) {
            clearButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearAllFilters();
                this.updateDropdownContent();
            });
        }
    }

    handleLabelsUpdate(data) {
        if (!window?.firebaseService?.currentUser?.email?.includes("hyperverge.co")) {
            this.state.labels = data.labels || [];
            this.updateDropdownContent();
        }


    }

    setupObservers() {
        // URL changes observer
        const observer = new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== this.state.lastUrl) {
                this.state.lastUrl = currentUrl;

                // Only trigger update if path changed
                if (location.pathname !== this.state.currentPath) {
                    this.state.currentPath = location.pathname;
                    this.debounceUIUpdate();
                }
            }
        });

        observer.observe(document, {
            subtree: true,
            childList: true
        });
    }

    debounceUIUpdate() {
        if (this.state.debounceTimeout) {
            clearTimeout(this.state.debounceTimeout);
        }

        this.state.debounceTimeout = setTimeout(() => {
            const existingButton = document.querySelector('.hyper_filter_button');
            if (!existingButton) {
                // Find the appropriate container
                const isProfilePage = /linkedin\.com\/in\//.test(window.location.href);

                if (isProfilePage) {
                    // For profile pages, place button in body
                    this.createElements(document.body);
                } else {
                    // For other pages, try to find a target container
                    const container = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)') || document.body;
                    this.createElements(container);
                }
            }
        }, 300);
    }

    initializeUI() {
        const isMessaging = location.pathname.includes('/messaging/thread');

        if (isMessaging) {
            this.waitForContainer();
        } else {
            const existingButton = document.querySelector('.hyper_filter_button');
            if (!existingButton) {
                this.createElements(document.body);
            }
        }
    }

    waitForContainer() {
        const startTime = Date.now();
        const MAX_WAIT_TIME = 5000;
        const CHECK_INTERVAL = 50;

        const interval = setInterval(() => {
            const container = document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container > div:nth-child(1)');
            const existingButton = container?.querySelector('.hyper_filter_button');

            if (container && !existingButton) {
                clearInterval(interval);
                this.createElements(container);
            } else if (Date.now() - startTime >= MAX_WAIT_TIME) {
                clearInterval(interval);
                // Fallback to body if container not found
                if (!document.querySelector('.hyper_filter_button')) {
                    this.createElements(document.body);
                }
            }
        }, CHECK_INTERVAL);
    }

    handleButtonClick() {
        this.state.isOpen = !this.state.isOpen;
        this.updateDropdownVisibility();
    }

    updateDropdownVisibility() {
        if (!this.elements.dropdown) return;

        if (this.state.isOpen) {
            this.updateDropdownPosition();
            this.elements.dropdown.style.display = 'block';
            requestAnimationFrame(() => {
                this.elements.dropdown.classList.add('visible');
            });
        } else {
            this.elements.dropdown.classList.remove('visible');
            setTimeout(() => {
                if (!this.state.isOpen) {
                    this.elements.dropdown.style.display = 'none';
                }
            }, 200);
        }
    }

    handleOutsideClick(event) {
        if (!this.state.isOpen) return;

        if (!this.elements.dropdown?.contains(event.target) &&
            !this.elements.button?.contains(event.target)) {
            this.state.isOpen = false;
            this.updateDropdownVisibility();
        }
    }

    handleResize() {
        if (this.state.isOpen) {
            this.updateDropdownPosition();
        }
    }

    updateDropdownPosition() {
        if (!this.elements.button || !this.elements.dropdown) return;

        const buttonRect = this.elements.button.getBoundingClientRect();
        const isProfilePage = /linkedin\.com\/in\//.test(window.location.href);

        if (isProfilePage) {
            // Position dropdown relative to button for profile pages
            this.elements.dropdown.style.position = 'fixed';
            this.elements.dropdown.style.top = `${buttonRect.bottom + 5}px`;
            this.elements.dropdown.style.left = `${buttonRect.left}px`;
            this.elements.dropdown.style.minWidth = `250px`;
        } else {
            // Standard positioning for other pages
            this.elements.dropdown.style.position = 'fixed';
            this.elements.dropdown.style.top = `${buttonRect.bottom + 5}px`;
            this.elements.dropdown.style.left = `${buttonRect.left}px`;
            this.elements.dropdown.style.minWidth = `${Math.max(buttonRect.width, 250)}px`;
        }
    }

    cleanupElements() {
        this.elements.button?.remove();
        this.elements.dropdown?.remove();
        this.elements.button = null;
        this.elements.dropdown = null;
    }

    destroy() {
        // Remove listeners
        if (window.labelsDatabase) {
            window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        }
        document.removeEventListener('click', this.handlers.outsideClick);
        window.removeEventListener('resize', this.handlers.resize);

        // Clear timers
        clearTimeout(this.state.debounceTimeout);

        // Cleanup DOM
        this.cleanupElements();

        // Reset state
        this.state.initialized = false;
        window.filterManager = null;
    }
}

// Initialize the filter manager when the script loads
(function () {
    if (window.location.hostname.includes('linkedin.com')) {
        new FilterManager();
    }
})();
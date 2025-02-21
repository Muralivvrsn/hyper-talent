// keyboardNavigation.js
class KeyboardNavigationManager {
    constructor(mainContainerId) {
        this.mainContainerId = mainContainerId;
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.searchInputId = null;
        this.initialized = false;

        this.isVisible = false;
        this.handleGlobalKeyPress = this.handleGlobalKeyPress.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleFocusIn = this.handleFocusIn.bind(this);

        this.isEditingMode = false;
        this.initialize = this.initialize.bind(this);
        this.handleEditModeChanged = this.handleEditModeChanged.bind(this);
    }

    initialize(searchInputId) {
        if (this.initialized) return;

        this.searchInputId = searchInputId;
        this.initialized = true;

        // Add event listeners
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('focusin', this.handleFocusIn);
        document.addEventListener('keypress', this.handleGlobalKeyPress);
        document.addEventListener('click', this.handleOutsideClick);
        document.addEventListener('editModeChanged', this.handleEditModeChanged);
    }

    handleEditModeChanged(event) {
        this.isEditingMode = event.detail.isEditing;
    }

    updateFocusableElements() {
        const container = document.getElementById(this.mainContainerId);
        if (!container) {
            // console.log('🎹 Keyboard: Container not found');
            return;
        }

        // Get all visible dropdown elements
        this.focusableElements = Array.from(
            container.querySelectorAll('.dropdown-element')
        ).filter(el => el.style.display !== 'none');

        // console.log('🎹 Keyboard: Updated focusable elements', {
        //     count: this.focusableElements.length
        // });
    }

    handleFocusIn(event) {
        const index = this.focusableElements.indexOf(event.target);
        if (index !== -1) {
            this.currentFocusIndex = index;
        }
    }
    handleGlobalKeyPress(event) {
        // Only respond to 'l' key when no input is focused
        if (event.key === 'l' && document.activeElement.tagName !== 'INPUT') {
            event.preventDefault();
            this.toggleVisibility();
        }
    }

    handleOutsideClick(event) {
        const container = document.getElementById(this.mainContainerId);
        const toggleButton = document.querySelector('.label-manager-toggle');

        if (this.isVisible && container && !container.contains(event.target)
            && !toggleButton.contains(event.target)) {
            this.hideContainer();
        }
    }

    async handleKeyDown(event) {
        if (this.isEditingMode) {
            return;
        }
        const searchInput = document.getElementById(this.searchInputId);
        const isInSearchInput = document.activeElement === searchInput;

        // Handle keyboard navigation
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (isInSearchInput) {
                    this.focusFirst();
                } else {
                    this.focusNext();
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (this.currentFocusIndex === 0) {
                    this.focusSearchInput();
                } else {
                    this.focusPrevious();
                }
                break;

            case 'Enter':
                if (isInSearchInput) {
                    event.preventDefault();
                    this.updateFocusableElements(); // Ensure list is up to date
                    if (this.focusableElements.length > 0) {
                        // If we have results, click the first one    
                        // window.labelCore.applyLabel()                        
                        this.focusableElements[0].click();
                        const labelElement = this.focusableElements[0].querySelector('.label-text');
                        // console.log(labelElement.id); // This will give you "label_1739944442262_vvd9y7ijq-label"
                        await window.labelCore.applyLabel(labelElement.id)    
                        // console.log()
                        
                    } else {
                        window.show_success("creating..")
                        await window.labelCore.createLabel(searchInput.value);
                        console.log('creating a label:', searchInput.value);
                    }
                } else if (this.currentFocusIndex >= 0) {
                    event.preventDefault();
                    this.focusableElements[this.currentFocusIndex].click();
                    const labelElement = this.focusableElements[this.currentFocusIndex].querySelector('.label-text');
                    await window.labelCore.applyLabel(labelElement.id)  
                    // window.show_success("clicked..")
                }
                break;

            case 'Escape':
                event.preventDefault();
                this.hideContainer();
                break;

            case 'Tab':
                // Allow natural tab navigation
                break;

            default:
                // If typing while focus is on a label, move focus to search input
                if (!isInSearchInput && event.key.length === 1) {
                    this.focusSearchInput();
                }
                break;
        }
    }

    focusFirst() {
        this.updateFocusableElements();
        if (this.focusableElements.length > 0) {
            this.currentFocusIndex = 0;
            this.focusableElements[0].focus();
            // console.log('🎹 Keyboard: Focused first element');
        }
    }

    focusNext() {
        this.updateFocusableElements();
        if (this.focusableElements.length === 0) return;

        if (this.currentFocusIndex < this.focusableElements.length - 1) {
            this.currentFocusIndex++;
        } else {
            this.currentFocusIndex = 0;
        }

        this.focusableElements[this.currentFocusIndex].focus();
        // console.log('🎹 Keyboard: Focused next element', {
        //     index: this.currentFocusIndex
        // });
    }

    focusPrevious() {
        this.updateFocusableElements();
        if (this.focusableElements.length === 0) return;

        if (this.currentFocusIndex > 0) {
            this.currentFocusIndex--;
        } else {
            this.currentFocusIndex = this.focusableElements.length - 1;
        }

        this.focusableElements[this.currentFocusIndex].focus();
        // console.log('🎹 Keyboard: Focused previous element', {
        //     index: this.currentFocusIndex
        // });
    }

    focusSearchInput() {
        const searchInput = document.getElementById(this.searchInputId);
        if (searchInput) {
            this.currentFocusIndex = -1;
            searchInput.focus();
            // console.log('🎹 Keyboard: Focused search input');
        }
    }

    getCurrentFocusIndex() {
        return this.currentFocusIndex;
    }

    isSearchInputFocused() {
        return document.activeElement.id === this.searchInputId;
    }

    toggleVisibility() {
        const container = document.getElementById(this.mainContainerId);
        const toggleButton = document.querySelector('.label-manager-toggle');

        if (container && toggleButton) {
            this.isVisible = !this.isVisible;

            if (this.isVisible) {
                const buttonRect = toggleButton.getBoundingClientRect();

                // Set container position
                container.style.position = 'fixed';
                container.style.zIndex = '9999';
                container.style.left = `${buttonRect.left}px`;
                container.style.top = `${buttonRect.bottom + 5}px`;
                container.style.display = 'flex';

                this.focusSearchInput();
            } else {
                container.style.display = 'none';
            }
        }
    }

    hideContainer() {
        this.isVisible = false;
        const container = document.getElementById(this.mainContainerId);
        if (container) {
            container.style.display = 'none';
        }
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('focusin', this.handleFocusIn);
        document.removeEventListener('keypress', this.handleGlobalKeyPress);
        document.removeEventListener('click', this.handleOutsideClick);
        document.removeEventListener('editModeChanged', this.handleEditModeChanged);
        this.initialized = false;
        this.focusableElements = [];
        this.currentFocusIndex = -1;
    }
}





// Export for use
window.KeyboardNavigationManager = KeyboardNavigationManager;
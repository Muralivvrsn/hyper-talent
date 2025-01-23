window.labelFilterUI = {
    elements: {
        container: null,
        button: null,
        dropdown: null,
        selectedLabelsWrapper: null,
        selectedLabelsContainer: null,
        searchInput: null,
        searchResults: null
    },
    state: {
        currentFocusIndex: -1,
        visibleOptions: [],
        isSearching: false,
        labels: [],          // All labels
        filteredLabels: []
    },

    styles: `
    .label-filter-container {
        position: relative;
        display: inline-block;
        font-family: "Poppins", serif !important;
        margin-left: 8px;
        font-size: 13px;
    }
    
    .label-filter-button {
        padding: 6px 12px;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        box-sizing: border-box;
        font-size: 13px;
        font-family: "Poppins", serif !important;
        color: #444;
        transition: all 0.2s ease;
    }

    .label-filter-button:hover {
        border-color: #ccc;
        background: #f8f8f8;
    }
    
    .label-count {
        background: #f0f0f0;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 11px;
        font-family: "Poppins", serif !important;
        color: #666;
        min-width: 14px;
        text-align: center;
    }
    
    .label-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 6px 0;
        margin-top: 2px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        display: none;
        z-index: 1000;
        min-width: 220px;
        font-size: 13px;
        font-family: "Poppins", serif !important;
    }
    
    .label-dropdown.show {
        display: block;
    }
    
    .label-option {
        padding: 6px 12px;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #444;
        transition: background 0.2s ease;
        position: relative;
    }
    
    .label-option:hover {
        background: #f5f5f5;
    }

    .label-option.selected {
        background: #f8f8f8;
    }

    .label-checkbox {
        width: 14px;
        height: 14px;
        margin: 0;
        border-radius: 3px;
        border: 1px solid #ddd;
        position: relative;
        appearance: none;
        cursor: pointer;
    }

    .label-checkbox:checked {
        border-color: #0073b1;
        background: #0073b1;
    }

    .label-checkbox:checked::after {
        content: '✓';
        position: absolute;
        color: white;
        font-size: 10px;
        font-family: "Poppins", serif !important;
        top: 1px;
        left: 2px;
    }

    .label-text-filter {
        flex-grow: 1;
        font-size: 13px;
        font-family: "Poppins", serif !important;
        opacity: 0.9;
    }
    
    .selected-labels-wrapper {
        padding: 8px 12px;
    }
    
    .selected-labels {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }
    
    .selected-label {
        padding: 6px 12px;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        height: 25px;
        box-sizing: border-box;
        font-size: 12px;
        font-family: "Poppins", serif !important;
        color: #444;
        transition: all 0.2s ease;
    }
    
    .remove-label {
        cursor: pointer;
        width: 14px;
        height: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(0,0,0,0.1);
        color: #666;
        font-size: 10px;
        font-family: "Poppins", serif !important;
        transition: all 0.2s ease;
    }
    
    .remove-label:hover {
        background: rgba(0,0,0,0.15);
        color: #333;
    }

    .label-option-remove {
        opacity: 0;
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: #f0f0f0;
        color: #666;
        font-size: 10px;
        font-family: "Poppins", serif !important;
        transition: all 0.2s ease;
    }

    .label-option:hover .label-option-remove {
        opacity: 1;
    }

    .label-option-remove:hover {
        background: #e0e0e0;
        color: #333;
    }

    .filter-loading-indicator {
        background: rgba(255, 255, 255, 0.96) !important;
        backdrop-filter: blur(4px);
        font-size: 13px !important;
        font-family: "Poppins", serif !important;
    }
    .label-search-container {
        padding: 8px 12px;
        border-bottom: 1px solid #e0e0e0;
    }

    .label-search-input {
        width: 100%;
        padding: 6px 10px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        font-size: 13px;
        font-family: "Poppins", sans-serif !important;
        outline: none;
        transition: all 0.2s ease;
    }

    .label-search-input:focus {
        border-color: #0073b1;
        box-shadow: 0 0 0 1px rgba(0, 115, 177, 0.2);
    }

    .label-option.keyboard-focus {
        background: #f0f0f0;
        outline: none;
    }

    .no-results {
        padding: 12px;
        text-align: center;
        color: #666;
        font-size: 13px;
        font-family: "Poppins", sans-serif !important;
    }
        .label-search-results {
    max-height: 300px;
    overflow-y: auto;
    margin-right: 1px;
    scrollbar-width: thin;
    scrollbar-color: #ccc transparent;
}

.label-search-results::-webkit-scrollbar {
    width: 6px;
}

.label-search-results::-webkit-scrollbar-track {
    background: transparent;
}

.label-search-results::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
}
`,


    renderLabels() {
        if (!this.elements.searchResults) return;

        this.elements.searchResults.innerHTML = '';
        this.state.visibleOptions = [];

        if (!this.state.filteredLabels.length) {
            const noResults = window.labelFilterUtils.createElement('div', 'no-results');
            noResults.textContent = 'No labels found';
            this.elements.searchResults.appendChild(noResults);
            return;
        }

        this.state.filteredLabels.forEach(label => {
            const option = window.labelFilterUtils.createElement('div', 'label-option');
            const isSelected = window.labelFilterCore?.selectedLabels.has(label.label_id);

            if (isSelected) {
                option.classList.add('selected');
                option.style.backgroundColor = `${label.label_color}33`;
            }

            const checkbox = window.labelFilterUtils.createElement('input', 'label-checkbox', {
                type: 'checkbox',
                value: label.label_id,
                checked: isSelected
            });

            const labelDiv = window.labelFilterUtils.createElement('div', 'label-text-filter');
            labelDiv.textContent = label.label_name;
            labelDiv.style.color = label.label_color;

            option.appendChild(checkbox);
            option.appendChild(labelDiv);

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectCurrentOption(option);
            });

            this.elements.searchResults.appendChild(option);
            this.state.visibleOptions.push(option);
        });
    },
    setupFilterButton() {
        if (document.querySelector('.label-filter-container')) {
            return false;
        }

        this.injectStyles();
        const firstDiv = window.labelFilterUtils.findTargetContainer()?.querySelector('div');
        if (!firstDiv) return false;

        this.createElements(firstDiv);
        this.attachEventListeners();
        this.setupKeyboardNavigation();
        return true;
    },

    injectStyles() {
        if (document.querySelector('style[data-label-filter-styles]')) {
            return;
        }
        const style = window.labelFilterUtils.createElement('style');
        style.setAttribute('data-label-filter-styles', 'true');
        style.textContent = this.styles;
        document.head.appendChild(style);
    },

    createElements(parentElement) {
        // Create existing elements
        this.elements.container = window.labelFilterUtils.createElement('div', 'label-filter-container');
        this.elements.button = window.labelFilterUtils.createElement('button', 'label-filter-button');
        this.elements.button.innerHTML = `Filter <span class="label-count">0</span>`;
        this.elements.dropdown = window.labelFilterUtils.createElement('div', 'label-dropdown');

        // Create search container and input
        const searchContainer = window.labelFilterUtils.createElement('div', 'label-search-container');
        this.elements.searchInput = window.labelFilterUtils.createElement('input', 'label-search-input', {
            type: 'text',
            placeholder: 'Search labels...'
        });
        searchContainer.appendChild(this.elements.searchInput);

        // Create results container
        this.elements.searchResults = window.labelFilterUtils.createElement('div', 'label-search-results');

        // Append search elements to dropdown
        this.elements.dropdown.appendChild(searchContainer);
        this.elements.dropdown.appendChild(this.elements.searchResults);

        // Create selected labels elements
        this.elements.selectedLabelsWrapper = window.labelFilterUtils.createElement('div', 'selected-labels-wrapper');
        this.elements.selectedLabelsContainer = window.labelFilterUtils.createElement('div', 'selected-labels');

        // Append everything
        this.elements.selectedLabelsWrapper.appendChild(this.elements.selectedLabelsContainer);
        this.elements.selectedLabelsWrapper.style.display = 'none';
        this.elements.container.appendChild(this.elements.button);
        this.elements.container.appendChild(this.elements.dropdown);
        parentElement.appendChild(this.elements.container);

        const targetContainer = window.labelFilterUtils.findTargetContainer();
        targetContainer.parentNode.insertBefore(
            this.elements.selectedLabelsWrapper,
            targetContainer.nextSibling
        );
        this.initializeLabels();
    },

    attachEventListeners() {
        // Existing click handlers
        this.elements.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        document.addEventListener('click', (e) => {
            if (!this.elements.container.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Search input handler
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' && !this.isInputFocused() && !document.activeElement.matches('input, textarea') && document.activeElement.getAttribute('contenteditable') !== 'true' &&
            !document.activeElement.classList.contains('msg-form__contenteditable')) {
                e.preventDefault();
                this.toggleDropdown(true);
            }
        });
    },

    isInputFocused() {
        return document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA';
    },

    setupKeyboardNavigation() {
        this.elements.dropdown.addEventListener('keydown', (e) => {
            const options = this.state.visibleOptions;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveFocus(1, options);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    this.moveFocus(-1, options);
                    break;

                case 'Enter':
                    e.preventDefault();
                    if (this.state.currentFocusIndex >= 0) {
                        this.selectCurrentOption(options[this.state.currentFocusIndex]);
                    } else if (this.elements.searchInput.value && options.length > 0) {
                        // Select first option when pressing enter in search
                        this.selectCurrentOption(options[0]);
                    }
                    break;

                case 'Escape':
                    e.preventDefault();
                    this.closeDropdown();
                    break;
            }
        });
    },

    moveFocus(direction, options) {
        const maxIndex = options.length - 1;
        let newIndex = this.state.currentFocusIndex + direction;

        if (newIndex < 0) newIndex = maxIndex;
        if (newIndex > maxIndex) newIndex = 0;

        this.updateFocus(newIndex, options);
    },

    updateFocus(index, options) {
        // Remove previous focus
        options.forEach(opt => opt.classList.remove('keyboard-focus'));

        if (index >= 0 && options[index]) {
            options[index].classList.add('keyboard-focus');
            options[index].scrollIntoView({ block: 'nearest' });
        }

        this.state.currentFocusIndex = index;
    },

    selectCurrentOption(option) {
        if (option) {
            const checkbox = option.querySelector('input[type="checkbox"]');
            const labelId = checkbox.value;
            checkbox.checked = !checkbox.checked;
            option.classList.toggle('selected');

            if (checkbox.checked) {
                option.style.backgroundColor = `${window.labelFilterCore?.state.labelsCache.get(labelId).color}33`;
            } else {
                option.style.backgroundColor = 'transparent';
            }

            window.labelFilterCore?.toggleLabel(labelId);
        }
    },

    toggleDropdown(focusSearch = false) {
        const isVisible = this.elements.dropdown.classList.contains('show');
        
        if (!isVisible) {
            this.elements.dropdown.classList.add('show');
            // No need to update labels, just render current state
            this.renderLabels();
            if (focusSearch) {
                this.elements.searchInput.focus();
            }
        } else {
            this.closeDropdown();
        }
    },
    

    closeDropdown() {
        this.elements.dropdown.classList.remove('show');
        this.elements.searchInput.value = '';
        this.state.currentFocusIndex = -1;
        // Reset filtered labels to show all when reopening
        this.state.filteredLabels = this.state.labels;
    },

    handleSearch(query) {
        if (!query.trim()) {
            this.state.filteredLabels = this.state.labels;
        } else {
            this.state.filteredLabels = this.state.labels.filter(label => 
                label.label_name.toLowerCase().includes(query.toLowerCase().trim())
            );
        }
        this.renderLabels();
    },

    initializeLabels() {
        if (window.labelFilterCore?.state.labels) {
            this.updateLabelsDropdown(window.labelFilterCore?.state.labels);
        } else {
            // If labels aren't available yet, show loading state
            const loadingMsg = window.labelFilterUtils.createElement('div', 'no-results');
            loadingMsg.textContent = 'Loading labels...';
            this.elements.searchResults.appendChild(loadingMsg);
        }
    },

    updateLabelsDropdown(labels) {
        const sortedLabels = [...labels].sort((a, b) => 
            a.label_name.localeCompare(b.label_name)
        );
        
        this.state.labels = sortedLabels;
        this.state.filteredLabels = sortedLabels;
        this.renderLabels();
    },

    updateSelectedLabels() {
        const selectedLabels = window.labelFilterCore?.selectedLabels;
        this.elements.selectedLabelsContainer.innerHTML = '';

        selectedLabels.forEach(labelId => {
            const labelInfo = window.labelFilterCore?.state.labelsCache.get(labelId);
            if (!labelInfo) return;

            const labelElement = window.labelFilterUtils.createElement('div', 'selected-label');
            labelElement.style.background = `#ffffff`;
            labelElement.style.height = "28px";
            labelElement.style.padding = "6px 12px";
            labelElement.style.borderRadius = "6px";
            labelElement.style.fontSize = "13px";

            const labelText = document.createTextNode(labelInfo.name);
            const removeButton = window.labelFilterUtils.createElement('span', 'remove-label');
            removeButton.textContent = '×';

            removeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                window.labelFilterCore?.removeLabel(labelId);
            });

            labelElement.appendChild(labelText);
            labelElement.appendChild(removeButton);
            this.elements.selectedLabelsContainer.appendChild(labelElement);
        });

        const count = this.elements.button.querySelector('.label-count');
        count.textContent = selectedLabels.size;
        this.elements.selectedLabelsWrapper.style.display = selectedLabels.size > 0 ? 'block' : 'none';
    },

    async filterConversations(value) {
        const getFreshReferences = () => {
            const conversations = document.querySelectorAll('.msg-conversations-container__conversations-list > li.msg-conversation-listitem');
            const conversationsList = conversations[0]?.parentNode;
            return { conversations, conversationsList };
        };

        let { conversations, conversationsList } = getFreshReferences();
        if (!conversationsList) return;

        let lastFilteredConvo = value ?
            conversationsList.querySelector('.hypertalent-filter-checked') :
            Array.from(conversationsList.querySelectorAll('.hypertalent-filter-checked')).pop();

        let loadingEl = document.querySelector('.filter-loading-indicator');
        if (!loadingEl) {
            loadingEl = this.createLoadingIndicator();
            conversationsList.style.position = 'relative';
            conversationsList.appendChild(loadingEl);
        }

        if (lastFilteredConvo) {
            loadingEl.style.top = `${110 * Array.from(conversationsList.querySelectorAll('.hypertalent-filter-checked')).length}px`;
        } else {
            loadingEl.style.top = '0';
            loadingEl.style.bottom = '0';
            loadingEl.style.display = 'flex';
        }

        const hasActiveFilters = window.labelFilterCore?.state.allowedLabels.length > 0;
        for (const conversation of conversations) {
            const imgEl = conversation.querySelector('.msg-selectable-entity__entity img') ||
                conversation.querySelector('.msg-facepile-grid--no-facepile img');
            const nameEl = conversation.querySelector('.msg-conversation-listitem__participant-names .truncate');

            if (!imgEl || !nameEl) {
                this.hideConversation(conversation, hasActiveFilters);
                continue;
            }

            const imgSrc = imgEl.getAttribute('src');
            const name = nameEl.textContent.trim();

            const isMatch = await window.labelFilterCore?.checkLabelMatch(imgSrc, name);

            if (isMatch) {
                if (!conversation.classList.contains('hypertalent-filter-checked')) {
                    this.showConversation(conversation);
                    ({ conversations, conversationsList } = getFreshReferences());
                    loadingEl.style.top = `${110 * Array.from(conversationsList.querySelectorAll('.hypertalent-filter-checked')).length}px`;
                }
            } else {
                this.hideConversation(conversation, hasActiveFilters);
                ({ conversations, conversationsList } = getFreshReferences());
            }
        }

        if (!hasActiveFilters) {
            loadingEl.remove();
        }
    },

    createLoadingIndicator() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'filter-loading-indicator';
        loadingEl.style.cssText = `
            position: absolute;
            left: 0;
            right: 0;
            height: 100%;
            background: rgba(255, 255, 255, 0.98);
            z-index: 100;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 14px;
            line-height: 1.6;
            padding: 20px;
            text-align: center;
            gap: 8px;
            border-top: 1px solid #eee;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        `;

        const mainText = document.createElement('div');
        mainText.style.cssText = `
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
        `;
        mainText.textContent = 'Checking profiles...';

        const descText = document.createElement('div');
        descText.style.cssText = `
            font-size: 13px;
            color: #666;
            max-width: 280px;
        `;
        descText.textContent = 'This might take a moment as we review each profile to find your matches. Please wait...';

        loadingEl.appendChild(mainText);
        loadingEl.appendChild(descText);

        return loadingEl;
    },

    hideConversation(conversation, hasActiveFilters) {
        conversation.classList.remove('hypertalent-filter-checked');
        conversation.style.transition = 'opacity 0.5s ease';
        conversation.style.opacity = '0';
        if (hasActiveFilters) {
            return new Promise(resolve =>
                setTimeout(() => {
                    conversation.style.display = 'none';
                    resolve();
                }, 50)
            );
        }
        conversation.style.display = 'none';
    },

    showConversation(conversation) {
        conversation.classList.add('hypertalent-filter-checked');
        conversation.style.transition = 'opacity 0.5s ease';
        conversation.style.display = 'block';
        conversation.style.opacity = '1';
    },

    cleanup() {
        if (this.elements.container) {
            this.elements.container.remove();
        }
        if (this.elements.selectedLabelsWrapper) {
            this.elements.selectedLabelsWrapper.remove();
        }
        this.elements = {
            container: null,
            button: null,
            dropdown: null,
            selectedLabelsWrapper: null,
            selectedLabelsContainer: null
        };
    }
};
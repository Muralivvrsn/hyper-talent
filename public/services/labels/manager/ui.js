

window.labelManagerUI = {
    state: {
        container: null,
        labelList: null,
        searchInput: null,
        selectedIndex: -1
    },

    setupStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .label-manager {
                position: absolute;  
                top: 100%;         
                left: 0;            
                transform: none;   
                width: 450px;
                max-width: 90vw;
                background: white;
                border-radius: 0.75rem;
                display: none;
                z-index: 9999;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                margin-top: 4px;    
            }
    
            .label-manager.visible {
                display: block;
            }
    
            .label-header {
                background: #2563eb;
                padding: 1.5rem 1.8rem;  /* Increased spacing */
                border-top-left-radius: 0.75rem;
                border-top-right-radius: 0.75rem;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
    
            .label-header h2 {
                color: white;
                margin: 0;
                font-size: 1.35rem;  /* Increased from 1.125rem */
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.75rem;  /* Increased from 0.625rem */
                letter-spacing: -0.01em;
            }
    
            .label-close {
                position: absolute;
                right: 1.25rem;
                top: 50%;
                transform: translateY(-50%);
                background: transparent;
                border: none;
                color: white;
                padding: 0.75rem;  /* Increased from 0.625rem */
                cursor: pointer;
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
    
            .label-close:hover {
                background: rgba(255, 255, 255, 0.15);
            }
    
            .label-content {
                padding: 1.5rem 1.8rem;  /* Increased spacing */
                display: flex;
                flex-direction: column;
                gap: 1.5rem;  /* Increased from 1.25rem */
            }
    
            .label-search-container {
                position: relative;
            }
    
            .label-search {
                width: 100%;
                padding: 1.05rem 1.35rem;  /* Increased padding */
                border: 2px solid rgb(229, 231, 235);
                border-radius: 0.5rem;
                background: white;
                color: rgb(17, 24, 39);
                font-size: 1.125rem;  /* Increased from 0.9375rem */
                font-weight: 500;
                transition: all 0.2s ease;
            }
    
            .label-search::placeholder {
                color: rgb(156, 163, 175);
                font-weight: 400;
                font-size: 1.125rem;  /* Added to match input font size */
            }
    
            .label-search:focus {
                outline: none;
                border-color: rgb(59, 130, 246);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
    
            .label-add-button {
                position: absolute;
                right: 0.625rem;
                top: 50%;
                transform: translateY(-50%);
                background: #0077b5;
                color: white;
                border: none;
                padding: 0.6rem 1.2rem;  /* Increased from 0.5rem 1rem */
                border-radius: 0.375rem;
                font-size: 1.05rem;  /* Increased from 0.875rem */
                font-weight: 500;
                cursor: pointer;
                display: none;
                transition: background 0.2s ease;
            }
    
            .label-add-button:hover {
                background: #006699;
            }
    
            .label-search:valid + .label-add-button {
                display: block;
            }
    
            .label-list {
                max-height: 400px;
                overflow-y: auto;
                margin: 0;
                padding: 0;
                list-style: none;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;  /* Increased from 0.625rem */
            }
    
            .label-list::-webkit-scrollbar {
                width: 8px;
            }
    
            .label-list::-webkit-scrollbar-track {
                background: rgb(243, 244, 246);
                border-radius: 4px;
            }
    
            .label-list::-webkit-scrollbar-thumb {
                background: rgb(209, 213, 219);
                border-radius: 4px;
            }
    
            .label-item {
                display: flex;
                align-items: center;
                padding: 0.9rem 1.2rem;  /* Increased from 0.75rem 1rem */
                background: rgb(249, 250, 251);
                border-radius: 0.5rem;
                transition: all 0.2s ease;
                cursor: pointer;
                border: 1px solid transparent;
            }
    
            .label-item:hover {
                background: rgb(243, 244, 246);
                border-color: rgb(229, 231, 235);
            }
    
            .label-color {
                width: 2rem;
                height: 2rem;
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1.05rem;  /* Increased from 0.875rem */
                position: relative;
            }
    
            .label-color::after {
                content: '';
                position: absolute;
                width: 1rem;
                height: 1rem;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.9)' stroke-width='2'%3E%3Cpath d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z'/%3E%3Cline x1='7' y1='7' x2='7.01' y2='7'/%3E%3C/svg%3E");
                background-size: contain;
                background-repeat: no-repeat;
            }
    
            .label-name {
                flex-grow: 1;
                color: rgb(17, 24, 39);
                font-size: 1.2rem;  /* Increased from 1rem */
                font-weight: 500;
                letter-spacing: -0.01em;
            }
    
            .label-actions {
                display: flex;
                gap: 0.6rem;  /* Increased from 0.5rem */
                opacity: 0;
                transition: opacity 0.2s ease;
            }
    
            .label-item:hover .label-actions {
                opacity: 1;
            }
    
            .label-edit,
            .label-delete {
                padding: 0.6rem;  /* Increased from 0.5rem */
                background: transparent;
                border: none;
                color: rgb(107, 114, 128);
                cursor: pointer;
                border-radius: 0.375rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
    
            .label-edit:hover,
            .label-delete:hover {
                background: rgb(229, 231, 235);
                color: rgb(17, 24, 39);
            }
    
            .label-spinner {
                width: 40px;
                aspect-ratio: 1;
                margin: 2.4rem auto;  /* Increased from 2rem */
                border-radius: 50%;
                border: 3px solid rgb(229, 231, 235);
                border-top-color: #2563eb;
                animation: spinner 1s infinite linear;
            }
    
            @keyframes spinner {
                to { transform: rotate(360deg); }
            }
    
            .label-empty {
                text-align: center;
                color: rgb(107, 114, 128);
                padding: 3rem 1.2rem;  /* Increased from 2.5rem 1rem */
                font-size: 1.125rem;  /* Increased from 0.9375rem */
                font-weight: 500;
            }
    
            .label-item.selected {
                background: rgb(243, 244, 246);
                border-color: rgb(209, 213, 219);
                outline: 2px solid rgb(59, 130, 246);
                outline-offset: -2px;
            }
        `;
        document.head.appendChild(styleSheet);
    },
    createElements() {
        this.state.container = document.createElement('div');
        this.state.container.className = 'label-manager';
        
        const header = document.createElement('div');
        header.className = 'label-header';
        header.innerHTML = `
            <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                Manage Labels
            </h2>
            <button class="label-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        const content = document.createElement('div');
        content.className = 'label-content';

        const searchContainer = document.createElement('div');
        searchContainer.className = 'label-search-container';

        this.state.searchInput = document.createElement('input');
        this.state.searchInput.className = 'label-search';
        this.state.searchInput.placeholder = 'Search or create new label...';
        this.state.searchInput.required = true;

        const addButton = document.createElement('button');
        addButton.className = 'label-add-button';
        addButton.textContent = 'Add Label';
        addButton.style.display = 'none';

        this.state.labelList = document.createElement('ul');
        this.state.labelList.className = 'label-list';

        searchContainer.appendChild(this.state.searchInput);
        searchContainer.appendChild(addButton);
        content.appendChild(searchContainer);
        content.appendChild(this.state.labelList);
        
        this.state.container.appendChild(content);
        document.body.appendChild(this.state.container);

        this.setupEventListeners();
    },

    setupMessageListButtons() {
        const titleRow = document.querySelector('.msg-conversations-container__title-row');
        if (!titleRow || document.querySelector('#linkedin-quick-label-btn')) return;
    
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'relative';
        buttonContainer.style.marginLeft = '8px';
    
        const quickLabelButton = document.createElement('button');
        quickLabelButton.id = 'linkedin-quick-label-btn';
        quickLabelButton.className = 'artdeco-pill artdeco-pill--slate artdeco-pill--3 artdeco-pill--choice ember-view';
        quickLabelButton.innerHTML = '<span class="artdeco-pill__text">Labels</span>';
    
        quickLabelButton.addEventListener('click', () => {
            if (this.isVisible()) {
                this.hide();
            } else {
                this.show();
            }
        });
    
        buttonContainer.appendChild(quickLabelButton);
        buttonContainer.appendChild(this.state.container);
        titleRow.appendChild(buttonContainer);
    },

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e?.key?.toLowerCase() === 'l' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const activeElement = document.activeElement;
                const isMessageInput = activeElement?.classList.contains('msg-form__contenteditable');
                const isInputField = activeElement?.tagName?.toLowerCase() === 'input';
                const isNotesTextarea = activeElement?.classList.contains('notes-textarea');
    
                if (!isMessageInput && !isInputField && !isNotesTextarea) {
                    e.preventDefault();
                    this.show();
                }
            } else if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    
        // Keyboard navigation
        this.state.container.addEventListener('keydown', (e) => {
            const items = Array.from(this.state.labelList.querySelectorAll('.label-item:not(.empty):not(.loading)'));
            if (!items.length) return;
            if(e.metaKey || e.ctrlKey) return;
    
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (document.activeElement === this.state.searchInput) {
                        this.state.selectedIndex = 0;
                    } else {
                        this.state.selectedIndex = (this.state.selectedIndex + 1) % items.length;
                    }
                    break;
    
                case 'ArrowUp':
                    e.preventDefault();
                    if (this.state.selectedIndex <= 0) {
                        this.state.selectedIndex = -1;
                        this.state.searchInput.focus();
                    } else {
                        this.state.selectedIndex = this.state.selectedIndex - 1;
                    }
                    break;
    
                case 'Enter':
                    if (this.state.selectedIndex >= 0 && items[this.state.selectedIndex]) {
                        e.preventDefault();
                        items[this.state.selectedIndex].click();
                    }
                    break;
    
                default:
                    return;
            }
    
            // Update selection visuals
            items.forEach(item => item.classList.remove('selected'));
            if (this.state.selectedIndex >= 0 && items[this.state.selectedIndex]) {
                items[this.state.selectedIndex].classList.add('selected');
                items[this.state.selectedIndex].focus();
            }
        });
    
        // Search and create functionality
        this.state.searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.state.searchInput.value.trim();
                if (!value) return;
    
                const matchingLabel = this.state.labelList.querySelector('.label-item:not(.empty):not(.loading)');
                if (matchingLabel) {
                    const labelName = matchingLabel.querySelector('.label-name').textContent;
                    this.hide();
                    window.labelManagerUI.setLoading(true);
                    try {
                        const success = await window.labelManagerCore.handleLabelSelect(labelName);
                        if (!success) {
                            window.labelUtils.showToast('Failed to add label', 'error');
                        }
                    } catch (error) {
                        window.labelUtils.showToast('Failed to add label', 'error');
                    } finally {
                        window.labelManagerUI.setLoading(false);
                    }
                } else {
                    window.labelManagerUI.setLoading(true);
                    try {
                        const success = await window.labelManagerCore.addNewLabel(value);
                        if (success) {
                            this.state.searchInput.value = '';
                        }
                    } catch (error) {
                        window.labelUtils.showToast('Failed to create label', 'error');
                    } finally {
                        window.labelManagerUI.setLoading(false);
                    }
                }
            }
        });


        this.state.searchInput.addEventListener('input', () => {
            selectedIndex = -1;
            window.labelManagerCore.filterLabels(this.state.searchInput.value);
        });
    },

    renderLabels(labels = []) {
        this.state.labelList.innerHTML = '';
    
        if (window.labelManagerCore.state.loading) {
            const loadingItem = document.createElement('div');
            loadingItem.className = 'label-spinner';
            this.state.labelList.appendChild(loadingItem);
            return;
        }
    
        if (labels.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'label-empty';
            emptyItem.textContent = 'No labels found. Press Enter to create a new label.';
            this.state.labelList.appendChild(emptyItem);
            return;
        }
    
        labels.forEach(([name, data], index) => {
            const item = document.createElement('li');
            item.className = 'label-item';
            item.setAttribute('data-index', index);
            item.setAttribute('tabindex', '0');
            
            const color = document.createElement('div');
            color.className = 'label-color';
            color.style.backgroundColor = data.color;
    
            const nameSpan = document.createElement('span');
            nameSpan.className = 'label-name';
            nameSpan.textContent = name;
    
            const actions = document.createElement('div');
            actions.className = 'label-actions';
    
            const editButton = this.createActionButton('edit', 'Edit label');
            const deleteButton = this.createActionButton('delete', 'Delete label');
    
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);
    
            item.appendChild(color);
            item.appendChild(nameSpan);
            item.appendChild(actions);
    
            this.attachLabelEventHandlers(item, name);
    
            this.state.labelList.appendChild(item);
        });
    },

    createActionButton(type, title) {
        const button = document.createElement('button');
        button.className = `label-${type}`;
        button.title = title;
        button.innerHTML = type === 'edit' ? this.getEditIcon() : this.getDeleteIcon();
        return button;
    },

    attachLabelEventHandlers(item, name) {
        item.addEventListener('click', async (e) => {
            if (!e.target.closest('.label-delete') && !e.target.closest('.label-edit')) {
                this.hide();
                window.labelManagerUI.setLoading(true);
                try {
                    const success = await window.labelManagerCore.handleLabelSelect(name);
                    if (!success) {
                        window.labelUtils.showToast('Failed to add label', 'error');
                    }
                } catch (error) {
                    window.labelUtils.showToast('Failed to add label', 'error');
                } finally {
                    window.labelManagerUI.setLoading(false);
                }
            }
        });
    
        item.querySelector('.label-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${name}"?`)) {
                window.labelManagerUI.setLoading(true);
                try {
                    const success = await window.labelManagerCore.deleteLabel(name);
                    if (!success) {
                        window.labelUtils.showToast('Failed to delete label', 'error');
                    }
                } catch (error) {
                    window.labelUtils.showToast('Failed to delete label', 'error');
                } finally {
                    window.labelManagerUI.setLoading(false);
                }
            }
        });
    
        item.querySelector('.label-edit').addEventListener('click', async (e) => {
            e.stopPropagation();
            const newName = prompt(`Rename label "${name}" to:`, name);
            if (newName && newName !== name) {
                window.labelManagerUI.setLoading(true);
                try {
                    const success = await window.labelManagerCore.editLabel(name, newName);
                    if (success) {
                        window.labelUtils.showToast('Label editing is done!');
                    }
                } catch (error) {
                    window.labelUtils.showToast('Failed to rename label', 'error');
                } finally {
                    window.labelManagerUI.setLoading(false);
                }
            }
        });
    },

    getEditIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>`;
    },

    getDeleteIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>`;
    },

    setLoading(loading) {
        const existingSpinner = this.state.container.querySelector('.label-spinner');

        if (loading && !existingSpinner) {
            const spinnerContainer = document.createElement('div');
            spinnerContainer.className = 'label-spinner';
            this.state.container.appendChild(spinnerContainer);
            this.state.container.style.pointerEvents = 'none';
            this.state.searchInput.disabled = true;
        } else if (!loading && existingSpinner) {
            existingSpinner.remove();
            this.state.container.style.pointerEvents = 'auto';
            this.state.searchInput.disabled = false;
        }
    },

    show() {
        this.state.container.classList.add('visible');
        this.state.searchInput.value = '';
        this.state.searchInput.focus();
        window.labelManagerCore.filterLabels('');
    },

    hide() {
        this.state.container.classList.remove('visible');
    },

    isVisible() {
        return this.state.container.classList.contains('visible');
    },

    cleanup() {
        if (this.state.container) {
            this.state.container.remove();
        }
        const button = document.querySelector('#linkedin-quick-label-btn');
        if (button) {
            button.remove();
        }
    }
};

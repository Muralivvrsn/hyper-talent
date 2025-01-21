
window.labelManagerUI = {
    elements: {
        container: null,
        button: null,
        dropdown: null,
        searchInput: null,
        confirmationModal: null,
        editOverlay: null
    },

    state: {
        labels: [],
        filteredLabels: [],
        selectedIndex: -1,
        isSearchFocused: false,
        page: 1,
        itemsPerPage: 15,
        isConfirmationVisible: false,
        pendingAction: null,
        editingLabelId: null
    },

    styles: `
        .label-manager-container {
            position: relative;
            display: inline-block;
            margin-left: 8px;
            font-size: 13px;
            font-family: "Poppins", serif !important;
        }
        
        .label-manager-button {
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

        .label-manager-button:hover {
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
        
        .label-manager-dropdown {
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
            min-width: 250px;
            font-size: 13px;
            font-family: "Poppins", serif !important;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        
        .label-manager-dropdown.show {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }

        .label-search-container {
            padding: 0 12px 8px !important;
            border-bottom: 1px solid #e0e0e0 !important;
            margin-bottom: 6px;
        }

        .label-search-input {
            width: 100% !important;
            padding: 6px 8px !important;
            border: 1px solid #e0e0e0 !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            font-family: "Poppins", serif !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            transition: none !important;
        }

        .label-list-container {
            max-height: 400px;
            overflow-y: auto;
            scrollbar-width: thin;
        }
        
        .label-item {
            padding: 6px 12px;
            cursor: pointer;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #444;
            transition: background-color 0.15s ease;
            position: relative;
            min-height: 20px;
        }
        
        .label-item.selected {
            background: #f5f5f5;
        }

        .label-item:hover {
            background: #f5f5f5;
        }

        .label-name {
            flex-grow: 1;
            font-size: 13px;
            font-family: "Poppins", serif !important;
            display: flex;
            align-items: center;
            gap: 6px;
            text-transform: uppercase;
        }

        .label-edit-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: none;
            align-items: center;
            padding: 0 12px;
            z-index: 2;
            animation: fadeIn 0.2s ease;
        }

        .label-edit-overlay.show {
            display: flex;
        }

        .label-edit-input {
            flex: 1 !important;
            padding: 4px 8px !important;
            border: 1px solid #0a66c2 !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            font-family: "Poppins", serif !important;
            margin-right: 8px !important;
            text-transform: uppercase !important;
            box-shadow: none !important;
            transition: none !important;
            color: black !important;
            background: #ffffff !important;
        }

        .label-edit-actions {
            display: flex;
            gap: 4px;
        }

        .label-edit-btn {
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-family: "Poppins", serif !important;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.15s ease;
        }

        .label-edit-btn.save {
            background: #0a66c2;
            color: white;
        }

        .label-edit-btn.save:hover {
            background: #0952a5;
        }

        .label-edit-btn.cancel {
            background: #f0f0f0;
            color: #666;
        }

        .label-edit-btn.cancel:hover {
            background: #e0e0e0;
        }

        .label-actions {
            display: none;
            gap: 4px;
            margin-left: auto;
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        .label-item:hover .label-actions {
            display: flex;
            opacity: 1;
        }

        .label-action-btn {
            padding: 2px 6px;
            border: none;
            background: none;
            font-size: 11px;
            font-family: "Poppins", serif !important;
            color: #666;
            cursor: pointer;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
        }

        .label-action-btn:hover {
            background: #e0e0e0;
            color: #333;
        }

        .label-action-btn.edit {
            color: #0a66c2;
        }

        .label-action-btn.delete {
            color: #cc0000;
        }

        .label-profiles-count {
            font-size: 11px;
            font-family: "Poppins", serif !important;
            color: #666;
            padding: 2px 6px;
            background: #f0f0f0;
            border-radius: 10px;
            transition: background-color 0.15s ease;
        }

        .label-color-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            transition: transform 0.15s ease;
        }

        .warning-toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100%);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 14px;
            font-family: "Poppins", serif !important;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s ease;
        }

        .warning-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        .confirmation-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.2s ease, visibility 0.2s ease;
        }

        .confirmation-modal.show {
            opacity: 1;
            visibility: visible;
        }

        .confirmation-content {
            background: white;
            padding: 24px;
            border-radius: 8px;
            width: 400px;
            max-width: 90%;
            transform: translateY(-20px);
            transition: transform 0.2s ease;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .confirmation-modal.show .confirmation-content {
            transform: translateY(0);
        }

        .confirmation-title {
            font-size: 18px;
            font-family: "Poppins", serif !important;
            font-weight: 600;
            color: #111;
            margin-bottom: 12px;
        }

        .confirmation-message {
            font-size: 14px;
            font-family: "Poppins", serif !important;
            color: #555;
            margin-bottom: 20px;
            line-height: 1.5;
        }

        .confirmation-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }

        .confirmation-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-family: "Poppins", serif !important;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
        }

        .confirmation-btn.cancel {
            background: #f0f0f0;
            color: #666;
        }

        .confirmation-btn.cancel:hover {
            background: #e0e0e0;
        }

        .confirmation-btn.confirm {
            background: #0a66c2;
            color: white;
        }

        .confirmation-btn.confirm:hover {
            background: #004182;
        }

        .confirmation-btn.confirm.delete {
            background: #cc0000;
        }

        .confirmation-btn.confirm.delete:hover {
            background: #990000;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `,

    showWarningToast(message, duration = 3000) {
        const existingToast = document.querySelector('.warning-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = window.labelFilterUtils.createElement('div', 'warning-toast');
        toast.textContent = message;
        document.body.appendChild(toast);

        // Force reflow
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    setupLabelButton() {
        // console.log('[LabelManagerUI] Setting up label button');
        if (document.querySelector('.label-manager-container')) {
            // console.log('[LabelManagerUI] Button already exists');
            return false;
        }

        this.injectStyles();
        this.createConfirmationModal();
        const targetContainer = window.labelFilterUtils.findTargetContainer()?.querySelector('div');
        if (!targetContainer) {
            // console.log('[LabelManagerUI] Target container not found');
            return false;
        }

        this.createElements(targetContainer);
        this.attachEventListeners();
        // console.log('[LabelManagerUI] Button setup complete');
        return true;
    },

    createConfirmationModal() {
        this.elements.confirmationModal = window.labelFilterUtils.createElement('div', 'confirmation-modal');
        this.elements.confirmationModal.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-title"></div>
                <div class="confirmation-message"></div>
                <div class="confirmation-actions">
                    <button class="confirmation-btn cancel">Cancel</button>
                    <button class="confirmation-btn confirm">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.elements.confirmationModal);
    },

    async showConfirmation(type, label, onConfirm) {
        const modal = this.elements.confirmationModal;
        const isDelete = type === 'delete';
        
        modal.querySelector('.confirmation-title').textContent = isDelete ? 'Delete Label' : 'Edit Label';
        modal.querySelector('.confirmation-message').textContent = isDelete ? 
            `Are you sure you want to delete the label "${label.label_name}"?` : 
            `Are you sure you want to edit the label "${label.label_name}"?`;
        
        const confirmBtn = modal.querySelector('.confirmation-btn.confirm');
        confirmBtn.textContent = isDelete ? 'Delete' : 'Edit';
        confirmBtn.classList.toggle('delete', isDelete);

        const handleConfirm = async () => {
            this.hideConfirmation();
            await onConfirm();
        };

        confirmBtn.onclick = handleConfirm;
        modal.querySelector('.confirmation-btn.cancel').onclick = () => this.hideConfirmation();
        
        modal.classList.add('show');
        modal.querySelector('.confirmation-btn.cancel').focus();
    },

    hideConfirmation() {
        this.elements.confirmationModal.classList.remove('show');
        this.state.pendingAction = null;
    },

    injectStyles() {
        if (document.querySelector('style[data-label-manager-styles]')) {
            return;
        }
        const style = window.labelFilterUtils.createElement('style');
        style.setAttribute('data-label-manager-styles', 'true');
        style.textContent = this.styles;
        document.head.appendChild(style);
    },

    createElements(parentElement) {
        this.elements.container = window.labelFilterUtils.createElement('div', 'label-manager-container');
        this.elements.button = window.labelFilterUtils.createElement('button', 'label-manager-button');
        this.elements.button.innerHTML = `Labels <span class="label-count">0</span>`;
        
        this.elements.dropdown = window.labelFilterUtils.createElement('div', 'label-manager-dropdown');
        
        const searchContainer = window.labelFilterUtils.createElement('div', 'label-search-container');
        this.elements.searchInput = window.labelFilterUtils.createElement('input', 'label-search-input');
        this.elements.searchInput.setAttribute('type', 'text');
        this.elements.searchInput.setAttribute('placeholder', 'Search labels...');
        searchContainer.appendChild(this.elements.searchInput);
        
        const listContainer = window.labelFilterUtils.createElement('div', 'label-list-container');
        
        this.elements.dropdown.appendChild(searchContainer);
        this.elements.dropdown.appendChild(listContainer);
        
        this.elements.container.appendChild(this.elements.button);
        this.elements.container.appendChild(this.elements.dropdown);
        
        parentElement.appendChild(this.elements.container);
    },

    attachEventListeners() {
        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' && !e.altKey && !e.ctrlKey && !e.metaKey && 
                !this.state.editingLabelId && 
                !document.activeElement.matches('input, textarea') && document.activeElement.getAttribute('contenteditable') !== 'true' &&
                !document.activeElement.classList.contains('msg-form__contenteditable')) {
                e.preventDefault();
                this.toggleDropdown();
            }
        });

        // Button click
        this.elements.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Search input events
        this.elements.searchInput.addEventListener('input', () => {
            this.filterLabels();
            this.state.selectedIndex = -1;
            this.state.page = 1;
            this.renderLabels();
        });

        this.elements.searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = this.elements.searchInput.value.trim();
                // console.log(this.state.filteredLabels.length)
                if (this.state.filteredLabels.length === 0 && searchTerm) {
                    // Create new label if no matches found
                    // console.log(searchTerm)
                    await this.handleAddLabel(searchTerm);
                } else if (this.state.selectedIndex >= 0) {
                    // Select existing label
                    this.handleLabelClick(this.state.filteredLabels[this.state.selectedIndex]);
                } else if (this.state.filteredLabels.length > 0) {
                    // Select first item if none selected
                    this.state.selectedIndex = 0;
                    this.handleLabelClick(this.state.filteredLabels[0]);
                }
            }
        });

        // Keyboard navigation
        this.elements.dropdown.addEventListener('keydown', (e) => {
            if (!this.elements.dropdown.classList.contains('show') || this.state.editingLabelId) return;
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateList('down');
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateList('up');
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.handleEnterKey();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.hideDropdown();
                    break;
                case 'e':
                    if (this.state.selectedIndex >= 0) {
                        e.preventDefault();
                        const label = this.state.filteredLabels[this.state.selectedIndex];
                        this.handleEdit(label.label_id);
                    }
                    break;
                case 'd':
                case 'Delete':
                    if (this.state.selectedIndex >= 0) {
                        e.preventDefault();
                        const label = this.state.filteredLabels[this.state.selectedIndex];
                        this.handleDelete(label.label_id);
                    }
                    break;
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.elements.container.contains(e.target) && 
                !this.elements.confirmationModal.contains(e.target)) {
                this.hideDropdown();
            }
        });

        // Infinite scroll
        const listContainer = this.elements.dropdown.querySelector('.label-list-container');
        listContainer.addEventListener('scroll', () => {
            if (listContainer.scrollHeight - listContainer.scrollTop === listContainer.clientHeight) {
                this.loadMoreItems();
            }
        });
    },

    async handleEdit(labelId) {
        const label = this.state.filteredLabels.find(l => l.label_id === labelId);
        if (!label) return;
    
        const item = this.elements.dropdown.querySelector(`[data-label-id="${labelId}"]`);
        if (!item) return;
    
        if (this.state.editingLabelId) {
            // Cancel any existing edit
            const currentEditOverlay = this.elements.dropdown.querySelector('.label-edit-overlay.show');
            if (currentEditOverlay) {
                currentEditOverlay.classList.remove('show');
            }
        }
    
        this.state.editingLabelId = labelId;
    
        // Create or get edit overlay
        let overlay = item.querySelector('.label-edit-overlay');
        if (!overlay) {
            overlay = window.labelFilterUtils.createElement('div', 'label-edit-overlay');
            item.appendChild(overlay);
        }
    
        overlay.innerHTML = `
            <input type="text" class="label-edit-input" value="${label.label_name}" />
            <div class="label-edit-actions">
                <button class="label-edit-btn save">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
                <button class="label-edit-btn cancel">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
                         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;
    
        const input = overlay.querySelector('.label-edit-input');
        const saveBtn = overlay.querySelector('.label-edit-btn.save');
        const cancelBtn = overlay.querySelector('.label-edit-btn.cancel');
    
        const handleSave = async () => {
            const newName = input.value.trim().toUpperCase();
            if (newName === '') {
                window.show_error('Label name cannot be empty', 3000);
                return;
            }
            if (newName.includes(',')) {
                window.show_error('Label name cannot contain commas', 3000);
                return;
            }
    
            // Check for duplicate names (excluding current label)
            const existingLabel = this.state.labels.find(
                l => l.label_name.toUpperCase() === newName && l.label_id !== labelId
            );
    
            if (existingLabel) {
                window.show_warning('Label with this name already exists', 3000);
                return;
            }
    
            const success = await window.labelsDatabase.editLabel(labelId, {
                label_name: newName,
                label_color: label.label_color
            });
    
            if (success) {
                window.show_success('Label updated successfully', 3000);
                this.state.editingLabelId = null;
                overlay.classList.remove('show');
                // No need to refresh - listener will handle update
            } else {
                window.show_error('Failed to update label', 3000);
            }
        };
    
        const handleCancel = () => {
            this.state.editingLabelId = null;
            overlay.classList.remove('show');
            item.focus();
        };
    
        saveBtn.onclick = handleSave;
        cancelBtn.onclick = handleCancel;
    
        input.onkeydown = async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                await handleSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };
    
        overlay.classList.add('show');
        input.focus();
        input.select();
    },
    
    async handleDelete(labelId) {
        const label = this.state.filteredLabels.find(l => l.label_id === labelId);
        if (!label) return;
    
        this.showConfirmation('delete', label, async () => {
            const success = await window.labelsDatabase.deleteLabel(labelId);
            if (success) {
                window.show_success('Label deleted successfully', 3000);
                // No need to refresh - listener will handle update
            } else {
                window.show_error('Failed to delete label', 3000);
            }
        });
    },

    getRandomColor (){
        // 20 distinct, visually appealing colors
        const colors = [
            '#FF3B30', // Red
            '#FF9500', // Orange
            '#FFCC00', // Yellow
            '#34C759', // Green
            '#00C7BE', // Teal
            '#32ADE6', // Light Blue
            '#007AFF', // Blue
            '#5856D6', // Purple
            '#AF52DE', // Magenta
            '#FF2D55', // Pink
            '#5AC8FA', // Sky Blue
            '#4CD964', // Lime Green
            '#FF6B6B', // Coral
            '#A0522D', // Sienna
            '#6A5ACD', // Slate Blue
            '#2E8B57', // Sea Green
            '#BA55D3', // Medium Orchid
            '#CD853F', // Peru
            '#48D1CC', // Medium Turquoise
            '#FF1493'  // Deep Pink
        ];
        
        // Return a random color from the array
        return colors[Math.floor(Math.random() * colors.length)];
    },


    async handleAddLabel(labelName) {
        labelName = labelName.trim().toUpperCase();
        // console.log('Adding label:', labelName);
        
        if (labelName === '') {
            window.show_error('Label name cannot be empty', 3000);
            return;
        }
        
        if (labelName.includes(',')) {
            window.show_error('Label name cannot contain commas', 3000);
            return;
        }
    
        const existingLabel = this.state.labels.find(
            label => label.label_name.toUpperCase() === labelName
        );
    
        if (existingLabel) {
            window.show_warning('Label with this name already exists', 3000);
            return;
        }
    
        const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const labelColor = this.getRandomColor();
        
        const newLabel = {
            label_id: labelId,
            label_name: labelName,
            label_color: labelColor,
            profiles: []
        };
    
        const success = await window.labelsDatabase.addLabel(newLabel);
        this.handleLabelClick(newLabel)
        if (success) {
            window.show_success('Label added successfully', 3000);
            this.elements.searchInput.value = '';
            this.filterLabels();
            this.renderLabels();
        } else {
            window.show_error('Failed to add label', 3000);
        }
    },
        
  

    navigateList(direction) {
        const maxIndex = this.state.filteredLabels.length - 1;
        
        if (direction === 'down') {
            this.state.selectedIndex = Math.min(this.state.selectedIndex + 1, maxIndex);
        } else {
            this.state.selectedIndex = Math.max(this.state.selectedIndex - 1, -1);
        }

        this.ensureSelectedItemVisible();
        this.renderLabels();

        if (this.state.selectedIndex >= 0) {
            const listContainer = this.elements.dropdown.querySelector('.label-list-container');
            const selectedItem = listContainer.children[this.state.selectedIndex];
            if (selectedItem) {
                selectedItem.focus();
            }
        }
    },

    ensureSelectedItemVisible() {
        if (this.state.selectedIndex === -1) return;
        
        const listContainer = this.elements.dropdown.querySelector('.label-list-container');
        const selectedItem = listContainer.children[this.state.selectedIndex];
        
        if (selectedItem) {
            const containerRect = listContainer.getBoundingClientRect();
            const itemRect = selectedItem.getBoundingClientRect();
            
            if (itemRect.bottom > containerRect.bottom) {
                listContainer.scrollTop += itemRect.bottom - containerRect.bottom;
            } else if (itemRect.top < containerRect.top) {
                listContainer.scrollTop += itemRect.top - containerRect.top;
            }
        }
    },

    handleEnterKey() {
        if (this.state.selectedIndex >= 0) {
            const label = this.state.filteredLabels[this.state.selectedIndex];
            this.handleLabelClick(label);
        }
    },

    handleLabelClick(label) {
        const profile_info = window.labelManagerUtils.getProfileInfo();

        if (window.labelManagerCore.applyLabel) {
            window.labelManagerCore.applyLabel(label.label_id, profile_info);
        }
        window.show_success(`${label.label_name} Added to ${profile_info.name} successfully`, 3000);
        this.hideDropdown();
    },

    filterLabels() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        this.state.filteredLabels = this.state.labels.filter(label => 
            label.label_name.toLowerCase().includes(searchTerm)
        );
    },

    loadMoreItems() {
        if (this.state.page * this.state.itemsPerPage < this.state.filteredLabels.length) {
            this.state.page++;
            this.renderLabels();
        }
    },

    toggleDropdown() {
        const isVisible = this.elements.dropdown.classList.contains('show');
        if (isVisible) {
            this.hideDropdown();
        } else {
            this.showDropdown();
        }
    },

    showDropdown() {
        this.elements.dropdown.classList.add('show');
        this.elements.searchInput.focus();
        this.state.selectedIndex = -1;
        this.state.page = 1;
        this.filterLabels();
        this.renderLabels();
    },

    hideDropdown() {
        if (this.state.editingLabelId) {
            const editOverlay = this.elements.dropdown.querySelector('.label-edit-overlay.show');
            if (editOverlay) {
                editOverlay.classList.remove('show');
            }
            this.state.editingLabelId = null;
        }

        this.elements.dropdown.classList.remove('show');
        this.elements.searchInput.value = '';
        this.state.selectedIndex = -1;
    },

    async refreshLabels() {
        const labels = await window.labelManagerCore.getLabels();
        this.updateLabelsDropdown(labels);
    },

    updateLabelsDropdown(labelsData) {
        this.state.labels = labelsData;
        this.filterLabels();
        this.renderLabels();
        
        const count = this.elements.button.querySelector('.label-count');
        count.textContent = labelsData.length;
    },

    renderLabels() {
        const listContainer = this.elements.dropdown.querySelector('.label-list-container');
        listContainer.innerHTML = '';

        if (this.state.filteredLabels.length === 0) {
            const noResults = window.labelFilterUtils.createElement('div', 'no-results');
            noResults.textContent = this.elements.searchInput.value.trim() ? 
                'Press Enter to create a new label' : 'No labels found';
            listContainer.appendChild(noResults);
            return;
        }

        const visibleLabels = this.state.filteredLabels.slice(
            0,
            this.state.page * this.state.itemsPerPage
        );

        visibleLabels.forEach((label, index) => {
            const item = window.labelFilterUtils.createElement('div', 'label-item');
            item.setAttribute('data-label-id', label.label_id);
            item.setAttribute('tabindex', '0');
            
            if (index === this.state.selectedIndex) {
                item.classList.add('selected');
            }
            
            const labelName = window.labelFilterUtils.createElement('div', 'label-name');
            const colorDot = window.labelFilterUtils.createElement('span', 'label-color-dot');
            colorDot.style.backgroundColor = label.label_color;
            
            const nameText = window.labelFilterUtils.createElement('span');
            nameText.textContent = label.label_name;

            labelName.appendChild(colorDot);
            labelName.appendChild(nameText);

            const profilesCount = window.labelFilterUtils.createElement('div', 'label-profiles-count');
            profilesCount.textContent = `${label.profiles?.length || 0}`;

            const actions = window.labelFilterUtils.createElement('div', 'label-actions');
            
            const editBtn = window.labelFilterUtils.createElement('button', 'label-action-btn edit');
            editBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
            `;
            editBtn.setAttribute('aria-label', 'Edit Label (Press E)');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleEdit(label.label_id);
            });
            
            const deleteBtn = window.labelFilterUtils.createElement('button', 'label-action-btn delete');
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" 
                     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            `;
            deleteBtn.setAttribute('aria-label', 'Delete Label (Press D or Delete)');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDelete(label.label_id);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            item.appendChild(labelName);
            item.appendChild(actions);
            item.appendChild(profilesCount);

            // Add click event to select item
            item.addEventListener('click', () => {
                if (!this.state.editingLabelId) {
                    this.state.selectedIndex = index;
                    this.renderLabels();
                    this.handleLabelClick(label);
                }
            });

            // Add keyboard event for individual items
            item.addEventListener('keydown', (e) => {
                if (this.state.editingLabelId) return;
                
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.handleLabelClick(label);
                        break;
                    case 'e':
                        e.preventDefault();
                        this.handleEdit(label.label_id);
                        break;
                    case 'd':
                    case 'Delete':
                        e.preventDefault();
                        this.handleDelete(label.label_id);
                        break;
                }
            });

            listContainer.appendChild(item);
        });
    },

    cleanup() {
        // console.log('[LabelManagerUI] Starting cleanup');
        if (this.elements.container) {
            this.elements.container.remove();
        }
        if (this.elements.confirmationModal) {
            this.elements.confirmationModal.remove();
        }
        const existingToast = document.querySelector('.warning-toast');
        if (existingToast) {
            existingToast.remove();
        }
        this.elements = {
            container: null,
            button: null,
            dropdown: null,
            searchInput: null,
            confirmationModal: null,
            editOverlay: null
        };
        this.state = {
            labels: [],
            filteredLabels: [],
            selectedIndex: -1,
            isSearchFocused: false,
            page: 1,
            itemsPerPage: 15,
            isConfirmationVisible: false,
            pendingAction: null,
            editingLabelId: null
        };
        // console.log('[LabelManagerUI] Cleanup complete');
    }
};

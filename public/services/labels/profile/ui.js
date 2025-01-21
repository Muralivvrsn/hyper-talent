
window.labelProfileManagerUI = {
    elements: {
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

        
        
        .label-profile-count {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 11px;
            color: #666;
            min-width: 14px;
            text-align: center;
        }
        
.label-profile-manager-dropdown {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 320px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    z-index: 10000;
    display: none;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(0, 0, 0, 0.1);
    opacity: 0;
    transform: translateY(-10px);
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.label-profile-manager-dropdown.show {
    display: block;
    opacity: 1;
    transform: translateY(0);
}


        .label-search-container-profile {
            padding: 8px 12px 8px !important;
            border-bottom: 1px solid #e0e0e0 !important;
            margin-bottom: 6px;
        }

        .label-search-profile-input {
            width: 100% !important;
            padding: 6px 8px !important;
            border: 1px solid #e0e0e0 !important;
            border-radius: 4px !important;
            font-size: 13px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            transition: none !important;
        }

        .label-profile-list-container {
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
            font-weight: 600;
            color: #111;
            margin-bottom: 12px;
        }

        .confirmation-message {
            font-size: 14px;
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

        const toast = this.createElement('div', 'warning-toast');
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

    createConfirmationModal() {
        if (document.querySelector('.confirmation-modal')) {
            return; // Exit the method if modal is already present
        }
        this.elements.confirmationModal = this.createElement('div', 'confirmation-modal');
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
        if (document.querySelector('style[data-label-profile-manager-styles]')) {
            return;
        }
        const style = this.createElement('style');
        style.setAttribute('data-label-profile-manager-styles', 'true');
        style.textContent = this.styles;
        document.head.appendChild(style);
    },

    createElements() {
        console.log('creating elements')
        this.elements.dropdown = this.createElement('div', 'label-profile-manager-dropdown');

        const searchContainer = this.createElement('div', 'label-search-container-profile');
        this.elements.searchInput = this.createElement('input', 'label-search-profile-input');
        this.elements.searchInput.setAttribute('type', 'text');
        this.elements.searchInput.setAttribute('placeholder', 'Search labels...');
        searchContainer.appendChild(this.elements.searchInput);

        const listContainer = this.createElement('div', 'label-profile-list-container');

        this.elements.dropdown.appendChild(searchContainer);
        this.elements.dropdown.appendChild(listContainer);

        document.body.appendChild(this.elements.dropdown);
    },

    attachEventListeners() {
        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' && !e.altKey && !e.ctrlKey && !e.metaKey &&
                !this.state.editingLabelId &&
                !document.activeElement.matches('input, textarea') && window.location.href.includes('linkedin.com/in/')) {
                    console.log('clicked l');
                e.preventDefault();
                this.toggleDropdown();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.elements.dropdown.contains(e.target) &&
                !this.elements.confirmationModal.contains(e.target)) {
                this.hideDropdown();
            }
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
            if (!this.elements?.container?.contains(e?.target) &&
                !this.elements?.confirmationModal?.contains(e?.target)) {
                this.hideDropdown();
            }
        });

        // Infinite scroll
        const listContainer = this.elements.dropdown.querySelector('.label-profile-list-container');
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
            overlay = this.createElement('div', 'label-edit-overlay');
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

    getRandomColor() {
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
            // window.show_success('Label added successfully', 3000);
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
            const listContainer = this.elements.dropdown.querySelector('.label-profile-list-container');
            const selectedItem = listContainer.children[this.state.selectedIndex];
            if (selectedItem) {
                selectedItem.focus();
            }
        }
    },

    ensureSelectedItemVisible() {
        if (this.state.selectedIndex === -1) return;

        const listContainer = this.elements.dropdown.querySelector('.label-profile-list-container');
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

    extractUsername(url) {
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        return match ? match[1] : '';
    },

    extractConnectionCode(url) {
        const match = url.match(/connectionOf=%5B%22(.*?)%22%5D/);
        if (match) return match[1];
        
        const directMatch = url.match(/connectionOf=\["([^"]+)"\]/);
        return directMatch ? directMatch[1] : null;
    },

    extractConnectionCodeFromMutual(url) {
        const match = url.match(/facetConnectionOf=%22(.*?)%22/);
        if (match) return match[1];
        
        const directMatch = url.match(/facetConnectionOf="([^"]+)"/);
        return directMatch ? directMatch[1] : null;
    },

    getProfileInfo() {
        try {
            const connectionLink = document.querySelector('a[href*="/search/results/people"]');
            const mutualConnectionLink = document.querySelector('section[data-member-id] > .ph5 > a');
            const url = connectionLink?.href || mutualConnectionLink?.href || window.location.href;

            const nameElement = document.querySelector('a[aria-label] h1');
            const name = nameElement ? nameElement.textContent.trim() : '';

            const username = this.extractUsername(url);
            let connectionCode = this.extractConnectionCode(url);

            if (!connectionCode) {
                connectionCode = this.extractConnectionCodeFromMutual(url);
            }

            if (!connectionCode) {
                connectionCode = username;
            }

            const imgElement = document.querySelector('img.pv-top-card-profile-picture__image--show');
            const image_url = imgElement ? imgElement.getAttribute('src') : '';

            const profileId = connectionCode
            console.log({
                url,
                profileId,
                connectionCode,
                name,
                username,
                image_url,
                addedAt: new Date().toISOString()
            })
            return {
                url,
                profileId,
                connectionCode,
                name,
                username,
                image_url,
                addedAt: new Date().toISOString()
            };
        } catch (error) {
            window.show_error('Error getting profile info');
            console.log(error)
            return null;
        }
    },
    async handleLabelClick(label) {
        const profile_info = this.getProfileInfo();
        console.log(profile_info)

        // if (window.labelProfileManagerCore.applyLabel) {
            const success = await window.labelProfileManagerCore.applyLabel(label.label_id, profile_info);
            if(success){
                window.show_success(`${label.label_name} Added to ${profile_info.name} successfully`, 3000);
            }
        // }
        
        // this.hideDropdown();
    },

    filterLabels() {
        try {
            const searchTerm = this.elements.searchInput.value.toLowerCase();
            this.state.filteredLabels = this.state.labels.filter(label =>
                label.label_name.toLowerCase().includes(searchTerm)
            );
        }
        catch (e) {
            console.log(e)
        }
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
        const labels = await window.labelProfileManagerCore.getLabels();
        this.updateLabelsDropdown(labels);
    },

    updateLabelsDropdown(labelsData) {
       try{
        this.state.labels = labelsData;
        this.filterLabels();
        this.renderLabels();

        const count = this.elements.button.querySelector('.label-profile-count');
        count.textContent = labelsData.length;
       }
       catch(e){
        console.log(e)
       }
    },

    initialize(){
        this.injectStyles();
        this.createElements()
        this.createConfirmationModal();
        this.attachEventListeners();
    },

    renderLabels() {
        try{
        const listContainer = this.elements.dropdown.querySelector('.label-profile-list-container');
        listContainer.innerHTML = '';

        if (this.state.filteredLabels.length === 0) {
            const noResults = this.createElement('div', 'no-results');
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
            const item = this.createElement('div', 'label-item');
            item.setAttribute('data-label-id', label.label_id);
            item.setAttribute('tabindex', '0');

            if (index === this.state.selectedIndex) {
                item.classList.add('selected');
            }

            const labelName = this.createElement('div', 'label-name');
            const colorDot = this.createElement('span', 'label-color-dot');
            colorDot.style.backgroundColor = label.label_color;

            const nameText = this.createElement('span');
            nameText.textContent = label.label_name;

            labelName.appendChild(colorDot);
            labelName.appendChild(nameText);

            const profilesCount = this.createElement('div', 'label-profiles-count');
            profilesCount.textContent = `${label.profiles?.length || 0}`;

            const actions = this.createElement('div', 'label-actions');

            const editBtn = this.createElement('button', 'label-action-btn edit');
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

            const deleteBtn = this.createElement('button', 'label-action-btn delete');
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
        }
        catch(e){
            console.log(e)
        }
    },
    createElement(tag, className='', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    },

    cleanup() {
        if (this.elements.dropdown) {
            this.elements.dropdown.remove();
        }
        if (this.elements.confirmationModal) {
            this.elements.confirmationModal.remove();
        }
        const existingToast = document.querySelector('.warning-toast');
        if (existingToast) {
            existingToast.remove();
        }
        this.elements = {
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
    }
};



// Create a URL observer to initialize the UI only on profile pages
const observeUrlChanges = () => {
    let lastUrl = '';
    
    const observer = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            
            // Cleanup existing instance if it exists
            if (window.labelProfileManagerUI) {
                window.labelProfileManagerUI.cleanup();
            }
            
            // Only initialize on profile pages
            if (currentUrl.includes('linkedin.com/in/')) {
                window.labelProfileManagerUI.initialize();
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    if (window.location.href.includes('linkedin.com/in/')) {
        window.labelProfileManagerUI.initialize();
    }
};
observeUrlChanges();


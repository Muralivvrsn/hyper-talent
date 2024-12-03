// labels.service.js

// Utility Functions
const generateRandomColor = () => {
    const colors = [
        // Blues
        '#0A66C2', '#0084BD', '#2557A7', '#366DA0', '#4A90E2', '#85C1E9',

        // Greens
        '#057642', '#4C8C40', '#4CAF50', '#6FAF79', '#2E8B57', '#A9DFBF',

        // Reds
        '#B24020', '#DD5143', '#C74634', '#A13F3F', '#E74C3C', '#F1948A',

        // Purples
        '#7A3E98', '#6E4B9E', '#A569BD', '#8E44AD', '#D2B4DE', '#BB8FCE',

        // Browns & Earthy
        '#8C6A4E', '#9E6B52', '#7D6544', '#A85C32', '#8E562E', '#D7BDE2',

        // Yellows & Oranges
        '#E7A33E', '#E59866', '#F4D03F', '#F7DC6F', '#D68910', '#EDBB99',

        // Teals
        '#0E8A7D', '#458B74', '#17A589', '#1ABC9C', '#76D7C4', '#AED6F1',

        // Grays & Neutrals
        '#5E6D77', '#6B8068', '#839192', '#99A3A4', '#ABB2B9', '#BDC3C7',

        // Vintage-inspired
        '#A0522D', '#B8860B', '#CD853F', '#DAA520', '#C39BD3', '#B0C4DE',

        // Soft pastels
        '#FAD7A0', '#F9E79F', '#D5F5E3', '#A9CCE3', '#E8DAEF', '#FDEDEC'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};


const showToast = (message, type = 'info') => {
    const existingToast = document.querySelector('.label-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'label-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: ${type === 'error' ? '#FEE2E2' : '#EFF6FF'};
      color: ${type === 'error' ? '#991B1B' : '#1E40AF'};
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1001;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.style.opacity = '1');
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Core Label Management Class
class LabelManager {
    constructor() {
        this.setupStyles();
        this.createElements();
        this.setupEventListeners();
        this.loading = false;
        this.labels = [];

        // Initial load of labels
        this.initialLoadLabels();
        // Set up realtime listener
        this.setupRealtimeListener();
    }

    async initialLoadLabels() {
        this.setLoading(true);
        try {
            const { db, currentUser } = await window.firebaseService.initializeFirebase();
            if (!db || !currentUser) {
                showToast('Authentication error', 'error');
                return;
            }

            const userLabelsRef = db.collection('labels').doc(currentUser.uid);
            const userLabelsDoc = await userLabelsRef.get();
            const labels = userLabelsDoc.exists ? userLabelsDoc.data().labels || {} : {};

            this.labels = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
            this.setLoading(false);
            this.renderLabels(this.labels);
        } catch (error) {
            // console.error('Error loading initial labels:', error);
        } finally {
            this.setLoading(false);
        }
    }

    setupRealtimeListener() {
        window.firebaseService.initializeFirebase().then(({ db, currentUser }) => {
            if (!db || !currentUser) return;
            const userLabelsRef = db.collection('labels').doc(currentUser.uid);
            userLabelsRef.onSnapshot((doc) => {
                // console.log('got some changes')
                const labels = doc.exists ? doc.data().labels || {} : {};
                this.labels = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
                // console.log(labels)
                if (this.isVisible()) {
                    this.filterLabels();
                }
            });
        });
    }

    // Modified loadLabels to use cached data
    filterLabels(searchTerm = '') {
        const filteredLabels = this.labels
            .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()));
        this.setLoading(false);
        this.renderLabels(filteredLabels);
        return true;
    }

    setupStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .label-manager {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 450px;
                max-width: 90vw;
                background: white;
                border-radius: 0.75rem;
                display: none;
                z-index: 9999;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
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
    }

    createElements() {
        this.container = document.createElement('div');
        this.container.className = 'label-manager';
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

        this.searchInput = document.createElement('input');
        this.searchInput.className = 'label-search';
        this.searchInput.placeholder = 'Search or create new label...';
        this.searchInput.required = true;

        const addButton = document.createElement('button');
        addButton.className = 'label-add-button';
        addButton.textContent = 'Add Label';
        addButton.style.display = 'none';

        this.labelList = document.createElement('ul');
        this.labelList.className = 'label-list';

        searchContainer.appendChild(this.searchInput);
        searchContainer.appendChild(addButton);
        content.appendChild(searchContainer);
        content.appendChild(this.labelList);
        
        this.container.appendChild(header);
        this.container.appendChild(content);
        document.body.appendChild(this.container);
    }

    setLoading(loading) {
        this.loading = loading;
        const existingSpinner = this.container.querySelector('.label-spinner');

        if (loading && !existingSpinner) {
            const spinnerContainer = document.createElement('div');
            spinnerContainer.className = 'label-spinner';
            this.container.appendChild(spinnerContainer);
            this.container.style.pointerEvents = 'none';
            this.searchInput.disabled = true;
        } else if (!loading && existingSpinner) {
            existingSpinner.remove();
            this.container.style.pointerEvents = 'auto';
            this.searchInput.disabled = false;
        }
    }

    setupEventListeners() {
        let selectedIndex = -1;
    
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
        this.container.addEventListener('keydown', (e) => {
            const items = Array.from(this.labelList.querySelectorAll('.label-item:not(.empty):not(.loading)'));
            if (!items.length) return;
    
            const currentIndex = selectedIndex;
    
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (document.activeElement === this.searchInput) {
                        selectedIndex = 0;
                    } else {
                        selectedIndex = (selectedIndex + 1) % items.length;
                    }
                    break;
    
                case 'ArrowUp':
                    e.preventDefault();
                    if (selectedIndex <= 0) {
                        selectedIndex = -1;
                        this.searchInput.focus();
                    } else {
                        selectedIndex = selectedIndex - 1;
                    }
                    break;
    
                case 'Enter':
                    if (selectedIndex >= 0 && items[selectedIndex]) {
                        e.preventDefault();
                        items[selectedIndex].click();
                    }
                    break;
    
                default:
                    return;
            }
    
            // Update selection visuals
            items.forEach(item => item.classList.remove('selected'));
            if (selectedIndex >= 0 && items[selectedIndex]) {
                items[selectedIndex].classList.add('selected');
                items[selectedIndex].focus();
            }
        });
    
        // Search and create functionality
        this.searchInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.searchInput.value.trim();
                if (!value) return;
    
                const matchingLabel = this.labelList.querySelector('.label-item:not(.empty):not(.loading)');
                if (matchingLabel) {
                    const labelName = matchingLabel.querySelector('.label-name').textContent;
                    this.hide();
                    this.setLoading(true);
                    try {
                        const success = await handleLabelSelect(labelName);
                        if (!success) {
                            showToast('Failed to add label', 'error');
                        }
                    } catch (error) {
                        showToast('Failed to add label', 'error');
                    } finally {
                        this.setLoading(false);
                    }
                } else {
                    this.setLoading(true);
                    try {
                        const success = await addNewLabel(value);
                        if (success) {
                            this.searchInput.value = '';
                        }
                    } catch (error) {
                        showToast('Failed to create label', 'error');
                    } finally {
                        this.setLoading(false);
                    }
                }
            }
        });
    
        this.searchInput.addEventListener('input', () => {
            selectedIndex = -1;
            this.filterLabels(this.searchInput.value);
        });
    
        // Close button
        this.container.querySelector('.label-close').addEventListener('click', () => this.hide());
    }
    
    renderLabels(labels = []) {
        this.labelList.innerHTML = '';
    
        if (this.loading) {
            const loadingItem = document.createElement('div');
            loadingItem.className = 'label-spinner';
            this.labelList.appendChild(loadingItem);
            return;
        }
    
        if (labels.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'label-empty';
            emptyItem.textContent = 'No labels found. Press Enter to create a new label.';
            this.labelList.appendChild(emptyItem);
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
    
            this.labelList.appendChild(item);
        });
    }

    createActionButton(type, title) {
        const button = document.createElement('button');
        button.className = `label-${type}`;
        button.title = title;
        button.innerHTML = type === 'edit' ? this.getEditIcon() : this.getDeleteIcon();
        return button;
    }

    attachLabelEventHandlers(item, name) {
        // Click handler for the item
        item.addEventListener('click', async (e) => {
            if (!e.target.closest('.label-delete') && !e.target.closest('.label-edit')) {
                this.hide();
                this.setLoading(true);
                try {
                    const success = await handleLabelSelect(name);
                    if (!success) {
                        showToast('Failed to add label', 'error');
                    }
                } catch (error) {
                    showToast('Failed to add label', 'error');
                } finally {
                    this.setLoading(false);
                }
            }
        });
    
        // Delete handler
        item.querySelector('.label-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${name}"?`)) {
                this.setLoading(true);
                try {
                    const success = await deleteLabel(name);
                    if (!success) {
                        showToast('Failed to delete label', 'error');
                    }
                } catch (error) {
                    showToast('Failed to delete label', 'error');
                } finally {
                    this.setLoading(false);
                }
            }
        });
    
        // Edit handler
        item.querySelector('.label-edit').addEventListener('click', async (e) => {
            e.stopPropagation();
            const newName = prompt(`Rename label "${name}" to:`, name);
            if (newName && newName !== name) {
                this.setLoading(true);
                try {
                    const success = await editLabel(name, newName);
                    if (success) {
                        showToast('Label editing is done!');
                    }
                } catch (error) {
                    showToast('Failed to rename label', 'error');
                } finally {
                    this.setLoading(false);
                }
            }
        });
    }
    getEditIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>`;
    }

    getDeleteIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>`;
    }

    async show() {
        // this.overlay.classList.add('visible');
        this.container.classList.add('visible');
        this.searchInput.value = '';
        this.searchInput.focus();
        this.filterLabels('');
    }

    hide() {
        // this.overlay.classList.remove('visible');
        this.container.classList.remove('visible');
    }

    isVisible() {
        return this.container.classList.contains('visible');
    }
}

// Firebase-related functions
async function deleteLabel(labelName) {
    try {
        const { db, currentUser } = await window.firebaseService.initializeFirebase();
        if (!db || !currentUser) {
            showToast('Authentication error', 'error');
            return;
        }

        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
        const userLabelsDoc = await userLabelsRef.get();

        if (!userLabelsDoc.exists) {
            showToast(`Label "${labelName}" does not exist`, 'error');
            return;
        }

        const labels = userLabelsDoc.data().labels || {};
        delete labels[labelName];

        await userLabelsRef.update({ labels });
        showToast(`Label "${labelName}" deleted`);
        return true;
    } catch (error) {
        // console.error('Error deleting label:', error);
        showToast('Error deleting label', 'error');
        return false;
    }
}

async function editLabel(oldName, newName) {
    try {
        const { db, currentUser } = await window.firebaseService.initializeFirebase();
        if (!db || !currentUser) {
            showToast('Authentication error', 'error');
            return;
        }

        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
        const userLabelsDoc = await userLabelsRef.get();

        if (!userLabelsDoc.exists) {
            showToast('Label not found', 'error');
            return;
        }

        const labels = userLabelsDoc.data().labels || {};
        if (!labels[oldName]) {
            showToast('Label not found', 'error');
            return;
        }

        if (labels[newName]) {
            showToast(`Label "${newName}" already exists`, 'error');
            return;
        }

        // Copy old label data to new name and delete old one
        labels[newName] = { ...labels[oldName] };
        delete labels[oldName];


        await userLabelsRef.update({ labels });
        showToast(`Label renamed to "${newName}"`);
        return true;
    } catch (error) {
        // console.error('Error editing label:', error);
        showToast('Error editing label', 'error');
        return false;
    }
}

async function addNewLabel(labelName) {
    try {
        const exists = await labelExists(labelName);
        if (exists) {
            showToast(`Label "${labelName}" already exists`, 'error');
            return;
        }

        const { db, currentUser } = await window.firebaseService.initializeFirebase();
        if (!db || !currentUser) {
            showToast('Authentication error', 'error');
            return;
        }

        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
        const userLabelsDoc = await userLabelsRef.get();
        const labels = userLabelsDoc.exists ? userLabelsDoc.data().labels || {} : {};

        labels[labelName] = {
            color: generateRandomColor(),
            createdAt: new Date().toISOString(),
            codes: {}
        };

        await userLabelsRef.set({ labels }, { merge: true });
        showToast(`Label "${labelName}" added`);
        return true;
    } catch (error) {
        // console.error('Error adding label:', error);
        showToast('Error adding label', 'error');
        return false;
    }
}

async function labelExists(labelName) {
    try {
        const { db, currentUser } = await window.firebaseService.initializeFirebase();
        if (!db || !currentUser) return false;

        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
        const userLabelsDoc = await userLabelsRef.get();

        if (!userLabelsDoc.exists) return false;

        const labels = userLabelsDoc.data().labels || {};
        return labels.hasOwnProperty(labelName.toLowerCase());
    } catch (error) {
        // console.error('Error checking label existence:', error);
        return false;
    }
}
function getProfileInfo() {
    const detailContainer = document.querySelector('.scaffold-layout__detail');
    if (!detailContainer) return null;

    const profileLink = detailContainer.querySelector('.msg-thread__link-to-profile');
    if (!profileLink) return null;

    const name = profileLink.querySelector('h2')?.textContent?.trim();
    const url = profileLink.href;

    return { name, url };
}

function getProfileImage() {
    const activeConvo = document.querySelector('.msg-conversations-container__convo-item-link--active');
    if (!activeConvo) return null;

    const img = activeConvo.querySelector('img');
    return img?.src || null;
}
async function handleLabelSelect(labelName) {
    if (!labelName) {
        showToast('Label name is required', 'error');
        return false;
    }

    const profileInfo = getProfileInfo();
    const profileImage = getProfileImage();

    if (!profileInfo || !profileImage) {
        showToast('Could not find profile information', 'error');
        return false;
    }

    try {
        const { db, currentUser } = await window.firebaseService.initializeFirebase();
        if (!db || !currentUser) {
            showToast('Authentication error', 'error');
            return false;
        }

        const userLabelsRef = db.collection('labels').doc(currentUser.uid);
        const userLabelsDoc = await userLabelsRef.get();

        if (!userLabelsDoc.exists) {
            showToast('Label not found', 'error');
            return false;
        }

        const labels = userLabelsDoc.data().labels || {};
        if (!labels[labelName]) {
            showToast('Label not found', 'error');
            return false;
        }

        const profileId = btoa(profileInfo.url).replace(/[^a-zA-Z0-9]/g, '');

        labels[labelName].codes = labels[labelName].codes || {};
        labels[labelName].codes[profileId] = {
            name: profileInfo.name,
            url: profileInfo.url,
            code: profileImage,
            addedAt: new Date().toISOString()
        };

        await userLabelsRef.update({ labels });
        showToast(`Added ${profileInfo.name} to ${labelName}`);
        return true;
    } catch (error) {
        // console.error('Error adding profile to label:', error);
        showToast('Error adding profile to label', 'error');
        return false;
    }
}

// Initialize and export to window object
window.labels = {
    service: {
        generateRandomColor,
        showToast,
        deleteLabel,
        editLabel,
        labelExists,
        addNewLabel,
        handleLabelSelect,
        setupLabelManager: () => new LabelManager()
    }
};

let labelManagerInstance = null;

// Initialize label manager when needed
function getLabelManager() {
    if (!labelManagerInstance) {
        labelManagerInstance = window.labels.service.setupLabelManager();
    }
    return labelManagerInstance;
}

// Export the getter
window.getLabelManager = getLabelManager;
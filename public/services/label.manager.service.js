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
            transform: translate(-50%, -50%) scale(0.95);
            background: var(--color-background, #ffffff);
            color: var(--color-text, #000000);
            border-radius: 16px;
            padding: 28px;
            min-width: 480px;
            max-width: 90vw;
            max-height: 90vh;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            z-index: 1000;
            display: none;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
          }
      
          .label-manager.visible {
            display: block;
            transform: translate(-50%, -50%) scale(1);
          }
    
      
          .label-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
          }
      
          .label-header h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }
      
          .label-close {
            background: var(--color-close-bg, rgba(0, 0, 0, 0.05));
            border: none;
            padding: 8px;
            cursor: pointer;
            border-radius: 8px;
            color: var(--color-text, #000000);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
      
          .label-close:hover {
            background: var(--color-close-hover, rgba(0, 0, 0, 0.1));
          }
          .label-search:hover{
            border:none;
            box-shadow: 0 0 0 2px var(--color-border-focus-shadow, rgba(0, 0, 0, 0.05));
          }
          .label-search {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
            border-radius: 12px;
            margin-bottom: 20px;
            font-size: 15px;
            font-weight: 400;
            background: var(--color-background, #ffffff);
            color: var(--color-text, #000000);
            transition: all 0.2s ease;
          }
      
          .label-search::placeholder {
            color: var(--color-placeholder, rgba(0, 0, 0, 0.5));
          }
      
          .label-search:focus {
            outline: none;
            border-color: var(--color-border-focus, rgba(0, 0, 0, 0.2));
            box-shadow: 0 0 0 2px var(--color-border-focus-shadow, rgba(0, 0, 0, 0.05));
          }
      
          .label-list {
            max-height: 360px;
            overflow-y: auto;
            margin: 0;
            padding: 4px;
            list-style: none;
          }
      
          .label-list::-webkit-scrollbar {
            width: 8px;
          }
      
          .label-list::-webkit-scrollbar-track {
            background: var(--color-scrollbar-track, rgba(0, 0, 0, 0.05));
            border-radius: 4px;
          }
      
          .label-list::-webkit-scrollbar-thumb {
            background: var(--color-scrollbar-thumb, rgba(0, 0, 0, 0.2));
            border-radius: 4px;
          }
      
          .label-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            cursor: pointer;
            border-radius: 10px;
            transition: all 0.2s ease;
            margin-bottom: 6px;
            background: var(--color-item-bg, rgba(0, 0, 0, 0.02));
            border: 1px solid transparent;
          }
      
          .label-item:hover {
            background: var(--color-item-hover, rgba(0, 0, 0, 0.05));
          }
      
          .label-item.selected {
            background: var(--color-item-selected, rgba(0, 0, 0, 0.08));
            border: 1px solid var(--color-border-selected, rgba(0, 0, 0, 0.15));
            outline: none;
          }
      
          .label-item.empty {
            cursor: default;
            background: none;
            justify-content: center;
            padding: 24px 16px;
            border: none;
          }
      
          .label-item.loading {
            cursor: default;
            background: none;
            justify-content: center;
            padding: 32px 16px;
            border: none;
          }
      
          .label-empty {
            text-align: center;
            color: var(--color-text-secondary, rgba(0, 0, 0, 0.5));
            font-size: 14px;
            font-weight: 500;
            line-height: 1.5;
          }
      
          .label-color {
            width: 28px;
            height: 28px;
            border-radius: 8px;
            margin-right: 16px;
            flex-shrink: 0;
          }
      
          .label-name {
            flex-grow: 1;
            font-size: 15px;
            font-weight: 500;
          }
      
          .label-delete,
          .label-edit {
            opacity: 0;
            padding: 8px;
            background: var(--color-button-bg, rgba(0, 0, 0, 0.05));
            border: none;
            cursor: pointer;
            border-radius: 6px;
            color: var(--color-text, #000000);
            margin-left: 8px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
      
          .label-item:hover .label-delete,
          .label-item:hover .label-edit,
          .label-item.selected .label-delete,
          .label-item.selected .label-edit {
            opacity: 1;
          }
      
          .label-delete:hover,
          .label-edit:hover {
            background: var(--color-button-hover, rgba(0, 0, 0, 0.1));
          }
      
.label-spinner {
  width: 50px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: 
    radial-gradient(farthest-side,#ffffff 94%,#0000) top/8px 8px no-repeat,
    conic-gradient(#0000 30%,#ffffff);
  -webkit-mask: radial-gradient(farthest-side,#0000 calc(100% - 8px),#000 0);
  animation: spinAnimation 1s infinite linear;
}

@keyframes spinAnimation { 
  100% { transform: rotate(1turn) }
}
      
          @media (prefers-color-scheme: dark) {
            .label-manager {
              --color-background: #1f2937;
              --color-text: #ffffff;
              --color-border: rgba(255, 255, 255, 0.1);
              --color-close-bg: rgba(255, 255, 255, 0.1);
              --color-close-hover: rgba(255, 255, 255, 0.2);
              --color-placeholder: rgba(255, 255, 255, 0.5);
              --color-border-focus: rgba(255, 255, 255, 0.2);
              --color-border-focus-shadow: rgba(255, 255, 255, 0.05);
              --color-scrollbar-track: rgba(255, 255, 255, 0.05);
              --color-scrollbar-thumb: rgba(255, 255, 255, 0.2);
              --color-item-bg: rgba(255, 255, 255, 0.05);
              --color-item-hover: rgba(255, 255, 255, 0.1);
              --color-button-bg: rgba(255, 255, 255, 0.1);
              --color-button-hover: rgba(255, 255, 255, 0.2);
              --color-spinner-bg: rgba(0, 0, 0, 0.8);
              --color-text-secondary: rgba(255, 255, 255, 0.5);
              --color-item-selected: rgba(255, 255, 255, 0.15);
              --color-border-selected: rgba(255, 255, 255, 0.25);
            }
      
            .label-item.selected {
              background: var(--color-item-selected);
            }
          }
        `;
        document.head.appendChild(styleSheet);
    }

    createElements() {
        // this.overlay = document.createElement('div');
        // this.overlay.className = 'label-overlay';

        this.container = document.createElement('div');
        this.container.className = 'label-manager';

        const header = document.createElement('div');
        header.className = 'label-header';
        header.innerHTML = `
        <h2 style="margin: 0; font-size: 18px;">Manage Labels</h2>
        <button class="label-close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      `;

        this.searchInput = document.createElement('input');
        this.searchInput.className = 'label-search';
        this.searchInput.placeholder = 'Search or create new label...';

        this.labelList = document.createElement('ul');
        this.labelList.className = 'label-list';

        this.container.appendChild(header);
        this.container.appendChild(this.searchInput);
        this.container.appendChild(this.labelList);

        // document.body.appendChild(this.overlay);
        document.body.appendChild(this.container);
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
            const currentIndex = selectedIndex;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (document.activeElement === this.searchInput) {
                        selectedIndex = 0;
                    } else {
                        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                    }
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    if (selectedIndex === 0) {
                        selectedIndex = -1;
                        this.searchInput.focus();
                        return;
                    }
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    break;

                case 'Enter':
                    if (selectedIndex >= 0 && items[selectedIndex]) {
                        e.preventDefault();
                        items[selectedIndex].click();
                    }
                    break;
            }

            // Remove previous selection
            if (currentIndex >= 0 && items[currentIndex]) {
                items[currentIndex].classList.remove('selected');
            }

            // Apply new selection
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
                        // console.error('Error in handleLabelSelect:', error);
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
                            //   this.loadLabels();
                        }
                    } catch (error) {
                        // console.error('Error in addNewLabel:', error);
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

        // Close button and overlay
        this.container.querySelector('.label-close').addEventListener('click', () => this.hide());
        // this.overlay.addEventListener('click', () => this.hide());
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

    renderLabels(labels = []) {
        this.labelList.innerHTML = '';

        if (this.loading) {
            const loadingItem = document.createElement('li');
            loadingItem.className = 'label-spinner';
            this.labelList.appendChild(loadingItem);
            return;
        }

        if (labels.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'label-item empty';
            emptyItem.innerHTML = `
            <span class="label-empty">No labels found. Press Enter to create a new label.</span>
          `;
            this.labelList.appendChild(emptyItem);
            return;
        }

        labels.forEach(([name, data], index) => {
            const item = document.createElement('li');
            item.className = 'label-item';
            item.setAttribute('data-index', index);
            item.setAttribute('tabindex', '-1');
            item.innerHTML = `
            <div class="label-color" style="background-color: ${data.color}"></div>
            <span class="label-name">${name}</span>
            <button class="label-delete" title="Delete label" tabindex="-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="label-edit" title="Edit label" tabindex="-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </button>
          `;

            // Add click handlers
            item.addEventListener('click', async (e) => {
                if (!e.target.closest('.label-delete') && !e.target.closest('.label-edit')) {
                    // this.hide();
                    this.setLoading(true);
                    try {
                        const success = await handleLabelSelect(name);
                        if (!success) {
                            showToast('Failed to add label', 'error');
                        }
                    } catch (error) {
                        // console.error('Error in handleLabelSelect:', error);
                        showToast('Failed to add label', 'error');
                    } finally {
                        this.setLoading(false);
                        this.hide()
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
                        // console.error('Error in deleteLabel:', error);
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
                        // console.error('Error in editLabel:', error);
                        showToast('Failed to rename label', 'error');
                    } finally {
                        this.setLoading(false);
                    }
                }
            });

            this.labelList.appendChild(item);
        });
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
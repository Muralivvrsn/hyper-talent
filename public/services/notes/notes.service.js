
class NotesManager {
    constructor() {
        // console.log('Initializing NotesManager');
        this.notes = {};
        this.setupStyles();
        // this.createElements();
        this.setupEventListeners();
        this.loadInitialNotes();
        this.profileInfo = null;
        this.container = null;  // Will be created on demand
    }
    // Add these methods to the NotesManager class:


    setupStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .notes-manager {
                position: fixed;
                top: 50%;
                left: 80%;
                transform: translate(-50%, -50%);
                width: 450px;
                max-width: 90vw;
                background: white;
                border-radius: 0.75rem;
                display: none;
                z-index: 9999;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            }
    
            .notes-manager.visible {
                display: block !important;
                visibility: visible !important;
            }
    
            .notes-header {
                background: #2563eb;
                padding: 1.5rem 1.8rem;  /* Increased from 1.25rem 1.5rem */
                border-top-left-radius: 0.75rem;
                border-top-right-radius: 0.75rem;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
    
            .notes-header h2 {
                color: white;
                margin: 0;
                font-size: 1.35rem;  /* Increased from 1.125rem */
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.75rem;  /* Increased from 0.625rem */
                letter-spacing: -0.01em;
            }
    
            .notes-close {
                position: absolute;
                right: 1.5rem;  /* Increased from 1.25rem */
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
    
            .notes-close:hover {
                background: rgba(255, 255, 255, 0.15);
            }
    
            .notes-content {
                padding: 1.5rem 1.8rem;  /* Increased from 1.25rem 1.5rem */
                display: flex;
                flex-direction: column;
                gap: 1.5rem;  /* Increased from 1.25rem */
            }
    
            .notes-textarea {
                width: 100%;
                height: 200px;
                padding: 1.05rem 1.35rem;  /* Increased from 0.875rem 1.125rem */
                border: 2px solid rgb(229, 231, 235);
                border-radius: 0.5rem;
                background: white;
                color: rgb(17, 24, 39);
                font-size: 1.125rem;  /* Increased from 0.9375rem */
                font-weight: 500;
                resize: none;
                transition: all 0.2s ease;
            }
    
            .notes-textarea::placeholder {
                color: rgb(156, 163, 175);
                font-weight: 400;
                font-size: 1.125rem;  /* Added to match input font size */
            }
    
            .notes-textarea:focus {
                outline: none;
                border-color: rgb(59, 130, 246);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
    
            .notes-actions {
                display: flex;
                gap: 0.75rem;  /* Increased from 0.625rem */
                justify-content: flex-end;
            }
    
            .notes-delete {
                padding: 0.75rem 1.5rem;  /* Increased from 0.625rem 1.25rem */
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 0.375rem;
                font-size: 1.05rem;  /* Increased from 0.875rem */
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s ease;
            }
    
            .notes-delete:hover {
                background: #b91c1c;
            }
    
            .notes-submit {
                padding: 0.75rem 1.5rem;  /* Increased from 0.625rem 1.25rem */
                background: #0077b5;
                color: white;
                border: none;
                border-radius: 0.375rem;
                font-size: 1.05rem;  /* Increased from 0.875rem */
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s ease;
            }
    
            .notes-submit:hover {
                background: #006699;
            }
    
            .notes-indicator {
                position: absolute;
                top: -4px;
                right: -4px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #0077b5;
                border: 2px solid white;
                z-index: 1;
            }
    
            @media (prefers-color-scheme: dark) {
                .notes-manager {
                    background: #1f2937;
                    color: white;
                }
    
                .notes-textarea {
                    background: #374151;
                    color: white;
                    border-color: #4b5563;
                }
    
                .notes-textarea::placeholder {
                    color: #9ca3af;
                }
    
                .notes-indicator {
                    border-color: #1f2937;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
    createElements(profileName) {
        this.container = document.createElement('div');
        this.container.className = 'notes-manager';
    
        const header = document.createElement('div');
        header.className = 'notes-header';
        header.innerHTML = `
            <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Add Note for ${profileName}
            </h2>
            <button class="notes-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
    
        const content = document.createElement('div');
        content.className = 'notes-content';
    
        this.textarea = document.createElement('textarea');
        this.textarea.className = 'notes-textarea';
        this.textarea.placeholder = 'Enter your note here...';
    
        const actions = document.createElement('div');
        actions.className = 'notes-actions';
    
        this.deleteButton = document.createElement('button');
        this.deleteButton.className = 'notes-delete';
        this.deleteButton.textContent = 'Delete Note';
        this.deleteButton.style.display = 'none';
    
        this.submitButton = document.createElement('button');
        this.submitButton.className = 'notes-submit';
        this.submitButton.textContent = 'Save Note';
    
        actions.appendChild(this.deleteButton);
        actions.appendChild(this.submitButton);
    
        content.appendChild(this.textarea);
        content.appendChild(actions);
    
        this.container.appendChild(header);
        this.container.appendChild(content);
    
        document.body.appendChild(this.container);
        this.setupEventListeners();
        // this.enableDragging();
        this.setupContainerEvents();
    }

    async deleteNote() {
        try {
            const { db, currentUser } = await window.firebaseServices.initializeFirebase();
            if (!db || !currentUser) {
                showToast('Authentication error', 'error');
                return;
            }

            const profileId = this.currentNoteKey;
            if (!profileId) {
                showToast('Could not find note to delete', 'error');
                return;
            }

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();

            if (!notesDoc.exists) {
                showToast('Notes not found', 'error');
                return;
            }

            const notes = notesDoc.data();
            delete notes[profileId];

            await notesRef.set(notes);
            showToast('Note deleted successfully');
            this.hide();
        } catch (error) {
            // console.error('Error deleting note:', error);
            showToast('Failed to delete note', 'error');
        }
    }
    setupEventListeners() {
        // Global keyboard shortcut - only setup once in constructor
        document.addEventListener('keydown', (e) => {
            if (e?.key?.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const activeElement = document.activeElement;
                const isMessageInput = activeElement?.classList.contains('msg-form__contenteditable');
                const isInputField = activeElement?.tagName?.toLowerCase() === 'input';
                const isLabelManagerVisible = document.querySelector('.label-manager.visible');
                const isNotesVisible = document.querySelector('.notes-manager');
    
                if (!isMessageInput && !isInputField && !isLabelManagerVisible && !isNotesVisible) {
                    e.preventDefault();
                    this.show();
                }
            } else if (e.key === 'Escape') {
                const notesManager = document.querySelector('.notes-manager');
                if (notesManager) {
                    this.hide();
                }
            } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                const notesManager = document.querySelector('.notes-manager');
                if (e.key === 'ArrowUp' && !notesManager) {
                    this.hide();
                } else if (e.key === 'ArrowDown' && notesManager) {
                    this.hide();
                }
            }
        });
    
        // Click outside to close
        document.addEventListener('mousedown', (e) => {
            const notesManager = document.querySelector('.notes-manager');
            if (notesManager && !notesManager.contains(e.target)) {
                this.hide();
            }
        });
    
        // Setup Firebase realtime listener - only once in constructor
        this.setupFirebaseListener();
    }
    
    // New method for container-specific events
    setupContainerEvents() {
        // Close button
        this.container.querySelector('.notes-close').addEventListener('click', () => this.hide());
    
        // Submit functionality
        this.submitButton.addEventListener('click', () => this.saveNote());
        this.deleteButton.addEventListener('click', () => this.deleteNote());
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.saveNote();
            }
        });
    }

    async loadInitialNotes() {
        try {
            const { db, currentUser } = await window.firebaseServices.initializeFirebase();
            if (!db || !currentUser) return;

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();
            this.notes = notesDoc.exists ? notesDoc.data() : {};
            this.updateNotesIndicators();
        } catch (error) {
            // console.error('Error loading initial notes:', error);
        }
    }

    setupFirebaseListener() {
        window.firebaseServices.initializeFirebase().then(({ db, currentUser }) => {
            if (!db || !currentUser) return;

            const notesRef = db.collection('notes').doc(currentUser.uid);
            notesRef.onSnapshot((doc) => {
                this.notes = doc.exists ? doc.data() : {};
                this.updateNotesIndicators();
            });
        });
    }

    updateNotesIndicators() {
        const conversations = document.querySelectorAll('.msg-conversations-container__convo-item-link');
        conversations.forEach(convo => {
            const profileLink = convo.querySelector('.msg-conversation-card__profile-link');
            if (!profileLink) return;

            const profileUrl = profileLink.href;
            const profileId = btoa(profileUrl).replace(/[^a-zA-Z0-9]/g, '');

            const existingIndicator = convo.querySelector('.notes-indicator');

            if (this.notes[profileId]) {
                if (!existingIndicator) {
                    const indicator = document.createElement('div');
                    indicator.className = 'notes-indicator';
                    indicator.title = 'Has notes';
                    convo.style.position = 'relative';
                    convo.appendChild(indicator);
                }
            } else if (existingIndicator) {
                existingIndicator.remove();
            }
        });
    }


    async saveNote() {
        // console.log('Attempting to save note');
        const note = this.textarea.value.trim();
        if (!note) {
            // console.log('Note is empty');
            showToast('Please enter a note', 'error');
            return;
        }

        const profileInfo = getProfileInfo();

        const profileImage = getProfileImage();

        if (!profileInfo || !profileImage) {
            // console.log('Missing profile info or image');
            showToast('Could not find profile information', 'error');
            return;
        }
        this.profileInfo = profileInfo

        try {
            // console.log('Initializing Firebase');
            const { db, currentUser } = await window.firebaseServices.initializeFirebase();
            if (!db || !currentUser) {
                // console.log('Firebase initialization failed');
                showToast('Authentication error', 'error');
                return;
            }

            console.log(profileInfo)

            // console.log(`Saving note for profile: ${profileId}`);

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const noteData = {
                [this.currentNoteKey]: {
                    name: profileInfo.name,
                    url: profileInfo.url,
                    code: profileImage,
                    note: note,
                    updatedAt: new Date().toISOString()
                }
            };

            await notesRef.set(noteData, { merge: true });
            // console.log('Note saved successfully');
            showToast('Note saved successfully');
            this.hide();
            this.textarea.value = '';
            // Update the cached notes and indicators
            this.notes = { ...this.notes, ...noteData };
            this.updateNotesIndicators();
        } catch (error) {
            // console.error('Error saving note:', error);
            showToast('Failed to save note', 'error');
        }
    }

    isVisible() {
        return this.container.classList.contains('visible')
            // this.overlay.classList.contains('visible');
    }

    async show() {
        try {
            const profileInfo = getProfileInfo();
            if (!profileInfo) {
                showToast('Could not find profile information', 'error');
                return;
            }
    
            // Create initial container with loading state
            this.createElements(profileInfo.name);
            this.container.classList.add('visible');
            
            const { db, currentUser } = await window.firebaseServices.initializeFirebase();
            if (!db || !currentUser) {
                this.hide();
                return;
            }
    
            const profileId = btoa(profileInfo.url).replace(/[^a-zA-Z0-9]/g, '');
            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();
    
            if (notesDoc.exists) {
                const notes = notesDoc.data();
                if (notes[profileId]) {
                    this.currentNoteKey = profileId;
                    this.textarea.value = notes[profileId].note;
                    this.deleteButton.style.display = 'block';
                } else {
                    this.deleteButton.style.display = 'none';
                }
            }
    
            this.textarea.focus();
    
        } catch (error) {
            showToast('Error loading note', 'error');
            this.hide();
        }
    }
    
    hide() {
        if (this.container) {
            this.container.remove(); // Remove from DOM completely
            this.container = null;
        }
    }

    cleanup() {
        // console.log('Cleaning up NotesManager');
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Initialize and export to window object
window.notes = {
    observer: null,
    service: {}
};

// Define the setup function
window.notes.service.setupNotesManager = () => {
    // console.log('Setting up NotesManager service');
    window.notes.observer = new NotesManager();
    return window.notes.observer;
};

// Define the getter function directly on window
window.getNotesManager = function () {
    // console.log('getNotesManager called');
    if (!window.notes.observer) {
        // console.log('Creating new NotesManager instance');
        window.notes.observer = window.notes.service.setupNotesManager();
    }
    return window.notes.observer;
};

// console.log('Notes service script loaded. window.getNotesManager:', !!window.getNotesManager);
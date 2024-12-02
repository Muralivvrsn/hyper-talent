
class NotesManager {
    constructor() {
        console.log('Initializing NotesManager');
        this.notes = {};
        this.setupStyles();
        this.createElements();
        this.setupEventListeners();
        this.loadInitialNotes();
        console.log('NotesManager initialization complete');
    }
// Add these methods to the NotesManager class:

enableDragging() {
    const header = this.container.querySelector('.notes-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    const dragStart = (e) => {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target.closest('.notes-header')) {
            isDragging = true;
            header.style.cursor = 'grabbing';
        }
    };

    const drag = (e) => {
        if (isDragging) {
            e.preventDefault();

            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, this.container);
        }
    };

    const dragEnd = () => {
        if (isDragging) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            header.style.cursor = 'grab';
        }
    };

    const setTranslate = (xPos, yPos, el) => {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    };

    // Add event listeners
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Touch events
    header.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    // Set initial cursor style
    header.style.cursor = 'grab';
}
    setupStyles() {
        console.log('Setting up NotesManager styles');
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .notes-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.3);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s ease;
            }

            .notes-overlay.visible {
                opacity: 1;
                visibility: visible !important;
            }

            .notes-manager {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.95);
                background: var(--color-background, #ffffff);
                color: var(--color-text, #000000);
                border-radius: 16px;
                padding: 28px;
                width: 400px;
                height: 500px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                user-select: none;
            }

            .notes-manager.visible {
                opacity: 1;
                visibility: visible !important;
                transform: translate(-50%, -50%) scale(1);
            }

            .notes-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
                flex-shrink: 0;
            }

            .notes-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }

            .notes-close {
                background: var(--color-close-bg, rgba(0, 0, 0, 0.05));
                border: none;
                padding: 8px;
                cursor: pointer;
                border-radius: 8px;
                color: var(--color-text, #000000);
                transition: all 0.2s ease;
            }

            .notes-close:hover {
                background: var(--color-close-hover, rgba(0, 0, 0, 0.1));
            }

            .notes-textarea {
                flex-grow: 1;
                width: 100%;
                padding: 12px;
                border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 14px;
                resize: none;
                background: var(--color-background, #ffffff);
                color: var(--color-text, #000000);
            }

            .notes-textarea:focus {
                outline: none;
                border-color: var(--color-border-focus, rgba(0, 0, 0, 0.2));
                box-shadow: 0 0 0 2px var(--color-border-focus-shadow, rgba(0, 0, 0, 0.05));
            }

            .notes-submit {
                background: #0A66C2;
                color: white;
                border: none;
                padding: 12px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .notes-submit:hover {
                background: #0955A3;
            }

            .notes-indicator {
                position: absolute;
                top: -4px;
                right: -4px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #0A66C2;
                border: 2px solid white;
            }

            .notes-delete {
                background: #dc2626;
                color: white;
                border: none;
                padding: 12px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                flex-shrink: 0;
                margin-right: 8px;
            }

            .notes-delete:hover {
                background: #b91c1c;
            }

            .notes-actions {
                display: flex;
                gap: 8px;
            }

            @media (prefers-color-scheme: dark) {
                .notes-manager {
                    --color-background: #1f2937;
                    --color-text: #ffffff;
                    --color-border: rgba(255, 255, 255, 0.1);
                    --color-close-bg: rgba(255, 255, 255, 0.1);
                    --color-close-hover: rgba(255, 255, 255, 0.2);
                    --color-border-focus: rgba(255, 255, 255, 0.2);
                    --color-border-focus-shadow: rgba(255, 255, 255, 0.05);
                }

                .notes-indicator {
                    border-color: #1f2937;
                }
            }
        `;
        document.head.appendChild(styleSheet);
        console.log('Styles setup complete');
    }

    createElements() {
        console.log('Creating NotesManager elements');

        // Create overlay
        const parent = document.getElementById("artdeco-toasts__wormhole");
        this.overlay = document.createElement('div');
        this.overlay.className = 'notes-overlay';

        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'notes-manager';

        const header = document.createElement('div');
        header.className = 'notes-header';
        header.innerHTML = `
            <h2>Add Note</h2>
            <button class="notes-close">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;

        this.textarea = document.createElement('textarea');
        this.textarea.className = 'notes-textarea';
        this.textarea.placeholder = 'Enter your note here...';

        this.deleteButton = document.createElement('button');
        this.deleteButton.className = 'notes-delete';
        this.deleteButton.textContent = 'Delete Note';
        this.deleteButton.style.display = 'none';

        this.deleteButton.addEventListener('click', () => this.deleteNote());

        this.submitButton = document.createElement('button');
        this.submitButton.className = 'notes-submit';
        this.submitButton.textContent = 'Save Note';

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'notes-actions';
        actionsContainer.appendChild(this.deleteButton);
        actionsContainer.appendChild(this.submitButton);


        this.container.appendChild(header);
        this.container.appendChild(this.textarea);
        this.container.appendChild(actionsContainer);

        parent.appendChild(this.overlay);
        parent.appendChild(this.container);
        this.enableDragging();
        console.log('Elements created and appended to DOM');
    }

    async deleteNote() {
        try {
            const { db, currentUser } = await window.firebaseService.initializeFirebase();
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
            console.error('Error deleting note:', error);
            showToast('Failed to delete note', 'error');
        }
    }
    setupEventListeners() {
        console.log('Setting up event listeners');

        // Global keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if (e?.key?.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                // Don't do anything if notes is already open
                if (this.isVisible()) return;
    
                const activeElement = document.activeElement;
                const isMessageInput = activeElement?.classList.contains('msg-form__contenteditable');
                const isInputField = activeElement?.tagName?.toLowerCase() === 'input';
                const isLabelManagerVisible = document.querySelector('.label-manager.visible');
    
                if (!isMessageInput && !isInputField && !isLabelManagerVisible) {
                    e.preventDefault();
                    this.show();
                }
            } else if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    


        // Close on overlay click
        this.overlay.addEventListener('click', () => this.hide());

        // Close button
        this.container.querySelector('.notes-close').addEventListener('click', () => this.hide());

        // Submit functionality
        this.submitButton.addEventListener('click', () => this.saveNote());
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.saveNote();
            }
        });

        // Setup Firebase realtime listener
        this.setupFirebaseListener();

        console.log('Event listeners setup complete');
    }

    async loadInitialNotes() {
        try {
            const { db, currentUser } = await window.firebaseService.initializeFirebase();
            if (!db || !currentUser) return;

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();
            this.notes = notesDoc.exists ? notesDoc.data() : {};
            this.updateNotesIndicators();
        } catch (error) {
            console.error('Error loading initial notes:', error);
        }
    }

    setupFirebaseListener() {
        window.firebaseService.initializeFirebase().then(({ db, currentUser }) => {
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
        console.log('Attempting to save note');
        const note = this.textarea.value.trim();
        if (!note) {
            console.log('Note is empty');
            showToast('Please enter a note', 'error');
            return;
        }

        const profileInfo = getProfileInfo();
        const profileImage = getProfileImage();

        if (!profileInfo || !profileImage) {
            console.log('Missing profile info or image');
            showToast('Could not find profile information', 'error');
            return;
        }

        try {
            console.log('Initializing Firebase');
            const { db, currentUser } = await window.firebaseService.initializeFirebase();
            if (!db || !currentUser) {
                console.log('Firebase initialization failed');
                showToast('Authentication error', 'error');
                return;
            }

            const profileId = btoa(profileInfo.url).replace(/[^a-zA-Z0-9]/g, '');
            console.log(`Saving note for profile: ${profileId}`);

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const noteData = {
                [profileId]: {
                    name: profileInfo.name,
                    url: profileInfo.url,
                    code: profileImage,
                    note: note,
                    updatedAt: new Date().toISOString()
                }
            };

            await notesRef.set(noteData, { merge: true });
            console.log('Note saved successfully');
            showToast('Note saved successfully');
            this.hide();
            this.textarea.value = '';
            // Update the cached notes and indicators
            this.notes = { ...this.notes, ...noteData };
            this.updateNotesIndicators();
        } catch (error) {
            console.error('Error saving note:', error);
            showToast('Failed to save note', 'error');
        }
    }

    isVisible() {
        return this.container.classList.contains('visible') ||
            this.overlay.classList.contains('visible');
    }

    async show() {
        console.log('Showing notes manager');

        try {
            const profileInfo = getProfileInfo();
            if (!profileInfo) {
                console.log('No profile info found');
                showToast('Could not find profile information', 'error');
                return;
            }

            const { db, currentUser } = await window.firebaseService.initializeFirebase();
            if (!db || !currentUser) {
                console.log('Firebase not initialized');
                return;
            }

            // First make the UI visible
            requestAnimationFrame(() => {
                this.overlay.classList.add('visible');
                this.container.classList.add('visible');
                this.textarea.value = '';
                this.textarea.focus();
            });


            const profileId = btoa(profileInfo.url).replace(/[^a-zA-Z0-9]/g, '');
            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();

            if (this.isVisible()) {
                if (notesDoc.exists) {
                    const notes = notesDoc.data();
                    if (notes[profileId]) {
                        console.log('Found existing note, populating textarea');
                        this.currentNoteKey = profileId; // Store the key when we load a note
                        requestAnimationFrame(() => {
                            const headerTitle = this.container.querySelector('.notes-header h2');
                            if (headerTitle) {
                                headerTitle.textContent = 'Edit Note';
                            }
                            this.textarea.value = notes[profileId].note;
                            this.deleteButton.style.display = 'block';
                            this.textarea.focus();
                        });
                    }else {
                        console.log('No existing note found');
                        requestAnimationFrame(() => {
                            const headerTitle = this.container.querySelector('.notes-header h2');
                            if (headerTitle) {
                                headerTitle.textContent = 'Add New Note';
                            }
                            this.deleteButton.style.display = 'none'; // Hide delete button
                            this.textarea.focus();
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading note:', error);
            showToast('Error loading note', 'error');
            this.hide();
        }
    }

    hide() {
        console.log('Hiding notes manager - Current visibility:', this.isVisible());

        // Remove classes first
        this.container.classList.remove('visible');
        this.overlay.classList.remove('visible');

        // Reset the visibility style after transition
        setTimeout(() => {
            if (!this.isVisible()) {
                this.container.style.visibility = 'hidden';
                this.overlay.style.visibility = 'hidden';
            }
        }, 200); // Match this with your transition duration
    }

    cleanup() {
        console.log('Cleaning up NotesManager');
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
    console.log('Setting up NotesManager service');
    window.notes.observer = new NotesManager();
    return window.notes.observer;
};

// Define the getter function directly on window
window.getNotesManager = function () {
    console.log('getNotesManager called');
    if (!window.notes.observer) {
        console.log('Creating new NotesManager instance');
        window.notes.observer = window.notes.service.setupNotesManager();
    }
    return window.notes.observer;
};

console.log('Notes service script loaded. window.getNotesManager:', !!window.getNotesManager);
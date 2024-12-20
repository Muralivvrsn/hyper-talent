class ProfileNotesManager {
    constructor() {
        console.log('ProfileNotesManager: Initializing...');
        // Check if already initialized
        if (window.profileNotesManager) {
            console.log('ProfileNotesManager: Already initialized, skipping...');
            return;
        }
        this.saveTimeout = null;
        this.notes = {};
        this.initialized = false;
        this.init();
    }

    async init() {
        console.log('ProfileNotesManager: Starting initialization');
        if (this.initialized) {
            console.log('ProfileNotesManager: Already initialized, skipping...');
            return;
        }
        await this.createNotesUI();
        await this.loadInitialNotes();
        this.setupAutoSave();
        this.initialized = true;
        console.log('ProfileNotesManager: Initialization complete');
    }

    extractConnectionCode(url) {
        console.log('ProfileNotesManager: Extracting connection code from:', url);
        const match = url.match(/connectionOf=%5B%22(.*?)%22%5D/);
        console.log('ProfileNotesManager: Extracted code:', match ? match[1] : 'none');
        return match ? match[1] : null;
    }

    async createNotesUI() {
        console.log('NotesManager: Creating UI');
        if (document.querySelector('.notes-manager')) {
            console.log('NotesManager: UI already exists, skipping creation');
            return;
        }

        const template = `
            <div class="notes-manager">
            <div style="background-color:#FFE4B5" class="notes-header">    💭 What's on your mind?</div>


                <div class="notes-container">
                    <textarea 
                        class="notes-textarea"
                        placeholder="Start typing your note..."></textarea>
                    <div class="status-indicator">
                        <span class="status-icon">
                            <svg class="icon-typing hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>
                            </svg>
                            <svg class="icon-saving hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            <svg class="icon-saved" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                        </span>
                        <span class="status-text"></span>
                    </div>
                </div>
            </div>
        `;

        const styles = `
            <style>
                .notes-manager {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
                    margin: 16px 0;
                    break-inside: avoid;
                    word-wrap: break-word;
                    overflow: hidden;
                }
    
                .notes-header {
                    height: 50px;
                    display: flex;
                    align-items: center;
                    padding: 20px;
                }
                .notes-container {
                    position: relative;
                    // padding: 16px;
                }
    
                .notes-textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 16px;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                    line-height: 1.5;
                    // border: 1px solid #d1d5db;
                    // border-radius: 8px;
                    // resize: none;
                    // box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    transition: all 0.3s ease-in-out;
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                }
    
                .notes-textarea:focus {
                    outline: none !important;
                    border: none !important;
                    box-shadow: none !important;
                    // border-color: #3b82f6;
                    // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
    
                .status-indicator {
                    position: absolute;
                    bottom: 24px;
                    right: 24px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    opacity: 0.85;
                    transition: all 0.2s ease;
                }
    
                .status-icon {
                    display: flex;
                    align-items: center;
                }
    
                .status-icon svg {
                    height: 16px;
                    width: 16px;
                }
    
                .status-text {
                    font-size: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                }
    
                .hidden {
                    display: none;
                }
    
                /* Status Colors */
                .status-indicator.typing { 
                    color: #3B82F6;
                }
    
                .status-indicator.saving { 
                    color: #EAB308;
                }
    
                .status-indicator.saved { 
                    color: #22C55E;
                }
    
                .status-indicator.error {
                    color: #EF4444;
                }
    
                .icon-saving.spinning {
                    animation: spin 1s linear infinite;
                }
    
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        return new Promise((resolve) => {
            let observerTimeout;
            const observer = new MutationObserver((mutations, obs) => {
                const mainElement = document.querySelector('main');
                if (mainElement) {
                    const firstSection = mainElement.querySelector('section');
                    if (firstSection && !document.querySelector('.notes-manager')) {
                        console.log('NotesManager: Found insertion point, creating notes section');
                        const notesSection = document.createElement('section');
                        notesSection.innerHTML = styles + template;
                        firstSection.parentNode.insertBefore(notesSection, firstSection.nextSibling);
                        this.setupElements();
                        this.setupAutoResize();
                        clearTimeout(observerTimeout);
                        obs.disconnect();
                        resolve();
                    }
                }
            });

            observerTimeout = setTimeout(() => {
                console.log('NotesManager: Timeout reached, stopping observer');
                observer.disconnect();
                resolve();
            }, 10000);

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    setupElements() {
        this.container = document.querySelector('.notes-manager');
        this.textarea = this.container.querySelector('.notes-textarea');
        this.statusIndicator = this.container.querySelector('.status-indicator');
        this.statusText = this.container.querySelector('.status-text');
        this.iconTyping = this.container.querySelector('.icon-typing');
        this.iconSaving = this.container.querySelector('.icon-saving');
        this.iconSaved = this.container.querySelector('.icon-saved');
    }

    setupAutoResize() {
        const adjustHeight = () => {
            const textarea = this.textarea;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        };

        this.textarea.addEventListener('input', adjustHeight);
        window.addEventListener('resize', adjustHeight);

        // Initial adjustment
        adjustHeight();
    }

    // Remove the old showLoading, showSuccess, and showError methods
    // Instead, we'll handle everything through the updateStatus method

    async saveNote() {
        console.log('ProfileNotesManager: Saving note');
        try {
            const note = this.textarea.value.trim();
            const profileInfo = await this.extractProfileInfo();

            if (!profileInfo) {
                console.log('ProfileNotesManager: No profile info found for saving');
                this.updateStatus('error');
                return;
            }

            this.updateStatus('saving');

            const { db, currentUser } = await window.firebaseService.initializeFirebase();
            if (!db || !currentUser) {
                console.log('ProfileNotesManager: Firebase auth failed');
                this.updateStatus('error');
                return;
            }

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const noteData = {
                [profileInfo.id]: {
                    userName: profileInfo.userName,
                    url: profileInfo.url,
                    note: note,
                    updatedAt: new Date().toISOString()
                }
            };

            await notesRef.set(noteData, { merge: true });
            this.notes = { ...this.notes, ...noteData };
            console.log('ProfileNotesManager: Note saved successfully');
            this.updateStatus('saved');
        } catch (error) {
            console.error('ProfileNotesManager: Error saving note:', error);
            this.updateStatus('error');
        }
    }

    setupAutoSave() {
        let saveTimeout;

        this.textarea.addEventListener('input', () => {
            this.updateStatus('typing');

            if (saveTimeout) {
                clearTimeout(saveTimeout);
            }

            saveTimeout = setTimeout(() => {
                this.saveNote();
            }, 1000);
        });
    }

    updateStatus(status) {
        if (!this.statusIndicator) return; // Guard clause

        this.statusIndicator.className = `status-indicator absolute bottom-6 right-6 flex items-center gap-1 ${status}`;

        // Hide all icons first
        this.iconTyping.classList.add('hidden');
        this.iconSaving.classList.add('hidden');
        this.iconSaved.classList.add('hidden');

        // Show the appropriate icon and set text
        switch (status) {
            case 'typing':
                this.iconTyping.classList.remove('hidden');
                this.statusText.textContent = 'Typing...';
                break;
            case 'saving':
                this.iconSaving.classList.remove('hidden');
                // this.iconSaving.classList.add('spinning');
                this.statusText.textContent = 'Saving...';
                break;
            case 'saved':
                this.iconSaved.classList.remove('hidden');
                this.statusText.textContent = 'Saved';
                setTimeout(() => {
                    if (this.statusText) { // Guard clause
                        this.statusText.textContent = '';
                    }
                }, 2000);
                break;
            case 'error':
                this.statusIndicator.classList.add('text-red-500');
                this.statusText.textContent = 'Error saving';
                setTimeout(() => {
                    if (this.statusText) { // Guard clause
                        this.statusText.textContent = '';
                        this.statusIndicator.classList.remove('text-red-500');
                    }
                }, 3000);
                break;
        }
    }

    async extractProfileInfo() {
        console.log('ProfileNotesManager: Extracting profile info');

        // Function to wait for element
        const waitForElement = (selector, timeout = 10000) => {
            return new Promise((resolve) => {
                if (document.querySelector(selector)) {
                    return resolve(document.querySelectorAll(selector));
                }

                const observer = new MutationObserver((mutations) => {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        observer.disconnect();
                        resolve(elements);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Timeout after specified duration
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            });
        };

        // Wait for connection links to appear
        console.log('Waiting for connection links...');
        const connectionLinks = await waitForElement('.text-body-small a.ember-view');

        // Get username from current URL
        const currentUrl = window.location.href;
        const usernameMatch = currentUrl.match(/linkedin\.com\/in\/([^/]+)/);
        const userName = usernameMatch ? usernameMatch[1] : '';
        console.log('ProfileNotesManager: Extracted username:', userName);

        // Initialize profile info with username
        let profileInfo = {
            userName: userName
        };

        if (connectionLinks) {
            console.log('Connection links found:', connectionLinks);

            for (const link of connectionLinks) {
                const href = link?.getAttribute('href');
                if (href?.includes('connectionOf')) {
                    const match = this.extractConnectionCode(href);
                    console.log('ProfileNotesManager: Found connection code:', match);
                    if (match) {
                        const id = match;
                        const linkedInUrl = `https://www.linkedin.com/in/${id}`;

                        // Add connection-specific info to profileInfo
                        profileInfo = {
                            ...profileInfo,
                            id: btoa(linkedInUrl).replace(/[^a-zA-Z0-9]/g, ''),
                            url: linkedInUrl
                        };
                        console.log('ProfileNotesManager: Added connection info:', profileInfo);
                        break;
                    }
                }
            }
        } else {
            console.log('ProfileNotesManager: Connection links not found within timeout');
        }

        console.log('ProfileNotesManager: Final profile info:', profileInfo);
        return profileInfo;
    }

    async loadInitialNotes() {
        console.log('ProfileNotesManager: Loading initial notes');
        try {
            const profileInfo = await this.extractProfileInfo();
            console.log('Profile Info:', profileInfo);

            if (!profileInfo) {
                console.log('ProfileNotesManager: No profile info found');
                return;
            }

            const { db, currentUser } = await window.firebaseService.initializeFirebase();
            if (!db || !currentUser) {
                console.log('ProfileNotesManager: Firebase initialization failed');
                return;
            }

            const notesRef = db.collection('notes').doc(currentUser.uid);
            const notesDoc = await notesRef.get();

            if (notesDoc.exists) {
                const data = notesDoc.data();

                // First try to find by ID
                if (data[profileInfo.id]) {
                    console.log('ProfileNotesManager: Found existing notes by ID');
                    this.textarea.value = data[profileInfo.id].note || '';
                    this.notes = data;
                    return;
                }

                // If not found by ID, search by username
                console.log('ProfileNotesManager: Searching by username:', profileInfo.userName);
                let foundNote = null;
                let foundNoteId = null;

                // Iterate through all notes to find matching username
                for (const [noteId, noteData] of Object.entries(data)) {
                    if (noteData.userName === profileInfo.userName) {
                        console.log('ProfileNotesManager: Found existing notes by username');
                        foundNote = noteData;
                        foundNoteId = noteId;
                        break;
                    }
                }

                if (foundNote) {
                    // Update the note with new ID while preserving the note content
                    const updatedNoteData = {
                        [profileInfo.id]: {
                            ...foundNote,
                            url: profileInfo.url,
                            id: profileInfo.id,
                            updatedAt: new Date().toISOString()
                        }
                    };

                    // Save the updated note with new ID
                    await notesRef.set(updatedNoteData, { merge: true });

                    // If the IDs are different, delete the old entry
                    if (foundNoteId !== profileInfo.id) {
                        const deleteUpdate = { [foundNoteId]: firebase.firestore.FieldValue.delete() };
                        await notesRef.update(deleteUpdate);
                    }

                    this.textarea.value = foundNote.note || '';
                    this.notes = { ...data, ...updatedNoteData };
                    console.log('ProfileNotesManager: Updated note with new ID');
                } else {
                    console.log('ProfileNotesManager: No existing notes found by username');
                }
            }
        } catch (error) {
            console.error('ProfileNotesManager: Error loading notes:', error);
            this.showError('Error loading notes');
        }
    }

    showLoading(show) {
        this.loadingIndicator.classList.toggle('hidden', !show);
    }

    showSuccess() {
        this.saveStatus.textContent = 'Saved';
        setTimeout(() => {
            this.saveStatus.textContent = '';
        }, 2000);
    }

    showError(message) {
        console.error('ProfileNotesManager: Error:', message);
        this.saveStatus.textContent = message;
        this.saveStatus.classList.add('text-red-500');
        setTimeout(() => {
            this.saveStatus.textContent = '';
            this.saveStatus.classList.remove('text-red-500');
        }, 3000);
    }
}

// Initialize only if not already initialized
if (!window.profileNotesManager) {
    console.log('Creating new ProfileNotesManager instance');
    window.profileNotesManager = new ProfileNotesManager();
}
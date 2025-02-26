class ProfileNotes {
    async init() {
        if (this.initialized) return;
        this.initialized = true;
    }

    extractUsername(url) {
        const match = url.match(/linkedin\.com\/in\/([^/]+)/);
        return match ? match[1] : '';
    }

    extractConnectionCode(url) {
        const match = url.match(/connectionOf=%5B%22(.*?)%22%5D/);
        if (match) return match[1];
        
        const directMatch = url.match(/connectionOf=\["([^"]+)"\]/);
        return directMatch ? directMatch[1] : null;
    }

    extractConnectionCodeFromMutual(url) {
        const match = url.match(/facetConnectionOf=%22(.*?)%22/);
        if (match) return match[1];
        
        const directMatch = url.match(/facetConnectionOf="([^"]+)"/);
        return directMatch ? directMatch[1] : null;
    }

    extractProfileId(url) {
        const match = url.match(/ACoAA[A-Za-z0-9_-]+/);
        return match ? match[0] : null;
    }

    getProfileInfo() {
        try {
            const currentUrl = window.location.href;
            
            // Check if it's a profile page
            if (currentUrl.includes('linkedin.com/in/')) {
                const connectionLink = document.querySelector('a[href*="/search/results/people"]');
                const mutualConnectionLink = document.querySelector('section[data-member-id] > .ph5 > a');
                const url = connectionLink?.href || mutualConnectionLink?.href || currentUrl;
                const username = this.extractUsername(currentUrl);

                let name = null;
                const nameElement = document.querySelector('a[aria-label] h1');
                if (nameElement) {
                    name = nameElement.textContent.trim();
                }
                let imageUrl = null;
                const profileImage = document.querySelector('img.pv-top-card-profile-picture__image--show');
                if (profileImage) {
                    imageUrl = profileImage.getAttribute('src');
                }
                let connectionCode = this.extractConnectionCode(url);

                if (!connectionCode) {
                    connectionCode = this.extractConnectionCodeFromMutual(url);
                }

                if (!connectionCode) {
                    connectionCode = username;
                }

                return { profileId: connectionCode, username, name, url:currentUrl, imageUrl };
            }
            
            // Check if it's a messaging thread
            if (currentUrl.includes('messaging/thread')) {
                const profileLink = document.querySelector('.msg-thread__link-to-profile');
                const name = document.querySelector('#thread-detail-jump-target').textContent.trim();
                if (!profileLink) return null;
                const activeConvo = document.querySelector('.msg-conversations-container__convo-item-link--active');
                const img = activeConvo?.querySelector('img')?.src || null;
                
                const url = profileLink.href;
                if (!url) return null;
                
                const id = this.extractProfileId(url);
                if (!id) return null;
                
                return { 
                    profileId: id,
                    url: url,
                    name,
                    username: null,
                    imageUrl:img,
                };
            }
            
            return null;

        } catch (error) {
            window.show_error('Unable to retrieve profile information. Please try again.', 3000);
            console.error(error);
            return null;
        }
    }
}

class LabelProfileNotes {
    constructor() {
        this.currentProfileInfo = null;
        this.noteBox = null;
        this.currentNotes = [];
        this.selectedNoteIndex = 0;
        this.initialNoteText = '';
        this.status = 'in_progress';
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
        this.notesDatabaseListener = this.notesDatabaseListener.bind(this);
    }

    notesDatabaseListener(data) {
        if (data && data.status !== this.status) {
            this.status = data.status;
            // If the note box is open, update its content based on the new status
            if (this.noteBox && this.noteBox.container.parentNode) {
                this.updateNoteBoxContent();
            }
        }
    }

    injectStyles() {
        if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Poppins"]')) {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
        }
    }

    createNoteBox() {
        this.injectStyles();
        
        const box = document.createElement('div');
        box.className = 'note-box-container';

        // Initial content will be updated based on status
        this.noteBox = {
            container: box,
            textarea: null,
            saveBtn: null,
            noteTabs: null
        };

        this.updateNoteBoxContent();

        return box;
    }
    
    createNoteTabs() {
        if (!this.currentNotes || this.currentNotes.length <= 0) {
            return null;
        }
        
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'note-tabs-container';
        
        this.currentNotes.forEach((note, index) => {
            const tab = document.createElement('div');
            tab.className = `note-tab ${index === this.selectedNoteIndex ? 'note-tab-active' : ''}`;
            
            // Create icon based on note type (owned or shared)
            const isShared = note.metadata && note.metadata.type === 'shared';
            const tabIcon = document.createElement('span');
            tabIcon.className = 'note-tab-icon';
            
            if (isShared) {
                tabIcon.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4C12 5.10457 11.1046 6 10 6C8.89543 6 8 5.10457 8 4C8 2.89543 8.89543 2 10 2C11.1046 2 12 2.89543 12 4Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M6 8C6 9.10457 5.10457 10 4 10C2.89543 10 2 9.10457 2 8C2 6.89543 2.89543 6 4 6C5.10457 6 6 6.89543 6 8Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M12 12C12 13.1046 11.1046 14 10 14C8.89543 14 8 13.1046 8 12C8 10.8954 8.89543 10 10 10C11.1046 10 12 10.8954 12 12Z" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M5.5 7L9 5" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M5.5 9L9 11" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                `;
            } else {
                tabIcon.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 13H2.33333C1.97971 13 1.64057 12.8595 1.39052 12.6095C1.14048 12.3594 1 12.0203 1 11.6667V2.33333C1 1.97971 1.14048 1.64057 1.39052 1.39052C1.64057 1.14048 1.97971 1 2.33333 1H9.66667L13 4.33333V11.6667C13 12.0203 12.8595 12.3594 12.6095 12.6095C12.3594 12.8595 12.0203 13 11.6667 13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9.66667 1V4.33333H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
            }
            
            const tabLabel = document.createElement('span');
            tabLabel.className = 'note-tab-label';
            
            if (isShared) {
                tabLabel.textContent = `Shared by ${note.metadata.sharedByName || 'teammate'}`;
            } else {
                tabLabel.textContent = 'My Note';
            }
            
            tab.appendChild(tabIcon);
            tab.appendChild(tabLabel);
            
            tab.addEventListener('click', () => {
                this.selectedNoteIndex = index;
                this.updateNoteBoxContent();
            });
            
            tabsContainer.appendChild(tab);
        });
        
        return tabsContainer;
    }
    
    createSharedNote(note) {
        if (!note.metadata || note.metadata.type !== 'shared') {
            return null;
        }
        
        const sharedContainer = document.createElement('div');
        sharedContainer.className = 'note-shared-container';
        
        const sharedHeader = document.createElement('div');
        sharedHeader.className = 'note-shared-header';
        
        const sharedIcon = document.createElement('span');
        sharedIcon.className = 'note-shared-icon';
        sharedIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4C12 5.10457 11.1046 6 10 6C8.89543 6 8 5.10457 8 4C8 2.89543 8.89543 2 10 2C11.1046 2 12 2.89543 12 4Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M6 8C6 9.10457 5.10457 10 4 10C2.89543 10 2 9.10457 2 8C2 6.89543 2.89543 6 4 6C5.10457 6 6 6.89543 6 8Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M12 12C12 13.1046 11.1046 14 10 14C8.89543 14 8 13.1046 8 12C8 10.8954 8.89543 10 10 10C11.1046 10 12 10.8954 12 12Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5.5 7L9 5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M5.5 9L9 11" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        `;
        
        const sharedInfo = document.createElement('div');
        sharedInfo.className = 'note-shared-info';
        
        const sharedBy = document.createElement('div');
        sharedBy.className = 'note-shared-by';
        sharedBy.innerHTML = `<span>Shared by </span><strong>${note.metadata.sharedByName || 'a teammate'}</strong>`;
        
        const permissionInfo = document.createElement('div');
        permissionInfo.className = 'note-permission-info';
        permissionInfo.textContent = note.metadata.permission === 'edit' ? 'You can edit this note' : 'Read only';
        
        sharedInfo.appendChild(sharedBy);
        sharedInfo.appendChild(permissionInfo);
        
        sharedHeader.appendChild(sharedIcon);
        sharedHeader.appendChild(sharedInfo);
        
        sharedContainer.appendChild(sharedHeader);
        
        return sharedContainer;
    }
    
    updateNoteBoxContent() {
        if (!this.noteBox || !this.noteBox.container) return;
        
        const container = this.noteBox.container;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Display content based on status
        switch (this.status) {
            case 'in_progress':
                container.innerHTML = `
                    <div class="note-loading-container">
                        <div class="note-loading-spinner"></div>
                        <div class="note-loading-text">Loading your notes...</div>
                    </div>
                `;
                break;
                
            case 'logged_out':
                container.innerHTML = `
                    <div class="note-login-container">
                        <div class="note-login-message">Please login through the extension to access your notes</div>
                        <button class="note-login-button">Login</button>
                    </div>
                `;
                
                // Add event listener to the login button
                setTimeout(() => {
                    const loginButton = container.querySelector('.note-login-button');
                    if (loginButton) {
                        loginButton.addEventListener('click', () => {
                            chrome.runtime.sendMessage({ type: 'HYPER_TALENT_LOGGIN' });
                        });
                    }
                }, 0);
                break;
                
            case 'logged_in':
                // Create regular note UI
                const header = document.createElement('div');
                header.className = 'note-box-header';

                const titleContainer = document.createElement('div');
                titleContainer.className = 'note-title-container';

                const noteIcon = document.createElement('span');
                noteIcon.className = 'note-icon';
                noteIcon.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.6667 13.3333H3.33333C2.97971 13.3333 2.64057 13.1928 2.39052 12.9428C2.14048 12.6927 2 12.3536 2 12V4C2 3.64638 2.14048 3.30724 2.39052 3.05719C2.64057 2.80714 2.97971 2.66667 3.33333 2.66667H10.6667L14 6V12C14 12.3536 13.8595 12.6927 13.6095 12.9428C13.3594 13.1928 13.0203 13.3333 12.6667 13.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10.6667 2.66667V6H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;

                const title = document.createElement('div');
                title.className = 'note-title';

                const titleText = document.createElement('h3');
                titleText.textContent = 'Notes for Profile';
                titleText.className = 'note-title-text';

                const shortcutText = document.createElement('span');
                shortcutText.textContent = '⌘ + S to save';
                shortcutText.className = 'note-shortcut-text';

                const closeBtn = document.createElement('button');
                closeBtn.className = 'note-close-btn';
                closeBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                `;
                closeBtn.onclick = () => this.closeNoteBox();

                title.appendChild(titleText);
                title.appendChild(shortcutText);
                titleContainer.appendChild(noteIcon);
                titleContainer.appendChild(title);
                header.appendChild(titleContainer);
                header.appendChild(closeBtn);
                
                container.appendChild(header);
                
                // Add tabs if there are multiple notes
                if (this.currentNotes.length > 1) {
                    const tabsContainer = this.createNoteTabs();
                    if (tabsContainer) {
                        container.appendChild(tabsContainer);
                    }
                }
                
                // Get the current selected note
                const currentNote = this.currentNotes[this.selectedNoteIndex] || null;
                
                // If there's a current note
                if (currentNote) {
                    // Check if it's a shared note
                    const isShared = currentNote.metadata && currentNote.metadata.type === 'shared';
                    const isReadOnly = isShared && currentNote.metadata.permission === 'read';
                    
                    // Add shared note banner for shared notes
                    if (isShared) {
                        const sharedContainer = this.createSharedNote(currentNote);
                        if (sharedContainer) {
                            container.appendChild(sharedContainer);
                        }
                    }
                    
                    // Create textarea for the note content
                    const textarea = document.createElement('textarea');
                    textarea.className = 'note-textarea';
                    textarea.placeholder = 'Write your notes for this profile...';
                    textarea.value = currentNote.note || '';
                    textarea.readOnly = isReadOnly;
                    
                    if (isReadOnly) {
                        textarea.className += ' note-readonly';
                    }
                    
                    container.appendChild(textarea);
                    
                    // Save the initial text value for comparison later
                    this.initialNoteText = textarea.value;
                    
                    // Add button container
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'note-button-container';
                    
                    // Only show save button if note is editable
                    if (!isReadOnly) {
                        const saveBtn = document.createElement('button');
                        saveBtn.className = 'note-save-btn';
                        saveBtn.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.6667 13H2.33333C1.97971 13 1.64057 12.8595 1.39052 12.6095C1.14048 12.3594 1 12.0203 1 11.6667V2.33333C1 1.97971 1.14048 1.64057 1.39052 1.39052C1.64057 1.14048 1.97971 1 2.33333 1H9.66667L13 4.33333V11.6667C13 12.0203 12.8595 12.3594 12.6095 12.6095C12.3594 12.8595 12.0203 13 11.6667 13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9.66667 1V4.33333H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Save Note
                        `;
                        saveBtn.onclick = () => this.saveNote();
                        buttonContainer.appendChild(saveBtn);
                        
                        this.noteBox.saveBtn = saveBtn;
                    }
                    
                    container.appendChild(buttonContainer);
                    
                    // Update reference to textarea
                    this.noteBox.textarea = textarea;
                    
                    // Focus on textarea if it's not read-only
                    if (!isReadOnly) {
                        setTimeout(() => {
                            textarea.focus();
                        }, 10);
                    }
                } else {
                    // Create empty state for new note
                    const textarea = document.createElement('textarea');
                    textarea.className = 'note-textarea';
                    textarea.placeholder = 'Write your notes for this profile...';
                    textarea.value = '';
                    
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'note-button-container';
                    
                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'note-save-btn';
                    saveBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.6667 13H2.33333C1.97971 13 1.64057 12.8595 1.39052 12.6095C1.14048 12.3594 1 12.0203 1 11.6667V2.33333C1 1.97971 1.14048 1.64057 1.39052 1.39052C1.64057 1.14048 1.97971 1 2.33333 1H9.66667L13 4.33333V11.6667C13 12.0203 12.8595 12.3594 12.6095 12.6095C12.3594 12.8595 12.0203 13 11.6667 13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9.66667 1V4.33333H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Save Note
                    `;
                    saveBtn.onclick = () => this.saveNote();
                    buttonContainer.appendChild(saveBtn);
                    
                    container.appendChild(textarea);
                    container.appendChild(buttonContainer);
                    
                    // Update references
                    this.noteBox.textarea = textarea;
                    this.noteBox.saveBtn = saveBtn;
                    
                    // Focus on textarea
                    setTimeout(() => {
                        textarea.focus();
                    }, 10);
                    
                    // Initialize empty text
                    this.initialNoteText = '';
                }
                break;
        }
    }

    async getNotes(profileId) {
        try {
            return await window.notesDatabase.getNotesByProfileId(profileId) || [];
        } catch (error) {
            window.show_error('Unable to load existing notes. Please try again.', 3000);
            console.error('Error fetching notes:', error);
            return [];
        }
    }

    async showNoteBox(profileInfo) {
        this.currentProfileInfo = profileInfo;
        
        // Reset selected note index
        this.selectedNoteIndex = 0;
        
        // Get current status from notesDatabase
        this.status = window.notesDatabase?.status || 'in_progress';
        
        // Add listener for status changes
        window.notesDatabase.addListener(this.notesDatabaseListener);
        
        if (!this.noteBox) {
            const box = this.createNoteBox();
            document.body.appendChild(box);
            // Trigger reflow
            box.offsetHeight;
            // Show with animation
            requestAnimationFrame(() => {
                box.style.opacity = '1';
                box.style.transform = 'translateY(0)';
            });
        } else {
            this.updateNoteBoxContent();
            document.body.appendChild(this.noteBox.container);
            // Trigger reflow
            this.noteBox.container.offsetHeight;
            // Show with animation
            requestAnimationFrame(() => {
                this.noteBox.container.style.opacity = '1';
                this.noteBox.container.style.transform = 'translateY(0)';
            });
        }

        // Only fetch notes and set up interaction if logged in
        if (this.status === 'logged_in') {
            try {
                const notes = await this.getNotes(profileInfo.profileId);
                this.currentNotes = Array.isArray(notes) ? notes : (notes ? [notes] : []);
                
                // Sort notes - owned notes first, then shared notes by shared date
                this.currentNotes.sort((a, b) => {
                    // If one is owned and the other is shared, owned comes first
                    if (a.metadata?.type === 'owned' && b.metadata?.type === 'shared') return -1;
                    if (a.metadata?.type === 'shared' && b.metadata?.type === 'owned') return 1;
                    
                    // If both are shared, sort by shared date (newest first)
                    if (a.metadata?.type === 'shared' && b.metadata?.type === 'shared') {
                        return new Date(b.metadata.sharedAt) - new Date(a.metadata.sharedAt);
                    }
                    
                    // If both are owned, sort by last updated (newest first)
                    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
                });
                
                // Update the note box content with the sorted notes
                this.updateNoteBoxContent();
                
                // Get current note
                const currentNote = this.currentNotes[this.selectedNoteIndex];
                const isReadOnly = currentNote && 
                                  currentNote.metadata && 
                                  currentNote.metadata.type === 'shared' && 
                                  currentNote.metadata.permission === 'read';
                
                // Add keyboard shortcut listener only if the note is editable or there's no note yet
                if (!currentNote || !isReadOnly) {
                    document.addEventListener('keydown', this.handleKeyboardShortcuts);
                }
                
                document.addEventListener('mousedown', this.handleClickOutside);
            } catch (error) {
                window.show_error('Error initializing notes. Please refresh and try again.', 3000);
                console.error(error);
            }
        }
    }

    handleKeyboardShortcuts(event) {
        // Check for Command/Control + S
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            event.preventDefault(); // Prevent browser save dialog
            this.saveNote();
        }
    }

    handleClickOutside(event) {
        if (this.noteBox && !this.noteBox.container.contains(event.target)) {
            const currentNote = this.currentNotes[this.selectedNoteIndex];
            const isReadOnly = currentNote && 
                              currentNote.metadata && 
                              currentNote.metadata.type === 'shared' && 
                              currentNote.metadata.permission === 'read';
            
            if (this.status === 'logged_in' && this.noteBox.textarea && !isReadOnly) {
                const currentText = this.noteBox.textarea.value;
                if (currentText !== this.initialNoteText) {
                    if (confirm('You have unsaved changes. Do you want to save them before closing?')) {
                        this.saveNote();
                    } else {
                        this.closeNoteBox();
                    }
                } else {
                    this.closeNoteBox();
                }
            } else {
                this.closeNoteBox();
            }
        }
    }

    async saveNote() {
        if (this.status !== 'logged_in') {
            window.show_error('You must be logged in to save notes.', 3000);
            return;
        }
        
        if (!this.currentProfileInfo) {
            window.show_error('Unable to save note. Profile information is missing.', 3000);
            return;
        }

        if (!this.noteBox.textarea) {
            window.show_error('Unable to save note. Text area not found.', 3000);
            return;
        }
        
        // Get current note if available
        const currentNote = this.currentNotes[this.selectedNoteIndex];
        
        // Check if the note is read-only
        const isReadOnly = currentNote && 
                          currentNote.metadata && 
                          currentNote.metadata.type === 'shared' && 
                          currentNote.metadata.permission === 'read';
        
        if (isReadOnly) {
            window.show_warning('This note is read-only. You cannot make changes.', 3000);
            return;
        }

        const noteText = this.noteBox.textarea.value.trim();
        
        if (noteText.length === 0) {
            window.show_warning('Cannot save an empty note. Please add some content.', 3000);
            this.noteBox.textarea.focus();
            return;
        }

        if (noteText === this.initialNoteText) {
            window.show_warning('No changes detected in the note.', 3000);
            return;
        }

        try {
            if (currentNote) {
                // Handle based on note type
                if (currentNote.metadata && currentNote.metadata.type === 'shared') {
                    // This is a shared note that the user can edit
                    await window.notesDatabase.updateNote(currentNote.id, noteText);
                    window.show_success('Your changes to the shared note have been saved.', 3000);
                } else {
                    // This is the user's own note
                    await window.notesDatabase.updateNote(currentNote.id, noteText);
                    window.show_success('Your note has been updated.', 3000);
                }
            } else {
                // Create a new note
                await window.notesDatabase.createNote(this.currentProfileInfo.profileId, noteText, this.currentProfileInfo);
                window.show_success('Your new note has been saved.', 3000);
            }
            window.userActionsDatabase?.addAction("notes_saved");

            this.closeNoteBox();
        } catch (error) {
            window.show_error('Unable to save your note. Please try again.', 3000);
            window.userActionsDatabase?.addAction("notes_saved_failed");
            console.error(error);
        }
    }

    closeNoteBox() {
        if (this.noteBox) {
            document.removeEventListener('mousedown', this.handleClickOutside);
            document.removeEventListener('keydown', this.handleKeyboardShortcuts);
            window.notesDatabase.removeListener(this.notesDatabaseListener);
            
            this.noteBox.container.style.opacity = '0';
            this.noteBox.container.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                if (this.noteBox.container.parentNode) {
                    this.noteBox.container.parentNode.removeChild(this.noteBox.container);
                }
            }, 200);
            
            // Reset current notes
            this.currentNotes = [];
            this.selectedNoteIndex = 0;
        }
    }

    handleKeyPress(event) {
        if (event.key === 'n') {
            const activeElement = document.activeElement;
            if (activeElement && 
                (activeElement.tagName === 'INPUT' || 
                 activeElement.tagName === 'TEXTAREA' || 
                 activeElement.isContentEditable)) {
                return;
            }
            
            try {
                const profileInfo = window.profileNotes.getProfileInfo();
                console.log(profileInfo);
                
                if (profileInfo) {
                    this.showNoteBox(profileInfo);
                } else {
                    window.show_error('Unable to access profile information. Please try again.', 3000);
                }
            } catch (error) {
                console.error('Error in handleKeyPress:', error);
                window.show_error('Unable to open notes. Please refresh and try again.', 3000);
            }
        } else if (event.key === 'Escape') {
            this.closeNoteBox();
        }
    }

    initialize() {
        document.addEventListener('keydown', this.handleKeyPress);
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyPress);
        document.removeEventListener('mousedown', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        window.notesDatabase.removeListener(this.notesDatabaseListener);
        this.closeNoteBox();
    }
}

window.profileNotes = new ProfileNotes();
window.labelProfileNotes = new LabelProfileNotes();
window.labelProfileNotes.initialize();
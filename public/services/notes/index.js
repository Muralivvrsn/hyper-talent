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
        this.databaseSubscription = null;
    }

    // Database listener - fixed to properly handle notes
    setupDatabaseListener() {
        // Clear any existing subscription first
        if (this.databaseSubscription) {
            window.notesDatabase.removeListener(this.databaseSubscription);
        }
        // console.log(data)

    
        this.databaseSubscription = window.notesDatabase.addListener((data) => {
            // console.log('Database update received:', data);
    
            // Make sure we have profile info before processing
            if (!this.currentProfileInfo) {
                // console.log('No current profile info, skipping update');
                return;
            }
            // Handle notes updates
            if (data && data.type === 'status') {
                this.status = data.status;
            }
            // console.log('notes udpating')
            if (data && data.notes) {
                // console.log('Notes update received');
    
                // Get the correct profile ID from current profile
                const profileId = this.currentProfileInfo.profile_id;
                // console.log('Current profile ID:', profileId);
    
                if (!profileId) {
                    // console.log('No profile ID available');
                    return;
                }
    
                // Convert to array and filter for current profile
                const profileNotes = Object.entries(data.notes)
                    .map(([noteId, noteData]) => {
                        return {
                            id: noteId,
                            note: noteData.note,
                            lastUpdated: noteData.lastUpdated || new Date().toISOString(),
                            metadata: noteData.metadata || { type: 'owned' },
                            profileId: noteData.profileId
                        };
                    })
                    .filter(note => note.profileId === profileId);
    
                // console.log('Filtered notes:', profileNotes);
    
                // Create a new array to ensure change detection
                if (profileNotes.length > 0) {
                    this.currentNotes = [...profileNotes];
                } else {
                    // If no notes found for this profile, ensure at least one empty owned note
                    this.currentNotes = [{
                        id: null,
                        note: '',
                        lastUpdated: new Date().toISOString(),
                        metadata: { type: 'owned' },
                        profileId: profileId
                    }];
                }
    
                // Use setTimeout to ensure this runs after current execution completes
                setTimeout(() => {
                    this.updateNoteBoxContent();
                }, 0);
            }
        });
    
        // console.log('Database listener set up');
    }

    // Fetches notes for a profile
    async getNotes(profileId) {
        try {
            return await window.notesDatabase.getNotesByProfileId(profileId) || [];
        } catch (error) {
            // console.error('Error fetching notes:', error);
            window.show_error('Unable to load existing notes. Please try again.', 3000);
            return [];
        }
    }

    // Load font styles
    injectStyles() {
        if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Poppins"]')) {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
        }
    }

    // Creates the note box UI
    createNoteBox() {
        this.injectStyles();
        const box = document.createElement('div');
        box.className = 'note-box-container';

        this.noteBox = {
            container: box,
            textarea: null,
            saveBtn: null,
            noteTabs: null
        };

        this.updateNoteBoxContent();
        return box;
    }

    // Update the note box content based on current state
    updateNoteBoxContent() {
        if (!this.noteBox || !this.noteBox.container) return;

        // console.log(this.status)

        const container = this.noteBox.container;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }


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
                // Create the modern header
                const header = document.createElement('div');
                header.className = 'note-box-header';

                // Title section with emojis
                const titleContainer = document.createElement('div');
                titleContainer.className = 'note-title-container';

                // Fixed header text
                const leftEmojiContainer = document.createElement('div');
                leftEmojiContainer.className = 'emoji-container left';
                leftEmojiContainer.textContent = '✏️';

                const titleText = document.createElement('h3');
                titleText.className = 'note-title-text';
                titleText.textContent = `${this.currentProfileInfo?.name}'s Memory Vault`;

                const rightEmojiContainer = document.createElement('div');
                rightEmojiContainer.className = 'emoji-container right';
                rightEmojiContainer.textContent = '';

                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'note-close-btn';
                closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 1L13 13M13 1L1 13"></path></svg>`;
                closeBtn.onclick = () => this.closeNoteBox();

                // Button container
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'note-button-container';
                buttonContainer.appendChild(closeBtn);

                // Assemble the header
                titleContainer.appendChild(leftEmojiContainer);
                titleContainer.appendChild(titleText);
                titleContainer.appendChild(rightEmojiContainer);

                header.appendChild(titleContainer);
                header.appendChild(buttonContainer);
                container.appendChild(header);

                // Create tabs container
                const tabsContainer = document.createElement('div');
                tabsContainer.className = 'note-tabs-container';

                // Separate owned and shared notes
                const ownedNotes = this.currentNotes.filter(note =>
                    !note.metadata || note.metadata.type === 'owned'
                );
                const sharedNotes = this.currentNotes.filter(note =>
                    note.metadata && note.metadata.type === 'shared'
                );

                // Ensure there's at least one owned note
                if (ownedNotes.length === 0) {
                    ownedNotes.push({
                        id: null,
                        note: '',
                        metadata: { type: 'owned' }
                    });
                }

                // My Notes tab - make it wider
                const myNotesTab = document.createElement('div');
                myNotesTab.className = `note-tab ${this.selectedNoteIndex === 0 ? 'note-tab-active' : ''}`;
                myNotesTab.style.flex = '1';
                myNotesTab.style.justifyContent = 'center';
                myNotesTab.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>My Notes</span>
                `;
                myNotesTab.onclick = () => {
                    this.selectedNoteIndex = 0;
                    this.updateNoteBoxContent();
                };
                tabsContainer.appendChild(myNotesTab);

                // Shared tab - always show even if no shared notes yet
                const sharedTab = document.createElement('div');
                sharedTab.className = `note-tab ${this.selectedNoteIndex === 1 ? 'note-tab-active' : ''}`;
                sharedTab.style.flex = '1';
                sharedTab.style.justifyContent = 'center';

                sharedTab.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                    <span>Shared ( ${sharedNotes.length} )</span>
                `;

                sharedTab.onclick = () => {
                    this.selectedNoteIndex = 1;
                    this.updateNoteBoxContent();
                };

                tabsContainer.appendChild(sharedTab);
                container.appendChild(tabsContainer);

                // Notes content - maintain consistent height
                const contentArea = document.createElement('div');
                contentArea.className = 'note-content-area';

                // Handle content based on selected tab
                if (this.selectedNoteIndex === 0) {
                    // My Notes tab
                    const currentNote = ownedNotes[0];

                    // Create textarea
                    const textarea = document.createElement('textarea');
                    textarea.className = 'note-textarea';
                    textarea.placeholder = 'Write your notes for this profile...';
                    textarea.value = currentNote?.note || '';

                    contentArea.appendChild(textarea);

                    this.noteBox.textarea = textarea;
                    this.initialNoteText = textarea.value;

                    // Focus the textarea
                    setTimeout(() => textarea.focus(), 10);
                } else {
                    // Shared tab
                    if (sharedNotes.length === 0) {
                        // No shared notes
                        const emptyState = document.createElement('div');
                        emptyState.className = 'empty-state';

                        const emptyIcon = document.createElement('div');
                        emptyIcon.innerHTML = `
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        `;
                        emptyIcon.style.marginBottom = '10px';
                        emptyIcon.style.opacity = '0.5';

                        const emptyText = document.createElement('p');
                        emptyText.textContent = 'No shared notes yet';
                        emptyText.style.fontSize = '14px';
                        emptyText.style.margin = '0';

                        emptyState.appendChild(emptyIcon);
                        emptyState.appendChild(emptyText);
                        contentArea.appendChild(emptyState);
                    } else {
                        // Show list of shared notes
                        const sharedList = document.createElement('div');
                        sharedList.style.overflow = 'auto';
                        sharedList.style.flex = '1';

                        sharedNotes.forEach((note, index) => {
                            const sharedItem = document.createElement('div');
                            sharedItem.className = 'shared-note-item';

                            // Shared user info
                            const userInfo = document.createElement('div');
                            userInfo.style.display = 'flex';
                            userInfo.style.alignItems = 'center';
                            userInfo.style.gap = '8px';
                            userInfo.style.marginBottom = '4px';

                            const avatar = document.createElement('div');
                            avatar.className = 'note-avatar';

                            // Get initials from the name
                            const sharedByName = note.metadata?.sharedByName || 'Team';
                            const initials = sharedByName
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2);

                            avatar.textContent = initials;

                            const userName = document.createElement('span');
                            userName.textContent = sharedByName;
                            userName.style.fontWeight = '500';
                            userName.style.fontSize = '14px';

                            userInfo.appendChild(avatar);
                            userInfo.appendChild(userName);

                            // Note preview
                            const preview = document.createElement('div');
                            preview.textContent = note.note
                                ? (note.note.length > 100 ? note.note.substring(0, 100) + '...' : note.note)
                                : 'No content';
                            preview.style.fontSize = '13px';
                            preview.style.color = '#718096';
                            preview.style.marginLeft = '32px'; // Align with username

                            sharedItem.appendChild(userInfo);
                            sharedItem.appendChild(preview);

                            // Make item clickable to view shared note
                            sharedItem.onclick = () => {
                                // Show the shared note in read-only mode
                                contentArea.innerHTML = '';

                                // Shared note header
                                const noteHeader = document.createElement('div');
                                noteHeader.className = 'shared-note-header';

                                // User info
                                const headerUserInfo = document.createElement('div');
                                headerUserInfo.style.display = 'flex';
                                headerUserInfo.style.alignItems = 'center';
                                headerUserInfo.style.gap = '8px';

                                const headerAvatar = avatar.cloneNode(true);
                                const headerUserName = document.createElement('span');
                                headerUserName.textContent = sharedByName;
                                headerUserName.style.fontWeight = '500';

                                headerUserInfo.appendChild(headerAvatar);
                                headerUserInfo.appendChild(headerUserName);

                                // Read-only badge
                                const readOnlyBadge = document.createElement('div');
                                readOnlyBadge.className = 'read-only-badge';

                                const lockIcon = document.createElement('span');
                                lockIcon.innerHTML = `
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                `;

                                const readOnlyText = document.createElement('span');
                                readOnlyText.textContent = 'Read-only';

                                readOnlyBadge.appendChild(lockIcon);
                                readOnlyBadge.appendChild(readOnlyText);

                                noteHeader.appendChild(headerUserInfo);
                                noteHeader.appendChild(readOnlyBadge);

                                // Note content
                                const noteContent = document.createElement('div');
                                noteContent.textContent = note.note || 'No content';
                                noteContent.className = 'note-content';

                                // Back button
                                const backBtn = document.createElement('div');
                                backBtn.className = 'shared-back-button';

                                backBtn.innerHTML = `
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="19" y1="12" x2="5" y2="12"></line>
                                        <polyline points="12 19 5 12 12 5"></polyline>
                                    </svg>
                                    Back to shared notes
                                `;

                                backBtn.onmouseover = () => {
                                    backBtn.style.backgroundColor = '#edf2f7';
                                };
                                backBtn.onmouseout = () => {
                                    backBtn.style.backgroundColor = '#f7fafc';
                                };

                                backBtn.onclick = () => {
                                    this.updateNoteBoxContent(); // Refresh to show the list again
                                };

                                contentArea.appendChild(noteHeader);
                                contentArea.appendChild(noteContent);
                                contentArea.appendChild(backBtn);
                            };

                            sharedList.appendChild(sharedItem);
                        });

                        contentArea.appendChild(sharedList);
                    }
                }

                container.appendChild(contentArea);

                // Action bar (only for My Notes tab)
                if (this.selectedNoteIndex === 0) {
                    const actionBar = document.createElement('div');
                    actionBar.className = 'note-action-bar';

                    const shortcutHint = document.createElement('div');
                    shortcutHint.className = 'note-shortcut-hint';
                    shortcutHint.innerHTML = `<span style="font-weight: 500; color: #2d3748;">⌘ + S</span> to save`;

                    const saveBtn = document.createElement('button');
                    saveBtn.className = 'note-save-btn';

                    saveBtn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span class="save-btn-text">Save Note</span>
                    `;

                    saveBtn.onclick = () => {
                        // Update button state to "Saving..."
                        const btnTextEl = saveBtn.querySelector('.save-btn-text');
                        if (btnTextEl) {
                            btnTextEl.textContent = 'Saving...';
                        }
                        saveBtn.disabled = true;
                        saveBtn.style.opacity = '0.7';
                        saveBtn.style.cursor = 'not-allowed';

                        // Call save method
                        this.saveNote();
                    };

                    actionBar.appendChild(shortcutHint);
                    actionBar.appendChild(saveBtn);
                    container.appendChild(actionBar);

                    this.noteBox.saveBtn = saveBtn;
                }

                // Add last edited info in footer
                const footer = document.createElement('div');
                footer.className = 'note-footer';

                const lastEditedInfo = document.createElement('div');
                lastEditedInfo.className = 'note-last-edited';

                // Create avatar for current user or note owner
                const footerAvatar = document.createElement('div');
                footerAvatar.className = 'note-avatar small';

                // Get profile initials
                const profileName = this.currentProfileInfo?.name || 'User';
                const profileInitials = profileName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);

                footerAvatar.textContent = profileInitials;

                const lastEditedText = document.createElement('span');
                const currentNote = this.currentNotes[this.selectedNoteIndex];
                lastEditedText.textContent = `Last edited: ${this.formatTimeAgo(currentNote?.lastUpdated)}`;

                lastEditedInfo.appendChild(footerAvatar);
                lastEditedInfo.appendChild(lastEditedText);

                footer.appendChild(lastEditedInfo);
                container.appendChild(footer);
                break;
        }
    }

    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Just now';

        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // Show the note box
    // Show the note box with improved profile ID handling
    async showNoteBox() {
        try {
            // Get profile info using the window.labelManagerUtils helper
            const profileInfo = await window.labelManagerUtils.getProfileInfo();
            // console.log('Retrieved profile info:', profileInfo);

            if (!profileInfo || !profileInfo.profile_id) {
                // console.error('Invalid profile info:', profileInfo);
                window.show_error('Unable to access profile information.', 3000);
                return;
            }

            this.currentProfileInfo = profileInfo;

            // Get current status
            this.status = window.notesDatabase?.status || 'in_progress';
            // console.log('Current status:', this.status);

            // Setup database listener now that we have profile info
            this.setupDatabaseListener();

            // Try to get notes
            try {
                // console.log('Fetching notes for profile ID:', this.currentProfileInfo.profile_id);
                const notes = await this.getNotes(this.currentProfileInfo.profile_id);
                // console.log('Retrieved notes:', notes);

                this.currentNotes = Array.isArray(notes) ? notes : (notes ? [notes] : []);

                // Ensure there's at least one owned note
                if (!this.currentNotes.some(note => !note.metadata || note.metadata.type === 'owned')) {
                    // console.log('No owned notes found, adding empty note');
                    this.currentNotes.unshift({
                        id: null,
                        note: '',
                        lastUpdated: new Date().toISOString(),
                        metadata: { type: 'owned' },
                        profileId: this.currentProfileInfo.profile_id
                    });
                }
            } catch (error) {
                // console.error('Error loading notes:', error);

                // If notes fail to load, ensure we have at least one empty note
                this.currentNotes = [{
                    id: null,
                    note: '',
                    lastUpdated: new Date().toISOString(),
                    metadata: { type: 'owned' },
                    profileId: this.currentProfileInfo.profile_id
                }];
            }

            // Reset selected note index
            this.selectedNoteIndex = 0;

            // Create or update note box
            if (!this.noteBox) {
                const box = this.createNoteBox();
                document.body.appendChild(box);
                // Trigger reflow and show with animation
                box.offsetHeight;
                requestAnimationFrame(() => {
                    box.style.opacity = '1';
                    box.style.transform = 'translateY(0)';
                });
            } else {
                this.updateNoteBoxContent();
                document.body.appendChild(this.noteBox.container);
                // Trigger reflow and show with animation
                this.noteBox.container.offsetHeight;
                requestAnimationFrame(() => {
                    this.noteBox.container.style.opacity = '1';
                    this.noteBox.container.style.transform = 'translateY(0)';
                });
            }

            // Add event listeners
            document.addEventListener('mousedown', this.handleClickOutside);
            document.addEventListener('keydown', this.handleKeyboardShortcuts);
        } catch (error) {
            // console.error('Error in showNoteBox:', error);
            window.show_error('Unable to display notes. Please try again.', 3000);
        }
    }

    // Handle keyboard shortcuts (Cmd/Ctrl + S)
    handleKeyboardShortcuts(event) {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
            event.preventDefault();
            this.saveNote();
        }
    }

    // Handle clicking outside the note box
    handleClickOutside(event) {
        if (this.noteBox && !this.noteBox.container.contains(event.target)) {
            if (this.status === 'logged_in' && this.noteBox.textarea) {
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

    // Save note with improved error handling and profile ID checks
    async saveNote() {
        if (this.status !== 'logged_in') {
            // console.log('Cannot save note: Not logged in');
            window.show_error('You must be logged in to save notes.', 3000);
            this.resetSaveButton();
            return;
        }

        if (!this.currentProfileInfo || !this.currentProfileInfo.profile_id) {
            // console.error('Cannot save note: No profile info or ID');
            window.show_error('Unable to save note. Profile information is missing.', 3000);
            this.resetSaveButton();
            return;
        }

        if (!this.noteBox || !this.noteBox.textarea) {
            // console.error('Cannot save note: No textarea found');
            window.show_error('Unable to save note. Text area not found.', 3000);
            this.resetSaveButton();
            return;
        }

        // Get current note if available
        const ownedNotes = this.currentNotes.filter(note =>
            !note.metadata || note.metadata.type === 'owned'
        );

        const currentNote = ownedNotes[0];
        const noteText = this.noteBox.textarea.value.trim();

        // console.log('Current note:', currentNote);
        // console.log('Note text to save:', noteText);

        if(noteText && currentNote.note){
            if(noteText.trim()===currentNote.note.trim()){
                window.show_warning('⚠️ No changes detected. Are you sure you want to save? 🤔', 3000);
                this.resetSaveButton();
                return;
            }
        }

        if (noteText.length === 0) {
            // console.log('Cannot save empty note');
            window.show_warning('🚫 Cannot save an empty note! Add some content, pretty please. 📝✍️', 3000);
            this.noteBox.textarea.focus();
            this.resetSaveButton();
            return;
        }

        try {
            // console.log(`Saving note for profile ID: ${this.currentProfileInfo.profile_id}`);

            if (currentNote && currentNote.id) {
                // console.log(`Updating existing note with ID: ${currentNote.id}`);
                await window.notesDatabase.updateNote(currentNote.id, noteText);
                // window.show_success('Your note has been updated.', 3000);
            } else {
                // console.log('Creating new note');
                await window.notesDatabase.createNote(
                    this.currentProfileInfo.profile_id,
                    noteText,
                    this.currentProfileInfo
                );
                // window.show_success('Your new note has been saved.', 3000);
            }

            window.userActionsDatabase?.addAction("notes_saved");
            // this.closeNoteBox();
        } catch (error) {
            // console.error('Error saving note:', error);
            window.show_error('Unable to save your note. Please try again.', 3000);
            window.userActionsDatabase?.addAction("notes_saved_failed");
            this.resetSaveButton();
        }
    }

    // Reset save button state
    resetSaveButton() {
        if (this.noteBox && this.noteBox.saveBtn) {
            const btnTextEl = this.noteBox.saveBtn.querySelector('.save-btn-text');
            if (btnTextEl) {
                btnTextEl.textContent = 'Save Note';
            }
            this.noteBox.saveBtn.disabled = false;
            this.noteBox.saveBtn.style.opacity = '1';
            this.noteBox.saveBtn.style.cursor = 'pointer';
        }
    }

    // Close the note box
    closeNoteBox() {
        if (this.databaseSubscription) {
            window.notesDatabase.removeListener(this.databaseSubscription);
            this.databaseSubscription = null;
        }

        if (this.noteBox) {
            document.removeEventListener('mousedown', this.handleClickOutside);
            document.removeEventListener('keydown', this.handleKeyboardShortcuts);

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

    // Handle keyboard press events
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
                this.showNoteBox();
            } catch (error) {
                // console.error('Error in handleKeyPress:', error);
                window.show_error('Unable to open notes. Please refresh and try again.', 3000);
            }
        } else if (event.key === 'Escape') {
            this.closeNoteBox();
        }
    }

    // Initialize the component
    initialize() {
        document.addEventListener('keydown', this.handleKeyPress);
        console.log('LabelProfileNotes initialized');
    }

    // Clean up
    destroy() {
        document.removeEventListener('keydown', this.handleKeyPress);
        document.removeEventListener('mousedown', this.handleClickOutside);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        if (this.databaseSubscription) {
            window.notesDatabase.removeListener(this.databaseSubscription);
        }
        this.closeNoteBox();
    }
}

window.labelProfileNotes = new LabelProfileNotes();
window.labelProfileNotes.initialize();
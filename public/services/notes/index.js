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

                return { profileId: connectionCode, username, name, url: currentUrl, imageUrl };
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
                    imageUrl: img,
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
        this.isLoading = false;
        this.hasError = false;
        this.databaseSubscription = null;
    }

    // 1. First fix the setupDatabaseListener to properly handle notes
    setupDatabaseListener() {
        this.databaseSubscription = window.notesDatabase.addListener((data) => {
            if (!this.currentProfileInfo || !data.notes) return;
            console.log(data)
    
            // Convert data.notes object into array and filter for current profileId
            const allNotes = Object.entries(data.notes)
                .map(([noteId, noteData]) => ({
                    id: noteId,
                    note: noteData.note,
                    lastUpdated: noteData.lastUpdated,
                    metadata: {
                        createdAt: noteData.metadata.createdAt,
                        type: noteData.metadata.type || 'owned',
                        sharedByName: noteData.metadata.sharedByName,
                        permission: noteData.metadata.permission
                    },
                    profileId: noteData.profileId
                }))
                // Only show notes for current profile
                .filter(note => note.profileId === this.currentProfileInfo.profileId);
    
                console.log(this.currentProfileInfo?.profileId)
                console.log(allNotes)
            // Update currentNotes with the filtered notes
            this.currentNotes = allNotes;
            this.updateNoteBoxContent();
        });
    }

    // 2. Fix refreshNotes to properly handle notes
    async refreshNotes(profileId) {
        this.isLoading = true;
        this.updateNoteBoxContent();

        try {
            const notes = await this.getNotes(profileId);

            // Separate owned and shared notes
            const ownedNotes = notes.filter(note =>
                !note.metadata || note.metadata.type === 'owned'
            );

            const sharedNotes = notes.filter(note =>
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

            this.currentNotes = [...ownedNotes, ...sharedNotes];
        } catch (error) {
            this.hasError = true;
            console.error('Error refreshing notes:', error);
        } finally {
            this.isLoading = false;
            this.updateNoteBoxContent();
        }
    }
    // Update the notesDatabaseListener method to be more specific
    notesDatabaseListener(data) {
        // Only handle status changes here - other events are handled in setupDatabaseListener
        if (data && data.type === 'status' && data.status !== this.status) {
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

    // Inside the footer part of updateNoteBoxContent, replace the lastEditedText line with:

    updateNoteBoxContent() {
        if (!this.noteBox || !this.noteBox.container) return;

        const container = this.noteBox.container;
        container.innerHTML = '';

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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                    </svg>
                    <span>Shared</span>
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

                            // Add hover effect
                            sharedItem.onmouseover = () => {
                                sharedItem.style.backgroundColor = '#f7fafc';
                            };
                            sharedItem.onmouseout = () => {
                                sharedItem.style.backgroundColor = '';
                            };

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

                                // Back button
                                const backBtn = document.createElement('div');

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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span class="save-btn-text">Save Note</span>
                    `;

                    saveBtn.onmouseover = () => {
                        if (!saveBtn.disabled) {
                            saveBtn.style.backgroundColor = '#6b46c1';
                        }
                    };
                    saveBtn.onmouseout = () => {
                        if (!saveBtn.disabled) {
                            saveBtn.style.backgroundColor = '#805ad5';
                        }
                    };

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

                // In updateNoteBoxContent
                const lastEditedText = document.createElement('span');
                console.log(this.currentNotes)
                const currentNote = this.currentNotes[this.selectedNoteIndex];
                console.log(currentNote)
                lastEditedText.textContent = `Last edited: ${this.formatTimeAgo(currentNote?.lastUpdated || this.currentProfileInfo?.lastUpdated)}`;

                lastEditedInfo.appendChild(footerAvatar);
                lastEditedInfo.appendChild(lastEditedText);

                // const autoSaveText = document.createElement('div');
                // autoSaveText.className = 'note-autosave-text';
                // autoSaveText.textContent = 'Auto-saved';

                footer.appendChild(lastEditedInfo);
                // footer.appendChild(autoSaveText);

                container.appendChild(footer);
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
        this.setupDatabaseListener(); // Setup real-time updates
        await this.refreshNotes(profileInfo.profileId);

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
            this.resetSaveButton();
            return;
        }

        if (!this.currentProfileInfo) {
            window.show_error('Unable to save note. Profile information is missing.', 3000);
            this.resetSaveButton();
            return;
        }

        if (!this.noteBox.textarea) {
            window.show_error('Unable to save note. Text area not found.', 3000);
            this.resetSaveButton();
            return;
        }

        // Get current note if available
        const currentNote = this.currentNotes[this.selectedNoteIndex];

        // Check if the note is read-only (shouldn't happen for My Notes tab)
        const isReadOnly = currentNote &&
            currentNote.metadata &&
            currentNote.metadata.type === 'shared' &&
            currentNote.metadata.permission === 'read';

        if (isReadOnly) {
            window.show_warning('This note is read-only. You cannot make changes.', 3000);
            this.resetSaveButton();
            return;
        }

        const noteText = this.noteBox.textarea.value.trim();

        if (noteText.length === 0) {
            window.show_warning('Cannot save an empty note. Please add some content.', 3000);
            this.noteBox.textarea.focus();
            this.resetSaveButton();
            return;
        }

        if (noteText === this.initialNoteText) {
            window.show_warning('No changes detected in the note.', 3000);
            this.resetSaveButton();
            return;
        }

        try {
            if (currentNote && !isReadOnly) {
                // This is a note we can edit
                await window.notesDatabase.updateNote(currentNote.id, noteText);
                window.show_success('Your note has been updated.', 3000);
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
            this.resetSaveButton();
        }
    }

    // Helper method to reset save button state
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

    closeNoteBox() {
        if (this.databaseSubscription) {
            window.notesDatabase.removeListener(this.databaseSubscription);
            this.databaseSubscription = null;
        }
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
                console.log('profile info')
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
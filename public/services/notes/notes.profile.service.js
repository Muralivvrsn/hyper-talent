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
                let connectionCode = this.extractConnectionCode(url);

                if (!connectionCode) {
                    connectionCode = this.extractConnectionCodeFromMutual(url);
                }

                if (!connectionCode) {
                    connectionCode = username;
                }

                return { profileId: connectionCode, username };
            }
            
            // Check if it's a messaging thread
            if (currentUrl.includes('messaging/thread')) {
                const profileLink = document.querySelector('.msg-thread__link-to-profile');
                if (!profileLink) return null;
                
                const url = profileLink.href;
                if (!url) return null;
                
                const id = this.extractProfileId(url);
                if (!id) return null;
                // console.log(id)
                return { 
                    profileId: id,
                    username: null
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

// [Previous ProfileNotes class remains the same]

// [Previous ProfileNotes class remains the same]

class LabelProfileNotes {
    constructor() {
        this.currentProfileInfo = null;
        this.noteBox = null;
        this.currentNote = null;
        this.initialNoteText = '';
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
    }

    createNoteBox() {
        const fontLink = document.createElement('link');
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
        
        const box = document.createElement('div');
        box.className = 'note-box-container';
        box.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FFFFFF;
            color: #000000;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.08);
            z-index: 10000;
            width: 400px;
            font-family: 'Poppins', sans-serif;
            font-size: 13px;
            border: 1px solid #E5E7EB;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.2s ease, transform 0.2s ease;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            gap: 12px;
        `;

        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

        const noteIcon = document.createElement('span');
        noteIcon.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
        `;
        noteIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.6667 13.3333H3.33333C2.97971 13.3333 2.64057 13.1928 2.39052 12.9428C2.14048 12.6927 2 12.3536 2 12V4C2 3.64638 2.14048 3.30724 2.39052 3.05719C2.64057 2.80714 2.97971 2.66667 3.33333 2.66667H10.6667L14 6V12C14 12.3536 13.8595 12.6927 13.6095 12.9428C13.3594 13.1928 13.0203 13.3333 12.6667 13.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10.6667 2.66667V6H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
        `;

        const titleText = document.createElement('h3');
        titleText.textContent = 'Notes for Profile';
        titleText.style.cssText = `
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #000000;
            line-height: 1;
        `;

        const shortcutText = document.createElement('span');
        shortcutText.textContent = '⌘ + S to save';
        shortcutText.style.cssText = `
            font-size: 11px;
            color: #6B7280;
            font-weight: 400;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: #6B7280;
            border-radius: 4px;
            line-height: 0;
            transition: color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        `;
        closeBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
        `;
        closeBtn.onmouseover = () => closeBtn.style.color = '#000000';
        closeBtn.onmouseout = () => closeBtn.style.color = '#6B7280';
        closeBtn.onclick = () => this.closeNoteBox();

        const textarea = document.createElement('textarea');
        textarea.style.cssText = `
            width: 100%;
            min-height: 160px;
            padding: 12px;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            margin-bottom: 16px;
            font-size: 13px;
            resize: vertical;
            font-family: 'Poppins', sans-serif;
            line-height: 1.5;
            color: #000000;
            background: #FFFFFF;
            transition: border-color 0.2s ease;
        `;
        textarea.placeholder = 'Write your notes for this profile...';
        textarea.onfocus = () => textarea.style.borderColor = '#000000';
        textarea.onblur = () => textarea.style.borderColor = '#E5E7EB';

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        `;

        const saveBtn = document.createElement('button');
        saveBtn.style.cssText = `
            background: #000000;
            color: #FFFFFF;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            font-family: 'Poppins', sans-serif;
            transition: background-color 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            height: 32px;
            line-height: 1;
        `;
        saveBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.6667 13H2.33333C1.97971 13 1.64057 12.8595 1.39052 12.6095C1.14048 12.3594 1 12.0203 1 11.6667V2.33333C1 1.97971 1.14048 1.64057 1.39052 1.39052C1.64057 1.14048 1.97971 1 2.33333 1H9.66667L13 4.33333V11.6667C13 12.0203 12.8595 12.3594 12.6095 12.6095C12.3594 12.8595 12.0203 13 11.6667 13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.66667 1V4.33333H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Save Note
        `;
        saveBtn.onmouseover = () => saveBtn.style.backgroundColor = '#1a1a1a';
        saveBtn.onmouseout = () => saveBtn.style.backgroundColor = '#000000';

        title.appendChild(titleText);
        title.appendChild(shortcutText);
        titleContainer.appendChild(noteIcon);
        titleContainer.appendChild(title);
        header.appendChild(titleContainer);
        header.appendChild(closeBtn);
        buttonContainer.appendChild(saveBtn);

        box.appendChild(header);
        box.appendChild(textarea);
        box.appendChild(buttonContainer);

        this.noteBox = {
            container: box,
            textarea,
            saveBtn
        };

        return box;
    }

    async getNotes(profileId) {
        try {
            const notes = await window.notesDatabase.getNotes(profileId);
            return notes;
        } catch (error) {
            window.show_error('Unable to load existing notes. Please try again.', 3000);
            console.error('Error fetching notes:', error);
            return null;
        }
    }

    async showNoteBox(profileInfo) {
        this.currentProfileInfo = profileInfo;
        
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
            document.body.appendChild(this.noteBox.container);
            // Trigger reflow
            this.noteBox.container.offsetHeight;
            // Show with animation
            requestAnimationFrame(() => {
                this.noteBox.container.style.opacity = '1';
                this.noteBox.container.style.transform = 'translateY(0)';
            });
        }

        try {
            this.currentNote = await this.getNotes(profileInfo.profileId);
            this.noteBox.textarea.value = this.currentNote ? this.currentNote.note : '';
            this.initialNoteText = this.noteBox.textarea.value;
            this.noteBox.saveBtn.onclick = () => this.saveNote();

            // Add keyboard shortcut listener
            document.addEventListener('keydown', this.handleKeyboardShortcuts);

            requestAnimationFrame(() => {
                this.noteBox.textarea.focus();
            });

            document.addEventListener('mousedown', this.handleClickOutside);
        } catch (error) {
            window.show_error('Error initializing notes. Please refresh and try again.', 3000);
            console.error(error);
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
        }
    }

    async saveNote() {
        if (!this.currentProfileInfo) {
            window.show_error('Unable to save note. Profile information is missing.', 3000);
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
            if (this.currentNote) {
                await window.notesDatabase.updateNote(this.currentNote.id, noteText);
                window.show_success('Your note has been successfully updated.', 3000);
            } else {
                await window.notesDatabase.createNote(this.currentProfileInfo.profileId, noteText);
                window.show_success('Your note has been successfully saved.', 3000);
            }

            this.currentNote = null;
            this.closeNoteBox();
        } catch (error) {
            window.show_error('Unable to save your note. Please try again.', 3000);
            console.error(error);
        }
    }

    closeNoteBox() {
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
        this.closeNoteBox();
    }
}

window.profileNotes = new ProfileNotes();
window.labelProfileNotes = new LabelProfileNotes();
window.labelProfileNotes.initialize();
class SlackShareProfile {
    constructor() {
        this.state = {
            isModalOpen: false,
            isQuickMessageOpen: false, // New state for quick message modal
            channels: [],
            filteredChannels: [],
            loading: false,
            error: null,
            searchTerm: '',
            selectedChannel: {},
            currentPage: 1,
            itemsPerPage: 20,
            quickMessageChannelId: '' // New state for storing channel ID
        };

        this.modalRoot = null;
        this.modal = null;
        this.channelList = null;
        this.searchInput = null;
        this.messageArea = null;
        this.paginationContainer = null;
        this.quickMessageModal = null; // New property for quick message modal

        this.initializeModal();
        this.initializeQuickMessage(); // New initialization method
        this.bindEvents();
    }

    createElementWithClass(tag, className) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        return element;
    }

    initializeModal() {
        // Create modal root
        this.modalRoot = this.createElementWithClass('div', 'hypertalent-slack-root');
        document.body.appendChild(this.modalRoot);

        // Create modal container
        this.modal = this.createElementWithClass('div', 'hypertalent-slack-modal');

        // Create header
        const header = this.createElementWithClass('div', 'hypertalent-slack-header');
        const title = this.createElementWithClass('h3', 'hypertalent-slack-title');
        title.textContent = 'Share to Slack';

        const closeButton = this.createElementWithClass('button', 'hypertalent-slack-close');
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.toggleModal());

        header.appendChild(title);
        header.appendChild(closeButton);

        // Create search input
        this.searchInput = this.createElementWithClass('input', 'hypertalent-slack-search');
        this.searchInput.type = 'text';
        this.searchInput.placeholder = 'Search channels...';
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));

        // Create main content wrapper
        const contentWrapper = this.createElementWithClass('div', 'hypertalent-slack-content');

        // Create channel list container
        this.channelList = this.createElementWithClass('div', 'hypertalent-slack-channels');

        // Create message area
        this.messageArea = this.createElementWithClass('div', 'hypertalent-slack-message');

        // Create pagination container
        this.paginationContainer = this.createElementWithClass('div', 'hypertalent-slack-pagination');

        // Append all elements
        contentWrapper.appendChild(this.channelList);
        contentWrapper.appendChild(this.messageArea);
        contentWrapper.appendChild(this.paginationContainer);

        this.modal.appendChild(header);
        this.modal.appendChild(this.searchInput);
        this.modal.appendChild(contentWrapper);

        this.modalRoot.appendChild(this.modal);

        this.addStyles();
    }

    addStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
          .hypertalent-slack-root {
            display: none;
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            max-width: 420px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: -5px 0 25px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
          }
    
          .hypertalent-slack-root.active {
            display: block;
            transform: translateX(0);
          }
    
          .hypertalent-slack-modal {
            height: 100%;
            display: flex;
            flex-direction: column;
            background: white;
            border-left: 1px solid #E2E8F0;
          }
    
          .hypertalent-slack-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            background: #F8FAFC;
            border-bottom: 1px solid #E2E8F0;
          }
    
          .hypertalent-slack-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1B365D;
          }
    
          .hypertalent-slack-close {
            background: none;
            border: none;
            font-size: 24px;
            color: #64748B;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.2s;
            line-height: 1;
          }
    
          .hypertalent-slack-close:hover {
            background: #EEF2F6;
            color: #1B365D;
          }
    
          .hypertalent-slack-search {
            margin: 16px 24px !important;
            padding: 12px 16px !important;
            border: 2px solid #E2E8F0 !important;
            border-radius: 8px !important;
            font-size: 15px !important;
            transition: all 0.2s !important;
            background: #F8FAFC !important;
          }
    
          .hypertalent-slack-search:focus {
            outline: none;
            border-color: #1B365D;
            box-shadow: 0 0 0 3px rgba(27, 54, 93, 0.1);
            background: white;
          }
    
          .hypertalent-slack-content {
            flex: 1;
            overflow-y: auto;
            padding: 0 24px 24px;
          }
    
          .hypertalent-slack-channels {
            margin: 0 -24px;
            padding: 0 24px;
          }
    
          .hypertalent-slack-channel {
            padding: 12px 16px;
            margin: 4px -24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.2s;
            border-left: 3px solid transparent;
          }
    
          .hypertalent-slack-channel:hover {
            background: #F8FAFC;
            border-left-color: #1B365D;
          }
    
          .hypertalent-slack-channel.selected {
            background: #F1F5F9;
            border-left-color: #1B365D;
          }
    
          .hypertalent-slack-channel-type {
            color: #475569;
            font-size: 14px;
          }
    
          .hypertalent-slack-channel-name {
            flex: 1;
            color: #1B365D;
            font-size: 14px;
            font-weight: 500;
          }
    
          .hypertalent-slack-channel-members {
            color: #64748B;
            font-size: 13px;
            background: #F1F5F9;
            padding: 2px 8px;
            border-radius: 12px;
          }
    
          .hypertalent-slack-message {
            display: none;
            margin-top: 16px;
            padding: 16px;
            background: #F8FAFC;
            border-radius: 8px;
            border: 2px solid #E2E8F0;
          }
    
          .hypertalent-slack-message.active {
            display: block;
          }
    
          .hypertalent-slack-textarea {
            width: 100%;
            min-height: 120px;
            padding: 12px;
            border: 2px solid #E2E8F0;
            border-radius: 8px;
            resize: vertical;
            font-size: 14px;
            margin-bottom: 16px;
            background: white;
            transition: all 0.2s;
          }
    
          .hypertalent-slack-textarea:focus {
            outline: none;
            border-color: #1B365D;
            box-shadow: 0 0 0 3px rgba(27, 54, 93, 0.1);
          }
    
          .hypertalent-slack-send {
            width: 100%;
            padding: 12px;
            background: #1B365D;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
    
          .hypertalent-slack-send:hover {
            background: #152A4A;
          }
    
          .hypertalent-slack-pagination {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #E2E8F0;
          }
    
          .hypertalent-slack-page {
            padding: 6px 12px;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            background: white;
            color: #1B365D;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
          }
    
          .hypertalent-slack-page:hover {
            background: #F8FAFC;
          }
    
          .hypertalent-slack-page.active {
            background: #1B365D;
            color: white;
            border-color: #1B365D;
          }
    
          .hypertalent-slack-loading {
            text-align: center;
            padding: 20px;
            color: #64748B;
          }
    
          .hypertalent-slack-error {
            color: #DC2626;
            padding: 12px 16px;
            background: #FEE2E2;
            border-radius: 8px;
            margin: 8px 0;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
    
          .hypertalent-slack-error:before {
            content: '⚠️';
          }
    
          @keyframes slideIn {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
    
          @keyframes slideOut {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(100%);
            }
          }
        `;
        document.head.appendChild(styles);
    }

    renderChannels() {
        this.channelList.innerHTML = '';

        if (this.state.loading) {
            const loading = this.createElementWithClass('div', 'hypertalent-slack-loading');
            loading.textContent = 'Loading channels...';
            this.channelList.appendChild(loading);
            return;
        }

        if (this.state.error) {
            const error = this.createElementWithClass('div', 'hypertalent-slack-error');
            error.textContent = this.state.error;
            this.channelList.appendChild(error);
            return;
        }

        const paginatedChannels = this.getPaginatedChannels();

        paginatedChannels.forEach(channel => {
            const channelElement = this.createElementWithClass('div', 'hypertalent-slack-channel');
            if (this.state.selectedChannel?.id === channel.id) {
                channelElement.classList.add('selected');
            }
            channelElement.dataset.channelId = channel.id;

            const type = this.createElementWithClass('span', 'hypertalent-slack-channel-type');
            type.textContent = channel.is_private ? '🔒' : '#';

            const name = this.createElementWithClass('span', 'hypertalent-slack-channel-name');
            name.textContent = channel.name;

            const members = this.createElementWithClass('span', 'hypertalent-slack-channel-members');
            members.textContent = `${channel.num_members}`;

            channelElement.appendChild(type);
            channelElement.appendChild(name);
            channelElement.appendChild(members);

            channelElement.addEventListener('click', () => this.handleChannelSelect(channel.id));

            this.channelList.appendChild(channelElement);
        });
    }

    toggleQuickMessage(show) {
        this.state.isQuickMessageOpen = show;
        if (show) {
            this.quickMessageModal.classList.add('active', 'quick-message');
            const input = this.quickMessageModal.querySelector('input');
            setTimeout(() => input.focus(), 100);
        } else {
            this.quickMessageModal.classList.remove('active', 'quick-message');
            this.state.quickMessageChannelId = '';
        }
    }

    initializeQuickMessage() {
        this.quickMessageModal = this.createElementWithClass('div', 'hypertalent-slack-root');
        const modal = this.createElementWithClass('div', 'hypertalent-slack-modal');
        
        // Create header
        const header = this.createElementWithClass('div', 'hypertalent-slack-header');
        const title = this.createElementWithClass('h3', 'hypertalent-slack-title');
        title.textContent = 'Quick Message';
        
        const closeButton = this.createElementWithClass('button', 'hypertalent-slack-close');
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.toggleQuickMessage(false));
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Create channel ID input
        const channelInput = this.createElementWithClass('input', 'hypertalent-slack-search');
        channelInput.type = 'text';
        channelInput.placeholder = 'Enter Channel ID...';
        channelInput.addEventListener('input', (e) => {
            this.state.quickMessageChannelId = e.target.value;
            this.state.selectedChannel.id = e.target.value
        });
        
        // Create submit button
        const submitButton = this.createElementWithClass('button', 'hypertalent-slack-send');
        submitButton.textContent = 'Open Message Box';
        submitButton.style.margin = '16px 24px';
        submitButton.addEventListener('click', () => {
            console.log(this.state.quickMessageChannelId)
            this.state.selectedChannel.id = this.state.quickMessageChannelId
            if (this.state.quickMessageChannelId) {
                this.handleQuickMessageSubmit();
            }
        });
        
        modal.appendChild(header);
        modal.appendChild(channelInput);
        modal.appendChild(submitButton);
        
        this.quickMessageModal.appendChild(modal);
        document.body.appendChild(this.quickMessageModal);
        
        // Add specific styles for quick message modal
        const additionalStyles = document.createElement('style');
        additionalStyles.textContent = `
            .hypertalent-slack-root.quick-message {
                max-width: 320px;
            }
        `;
        document.head.appendChild(additionalStyles);
    }

    handleQuickMessageSubmit() {
        this.toggleQuickMessage(false);
        this.setState({
            selectedChannel: {
                id: this.state.quickMessageChannelId,
                name: 'channel-' + this.state.quickMessageChannelId
            },
            isModalOpen: true
        });
        this.render();
    }

    renderMessageArea() {
        this.messageArea.innerHTML = '';

        if (!this.state.selectedChannel) {
            this.messageArea.classList.remove('active');
            return;
        }

        this.messageArea.classList.add('active');

        const textarea = this.createElementWithClass('textarea', 'hypertalent-slack-textarea');
        textarea.placeholder = 'Write your message... Use @ to mention people';
        textarea.value = this.getDefaultMessageTemplate();

        const sendButton = this.createElementWithClass('button', 'hypertalent-slack-send');
        sendButton.textContent = `Send to #${this.state.selectedChannel.name}`;
        sendButton.addEventListener('click', () => this.sendMessage(textarea.value));

        this.messageArea.appendChild(textarea);
        this.messageArea.appendChild(sendButton);

        // Focus the textarea
        setTimeout(() => textarea.focus(), 0);
    }

    renderPagination() {
        this.paginationContainer.innerHTML = '';

        const totalPages = Math.ceil(this.state.filteredChannels.length / this.state.itemsPerPage);
        if (totalPages <= 1) return;

        const createPageButton = (text, page, isActive = false) => {
            const button = this.createElementWithClass('button', 'hypertalent-slack-page');
            if (isActive) button.classList.add('active');
            button.textContent = text;
            if (page) {
                button.addEventListener('click', () => this.handlePageChange(page));
            }
            return button;
        };

        // Previous button
        if (this.state.currentPage > 1) {
            this.paginationContainer.appendChild(
                createPageButton('←', this.state.currentPage - 1)
            );
        }

        // First page
        this.paginationContainer.appendChild(
            createPageButton('1', 1, this.state.currentPage === 1)
        );

        // Ellipsis or pages
        if (this.state.currentPage > 3) {
            this.paginationContainer.appendChild(createPageButton('...'));
        }

        // Current page range
        for (let i = Math.max(2, this.state.currentPage - 1);
            i <= Math.min(totalPages - 1, this.state.currentPage + 1); i++) {
            if (i === 1 || i === totalPages) continue;
            this.paginationContainer.appendChild(
                createPageButton(i.toString(), i, i === this.state.currentPage)
            );
        }

        // Ellipsis or pages
        if (this.state.currentPage < totalPages - 2) {
            this.paginationContainer.appendChild(createPageButton('...'));
        }

        // Last page
        if (totalPages > 1) {
            this.paginationContainer.appendChild(
                createPageButton(totalPages.toString(), totalPages,
                    this.state.currentPage === totalPages)
            );
        }

        // Next button
        if (this.state.currentPage < totalPages) {
            this.paginationContainer.appendChild(
                createPageButton('→', this.state.currentPage + 1)
            );
        }
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' && !e.altKey && !e.ctrlKey && !e.metaKey &&
                !document.activeElement.matches('input, textarea') &&
                window.location.href.includes('linkedin.com/in/') &&
                document.activeElement.getAttribute('contenteditable') !== 'true' &&
                !document.activeElement.classList.contains('msg-form__contenteditable')) {
                this.toggleModal();
            }

            // Add new shortcut for 'm' key
            if (e.key === 'm' && !e.altKey && !e.ctrlKey && !e.metaKey &&
                !document.activeElement.matches('input, textarea') &&
                document.activeElement.getAttribute('contenteditable') !== 'true') {
                this.toggleQuickMessage(true);
            }

            if (e.key === 'Escape') {
                if (this.state.isModalOpen) {
                    this.toggleModal();
                }
                if (this.state.isQuickMessageOpen) {
                    this.toggleQuickMessage(false);
                }
            }
        });
        document.addEventListener('click', (e) => {
            if (this.state.isModalOpen &&
                !this.modal.contains(e.target) &&
                !e.target.closest('.hypertalent-slack-root')) {
                this.toggleModal();
            }
            if (this.state.isQuickMessageOpen &&
                !this.quickMessageModal.contains(e.target)) {
                this.toggleQuickMessage(false);
            }
        });
    }

    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        let filteredChannels = this.state.channels;


        console.log(e.target.value);
        console.log(this.state.channels)

        if (searchTerm) {
            filteredChannels = this.state.channels.filter(channel =>
                channel.name.toLowerCase().includes(searchTerm) ||
                (channel.purpose && channel.purpose.value.toLowerCase().includes(searchTerm))
            );
        }

        this.setState({
            searchTerm,
            filteredChannels,
            currentPage: 1
        });
    }

    getPaginatedChannels() {
        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const endIndex = startIndex + this.state.itemsPerPage;
        return this.state.filteredChannels.slice(startIndex, endIndex);
    }

    handlePageChange(newPage) {
        if (newPage === this.state.currentPage) return;

        this.setState({
            currentPage: newPage,
            error: null
        });

        // Scroll to top of channel list
        this.channelList.scrollTop = 0;
    }

    async handleChannelSelect(channelId) {
        const channel = this.state.channels.find(c => c.id === channelId);
        if (!channel) return;

        // Deselect if clicking the same channel
        if (this.state.selectedChannel?.id === channelId) {
            this.setState({ selectedChannel: null });
            return;
        }

        this.setState({
            selectedChannel: channel,
            error: null
        });
    }

    getDefaultMessageTemplate() {
        const profileData = this.getProfileData();
        return `*Shared LinkedIn Profile*\n\n${profileData.name}${profileData.headline ? `\n${profileData.headline}` : ''}\n${profileData.currentUrl}`;
    }

    getProfileData() {
        const name = document.querySelector('[data-generated-name-id]')?.textContent?.trim() || '';
        const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
        const currentUrl = window.location.href;

        return { name, headline, currentUrl };
    }

    async fetchSlackChannels() {
        try {
            this.setState({ loading: true, error: null });

            const slackToken = await window.firebaseService.getSlackToken();
            const response = await chrome.runtime.sendMessage({
                type: 'FETCH_SLACK_CHANNELS',
                token: slackToken
            });

            if (response.error) {
                throw new Error(response.error);
            }

            const sortedChannels = response.channels.sort((a, b) => {
                // Sort by member count first
                const memberDiff = b.num_members - a.num_members;
                if (memberDiff !== 0) return memberDiff;

                // Then alphabetically
                return a.name.localeCompare(b.name);
            });

            this.setState({
                channels: sortedChannels,
                filteredChannels: sortedChannels,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching channels:', error);
            this.setState({
                error: `Failed to load Slack channels: ${error.message}`,
                loading: false
            });
        }
    }

    async sendMessage(message) {
        if (!this.state.selectedChannel || !message.trim()) return;
        console.log(this.state.selectedChannel)

        try {
            this.setState({ loading: true, error: null });

            const slackToken = await window.firebaseService.getSlackToken();
            const response = await chrome.runtime.sendMessage({
                type: 'SEND_SLACK_MESSAGE',
                token: slackToken,
                channelId: "C087T85UGKE",
                message: message.trim()
            });

            if (response.error) {
                throw new Error(response.error);
            }

            this.toggleModal();
        } catch (error) {
            console.error('Error sending message:', error);
            this.setState({
                error: 'Failed to send message to Slack',
                loading: false
            });
        }
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    render() {
        if (!this.state.isModalOpen) {
            this.modalRoot.classList.remove('active');
            return;
        }

        this.modalRoot.classList.add('active');
        this.renderChannels();
        this.renderMessageArea();
        this.renderPagination();
    }

    toggleModal() {
        const willOpen = !this.state.isModalOpen;

        this.setState({
            isModalOpen: willOpen,
            searchTerm: '',
            filteredChannels: this.state.channels,
            selectedChannel: null,
            currentPage: 1,
            error: null
        });

        if (willOpen) {
            this.fetchSlackChannels();
            setTimeout(() => this.searchInput.focus(), 100);
        }
    }
}


// Initialize the share profile functionality
window.shareProfile = new SlackShareProfile();
class RefreshService {
    constructor() {
        // console.log('[RefreshService] Initializing service');
        this.createUI();
        this.attachEventListeners();
    }

    createUI() {
        // Create container
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;

        // Create logo button
        this.logoButton = document.createElement('button');
        this.logoButton.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #4285f4;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        this.logoButton.innerHTML = `
            <img src="chrome-extension://${chrome.runtime.id}/assets/icon-48.png" 
                 style="width: 24px; height: 24px;" alt="Logo">
        `;

        // Create dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.style.cssText = `
            position: absolute;
            top: 45px;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 8px;
            display: none;
            min-width: 120px;
        `;

        // Create buttons
        this.refreshButton = this.createButton('Refresh');
        this.extensionButton = this.createButton('Extension');

        // Assemble UI
        this.dropdown.appendChild(this.refreshButton);
        this.dropdown.appendChild(this.extensionButton);
        this.container.appendChild(this.logoButton);
        this.container.appendChild(this.dropdown);
        document.body.appendChild(this.container);
    }

    createButton(text) {
        const button = document.createElement('button');
        button.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            margin: 4px 0;
            border: none;
            border-radius: 4px;
            background: #f5f5f5;
            cursor: pointer;
            text-align: left;
            font-size: 14px;
            transition: background 0.2s;
            &:hover {
                background: #e5e5e5;
            }
        `;
        button.textContent = text;
        return button;
    }

    attachEventListeners() {
        // Toggle dropdown on logo click
        this.logoButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = this.dropdown.style.display === 'block';
            this.dropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.dropdown.style.display = 'none';
        });

        // Prevent dropdown from closing when clicking inside it
        this.dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Refresh button click handler
        this.refreshButton.addEventListener('click', async () => {
            // console.log('[RefreshService] Refresh clicked');
            try {
                // Refresh Firebase auth state
                await window.firebaseService.refreshAuthState();
                
                // Notify DB refresh listeners
                window.firebaseService.notifyDbRefreshListeners();
                
                // console.log('[RefreshService] Refresh complete');
                this.dropdown.style.display = 'none';
            } catch (error) {
                // console.error('[RefreshService] Refresh failed:', error);
            }
        });

        // Extension button click handler
        this.extensionButton.addEventListener('click', () => {
            // console.log('[RefreshService] Extension clicked');
            chrome.runtime.sendMessage({ type: 'EXTENSION_OPEN' });
            this.dropdown.style.display = 'none';
        });
    }

    destroy() {
        // console.log('[RefreshService] Destroying service');
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}


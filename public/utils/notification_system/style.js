class MessageStylesManager {
    constructor() {
        this.styleId = 'message-system-styles';
        this.currentTheme = 'dark';
        this.setupTheme();
    }

    setupTheme() {
        if (window.themeManager) {
            window.themeManager.addListener(theme => {
                this.currentTheme = theme;
                this.injectStyles();
            });
        }
        this.injectStyles();
    }

    generateStyles() {
        const isDark = this.currentTheme === 'dark';
        
        return `
            /* Theme variables */
            :root {
                --msg-bg: ${isDark ? 'hsl(224, 71%, 4%)' : 'hsl(0, 0%, 100%)'} !important;
                --msg-text: ${isDark ? 'hsl(213, 31%, 91%)' : 'hsl(222.2, 47.4%, 11.2%)'} !important;
                --msg-shadow: ${isDark ? 
                    '0 4px 12px rgba(0, 0, 0, 0.3)' : 
                    '0 4px 12px rgba(0, 0, 0, 0.1)'} !important;
            }

            .message-toast {
                position: fixed !important;
                right: -400px !important;
                min-width: 300px !important;
                max-width: 350px !important;
                padding: 12px 45px 12px 45px !important;
                margin: 10px !important;
                border-radius: 8px !important;
                background: var(--msg-bg) !important;
                font-size: 12px !important;
                line-height: 1.5 !important;
                z-index: 10000 !important;
                opacity: 0 !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                display: flex !important;
                align-items: center !important;
                top: 20px !important;
                transform: translateY(0) !important;
                color: var(--msg-text) !important;
                box-shadow: var(--msg-shadow) !important;
            }

            // .message-toast.success { background: hsl(151, 75%, 14%) !important; }
            // .message-toast.error { background: hsl(0, 63%, 31%) !important; }
            // .message-toast.warning { background: hsl(45, 80%, 14%) !important; }
            // .message-toast.info { background: hsl(213, 75%, 14%) !important; }
            // .message-toast.loading { background: hsl(271, 75%, 14%) !important; }

            .message-toast.visible {
                right: 20px !important;
                opacity: 1 !important;
            }

            .message-toast.removing {
                opacity: 0 !important;
                right: -400px !important;
            }

            .message-icon {
                position: absolute !important;
                left: 15px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: opacity 0.15s ease !important;
            }

            .message-text {
                margin-right: 20px !important;
                font-size: 12px !important;
                transition: opacity 0.15s ease !important;
            }

            .message-close {
                position: absolute !important;
                right: 8px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                background: none !important;
                border: none !important;
                color: currentColor !important;
                font-size: 20px !important;
                cursor: pointer !important;
                padding: 0 5px !important;
                line-height: 1 !important;
                opacity: 0.8 !important;
                transition: opacity 0.2s ease !important;
            }

            .message-close:hover {
                opacity: 1 !important;
            }

            .message-toast:hover {
                transform: translateX(-5px) !important;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .spinner {
                animation: spin 1.5s linear infinite !important;
            }
        `;
    }

    injectStyles() {
        let styleElement = document.getElementById(this.styleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = this.styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = this.generateStyles();
    }

    destroy() {
        const styleElement = document.getElementById(this.styleId);
        if (styleElement) {
            styleElement.remove();
        }
    }
}

// Create singleton instance
if (!window.messageStylesManager) {
    window.messageStylesManager = new MessageStylesManager();
}
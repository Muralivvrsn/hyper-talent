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
                '0 10px 25px rgba(0, 0, 0, 0.4)' :
                '0 10px 25px rgba(0, 0, 0, 0.15)'} !important;
    --toast-border-radius: 12px !important;
    --toast-width: 420px !important;
    --success-color: hsl(151, 85%, 16%) !important;
    --success-glow: 0 0 15px hsla(151, 85%, 40%, 0.3) !important;
    --error-color: hsl(0, 73%, 35%) !important;
    --error-glow: 0 0 15px hsla(0, 73%, 60%, 0.3) !important;
    --warning-color: hsl(45, 90%, 16%) !important;
    --warning-glow: 0 0 15px hsla(45, 90%, 40%, 0.3) !important;
    --info-color: hsl(213, 85%, 16%) !important;
    --info-glow: 0 0 15px hsla(213, 85%, 40%, 0.3) !important;
    --loading-color: hsl(271, 85%, 16%) !important;
    --loading-glow: 0 0 15px hsla(271, 85%, 40%, 0.3) !important;
}

.message-toast {
    position: fixed !important;
    right: -400px !important;
    bottom: 160px !important;
    min-width: var(--toast-width) !important;
    max-width: var(--toast-width) !important;
    padding: 5px 30px 5px 60px !important;
    margin: 10px !important;
    border-radius: var(--toast-border-radius) !important;
    background: var(--msg-bg) !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
    font-weight: 400 !important;
    letter-spacing: 0.2px !important;
    z-index: 10000 !important;
    opacity: 0 !important;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important; /* Bouncy effect */
    display: flex !important;
    align-items: center !important;
    color: var(--msg-text) !important;
    box-shadow: var(--msg-shadow) !important;
    border-left: 2px solid transparent !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    margin-top: 20px !important;
    min-height: 60px;
}

/* Status-specific styles with glowing effects */
.message-toast.success { 
    background: var(--success-color) !important; 
    border-left-color: hsl(151, 85%, 40%) !important;
    box-shadow: var(--msg-shadow), var(--success-glow) !important;
}

.message-toast.error { 
    background: var(--error-color) !important; 
    border-left-color: hsl(0, 73%, 60%) !important;
    box-shadow: var(--msg-shadow), var(--error-glow) !important;
}

.message-toast.warning { 
    background: var(--warning-color) !important; 
    border-left-color: hsl(45, 90%, 50%) !important;
    box-shadow: var(--msg-shadow), var(--warning-glow) !important;
}

.message-toast.info { 
    background: var(--info-color) !important; 
    border-left-color: hsl(213, 85%, 50%) !important;
    box-shadow: var(--msg-shadow), var(--info-glow) !important;
}

.message-toast.loading { 
    background: var(--loading-color) !important; 
    border-left-color: hsl(271, 85%, 50%) !important;
    box-shadow: var(--msg-shadow), var(--loading-glow) !important;
}

.message-toast.visible {
    right: 25px !important;
    opacity: 1 !important;
}

.message-toast.removing {
    opacity: 0 !important;
    right: -450px !important;
}

.message-icon {
    position: absolute !important;
    left: 20px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.3s ease !important;
    font-size: 24px !important;
    width: 28px !important;
    height: 28px !important;
}

.message-text {
    margin-right: 20px !important;
    font-size: 13 !important;
    transition: opacity 0.3s ease !important;
    word-break: break-word !important;
    line-height: 1.5 !important;
    max-height: 100px !important;
    overflow-y: auto !important;
    scrollbar-width: thin !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
}

.message-close {
    position: absolute !important;
    right: 12px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    background: rgba(255,255,255,0.1) !important;
    border: none !important;
    border-radius: 50% !important;
    color: currentColor !important;
    font-size: 18px !important;
    cursor: pointer !important;
    padding: 6px !important;
    width: 28px !important;
    height: 28px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
    opacity: 0.8 !important;
    transition: all 0.3s ease !important;
}

.message-close:hover {
    opacity: 1 !important;
    background: rgba(255,255,255,0.2) !important;
}

.message-toast:hover {
    box-shadow: var(--msg-shadow), 0 6px 20px rgba(0,0,0,0.2) !important;
}

/* Multiple notifications stacking */
.message-toast:nth-child(2) {
    bottom: 90px !important;
}

.message-toast:nth-child(3) {
    bottom: 30px !important;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spinner {
    animation: spin 1.2s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite !important;
    filter: drop-shadow(0 0 3px rgba(255,255,255,0.3)) !important;
}

/* For emoji in messages */
.message-emoji {
    font-size: 14px !important;
    margin: 0 2px !important;
    vertical-align: middle !important;
}

/* Pulse animation for loading state */
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.6; }
    100% { opacity: 1; }
}

.message-toast.loading .message-text {
    animation: pulse 2s infinite ease-in-out !important;
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
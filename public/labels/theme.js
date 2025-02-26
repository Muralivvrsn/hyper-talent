


class ThemeStylesManager {
    constructor() {
        console.log('🎨 Theme: Initializing ThemeStylesManager');
        this.styleId = 'label-manager-styles';
        this.currentTheme = 'dark';
        this.handleThemeChange = this.handleThemeChange.bind(this);
        console.log('🎨 Theme: Initial theme set to', this.currentTheme);
        this.setupInitialTheme();
        this.injectStyles();
    }

    setupInitialTheme() {
        console.log('🎨 Theme: Setting up theme listener');
        if (window.themeManager) {
            console.log('🎨 Theme: Found themeManager, adding listener');
            window.themeManager.addListener(this.handleThemeChange);
        } else {
            console.log('⚠️ Theme: No themeManager found');
        }
    }    

    handleThemeChange(theme) {
        console.log('🎨 Theme: Theme change received:', theme);
        this.currentTheme = 'dark';
        this.injectStyles();
    }

    generateStyles() {
        const isDark = this.currentTheme === 'dark';
        
        return `
            /* Theme-based variables */
            :root {
                --lm-bg: ${isDark ? 'hsl(224, 71%, 4%)' : 'hsl(0, 0%, 100%)'} !important;
                --lm-text: ${isDark ? 'hsl(213, 31%, 91%)' : 'hsl(222.2, 47.4%, 11.2%)'} !important;
                --lm-border: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(214.3, 31.8%, 91.4%)'} !important;
                --lm-hover: ${isDark ? 'hsl(223, 47%, 11%)' : 'hsl(210, 40%, 96.1%)'} !important;
                --lm-focus: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(215, 20.2%, 65.1%)'} !important;
                --lm-shadow: ${isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'} !important;
                --lm-input-bg: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(0, 0%, 100%)'} !important;
                --lm-category-bg: ${isDark ? 'hsl(224, 71%, 4%)' : 'hsl(210, 40%, 96.1%)'} !important;
                --lm-category-text: ${isDark ? 'hsl(215.4, 16.3%, 56.9%)' : 'hsl(215.4, 16.3%, 46.9%)'} !important;
                --lm-badge-bg: ${isDark ? 'hsl(223, 47%, 11%)' : 'hsl(210, 40%, 96.1%)'} !important;
                --lm-badge-text: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'} !important;
                --lm-primary: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'} !important;
                --lm-primary-foreground: ${isDark ? 'hsl(222.2, 47.4%, 1.2%)' : 'hsl(210, 40%, 98%)'} !important;
                --lm-secondary: ${isDark ? 'hsl(222.2, 47.4%, 11.2%)' : 'hsl(210, 40%, 96.1%)'} !important;
                --lm-secondary-foreground: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'} !important;
                --lm-accent: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(210, 40%, 96.1%)'} !important;
                --lm-accent-foreground: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'} !important;
                --lm-destructive: ${isDark ? 'hsl(0, 63%, 31%)' : 'hsl(0, 100%, 50%)'} !important;
                --lm-destructive-foreground: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(210, 40%, 98%)'} !important;
                --lm-ring: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(215, 20.2%, 65.1%)'} !important;
                --lm-radius: 0.5rem !important;
                
                /* Action button colors */
                --lm-action-text: ${isDark ? 'hsl(214, 32%, 91%)' : 'hsl(215, 16%, 47%)'} !important;
                --lm-action-hover-bg: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(210, 40%, 96.1%)'} !important;
                --lm-action-edit-hover: ${isDark ? 'hsl(201, 96%, 32%)' : 'hsl(201, 96%, 32%)'} !important;
                --lm-action-delete-hover: ${isDark ? 'hsl(0, 84%, 60%)' : 'hsl(0, 84%, 60%)'} !important;
            }
    
            /* Main Container */
            .label-manager-main-container {
                background: var(--lm-bg) !important;
                border: 1px solid var(--lm-border) !important;
                box-shadow: var(--lm-shadow) !important;
                color: var(--lm-text) !important;
                border-radius: var(--lm-radius) !important;
                overflow: hidden !important;
                z-index: 9999 !important;
                width: 300px !important;
                flex-direction: column !important;
            }
    
            .label-manager-main-container.messaging {
                margin-top: 8px !important;
            }
    
            .label-manager-main-container.profile {
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
            }
    
            /* Toggle Button */
            .label-manager-toggle {
                background: var(--lm-bg) !important;
                color: var(--lm-text) !important;
                border: 1px solid var(--lm-border) !important;
                padding: 6px 12px !important;
                border-radius: var(--lm-radius) !important;
                cursor: pointer !important;
                font-size: 13px !important;
                margin-right: 8px !important;
            }
    
            .label-manager-toggle:hover {
                background: var(--lm-hover) !important;
            }
    
            .label-manager-toggle:focus {
                outline: none !important;
                box-shadow: 0 0 0 2px var(--lm-focus) !important;
            }
    
            /* Search Container */
            .label-search-container {
                padding: 8px !important;
                border-bottom: 1px solid var(--lm-border) !important;
            }
    
            .label-search-wrapper {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                background: var(--lm-input-bg) !important;
                border-radius: var(--lm-radius) !important;
                border: 1px solid var(--lm-border) !important;
            }
    
            .label-search-wrapper:focus-within {
                border-color: var(--lm-focus) !important;
                box-shadow: 0 0 0 1px var(--lm-ring) !important;
            }
    
            .label-search-icon {
                position: absolute !important;
                left: 12px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                width: 16px !important;
                height: 16px !important;
                color: var(--lm-category-text) !important;
                pointer-events: none !important;
            }
    
            .label-search-input {
                width: 100% !important;
                height: 36px !important;
                background: transparent !important;
                border: none !important;
                outline: none !important;
                padding: 0 12px 0 36px !important;
                font-size: 14px !important;
                color: var(--lm-text) !important;
            }
    
            .label-search-input::placeholder {
                color: var(--lm-category-text) !important;
            }
    
            /* Dropdown Container */
            .dropdown-container {
                max-height: calc(100vh - 150px) !important;
                overflow-y: auto !important;
                padding: 4px !important;
            }
    
            .category-header {
                padding: 8px 12px !important;
                background: var(--lm-category-bg) !important;
                color: var(--lm-category-text) !important;
                font-weight: 600 !important;
                font-size: 10px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                margin-top: 4px !important;
            }
    
            /* Dropdown Element */
            .dropdown-element {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 8px 12px !important;
                cursor: pointer !important;
                border-radius: var(--lm-radius) !important;
                background: var(--lm-bg) !important;
                color: var(--lm-text) !important;
                transition: all 0.2s ease-in-out !important;
                margin: 2px 0 !important;
            }
    
            .dropdown-element:hover,
            .dropdown-element.hovered {
                background: var(--lm-hover) !important;
            }
    
            .dropdown-element.focused {
                outline: none !important;
                background: var(--lm-hover) !important;
                box-shadow: inset 0 0 0 2px var(--lm-focus) !important;
            }
    
            /* Dropdown Content */
            .dropdown-content-wrapper {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                flex: 1 !important;
                min-width: 0 !important;
            }
    
            /* Action Buttons */
            .dropdown-actions-wrapper {
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;
                opacity: 0 !important;
                transition: opacity 0.2s ease-in-out !important;
                margin-left: 8px !important;
            }
    
            .dropdown-element:hover .dropdown-actions-wrapper,
            .dropdown-element.hovered .dropdown-actions-wrapper,
            .dropdown-element.focused .dropdown-actions-wrapper {
                opacity: 1 !important;
            }
    
            .dropdown-action-btn {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 4px !important;
                border: none !important;
                background: transparent !important;
                border-radius: var(--lm-radius) !important;
                cursor: pointer !important;
                color: var(--lm-action-text) !important;
                transition: all 0.2s ease-in-out !important;
            }
    
            .dropdown-action-btn:hover {
                background: var(--lm-action-hover-bg) !important;
            }
    
            .dropdown-action-btn:focus {
                outline: none !important;
                box-shadow: 0 0 0 2px var(--lm-focus) !important;
            }
    
            .dropdown-action-btn.edit-btn:hover {
                color: var(--lm-action-edit-hover) !important;
            }
    
            .dropdown-action-btn.delete-btn:hover {
                color: var(--lm-action-delete-hover) !important;
            }
    
            /* Label Elements */
            .color-indicator {
                width: 12px !important;
                height: 12px !important;
                border-radius: 50% !important;
                flex-shrink: 0 !important;
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                transition: all 0.2s ease-in-out !important;
            }
    
            .dropdown-element:hover .color-indicator {
                transform: scale(1.1) !important;
                box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15),
                            0 0 4px var(--lm-focus) !important;
            }
    
            .label-text {
                flex: 1 !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                min-width: 0 !important;
                font-size: 12px !important;
            }
    
            .count-badge {
                background: var(--lm-badge-bg) !important;
                color: var(--lm-badge-text) !important;
                padding: 2px 6px !important;
                border-radius: 12px !important;
                font-size: 12px !important;
                min-width: 20px !important;
                text-align: center !important;
                flex-shrink: 0 !important;
            }
    
            /* Messages */
            .no-results {
                padding: 16px !important;
                text-align: center !important;
                color: var(--lm-category-text) !important;
                font-size: 12px !important;
            }
    
            /* Scrollbar */
            .dropdown-container::-webkit-scrollbar {
                width: 6px !important;
            }
    
            .dropdown-container::-webkit-scrollbar-track {
                background: var(--lm-bg) !important;
            }
    
            .dropdown-container::-webkit-scrollbar-thumb {
                background: var(--lm-border) !important;
                border-radius: 3px !important;
            }
    
            .dropdown-container::-webkit-scrollbar-thumb:hover {
                background: var(--lm-focus) !important;
            }
    
            /* Utility Classes */
            .hidden {
                display: none !important;
            }
    
            .visible {
                display: flex !important;
            }
            
            .label-manager-no-labels{
                text-align: center !important;
                padding: 30px !important;
                background: var(--lm-bg) !important;
                color: var(--lm-text) !important;
                font-size: 13px !important
            }
        `;
    }

    injectStyles() {
        console.log('🎨 Theme: Starting style injection');
        let styleElement = document.getElementById(this.styleId);
        console.log('🎨 Theme: Existing style element:', styleElement ? 'Found' : 'Not found');

        if (!styleElement) {
            console.log('🎨 Theme: Creating new style element');
            styleElement = document.createElement('style');
            styleElement.id = this.styleId;
            styleElement.type = 'text/css';
        }

        try {
            const styles = this.generateStyles();
            console.log('🎨 Theme: Setting style content');
            styleElement.textContent = styles;

            if (!styleElement.parentNode) {
                console.log('🎨 Theme: Appending style element to head');
                if (document.head) {
                    document.head.appendChild(styleElement);
                    console.log('✅ Theme: Successfully injected styles');
                } else {
                    console.error('❌ Theme: No head element found');
                }
            } else {
                console.log('✅ Theme: Styles updated in existing element');
            }
        } catch(error) {
            console.error('❌ Theme: Style injection failed:', error);
        }
    }

    destroy() {
        console.log('🎨 Theme: Destroying theme manager');
        const styleElement = document.getElementById(this.styleId);
        if (styleElement) {
            console.log('🎨 Theme: Removing style element');
            styleElement.remove();
        }
    }
}

// Create singleton instance
if (!window.themeStylesManager) {
    console.log('🎨 Theme: Creating new ThemeStylesManager instance');
    window.themeStylesManager = new ThemeStylesManager();
} else {
    console.log('🎨 Theme: ThemeStylesManager instance already exists');
}
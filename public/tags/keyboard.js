class LabelThemeManager {
    constructor() {
        if (window.labelThemeManager) return window.labelThemeManager;

        this.styleId = 'hyper_label_styles';
        this.theme = 'light';
        this.currentTheme = 'light'; // Track current theme to avoid unnecessary updates

        window.labelThemeManager = this;
        this.initialize();
    }

    initialize() {
        // Inject initial styles first
        this.injectStyles();

        // Check if themeManager exists before adding listener
        if (window.themeManager) {
            // console.log('[LabelThemeManager] Adding theme listener');

            // Clean up any existing listener to avoid duplicates
            try {
                window.themeManager.removeListener(this.themeUpdate);
            } catch (e) {
                // Ignore errors when removing non-existent listener
            }

            // Add new listener
            window.themeManager.addListener(this.themeUpdate.bind(this));
        } else {
            // console.log('[LabelThemeManager] Theme manager not found, will retry');

            // If themeManager doesn't exist yet, wait and try again
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.themeManager) {
                    clearInterval(checkInterval);
                    // console.log('[LabelThemeManager] Theme manager found, adding listener');
                    window.themeManager.addListener(this.themeUpdate.bind(this));
                } else if (attempts >= 20) { // Give up after 10 seconds
                    clearInterval(checkInterval);
                    console.error('[LabelThemeManager] Theme manager not available after 10 seconds');
                }
            }, 500);
        }
    }

    themeUpdate(theme, loading, error) {
        // Only update if theme has actually changed
        if (theme && theme !== this.currentTheme) {
            // console.log(`[LabelThemeManager] Theme changed: ${this.currentTheme} -> ${theme}`);
            this.currentTheme = theme;
            this.theme = theme;
            this.injectStyles();
        }

        // Handle errors if needed
        if (error) {
            console.error('[LabelThemeManager] Received error from ThemeManager:', error);
        }
    }

    generateStyles() {
        const isDark = this.theme === 'dark'; // Corrected from 'light' to 'dark'

        return `
            :root {
                --lm-bg: ${isDark ? 'hsl(224, 71%, 4%)' : 'hsl(0, 0%, 100%)'};
                --lm-text: ${isDark ? 'hsl(213, 31%, 91%)' : 'hsl(222.2, 47.4%, 11.2%)'};
                --lm-border: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(214.3, 31.8%, 91.4%)'};
                --lm-hover: ${isDark ? 'hsl(223, 47%, 11%)' : 'hsl(210, 40%, 96.1%)'};
                --lm-focus: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(215, 20.2%, 65.1%)'};
                --lm-shadow: ${isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'};
                --lm-input-bg: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(0, 0%, 100%)'};
                --lm-category-bg: ${isDark ? 'hsl(224, 71%, 4%)' : 'hsl(210, 40%, 96.1%)'};
                --lm-category-text: ${isDark ? 'hsl(215.4, 16.3%, 46.9%)' : 'hsl(215.4, 16.3%, 56.9%)'};
                --lm-badge-bg: ${isDark ? 'hsl(223, 47%, 11%)' : 'hsl(210, 40%, 96.1%)'};
                --lm-badge-text: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'};
                --lm-primary: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'};
                --lm-primary-foreground: ${isDark ? 'hsl(222.2, 47.4%, 1.2%)' : 'hsl(210, 40%, 98%)'};
                --lm-secondary: ${isDark ? 'hsl(222.2, 47.4%, 11.2%)' : 'hsl(210, 40%, 96.1%)'};
                --lm-secondary-foreground: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'};
                --lm-accent: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(210, 40%, 96.1%)'};
                --lm-accent-foreground: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 47.4%, 11.2%)'};
                --lm-destructive: ${isDark ? 'hsl(0, 63%, 31%)' : 'hsl(0, 100%, 50%)'};
                --lm-destructive-foreground: ${isDark ? 'hsl(210, 40%, 98%)' : 'hsl(210, 40%, 98%)'};
                --lm-ring: ${isDark ? 'hsl(216, 34%, 17%)' : 'hsl(215, 20.2%, 65.1%)'};
                --lm-radius: 0.5rem;
 
            }
            /* Rest of CSS remains the same */
            .hyper_label_button {
                padding: 7px 20px;
                border: 1px solid var(--lm-border) !important;
                border-radius: var(--lm-radius);
                background: var(--lm-bg);
                color: var(--lm-text);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
                font-size: 13px;
                user-select: none;
                box-shadow: var(--lm-shadow);
                position: relative;
            }
            .label_search_container {
                position: relative;
                width: 100%;
            }
            .search-icon{
                position: absolute;
                top: 50%;
                left: 25px;
                transform: translateY(-50%);
            }


            .no_labels{
                color: var(--lm-text) !important;
                padding: 20px !important;
                font-size: 13px !important
                text-align: center;
            }
    
            .hyper_label_button:hover:not(:disabled) {
                background: var(--lm-hover);
                border-color: var(--lm-focus);
            }
    
            .hyper_label_button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
    
            .hyper_label_dropdown {
                position: fixed;
                z-index: 9999;
                width: 350px;
                background: var(--lm-bg);
                border: 1px solid var(--lm-border);
                border-radius: var(--lm-radius);
                box-shadow: var(--lm-shadow);
                overflow: hidden;
                opacity: 0;
                pointer-events: none;
                transform: translateY(-8px) scale(0.98);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: transform, opacity;
            }
            .label_edit_input {
                background: var(--lm-input-bg) !important;
                border: 1px solid var(--lm-border) !important;
                border-radius: var(--lm-radius) !important;
                color: var(--lm-text) !important;
                padding: 4px 8px !important;
                width: 100% !important;
                font-size: 14px !important;
                outline: none !important;
            }

            .label_edit_input:focus {
                border-color: var(--lm-focus) !important;
                box-shadow: 0 0 0 2px var(--lm-ring) !important;
            }
            .label_item.deleting {
                opacity: 0.5;
                pointer-events: none;
            }

            .label_item.deleting .action_btn {
                pointer-events: none;
            }

            .save_btn:hover {
                color: var(--lm-primary) !important;
                background: var(--lm-accent) !important;
            }
    
            .hyper_label_dropdown.visible {
                opacity: 1;
                pointer-events: auto;
                transform: translateY(0) scale(1);
            }
    
            .label_search_container {
                padding: 12px;
                border-bottom: 1px solid var(--lm-border);
                background: var(--lm-bg);
            }
    
            .label_search_input {
                width: 100% !important;
                padding: 8px 12px !important;
                border: 1px solid var(--lm-border) !important;
                border-radius: var(--lm-radius) !important;
                background: var(--lm-input-bg) !important;
                color: var(--lm-text) !important;
                font-size: 14px !important;
                outline: none !important;
                transition: all 0.15s ease !important;
                padding-left: 35px !important;
            }
    
            .label_search_input::placeholder {
                color: var(--lm-category-text) !important;
            }
    
            .label_search_input:focus {
                border-color: var(--lm-focus);
                box-shadow: 0 0 0 2px var(--lm-ring);
            }
    
            .dropdown_content {
                max-height: 400px;
                overflow-y: auto;
                padding: 6px;
            }
    
            .label_section {
                margin: 4px 0;
            }
    
            .section_header {
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--lm-category-text);
            }
    
            .label_item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 2px 10px !important;
                border-radius: var(--lm-radius);
                cursor: pointer;
                transition: background-color 0.15s ease;
            }
    
            .label_item:hover {
                background: var(--lm-hover);
            }
    
            .label_content {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                flex: 1 !important;
                min-width: 0 !important;
                width: 60% !important
            }
    
            .color_dot {
                width: 10px !important;
                height: 10px !important;
                border-radius: 50% !important;
                flex-shrink: 0 !important;
            }
    
            .label_name {
                font-size: 13px !important;
                color: var(--lm-text) !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                width: 100% !important
            }
    
            .label_count {
                display: flex !important;
                align-items: center !important;
                padding: 2px 8px !important;
                font-size: 12px !important;
                font-weight: 500 !important;
                background: var(--lm-badge-bg) !important;
                color: var(--lm-badge-text) !important;
                border-radius: 10px !important;
                margin-left: 8px !important;
            }
    
            .label_actions {
                display: flex !important;
                gap: 4px !important;
                opacity: 0 !important;
                transition: opacity 0.15s ease !important;
            }
    
            .label_item:hover .label_actions {
                opacity: 1 !important;
            }
    
            .action_btn {
                padding: 6px !important;
                background: transparent !important;
                border: none !important;
                color: var(--lm-text) !important;
                opacity: 0.7 !important;
                cursor: pointer !important;
                border-radius: var(--lm-radius) !important;
                transition: all 0.15s ease !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
    
            .action_btn:hover {
                opacity: 1 !important;
                background: var(--lm-accent) !important;
            }
    
            .action_btn svg {
                width: 16px !important;
                height: 16px !important;
                color: inherit !important;
            }
    
            .edit_btn:hover {
                color: var(--lm-accent-foreground) !important;
            }
    
            .delete_btn:hover {
                color: var(--lm-destructive) !important;
            }
    
            /* Specific styles for tooltip/popup */
            .label_tooltip {
                position: fixed !important;
                z-index: 10000 !important;
                background: var(--lm-bg) !important;
                border: 1px solid var(--lm-border) !important;
                border-radius: var(--lm-radius) !important;
                box-shadow: var(--lm-shadow) !important;
                padding: 12px !important;
                min-width: 240px !important;
                max-width: 320px !important;
                font-size: 13px !important;
                color: var(--lm-text) !important;
                transform: translateY(8px) !important;
                opacity: 0 !important;
                pointer-events: none !important;
                transition: transform 0.2s ease, opacity 0.2s ease !important;
            }
    
            .label_tooltip.tooltip_enter {
                transform: translateY(0) !important;
                opacity: 1 !important;
                pointer-events: auto !important;
            }
    
            .tooltip_header {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                margin-bottom: 8px !important;
                padding-bottom: 8px !important;
                border-bottom: 1px solid var(--lm-border) !important;
            }
    
            .tooltip_title {
                font-weight: 500 !important;
                color: var(--lm-text) !important;
            }
    
            .tooltip_type {
                text-transform: capitalize !important;
                font-size: 11px !important;
                padding: 2px 6px !important;
                border-radius: 4px !important;
                background: var(--lm-accent) !important;
                color: var(--lm-accent-foreground) !important;
            }
    
            .tooltip_content {
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
            }
            .label_item.focused {
                background: var(--lm-hover) !important;
            }

            .label_content {
                outline: none !important;
            }
    
            .tooltip_row {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                font-size: 12px !important;
            }
    
            .tooltip_row span:first-child {
                color: var(--lm-category-text) !important;
            }
    
            .loading_spinner {
                width: 18px !important;
                height: 18px !important;
                border: 2px solid var(--lm-border) !important;
                border-radius: 50% !important;
                border-top-color: var(--lm-text) !important;
                animation: labelSpinnerSpin 0.6s linear infinite !important;
            }
    
            @keyframes labelSpinnerSpin {
                to { transform: rotate(360deg) !important; }
            }
            .login_container {
                padding: 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }

            .login_message {
                color: var(--lm-text);
                font-size: 14px;
                margin: 0;
            }

            .login_button {
                background: var(--lm-primary);
                color: var(--lm-primary-foreground);
                border: none;
                border-radius: var(--lm-radius);
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .login_button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            .floating-panel {
                font-family: 'Poppins', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto !important;
                position: fixed !important;
                height: auto !important;
                max-height: 400px !important;
                display: none;
                z-index: 10000 !important;
                padding: 16px !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                transform: translateY(10px) !important;
                overflow: hidden !important;
                border-radius: var(--lm-radius) !important;
                background-color: var(--lm-bg) !important;
                box-shadow: var(--lm-shadow) !important;
                backdrop-filter: blur(8px) !important;
                border: 1px solid var(--lm-border) !important;
            }

            .search-container {
                position: relative !important;
                margin-bottom: 12px !important;
            }

            .search-input {
                width: 100% !important;
                padding: 8px 12px !important;
                border: 1px solid var(--lm-border) !important;
                border-radius: var(--lm-radius) !important;
                background: var(--lm-input-bg) !important;
                color: var(--lm-text) !important;
                font-size: 14px !important;
                outline: none !important;
                transition: all 0.15s ease !important;
            }

            .search-input:focus {
                border-color: var(--lm-focus) !important;
                box-shadow: 0 0 0 2px var(--lm-ring) !important;
            }
            .search-input::placeholder {
                color: var(--lm-category-text) !important;
            }

            .template-list {
                max-height: 320px !important;
                overflow-y: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                list-style: none !important;
            }

            .template-item {
                padding: 14px !important;
                border-radius: var(--lm-radius) !important;
                margin-bottom: 8px !important;
                cursor: pointer !important;
                background-color: var(--lm-secondary) !important;
                color: var(--lm-text) !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                border: 1px solid transparent !important;
            }

            .template-item.selected {
                background-color: var(--lm-accent) !important;
                border-color: var(--lm-focus) !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
            }

            .template-item:hover:not(.selected) {
                background-color: var(--lm-hover) !important;
                transform: translateY(-1px) !important;
                border-color: var(--lm-border) !important;
            }

            .template-title {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: var(--lm-text) !important;
                margin-bottom: 6px !important;
            }

            .template-preview {
                font-size: 12px !important;
                color: var(--lm-category-text) !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                line-height: 1.5 !important;
            }

            .no-results {
                text-align: center !important;
                padding: 24px !important;
                color: var(--lm-category-text) !important;
                font-size: 14px !important;
                font-weight: 500 !important;
            }

            .floating-panel[style*="display: block"] {
                display: block !important;
            }

            /* Loading state */
            .loading-container {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 24px !important;
                text-align: center !important;
            }

            .loading-spinner {
                width: 36px !important;
                height: 36px !important;
                border: 3px solid var(--lm-border) !important;
                border-radius: 50% !important;
                border-top-color: var(--lm-primary) !important;
                animation: spinner-rotation 1s infinite linear !important;
                margin-bottom: 16px !important;
            }

            .loading-text {
                font-size: 14px !important;
                color: var(--lm-category-text) !important;
                font-weight: 500 !important;
            }

            @keyframes spinner-rotation {
                to { transform: rotate(360deg) !important; }
            }

            /* Logged out state */
            .login-container {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 24px !important;
                text-align: center !important;
            }

            .login-message {
                font-size: 14px !important;
                color: var(--lm-category-text) !important;
                font-weight: 500 !important;
                margin-bottom: 16px !important;
                line-height: 1.5 !important;
            }

            .login-button {
                background-color: var(--lm-primary) !important;
                color: var(--lm-primary-foreground) !important;
                border: none !important;
                border-radius: var(--lm-radius) !important;
                padding: 10px 24px !important;
                font-size: 14px !important;
                font-weight: 600 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                box-shadow: 0 4px 12px var(--lm-ring) !important;
            }

            .login-button:hover {
                background-color: var(--lm-primary) !important;
                opacity: 0.9 !important;
                transform: translateY(-2px) !important;
            }
            
            .note-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
                height: 16px;
                color: var(--lm-text);
            }
            
            .note-title {
                display: flex;
                gap: 2px;
            }
        
            
            .note-shortcut-text {
                font-size: 11px;
                color: var(--lm-category-text);
                font-weight: 400;
            }
        
            
            .note-textarea:focus {
                outline: none !important;
            }
            
            
            .note-save-btn {
                background: var(--lm-primary);
                color: var(--lm-primary-foreground);
                border: none;
                padding: 8px 14px;
                border-radius: var(--lm-radius);
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                font-family: 'Poppins', sans-serif;
                transition: opacity 0.2s ease;
                display: flex;
                align-items: center;
                gap: 6px;
                height: 32px;
                line-height: 1;
            }
            
            .note-save-btn:hover {
                opacity: 0.9;
            }
            
            /* Loading state */
            .note-loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                text-align: center;
            }
            
            .note-loading-spinner {
                width: 36px;
                height: 36px;
                border: 3px solid var(--lm-border);
                border-radius: 50%;
                border-top-color: var(--lm-primary);
                animation: spinner-rotation 1s infinite linear;
                margin-bottom: 16px;
            }
            
            @keyframes spinner-rotation {
                to { transform: rotate(360deg); }
            }
            
            .note-loading-text {
                font-size: 14px;
                color: var(--lm-category-text);
                font-weight: 500;
            }
            
            /* Login state */
            .note-login-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                text-align: center;
            }
            
            .note-login-message {
                font-size: 14px;
                color: var(--lm-category-text);
                font-weight: 500;
                margin-bottom: 16px;
                line-height: 1.5;
            }
            
            .note-login-button {
                background-color: var(--lm-primary);
                color: var(--lm-primary-foreground);
                border: none;
                border-radius: var(--lm-radius);
                padding: 10px 24px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: opacity 0.2s ease;
                box-shadow: 0 2px 6px var(--lm-ring);
            }
            
            .note-login-button:hover {
                opacity: 0.9;
                transform: translateY(-2px);
            }

            .note-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--lm-text);
            }

            .note-shortcut-text {
                font-size: 12px;
                color: var(--lm-category-text);
                margin-top: 2px;
            }


            .note-tab {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 2px 10px;
                font-size: 13px;
                cursor: pointer;
                user-select: none;
                border-bottom: 2px solid transparent;
                white-space: nowrap;
                color: var(--lm-category-text);
                transition: all 0.2s;
            }

            .note-tab:hover {
                color: var(--lm-text);
                background-color: var(--lm-hover);
            }

            .note-tab-active {
                color: var(--lm-text);
                border-bottom-color: var(--lm-primary);
                font-weight: 500;
            }

            .note-tab-icon {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .note-tab-label {
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 150px;
            }

            /* Shared Note Banner */
            .note-shared-container {
                padding: 10px 16px;
                background-color: var(--lm-accent);
                border-bottom: 1px solid var(--lm-border);
            }

            .note-shared-header {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .note-shared-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--lm-accent-foreground);
            }

            .note-shared-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .note-shared-by {
                font-size: 13px;
                color: var(--lm-text);
            }

            .note-shared-by strong {
                font-weight: 600;
            }

            .note-permission-info {
                font-size: 12px;
                color: var(--lm-category-text);
                font-style: italic;
            }

            /* Note Content */
            .note-textarea {
                flex: 1;
                height: 100%;
                max-height: calc(70vh - 110px);
                padding: 16px;
                border: none;
                resize: none;
                outline: none;
                background-color: var(--lm-input-bg);
                color: var(--lm-text);
                font-family: 'Poppins', sans-serif;
                font-size: 14px;
                line-height: 1.6;
                overflow-y: auto;
            }

            .note-textarea.note-readonly {
                background-color: var(--lm-category-bg);
                cursor: default;
                color: var(--lm-text);
                opacity: 0.9;
            }

            .note-textarea::placeholder {
                color: var(--lm-category-text);
            }

            /* Button Container */
            .note-button-container {
                display: flex;
                justify-content: flex-end;
                padding: 5px;
                border-top: 1px solid var(--lm-border);
            }

            .note-save-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background-color: var(--lm-primary);
                color: var(--lm-primary-foreground);
                border: none;
                border-radius: var(--lm-radius);
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
                font-size: 14px;
                cursor: pointer;
                transition: opacity 0.2s ease;
            }

            .note-save-btn:hover {
                opacity: 0.9;
            }

            .note-save-btn:active {
                opacity: 0.8;
            }

            /* Loading State */
            .note-loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 32px;
                gap: 16px;
            }

            .note-loading-spinner {
                width: 24px;
                height: 24px;
                border: 2px solid var(--lm-border);
                border-top: 2px solid var(--lm-text);
                border-radius: 50%;
                animation: note-spinner 1s linear infinite;
            }

            @keyframes note-spinner {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .note-loading-text {
                font-size: 14px;
                color: var(--lm-text);
            }

            /* Login State */
            .note-login-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 32px;
                gap: 16px;
            }

            .note-login-message {
                font-size: 14px;
                color: var(--lm-text);
                text-align: center;
            }

            .note-login-button {
                padding: 8px 16px;
                background-color: var(--lm-primary);
                color: var(--lm-primary-foreground);
                border: none;
                border-radius: var(--lm-radius);
                font-family: 'Poppins', sans-serif;
                font-weight: 500;
                font-size: 14px;
                cursor: pointer;
                transition: opacity 0.2s ease;
            }

            .note-login-button:hover {
                opacity: 0.9;
            }

            /* Empty State */
            .note-empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 30px;
                text-align: center;
            }

            .note-empty-icon {
                margin-bottom: 16px;
                color: var(--lm-category-text);
            }

            .note-empty-text {
                font-size: 14px;
                color: var(--lm-text);
                margin-bottom: 8px;
            }

            .note-empty-description {
                font-size: 13px;
                color: var(--lm-category-text);
                margin-bottom: 16px;
            }
            .alert-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.65);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                backdrop-filter: blur(3px);
            }
            
            .alert-dialog-overlay.visible {
                opacity: 1;
            }
            
            .alert-dialog-container {
                background: var(--lm-bg);
                border-radius: var(--lm-radius);
                box-shadow: var(--lm-shadow);
                max-width: 460px;
                width: 90%;
                margin: 16px;
                overflow: hidden;
                transform: translateY(-20px);
                transition: transform 0.25s cubic-bezier(0.1, 1, 0.3, 1);
                border: 1px solid var(--lm-border);
            }
            
            .alert-dialog-overlay.visible .alert-dialog-container {
                transform: translateY(0);
            }
            
            .alert-dialog-header {
                padding: 18px 24px;
                border-bottom: 1px solid var(--lm-border);
            }
            
            .alert-dialog-title {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: var(--lm-text);
                line-height: 1.3;
            }
            
            .alert-dialog-body {
                padding: 20px 24px;
                color: var(--lm-text) !important;
                font-size: 15px;
                line-height: 1.5;
            }

            .alert-dialog-body p {
                color: var(--lm-text) !important;
            }
            
            .alert-dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 16px 24px;
                background: var(--lm-accent);
                border-top: 1px solid var(--lm-border);
            }
            
            .alert-dialog-button {
                padding: 8px 16px;
                font-size: 14px;
                font-weight: 500;
                border-radius: var(--lm-radius);
                cursor: pointer;
                border: none;
                outline: none;
                transition: all 0.2s ease;
            }
            
            .alert-dialog-button:focus {
                box-shadow: 0 0 0 2px var(--lm-ring);
            }
            
            .alert-dialog-cancel {
                background: var(--lm-secondary);
                color: var(--lm-secondary-foreground);
                border: 1px solid var(--lm-border);
            }
            
            .alert-dialog-cancel:hover {
                background: var(--lm-hover);
            }
            
            .alert-dialog-success {
                background: #34c759;
                color: var(--lm-primary-foreground);
            }
            
            .alert-dialog-success:hover {
                background: #28b348;
            }
            
            .alert-dialog-danger {
                background: var(--lm-destructive);
                color: var(--lm-destructive-foreground);
            }
            
            .alert-dialog-danger:hover {
                background: var(--lm-destructive);
                opacity: 0.9;
            }
            
            /* For dark mode - no longer needed since we're using CSS variables
            @media (prefers-color-scheme: dark) {
                .alert-dialog-container {
                    background: var(--lm-bg);
                    border-color: var(--lm-border);
                }
                
                .alert-dialog-header {
                    border-bottom-color: var(--lm-border);
                }
                
                .alert-dialog-title {
                    color: var(--lm-text);
                }
                
                .alert-dialog-body {
                    color: var(--lm-text) !important;
                }
                
                .alert-dialog-footer {
                    background: var(--lm-accent);
                    border-top-color: var(--lm-border);
                }
                
                .alert-dialog-cancel {
                    background: var(--lm-secondary);
                    color: var(--lm-secondary-foreground);
                    border-color: var(--lm-border);
                }
                
                .alert-dialog-cancel:hover {
                    background: var(--lm-hover);
                }
            }
           /* Filter Manager CSS */

            .hyper_filter_button {
                padding: 7px 20px;
                border: 1px solid var(--lm-border) !important;
                border-radius: var(--lm-radius);
                background: var(--lm-bg);
                color: var(--lm-text);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
                font-size: 13px;
                user-select: none;
                box-shadow: var(--lm-shadow);
                position: relative;
                margin-left: 10px !important;
            }

            .hyper_filter_button_count {
                position: absolute;
                top: -8px;
                right: -8px;
                background: var(--lm-primary);
                color: var(--lm-primary-foreground);
                border-radius: 10px;
                min-width: 16px;
                height: 16px;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                font-weight: bold;
            }

            .no_filters {
                color: var(--lm-text) !important;
                padding: 20px !important;
                font-size: 13px !important;
                text-align: center;
            }

            .hyper_filter_button:hover:not(:disabled) {
                background: var(--lm-hover);
                border-color: var(--lm-focus);
            }

            .hyper_filter_button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .hyper_filter_dropdown {
                position: fixed;
                z-index: 9999;
                width: 350px;
                background: var(--lm-bg);
                border: 1px solid var(--lm-border);
                border-radius: var(--lm-radius);
                box-shadow: var(--lm-shadow);
                overflow: hidden;
                opacity: 0;
                pointer-events: none;
                transform: translateY(-8px) scale(0.98);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: transform, opacity;
            }

            .hyper_filter_dropdown.visible {
                opacity: 1;
                pointer-events: auto;
                transform: translateY(0) scale(1);
            }

            .filter_search_container {
                padding: 12px;
                border-bottom: 1px solid var(--lm-border);
                background: var(--lm-bg);
            }

            .filter_search_input {
                width: 100% !important;
                padding: 8px 12px !important;
                border: 1px solid var(--lm-border) !important;
                border-radius: var(--lm-radius) !important;
                background: var(--lm-input-bg) !important;
                color: var(--lm-text) !important;
                font-size: 14px !important;
                outline: none !important;
                transition: all 0.15s ease !important;
                padding-left: 35px !important;
            }

            .filter_search_input::placeholder {
                color: var(--lm-category-text) !important;
            }

            .filter_search_input:focus {
                border-color: var(--lm-focus);
                box-shadow: 0 0 0 2px var(--lm-ring);
            }

            .dropdown_content {
                max-height: 400px;
                overflow-y: auto;
                padding: 6px;
            }

            .filter_section {
                margin: 4px 0;
            }

            .section_header {
                padding: 2px 10px !important;
                font-size: 11px !important;
                font-weight: 500 !impotant;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                color: var(--lm-category-text) !important;
            }

            .filter_item {
                display: flex;
                align-items: center;
                padding: 5px 12px;
                border-radius: var(--lm-radius);
                cursor: pointer;
                transition: all 0.15s ease;
                position: relative;
            }

            .filter_item:hover {
                background: var(--lm-hover);
            }

            .filter_item.selected {
                background: var(--lm-accent);
                font-weight: 500;
            }

            .filter_item:focus {
                outline: none;
                box-shadow: 0 0 0 2px var(--lm-ring);
            }

            .filter_name {
                font-size: 14px !important;
                color: var(--lm-text) !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                flex: 1 !important;
            }

            .color_dot {
                width: 10px !important;
                height: 10px !important;
                border-radius: 50% !important;
                margin-right: 10px !important;
                flex-shrink: 0 !important;
                border: 1px solid rgba(0, 0, 0, 0.1) !important;
            }

            .filter_count {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 2px 8px !important;
                min-width: 24px !important;
                height: 20px !important;
                font-size: 12px !important;
                font-weight: 500 !important;
                background: var(--lm-badge-bg) !important;
                color: var(--lm-badge-text) !important;
                border-radius: 10px !important;
                margin-left: 8px !important;
            }

            .filter_check {
                position: absolute;
                right: 12px;
                width: 16px;
                height: 16px;
                color: var(--lm-primary);
                opacity: 0;
                transition: opacity 0.15s ease;
            }

            .filter_item.selected .filter_check {
                opacity: 1;
            }

            .filter_list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .clear_filters {
                margin: 8px 12px;
                padding: 6px 12px;
                background: transparent;
                border: 1px solid var(--lm-border);
                border-radius: var(--lm-radius);
                color: var(--lm-text);
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .clear_filters:hover {
                background: var(--lm-hover);
                border-color: var(--lm-focus);
            }

            /* Keyboard navigation focus state */
            .filter_item.focused {
                background: var(--lm-hover);
                box-shadow: 0 0 0 2px var(--lm-ring);
            }

            /* Loading spinner for async operations */
            .loading_spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(0, 0, 0, 0.1);
                border-top-color: var(--lm-primary);
                border-radius: 50%;
                animation: spinner 0.6s linear infinite;
            }

            @keyframes spinner {
                to {
                    transform: rotate(360deg);
                }
            }

            /* Hide elements */
            .filter-hidden {
                display: none !important;
            }

            /* Profile page positioning */
            .profile-page .hyper_filter_button {
                position: fixed;
                top: 20px;
                right: 70px;
                z-index: 1000;
            }
            .profile-labels-container-message,
            .hypertalent-profile-labels-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                width: 60% !important;
                height: fit-content !important;
            }
            .profile-labels-container-message {
                width: 100% !important;
                margin: 3px 0px;
            }
            .loading_message {
                display: flex;
                text-align: center;
                color: var(--lm-text) !important;
                font-size: 13px;
                width: 100%;
            }
            .profile-label {
                display: inline-flex;
                align-items: center;
                padding: 2px 10px;
                border-radius: 12px;
                font-size: 11px;
                cursor: default;
                position: relative;
                transition: all 0.2s ease;
            }

            .profile-label:hover {
                transform: translateY(-1px);
                box-shadow: var(--lm-shadow);
            }

            .profile-label.unverified::after {
                content: '';
                position: absolute;
                top: -2px;
                right: -2px;
                width: 8px;
                height: 8px;
                background: #f5a623;
                border-radius: 50%;
                border: 1px solid var(--lm-bg);
            }

            .profile-label-remove {
                display: none;
                margin-left: 5px !important;
                cursor: pointer;
                opacity: 0.7;
                font-size: 13px !important;
            }

            .profile-label-remove:hover {
                opacity: 1;
                border-radius: 50%;
            }

            .profile-label:hover .profile-label-remove {
                display: inline-flex;
            }

            .profile-label[data-shared-by] {
                position: relative;
            }

            .profile-label[data-shared-by]:hover::before {
                content: attr(data-shared-by);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: var(--lm-accent);
                color: var(--lm-accent-foreground);
                padding: 6px 10px;
                border-radius: var(--lm-radius);
                font-size: 12px;
                white-space: nowrap;
                margin-bottom: 6px;
                z-index: 1000;
                pointer-events: none;
            }

            .profile-label-shared-icon {
                margin-left: 6px;
                font-size: 14px;
                color: inherit;
                opacity: 0.8;
                cursor: help;
            }

            .profile-label-tooltip {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: var(--lm-accent);
                color: var(--lm-accent-foreground);
                padding: 8px 12px;
                border-radius: var(--lm-radius);
                font-size: 12px;
                white-space: nowrap;
                margin-bottom: 10px;
                z-index: 1000;
                pointer-events: none;
                display: none;
            }

            .profile-label:hover .profile-label-tooltip {
                display: block;
            }

            .profile-label-container {
                position: relative;
                display: inline-flex;
                align-items: center;
            }

            .hypertalent-profile-labels-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                border-radius: var(--lm-radius);
                margin-bottom: 10px;
            }

            .labels-loading-state,
            .no-labels-state {
                width: 100%;
                text-align: center;
                font-size: 14px;
                color: var( --lm-text);
                padding: 10px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }

            .labels-loading-state {
                animation: pulse 1.5s infinite;
            }

            .no-labels-state {
                color: var( --lm-text);
                font-style: italic;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }

            .labels-loading-state {
                color: var(--lm-category-text);
            }
            .note-box-container {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 90%;
                max-width: 550px;
                background: var(--lm-bg);
                border-radius: 10px;
                box-shadow: var(--lm-shadow);
                opacity: 0;
                transition: all 0.2s ease;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                max-height: 90vh;
                border: 1px solid var(--lm-border);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                color: var(--lm-text);
            }

            .note-box-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0px 16px;
                border-bottom: 1px solid var(--lm-border);
                background: var(--lm-bg);
                border-radius: 10px 10px 0 0;
            }

            .note-title-text {
                font-size: 16px;
                font-weight: 600;
                color: var(--lm-text);
                margin: 0;
            }

            .note-close-btn {
                width: 28px;
                height: 28px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                cursor: pointer;
                color: var(--lm-category-text);
                transition: all 0.2s ease;
            }

            .theme-toggle-btn:hover, .note-close-btn:hover {
                background: var(--lm-hover);
                color: var(--lm-text);
            }

            .note-tabs-container {
                display: flex;
                padding: 8px 16px 8px;
                gap: 8px;
                border-bottom: 1px solid var(--lm-border);
                background-color: var(--lm-category-bg);
                overflow-x: auto;
            }

            .note-tab {
                display: flex;
                align-items: center;
                padding: 6px 10px;
                gap: 6px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
                font-weight: 500;
                color: var(--lm-category-text);
                background: transparent;
            }

            .note-tab:hover {
                background: var(--lm-hover);
            }

            .note-tab-active {
                background: var(--lm-bg);
                color: var(--lm-text);
                box-shadow: var(--lm-shadow);
                border: 1px solid var(--lm-border);
            }

            .note-avatar {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: var(--lm-accent);
                color: var(--lm-accent-foreground);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 500;
            }

            .note-readonly-banner {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 16px;
                background-color: var(--lm-category-bg);
                border-bottom: 1px solid var(--lm-border);
                font-size: 12px;
                color: var(--lm-category-text);
            }

            .note-textarea {
                flex: 1;
                padding: 16px;
                border: none;
                resize: none;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.6;
                color: var(--lm-text);
                background: var(--lm-input-bg);
                outline: none;
                overflow-y: auto;
            }

            .note-textarea:focus {
                box-shadow: 0 0 0 2px var(--lm-ring) inset;
            }

            .note-textarea.note-readonly {
                background-color: var(--lm-category-bg);
                color: var(--lm-category-text);
                cursor: default;
            }

            .note-textarea::placeholder {
                color: var(--lm-category-text);
                opacity: 0.7;
            }

            .note-action-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                border-top: 1px solid var(--lm-border);
            }

            .note-shortcut-hint {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 4px;
                background: var(--lm-category-bg);
                font-size: 11px;
                color: var(--lm-category-text);
            }

            .note-shortcut-hint span {
                font-weight: 500;
                color: var(--lm-text);
            }

            .note-save-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 6px;
                background: var(--lm-primary);
                color: var(--lm-primary-foreground);
                font-weight: 500;
                font-size: 13px;
                border: none;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .note-save-btn:hover {
                opacity: 0.9;
            }

            .note-save-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .note-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 16px;
                border-top: 1px solid var(--lm-border);
                background: var(--lm-category-bg);
                font-size: 11px;
                color: var(--lm-category-text);
                border-radius: 0 0 10px 10px;
            }

            .note-loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                gap: 16px;
            }

            .note-loading-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid var(--lm-category-bg);
                border-top: 3px solid var(--lm-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .note-loading-text {
                font-size: 14px;
                color: var(--lm-category-text);
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .note-box-container {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 90%;
    max-width: 550px;
    background: var(--lm-bg);
    border-radius: 10px;
    box-shadow: var(--lm-shadow);
    opacity: 0;
    transition: all 0.2s ease;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    border: 1px solid var(--lm-border);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: var(--lm-text);
}

.note-box-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0px 16px;
    border-bottom: 1px solid var(--lm-border);
    background: var(--lm-bg);
    border-radius: 10px 10px 0 0;
}

.note-title-container {
    display: flex;
    align-items: center;
    gap: 6px;
}

.note-title-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--lm-text);
    margin: 0;
}

.note-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--lm-category-text);
    transition: all 0.2s ease;
}

.note-close-btn:hover {
    background: var(--lm-hover);
    color: var(--lm-text);
}

.note-tabs-container {
    display: flex;
    padding: 8px 16px;
    gap: 8px;
    border-bottom: 1px solid var(--lm-border);
    background: var(--lm-category-bg);
}

.note-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 13px;
    font-weight: 500;
    color: var(--lm-category-text);
}

.note-tab:hover {
    background: var(--lm-hover);
}

.note-tab-active {
    background: var(--lm-bg);
    color: var(--lm-text);
    box-shadow: var(--lm-shadow);
}

.note-content-area {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 150px;
}

.note-textarea {
    flex: 1;
    resize: none;
    border: none;
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
    background: var(--lm-input-bg);
    color: var(--lm-text);
    outline: none;
}

.shared-note-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--lm-border);
    cursor: pointer;
}

.shared-note-item:hover {
    background: var(--lm-hover);
}

.note-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--lm-accent);
    color: var(--lm-accent-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
}

.note-avatar.small {
    width: 18px;
    height: 18px;
    font-size: 9px;
}

.note-action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-top: 1px solid var(--lm-border);
}

.note-shortcut-hint {
    font-size: 11px;
    color: var(--lm-category-text);
}

.note-shortcut-hint span {
    color: var(--lm-text);
    font-weight: 500;
}

.note-save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    background: var(--lm-primary);
    color: var(--lm-primary-foreground);
    font-weight: 500;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.note-save-btn:hover:not(:disabled) {
    opacity: 0.9;
}

.note-save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-top: 1px solid var(--lm-border);
    background: var(--lm-category-bg);
    border-radius: 0 0 10px 10px;
    font-size: 11px;
    color: var(--lm-category-text);
}

.note-last-edited {
    display: flex;
    align-items: center;
    gap: 6px;
}

.shared-note-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--lm-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--lm-bg);
}

.shared-back-button {
    padding: 8px 16px;
    border-top: 1px solid var(--lm-border);
    background: var(--lm-category-bg);
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--lm-text);
}

.shared-back-button:hover {
    background: var(--lm-hover);
}

.read-only-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--lm-badge-bg);
    color: var(--lm-badge-text);
    font-size: 11px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
    color: var(--lm-category-text);
    text-align: center;
}

.empty-state-icon {
    margin-bottom: 10px;
    opacity: 0.5;
}

.empty-state-text {
    font-size: 14px;
    margin: 0;
    color: var(--lm-category-text);
}
    .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-top: 1px solid var(--lm-border);
    background-color: var(--lm-category-bg);
    font-size: 11px;
    color: var(--lm-category-text);
    border-radius: 0 0 10px 10px;
}

.note-last-edited {
    display: flex;
    align-items: center;
    gap: 6px;
}

.note-avatar.small {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background-color: var(--lm-accent);
    color: var(--lm-accent-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 500;
}
    .note-content {
    padding: 16px;
    flex: 1;
    overflow: auto;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    color: var(--lm-text);
    background-color: var(--lm-bg);
}

.back-button {
    padding: 8px 16px;
    border-top: 1px solid var(--lm-border);
    background-color: var(--lm-category-bg);
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--lm-text);
}

.back-button:hover {
    background-color: var(--lm-hover);
}

.note-action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-top: 1px solid var(--lm-border);
    background-color: var(--lm-category-bg);
}

.note-shortcut-hint {
    font-size: 11px;
    color: var(--lm-category-text);
}

.note-shortcut-hint span {
    font-weight: 500;
    color: var(--lm-text);
}

.note-save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    background-color: var(--lm-primary);
    color: var(--lm-primary-foreground);
    font-weight: 500;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.note-save-btn:hover:not(:disabled) {
    opacity: 0.9;
}

.note-save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
    .read-only-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: var(--lm-badge-bg);
    font-size: 11px;
    color: var(--lm-badge-text);
}

.shared-note-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--lm-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--lm-bg);
}

.note-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--lm-accent);
    color: var(--lm-accent-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
}

.shared-note-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--lm-border);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.shared-note-item:hover {
    background-color: var(--lm-hover);
}
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 20px;
    color: var(--lm-category-text);
}

.note-textarea {
    flex: 1;
    resize: none;
    border: none;
    padding: 16px;
    outline: none;
    font-size: 14px;
    line-height: 1.6;
    overflow: auto;
    background-color: var(--lm-input-bg);
    color: var(--lm-text);
}

.note-textarea::placeholder {
    color: var(--lm-category-text);
    opacity: 0.7;
}

.note-textarea:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--lm-ring) inset;
}

.note-content-area {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 150px;
    background-color: var(--lm-bg);
}
.no-labels-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-color: var(--lm-bg);
    border-radius: 8px;
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
        document.getElementById(this.styleId)?.remove();

        // Clean up listener if possible
        if (window.themeManager) {
            try {
                window.themeManager.removeListener(this.themeUpdate);
            } catch (e) {
                // Ignore errors when removing listener
            }
        }

        window.labelThemeManager = null;
    }
}

// Initialize the theme manager
(() => {
    new LabelThemeManager();
    new LabelManager();
})();
class LabelThemeManager {
    constructor() {
        if (window.labelThemeManager) return window.labelThemeManager;

        this.styleId = 'hyper_label_styles';
        this.theme = 'dark';
        
        window.labelThemeManager = this;
        this.initialize();
    }

    initialize() {
        this.injectStyles();
        
        if (window.themeManager) {
            window.themeManager.addListener((theme) => {
                this.theme = theme;
                this.injectStyles();
            });
        }
    }

    generateStyles() {
        const isDark = this.theme === 'dark';
        
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
                box-shadow: 0 1px 2px 0 var(--lm-shadow);
            }
            .no_labels{
                color: var(--lm-text) !important;
                padding: 20px !important;
                font-size: 13px !important
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
                padding: 8px 12px;
                margin: 2px 0;
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
                font-size: 14px !important;
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
                color: var(--lm-action-edit-hover) !important;
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
        window.labelThemeManager = null;
    }
}

// Initialize both managers
(() => {
    new LabelThemeManager();
    new LabelManager();
})();
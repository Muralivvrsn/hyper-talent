window.labelFilterUtils = {
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    createElement(tag, className='', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        return element;
    },
  
    // Extract label names from database objects - Fixed version
    extractLabelNames(labels) {  // Now takes labels as a parameter
        // console.log('[LabelFilterUtil] Extracting label names from:', labels);
        try {
            if (!labels || typeof labels !== 'object') {
                // console.warn('[LabelFilterUtil] Invalid labels object:', labels);
                return [];
            }
            const labelNames = Object.keys(labels);
            // console.log('[LabelFilterUtil] Extracted label names:', labelNames);
            return labelNames;
        } catch (error) {
            // console.error('[LabelFilterUtil] Error extracting label names:', error);
            return [];
        }
    },
  
    // Find target container
    findTargetContainer() {
        return document.querySelector('.msg-cross-pillar-inbox-top-bar-wrapper__container');
    }
};
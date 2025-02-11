window.floatingPanel = null;

const getRecipientName = () => {
    let nameElement = document.querySelector('.msg-entity-lockup__entity-title');
    if (!nameElement){
        nameElement = document.querySelector('.msg-connections-typeahead__top-fixed-section span.artdeco-pill__text');
    }
    if(!nameElement){
        nameElement = document.querySelector('h2.msg-overlay-bubble-header__title span');
    }
    if(!nameElement) return null;
    
    const fullName = nameElement.textContent.trim();
    const nameParts = fullName.split(' ');
    
    return {
        firstName: nameParts[0] || '',
        lastName: nameParts[nameParts.length - 1] || '',
        fullName: fullName
    };
};

const replacePlaceholders = (text) => {
    const recipient = getRecipientName();
    if (!recipient) return text;

    return text
        .replace(/<<first_name>>/g, recipient.firstName)
        .replace(/<<last_name>>/g, recipient.lastName)
        .replace(/<<name>>/g, recipient.fullName);
};

window.hideFloatingPanel = () => {
    if (floatingPanel) {
        floatingPanel.style.opacity = '0';
        floatingPanel.style.transform = 'translateY(10px)';
        setTimeout(() => {
            floatingPanel.style.display = 'none';
        }, 300);
    }
};

window.setupFloatingPanel = () => {
    if (floatingPanel) return floatingPanel;

    floatingPanel = document.createElement('div');
    
    if (!document.getElementById('shortcuts-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'shortcuts-styles';
        styleSheet.textContent = `
            .floating-panel {
                font-family: 'Poppins', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto !important;
                position: fixed !important;
                height: auto !important;
                max-height: 400px !important;
                display: none !important;
                z-index: 10000 !important;
                padding: 16px !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                transform: translateY(10px) !important;
                overflow: hidden !important;
                border-radius: 12px !important;
                background-color: white !important;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12) !important;
                backdrop-filter: blur(8px) !important;
                border: 1px solid rgba(0, 0, 0, 0.08) !important;
            }
            .search-container {
                position: relative !important;
                margin-bottom: 12px !important;
            }
            .search-input {
                width: 100% !important;
                padding: 12px 16px !important;
                border: 2px solid #e0e0e0 !important;
                border-radius: 10px !important;
                font-family: 'Poppins', sans-serif !important;
                font-size: 14px !important;
                outline: none !important;
                transition: all 0.2s ease !important;
                background: #f8f9fa !important;
                color: black !important;
            }
            .search-input:focus {
                border-color: #0a66c2 !important;
                box-shadow: 0 0 0 4px rgba(10, 102, 194, 0.1) !important;
                background: white !important;
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
                border-radius: 10px !important;
                margin-bottom: 8px !important;
                cursor: pointer !important;
                background-color: #f8f9fa !important;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
                border: 1px solid transparent !important;
            }
            .template-item.selected {
                background-color: #f3f6f8 !important;
                border-color: #0a66c2 !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
            }
            .template-item:hover:not(.selected) {
                background-color: #f3f6f8 !important;
                transform: translateY(-1px) !important;
                border-color: #e0e0e0 !important;
            }
            .template-title {
                font-size: 14px !important;
                font-weight: 600 !important;
                color: #1a1a1a !important;
                margin-bottom: 6px !important;
            }
            .template-preview {
                font-size: 12px !important;
                color: #666666 !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 2 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
                line-height: 1.5 !important;
            }
            .no-results {
                text-align: center !important;
                padding: 24px !important;
                color: #666666 !important;
                font-size: 14px !important;
                font-weight: 500 !important;
            }
            .floating-panel[style*="display: block"] {
                display: block !important;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    floatingPanel.className = 'floating-panel';
    floatingPanel.innerHTML = `
        <div class="search-container">
            <input type="text" 
                   class="search-input" 
                   placeholder="Type to search templates..."
                   autocomplete="off">
        </div>
        <ul class="template-list"></ul>
    `;

    document.body.appendChild(floatingPanel);
    return floatingPanel;
};

const setupContentEditableHandlers = () => {
    let currentElement = null;
    let searchTimeout = null;
    let templates = [];
    let filteredTemplates = [];
    let selectedIndex = -1;

    const selectTemplate = (index) => {
        const listContainer = floatingPanel.querySelector('.template-list');
        const items = listContainer.querySelectorAll('.template-item');
        
        // Remove previous selection
        items.forEach(item => item.classList.remove('selected'));
        
        // Set new selection
        selectedIndex = Math.max(0, Math.min(index, items.length - 1));
        
        if (items[selectedIndex]) {
            items[selectedIndex].classList.add('selected');
            items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    };

    const renderTemplateList = (searchTerm = '') => {
        const listContainer = floatingPanel.querySelector('.template-list');
        if (!listContainer) return;

        const searchLower = searchTerm.toLowerCase();
        filteredTemplates = templates.filter(template => 
            template.title.toLowerCase().includes(searchLower) ||
            template.message.toLowerCase().includes(searchLower)
        );

        if (filteredTemplates.length === 0) {
            listContainer.innerHTML = `
                <div class="no-results">
                    No matching templates found
                </div>
            `;
            selectedIndex = -1;
            return;
        }

        const html = filteredTemplates.map((template, index) => `
            <li class="template-item ${index === 0 ? 'selected' : ''}" 
                data-id="${template.template_id}"
                role="option"
                tabindex="-1">
                <div class="template-title">${template.title}</div>
                <div class="template-preview">${replacePlaceholders(template.message)}</div>
            </li>
        `).join('');

        listContainer.innerHTML = html;
        selectedIndex = 0;

        listContainer.querySelectorAll('.template-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                selectTemplate(index);
                const template = filteredTemplates[index];
                if (template) insertTemplate(template);
            });

            item.addEventListener('mouseenter', () => {
                selectTemplate(index);
            });
        });
    };

    const insertTemplate = (template) => {
        if (window.isTemplateInserting) return;
        window.isTemplateInserting = true;
        
        console.log(template);
        if (!currentElement) {
            window.isTemplateInserting = false;
            return;
        }
    
        const pElement = currentElement.querySelector('p') || 
                        currentElement.querySelector('div[contenteditable="true"]');
        const shiftElement = document.querySelector('.msg-form__contenteditable');
        
        try {
            if (pElement) {
                const processedMessage = replacePlaceholders(template.message);
                pElement.innerHTML = processedMessage;
                
                setTimeout(() => {
                    pElement.dispatchEvent(new Event('input', { bubbles: true }));
    
                    if (shiftElement) {
                        // Set cursor position first
                        const range = document.createRange();
                        const sel = window.getSelection();
                        const targetElement = shiftElement.lastElementChild || shiftElement;
                        range.selectNodeContents(targetElement);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
    
                        // Then dispatch event
                        shiftElement.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            shiftKey: true,
                            bubbles: true,
                            cancelable: true
                        }));
    
                        // Add a small delay for focus and scroll
                        setTimeout(() => {
                            const lastChild = shiftElement.lastElementChild || shiftElement;
                            lastChild.focus();
                            lastChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }, 50);
                    }
    
                    window.hideFloatingPanel();
                    window.userActionsDatabase.addAction("message_template");
                    window.isTemplateInserting = false;
                }, 0);
            }
        } catch (error) {
            console.error('Error inserting template:', error);
            window.isTemplateInserting = false;
        }
    };

    const handleKeyboardNavigation = (event) => {
        if (!floatingPanel || floatingPanel.style.display !== 'block') return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectTemplate(selectedIndex + 1);
                break;

            case 'ArrowUp':
                event.preventDefault();
                selectTemplate(Math.max(0, selectedIndex - 1));
                break;

            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0 && filteredTemplates[selectedIndex]) {
                    insertTemplate(filteredTemplates[selectedIndex]);
                }
                break;

            case 'Tab':
                event.preventDefault();
                selectTemplate(selectedIndex + 1);
                break;

            case 'Escape':
                event.preventDefault();
                window.hideFloatingPanel();
                break;
        }
    };

    const handleInput = (event) => {
        const element = event.target;
        currentElement = element.closest('[contenteditable="true"]');
        const content = element.textContent.trim();
        
        if (content.startsWith('/')) {
            const panel = window.setupFloatingPanel();
            if (panel) {
                panel.style.display = 'block';
                setTimeout(() => {
                    panel.style.opacity = '1';
                    panel.style.transform = 'translateY(0)';
                    
                    const rect = currentElement.getBoundingClientRect();
                    panel.style.width = `${rect.width}px`;
                    panel.style.left = `${rect.left}px`;
                    panel.style.bottom = `${window.innerHeight - rect.top + 10}px`;
                    
                    const searchInput = panel.querySelector('.search-input');
                    if (searchInput) {
                        searchInput.value = content.slice(1);
                        searchInput.focus();
                        renderTemplateList(searchInput.value);
                    }
                }, 0);
            }
        } else {
            window.hideFloatingPanel();
        }
    };

    window.messageTemplateDatabase.addListener((updatedTemplates) => {
        templates = updatedTemplates;
        if (floatingPanel?.style.display === 'block') {
            const searchInput = floatingPanel.querySelector('.search-input');
            renderTemplateList(searchInput?.value || '');
        }
    });

    const handleSearch = (event) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            selectedIndex = -1;
            renderTemplateList(event.target.value);
        }, 50);
    };

    // Setup keyboard events
    document.addEventListener('keydown', handleKeyboardNavigation);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    if (node.hasAttribute('contenteditable')) {
                        setupElement(node);
                    }
                    node.querySelectorAll('[contenteditable="true"]').forEach(setupElement);
                }
            });
        });
    });

    const setupElement = (element) => {
        element.removeEventListener('input', handleInput);
        element.addEventListener('input', handleInput);
    };

    document.querySelectorAll('[contenteditable="true"]').forEach(setupElement);
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    const setupPanelHandlers = () => {
        const panel = window.setupFloatingPanel();
        if (!panel) return;

        const searchInput = panel.querySelector('.search-input');
        if (searchInput) {
            searchInput.removeEventListener('input', handleSearch);
            searchInput.addEventListener('input', handleSearch);
        }
    };

    setupPanelHandlers();
};

const initialize = () => {
    setupContentEditableHandlers();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
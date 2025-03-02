window.messageSystem = (function () {
    const messageQueue = [];
    const activeMessages = new Set();
    const MAX_MESSAGES = 3;
    const MAX_CONCURRENT_ACTIONS = 5;
    const activeActions = new Set();
    let loadingMessages = new Map();

    // Message type configurations
    const MESSAGE_TYPES = {
        success: {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>`
        },
        error: {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>`
        },
        warning: {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 22h20L12 2z"/>
                    <path d="M12 9v6"/>
                    <path d="M12 17v2"/>
                  </svg>`
        },
        info: {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v8"/>
                    <path d="M12 16h.01"/>
                  </svg>`
        },
        loading: {
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2v4"/>
                    <path d="M12 18v4"/>
                    <path d="M4.93 4.93l2.83 2.83"/>
                    <path d="M16.24 16.24l2.83 2.83"/>
                  </svg>`
        }
    };
    
    function createMessage(type, text, duration = 5000) {
        const messageConfig = MESSAGE_TYPES[type];
        const message = document.createElement('div');
        message.className = `message-toast ${type}`;

        const iconContainer = document.createElement('div');
        iconContainer.className = 'message-icon';
        iconContainer.innerHTML = messageConfig.icon;

        const textElement = document.createElement('span');
        textElement.className = 'message-text';
        textElement.textContent = text;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'message-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => removeMessage(message);

        message.appendChild(iconContainer);
        message.appendChild(textElement);
        message.appendChild(closeBtn);

        return {
            element: message,
            duration: type === 'loading' ? Infinity : duration
        };
    }

    function calculatePosition(index) {
        return 20 + (index * 70);
    }

    function animatePosition(message, position) {
        return new Promise(resolve => {
            const onTransitionEnd = () => {
                message.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };
            message.addEventListener('transitionend', onTransitionEnd);

            requestAnimationFrame(() => {
                message.style.transform = `translateY(${position}px)`;
            });
        });
    }

    async function removeMessage(message) {
        message.classList.add('removing');

        await new Promise(resolve => setTimeout(resolve, 300));

        if (message.parentNode) {
            message.parentNode.removeChild(message);
            activeMessages.delete(message);
            await repositionMessages();
            processQueue();
        }
    }

    async function repositionMessages() {
        const messages = Array.from(activeMessages);
        const animations = messages.map((message, index) => {
            const position = calculatePosition(index);
            return animatePosition(message, position);
        });

        await Promise.all(animations);
    }

    function processQueue() {
        if (messageQueue.length > 0 && activeMessages.size < MAX_MESSAGES) {
            const { type, text, duration } = messageQueue.shift();
            showMessage(type, text, duration);
        }
    }

    function showMessage(type, text, duration = 1000) {
        if (activeMessages.size >= MAX_MESSAGES) {
            messageQueue.push({ type, text, duration });
            return;
        }

        const { element: message, duration: messageDuration } = createMessage(type, text, duration);
        document.body.appendChild(message);
        activeMessages.add(message);

        const position = calculatePosition(activeMessages.size - 1);
        
        // Force reflow
        message.offsetHeight;
        
        message.classList.add('visible');
        message.style.transform = `translateY(${position}px)`;

        if (messageDuration !== Infinity) {
            setTimeout(() => {
                if (activeMessages.has(message)) {
                    removeMessage(message);
                }
            }, messageDuration);
        }

        return message;
    }

    function transformMessage(element, type, text) {
        const messageConfig = MESSAGE_TYPES[type];
        
        // Update type class
        element.className = `message-toast ${type} visible`;

        // Update icon
        const iconContainer = element.querySelector('.message-icon');
        iconContainer.style.opacity = '0';
        setTimeout(() => {
            iconContainer.innerHTML = messageConfig.icon;
            iconContainer.style.opacity = '1';
        }, 150);

        // Update text
        const textElement = element.querySelector('.message-text');
        textElement.style.opacity = '0';
        setTimeout(() => {
            textElement.textContent = text;
            textElement.style.opacity = '1';
        }, 150);

        return element;
    }

    function startAction(actionType, loadingText) {
        if (activeActions.has(actionType)) {
            showMessage('error', `Action "${actionType}" is already in progress`);
            return false;
        }

        if (activeActions.size >= MAX_CONCURRENT_ACTIONS) {
            showMessage('error', 'Maximum number of concurrent actions reached');
            return false;
        }

        activeActions.add(actionType);
        const loadingMessage = showMessage('loading', loadingText || `Processing ${actionType}...`);
        loadingMessages.set(actionType, loadingMessage);

        return true;
    }

    function completeAction(actionType, success = true, message) {
        if (!activeActions.has(actionType)) {
            return false;
        }

        const loadingMessage = loadingMessages.get(actionType);
        if (loadingMessage) {
            transformMessage(loadingMessage, success ? 'success' : 'error', message);
            
            loadingMessages.delete(actionType);
            activeActions.delete(actionType);

            setTimeout(() => {
                if (loadingMessage.parentNode) {
                    removeMessage(loadingMessage);
                }
            }, 3000);
        }

        return true;
    }

    return {
        show: showMessage,
        success: (text, duration) => showMessage('success', text, duration),
        error: (text, duration) => showMessage('error', text, duration),
        warning: (text, duration) => showMessage('warning', text, duration),
        info: (text, duration) => showMessage('info', text, duration),
        loading: (text, duration) => showMessage('loading', text, duration),
        startAction: startAction,
        completeAction: completeAction,
        getActiveActions: () => Array.from(activeActions)
    };
})();

// Global access functions
window.show_message = (type, message, duration) => window.messageSystem.show(type, message, duration);
window.show_success = (message, duration) => window.messageSystem.success(message, duration);
window.show_error = (message, duration) => window.messageSystem.error(message, duration);
window.show_warning = (message, duration) => window.messageSystem.warning(message, duration);
window.show_info = (message, duration) => window.messageSystem.info(message, duration);
window.show_loading = (message, duration) => window.messageSystem.loading(message, duration);
window.start_action = (type, loadingText) => window.messageSystem.startAction(type, loadingText);
window.complete_action = (type, success, message) => window.messageSystem.completeAction(type, success, message);
window.get_active_actions = () => window.messageSystem.getActiveActions();

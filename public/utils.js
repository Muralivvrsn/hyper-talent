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
            background: '#1b4332', // Dark green
            color: 'white',
            boxShadow: '0 4px 12px rgba(27, 67, 50, 0.3)',
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>`
        },
        error: {
            background: '#7f1d1d', // Dark red
            color: 'white',
            boxShadow: '0 4px 12px rgba(127, 29, 29, 0.3)',
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                  </svg>`
        },
        warning: {
            background: '#854d0e', // Dark orange
            color: 'white',
            boxShadow: '0 4px 12px rgba(133, 77, 14, 0.3)',
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 22h20L12 2z"/>
                    <path d="M12 9v6"/>
                    <path d="M12 17v2"/>
                  </svg>`
        },
        info: {
            background: '#1e3a8a', // Dark blue
            color: 'white',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 8v8"/>
                    <path d="M12 16h.01"/>
                  </svg>`
        },
        loading: {
            background: '#4c1d95', // Dark purple
            color: 'white',
            boxShadow: '0 4px 12px rgba(76, 29, 149, 0.3)',
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
        const messageConfig = MESSAGE_TYPES[type] || MESSAGE_TYPES.default;
        const message = document.createElement('div');
    
        message.style.cssText = `
            position: fixed;
            right: -400px;
            min-width: 300px;
            max-width: 350px;
            padding: 12px 45px 12px 45px;
            margin: 10px;
            border-radius: 8px;
            font-size: 12px;
            font-family: "Poppins", sans-serif !important;
            line-height: 1.5;
            z-index: 10000;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            background: ${messageConfig.background};
            color: ${messageConfig.color};
            box-shadow: ${messageConfig.boxShadow};
            top: 20px;
            transform: translateY(0);
        `;
    
        // Create icon container with spinning animation for loading
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        iconContainer.innerHTML = messageConfig.icon;
    
        if (type === 'loading') {
            const spinnerStyle = document.createElement('style');
            spinnerStyle.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .spinner {
                    animation: spin 1.5s linear infinite;
                }
            `;
            document.head.appendChild(spinnerStyle);
        }
    
        const textElement = document.createElement('span');
        textElement.textContent = text;
        textElement.style.cssText = `
            margin-right: 20px;
            font-size: 12px;
            font-family: "Poppins", sans-serif !important;
        `;
    
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: ${messageConfig.color};
            font-size: 20px;
            font-family: "Poppins", sans-serif !important;
            cursor: pointer;
            padding: 0 5px;
            line-height: 1;
            opacity: 0.8;
            transition: opacity 0.2s ease;
        `;
    
        closeBtn.addEventListener('mouseover', () => closeBtn.style.opacity = '1');
        closeBtn.addEventListener('mouseout', () => closeBtn.style.opacity = '0.8');
        closeBtn.addEventListener('click', () => removeMessage(message));
    
        message.appendChild(iconContainer);
        message.appendChild(textElement);
        message.appendChild(closeBtn);
    
        // Enhanced hover effect
        message.addEventListener('mouseover', () => {
            message.style.transform = 'translateX(-5px)';
            message.style.boxShadow = messageConfig.boxShadow.replace('0.3)', '0.5)');
        });
    
        message.addEventListener('mouseout', () => {
            message.style.transform = 'translateX(0)';
            message.style.boxShadow = messageConfig.boxShadow;
        });
    
        return {
            element: message,
            duration: type === 'loading' ? Infinity : 1500
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
        message.style.opacity = '0';
        message.style.right = '-400px';

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

    function showMessage(type, text, duration=1000) {
        if (activeMessages.size >= MAX_MESSAGES) {
            messageQueue.push({ type, text, duration });
            return;
        }

        const { element: message, duration: messageDuration } = createMessage(type, text, duration);
        document.body.appendChild(message);
        activeMessages.add(message);

        const position = calculatePosition(activeMessages.size - 1);
        message.style.transform = `translateY(${position}px)`;

        requestAnimationFrame(() => {
            message.style.right = '20px';
            message.style.opacity = '1';
        });

        if (messageDuration !== Infinity) {
            setTimeout(() => {
                if (activeMessages.has(message)) {
                    removeMessage(message);
                }
            }, messageDuration);
        }

        return message;
    }

    // New function to handle action tracking
    function startAction(actionType, loadingText) {
        // Check if action already exists
        console.log(actionType)
        if (activeActions.has(actionType)) {
            console.log('old')
            showMessage('error', `Action "${actionType}" is already in progress`);
            
            return false;
        }
        console.log('new')

        // Check maximum concurrent actions
        if (activeActions.size >= MAX_CONCURRENT_ACTIONS) {
            showMessage('error', 'Maximum number of concurrent actions reached');
            return false;
        }

        // Add action and show loading message
        activeActions.add(actionType);
        const loadingMessage = showMessage('loading', loadingText || `Processing ${actionType}...`);
        loadingMessages.set(actionType, loadingMessage);

        return true;
    }

    // Function to complete an action
    function completeAction(actionType, success = true, message) {
        if (!activeActions.has(actionType)) {
            return false;
        }

        // Remove loading message
        const loadingMessage = loadingMessages.get(actionType);
        if (loadingMessage) {
            removeMessage(loadingMessage);
            loadingMessages.delete(actionType);
        }

        // Remove action from tracking
        activeActions.delete(actionType);

        // Show completion message if provided
        if (message) {
            showMessage(success ? 'success' : 'error', message);
        }

        return true;
    }

    // Add new methods to the public API
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

// Add message show functions to window for global access
window.show_message = (type, message, duration) => {
    return window.messageSystem.show(type, message, duration);
};

// Add convenience methods
window.show_success = (message, duration) => window.messageSystem.success(message, duration);
window.show_error = (message, duration) => window.messageSystem.error(message, duration);
window.show_warning = (message, duration) => window.messageSystem.warning(message, duration);
window.show_info = (message, duration) => window.messageSystem.info(message, duration);
window.show_loading = (message, duration) => window.messageSystem.loading(message, duration);

// Add action tracking methods
window.start_action = (type, loadingText) => window.messageSystem.startAction(type, loadingText);
window.complete_action = (type, success, message) => window.messageSystem.completeAction(type, success, message);
window.get_active_actions = () => window.messageSystem.getActiveActions();
window.floatingpanel = (function() {
    let panel = null;
    let isOpen = false;

    function createPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            right: 100px;
            top: 50%;
            transform: translate(0, -50%) scale(0.95);
            width: 300px;
            height: 400px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15),
                        0 8px 32px rgba(0, 0, 0, 0.12);
            z-index: 9998;
            opacity: 0;
            transition: all 0.3s ease;
            padding: 20px;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        `;

        // Left side icons container
        const iconsContainer = document.createElement('div');
        iconsContainer.style.cssText = `
            display: flex;
            gap: 12px;
            align-items: center;
        `;

        // Refresh icon
        const refreshIcon = document.createElement('img');
        refreshIcon.src = chrome.runtime.getURL('refresh.png');
        refreshIcon.style.cssText = `
            width: 20px;
            height: 20px;
            cursor: pointer;
            transition: transform 0.3s ease;
        `;
        let isRefreshing = false;

        async function simulateRefresh() {
            if (isRefreshing) return;
            isRefreshing = true;
            await window.firebaseService.refreshAuthState();
            
            // Initial clockwise rotation
            refreshIcon.style.transition = 'transform 2.5s ease-in-out';
            refreshIcon.style.transform = 'rotate(360deg)';

            isRefreshing = false;
        }

        refreshIcon.addEventListener('mouseover', () => {
            if (!isRefreshing) {
                refreshIcon.style.transform = 'rotate(30deg)';
            }
        });
        refreshIcon.addEventListener('mouseout', () => {
            if (!isRefreshing) {
                refreshIcon.style.transform = 'rotate(0deg)';
            }
        });
        refreshIcon.addEventListener('click', () => {
            simulateRefresh();
            // console.log('Refresh clicked');
        });

        // Extension icon
        const extensionIcon = document.createElement('img');
        extensionIcon.src = chrome.runtime.getURL('extension.png');
        extensionIcon.style.cssText = `
            width: 20px;
            height: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        function animateExtensionClick() {
            // Scale down quickly
            extensionIcon.style.transform = 'scale(0.8)';
            extensionIcon.style.opacity = '0.7';
            
            // Return to normal with a slight bounce
            setTimeout(() => {
                extensionIcon.style.transform = 'scale(1.1)';
                extensionIcon.style.opacity = '1';
                
                setTimeout(() => {
                    extensionIcon.style.transform = 'scale(1)';
                }, 150);
            }, 150);
        }

        extensionIcon.addEventListener('mouseover', () => {
            extensionIcon.style.transform = 'scale(1.1)';
        });
        extensionIcon.addEventListener('mouseout', () => {
            extensionIcon.style.transform = 'scale(1)';
        });
        extensionIcon.addEventListener('click', () => {
            animateExtensionClick();
            // console.log('Extension clicked');
        });

        // Add icons to container
        iconsContainer.appendChild(refreshIcon);
        iconsContainer.appendChild(extensionIcon);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            font-family: "Poppins", serif !important;
            color: #666;
            cursor: pointer;
            padding: 0;
            line-height: 1;
            transition: color 0.2s ease;
        `;
        closeBtn.addEventListener('mouseover', () => closeBtn.style.color = '#ff4444');
        closeBtn.addEventListener('mouseout', () => closeBtn.style.color = '#666');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            close();
        });

        header.appendChild(iconsContainer);
        header.appendChild(closeBtn);
        panel.appendChild(header);

        // Content container
        const content = document.createElement('div');
        content.style.cssText = `
            height: calc(100% - 60px);
            overflow-y: auto;
        `;
        content.className = 'floating-panel-content';
        panel.appendChild(content);

        return panel;
    }

    function open() {
        if (isOpen) return;
        
        if (!panel) {
            panel = createPanel();
            document.body.appendChild(panel);
        }

        // Add click outside listener
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 10);

        // Show panel with animation
        requestAnimationFrame(() => {
            panel.style.opacity = '1';
            panel.style.transform = 'translate(0, -50%) scale(1)';
        });

        isOpen = true;
    }

    function close() {
        if (!isOpen || !panel) return;

        // Hide panel with animation
        panel.style.opacity = '0';
        panel.style.transform = 'translate(0, -50%) scale(0.95)';

        // Remove click outside listener
        document.removeEventListener('click', handleClickOutside);

        isOpen = false;

        // Remove panel after animation
        setTimeout(() => {
            if (panel && panel.parentNode) {
                panel.parentNode.removeChild(panel);
                panel = null;
            }
        }, 300);
    }

    function handleClickOutside(event) {
        if (panel && !panel.contains(event.target) && 
            !event.target.closest('.floating-icon-container')) {
            close();
        }
    }

    function setContent(htmlContent) {
        if (!panel) return;
        const content = panel.querySelector('.floating-panel-content');
        if (content) {
            content.innerHTML = htmlContent;
        }
    }

    // Public API
    return {
        open,
        close,
        setContent,
        isOpen: () => isOpen
    };
})();
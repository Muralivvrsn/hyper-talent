



function createFloatingIcon(imageUrl = 'logo.png') {
    // Create container for the floating icon
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        right: -65px; /* Start outside viewport */
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 40px;
        z-index: 9999;
        transition: all 0.3s ease;
        cursor: pointer;
        border-radius: 50%;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 
                    0 6px 20px rgba(0, 0, 0, 0.15);
    `;

    // Create the icon image
    const icon = document.createElement('img');
    icon.src = imageUrl;
    icon.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    `;

    // Create close button
    const closeButton = document.createElement('div');
    closeButton.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        width: 20px;
        height: 20px;
        background: #ff4444;
        border-radius: 50%;
        display: none;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        color: white;
        font-size: 12px;
        font-family: "Poppins", serif !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
    `;
    closeButton.innerHTML = '×';

    // Add hover effects
    container.addEventListener('mouseenter', () => {
        closeButton.style.display = 'flex';
        container.style.transform = 'translateY(-50%) scale(1.05)';
        container.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(0, 0, 0, 0.2)';
    });

    container.addEventListener('mouseleave', () => {
        closeButton.style.display = 'none';
        container.style.transform = 'translateY(-50%) scale(1)';
        container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.15)';
    });

    // Add click handlers
    container.addEventListener('click', (e) => {
        if (e.target !== closeButton) {
            // console.log('clicked here');
            window.floatingpanel.open();
            // Example content
            window.floatingpanel.setContent(`
                <div style="padding: 10px;">
                    <h4>Welcome!</h4>
                    <p>This is your floating panel content.</p>
                </div>
            `);
        }
    });
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        container.style.right = '-65px'; // Slide out
        setTimeout(() => {
            container.remove();
            // Optional: Save state to localStorage to prevent showing again
            localStorage.setItem('floatingIconHidden', 'true');
        }, 300);
    });

    // Append elements
    container.appendChild(icon);
    container.appendChild(closeButton);
    document.body.appendChild(container);

    // Animate in after a short delay
    setTimeout(() => {
        container.style.right = '20px';
    }, 100);

    // Check if icon should be hidden
    if (localStorage.getItem('floatingIconHidden') === 'true') {
        container.remove();
    }
}

// Initialize the floating icon
// Replace 'YOUR_IMAGE_URL_HERE' with your actual image URL
createFloatingIcon(chrome.runtime.getURL('logo.png'));



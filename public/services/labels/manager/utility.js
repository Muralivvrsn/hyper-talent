window.labelUtils = {
    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.label-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'label-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            background: ${type === 'error' ? '#FEE2E2' : '#EFF6FF'};
            color: ${type === 'error' ? '#991B1B' : '#1E40AF'};
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = '1');
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    getProfileInfo() {
        const detailContainer = document.querySelector('.scaffold-layout__detail');
        if (!detailContainer) return null;

        const profileLink = detailContainer.querySelector('.msg-thread__link-to-profile');
        if (!profileLink) return null;

        const name = profileLink.querySelector('h2')?.textContent?.trim();
        const url = profileLink.href;

        return { name, url };
    },

    getProfileImage() {
        const activeConvo = document.querySelector('.msg-conversations-container__convo-item-link--active');
        if (!activeConvo) return null;

        const img = activeConvo.querySelector('img');
        return img?.src || null;
    }
};
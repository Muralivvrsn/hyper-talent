class AlertDialog {
    constructor() {
        this.dialog = null;
        this.isShowing = false;
        this.initialize();
    }

    initialize() {
        // Create dialog element
        this.dialog = document.createElement('div');
        this.dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        document.body.appendChild(this.dialog);
    }

    show(options) {
        const {
            title,
            message,
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmStyle = 'success', // 'success' or 'danger'
            onConfirm,
            onCancel
        } = options;

        if (this.isShowing) return;

        const confirmClass = confirmStyle === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

        this.dialog.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${title}</h3>
                    <p class="text-gray-600 dark:text-gray-300">${message}</p>
                </div>
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
                    <button class="cancel-btn px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none">
                        ${cancelText}
                    </button>
                    <button class="confirm-btn px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none ${confirmClass}">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        this.dialog.style.display = 'flex';
        this.isShowing = true;

        // Add event listeners
        const confirmBtn = this.dialog.querySelector('.confirm-btn');
        const cancelBtn = this.dialog.querySelector('.cancel-btn');

        confirmBtn.addEventListener('click', () => {
            this.hide();
            onConfirm?.();
        });

        cancelBtn.addEventListener('click', () => {
            this.hide();
            onCancel?.();
        });

        // Add click outside to cancel
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.hide();
                onCancel?.();
            }
        });
    }

    hide() {
        this.dialog.style.display = 'none';
        this.isShowing = false;
    }

    destroy() {
        if (this.dialog) {
            this.dialog.remove();
            this.dialog = null;
        }
    }
}

// Initialize only on LinkedIn
;(function() {
    if (!window.location.hostname.includes('linkedin.com')) return;
    if (window.alertDialog) return;

    window.alertDialog = new AlertDialog();
})();
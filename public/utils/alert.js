class AlertDialog {
    constructor() {
        this.dialog = null;
        this.isShowing = false;
        this.onConfirmCallback = null;
        this.onCancelCallback = null;
        this.initialize();
    }

    initialize() {
        // Create dialog element
        this.dialog = document.createElement('div');
        
        
        // Add classes to dialog
        this.dialog.className = 'alert-dialog-overlay';
        
        document.body.appendChild(this.dialog);
        
        // Handle keydown globally when dialog is shown
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }
    
    handleKeydown(event) {
        if (!this.isShowing) return;
        
        if (event.key === 'Enter') {
            // Simulate clicking the confirm button
            event.preventDefault();
            this.hide();
            this.onConfirmCallback?.();
        } else if (event.key === 'Escape' || event.key === 'Backspace' || event.key === 'Delete') {
            // Simulate clicking the cancel button
            event.preventDefault();
            this.hide();
            this.onCancelCallback?.();
        }
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
        
        // Store callbacks for keyboard event handling
        this.onConfirmCallback = onConfirm;
        this.onCancelCallback = onCancel;

        const confirmClass = confirmStyle === 'danger' ? 'alert-dialog-danger' : 'alert-dialog-success';

        this.dialog.innerHTML = `
            <div class="alert-dialog-container">
                <div class="alert-dialog-header">
                    <h3 class="alert-dialog-title">${title}</h3>
                </div>
                <div class="alert-dialog-body">
                    <p>${message}</p>
                </div>
                <div class="alert-dialog-footer">
                    <button class="alert-dialog-button alert-dialog-cancel">
                        ${cancelText}
                    </button>
                    <button class="alert-dialog-button ${confirmClass}">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        this.dialog.style.display = 'flex';
        
        // Trigger reflow to ensure transition works
        this.dialog.offsetHeight;
        
        // Add visible class for animation
        this.dialog.classList.add('visible');
        this.isShowing = true;

        // Add event listeners
        const confirmBtn = this.dialog.querySelector(`.${confirmClass}`);
        const cancelBtn = this.dialog.querySelector('.alert-dialog-cancel');

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
        if (!this.isShowing) return;
        
        this.dialog.classList.remove('visible');
        
        // Wait for animation to complete
        setTimeout(() => {
            this.dialog.style.display = 'none';
            this.isShowing = false;
            this.onConfirmCallback = null;
            this.onCancelCallback = null;
        }, 250);
    }

    destroy() {
        if (this.dialog) {
            this.dialog.remove();
            this.dialog = null;
            document.removeEventListener('keydown', this.handleKeydown.bind(this));
        }
    }
}

// Initialize only on LinkedIn
;(function() {
    if (!window.location.hostname.includes('linkedin.com')) return;
    if (window.alertDialog) return;

    window.alertDialog = new AlertDialog();
})();
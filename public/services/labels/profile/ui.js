class LabelProfileUI {
    constructor() {
        this.isInitialized = false;
        this.dropdownContainer = null;
    }

    init() {
        if (this.isInitialized) return;

        this.injectStyles();
        this.createDropdown();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    injectStyles() {
        const styles = `
            .label-profile-dropdown {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 300px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                z-index: 10000;
                display: none;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }

            .label-profile-dropdown.show {
                display: block;
            }

            .search-container {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
            }

            .search-input {
                width: 100%;
                padding: 8px 12px;
                font-size: 14px;
                border: 2px solid #e2e8f0;
                border-radius: 6px;
                outline: none;
                transition: all 0.2s ease;
            }

            .search-input:focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }

            .dropdown-content {
                max-height: 300px;
                overflow-y: auto;
            }

            .tag {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .tag:hover {
                background: #f1f5f9;
            }

            .tag.hidden {
                display: none;
            }

            .tag-color {
                width: 24px;
                height: 24px;
                border-radius: 6px;
                margin-right: 12px;
            }

            .tag-text {
                color: #334155;
                font-size: 14px;
            }

            .dropdown-content::-webkit-scrollbar {
                width: 6px;
            }

            .dropdown-content::-webkit-scrollbar-track {
                background: #f1f5f9;
            }

            .dropdown-content::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
            }

            .dropdown-content::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    createDropdown() {
        const template = `
            <div class="label-profile-dropdown">
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search labels..." autocomplete="off">
                </div>
                <div class="dropdown-content">
                </div>
            </div>
        `;

        const dropdownElement = document.createElement('div');
        dropdownElement.innerHTML = template;
        document.body.appendChild(dropdownElement.firstElementChild);
        this.dropdownContainer = document.querySelector('.label-profile-dropdown');
    }

    setupEventListeners() {
        // Handle 'L' key press and Esc
        document.addEventListener('keydown', (e) => {
            // Skip if target is search input
            if (e.target.classList.contains('search-input')) {
                if (e.key === 'Escape') {
                    this.closeDropdown();
                }
                return;
            }

            if (e.key === 'l' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.toggleDropdown();
            } else if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });

        // Handle search
        const searchInput = this.dropdownContainer.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value.toLowerCase());
        });

        // Prevent dropdown from closing when clicking inside
        this.dropdownContainer.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            this.closeDropdown();
        });
    }

    updateDropdown(labelsCache) {
        const dropdownContent = this.dropdownContainer.querySelector('.dropdown-content');
        dropdownContent.innerHTML = '';
        console.log(labelsCache)
        labelsCache.forEach(label => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.dataset.value = label.value;
            tagElement.innerHTML = `
                <div class="tag-color" style="background: ${label.color}"></div>
                <span class="tag-text">${label.text}</span>
            `;
            tagElement.addEventListener('click', () => {
                window.labelProfileCore.handleTagSelection(label.value);
            });
            dropdownContent.appendChild(tagElement);
        });
    }

    handleSearch(searchTerm) {
        const tags = this.dropdownContainer.querySelectorAll('.tag');
        tags.forEach(tag => {
            const text = tag.querySelector('.tag-text').textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                tag.classList.remove('hidden');
            } else {
                tag.classList.add('hidden');
            }
        });
    }

    toggleDropdown() {
        const isVisible = this.dropdownContainer.classList.contains('show');
        if (isVisible) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.dropdownContainer.classList.add('show');
        const searchInput = this.dropdownContainer.querySelector('.search-input');
        searchInput.value = '';
        searchInput.focus();
        this.handleSearch(''); // Reset search
    }

    closeDropdown() {
        this.dropdownContainer.classList.remove('show');
    }
}


window.labelProfileUI = new LabelProfileUI();
// BaseComponent.js - Keep unchanged
class BaseComponent {
    constructor(id) {
        this.id = id;
        this.element = null;
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    getOrCreateElement(id, tag = 'div') {
        let element = document.getElementById(id);
        if (!element) {
            element = document.createElement(tag);
            element.id = id;
        }
        return element;
    }
}

// SearchContainer.js - Keep unchanged
class SearchContainer extends BaseComponent {
    constructor(id, options = {}) {
        super(id);
        this.options = {
            placeholder: 'Search...',
            ...options
        };
        this.createSearchElement();
    }

    createSearchElement() {
        if (!this.element) {
            this.element = this.getOrCreateElement(`${this.id}-container`);
            this.element.className = 'label-search-container';

            const wrapper = document.createElement('div');
            wrapper.className = 'label-search-wrapper';

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('class', 'label-search-icon');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '2');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '11');
            circle.setAttribute('cy', '11');
            circle.setAttribute('r', '8');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'm21 21-4.3-4.3');

            svg.appendChild(circle);
            svg.appendChild(path);

            const input = this.getOrCreateElement(`${this.id}-input`, 'input');
            input.type = 'text';
            input.placeholder = this.options.placeholder;
            input.className = 'label-search-input';
            input.setAttribute('role', 'searchbox');
            input.setAttribute('aria-label', 'Search labels');
            input.setAttribute('tabindex', '0');

            input.addEventListener('input', (e) => {
                window.dispatchEvent(new CustomEvent('searchValueChanged', {
                    detail: { 
                        id: this.id,
                        value: e.target.value 
                    }
                }));
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('initiateKeyboardNavigation'));
                }
            });

            wrapper.appendChild(svg);
            wrapper.appendChild(input);
            this.element.appendChild(wrapper);
        }
        return this.element;
    }

    getValue() {
        return document.getElementById(`${this.id}-input`).value;
    }

    setValue(value) {
        document.getElementById(`${this.id}-input`).value = value;
    }

    focus() {
        document.getElementById(`${this.id}-input`).focus();
    }
}

// DropdownElement.js - Updated version
class DropdownElement extends BaseComponent {
    constructor(id, data, options = {}) {
        super(id);
        this.data = data;
        this.options = {
            onClick: null,
            onEdit: null,
            onDelete: null,
            onHover: null,
            showActions: true,
            ...options
        };
        this.isHovered = false;
        this.isEditable = false;
        this.createDropdownElement();
    }

    createDropdownElement() {
        this.element = this.getOrCreateElement(`dropdown-item-${this.id}`);
        this.element.className = 'dropdown-element';
        this.element.setAttribute('role', 'option');
        this.element.setAttribute('tabindex', '0');
        
        this.contentWrapper = document.createElement('div');
        this.contentWrapper.className = 'dropdown-content-wrapper';
        
        this.actionsWrapper = document.createElement('div');
        this.actionsWrapper.className = 'dropdown-actions-wrapper';
        
        this.updateContent();
        return this.element;
    }

    updateContent() {
        this.contentWrapper.innerHTML = '';
        
        const colorDot = this.getOrCreateElement(`${this.id}-color-dot`);
        colorDot.className = 'color-indicator';
        colorDot.style.backgroundColor = this.data.label_color;

        const labelText = this.getOrCreateElement(`${this.id}-label`);
        labelText.className = 'label-text';
        
        if (this.isEditable) {
            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.value = this.data.label_name;
            editInput.className = 'label-edit-input';
            editInput.setAttribute('aria-label', 'Edit label name');
            labelText.appendChild(editInput);

            const saveButton = document.createElement('button');
            saveButton.className = 'dropdown-action-btn save-btn';
            saveButton.setAttribute('aria-label', 'Save label');
            saveButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                </svg>
            `;
            saveButton.onclick = (e) => {
                e.stopPropagation();
                this.saveEdit(editInput.value);
            };
            this.actionsWrapper.appendChild(saveButton);
        } else {
            labelText.textContent = this.data.label_name;
        }

        const countBadgeId = `${this.id}-count`;
        let countBadge = document.getElementById(countBadgeId);
        
        if (this.data.profiles?.length > 0) {
            if (!countBadge) {
                countBadge = this.getOrCreateElement(countBadgeId);
                countBadge.className = 'count-badge';
            }
            countBadge.textContent = this.data.profiles.length;
        } else if (countBadge) {
            countBadge.remove();
        }

        this.contentWrapper.appendChild(colorDot);
        this.contentWrapper.appendChild(labelText);
        if (countBadge && this.data.profiles?.length > 0) {
            this.contentWrapper.appendChild(countBadge);
        }

        // Action buttons
        this.actionsWrapper.innerHTML = '';
        if (this.options.showActions) {
            if (this.options.onEdit && !this.isEditable) {
                const editButton = document.createElement('button');
                editButton.className = 'dropdown-action-btn edit-btn';
                editButton.setAttribute('aria-label', 'Edit label');
                editButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                    </svg>
                `;
                editButton.onclick = (e) => {
                    e.stopPropagation();
                    this.toggleEditMode();
                };
                this.actionsWrapper.appendChild(editButton);
            }

            if (this.options.onDelete) {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'dropdown-action-btn delete-btn';
                deleteButton.setAttribute('aria-label', 'Delete label');
                deleteButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                `;
                deleteButton.onclick = (e) => {
                    e.stopPropagation();
                    this.options.onDelete(this.data);
                };
                this.actionsWrapper.appendChild(deleteButton);
            }
        }

        this.element.innerHTML = '';
        this.element.appendChild(this.contentWrapper);
        this.element.appendChild(this.actionsWrapper);

        this.setupEventListeners();
    }

    toggleEditMode() {
        this.isEditable = !this.isEditable;
        this.updateContent();
        
        if (this.isEditable) {
            const input = this.element.querySelector('.label-edit-input');
            if (input) {
                input.focus();
                input.select();
                // Disable keyboard navigation while editing
                window.dispatchEvent(new CustomEvent('editModeChanged', { 
                    detail: { isEditing: true } 
                }));
            }
        } else {
            // Re-enable keyboard navigation after editing
            window.dispatchEvent(new CustomEvent('editModeChanged', { 
                detail: { isEditing: false } 
            }));
        }
    }

    saveEdit(newLabelName) {
        if (this.options.onEdit) {
            const updatedData = {
                ...this.data,
                label_name: newLabelName
            };
            this.options.onEdit(updatedData);
        }
        this.isEditable = false;
        this.updateContent();
    }

    setupEventListeners() {
        this.contentWrapper.onclick = this.handleInteraction.bind(this);
        
        this.element.onkeydown = (e) => {
            if (this.isEditable) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event bubbling
                    const input = this.element.querySelector('.label-edit-input');
                    if (input) {
                        this.saveEdit(input.value);
                    }
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event bubbling
                    this.isEditable = false;
                    this.updateContent();
                }
            } else {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleInteraction();
                }
            }
        };

        this.element.onmouseenter = () => {
            this.isHovered = true;
            this.element.classList.add('hovered');
            if (this.options.onHover) {
                this.options.onHover(this.data, true);
            }
        };

        this.element.onmouseleave = () => {
            this.isHovered = false;
            this.element.classList.remove('hovered');
            if (this.options.onHover) {
                this.options.onHover(this.data, false);
            }
        };

        this.element.onfocus = () => {
            this.element.classList.add('focused');
        };
        
        this.element.onblur = () => {
            this.element.classList.remove('focused');
        };
    }

    handleInteraction() {
        if (this.options.onClick && !this.isEditable) {
            this.options.onClick(this.data);
        }
        window.dispatchEvent(new CustomEvent(`${this.id}:clicked`, {
            detail: { data: this.data }
        }));
    }

    updateData(newData) {
        this.data = newData;
        this.updateContent();
    }
}

// DropdownContainer.js - Updated version
class DropdownContainer extends BaseComponent {
    constructor(id, options = {}) {
        super(id);
        this.options = {
            noDataText: 'No items found',
            onLabelClick: null,
            onLabelEdit: null,
            onLabelDelete: null,
            onLabelHover: null,
            ...options
        };
        this.elements = new Map();
        this.noResultsId = `${this.id}-no-results`;
        this.element = this.createDropdownContainer();
        this.categoryElements = new Map();
        this.currentState = null;
    }

    handleStateUpdate(data) {
        this.currentState = data;
        
        if (data.status === 'in_progress') {
            console.log('showing loading')
            this.showLoading();
            return;
        }

        if (data.status === 'logged_out') {
            this.showLogin();
            return;
        }

        // For logged_in state, show either labels or no labels message
        if (!data.labels || 
            ((!data.labels.owned || data.labels.owned.length === 0) && 
             (!data.labels.shared || data.labels.shared.length === 0))) {
            this.showNoLabels();
            return;
        }

        this.updateContent(data.labels);
    }

    showLoading() {
        this.element.innerHTML = `
            <div class="label-manager-loading">Loading labels...</div>
        `;
    }

    showLogin() {
        this.element.innerHTML = `
            <div class="label-manager-login">
                <button class="label-manager-login-button" 
                    onclick="chrome.runtime.sendMessage({type: 'INITIATE_LOGIN'})">
                    Login to view labels
                </button>
            </div>
        `;
    }

    showNoLabels() {
        this.element.innerHTML = `
            <div class="label-manager-no-labels">
                No labels available
            </div>
        `;
    }

    createDropdownContainer() {
        const container = this.getOrCreateElement(`${this.id}-container`);
        container.className = 'dropdown-container';
        container.setAttribute('role', 'listbox');
        container.setAttribute('aria-label', 'Label list');
        return container;
    }

    getCategoryElement(category) {
        const categoryId = `${this.id}-category-${category}`;
        let categoryElement = document.getElementById(categoryId);
        
        if (!categoryElement) {
            categoryElement = document.createElement('div');
            categoryElement.id = categoryId;
            categoryElement.className = 'category-header';
            categoryElement.setAttribute('role', 'group');
            categoryElement.setAttribute('aria-label', `${category} category`);
            categoryElement.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        }
        
        return categoryElement;
    }

    showNoResults(message) {
        let noResults = document.getElementById(this.noResultsId);
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = this.noResultsId;
            noResults.className = 'no-results';
            noResults.setAttribute('role', 'status');
        }
        noResults.textContent = message || this.options.noDataText;
        this.element.appendChild(noResults);
    }

    hideNoResults() {
        const noResults = document.getElementById(this.noResultsId);
        if (noResults) {
            noResults.remove();
        }
    }

    removeElement(labelId) {
        const element = this.elements.get(labelId);
        if (element) {
            element.element.remove();
            this.elements.delete(labelId);
            this.updateCategoriesVisibility();
        }
    }

    updateCategoriesVisibility() {
        const categories = new Set();
        this.elements.forEach(element => {
            if (element.element.style.display !== 'none') {
                categories.add(element.data.category);
            }
        });

        this.categoryElements.forEach((categoryEl, category) => {
            if (!categories.has(category)) {
                categoryEl.style.display = 'none';
            }
        });
    }

    updateContent(data = {}) {
        this.element.innerHTML = '';
        
        if (Object.keys(data).length === 0) {
            this.showNoLabels();
            return;
        }

        const ownedLabels = data.owned || [];
        const sharedLabels = data.shared || [];

        if (ownedLabels.length === 0 && sharedLabels.length === 0) {
            this.showNoLabels();
            return;
        }

        this.hideNoResults();
        this.categoryElements.clear();

        for (const [category, labels] of Object.entries(data)) {
            const categoryElement = this.getCategoryElement(category);
            this.categoryElements.set(category, categoryElement);
            this.element.appendChild(categoryElement);

            if (labels?.length > 0) {
                labels.forEach(label => {
                    const elementId = label.label_id;
                    let element = this.elements.get(elementId);
                    
                    if (!element) {
                        element = new DropdownElement(elementId, label, {
                            onClick: this.options.onLabelClick,
                            onEdit: this.options.onLabelEdit,
                            onDelete: async (labelData) => {
                                await this.options.onLabelDelete(labelData);
                                this.removeElement(labelData.label_id);
                            },
                            onHover: this.options.onLabelHover
                        });
                        this.elements.set(elementId, element);
                    } else {
                        element.updateData(label);
                    }
                    
                    this.element.appendChild(element.element);
                });
            }
        }

        window.dispatchEvent(new CustomEvent('dropdownContentUpdated'));
    }

    filterContent(searchText) {
        // Don't filter if not in the right state
        if (!this.currentState || this.currentState.status !== 'logged_in') {
            return;
        }

        const matches = [];
        const others = [];

        this.elements.forEach((element, id) => {
            const label = element.data;
            const labelName = label.label_name.toLowerCase();
            const search = searchText.toLowerCase();

            if (labelName.startsWith(search)) {
                matches.push(label);
            } else if (labelName.includes(search)) {
                others.push(label);
            }
            element.element.style.display = 'none';
        });

        const categoryHeaders = this.element.querySelectorAll('.category-header');
        categoryHeaders.forEach(header => header.style.display = 'none');

        if (matches.length === 0 && others.length === 0) {
            this.showNoResults(`Press 'Enter' to create a new label`);
            return;
        }

        this.hideNoResults();

        [...matches, ...others].forEach(label => {
            const element = this.elements.get(label.label_id);
            if (element) {
                element.element.style.display = '';
                this.element.appendChild(element.element);
            }
        });

        window.dispatchEvent(new CustomEvent('dropdownContentUpdated'));
    }

    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements.clear();
        super.destroy();
    }
}

// Export all components
window.BaseComponent = BaseComponent;
window.SearchContainer = SearchContainer;
window.DropdownElement = DropdownElement;
window.DropdownContainer = DropdownContainer;
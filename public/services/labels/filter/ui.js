window.labelFilterUI = {
    createFilterDropdown() {
        const labelButton = document.querySelector('#hypertalent-filter-btn');
        const buttonRect = labelButton.getBoundingClientRect();

        const dropdown = document.createElement('div');
        dropdown.id = 'hypertalent-dropdown';
        dropdown.className = 'hypertalent-dropdown';

        const updatePosition = () => {
            const newRect = labelButton.getBoundingClientRect();
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${newRect.bottom + window.scrollY + 5}px`;
            dropdown.style.left = `${newRect.left + window.scrollX}px`;
            dropdown.style.zIndex = '1000';
        };

        updatePosition();

        const labelList = document.createElement('ul');
        labelList.className = 'hypertalent-list';
        labelList.setAttribute('data-hypertalent', 'true');

        // Add the SVG symbol definition to the document if it doesn't exist
        if (!document.getElementById('checkmark-28')) {
            const svgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgDefs.style.display = 'none';
            svgDefs.innerHTML = `
                <symbol id="checkmark-28" viewBox="0 0 24 24" width="13px" height="13px">
                    <path stroke-linecap="round" stroke-miterlimit="10" fill="none" d="M22.9 3.7l-15.2 16.6-6.6-7.1"></path>
                </symbol>
            `;
            document.body.appendChild(svgDefs);
        }

        window.labelFilterCore.state.labelsCache.forEach((labelData, labelName) => {
            const labelItem = this.createLabelItem(labelName);
            labelList.appendChild(labelItem);
        });

        dropdown.appendChild(labelList);

        const handleResize = () => requestAnimationFrame(updatePosition);

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === dropdown) {
                        window.removeEventListener('resize', handleResize);
                        window.removeEventListener('scroll', handleResize);
                        observer.disconnect();
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true });

        return dropdown;
    },

    createLabelItem(labelName) {
        const labelContainer = document.createElement('li');
        labelContainer.className = 'hypertalent-list-item';
        labelContainer.setAttribute('data-hypertalent', 'true');

        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'checkbox-wrapper-28';
        checkboxWrapper.style.setProperty('--size', '20px');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'promoted-input-checkbox';
        checkbox.id = `hypertalent-checkbox-${labelName}`;
        checkbox.name = 'label-filter-value';
        checkbox.checked = window.labelFilterCore.state.allowedLabels.includes(labelName);
        checkbox.setAttribute('data-hypertalent', 'true');

        const checkmarkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        checkmarkSvg.innerHTML = '<path stroke-linecap="round" stroke-miterlimit="10" fill="none" d="M22.9 3.7l-15.2 16.6-6.6-7.1"></path>';
        checkmarkSvg.setAttribute('viewBox', '0 0 24 24');

        const label = document.createElement('label');
        label.htmlFor = `hypertalent-checkbox-${labelName}`;
        label.textContent = labelName;
        label.setAttribute('data-hypertalent', 'true');

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(checkmarkSvg);
        checkboxWrapper.appendChild(label);
        labelContainer.appendChild(checkboxWrapper);

        // Add the styles
        const style = document.createElement('style');
        style.textContent = `
            .checkbox-wrapper-28 {
                --size: 25px;
                position: relative;
            }
            .checkbox-wrapper-28 *,
            .checkbox-wrapper-28 *:before,
            .checkbox-wrapper-28 *:after {
                box-sizing: border-box;
            }
            .checkbox-wrapper-28 .promoted-input-checkbox {
                border: 0;
                clip: rect(0 0 0 0);
                height: 1px;
                margin: -1px;
                overflow: hidden;
                padding: 0;
                position: absolute;
                width: 1px;
            }
            .checkbox-wrapper-28 input:checked ~ svg {
                height: calc(var(--size) * 0.6);
                width: calc(var(--size) * 0.6);
                -webkit-animation: draw-checkbox-28 ease-in-out 0.2s forwards;
                        animation: draw-checkbox-28 ease-in-out 0.2s forwards;
            }
            .checkbox-wrapper-28 input:not(:checked) ~ svg {
                height: 0;
                width: calc(var(--size) * 0.6);
            }
            .checkbox-wrapper-28 label:active::after {
                background-color: #e6e6e6;
            }
            .checkbox-wrapper-28 label {
                color: #000000;
                line-height: var(--size);
                cursor: pointer;
                position: relative;
            }
            .checkbox-wrapper-28 label:after {
                content: "";
                height: var(--size);
                width: var(--size);
                margin-right: 8px;
                float: left;
                border: 2px solid #000000;
                border-radius: 3px;
                transition: 0.15s all ease-out;
            }
            .checkbox-wrapper-28 svg {
                stroke: #000000;
                stroke-width: 3px;
                height: 0;
                width: calc(var(--size) * 0.6);
                position: absolute;
                left: calc(var(--size) * 0.21);
                top: calc(var(--size) * 0.2);
                stroke-dasharray: 33;
                transition: height 0.2s ease-in-out;
            }
            .checkbox-wrapper-28 svg path {
                stroke-dasharray: 60;
                stroke-dashoffset: 0;
            }
            @-webkit-keyframes draw-checkbox-28 {
                0% {
                    stroke-dashoffset: 60;
                }
                100% {
                    stroke-dashoffset: 0;
                }
            }
            @keyframes draw-checkbox-28 {
                0% {
                    stroke-dashoffset: 60;
                }
                100% {
                    stroke-dashoffset: 0;
                }
            }
        `;

        // Only append the style once
        if (!document.querySelector('style[data-checkbox-style="28"]')) {
            style.setAttribute('data-checkbox-style', '28');
            document.head.appendChild(style);
        }

        checkbox.onchange = () => {
            if (checkbox.checked) {
                window.labelFilterCore.state.allowedLabels.push(labelName);
            } else {
                const index = window.labelFilterCore.state.allowedLabels.indexOf(labelName);
                if (index > -1) {
                    window.labelFilterCore.state.allowedLabels.splice(index, 1);
                }
            }
            this.filterConversations();
        };

        return labelContainer;
    },

    setupFilterButton() {
        const titleRow = document.querySelector('.msg-conversations-container__title-row');
        if (!titleRow || document.querySelector('#hypertalent-filter-btn')) return;

        const filterButton = document.createElement('button');
        filterButton.id = 'hypertalent-filter-btn';
        filterButton.className = 'artdeco-pill artdeco-pill--slate artdeco-pill--3 artdeco-pill--choice ember-view';
        filterButton.style.marginLeft = '8px';
        filterButton.innerHTML = '<span class="artdeco-pill__text">Filters</span>';

        filterButton.addEventListener('click', () => {
            const existingDropdown = document.querySelector('#hypertalent-dropdown');
            if (existingDropdown) {
                existingDropdown.classList.add('removing');
                setTimeout(() => {
                    existingDropdown.remove();
                }, 150);
                return;
            }

            const dropdown = this.createFilterDropdown();
            document.body.appendChild(dropdown);

            const handleClickOutside = (event) => {
                if (!dropdown.contains(event.target) && !filterButton.contains(event.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', handleClickOutside);
                }
            };

            setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
        });

        titleRow.appendChild(filterButton);
    },

    updateFilterButton() {
        this.setupFilterButton();
    },

    updateThemeUI() {
        const isDarkTheme = window.labelFilterCore.state.themeCache === 'dark';
        const dropdown = document.querySelector('#hypertalent-dropdown');
        if (dropdown) {
            dropdown.style.backgroundColor = isDarkTheme ? '#1D2226' : '#ffffff';
            dropdown.style.boxShadow = isDarkTheme ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)';
            dropdown.style.border = `1px solid ${isDarkTheme ? '#38434F' : '#e0e0e0'}`;

            const items = dropdown.querySelectorAll('li');
            items.forEach(item => {
                item.style.backgroundColor = isDarkTheme ? '#1D2226' : '#ffffff';

                const checkboxWrapper = item.querySelector('.checkbox-wrapper-28');
                if (checkboxWrapper) {
                    const label = checkboxWrapper.querySelector('label');
                    if (label) {
                        label.style.color = isDarkTheme ? '#ffffff' : '#000000';
                    }
                }
            });
        }
    },

    async filterConversations() {
        const conversations = document.querySelectorAll('.msg-conversations-container__conversations-list > li');
        const conversationsList = conversations[0]?.parentNode;
        if (!conversationsList) return;

        let loadingEl = document.querySelector('.prism-loading-message');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'prism-loading-message';
            loadingEl.style.cssText = `
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 13px;
                background: rgba(255, 255, 255, 0.95);
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                bottom: 0;
                z-index: 100;
                border-top: 1px solid #eee;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            loadingEl.innerHTML = 'Filtering conversations...';
            conversationsList.style.position = 'relative';
            conversationsList.appendChild(loadingEl);
        }

        conversations.forEach(conv => {
            conv.style.display = 'none';
            conv.style.opacity = '0';
        });

        let foundFirstMatch = false;

        for (const [index, conversation] of Array.from(conversations).entries()) {
            const imgEl = conversation.querySelector('.msg-selectable-entity__entity img') ||
                conversation.querySelector('.msg-facepile-grid--no-facepile img');
            const nameEl = conversation.querySelector('.msg-conversation-listitem__participant-names .truncate');

            if (!imgEl || !nameEl) continue;

            const imgSrc = imgEl.getAttribute('src');
            const name = nameEl.textContent.trim();

            const isMatch = await window.labelFilterCore.checkLabelMatch(imgSrc, name);

            if (isMatch) {
                if (!foundFirstMatch) {
                    foundFirstMatch = true;
                    loadingEl.style.top = 'auto';
                    loadingEl.style.bottom = '0';
                    loadingEl.style.background = 'linear-gradient(rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%)';
                }

                conversation.style.transition = 'opacity 0.3s ease';
                conversation.style.display = 'block';
                await window.labelFilterUtils.sleep(50);
                conversation.style.opacity = '1';
            }

            loadingEl.textContent = `Filtering conversations... (${index + 1}/${conversations.length})`;
        }

        loadingEl.remove();
    },

    cleanup() {
        const button = document.querySelector('#hypertalent-filter-btn');
        if (button) button.remove();

        const dropdown = document.querySelector('#hypertalent-dropdown');
        if (dropdown) dropdown.remove();
    }
};
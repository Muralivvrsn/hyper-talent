class LabelProfileCore {
    constructor() {
        this.state = {
            currentObserver: null,
            debounceTimer: null,
            isProcessing: false,
            labelsCache: new Map(),
            allowedLabels: [],
            structuredLabels: []
        };
    }

    async initialize() {
        try {
            console.log('Initializing label profile core');
            if (!window.labelsDatabase) {
                throw new Error('Labels database not found');
            }
            window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        } catch (error) {
            console.error('Failed to initialize LabelProfileCore:', error);
            window.labelUtils.showToast('Failed to initialize label system', 'error');
        }
    }

    processLabelsObject(labels) {
        if (!labels || typeof labels !== 'object') {
            throw new Error('Invalid labels data structure');
        }

        return Object.entries(labels).map(([labelName, labelData]) => {
            const { color, createdAt, codes } = labelData;
            
            const processedCodes = codes ? Object.entries(codes).map(([codeId, codeData]) => ({
                id: codeId,
                addedAt: codeData.addedAt,
                name: codeData.name,
                url: codeData.url,
                code: codeData.code
            })) : [];

            return {
                name: labelName,
                id: labelName,
                color: color || '#808080',
                createdAt,
                codes: processedCodes
            };
        });
    }

    async handleLabelsUpdate(labels) {
        try {
            if (!labels) {
                throw new Error('No labels data received');
            }

            let processedLabels;
            if (Array.isArray(labels)) {
                processedLabels = labels;
            } else if (typeof labels === 'object') {
                processedLabels = this.processLabelsObject(labels);
            } else {
                throw new Error('Invalid labels data format');
            }

            this.updateLabelsCache(processedLabels);
            this.state.structuredLabels = processedLabels;

            if (window.labelProfileUI) {
                window.labelProfileUI.updateDropdown(this.state.labelsCache);
            }
        } catch (error) {
            console.error('Error updating labels:', error);
            window.labelUtils.showToast('Failed to update labels', 'error');
        }
    }

    updateLabelsCache(labels) {
        try {
            if (!labels) {
                throw new Error('No labels provided for cache update');
            }

            this.state.labelsCache.clear();
            
            labels.forEach(label => {
                if (!label.id || !label.name) {
                    console.warn('Invalid label structure detected:', label);
                    return;
                }

                this.state.labelsCache.set(label.id, {
                    text: label.name,
                    color: label.color || '#808080',
                    value: label.id
                });
            });

            console.log('Labels cache updated successfully', this.state.labelsCache);
        } catch (error) {
            console.error('Error updating labels cache:', error);
            window.labelUtils.showToast('Failed to update labels cache', 'error');
        }
    }

    handleTagSelection(value) {
        try {
            if (!value) {
                throw new Error('No label value provided for selection');
            }

            if (typeof window.labelProfileAdd === 'function') {
                window.labelProfileAdd(value);
            } else {
                throw new Error('window.labelProfileAdd is not defined');
            }
        } catch (error) {
            console.error('Error handling tag selection:', error);
            window.labelUtils.showToast('Failed to apply label', 'error');
        }
    }

    getStructuredLabels() {
        return this.state.structuredLabels;
    }
}


window.labelProfileManager = {
    instance: null,

    async initialize() {
        if (!this.instance) {
            try {
                window.labelProfileUI.init();
                this.instance = new LabelProfileCore();
                await this.instance.initialize();
                console.log('ui initlizing ..')
                console.log('Label Profile Manager initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Label Profile Manager:', error);
                window.labelUtils.showToast('Failed to initialize label system', 'error');
                throw error;
            }
        }
        return this.instance;
    },

    getInstance() {
        if (!this.instance) {
            throw new Error('Label Profile Manager not initialized. Call initialize() first.');
        }
        return this.instance;
    }
};
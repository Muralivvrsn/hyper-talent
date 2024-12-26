window.labelManagerCore = {
    state: {
        loading: false,
        labels: [],
        currentObserver: null
    },

    initialize() {
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
    },

    handleLabelsUpdate(labels) {
        this.state.labels = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
        if (window.labelManagerUI.isVisible()) {
            const searchTerm = window.labelManagerUI.state.searchInput?.value || '';
            const filteredLabels = this.filterLabels(searchTerm);
            window.labelManagerUI.renderLabels(filteredLabels);
        }
    },

    filterLabels(searchTerm = '') {
        const filteredLabels = this.state.labels
            .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()));
        this.setLoading(false);
        window.labelManagerUI.renderLabels(filteredLabels);
        return filteredLabels;
    },

    async addNewLabel(labelName) {
        try {
            await window.labelsDatabase.addLabel(labelName);
            window.labelUtils.showToast(`Label "${labelName}" added`);
            return true;
        } catch (error) {
            window.labelUtils.showToast('Failed to add label', 'error');
            return false;
        }
    },

    async deleteLabel(labelName) {
        try {
            await window.labelsDatabase.deleteLabel(labelName);
            window.labelUtils.showToast(`Label "${labelName}" deleted`);
            return true;
        } catch (error) {
            window.labelUtils.showToast('Failed to delete label', 'error');
            return false;
        }
    },

    async editLabel(oldName, newName) {
        try {
            await window.labelsDatabase.editLabel(oldName, newName);
            window.labelUtils.showToast(`Label renamed to "${newName}"`);
            return true;
        } catch (error) {
            window.labelUtils.showToast('Failed to rename label', 'error');
            return false;
        }
    },

    async handleLabelSelect(labelName) {
        const profileInfo = window.labelUtils.getProfileInfo();
        const profileImage = window.labelUtils.getProfileImage();

        if (!profileInfo || !profileImage) {
            window.labelUtils.showToast('Could not find profile information', 'error');
            return false;
        }

        try {
            await window.labelsDatabase.addProfileToLabel(labelName, profileInfo, profileImage);
            window.labelUtils.showToast(`Added ${profileInfo.name} to ${labelName}`);
            return true;
        } catch (error) {
            window.labelUtils.showToast('Failed to add profile to label', 'error');
            return false;
        }
    },

    setLoading(loading) {
        this.state.loading = loading;
        window.labelManagerUI.setLoading(loading);
    },

    cleanup() {
        this.state.labels = [];
        this.state.loading = false;
    }
};




window.labelManager = {
    instance: null,

    initialize() {
        if (!this.instance) {
            this.instance = new LabelManager();
        }
        return this.instance;
    },

    getInstance() {
        return this.instance || this.initialize();
    }
};

class LabelManager {
    constructor() {
        window.labelManagerUI.setupStyles()
        window.labelManagerUI.createElements();
        window.labelManagerUI.setupMessageListButtons();
        window.labelManagerCore.initialize();
    }

    cleanup() {
        window.labelManagerCore.cleanup();
        window.labelManagerUI.cleanup();
    }
}

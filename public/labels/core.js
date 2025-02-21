// Self-initializing Label Core Module
(function initializeLabelCore() {
    if (window.labelCore) {
        console.log('Label Core is already initialized');
        return;
    }

    const generateLabelId = () => `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    window.labelCore = {
        initialized: true,
        version: '1.0.0',

        async createLabel(labelName) {
            const capitalizedName = labelName.trim().toUpperCase();
            const actionId = `CREATE_LABEL_${capitalizedName}`;
            let labelId = generateLabelId()

            if (!window.start_action(actionId, `Creating label "${capitalizedName}"...`)) {
                window.show_warning('A label creation is already in progress');
                return false;
            }

            try {
                // Check for existing label
                // const existingLabel = await window.labelsDatabase.findLabelByName(capitalizedName);
                // if (existingLabel) {
                //     window.complete_action(actionId, false, `Label "${capitalizedName}" already exists`);
                //     return false;
                // }

                // Create new label
                
                const labelData = {
                    label_name: capitalizedName,
                    label_id: labelId,
                    label_color: window.labelManagerUtils.getRandomColor(),
                };

                const success = await window.labelsDatabase.addLabel(labelData);
                window.complete_action(
                    actionId, 
                    success,
                    success ? `Label "${capitalizedName}" created successfully` : 'Failed to create label'
                );
                await this.applyLabel(labelId);
                return success;
            } catch (error) {
                console.error('Create label error:', error);
                window.complete_action(actionId, false, `Failed to create label "${capitalizedName}"`);
                return false;
            }
        },

        async applyLabel(labelId) {
            const actionId = `APPLY_LABEL_${labelId}`;
            const profileData = await window.labelManagerUtils.getProfileInfo();
            console.log(profileData)
            if (!window.start_action(actionId, 'Applying label...')) {
                window.show_warning('Label application is already in progress');
                return false;
            }

            try {
                const success = await window.labelsDatabase.addProfileToLabel(
                    labelId,
                    profileData.profile_id,
                    profileData
                );

                window.complete_action(
                    actionId,
                    success,
                    success ? 'Label applied successfully' : 'Failed to apply label'
                );
                return success;
            } catch (error) {
                console.error('Apply label error:', error);
                window.complete_action(actionId, false, 'Failed to apply label');
                return false;
            }
        },

        async removeLabel(labelId, profileId, labelName, profileName) {
            const actionId = 'REMOVE_LABEL';

            if (!window.start_action(actionId, `Removing label from ${profileName}...`)) {
                window.show_warning('Label removal is already in progress');
                return false;
            }

            try {
                const success = await window.labelsDatabase.removeProfileFromLabel(labelId, profileId);
                window.complete_action(
                    actionId,
                    success,
                    success ? `${labelName} has been removed from ${profileName}` : 'Failed to remove label'
                );
                return success;
            } catch (error) {
                console.error('Remove label error:', error);
                window.complete_action(actionId, false, 'Failed to remove label');
                return false;
            }
        },

        async deleteLabel(labelId, labelName) {
            const actionId = 'DELETE_LABEL';

            if (!window.start_action(actionId, `Deleting label "${labelName}"...`)) {
                window.show_warning('Label deletion is already in progress');
                return false;
            }

            try {
                const success = await window.labelsDatabase.deleteLabel(labelId);
                window.complete_action(
                    actionId,
                    success,
                    success ? `Label "${labelName}" deleted successfully` : 'Failed to delete label'
                );
                return success;
            } catch (error) {
                console.error('Delete label error:', error);
                window.complete_action(actionId, false, 'Failed to delete label');
                return false;
            }
        },

        async editLabel(labelId, labelData, originalName) {
            const actionId = 'EDIT_LABEL';
            const newName = labelData.label_name.trim().toUpperCase();

            if (!window.start_action(actionId, `Updating label "${originalName}"...`)) {
                window.show_warning('Label update is already in progress');
                return false;
            }

            try {
                const success = await window.labelsDatabase.editLabel(labelId, {
                    label_name: newName,
                    label_color: labelData.label_color
                });

                window.complete_action(
                    actionId,
                    success,
                    success ? `Label "${originalName}" updated to "${newName}"` : 'Failed to update label'
                );
                return success;
            } catch (error) {
                console.error('Edit label error:', error);
                window.complete_action(actionId, false, 'Failed to update label');
                return false;
            }
        },
    };
})();
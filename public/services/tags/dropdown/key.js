window.labelManagerKey = {
    handleKeyPress: (e, labelManager) => {
        if (e.key === 'l' && !labelManager.isTargetInput(e.target)) {
            e.preventDefault();
            labelManager.toggleDropdown();
        }
    },
    isTargetInput: (target) => {
        return target.tagName === 'INPUT' ||
               target.tagName === 'TEXTAREA' ||
               target.contentEditable === 'true';
    }
};
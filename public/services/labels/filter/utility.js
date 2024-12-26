window.labelFilterUtils = {
    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
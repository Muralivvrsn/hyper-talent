window.labelManagerCss = {
    getContainerStyles: (theme) => ({
        base: `
            display: flex;
            align-items: center;
            padding: 4px 8px;
            margin-left: 8px;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            position: relative;
        `,
        theme: theme === 'dark' ? `
            background-color: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
        ` : `
            background-color: white;
            border: 1px solid rgb(229, 231, 235);
            color: black;
        `
    }),
    getDropdownStyles: (theme) => ({
        base: `
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 4px;
            border-radius: 4px;
            min-width: 280px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 1000;
            padding: 8px;
        `,
        theme: theme === 'dark' ? `
            background-color: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
        ` : `
            background-color: white;
            border: 1px solid rgb(229, 231, 235);
            color: black;
        `
    })
};
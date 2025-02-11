function injectFilterStyles() {
    if (document.getElementById('hypertalent-style-filter')) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'hypertalent-style-filter';

    const cssContent = `
        ul.hypertalent-list[data-hypertalent="true"]{
            list-style: none !important;
            padding: 10px 20px !important;
            margin: 0 !important;
            background-color: #edf3f8 !important; //#38434f
            width: 260px !important;
            border-radius: 5px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            max-height: 300px !important;
            overflow-y: auto !important;
            width: 250px !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] li.hypertalent-list-item[data-hypertalent="true"] {
            margin: 1px 0 !important;
            font-size: 14px !important;
            position: relative !important;
            background: none !important;
            border: none !important;
            padding: 1px 0px !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] input[type="checkbox"].hypertalent-checkbox[data-hypertalent="true"] {
            position: absolute !important;
            opacity: 0 !important;
            cursor: pointer !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] input[type="checkbox"].hypertalent-checkbox[data-hypertalent="true"]:before {
            content: none !important;
            display: none !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] input[type="checkbox"].hypertalent-checkbox[data-hypertalent="true"]:after {
            content: none !important;
            display: none !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] label.hypertalent-checkbox-label[data-hypertalent="true"] {
            padding-left: 30px !important;
            cursor: pointer !important;
            letter-spacing: 0.5px !important;
            display: inline-block !important;
            transition: all 0.2s ease !important;
            color: #333333 !important;
            font-size: 14px !important;
            line-height: 20px !important;
            -webkit-text-fill-color: #333333 !important;
            user-select: none !important;
            -webkit-user-select: none !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] label.hypertalent-checkbox-label[data-hypertalent="true"]:before {
            content: '' !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 18px !important;
            height: 18px !important;
            border: 2px solid #4a90e2 !important;
            border-radius: 4px !important;
            background: white !important;
            transition: all 0.2s ease !important;
            box-sizing: border-box !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] label.hypertalent-checkbox-label[data-hypertalent="true"]:hover {
            color: #4a90e2 !important;
            letter-spacing: 0.8px !important;
            -webkit-text-fill-color: #4a90e2 !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] label.hypertalent-checkbox-label[data-hypertalent="true"]:hover:before {
            border-color: #2176ff !important;
            background: #f0f7ff !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] input[type="checkbox"].hypertalent-checkbox[data-hypertalent="true"]:checked + label.hypertalent-checkbox-label[data-hypertalent="true"]:before {
            background: #4a90e2 !important;
            border-color: #4a90e2 !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] label.hypertalent-checkbox-label[data-hypertalent="true"]:after {
            content: '' !important;
            margin-left: -3px !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] input[type="checkbox"].hypertalent-checkbox[data-hypertalent="true"]:checked + label.hypertalent-checkbox-label[data-hypertalent="true"]:after {
            opacity: 1 !important;
        }

        ul.hypertalent-list[data-hypertalent="true"] input[type="checkbox"].hypertalent-checkbox[data-hypertalent="true"]:checked + label.hypertalent-checkbox-label[data-hypertalent="true"] {
            color: #4a90e2 !important;
            letter-spacing: 0.8px !important;
            -webkit-text-fill-color: #4a90e2 !important;
        }

        div.hypertalent-dropdown {
            position: fixed !important;
            z-index: 9999 !important;
            background-color: #ffffff;
            opacity: 0;
            transform-origin: top;
            animation: dropdownOpen 0.2s ease forwards;
            border-radius:5px !important;
        }
        .hypertalent-dropdown.removing {
            animation: dropdownClose 0.15s ease forwards;
        }

        @keyframes dropdownOpen {
            from {
                opacity: 0;
                transform: translateY(-8px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes dropdownClose {
            from {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to {
                opacity: 0;
                transform: translateY(-8px) scale(0.95);
            }
        }
    `;

    styleElement.textContent = cssContent;
    document.head.insertAdjacentElement('beforeend', styleElement);
}

injectFilterStyles()
// window.LabelObserverCore = class LabelObserverCore {
//     constructor() {
//         this.labels = {};
//         this.listeners = new Set();
//         this.labelUpdateCallback = this.handleLabelsUpdate.bind(this);
//         this.debounceTimeout = null;
//         this.conversationObserver = null;
//         this.threadObserver = null;
//         this.DEBOUNCE_DELAY = 300;
//         this.lastUrl = window.location.href;
//         this.structuredLabels = [];
//         this.currentProfileInfo = null;
//         this.profileLabelMap = new Map();
        
//         this.initialize();
//         this.setupUrlChangeDetection();
//     }

//     initialize() {
//         window.labelsDatabase.addListener(this.labelUpdateCallback);
//         this.setupConversationObserver();
//         this.setupThreadObserver();
//     }

//     setupThreadObserver() {
//         const threadContainer = document.querySelector('div[id*="message-thread"]');
        
//         if (!threadContainer) {
//             setTimeout(() => this.setupThreadObserver(), 1000);
//             return;
//         }

//         this.threadObserver = new MutationObserver(() => {
//             if (this.debounceTimeout) {
//                 clearTimeout(this.debounceTimeout);
//             }

//             this.debounceTimeout = setTimeout(() => {
//                 console.log('Change detected in message thread');
//                 this.handleThreadChange();
//             }, this.DEBOUNCE_DELAY);
//         });

//         this.threadObserver.observe(threadContainer, {
//             childList: true,
//             subtree: true,
//             attributes: false,
//             characterData: false
//         });
//     }

//     extractProfileInfo() {
//         const threadContainer = document.querySelector('div[id*="message-thread"]');
//         if (!threadContainer) return null;

//         const profileLink = threadContainer.querySelector('a.msg-thread__link-to-profile');
//         if (!profileLink) return null;

//         const nameElement = profileLink.querySelector('h2.msg-entity-lockup__entity-title');
//         if (!nameElement) return null;

//         return {
//             name: nameElement.textContent.trim(),
//             url: profileLink.href,
//             timestamp: new Date().toISOString()
//         };
//     }

//     handleThreadChange() {
//         const newProfileInfo = this.extractProfileInfo();
//         if (!newProfileInfo) return;

//         if (!this.currentProfileInfo || 
//             this.currentProfileInfo.url !== newProfileInfo.url || 
//             this.currentProfileInfo.name !== newProfileInfo.name) {
            
//             this.currentProfileInfo = newProfileInfo;
//             console.log('Profile changed:', this.currentProfileInfo);
//             this.processCurrentLabels();
//         }
//     }

//     setupConversationObserver() {
//         const conversationsList = document.querySelector('ul.msg-conversations-container__conversations-list');
        
//         if (!conversationsList) {
//             setTimeout(() => this.setupConversationObserver(), 1000);
//             return;
//         }

//         this.conversationObserver = new MutationObserver(() => {
//             if (this.debounceTimeout) {
//                 clearTimeout(this.debounceTimeout);
//             }

//             this.debounceTimeout = setTimeout(() => {
//                 this.processConversationItems();
//             }, this.DEBOUNCE_DELAY);
//         });

//         this.conversationObserver.observe(conversationsList, {
//             childList: true,
//             subtree: true,
//             attributes: true,
//             characterData: true
//         });

//         // Initial processing
//         this.processConversationItems();
//     }

//     extractListItemInfo(li) {
//         const nameElement = li.querySelector('h3.msg-conversation-listitem__participant-names span.truncate');
//         if (!nameElement) return null;

//         const name = nameElement.textContent.trim();
//         return {
//             element: li,
//             name,
//             nameContainer: nameElement.closest('.msg-conversation-listitem__participant-names')
//         };
//     }

//     createLabelContainer() {
//         const container = document.createElement('div');
//         container.className = 'label-container';
//         container.style.cssText = `
//             display: flex;
//             flex-wrap: wrap;
//             gap: 4px;
//             margin-top: 4px;
//         `;
//         return container;
//     }

//     createLabelElement(label) {
//         const labelElement = document.createElement('span');
//         labelElement.setAttribute('data-label-name', label.name);
//         labelElement.style.cssText = `
//             background-color: ${label.color}E6;
//             color: white;
//             padding: 2px 8px;
//             border-radius: 20px;
//             font-size: 8px;
//             font-weight: 500;
//             text-transform: uppercase;
//             letter-spacing: 1px;
//         `;
//         labelElement.textContent = label.name;
//         return labelElement;
//     }

//     findMatchingLabels(name) {
//         return this.structuredLabels.filter(label => 
//             label.codes.some(code => code.name === name)
//         );
//     }

//     updateLabelsForItem(itemInfo) {
//         if (!itemInfo) return;
//         const { element, name, nameContainer } = itemInfo;

//         // Find existing label container
//         let labelContainer = nameContainer.querySelector('.label-container');
//         const matchingLabels = this.findMatchingLabels(name);

//         // If no matching labels and no existing container, do nothing
//         if (matchingLabels.length === 0 && !labelContainer) {
//             return;
//         }

//         // Create container if it doesn't exist
//         if (!labelContainer) {
//             labelContainer = this.createLabelContainer();
//             nameContainer.appendChild(labelContainer);
//         }

//         // Get current labels
//         const currentLabels = new Set(
//             Array.from(labelContainer.children)
//                 .map(el => el.getAttribute('data-label-name'))
//         );

//         // Add new labels
//         matchingLabels.forEach(label => {
//             if (!currentLabels.has(label.name)) {
//                 labelContainer.appendChild(this.createLabelElement(label));
//             }
//             currentLabels.delete(label.name);
//         });

//         // Remove labels that no longer apply
//         currentLabels.forEach(labelName => {
//             const labelElement = labelContainer.querySelector(`[data-label-name="${labelName}"]`);
//             if (labelElement) {
//                 labelElement.remove();
//             }
//         });

//         // Remove container if empty
//         if (labelContainer.children.length === 0) {
//             labelContainer.remove();
//         } else {
//             // Adjust container height if needed
//             const card = element.querySelector('.msg-conversation-card__content--selectable');
//             if (card) card.style.height = '105px';
//         }
//     }

//     processConversationItems() {
//         const items = document.querySelectorAll('li.msg-conversation-listitem');
//         items.forEach(item => {
//             const itemInfo = this.extractListItemInfo(item);
//             this.updateLabelsForItem(itemInfo);
//         });
//     }

//     processCurrentLabels() {
//         if (this.currentProfileInfo) {
//             this.processConversationItems();
//         }
//     }

//     handleLabelsUpdate(labels) {
//         this.labels = labels;
        
//         this.structuredLabels = Object.entries(labels).map(([labelName, labelData]) => {
//             const { color, createdAt, codes } = labelData;
            
//             const processedCodes = codes ? Object.entries(codes).map(([codeId, codeData]) => ({
//                 id: codeId,
//                 addedAt: codeData.addedAt,
//                 name: codeData.name,
//                 url: codeData.url,
//                 code: codeData.code
//             })) : [];

//             return {
//                 name: labelName,
//                 color,
//                 createdAt,
//                 codes: processedCodes
//             };
//         });

//         // Process conversation items and current profile when labels update
//         this.processConversationItems();
//         this.processCurrentLabels();
//     }

//     setupUrlChangeDetection() {
//         setInterval(() => {
//             if (this.lastUrl !== window.location.href) {
//                 console.log('URL changed, reinitializing observers...');
//                 this.lastUrl = window.location.href;
//                 this.reinitializeObservers();
//             }
//         }, 100);
//     }

//     reinitializeObservers() {
//         if (this.conversationObserver) {
//             this.conversationObserver.disconnect();
//         }
//         if (this.threadObserver) {
//             this.threadObserver.disconnect();
//         }
//         if (this.debounceTimeout) {
//             clearTimeout(this.debounceTimeout);
//         }
        
//         this.setupConversationObserver();
//         this.setupThreadObserver();
//     }

//     addListener(callback) {
//         this.listeners.add(callback);
//         if (this.structuredLabels.length > 0) {
//             callback(this.structuredLabels, this.currentProfileInfo);
//         }
//     }

//     removeListener(callback) {
//         this.listeners.delete(callback);
//     }

//     notifyListeners(labels, profileInfo = null) {
//         this.listeners.forEach(callback => {
//             try {
//                 callback(labels, profileInfo);
//             } catch (error) {
//                 console.error('Error in listener:', error);
//             }
//         });
//     }

//     getAllLabels() {
//         return this.structuredLabels;
//     }

//     getCurrentProfile() {
//         return this.currentProfileInfo;
//     }

//     destroy() {
//         if (this.labelUpdateCallback) {
//             window.labelsDatabase.removeListener(this.labelUpdateCallback);
//         }
//         if (this.conversationObserver) {
//             this.conversationObserver.disconnect();
//         }
//         if (this.threadObserver) {
//             this.threadObserver.disconnect();
//         }
//         if (this.debounceTimeout) {
//             clearTimeout(this.debounceTimeout);
//         }
        
//         // Clean up existing labels
//         document.querySelectorAll('.label-container').forEach(container => {
//             container.remove();
//         });
        
//         this.listeners.clear();
//         this.currentProfileInfo = null;
//         this.profileLabelMap.clear();
//     }
// };

// // Initialize

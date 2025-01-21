class MessageTemplateDatabase {
    constructor() {
        this.templates = [];
        this.listeners = new Set();
        this.currentSubscriptionBatch = new Set();
        this.pendingTemplates = new Map();
        this.lastProcessedChunk = -1;
        this.totalChunks = 0;

        window.firebaseService.addAuthStateListener(this.handleAuthStateChange.bind(this));
    }

    async handleAuthStateChange(user) {
        try {
            if (user) {
                await this.setupRealtimeSync();
            } else {
                this.templates = [];
                this.notifyListeners();
                if (this.unsubscribeSnapshot) {
                    this.unsubscribeSnapshot();
                    this.unsubscribeSnapshot = null;
                }
            }
        } catch (error) {
            console.error('[MessageTemplateDB] Error handling auth state change:', error);
        }
    }

    async setupRealtimeSync() {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) return;

            // Cleanup existing subscriptions
            this.cleanupSubscriptions();

            // Initialize subscription tracking
            this.currentSubscriptionBatch = new Set();
            this.pendingTemplates = new Map();
            this.lastProcessedChunk = -1;
            this.totalChunks = 0;

            // Helper function to chunk array
            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            };

            // Set up user document listener
            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                try {
                    if (!userDoc.exists) {
                        console.warn('[MessageTemplateDB] User document not found');
                        return;
                    }

                    const userData = userDoc.data();
                    const templateIds = userData?.d?.s || []; // Get template IDs from d.s

                    // Split templateIds into chunks of 10
                    const templateIdChunks = chunkArray(templateIds, 10);
                    this.totalChunks = templateIdChunks.length;

                    // Create new subscription batch
                    const newBatch = new Set([userUnsubscribe]);

                    // Clear existing templates
                    this.templates = [];
                    this.pendingTemplates.clear();
                    this.lastProcessedChunk = -1;

                    // Set up listeners for each chunk of templates
                    templateIdChunks.forEach((chunk, chunkIndex) => {
                        if (!chunk.length) return;

                        const templateUnsubscribe = db.collection('message_templates')
                            .where(firebase.firestore.FieldPath.documentId(), 'in', chunk)
                            .onSnapshot(async (templateSnapshot) => {
                                try {
                                    templateSnapshot.docs.forEach(doc => {
                                        const templateData = doc.data();
                                        this.pendingTemplates.set(doc.id, {
                                            template_id: doc.id,
                                            title: templateData.t,
                                            message: templateData.n,
                                            last_updated: templateData.lu
                                        });
                                    });

                                    // Track chunk processing
                                    this.lastProcessedChunk = Math.max(this.lastProcessedChunk, chunkIndex);

                                    // If this was the last chunk, update templates array
                                    if (this.lastProcessedChunk === this.totalChunks - 1) {
                                        this.templates = Array.from(this.pendingTemplates.values());
                                        this.notifyListeners();
                                    }
                                } catch (error) {
                                    console.error('[MessageTemplateDB] Error processing template chunk:', error);
                                    window.show_error('Error syncing template data');
                                }
                            }, error => {
                                console.error('[MessageTemplateDB] Template listener error:', error);
                                window.show_error('Error in template sync');
                            });

                        newBatch.add(templateUnsubscribe);
                    });

                    // Cleanup old batch and set new one
                    const oldBatch = this.currentSubscriptionBatch;
                    this.currentSubscriptionBatch = newBatch;
                    oldBatch.forEach(unsub => unsub());

                } catch (error) {
                    console.error('[MessageTemplateDB] Error processing user data:', error);
                    window.show_error('Error syncing user data');
                }
            }, error => {
                console.error('[MessageTemplateDB] User listener error:', error);
                window.show_error('Error in user sync');
            });

            this.currentSubscriptionBatch.add(userUnsubscribe);

        } catch (error) {
            console.error('[MessageTemplateDB] Setup realtime sync failed:', error);
            window.show_error('Failed to sync templates');
            this.cleanupSubscriptions();
        }
    }

    cleanupSubscriptions() {
        if (this.currentSubscriptionBatch) {
            this.currentSubscriptionBatch.forEach(unsub => {
                try {
                    unsub();
                } catch (error) {
                    console.error('[MessageTemplateDB] Error cleaning up subscription:', error);
                }
            });
            this.currentSubscriptionBatch.clear();
        }
    }

    async addTemplate(templateData) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            // Update user's document to include new template ID
            const userRef = db.collection('users').doc(currentUser.uid);
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.data();
                const userTemplates = userData?.d?.s || [];

                if (!userTemplates.includes(templateData.template_id)) {
                    transaction.update(userRef, {
                        'd.s': firebase.firestore.FieldValue.arrayUnion(templateData.template_id)
                    });
                }
            });

            // Create template document
            const templateRef = db.collection('message_templates').doc(templateData.template_id);
            await templateRef.set({
                t: templateData.title,
                n: templateData.message,
                lu: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('[MessageTemplateDB] Failed to add template:', error);
            return false;
        }
    }

    async editTemplate(templateId, updatedTemplate) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            const templateRef = db.collection('message_templates').doc(templateId);
            await templateRef.update({
                t: updatedTemplate.title,
                n: updatedTemplate.message,
                lu: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('[MessageTemplateDB] Failed to edit template:', error);
            return false;
        }
    }

    async deleteTemplate(templateId) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Not initialized');

            // Remove template ID from user's document
            const userRef = db.collection('users').doc(currentUser.uid);
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.data();
                const userTemplates = userData?.d?.s || [];

                if (userTemplates.includes(templateId)) {
                    transaction.update(userRef, {
                        'd.s': firebase.firestore.FieldValue.arrayRemove(templateId)
                    });
                }
            });

            // Delete template document
            const templateRef = db.collection('message_templates').doc(templateId);
            await templateRef.delete();

            return true;
        } catch (error) {
            console.error('[MessageTemplateDB] Failed to delete template:', error);
            return false;
        }
    }

    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
            callback(this.templates);
        }
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.templates);
            } catch (error) {
                console.error('[MessageTemplateDB] Error in listener callback:', error);
            }
        });
    }

    destroy() {
        if (this.unsubscribeSnapshot) {
            this.unsubscribeSnapshot();
            this.unsubscribeSnapshot = null;
        }
        this.listeners.clear();
    }
}

// Initialize the message template database
window.messageTemplateDatabase = new MessageTemplateDatabase();
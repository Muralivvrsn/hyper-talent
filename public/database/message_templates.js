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
    
            // First, ensure complete cleanup
            if (this.currentSubscriptionBatch) {
                this.currentSubscriptionBatch.forEach(unsub => {
                    try {
                        unsub();
                    } catch (e) {
                        console.error('[MessageTemplateDB] Cleanup error:', e);
                    }
                });
            }
    
            // Reset all subscriptions and state
            this.currentSubscriptionBatch = new Set();
            this.templates = [];
    
            // Set up the user document listener first
            const userRef = db.collection('users').doc(currentUser.uid);
            const userUnsubscribe = userRef.onSnapshot(
                (userDoc) => {
                    // Clear existing template listeners first
                    this.currentSubscriptionBatch.forEach(unsub => {
                        if (unsub !== userUnsubscribe) { // Keep user listener active
                            try {
                                unsub();
                            } catch (e) {
                                console.error('[MessageTemplateDB] Template listener cleanup error:', e);
                            }
                        }
                    });
    
                    // Reset to only user listener
                    this.currentSubscriptionBatch = new Set([userUnsubscribe]);
    
                    if (!userDoc.exists) {
                        // console.log('[MessageTemplateDB] User doc not found');
                        return;
                    }
    
                    const templateIds = userDoc.data()?.d?.s || [];
                    // console.log('[MessageTemplateDB] User doc updated, template IDs:', templateIds);
    
                    // Set up new listeners for each template
                    templateIds.forEach(templateId => {
                        const templateUnsubscribe = db.collection('message_templates')
                            .doc(templateId)
                            .onSnapshot(
                                async (templateDoc) => {
                                    if (!templateDoc.exists) {
                                        // console.log(`[MessageTemplateDB] Template ${templateId} does not exist`);
                                        return;
                                    }
    
                                    const templateData = templateDoc.data();
                                    // console.log(`[MessageTemplateDB] Template ${templateId} updated:`, templateData);
    
                                    // Update templates array
                                    const templateIndex = this.templates.findIndex(t => t.template_id === templateId);
                                    const newTemplate = {
                                        template_id: templateDoc.id,
                                        title: templateData.t,
                                        message: templateData.n,
                                        last_updated: templateData.lu
                                    };
    
                                    if (templateIndex === -1) {
                                        this.templates.push(newTemplate);
                                    } else {
                                        this.templates[templateIndex] = newTemplate;
                                    }
    
                                    // console.log('[MessageTemplateDB] Templates updated:', this.templates);
                                    this.notifyListeners();
                                },
                                error => {
                                    console.error(`[MessageTemplateDB] Template ${templateId} listener error:`, error);
                                }
                            );
    
                        this.currentSubscriptionBatch.add(templateUnsubscribe);
                    });
    
                    if (templateIds.length === 0) {
                        this.templates = [];
                        this.notifyListeners();
                    }
                },
                error => {
                    console.error('[MessageTemplateDB] User document listener error:', error);
                }
            );
    
            // Add initial user subscription
            this.currentSubscriptionBatch.add(userUnsubscribe);
            // console.log('[MessageTemplateDB] Sync setup completed');
    
        } catch (error) {
            console.error('[MessageTemplateDB] Setup realtime sync failed:', error);
            this.cleanupSubscriptions();
        }
    }
    
    // Make sure cleanup is thorough
    cleanupSubscriptions() {
        if (this.currentSubscriptionBatch) {
            this.currentSubscriptionBatch.forEach(unsub => {
                try {
                    unsub();
                } catch (e) {
                    console.error('[MessageTemplateDB] Cleanup error:', e);
                }
            });
            this.currentSubscriptionBatch.clear();
        }
        this.templates = [];
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
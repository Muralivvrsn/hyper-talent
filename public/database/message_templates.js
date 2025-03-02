class MessageTemplateDatabase {
    constructor() {
        this.templates = [];
        this.listeners = new Set();
        this.currentSubscriptionBatch = new Set();
        this.status = null; // Start with no status
        this.initialized = false;
        this.isLoadingTemplates = false;

        // Bind the auth listener only once
        this.boundAuthListener = this.handleAuthStateChange.bind(this);
        window.firebaseService.addAuthStateListener(this.boundAuthListener);
    }

    async handleAuthStateChange(authState) {
        try {
            if (!authState || !authState.type || !authState.status) {
                return;
            }

            // If we're already loading templates, don't trigger another load
            if (this.isLoadingTemplates) {
                return;
            }

            switch (authState.status) {
                case 'logged_in':
                    if (this.status !== 'in_progress') {
                        // console.log('[MessageTemplateDB] Starting template load process');
                        this._updateStatus('in_progress');
                        await this.loadTemplates();
                    }
                    break;

                case 'logged_out':
                    this.cleanupSubscriptions();
                    this.templates = [];
                    this._updateStatus('logged_out');
                    break;

                case 'in_progress':
                    // Only update if we're not already in progress
                    if (this.status !== 'in_progress') {
                        this._updateStatus('in_progress');
                    }
                    break;
            }
        } catch (error) {
            // console.error('[MessageTemplateDB] Auth state change error:', error);
            this._notifyError('auth_state_change_failed', error.message);
        }
    }

    _updateStatus(newStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.notifyListeners();
        }
    }

    updateTemplate(newTemplate) {
        const index = this.templates.findIndex(t => t.template_id === newTemplate.template_id);
        if (index === -1) {
            this.templates.push(newTemplate);
        } else {
            this.templates[index] = newTemplate;
        }
        this.notifyListeners();
    }

    cleanupSubscriptions() {
        this.currentSubscriptionBatch.forEach(unsub => {
            try {
                unsub();
            } catch (e) {
                // console.error('[MessageTemplateDB] Cleanup error:', e);
            }
        });
        this.currentSubscriptionBatch.clear();
        this.initialized = false;
    }

    cleanupTemplateSubscriptions() {
        // Find the user listener in the batch
        const userListener = Array.from(this.currentSubscriptionBatch)
            .find(unsub => unsub.isUserListener === true);
    
        // Remove all listeners except the user listener
        this.currentSubscriptionBatch.forEach(unsub => {
            if (unsub !== userListener) {
                try {
                    unsub();
                } catch (e) {
                    console.error('Template cleanup error:', e);
                }
            }
        });
    
        // Clear the batch and add back the user listener if it exists
        this.currentSubscriptionBatch.clear();
        if (userListener) {
            this.currentSubscriptionBatch.add(userListener);
        }
    }

    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.add(callback);
            // Only notify if we have a status
            if (this.status) {
                callback({
                    type: 'status',
                    status: this.status,
                    templates: this.templates
                });
            }
        }
    }

    removeListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback({
                    type: 'status',
                    status: this.status,
                    templates: this.templates
                });
            } catch (error) {
                // console.error('[MessageTemplateDB] Error in listener callback:', error);
            }
        });
    }

    _notifyError(code, message) {
        // console.error('[MessageTemplateDB] Error:', code, message);
        this.listeners.forEach(callback => {
            try {
                callback({
                    type: 'error',
                    status: this.status,
                    templates: this.templates,
                    error: {
                        code,
                        message,
                        timestamp: new Date().toISOString()
                    }
                });
            } catch (error) {
                // console.error('[MessageTemplateDB] Error in error notification:', error);
            }
        });
    }

    _notifyListeners(status) {
        this.listeners.forEach(callback => {
            try {
                callback({
                    type: 'status',
                    status: status,
                    templates: this.templates,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                // console.error('[MessageTemplateDB] Error in listener notification:', error);
            }
        });
    }
    // In MessageTemplateDatabase class, modify these methods:

    async setupTemplateListeners(db, templateRefs) {
        // Clean up old template listeners but keep user listener
        this.cleanupTemplateSubscriptions();

        const acceptedTemplates = templateRefs.filter(ref =>
            ref.t === 'owned' || (ref.t === 'shared' && ref.a === true)
        );

        // Keep existing templates that are still in acceptedTemplates
        this.templates = this.templates.filter(template =>
            acceptedTemplates.some(ref => ref.id === template.template_id)
        );

        // Set up listeners for all templates
        acceptedTemplates.forEach(templateRef => {
            const templateUnsubscribe = db.collection('message_templates_v2')
                .doc(templateRef.id)
                .onSnapshot(
                    async (templateDoc) => {
                        try {
                            if (!templateDoc.exists) {
                                if (templateRef.t === 'owned' && templateRef.ca) {
                                    // For new templates, wait and retry
                                    let retries = 3;
                                    while (retries > 0 && !templateDoc.exists) {
                                        await new Promise(resolve => setTimeout(resolve, 300));
                                        const newDoc = await templateDoc.ref.get();
                                        if (newDoc.exists) {
                                            templateDoc = newDoc;
                                            break;
                                        }
                                        retries--;
                                    }
                                }

                                if (!templateDoc.exists) {
                                    this.templates = this.templates.filter(t =>
                                        t.template_id !== templateRef.id
                                    );
                                    this.notifyListeners();
                                    return;
                                }
                            }

                            const templateData = templateDoc.data();
                            const newTemplate = {
                                template_id: templateDoc.id,
                                title: templateData.t,
                                message: templateData.n,
                                last_updated: templateData.lu,
                                type: templateRef.t,
                                created_at: templateRef.ca,
                                ...(templateRef.t === 'shared' && {
                                    shared_by_name: templateRef.sbn,
                                    shared_at: templateRef.sa,
                                    accepted: templateRef.a
                                })
                            };

                            const index = this.templates.findIndex(t =>
                                t.template_id === templateDoc.id
                            );

                            if (index === -1) {
                                this.templates.push(newTemplate);
                            } else {
                                this.templates[index] = newTemplate;
                            }

                            this.notifyListeners();
                        } catch (error) {
                            this._notifyError('template_processing_failed', error.message);
                        }
                    },
                    error => {
                        this._notifyError('template_listener_failed', error.message);
                    }
                );

            this.currentSubscriptionBatch.add(templateUnsubscribe);
        });
    }

    async loadTemplates() {
        if (this.isLoadingTemplates) {
            return;
        }
    
        this.isLoadingTemplates = true;
    
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) {
                throw new Error('Firebase not initialized');
            }
    
            // Clean up existing subscriptions but DON'T set up new ones yet
            this.cleanupSubscriptions();
            
            // Set up user document listener
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            
            // Create the user listener with a unique identifier
            const userUnsubscribe = userRef.onSnapshot({
                includeMetadataChanges: true  // This is important for catching all updates
            }, async (userDoc) => {
                try {
                    console.log('Message template updated', userDoc.metadata.hasPendingWrites);
                    
                    // Skip updates from local writes until they're confirmed by the server
                    if (userDoc.metadata.hasPendingWrites) {
                        return;
                    }
    
                    if (!userDoc.exists) {
                        this.templates = [];
                        this._updateStatus('logged_in');
                        return;
                    }
    
                    // Get template references
                    const templateRefs = userDoc.data()?.d?.s || [];
                    
                    // Set up listeners for each template
                    await this.setupTemplateListeners(db, templateRefs);
                    
                    // Update status after processing all templates
                    this._updateStatus('logged_in');
                } catch (error) {
                    console.error('Template processing error:', error);
                    this._notifyError('template_processing_failed', error.message);
                }
            }, error => {
                console.error('User listener error:', error);
                this._notifyError('user_listener_failed', error.message);
                this._updateStatus('logged_out');
            });
    
            // Add a special property to identify this as the user listener
            userUnsubscribe.isUserListener = true;
            
            // Store the unsubscribe function
            this.currentSubscriptionBatch.add(userUnsubscribe);
            this.initialized = true;
    
        } catch (error) {
            console.error('Load templates error:', error);
            this._notifyError('load_templates_failed', error.message);
            this.cleanupSubscriptions();
            this._updateStatus('logged_out');
        } finally {
            this.isLoadingTemplates = false;
        }
    }
    
    async createTemplate(title, message) {
        try {
            if (!title || !message) {
                throw new Error('Title and message are required');
            }
    
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            
            if (!db || !currentUser) {
                throw new Error('Firebase not initialized or user not logged in');
            }
    
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            
            // Create the template document first
            const templateRef = db.collection('message_templates_v2').doc();
            await templateRef.set({
                t: title,
                n: message,
                lu: firebase.firestore.FieldValue.serverTimestamp()
            });
    
            // Now update the user document
            await userRef.update({
                'd.s': firebase.firestore.FieldValue.arrayUnion({
                    id: templateRef.id,
                    t: 'owned',
                    ca: firebase.firestore.FieldValue.serverTimestamp()
                })
            });
    
            return templateRef.id;
        } catch (error) {
            this._notifyError('create_template_failed', error.message);
            throw error;
        }
    }
    async updateTemplateContent(templateId, title, message) {
        try {
            if (!templateId || !title || !message) {
                throw new Error('Template ID, title, and message are required');
            }

            const db = window.firebaseService.db;
            if (!db) {
                throw new Error('Firebase not initialized');
            }

            // Update template in message_templates_v2
            await db.collection('message_templates_v2').doc(templateId).update({
                t: title,
                n: message,
                lu: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            // console.error('[MessageTemplateDB] Update template error:', error);
            this._notifyError('update_template_failed', error.message);
            throw error;
        }
    }

    async deleteTemplate(templateId) {
        try {
            if (!templateId) {
                throw new Error('Template ID is required');
            }

            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;

            if (!db || !currentUser) {
                throw new Error('Firebase not initialized or user not logged in');
            }

            // Get current user document
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                throw new Error('User document does not exist');
            }

            const userData = userDoc.data();
            let templates = userData?.d?.s || [];

            // Find template reference in user document
            const templateIndex = templates.findIndex(t => t.id === templateId);
            if (templateIndex === -1) {
                throw new Error('Template not found in user document');
            }

            const templateRef = templates[templateIndex];

            // Check if template is owned
            if (templateRef.t === 'owned') {
                // If owned, delete from message_templates_v2
                await db.collection('message_templates_v2').doc(templateId).delete();
            }

            // Remove reference from user document
            templates = templates.filter(t => t.id !== templateId);
            await userRef.update({
                'd.s': templates
            });

            return true;
        } catch (error) {
            // console.error('[MessageTemplateDB] Delete template error:', error);
            this._notifyError('delete_template_failed', error.message);
            throw error;
        }
    }

    async shareTemplate(templateId, recipientId) {
        try {
            if (!templateId || !recipientId) {
                throw new Error('Template ID and recipient ID are required');
            }

            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;

            if (!db || !currentUser) {
                throw new Error('Firebase not initialized or user not logged in');
            }

            // Get template document
            const templateDoc = await db.collection('message_templates_v2').doc(templateId).get();
            if (!templateDoc.exists) {
                throw new Error('Template does not exist');
            }

            // Get recipient user document
            const recipientRef = db.collection('users_v2').doc(recipientId);
            const recipientDoc = await recipientRef.get();

            if (!recipientDoc.exists) {
                throw new Error('Recipient user does not exist');
            }

            // Get current user's display name
            const userProfileDoc = await db.collection('user_profiles').doc(currentUser.uid).get();
            const sharedByName = userProfileDoc.exists ? userProfileDoc.data().displayName : 'Unknown User';

            // Add template reference to recipient's document
            const recipientData = recipientDoc.data();
            const templates = recipientData?.d?.s || [];

            // Check if template is already shared
            if (templates.some(t => t.id === templateId)) {
                throw new Error('Template already shared with this user');
            }

            await recipientRef.update({
                'd.s': [...templates, {
                    id: templateId,
                    t: 'shared',
                    sbn: sharedByName,
                    sa: firebase.firestore.FieldValue.serverTimestamp(),
                    a: null // Initially unaccepted
                }]
            });

            return true;
        } catch (error) {
            // console.error('[MessageTemplateDB] Share template error:', error);
            this._notifyError('share_template_failed', error.message);
            throw error;
        }
    }

    async updateSharedTemplateStatus(templateId, accept) {
        try {
            if (!templateId) {
                throw new Error('Template ID is required');
            }

            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;

            if (!db || !currentUser) {
                throw new Error('Firebase not initialized or user not logged in');
            }

            // Get current user document
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                throw new Error('User document does not exist');
            }

            const userData = userDoc.data();
            const templates = userData?.d?.s || [];

            // Find template reference in user document
            const templateIndex = templates.findIndex(t => t.id === templateId && t.t === 'shared');
            if (templateIndex === -1) {
                throw new Error('Shared template not found');
            }

            // Update template reference status
            templates[templateIndex].a = accept;

            await userRef.update({
                'd.s': templates
            });

            return true;
        } catch (error) {
            // console.error('[MessageTemplateDB] Update shared template status error:', error);
            this._notifyError('update_shared_status_failed', error.message);
            throw error;
        }
    }

    destroy() {
        this.cleanupSubscriptions();
        this.templates = [];
        this.listeners.clear();
        this.initialized = false;
        window.firebaseService.removeAuthStateListener(this.boundAuthListener);
        const wasLoggedIn = this.status === 'logged_in';
        this.status = null;
        if (wasLoggedIn) {
            this._notifyListeners('logged_out');
        }
    }
}

// Initialize only if not already present
if (!window.messageTemplateDatabase) {
    window.messageTemplateDatabase = new MessageTemplateDatabase();
}
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
                        console.log('[MessageTemplateDB] Starting template load process');
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
            console.error('[MessageTemplateDB] Auth state change error:', error);
            this._notifyError('auth_state_change_failed', error.message);
        }
    }

    _updateStatus(newStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            this.notifyListeners();
        }
    }

    async loadTemplates() {
        if (this.isLoadingTemplates) {
            console.log('[MessageTemplateDB] Template loading already in progress');
            return;
        }
    
        this.isLoadingTemplates = true;
        console.log('[MessageTemplateDB] Starting template load');
    
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) {
                throw new Error('Firebase not initialized');
            }
    
            // Clean up existing subscriptions
            this.cleanupSubscriptions();
            this.templates = [];
    
            // Set up single snapshot listener for user document - using the users_v2 collection
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            
            const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
                try {
                    this.cleanupTemplateSubscriptions();
                    if (!userDoc.exists) {
                        console.log('[MessageTemplateDB] User document does not exist');
                        this.templates = [];
                        this._updateStatus('logged_in');
                        return;
                    }
    
                    // Get template references - now an array of objects with id, type, etc.
                    const templateRefs = userDoc.data()?.d?.s || [];
                    console.log('[MessageTemplateDB] Found template references:', templateRefs.length);
    
                    if (templateRefs.length === 0) {
                        this.templates = [];
                        this._updateStatus('logged_in');
                        return;
                    }
    
                    // Set up listeners for each template
                    await this.setupTemplateListeners(db, templateRefs);
                } catch (error) {
                    console.error('[MessageTemplateDB] Template processing error:', error);
                    this._notifyError('template_processing_failed', error.message);
                    this._updateStatus('logged_out');
                }
            });
    
            this.currentSubscriptionBatch.add(userUnsubscribe);
            this.initialized = true;
    
        } catch (error) {
            console.error('[MessageTemplateDB] Load templates failed:', error);
            this._notifyError('load_templates_failed', error.message);
            this.cleanupSubscriptions();
            this._updateStatus('logged_out');
        } finally {
            this.isLoadingTemplates = false;
        }
    }

    async setupTemplateListeners(db, templateRefs) {
        let loadedTemplates = 0;
        const totalTemplates = templateRefs.length;
        const acceptedTemplates = templateRefs.filter(ref => 
            ref.t === 'owned' || (ref.t === 'shared' && ref.a === true)
        );
        
        // If no templates are accepted, update status immediately
        if (acceptedTemplates.length === 0) {
            this._updateStatus('logged_in');
            return;
        }

        acceptedTemplates.forEach(templateRef => {
            const templateUnsubscribe = db.collection('message_templates_v2')
                .doc(templateRef.id)
                .onSnapshot(
                    async (templateDoc) => {
                        try {
                            if (!templateDoc.exists) {
                                loadedTemplates++;
                                return;
                            }

                            const templateData = templateDoc.data();
                            this.updateTemplate({
                                template_id: templateDoc.id,
                                title: templateData.t,
                                message: templateData.n,
                                last_updated: templateData.lu,
                                type: templateRef.t,
                                created_at: templateRef.ca,
                                // Include sharing details for shared templates
                                ...(templateRef.t === 'shared' && {
                                    shared_by_name: templateRef.sbn,
                                    shared_at: templateRef.sa,
                                    accepted: templateRef.a
                                })
                            });

                            loadedTemplates++;

                            if (loadedTemplates >= acceptedTemplates.length) {
                                this._updateStatus('logged_in');
                            }
                        } catch (error) {
                            console.error(`[MessageTemplateDB] Template processing error:`, error);
                            this._notifyError('template_processing_failed', error.message);
                        }
                    },
                    error => {
                        console.error(`[MessageTemplateDB] Template listener error:`, error);
                        this._notifyError('template_listener_failed', error.message);
                        loadedTemplates++;
                        if (loadedTemplates >= acceptedTemplates.length) {
                            this._updateStatus('logged_in');
                        }
                    }
                );

            this.currentSubscriptionBatch.add(templateUnsubscribe);
        });
        
        // If all templates have been processed synchronously (e.g., they're all cached)
        if (loadedTemplates >= acceptedTemplates.length) {
            this._updateStatus('logged_in');
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
                console.error('[MessageTemplateDB] Cleanup error:', e);
            }
        });
        this.currentSubscriptionBatch.clear();
        this.initialized = false;
    }

    cleanupTemplateSubscriptions() {
        // Keep user document listener but remove template listeners
        const userListener = Array.from(this.currentSubscriptionBatch)
            .find(listener => listener.toString().includes('users_v2'));

        this.currentSubscriptionBatch.forEach(unsub => {
            if (unsub !== userListener) {
                try {
                    unsub();
                } catch (e) {
                    console.error('[MessageTemplateDB] Template cleanup error:', e);
                }
            }
        });

        this.currentSubscriptionBatch = new Set();
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
                console.error('[MessageTemplateDB] Error in listener callback:', error);
            }
        });
    }

    _notifyError(code, message) {
        console.error('[MessageTemplateDB] Error:', code, message);
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
                console.error('[MessageTemplateDB] Error in error notification:', error);
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
                console.error('[MessageTemplateDB] Error in listener notification:', error);
            }
        });
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

            // Create a new template document in message_templates_v2
            const templateRef = await db.collection('message_templates_v2').add({
                t: title,
                n: message,
                lu: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Add template reference to user document
            const userRef = db.collection('users_v2').doc(currentUser.uid);
            
            // Get current user document
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                // Create user document if it doesn't exist
                await userRef.set({
                    d: {
                        s: [{
                            id: templateRef.id,
                            t: 'owned',
                            ca: firebase.firestore.FieldValue.serverTimestamp()
                        }]
                    }
                });
            } else {
                // Update existing user document
                const userData = userDoc.data();
                const templates = userData?.d?.s || [];
                
                await userRef.update({
                    'd.s': [...templates, {
                        id: templateRef.id,
                        t: 'owned',
                        ca: firebase.firestore.FieldValue.serverTimestamp()
                    }]
                });
            }

            return templateRef.id;
        } catch (error) {
            console.error('[MessageTemplateDB] Create template error:', error);
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
            console.error('[MessageTemplateDB] Update template error:', error);
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
            console.error('[MessageTemplateDB] Delete template error:', error);
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
            console.error('[MessageTemplateDB] Share template error:', error);
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
            console.error('[MessageTemplateDB] Update shared template status error:', error);
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
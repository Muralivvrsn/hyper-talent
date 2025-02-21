class MessageTemplateDatabase {
    constructor() {
        // console.log('[MessageTemplateDB] Initializing...');
        this.templates = [];
        this.listeners = new Set();
        this.currentSubscriptionBatch = new Set();
        this.status = null; // Start with no status
        this.initialized = false;
        this.isLoadingTemplates = false;

        // Bind the auth listener only once
        this.boundAuthListener = this.handleAuthStateChange.bind(this);
        window.firebaseService.addAuthStateListener(this.boundAuthListener);
        // console.log('[MessageTemplateDB] Auth listener added');
    }

    async handleAuthStateChange(authState) {
        // console.log('[MessageTemplateDB] Auth state change:', authState);

        try {
            if (!authState || !authState.type || !authState.status) {
                // console.log('[MessageTemplateDB] Invalid auth state received');
                return;
            }

            // If we're already loading templates, don't trigger another load
            if (this.isLoadingTemplates) {
                // console.log('[MessageTemplateDB] Template loading already in progress');
                return;
            }

            switch (authState.status) {
                case 'logged_in':
                    console.log(this.status)
                    if (this.status !== 'in_progress') {
                        console.log('[MessageTemplateDB] Starting template load process');
                        this._updateStatus('in_progress');
                        await this.loadTemplates();
                    }
                    break;

                case 'logged_out':
                    // console.log('[MessageTemplateDB] Handling logout');
                    this.cleanupSubscriptions();
                    this.templates = [];
                    this._updateStatus('logged_out');
                    break;

                case 'in_progress':
                    // Only update if we're not already in progress
                    if (this.status !== 'in_progress') {
                        // console.log('[MessageTemplateDB] Setting in-progress state');
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
        // console.log('[MessageTemplateDB] Status update:', this.status, '->', newStatus);
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
    
            // Set up single snapshot listener for user document
            const userRef = db.collection('users').doc(currentUser.uid);
            
            const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {

                try {
                    this.cleanupTemplateSubscriptions()
                    if (!userDoc.exists) {
                        console.log('[MessageTemplateDB] User document does not exist');
                        this.templates = [];
                        this._updateStatus('logged_in');
                        return;
                    }
    
                    const templateIds = userDoc.data()?.d?.s || [];
                    console.log('[MessageTemplateDB] Found template IDs:', templateIds.length);
    
                    if (templateIds.length === 0) {
                        this.templates = [];
                        this._updateStatus('logged_in');
                        return;
                    }
    
                    // Get all templates in a single query
                    await this.setupTemplateListeners(db, templateIds);
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

    async setupTemplateListeners(db, templateIds) {
        let loadedTemplates = 0;
        const totalTemplates = templateIds.length;
        // console.log('[MessageTemplateDB] Setting up listeners for', totalTemplates, 'templates');

        templateIds.forEach(templateId => {
            const templateUnsubscribe = db.collection('message_templates')
                .doc(templateId)
                .onSnapshot(
                    async (templateDoc) => {
                        try {
                            if (!templateDoc.exists) {
                                loadedTemplates++;
                                // console.log('[MessageTemplateDB] Template not found:', templateId);
                                return;
                            }

                            const templateData = templateDoc.data();
                            this.updateTemplate({
                                template_id: templateDoc.id,
                                title: templateData.t,
                                message: templateData.n,
                                last_updated: templateData.lu
                            });

                            loadedTemplates++;
                            // console.log('[MessageTemplateDB] Loaded template:', templateId, `(${loadedTemplates}/${totalTemplates})`);

                            if (loadedTemplates >= totalTemplates) {
                                // console.log('[MessageTemplateDB] All templates loaded');
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
                        if (loadedTemplates >= totalTemplates) {
                            this._updateStatus('logged_in');
                        }
                    }
                );

            this.currentSubscriptionBatch.add(templateUnsubscribe);
        });
        this._updateStatus('logged_in');
    }

    updateTemplate(newTemplate) {
        // console.log('[MessageTemplateDB] Updating template:', newTemplate.template_id);
        const index = this.templates.findIndex(t => t.template_id === newTemplate.template_id);
        if (index === -1) {
            this.templates.push(newTemplate);
        } else {
            this.templates[index] = newTemplate;
        }
        this.notifyListeners();
    }

    cleanupSubscriptions() {
        // console.log('[MessageTemplateDB] Cleaning up all subscriptions');
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
        // console.log('[MessageTemplateDB] Cleaning up template subscriptions');
        const userListener = Array.from(this.currentSubscriptionBatch)
            .find(listener => listener.toString().includes('users'));

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
            // console.log('[MessageTemplateDB] Adding new listener');
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
        // console.log('[MessageTemplateDB] Removing listener');
        this.listeners.delete(callback);
    }

    notifyListeners() {
        // console.log('[MessageTemplateDB] Notifying listeners, status:', this.status);
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
        // console.log('[MessageTemplateDB] Sending notification to listeners:', status);
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

    destroy() {
        // console.log('[MessageTemplateDB] Destroying instance');
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
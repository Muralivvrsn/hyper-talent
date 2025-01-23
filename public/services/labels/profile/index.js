class LabelProfileManagerCore {
    constructor() {
        this.listeners = new Set();
        this.state = {
            currentObserver: null,
            debounceTimer: null,
            isProcessing: false,
            labelsCache: new Map()
        };
        window.labelsDatabase.addListener(this.handleLabelsUpdate.bind(this));
        this.notifyListeners = this.notifyListeners.bind(this);
    }

    addLabelListener(callback) {
        this.listeners.add(callback);
        callback([...this.state.labelsCache.values()]);
        return () => this.removeLabelListener(callback);
    }

    removeLabelListener(callback) {
        this.listeners.delete(callback);
    }

    notifyListeners() {
        const labelsArray = [...this.state.labelsCache.values()];
        this.listeners.forEach(listener => {
            try {
                listener(labelsArray);
            } catch (error) {
                // console.error('Error in label listener:', error);
            }
        });
    }

    async handleLabelsUpdate(labels) {
        this.updateLabelsCache(labels);
        window.labelProfileManagerUI.updateLabelsDropdown(labels);
        this.notifyListeners();
    }

    updateLabelsCache(labels) {
        this.state.labelsCache.clear();
        labels.forEach(label => {
            this.state.labelsCache.set(label.label_id, {
                id: label.label_id,
                name: label.label_name,
                color: label.label_color,
                profiles: label.profiles || []
            });
        });
    }

    

    async applyLabel(labelId, profileData) {
        const actionType = `apply_label_${labelId}_${profileData.profileId}`;
        
        if (!window.start_action(actionType, `Getting ready to tag ${profileData.name} with some style... 🏷️`)) {
            return false;
        }
    
        try {
            const { 
                profileId, 
                name, 
                image_url, 
                url, 
                username, 
                code = 'default'
            } = profileData;
    
            // Initialize Firebase
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) {
                window.complete_action(actionType, false, 'Oops! Having trouble connecting to our magical database! 🔌');
                throw new Error('Not initialized');
            }
    
            // Check if label exists and if profile is already labeled
            const labelRef = db.collection('profile_labels').doc(labelId);
            const labelDoc = await labelRef.get();
            
            if (!labelDoc.exists) {
                window.complete_action(actionType, false, `Hmm... This label seems to have vanished into thin air! 🌫️`);
                return false;
            }
    
            const labelData = labelDoc.data();
            const existingProfiles = labelData.p || [];
    
            // Check for duplicate profile in label
            if (existingProfiles.includes(profileId)) {
                window.complete_action(
                    actionType, 
                    false, 
                    `${name} is already wearing this label - they're ahead of the game! ✨`
                );
                return false;
            }
    
            // Create/update profile document
            // window.start_action(actionType, `Creating a cozy spot for ${name}'s profile... 🏠`);
            const profileRef = db.collection('profiles').doc(profileId);
            const profileDoc = await profileRef.get();
            
            if (!profileDoc.exists) {
                await profileRef.set({
                    n: name,          // name
                    img: image_url,   // image url
                    lu: new Date().toISOString(), // last updated
                    u: url,          // url
                    un: username,    // username
                    c: code          // code
                });
            }
    
            // Update label with new profile
            // window.start_action(actionType, `Adding the finishing touches for ${name}... 🎨`);
            await db.runTransaction(async (transaction) => {
                const freshLabelDoc = await transaction.get(labelRef);
                if (!freshLabelDoc.exists) {
                    throw new Error('Label disappeared during processing');
                }
    
                transaction.update(labelRef, {
                    p: firebase.firestore.FieldValue.arrayUnion(profileId),
                    lu: new Date().toISOString() // update last updated timestamp
                });
            });
    
            window.complete_action(
                actionType, 
                true, 
                `Success! ${name} is now rocking their new label! 🎉`
            );
            return true;
    
        } catch (error) {
            const errorMessages = {
                'Not initialized': 'Our magical connection is having a moment... Try again? 🔄',
                'Label disappeared during processing': 'The label played hide and seek at the last second! 🙈',
                'Label not found': 'This label seems to have gone on vacation! 🏖️',
                'default': `Oops! Couldn't add the label to ${profileData.name}'s profile. Let's try again! 🔄`
            };
    
            const message = errorMessages[error.message] || errorMessages.default;
            window.complete_action(actionType, false, message);
            return false;
        }
    }

    getLabels() {
        return [...this.state.labelsCache.values()];
    }

    destroy() {
        window.labelsDatabase.removeListener(this.handleLabelsUpdate);
        this.state.labelsCache.clear();
        this.listeners.clear();
    }
}

// window.labelProfileManagerCore = new LabelProfileManagerCore();



const initProfileLabels = () => {
    let lastUrl = '';
    let checkInterval = null;
  
    const hasProfileElements = () => {
      return document.querySelector('a[href*="/search/results/people"]') || 
             document.querySelector('section[data-member-id] > .ph5 > a') ||
             Array.from(document.querySelectorAll('[id*="navigation"]')).some(
               el => el.id.toLowerCase().includes('experience') || 
                     el.id.toLowerCase().includes('skill') ||
                     el.id.toLowerCase().includes('influencer')
             );
    };
  
    const tryInitialize = () => {
      if (hasProfileElements()) {
        window.labelProfileManagerCore = new LabelProfileManagerCore();
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      }
    };
  
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        
        if (window.labelProfileManagerCore) {
          window.labelProfileManagerCore.destroy?.();
          window.labelProfileManagerCore = null;
          if (window.labelProfileManagerUI) {
            window.labelProfileManagerUI.cleanup();
        }
        }
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
  
        if (currentUrl.includes('linkedin.com/in/')) {
          tryInitialize();
          checkInterval = setInterval(tryInitialize, 2000);
        }
      }
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  
    // Initial check
    if (window.location.href.includes('linkedin.com/in/')) {
      tryInitialize();
      checkInterval = setInterval(tryInitialize, 2000);
    }
  };
  
  initProfileLabels();
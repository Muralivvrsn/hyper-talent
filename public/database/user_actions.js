class UserActionsDatabase {
    async addAction(actionTitle, description = null) {
        try {
            const db = window.firebaseService.db;
            const currentUser = window.firebaseService.currentUser;
            if (!db || !currentUser) throw new Error('Firebase not initialized or user not logged in');

            const userActionsRef = db.collection('user_actions').doc(currentUser.uid);
            
            const newAction = {
                title: actionTitle,
                timestamp: new Date().toISOString()
            };

            // Only add description if it's provided
            if (description) {
                newAction.description = description;
            }

            await userActionsRef.set({
                actions: firebase.firestore.FieldValue.arrayUnion(newAction)
            }, { merge: true });

            return true;
        } catch (error) {
            console.error('Failed to add action:', error);
            return false;
        }
    }

    destroy() {
        console.log('UserActionsDatabase destroyed');
    }
}

window.userActionsDatabase = new UserActionsDatabase();
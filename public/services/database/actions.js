class UserActionsDatabase {
    async addAction(actionTitle) {
        try {
            const { db, currentUser } = await window.firebaseService.initialize();
            if (!db || !currentUser) throw new Error('Firebase not initialized or user not logged in');

            const userActionsRef = db.collection('user_actions').doc(currentUser.uid);
            
            const newAction = {
                title: actionTitle,
                timestamp: new Date().toISOString()
            };

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
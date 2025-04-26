(function () {
    // Global state
    let state = {
        actions: [],
        status: "in_progress",
        subscriptions: new Map(),
        pendingActions: new Set()
    };

    let db = null;
    let currentUser = null;

    // Ensure Firebase is initialized
    if (!firebase.apps.length) {
        console.error("[UserActions] Firebase not initialized. Please initialize Firebase.");
        // Replace with your Firebase config if needed:
        // firebase.initializeApp({ /* your config */ });
    }
    db = firebase.firestore();

    // Notify listeners with USER_ACTION_RECORDED message
    function notifyListeners() {
        console.log("[UserActions] Notifying listeners with updated state:", state);
        chrome.runtime.sendMessage({
            type: "USER_ACTION_RECORDED",
            status: state.status,
            actions: [...state.actions],
            timestamp: new Date().toISOString()
        });
    }

    // Update status and notify if changed
    function updateStatus(newStatus) {
        if (state.status !== newStatus) {
            console.log("[UserActions] Status updated from", state.status, "to", newStatus);
            state.status = newStatus;
            notifyListeners();
        }
    }

    // Cleanup all subscriptions
    function cleanupSubscriptions() {
        console.log("[UserActions] Cleaning up subscriptions");
        for (const unsubscribe of state.subscriptions.values()) {
            try {
                unsubscribe();
            } catch (error) {
                console.error("[UserActions] Cleanup error:", error);
            }
        }
        state.subscriptions.clear();
    }

    // Reset state
    function resetState() {
        console.log("[UserActions] Resetting state");
        state.actions = [];
        notifyListeners();
    }

    // Setup real-time sync with Firestore
    async function setupRealtimeSync() {
        try {
            if (!db || !currentUser) {
                console.log("[UserActions] No db or user, setting status to logged_out");
                updateStatus("logged_out");
                return;
            }

            cleanupSubscriptions();
            state.pendingActions = new Set();
            updateStatus("in_progress");

            const userActionsRef = db.collection("user_actions").doc(currentUser.uid);
            console.log("[UserActions] Setting up snapshot listener for UID:", currentUser.uid);
            const userUnsubscribe = userActionsRef.onSnapshot((doc) => {
                if (!doc.exists) {
                    console.log("[UserActions] User actions document does not exist");
                    state.actions = [];
                    updateStatus("logged_in");
                    return;
                }

                const data = doc.data();
                const actionsList = data.actions || [];
                console.log("[UserActions] User actions list:", actionsList);

                actionsList.forEach((action) => state.pendingActions.add(action.timestamp));
                updateActions(actionsList);

                if (state.pendingActions.size === 0) {
                    updateStatus("logged_in");
                }
            }, (error) => {
                console.error("[UserActions] Sync error:", error);
                updateStatus("error");
            });

            state.subscriptions.set("user", userUnsubscribe);
        } catch (error) {
            console.error("[UserActions] Setup realtime sync failed:", error);
            cleanupSubscriptions();
            updateStatus("error");
        }
    }

    // Update actions in state
    function updateActions(actionsList) {
        console.log("[UserActions] Updating actions:", actionsList);
        state.actions = actionsList.map((action) => ({
            uid: currentUser.uid,
            title: action.title,
            timestamp: action.timestamp,
            description: action.description || null
        }));

        state.pendingActions.clear();
        checkAllActionsLoaded();
    }

    // Check if all actions are loaded
    function checkAllActionsLoaded() {
        if (state.pendingActions.size === 0 && state.status === "in_progress") {
            console.log("[UserActions] All actions loaded, setting status to logged_in");
            updateStatus("logged_in");
        }
    }

    // Add an action to Firebase
    async function addAction(uid, actionTitle, description = null) {
        try {
            console.log("[UserActions] Adding action for UID:", uid, "Title:", actionTitle);

            if (!db || !currentUser || currentUser.uid !== uid) {
                throw new Error("Not authenticated or UID mismatch");
            }

            const newAction = {
                title: actionTitle,
                timestamp: new Date().toISOString()
            };

            if (description) {
                newAction.description = description;
            }

            const userActionsRef = db.collection("user_actions").doc(uid);
            await userActionsRef.set({
                actions: firebase.firestore.FieldValue.arrayUnion(newAction)
            }, { merge: true });

            console.log("[UserActions] Action added successfully:", newAction);
            // No need to update state manually; snapshot listener will handle it
            return true;
        } catch (error) {
            console.error("[UserActions] Error adding action:", error);
            updateStatus("error");
            return false;
        }
    }

    // Message listeners
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("[UserActions] Received message:", message);

        if (message.type === "ADD_USER_ACTION") {
            const { uid, title, description } = message.action || {};
            if (!uid || !title) {
                console.error("[UserActions] Invalid action: uid and title are required");
                sendResponse({ success: false, error: "UID and title are required" });
                return;
            }

            addAction(uid, title, description).then((success) => {
                sendResponse({ success });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep the channel open for async response
        }

        if (message.type === "LOGGED_IN") {
            currentUser = { uid: message.uid };
            console.log("[UserActions] User logged in, UID:", currentUser.uid);
            setupRealtimeSync();
        }

        if (message.type === "LOGGED_OUT") {
            cleanupSubscriptions();
            resetState();
            updateStatus("logged_out");
            console.log("[UserActions] User logged out");
        }

        if (message.type === "auth_status") {
            console.log("[UserActions] Responding with status:", state.status);
            sendResponse({ status: state.status, user: currentUser });
        }
    });

    // Initial setup: Check auth status
    (async function initialize() {
        console.log("[UserActions] Initializing...");
        try {
            await new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: "auth_status" }, (response) => {
                    console.log("[UserActions] Initial auth status response:", response);
                    if (response && response.status === "logged_in" && response.user && response.user.uid) {
                        currentUser = { uid: response.user.uid };
                        setupRealtimeSync();
                    } else {
                        updateStatus("logged_out");
                    }
                    resolve();
                });
            });
        } catch (error) {
            console.error("[UserActions] Initialization failed:", error);
            updateStatus("error");
        }
    })();
})();
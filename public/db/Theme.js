(function () {
    let state = { theme: 'light', status: 'in_progress', subscription: null };
    let db = null;
    let currentUser = null;
  
    function notifyListeners() {
      chrome.runtime.sendMessage({
        type: "THEME_UPDATED",
        status: state.status,
        theme: state.theme,
        timestamp: new Date().toISOString()
      });
    }
  
    function updateStatus(newStatus) {
      if (state.status !== newStatus) {
        state.status = newStatus;
        notifyListeners();
      }
    }
  
    function cleanupSubscription() {
      if (state.subscription) {
        state.subscription();
        state.subscription = null;
      }
    }
  
    async function setupRealtimeSync() {
      if (!db || !currentUser) {
        updateStatus("logged_out");
        return;
      }
      cleanupSubscription();
      updateStatus("in_progress");
      const userRef = db.collection("users_v2").doc(currentUser.uid);
      const unsubscribe = userRef.onSnapshot(
        (doc) => {
          if (!doc.exists) return;
          const theme = doc.data()?.th || "light";
          state.theme = theme;
          updateStatus("logged_in");
          notifyListeners();
        },
        (error) => {
          console.error("[ThemeDB] Sync error:", error);
          updateStatus("error");
        }
      );
      state.subscription = unsubscribe;
    }
  
    async function updateTheme(newTheme) {
      if (!db || !currentUser) throw new Error("Not authenticated");
      await db.collection("users_v2").doc(currentUser.uid).update({
        th: newTheme,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  
    function destroy() {
      cleanupSubscription();
      state.status = null;
      notifyListeners();
    }
  
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "auth_status") {
        sendResponse({ status: state.status });
      } else if (message.type === "LOGGED_IN") {
        currentUser = { uid: message.uid };
        db = firebase.firestore();
        setupRealtimeSync();
      } else if (message.type === "LOGGED_OUT") {
        cleanupSubscription();
        state.theme = "light";
        updateStatus("logged_out");
      } else if (message.type === "UPDATE_THEME") {
        updateTheme(message.theme).then(() => sendResponse({ success: true })).catch(() => sendResponse({ success: false }));
        return true;
      }
    });
  
    (async function initialize() {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "auth_status" }, (response) => {
          if (response?.status === "logged_in" && response.user?.uid) {
            currentUser = { uid: response.user.uid };
            db = firebase.firestore();
            setupRealtimeSync();
          } else {
            updateStatus("logged_out");
          }
          resolve();
        });
      });
    })();
  
    if (!window.themeDatabase) {
      window.themeDatabase = { updateTheme, destroy };
    }
  })();
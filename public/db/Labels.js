(function () {
    // Global state
    let state = {
      labels: [],
      status: "in_progress",
      subscriptions: new Map(),
      pendingLabels: new Set()
    };
  
    let db = null;
    let currentUser = null;
  
    // Notify listeners with LABELS_UPDATED message
    function notifyListeners() {
      console.log("[LabelsDB] Notifying listeners with updated state:", state);
      chrome.runtime.sendMessage({
        type: "LABELS_UPDATED",
        status: state.status,
        labels: [...state.labels],
        timestamp: new Date().toISOString()
      });
    }
  
    // Update status and notify if changed
    function updateStatus(newStatus) {
      if (state.status !== newStatus) {
        console.log("[LabelsDB] Status updated from", state.status, "to", newStatus);
        state.status = newStatus;
        notifyListeners();
      }
    }
  
    // Cleanup all subscriptions
    function cleanupSubscriptions() {
      console.log("[LabelsDB] Cleaning up subscriptions");
      for (const unsubscribe of state.subscriptions.values()) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("[LabelsDB] Cleanup error:", error);
        }
      }
      state.subscriptions.clear();
    }
  
    // Reset state
    function resetState() {
      console.log("[LabelsDB] Resetting state");
      state.labels = [];
      notifyListeners();
    }
  
    // Setup real-time sync with Firestore
    async function setupRealtimeSync() {
      try {
        if (!db || !currentUser) {
          console.log("[LabelsDB] No db or user, setting status to logged_out");
          updateStatus("logged_out");
          return;
        }
  
        cleanupSubscriptions();
        state.pendingLabels = new Set();
        updateStatus("in_progress");
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        console.log("[LabelsDB] Setting up user snapshot listener for UID:", currentUser.uid);
        const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
          if (!userDoc.exists) {
            console.log("[LabelsDB] User document does not exist");
            return;
          }
  
          const userData = userDoc.data()?.d || {};
          const labelsList = userData.l || [];
          console.log("[LabelsDB] User labels list:", labelsList);
  
          labelsList.forEach((label) => state.pendingLabels.add(label.id));
          await setupLabelListeners(labelsList);
  
          if (state.pendingLabels.size === 0) {
            updateStatus("logged_in");
          }
        }, (error) => {
          console.error("[LabelsDB] User document sync error:", error);
          updateStatus("error");
        });
  
        state.subscriptions.set("user", userUnsubscribe);
      } catch (error) {
        console.error("[LabelsDB] Setup realtime sync failed:", error);
        cleanupSubscriptions();
        updateStatus("error");
      }
    }
  
    // Setup listeners for individual labels
    async function setupLabelListeners(labelsList) {
      const currentLabels = new Set();
      console.log("[LabelsDB] Setting up label listeners for:", labelsList);
  
      labelsList.forEach((labelData) => {
        const labelId = labelData.id;
        if (labelData.t === "shared" && labelData.a !== true) return;
  
        currentLabels.add(labelId);
  
        if (state.subscriptions.has(`label_${labelId}`)) {
          state.pendingLabels.delete(labelId);
          checkAllLabelsLoaded();
          return;
        }
  
        const labelRef = db.collection("profile_labels_v2").doc(labelId);
        console.log("[LabelsDB] Subscribing to label:", labelId);
        const labelUnsubscribe = labelRef.onSnapshot(async (labelDoc) => {
          if (!labelDoc.exists) {
            console.log("[LabelsDB] Label does not exist, removing:", labelId);
            removeLabel(labelId);
            state.pendingLabels.delete(labelId);
            checkAllLabelsLoaded();
            return;
          }
  
          const label = labelDoc.data();
          const profileDetails = await getProfileDetails(label.p || []);
          console.log("[LabelsDB] Label data fetched:", label, "Profiles:", profileDetails);
  
          const labelInfo = {
            label_id: labelId,
            label_name: label.n,
            label_color: label.c,
            profiles: profileDetails,
            last_updated: label.lu,
            type: labelData.t,
            ...(labelData.t === "owned" && { created_at: labelData.ca }),
            ...(labelData.t === "shared" && {
              permission: labelData.ps,
              shared_by: labelData.sbn,
              shared_at: labelData.sa
            })
          };
  
          updateLabel(labelInfo);
          state.pendingLabels.delete(labelId);
          checkAllLabelsLoaded();
        }, (error) => {
          console.error(`[LabelsDB] Label ${labelId} sync error:`, error);
          state.pendingLabels.delete(labelId);
          checkAllLabelsLoaded();
        });
  
        state.subscriptions.set(`label_${labelId}`, labelUnsubscribe);
      });
  
      for (const [key, unsubscribe] of state.subscriptions.entries()) {
        if (key.startsWith("label_")) {
          const labelId = key.replace("label_", "");
          if (!currentLabels.has(labelId)) {
            console.log("[LabelsDB] Unsubscribing from outdated label:", labelId);
            unsubscribe();
            state.subscriptions.delete(key);
            removeLabel(labelId);
            state.pendingLabels.delete(labelId);
          }
        }
      }
  
      checkAllLabelsLoaded();
    }
  
    // Check if all labels are loaded
    function checkAllLabelsLoaded() {
      if (state.pendingLabels.size === 0 && state.status === "in_progress") {
        console.log("[LabelsDB] All labels loaded, setting status to logged_in");
        updateStatus("logged_in");
      }
    }
  
    // Fetch profile details
    async function getProfileDetails(profileIds) {
      try {
        console.log("[LabelsDB] Fetching profile details for IDs:", profileIds);
        const profiles = [];
        await Promise.all(
          profileIds.map(async (profileId) => {
            const profileRef = db.collection("profiles").doc(profileId);
            const profileDoc = await profileRef.get();
            if (profileDoc.exists) {
              const profileData = profileDoc.data();
              profiles.push({
                profile_id: profileId,
                name: profileData.n,
                image_url: profileData.img,
                username: profileData.un,
                url: profileData.u
              });
            }
          })
        );
        return profiles;
      } catch (error) {
        console.error("[LabelsDB] Get profile details error:", error);
        return [];
      }
    }
  
    // Update a label in state
    function updateLabel(newLabel) {
      console.log("[LabelsDB] Updating label:", newLabel);
      state.labels = state.labels.map((label) =>
        label.label_id === newLabel.label_id ? newLabel : label
      );
  
      if (!state.labels.some((label) => label.label_id === newLabel.label_id)) {
        state.labels = [...state.labels, newLabel];
      }
  
      notifyListeners();
    }
  
    // Remove a label from state
    function removeLabel(labelId) {
      console.log("[LabelsDB] Removing label:", labelId);
      state.labels = state.labels.filter((l) => l.label_id !== labelId);
      notifyListeners();
    }
  
    // Remove profile from label
    async function removeProfileFromLabel(labelId, profileId) {
      if (!window.start_action("removing", "Peeling label off profile. Painless separation in progress! 📤🩹")) {
        throw new Error("Action start failed");
      }
      try {
        console.log("[LabelsDB] Removing profile", profileId, "from label", labelId);
        const profileInfo = await window.labelManagerUtils.getProfileInfo();
        if (!db || !currentUser) {
          throw new Error("Not authenticated");
        }
  
        const labelRef = db.collection("profile_labels_v2").doc(labelId);
        const labelDoc = await labelRef.get();
  
        if (!labelDoc.exists) {
          throw new Error("Label not found");
        }
  
        const labelData = labelDoc.data();
        if (!labelData.p || !labelData.p.includes(profileId)) {
          window.complete_action("removing", false, "Label has separation anxiety. Need relationship counseling! 🤨💔");
          return false;
        }
  
        await labelRef.update({
          p: firebase.firestore.FieldValue.arrayRemove(profileId),
          lu: new Date().toISOString()
        });
  
        window.complete_action("removing", true, "Freedom achieved! Profile living its best unlabeled life! 👋🎉");
        return true;
      } catch (error) {
        console.error("[LabelsDB] Remove profile from label error:", error);
        window.complete_action("removing", false, "Label has separation anxiety. Need relationship counseling! 🤨💔");
        return false;
      }
    }
  
    // Create a new label
    async function createLabel(labelName) {
      if (!window.start_action("creating label", "Crafting perfect label. Artisanal label-making in progress! ✨🎨")) {
        throw new Error("Action start failed");
      }
      try {
        console.log("[LabelsDB] Creating label with name:", labelName);
        const isDuplicate = state.labels.some((label) => label.label_name === labelName);
        if (isDuplicate) {
          window.complete_action("creating label", false, "Oops! This label already exists. Great minds think alike! 🎯");
          return false;
        }
  
        if (!db || !currentUser) {
          throw new Error("Not authenticated");
        }
  
        const labelId = `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const labelRef = db.collection("profile_labels_v2").doc(labelId);
        const getExistingColors = (labels) => labels.map((label) => label.label_color);
        const labelColor = await window.labelManagerUtils.generateRandomColor(getExistingColors(state.labels));
  
        await labelRef.set({
          n: labelName,
          c: labelColor,
          p: [],
          lu: new Date().toISOString()
        });
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        await userRef.update({
          "d.l": firebase.firestore.FieldValue.arrayUnion({
            id: labelId,
            t: "owned",
            ca: new Date().toISOString()
          })
        });
  
        window.complete_action("creating label", true, "New label born! Ready to organize your world! 🎉👶");
        return labelId;
      } catch (error) {
        console.error("[LabelsDB] Create label error:", error);
        window.complete_action("creating label", false, "Label stork got lost. Your creation's fashionably late! 🎪🦢");
        return false;
      }
    }
  
    // Delete a label
    async function deleteLabel(labelId) {
      if (!window.start_action("deleting label", "Sending this label to digital recycling heaven! 🗑️🚀")) {
        throw new Error("Action start failed");
      }
      try {
        console.log("[LabelsDB] Deleting label:", labelId);
        if (!db || !currentUser) {
          throw new Error("Not authenticated");
        }
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data()?.d || {};
        const labelsList = userData.l || [];
        const labelToRemove = labelsList.find((label) => label.id === labelId);
  
        if (!labelToRemove) {
          throw new Error("Label not found in user document");
        }
  
        const labelRef = db.collection("profile_labels_v2").doc(labelId);
        await labelRef.delete();
  
        await userRef.update({
          "d.l": firebase.firestore.FieldValue.arrayRemove(labelToRemove)
        });
  
        window.complete_action("deleting label", true, "Poof! Label vanished like magic! Workspace getting cleaner! 💨✨");
        return true;
      } catch (error) {
        console.error("[LabelsDB] Delete label error:", error);
        window.complete_action("deleting label", false, "Label's staging a rebellion. Try bribing with cookies! 🍪🧱");
        return false;
      }
    }
  
    // Edit label name
    async function editLabelName(labelId, newName) {
      try {
        console.log("[LabelsDB] Editing label", labelId, "to name:", newName);
        const isDuplicate = state.labels.some(
          (label) => label.label_name === newName && label.label_id !== labelId
        );
        if (isDuplicate) {
          throw new Error("Label with this name already exists");
        }
  
        if (!db || !currentUser) {
          throw new Error("Not authenticated");
        }
  
        const labelRef = db.collection("profile_labels_v2").doc(labelId);
        await labelRef.update({
          n: newName,
          lu: new Date().toISOString()
        });
        return true;
      } catch (error) {
        console.error("[LabelsDB] Edit label error:", error);
        return false;
      }
    }
  
    // Apply label to profile
    async function applyLabel(labelId) {
      if (!window.start_action("applying label", "Attaching this fancy label... Your profile's getting a makeover! 🏷️✨")) {
        throw new Error("Action start failed");
      }
      try {
        console.log("[LabelsDB] Applying label", labelId);
        if (!db || !currentUser) {
          throw new Error("Not authenticated");
        }
  
        const profileInfo = await window.labelManagerUtils.getProfileInfo();
        if (!profileInfo || !profileInfo.profile_id) {
          throw new Error("Could not get profile information from current page");
        }
  
        const profileRef = db.collection("profiles").doc(profileInfo.profile_id);
        const profileDoc = await profileRef.get();
  
        if (profileDoc.exists) {
          const existingData = profileDoc.data();
          await profileRef.update({
            n: profileInfo.name,
            u: profileInfo.url,
            img: profileInfo.image_url,
            un: profileInfo.username || existingData.un,
            lu: new Date().toISOString()
          });
        } else {
          await profileRef.set({
            c: profileInfo.profile_id,
            n: profileInfo.name,
            u: profileInfo.url,
            img: profileInfo.image_url,
            un: profileInfo.username,
            lu: new Date().toISOString()
          });
        }
  
        const labelRef = db.collection("profile_labels_v2").doc(labelId);
        const labelDoc = await labelRef.get();
  
        if (!labelDoc.exists) {
          throw new Error("Label not found");
        }
  
        const labelData = labelDoc.data();
        if (labelData.p && labelData.p.includes(profileInfo.profile_id)) {
          window.complete_action("applying label", false, "Profile already has this label! No double-dipping! 🏷️👀");
          return { success: false, profile_id: profileInfo.profile_id, message: "Profile already has this label" };
        }
  
        await labelRef.update({
          p: firebase.firestore.FieldValue.arrayUnion(profileInfo.profile_id),
          lu: new Date().toISOString()
        });
  
        window.complete_action("applying label", true, "Label attached! Your organizing skills are off the charts! 🏆✅");
        return { success: true, profile_id: profileInfo.profile_id };
      } catch (error) {
        console.error("[LabelsDB] Apply label error:", error);
        window.complete_action("applying label", false, "Label's playing hard to get. Try again later! 🙈🤷‍♀️");
        return { success: false, error: error.message };
      }
    }
  
    // Destroy the database
    function destroy() {
      console.log("[LabelsDB] Destroying labels database");
      cleanupSubscriptions();
      state.status = null;
      notifyListeners();
    }
  
    // Message listeners for all operations
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("[LabelsDB] Received message:", message);
      if (message.type === "auth_status") {
        console.log("[LabelsDB] Responding with status:", state.status);
        sendResponse({ status: state.status });
      } else if (message.type === "LOGGED_IN") {
        currentUser = { uid: message.uid };
        db = firebase.firestore();
        console.log("[LabelsDB] User logged in, UID:", currentUser.uid);
        setupRealtimeSync();
      } else if (message.type === "LOGGED_OUT") {
        cleanupSubscriptions();
        resetState();
        updateStatus("logged_out");
        console.log("[LabelsDB] User logged out");
      } else if (message.type === "REMOVE_PROFILE_FROM_LABEL") {
        removeProfileFromLabel(message.labelId, message.profileId)
          .then((result) => sendResponse({ success: result }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Keep the message channel open for async response
      } else if (message.type === "CREATE_LABEL") {
        createLabel(message.labelName)
          .then((labelId) => sendResponse({ success: true, labelId }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "DELETE_LABEL") {
        deleteLabel(message.labelId)
          .then((result) => sendResponse({ success: result }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "EDIT_LABEL_NAME") {
        editLabelName(message.labelId, message.newName)
          .then((result) => sendResponse({ success: result }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "APPLY_LABEL") {
        applyLabel(message.labelId)
          .then((result) => sendResponse(result))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "DESTROY_LABELS_DB") {
        destroy();
        sendResponse({ success: true });
      }
    });
  
    // Initial fetch of auth state
    (async function initialize() {
      console.log("[LabelsDB] Fetching initial auth status");
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "auth_status" }, (response) => {
          console.log("[LabelsDB] Initial auth status response:", response);
          if (response && response.status === "logged_in" && response.user && response.user.uid) {
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
  })();
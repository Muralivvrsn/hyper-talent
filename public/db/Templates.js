(function () {
    let state = {
      templates: [],
      status: "in_progress",
      subscriptions: new Map(),
      pendingTemplates: new Set()
    };
    let db = null;
    let currentUser = null;
  
    function notifyListeners() {
      console.log("[MessageTemplatesDB] Notifying listeners with updated state:", state);
      chrome.runtime.sendMessage({
        type: "TEMPLATES_UPDATED",
        status: state.status,
        templates: [...state.templates],
        timestamp: new Date().toISOString()
      });
    }
  
    function updateStatus(newStatus) {
      if (state.status !== newStatus) {
        console.log("[MessageTemplatesDB] Status updated from", state.status, "to", newStatus);
        state.status = newStatus;
        notifyListeners();
      }
    }
  
    function cleanupSubscriptions() {
      console.log("[MessageTemplatesDB] Cleaning up subscriptions");
      for (const unsubscribe of state.subscriptions.values()) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("[MessageTemplatesDB] Cleanup error:", error);
        }
      }
      state.subscriptions.clear();
    }
  
    function resetState() {
      console.log("[MessageTemplatesDB] Resetting state");
      state.templates = [];
      notifyListeners();
    }
  
    async function setupRealtimeSync() {
      try {
        if (!db || !currentUser) {
          console.log("[MessageTemplatesDB] No db or user, setting status to logged_out");
          updateStatus("logged_out");
          return;
        }
  
        cleanupSubscriptions();
        state.pendingTemplates = new Set();
        updateStatus("in_progress");
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        console.log("[MessageTemplatesDB] Setting up user snapshot listener for UID:", currentUser.uid);
        const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
          if (!userDoc.exists) {
            console.log("[MessageTemplatesDB] User document does not exist");
            return;
          }
  
          const userData = userDoc.data()?.d || {};
          const templateRefs = userData.s || [];
          console.log("[MessageTemplatesDB] User templates list:", templateRefs);
  
          templateRefs.forEach((template) => state.pendingTemplates.add(template.id));
          await setupTemplateListeners(templateRefs);
  
          if (state.pendingTemplates.size === 0) {
            updateStatus("logged_in");
          }
        }, (error) => {
          console.error("[MessageTemplatesDB] User document sync error:", error);
          updateStatus("error");
        });
  
        state.subscriptions.set("user", userUnsubscribe);
      } catch (error) {
        console.error("[MessageTemplatesDB] Setup realtime sync failed:", error);
        cleanupSubscriptions();
        updateStatus("error");
      }
    }
  
    async function setupTemplateListeners(templateRefs) {
      const currentTemplates = new Set();
      console.log("[MessageTemplatesDB] Setting up template listeners for:", templateRefs);
  
      templateRefs.forEach((templateData) => {
        const templateId = templateData.id;
        if (templateData.t === "shared" && templateData.a !== true) return;
  
        currentTemplates.add(templateId);
  
        if (state.subscriptions.has(`template_${templateId}`)) {
          state.pendingTemplates.delete(templateId);
          checkAllTemplatesLoaded();
          return;
        }
  
        const templateRef = db.collection("message_templates_v2").doc(templateId);
        console.log("[MessageTemplatesDB] Subscribing to template:", templateId);
        const templateUnsubscribe = templateRef.onSnapshot(async (templateDoc) => {
          if (!templateDoc.exists) {
            console.log("[MessageTemplatesDB] Template does not exist, removing:", templateId);
            removeTemplate(templateId);
            state.pendingTemplates.delete(templateId);
            checkAllTemplatesLoaded();
            return;
          }
  
          const template = templateDoc.data();
          console.log("[MessageTemplatesDB] Template data fetched:", template);
  
          const templateInfo = {
            template_id: templateId,
            title: template.t,
            message: template.n,
            last_updated: template.lu,
            type: templateData.t,
            ...(templateData.t === "owned" && { created_at: templateData.ca }),
            ...(templateData.t === "shared" && {
              permission: templateData.ps,
              shared_by: templateData.sbn,
              shared_at: templateData.sa,
              accepted: templateData.a
            })
          };
  
          updateTemplate(templateInfo);
          state.pendingTemplates.delete(templateId);
          checkAllTemplatesLoaded();
        }, (error) => {
          console.error(`[MessageTemplatesDB] Template ${templateId} sync error:`, error);
          state.pendingTemplates.delete(templateId);
          checkAllTemplatesLoaded();
        });
  
        state.subscriptions.set(`template_${templateId}`, templateUnsubscribe);
      });
  
      for (const [key, unsubscribe] of state.subscriptions.entries()) {
        if (key.startsWith("template_")) {
          const templateId = key.replace("template_", "");
          if (!currentTemplates.has(templateId)) {
            console.log("[MessageTemplatesDB] Unsubscribing from outdated template:", templateId);
            unsubscribe();
            state.subscriptions.delete(key);
            removeTemplate(templateId);
            state.pendingTemplates.delete(templateId);
          }
        }
      }
  
      checkAllTemplatesLoaded();
    }
  
    function checkAllTemplatesLoaded() {
      if (state.pendingTemplates.size === 0 && state.status === "in_progress") {
        console.log("[MessageTemplatesDB] All templates loaded, setting status to logged_in");
        updateStatus("logged_in");
      }
    }
  
    function updateTemplate(newTemplate) {
      console.log("[MessageTemplatesDB] Updating template:", newTemplate);
      state.templates = state.templates.map((template) =>
        template.template_id === newTemplate.template_id ? newTemplate : template
      );
  
      if (!state.templates.some((template) => template.template_id === newTemplate.template_id)) {
        state.templates = [...state.templates, newTemplate];
      }
  
      notifyListeners();
    }
  
    function removeTemplate(templateId) {
      console.log("[MessageTemplatesDB] Removing template:", templateId);
      state.templates = state.templates.filter((t) => t.template_id !== templateId);
      notifyListeners();
    }
  
    async function createTemplate(title, message) {
      try {
        console.log("[MessageTemplatesDB] Creating template with title:", title);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const templateRef = db.collection("message_templates_v2").doc(templateId);
  
        await templateRef.set({
          t: title,
          n: message,
          lu: new Date().toISOString()
        });
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        await userRef.update({
          "d.s": firebase.firestore.FieldValue.arrayUnion({
            id: templateId,
            t: "owned",
            ca: new Date().toISOString()
          })
        });
  
        return templateId;
      } catch (error) {
        console.error("[MessageTemplatesDB] Create template error:", error);
        throw error;
      }
    }
  
    async function updateTemplateContent(templateId, title, message) {
      try {
        console.log("[MessageTemplatesDB] Updating template:", templateId);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const templateRef = db.collection("message_templates_v2").doc(templateId);
        await templateRef.update({
          t: title,
          n: message,
          lu: new Date().toISOString()
        });
      } catch (error) {
        console.error("[MessageTemplatesDB] Update template error:", error);
        throw error;
      }
    }
  
    async function deleteTemplate(templateId) {
      try {
        console.log("[MessageTemplatesDB] Deleting template:", templateId);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data()?.d || {};
        const templateRefs = userData.s || [];
        const templateToRemove = templateRefs.find((t) => t.id === templateId);
  
        if (!templateToRemove) throw new Error("Template not found in user document");
  
        const templateRef = db.collection("message_templates_v2").doc(templateId);
        await templateRef.delete();
  
        await userRef.update({
          "d.s": firebase.firestore.FieldValue.arrayRemove(templateToRemove)
        });
      } catch (error) {
        console.error("[MessageTemplatesDB] Delete template error:", error);
        throw error;
      }
    }
  
    async function shareTemplate(templateId, recipientId) {
      try {
        console.log("[MessageTemplatesDB] Sharing template:", templateId, "with:", recipientId);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const templateDoc = await db.collection("message_templates_v2").doc(templateId).get();
        if (!templateDoc.exists) throw new Error("Template does not exist");
  
        const userProfileDoc = await db.collection("user_profiles").doc(currentUser.uid).get();
        const sharedByName = userProfileDoc.exists ? userProfileDoc.data().displayName : "Unknown User";
  
        const recipientRef = db.collection("users_v2").doc(recipientId);
        const recipientDoc = await recipientRef.get();
        if (!recipientDoc.exists) throw new Error("Recipient user does not exist");
  
        const recipientData = recipientDoc.data();
        const templates = recipientData?.d?.s || [];
        if (templates.some((t) => t.id === templateId)) throw new Error("Template already shared");
  
        await recipientRef.update({
          "d.s": firebase.firestore.FieldValue.arrayUnion({
            id: templateId,
            t: "shared",
            sbn: sharedByName,
            sa: new Date().toISOString(),
            a: null
          })
        });
      } catch (error) {
        console.error("[MessageTemplatesDB] Share template error:", error);
        throw error;
      }
    }
  
    async function updateSharedTemplateStatus(templateId, accept) {
      try {
        console.log("[MessageTemplatesDB] Updating shared template status:", templateId, "to:", accept);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error("User document does not exist");
  
        const userData = userDoc.data();
        const templates = userData?.d?.s || [];
        const templateIndex = templates.findIndex((t) => t.id === templateId && t.t === "shared");
        if (templateIndex === -1) throw new Error("Shared template not found");
  
        templates[templateIndex].a = accept;
        await userRef.update({ "d.s": templates });
      } catch (error) {
        console.error("[MessageTemplatesDB] Update shared template status error:", error);
        throw error;
      }
    }
  
    function destroy() {
      console.log("[MessageTemplatesDB] Destroying templates database");
      cleanupSubscriptions();
      state.status = null;
      notifyListeners();
    }
  
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("[MessageTemplatesDB] Received message:", message);
      if (message.type === "auth_status") {
        sendResponse({ status: state.status });
      } else if (message.type === "LOGGED_IN") {
        currentUser = { uid: message.uid };
        db = firebase.firestore();
        setupRealtimeSync();
      } else if (message.type === "LOGGED_OUT") {
        cleanupSubscriptions();
        resetState();
        updateStatus("logged_out");
      } else if (message.type === "CREATE_TEMPLATE") {
        createTemplate(message.title, message.message)
          .then((templateId) => sendResponse({ success: true, templateId }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "UPDATE_TEMPLATE") {
        updateTemplateContent(message.templateId, message.title, message.message)
          .then(() => sendResponse({ success: true }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "DELETE_TEMPLATE") {
        deleteTemplate(message.templateId)
          .then(() => sendResponse({ success: true }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "SHARE_TEMPLATE") {
        shareTemplate(message.templateId, message.recipientId)
          .then(() => sendResponse({ success: true }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      } else if (message.type === "UPDATE_SHARED_TEMPLATE_STATUS") {
        updateSharedTemplateStatus(message.templateId, message.accept)
          .then(() => sendResponse({ success: true }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
      }
    });
  
    (async function initialize() {
      console.log("[MessageTemplatesDB] Fetching initial auth status");
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "auth_status" }, (response) => {
          console.log("[MessageTemplatesDB] Initial auth status response:", response);
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
  
    if (!window.messageTemplatesDatabase) {
      window.messageTemplatesDatabase = {
        createTemplate,
        updateTemplateContent,
        deleteTemplate,
        shareTemplate,
        updateSharedTemplateStatus,
        destroy
      };
    }
  })();
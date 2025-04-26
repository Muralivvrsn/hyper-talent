(function () {
    // Global state
    let state = {
      notes: [],
      status: "in_progress",
      subscriptions: new Map(),
      pendingNotes: new Set()
    };
  
    let db = null;
    let currentUser = null;
  
    // Notify listeners with NOTES_UPDATED message
    function notifyListeners() {
      console.log("[NotesDB] Notifying listeners with updated state:", state);
      chrome.runtime.sendMessage({
        type: "NOTES_UPDATED",
        status: state.status,
        notes: [...state.notes],
        timestamp: new Date().toISOString()
      });
    }
  
    // Update status and notify if changed
    function updateStatus(newStatus) {
      if (state.status !== newStatus) {
        console.log("[NotesDB] Status updated from", state.status, "to", newStatus);
        state.status = newStatus;
        notifyListeners();
      }
    }
  
    // Cleanup all subscriptions
    function cleanupSubscriptions() {
      console.log("[NotesDB] Cleaning up subscriptions");
      for (const unsubscribe of state.subscriptions.values()) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("[NotesDB] Cleanup error:", error);
        }
      }
      state.subscriptions.clear();
    }
  
    // Reset state
    function resetState() {
      console.log("[NotesDB] Resetting state");
      state.notes = [];
      notifyListeners();
    }
  
    // Setup real-time sync with Firestore
    async function setupRealtimeSync() {
      try {
        if (!db || !currentUser) {
          console.log("[NotesDB] No db or user, setting status to logged_out");
          updateStatus("logged_out");
          return;
        }
  
        cleanupSubscriptions();
        state.pendingNotes = new Set();
        updateStatus("in_progress");
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        console.log("[NotesDB] Setting up user snapshot listener for UID:", currentUser.uid);
        const userUnsubscribe = userRef.onSnapshot(async (userDoc) => {
          if (!userDoc.exists) {
            console.log("[NotesDB] User document does not exist");
            return;
          }
  
          const userData = userDoc.data()?.d || {};
          const notesList = userData.n || [];
          console.log("[NotesDB] User notes list:", notesList);
  
          notesList.forEach((note) => state.pendingNotes.add(note.id));
          await setupNoteListeners(notesList);
  
          if (state.pendingNotes.size === 0) {
            updateStatus("logged_in");
          }
        }, (error) => {
          console.error("[NotesDB] User document sync error:", error);
          updateStatus("error");
        });
  
        state.subscriptions.set("user", userUnsubscribe);
      } catch (error) {
        console.error("[NotesDB] Setup realtime sync failed:", error);
        cleanupSubscriptions();
        updateStatus("error");
      }
    }
  
    // Setup listeners for individual notes
    async function setupNoteListeners(notesList) {
      const currentNotes = new Set();
      console.log("[NotesDB] Setting up note listeners for:", notesList);
  
      notesList.forEach((noteData) => {
        const noteId = noteData.id;
        if (noteData.t === "shared" && noteData.a !== true) return;
  
        currentNotes.add(noteId);
  
        if (state.subscriptions.has(`note_${noteId}`)) {
          state.pendingNotes.delete(noteId);
          checkAllNotesLoaded();
          return;
        }
  
        const noteRef = db.collection("profile_notes_v2").doc(noteId);
        console.log("[NotesDB] Subscribing to note:", noteId);
        const noteUnsubscribe = noteRef.onSnapshot(async (noteDoc) => {
          if (!noteDoc.exists) {
            console.log("[NotesDB] Note does not exist, removing:", noteId);
            removeNote(noteId);
            state.pendingNotes.delete(noteId);
            checkAllNotesLoaded();
            return;
          }
  
          const note = noteDoc.data();
          console.log("[NotesDB] Note data fetched:", note);
  
          const noteInfo = {
            note_id: noteId,
            note_text: note.n,
            profile_id: note.p,
            last_updated: note.lu,
            type: noteData.t,
            ...(noteData.t === "owned" && { created_at: noteData.ca }),
            ...(noteData.t === "shared" && {
              permission: noteData.ps,
              shared_by: noteData.sbn,
              shared_at: noteData.sa
            })
          };
  
          updateNote(noteInfo);
          state.pendingNotes.delete(noteId);
          checkAllNotesLoaded();
        }, (error) => {
          console.error(`[NotesDB] Note ${noteId} sync error:`, error);
          state.pendingNotes.delete(noteId);
          checkAllNotesLoaded();
        });
  
        state.subscriptions.set(`note_${noteId}`, noteUnsubscribe);
      });
  
      for (const [key, unsubscribe] of state.subscriptions.entries()) {
        if (key.startsWith("note_")) {
          const noteId = key.replace("note_", "");
          if (!currentNotes.has(noteId)) {
            console.log("[NotesDB] Unsubscribing from outdated note:", noteId);
            unsubscribe();
            state.subscriptions.delete(key);
            removeNote(noteId);
            state.pendingNotes.delete(noteId);
          }
        }
      }
  
      checkAllNotesLoaded();
    }
  
    // Check if all notes are loaded
    function checkAllNotesLoaded() {
      if (state.pendingNotes.size === 0 && state.status === "in_progress") {
        console.log("[NotesDB] All notes loaded, setting status to logged_in");
        updateStatus("logged_in");
      }
    }
  
    // Update a note in state
    function updateNote(newNote) {
      console.log("[NotesDB] Updating note:", newNote);
      state.notes = state.notes.map((note) =>
        note.note_id === newNote.note_id ? newNote : note
      );
  
      if (!state.notes.some((note) => note.note_id === newNote.note_id)) {
        state.notes = [...state.notes, newNote];
      }
  
      notifyListeners();
    }
  
    // Remove a note from state
    function removeNote(noteId) {
      console.log("[NotesDB] Removing note:", noteId);
      state.notes = state.notes.filter((n) => n.note_id !== noteId);
      notifyListeners();
    }
  
    // Create a new note
    async function createNote(profileId, noteText) {
      if (!window.start_action("creating note", "Crafting a new note...")) {
        throw new Error("Action start failed");
      }
      try {
        console.log("[NotesDB] Creating note for profile:", profileId);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const noteId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const noteRef = db.collection("profile_notes_v2").doc(noteId);
  
        await noteRef.set({
          n: noteText,
          p: profileId,
          lu: new Date().toISOString()
        });
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        await userRef.update({
          "d.n": firebase.firestore.FieldValue.arrayUnion({
            id: noteId,
            t: "owned",
            ca: new Date().toISOString()
          })
        });
  
        window.complete_action("creating note", true, "Note created successfully!");
        return noteId;
      } catch (error) {
        console.error("[NotesDB] Create note error:", error);
        window.complete_action("creating note", false, "Failed to create note!");
        throw error;
      }
    }
  
    // Update a note
    async function updateNoteText(noteId, noteText) {
      if (!window.start_action("updating note", "Updating note...")) {
        throw new Error("Action start failed");
      }
      try {
        console.log("[NotesDB] Updating note:", noteId);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const noteRef = db.collection("profile_notes_v2").doc(noteId);
        await noteRef.update({
          n: noteText,
          lu: new Date().toISOString()
        });
  
        window.complete_action("updating note", true, "Note updated successfully!");
        return true;
      } catch (error) {
        console.error("[NotesDB] Update note error:", error);
        window.complete_action("updating note", false, "Failed to update note!");
        throw error;
      }
    }
  
    // Delete a note
    async function deleteNote(noteId) {
      if (!window.start_action("deleting note", "Deleting note...")) {
        throw new Error("Action start failed");
      }
      try {
        console.log("[NotesDB] Deleting note:", noteId);
        if (!db || !currentUser) throw new Error("Not authenticated");
  
        const userRef = db.collection("users_v2").doc(currentUser.uid);
        const userDoc = await userRef.get();
        const userData = userDoc.data()?.d || {};
        const notesList = userData.n || [];
        const noteToRemove = notesList.find((note) => note.id === noteId);
  
        if (!noteToRemove) throw new Error("Note not found in user document");
  
        const noteRef = db.collection("profile_notes_v2").doc(noteId);
        await noteRef.delete();
  
        await userRef.update({
          "d.n": firebase.firestore.FieldValue.arrayRemove(noteToRemove)
        });
  
        window.complete_action("deleting note", true, "Note deleted successfully!");
        return true;
      } catch (error) {
        console.error("[NotesDB] Delete note error:", error);
        window.complete_action("deleting note", false, "Failed to delete note!");
        throw error;
      }
    }
  
    // Destroy the database
    function destroy() {
      console.log("[NotesDB] Destroying notes database");
      cleanupSubscriptions();
      state.status = null;
      notifyListeners();
    }
  
    // Message listeners
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("[NotesDB] Received message:", message);
      if (message.type === "auth_status") {
        console.log("[NotesDB] Responding with status:", state.status);
        sendResponse({ status: state.status });
      } else if (message.type === "LOGGED_IN") {
        currentUser = { uid: message.uid };
        db = firebase.firestore();
        console.log("[NotesDB] User logged in, UID:", currentUser.uid);
        setupRealtimeSync();
      } else if (message.type === "LOGGED_OUT") {
        cleanupSubscriptions();
        resetState();
        updateStatus("logged_out");
        console.log("[NotesDB] User logged out");
      }
    });
  
    // Initial fetch of auth state
    (async function initialize() {
      console.log("[NotesDB] Fetching initial auth status");
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "auth_status" }, (response) => {
          console.log("[NotesDB] Initial auth status response:", response);
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
  
    // Expose functions to window
    if (!window.notesDatabase) {
      window.notesDatabase = {
        createNote,
        updateNoteText,
        deleteNote,
        destroy
      };
    }
  })();
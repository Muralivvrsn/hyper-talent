// Firebase is available globally via <script> tags in offscreen.html
const firebaseConfig = {
    apiKey: "AIzaSyBFggUUWmz6H53hxr-jL00tGDYr9x4DQg4",
    authDomain: "hyper-75b53.firebaseapp.com",
    projectId: "hyper-75b53"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore(); // Optional
  
  let currentUser = null;
  let status = null;
  let refreshInterval = null;
  
  // Verify token with Firebase Auth
  async function verifyToken(accessToken) {
    console.log("[Offscreen] Verifying token:", accessToken.slice(0, 10) + "...");
    try {
      const credential = firebase.auth.GoogleAuthProvider.credential(null, accessToken);
      const userCredential = await auth.signInWithCredential(credential);
      currentUser = userCredential.user;
      console.log("[Offscreen] User authenticated:", currentUser.email);
      return true;
    } catch (error) {
      console.error("[Offscreen] Token verification failed:", error);
      return false;
    }
  }
  
  // Initialize authentication by fetching token from background.js
  async function initialize() {
    console.log("[Offscreen] Initializing authentication...");
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "GET_TOKEN" }, resolve);
      });
  
      if (response.type === "logged_in" && response.data?.accessToken) {
        console.log("[Offscreen] Token received:", response.data.accessToken.slice(0, 10) + "...");
        const isValid = await verifyToken(response.data.accessToken);
        if (isValid) {
          status = "logged_in";
          startTokenRefresh();
          console.log("[Offscreen] Authentication successful, status:", status);
          chrome.runtime.sendMessage({ type: "SIGNED_IN" });
        } else {
          status = "logged_out";
          console.log("[Offscreen] Token invalid, status:", status);
          chrome.runtime.sendMessage({ type: "SIGNED_OUT" });
        }
      } else {
        status = "logged_out";
        console.log("[Offscreen] No valid token, status:", status);
        chrome.runtime.sendMessage({ type: "SIGNED_OUT" });
      }
    } catch (error) {
      console.error("[Offscreen] Initialization failed:", error);
      status = "logged_out";
      chrome.runtime.sendMessage({ type: "SIGNED_OUT" });
    }
  }
  
  // Token refresh logic
  function startTokenRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
      console.log("[Offscreen] Refreshing token...");
      try {
        const response = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "GET_TOKEN" }, resolve);
        });
        if (response.type === "logged_in" && response.data?.accessToken) {
          const isValid = await verifyToken(response.data.accessToken);
          if (!isValid) {
            handleLoggedOut();
          }
        } else {
          handleLoggedOut();
        }
      } catch (error) {
        console.error("[Offscreen] Token refresh failed:", error);
        handleLoggedOut();
      }
    }, 45 * 60 * 1000); // Refresh every 45 minutes
  }
  
  function handleLoggedOut() {
    console.log("[Offscreen] Handling logout...");
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = null;
    status = "logged_out";
    currentUser = null;
    auth.signOut().catch((error) => console.error("[Offscreen] Sign out failed:", error));
    chrome.runtime.sendMessage({ type: "SIGNED_OUT" });
  }
  
  // Handle messages from background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "fetch-status") {
      console.log("[Offscreen] Status requested, sending:", status);
      sendResponse({ status, user: currentUser ? currentUser.email : null });
    } else if (message.type === "LOGGED_IN") {
      initialize(); // Re-initialize on login signal
    } else if (message.type === "LOGGED_OUT") {
      handleLoggedOut();
    }
  });
  
  // Start the authentication process
  initialize();
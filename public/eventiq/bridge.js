// EventIQ Bridge — Orchestrator
// Hooks into LinkAgent's existing profile detection to show EventIQ intelligence

window.EventIQBridge = class EventIQBridge {
  constructor() {
    this.client = new window.EventIQClient();
    this.sidebar = new window.EventIQSidebar(this.client);
    this.currentProfile = null;
  }

  async waitForConfig() {
    if (!window.EVENTIQ_CONFIG.ready) {
      await window.EVENTIQ_CONFIG.waitReady();
    }
  }

  isConfigured() {
    return window.EVENTIQ_CONFIG.enabled && window.EVENTIQ_CONFIG.toolKey;
  }

  // Extract profile name and URL directly from LinkedIn DOM (no dependency on other systems)
  getProfileFromDOM() {
    const url = window.location.href;

    // Profile page: extract name from h1
    if (url.includes('linkedin.com/in/')) {
      const h1 = document.querySelector('main h1');
      const name = h1?.textContent?.trim();
      const usernameMatch = url.match(/\/in\/([^/?]+)/);
      const username = usernameMatch ? usernameMatch[1] : null;
      const linkedinUrl = username ? `https://www.linkedin.com/in/${username}` : url;

      if (name) {
        return { name, linkedinUrl, username };
      }
    }

    // Messaging page: extract from thread header
    if (url.includes('messaging/thread')) {
      const profileLink = document.querySelector('.msg-thread__link-to-profile');
      const name = profileLink?.querySelector('h2')?.textContent?.trim();
      if (name) {
        return { name, linkedinUrl: profileLink?.href || '', username: null };
      }
    }

    return null;
  }

  // Called when user lands on a LinkedIn profile page
  async onProfilePage() {
    await this.waitForConfig();
    if (!this.isConfigured()) {
      console.debug('[EventIQ] Not configured — key:', !!window.EVENTIQ_CONFIG.toolKey, 'enabled:', window.EVENTIQ_CONFIG.enabled);
      return;
    }

    try {
      // Try LinkAgent's profile extraction first, fall back to direct DOM
      let profileInfo = null;
      try {
        profileInfo = await window.labelManagerUtils?.getProfileInfo();
      } catch (e) {
        console.debug('[EventIQ] labelManagerUtils failed, using DOM fallback');
      }

      // Fallback: read directly from page DOM
      if (!profileInfo?.name) {
        profileInfo = this.getProfileFromDOM();
      }

      if (!profileInfo?.name) {
        console.debug('[EventIQ] Could not extract profile name from page');
        return;
      }

      console.debug('[EventIQ] Profile detected:', profileInfo.name);

      // Skip if we already showing sidebar for this profile
      if (this.currentProfile === profileInfo.name) return;
      this.currentProfile = profileInfo.name;

      // Build LinkedIn URL
      const linkedinUrl = profileInfo.linkedinUrl
        || (profileInfo.username ? `https://www.linkedin.com/in/${profileInfo.username}` : profileInfo.url);

      // Match against EventIQ leaders
      console.debug('[EventIQ] Searching for leader:', profileInfo.name, linkedinUrl);
      const result = await this.client.matchLeader(profileInfo.name, linkedinUrl);

      if (result?.found) {
        console.debug('[EventIQ] Match found:', result.companyName);
        this.sidebar.inject(result);
      } else {
        console.debug('[EventIQ] No match for:', profileInfo.name);
        this.sidebar.injectNotFound();
      }
    } catch (err) {
      console.debug('[EventIQ] Profile match error:', err.message);
      this.sidebar.cleanup();
    }
  }

  // Called when user is on a messaging page
  async onMessagingPage() {
    await this.waitForConfig();
    if (!this.isConfigured()) return;

    try {
      let profileInfo = null;
      try {
        profileInfo = await window.labelManagerUtils?.getProfileInfo();
      } catch (e) { /* fallback below */ }

      if (!profileInfo?.name) {
        profileInfo = this.getProfileFromDOM();
      }
      if (!profileInfo?.name) return;

      const result = await this.client.matchLeader(profileInfo.name);
      if (result?.found) {
        this.sidebar.inject(result);
        this.observeMessageSends(result.companyId, profileInfo.name);
      }
    } catch (err) {
      console.debug('[EventIQ] Messaging match error:', err.message);
    }
  }

  // Watch for "Send" button clicks to auto-log LinkedIn message engagements
  observeMessageSends(companyId, recipientName) {
    const sendButton = document.querySelector('.msg-form__send-button');
    if (sendButton && !sendButton._eventiqListening) {
      sendButton._eventiqListening = true;
      sendButton.addEventListener('click', () => {
        this.client.logEngagement(companyId, recipientName, 'linkedin_message', 'Message sent via LinkedIn')
          .catch(err => console.debug('[EventIQ] Engagement log error:', err.message));
      });
    }
  }

  // Clean up when navigating away
  cleanup() {
    this.currentProfile = null;
    this.sidebar.cleanup();
  }
};

// Create global instance
window.eventiqBridge = new window.EventIQBridge();

// Also self-trigger on profile pages (in case content.js hook doesn't fire)
(function autoDetect() {
  const url = window.location.href;
  if (url.includes('linkedin.com/in/')) {
    // Wait for the page to load the profile name
    const tryInit = (attempts) => {
      if (attempts <= 0) return;
      const h1 = document.querySelector('main h1');
      if (h1?.textContent?.trim()) {
        console.debug('[EventIQ] Auto-detected profile page, triggering bridge');
        window.eventiqBridge.onProfilePage();
      } else {
        setTimeout(() => tryInit(attempts - 1), 1000);
      }
    };
    // Start checking after a short delay to let the page render
    setTimeout(() => tryInit(10), 2000);
  }
})();

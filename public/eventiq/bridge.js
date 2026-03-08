// EventIQ Bridge — Orchestrator
// Hooks into LinkAgent's existing profile detection to show EventIQ intelligence

window.EventIQBridge = class EventIQBridge {
  constructor() {
    this.client = new window.EventIQClient();
    this.sidebar = new window.EventIQSidebar(this.client);
    this.currentProfile = null;
    this.initialized = false;
  }

  isConfigured() {
    return window.EVENTIQ_CONFIG.enabled && window.EVENTIQ_CONFIG.toolKey;
  }

  // Called when user lands on a LinkedIn profile page
  async onProfilePage() {
    if (!this.isConfigured()) return;

    try {
      // Use LinkAgent's existing profile info extraction
      const profileInfo = await window.labelManagerUtils?.getProfileInfo();
      if (!profileInfo?.name) return;

      // Skip if we already showing sidebar for this profile
      if (this.currentProfile === profileInfo.name) return;
      this.currentProfile = profileInfo.name;

      // Build LinkedIn URL from username if available
      const linkedinUrl = profileInfo.username
        ? `https://www.linkedin.com/in/${profileInfo.username}`
        : profileInfo.url;

      // Match against EventIQ leaders
      const result = await this.client.matchLeader(profileInfo.name, linkedinUrl);

      if (result?.found) {
        this.sidebar.inject(result);
      } else {
        this.sidebar.injectNotFound();
      }
    } catch (err) {
      console.debug('[EventIQ] Profile match error:', err.message);
      this.sidebar.cleanup();
    }
  }

  // Called when user is on a messaging page
  async onMessagingPage() {
    if (!this.isConfigured()) return;

    try {
      const profileInfo = await window.labelManagerUtils?.getProfileInfo();
      if (!profileInfo?.name) return;

      // Check if message recipient is an EventIQ leader
      const result = await this.client.matchLeader(profileInfo.name);
      if (result?.found) {
        // Show a compact floating panel with hooks
        this.sidebar.inject(result);
        // Auto-detect message sends for engagement logging
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

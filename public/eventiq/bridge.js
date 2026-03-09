// EventIQ Bridge — Orchestrator
// Detects LinkedIn profile changes and fetches EventIQ intelligence for the side panel

window.EventIQBridge = class EventIQBridge {
  constructor() {
    this.client = new window.EventIQClient();
    this.currentProfile = null;
    this.currentSlug = null;
    this._fetchingForSlug = null;  // Lock: slug currently being fetched
    this._pollInterval = null;
  }

  async waitForConfig() {
    if (!window.EVENTIQ_CONFIG.ready) {
      await window.EVENTIQ_CONFIG.waitReady();
    }
  }

  isConfigured() {
    return window.EVENTIQ_CONFIG.enabled && window.EVENTIQ_CONFIG.toolKey;
  }

  // Extract the /in/slug from the current URL
  getSlugFromUrl() {
    const match = window.location.href.match(/\/in\/([^/?]+)/);
    return match ? match[1] : null;
  }

  // Read profile name + URL from the LinkedIn DOM (no caching, always fresh)
  getProfileFromDOM() {
    const url = window.location.href;

    if (url.includes('linkedin.com/in/')) {
      const h1 = document.querySelector('main h1');
      const name = h1?.textContent?.trim();
      const slug = this.getSlugFromUrl();
      const linkedinUrl = slug ? `https://www.linkedin.com/in/${slug}` : url;
      if (name) return { name, linkedinUrl, username: slug };
    }

    if (url.includes('messaging/thread')) {
      const profileLink = document.querySelector('.msg-thread__link-to-profile');
      const name = profileLink?.querySelector('h2')?.textContent?.trim();
      if (name) return { name, linkedinUrl: profileLink?.href || '', username: null };
    }

    return null;
  }

  // Wait for LinkedIn SPA to render a new profile in the DOM.
  // After SPA navigation, the URL changes instantly but the <h1> still shows the OLD name.
  // This polls until the h1 shows a different name, or times out.
  waitForNewProfile(oldName, maxWaitMs = 8000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const h1 = document.querySelector('main h1');
        const name = h1?.textContent?.trim();
        if (name && name !== oldName) {
          resolve(name);
        } else if (Date.now() - start > maxWaitMs) {
          // Timeout — resolve with whatever is there.
          // Could be same name if user visited the same profile twice,
          // or if LinkedIn was extremely slow to render.
          resolve(name || null);
        } else {
          setTimeout(check, 300);
        }
      };
      check();
    });
  }

  // Wait for any profile name to appear in the <h1> (used on first page load)
  waitForH1(maxWaitMs = 10000) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const h1 = document.querySelector('main h1');
        const name = h1?.textContent?.trim();
        if (name) {
          resolve(name);
        } else if (Date.now() - start > maxWaitMs) {
          resolve(null);
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  }

  // Fetch intel and write to chrome.storage for the side panel to read
  async fetchAndPublish(profileInfo) {
    const linkedinUrl = profileInfo.linkedinUrl
      || (profileInfo.username ? `https://www.linkedin.com/in/${profileInfo.username}` : '');

    console.debug('[EventIQ] Fetching leader:', profileInfo.name, linkedinUrl);
    const result = await this.client.matchLeader(profileInfo.name, linkedinUrl);

    const payload = result?.found
      ? { ...result, profileName: profileInfo.name, linkedinUrl, timestamp: Date.now() }
      : { found: false, profileName: profileInfo.name, linkedinUrl, timestamp: Date.now() };

    chrome.storage.local.set({ eventiq_intel: payload });
    console.debug('[EventIQ]', result?.found ? `Match: ${result.companyName}` : `No match for: ${profileInfo.name}`);
  }

  // Force refresh — called from side panel refresh button via chrome.storage signal
  async forceRefresh() {
    console.debug('[EventIQ] Force refresh requested');
    this.currentProfile = null;
    this.currentSlug = null;
    this._fetchingForSlug = null;

    const url = window.location.href;
    if (url.includes('linkedin.com/in/')) {
      await this.onProfilePage();
    } else if (url.includes('messaging/thread')) {
      await this.onMessagingPage();
    }
  }

  // Main entry point — called when a profile page is detected
  async onProfilePage() {
    await this.waitForConfig();
    if (!this.isConfigured()) {
      console.debug('[EventIQ] Not configured');
      return;
    }

    const newSlug = this.getSlugFromUrl();
    if (!newSlug) return;

    // Deduplicate: skip if already fetched or currently fetching for this slug
    if (newSlug === this.currentSlug || newSlug === this._fetchingForSlug) {
      return;
    }

    // Acquire fetch lock
    this._fetchingForSlug = newSlug;

    try {
      // The URL has changed but LinkedIn SPA hasn't rendered yet.
      // Wait for the <h1> to show the new person's name.
      if (this.currentProfile) {
        console.debug('[EventIQ] Slug changed:', this.currentSlug, '→', newSlug, '— waiting for DOM');
        await this.waitForNewProfile(this.currentProfile);
      } else {
        // First visit — just wait for any h1 to appear
        await this.waitForH1();
      }

      // Read profile from DOM (always fresh, no cache)
      const profileInfo = this.getProfileFromDOM();
      if (!profileInfo?.name) {
        console.debug('[EventIQ] Could not extract profile name after waiting');
        this._fetchingForSlug = null;
        return;
      }

      console.debug('[EventIQ] Profile:', profileInfo.name, '(slug:', newSlug + ')');
      this.currentProfile = profileInfo.name;
      this.currentSlug = newSlug;

      await this.fetchAndPublish(profileInfo);
    } catch (err) {
      console.debug('[EventIQ] Profile match error:', err.message);
      chrome.storage.local.remove(['eventiq_intel']);
    } finally {
      this._fetchingForSlug = null;
    }
  }

  // Called when user is on a messaging page
  async onMessagingPage() {
    await this.waitForConfig();
    if (!this.isConfigured()) return;

    try {
      let profileInfo = this.getProfileFromDOM();
      if (!profileInfo?.name) {
        try {
          profileInfo = await window.labelManagerUtils?.getProfileInfo();
        } catch (e) { /* ignore */ }
      }
      if (!profileInfo?.name) return;

      const result = await this.client.matchLeader(profileInfo.name);
      if (result?.found) {
        chrome.storage.local.set({
          eventiq_intel: { ...result, profileName: profileInfo.name, timestamp: Date.now() }
        });
        this.observeMessageSends(result.companyId, profileInfo.name);
      }
    } catch (err) {
      console.debug('[EventIQ] Messaging match error:', err.message);
    }
  }

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

  cleanup() {
    this.currentProfile = null;
    this.currentSlug = null;
    this._fetchingForSlug = null;
    chrome.storage.local.remove(['eventiq_intel']);
  }

  // URL polling — catches all SPA navigations reliably
  startWatching() {
    this.stopWatching();

    let lastUrl = window.location.href;
    this._pollInterval = setInterval(() => {
      const url = window.location.href;
      if (url === lastUrl) return;
      lastUrl = url;

      console.debug('[EventIQ] URL changed (poll):', url);
      if (url.includes('linkedin.com/in/')) {
        this.onProfilePage();
      } else if (url.includes('messaging/thread')) {
        this.onMessagingPage();
      } else {
        this.cleanup();
      }
    }, 1500);
  }

  stopWatching() {
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }
};

// Create global instance
window.eventiqBridge = new window.EventIQBridge();

// Listen for refresh requests from the side panel
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.eventiq_refresh_request) {
    window.eventiqBridge.forceRefresh();
  }
});

// Initial detection + start continuous URL watching
(function init() {
  const url = window.location.href;

  if (url.includes('linkedin.com/in/')) {
    window.eventiqBridge.onProfilePage();
  } else if (url.includes('messaging/thread')) {
    window.eventiqBridge.onMessagingPage();
  }

  window.eventiqBridge.startWatching();
})();

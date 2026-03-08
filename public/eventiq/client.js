// EventIQ API Client
// Routes API calls through the background service worker to avoid CORS issues

window.EventIQClient = class EventIQClient {
  constructor() {
    this.apiBase = window.EVENTIQ_CONFIG.apiBase;
    this.cache = new Map();
  }

  getToolKey() {
    return window.EVENTIQ_CONFIG.toolKey;
  }

  // Route fetch through background script (service worker has no CORS restrictions)
  async request(path, options = {}) {
    const toolKey = this.getToolKey();
    if (!toolKey) {
      throw new Error('EventIQ API key not configured. Set it in LinkAgent settings.');
    }

    const url = `${this.apiBase}${path}`;

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'EVENTIQ_FETCH',
        url,
        options: {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Tool-Key': toolKey,
            ...(options.headers || {})
          },
          body: options.body || null
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response?.data);
      });
    });
  }

  // Fast leader lookup — single call returns everything the sidebar needs
  async matchLeader(name, linkedinUrl) {
    const cacheKey = `leader:${name}:${linkedinUrl || ''}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < window.EVENTIQ_CONFIG.cache.ttlMs) {
      return cached.data;
    }

    const params = new URLSearchParams();
    if (name) params.set('name', name);
    if (linkedinUrl) params.set('li', linkedinUrl);

    const data = await this.request(`/leader-match?${params.toString()}`);

    // Cache result
    this.cache.set(cacheKey, { data, ts: Date.now() });

    // Evict old entries if cache is too large
    if (this.cache.size > window.EVENTIQ_CONFIG.cache.maxEntries) {
      const oldest = [...this.cache.entries()]
        .sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) this.cache.delete(oldest[0]);
    }

    return data;
  }

  // Log an engagement event (message sent, connection request, profile view)
  async logEngagement(companyId, contactName, action, notes) {
    return this.request('/log-engagement', {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        contactName,
        channel: 'linkedin',
        action,
        notes: notes || ''
      })
    });
  }

  // Add a note to a company
  async addNote(companyId, note) {
    return this.request('/add-note', {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        note,
        authorName: 'LinkAgent'
      })
    });
  }

  clearCache() {
    this.cache.clear();
  }
};

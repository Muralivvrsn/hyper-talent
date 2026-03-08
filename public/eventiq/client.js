// EventIQ API Client
// Communicates with EventIQ backend to fetch leader/company intelligence

window.EventIQClient = class EventIQClient {
  constructor() {
    this.apiBase = window.EVENTIQ_CONFIG.apiBase;
    this.cache = new Map();
  }

  getToolKey() {
    return window.EVENTIQ_CONFIG.toolKey;
  }

  async request(path, options = {}) {
    const toolKey = this.getToolKey();
    if (!toolKey) {
      throw new Error('EventIQ API key not configured. Set it in LinkAgent settings.');
    }

    const url = `${this.apiBase}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Tool-Key': toolKey,
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`EventIQ API error ${response.status}: ${text}`);
    }

    return response.json();
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

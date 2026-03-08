// EventIQ Sidebar Overlay
// Renders company intelligence panel on LinkedIn profile pages

window.EventIQSidebar = class EventIQSidebar {
  constructor(client) {
    this.client = client;
    this.container = null;
    this.isMinimized = false;
  }

  // Remove existing sidebar if present
  cleanup() {
    const existing = document.getElementById('eventiq-sidebar');
    if (existing) existing.remove();
  }

  // Inject sidebar next to LinkedIn profile
  inject(data) {
    this.cleanup();

    if (!data || !data.found) return;

    const container = document.createElement('div');
    container.id = 'eventiq-sidebar';
    container.innerHTML = this.buildHTML(data);
    this.applyStyles(container);
    this.attachToPage(container);
    this.bindEvents(container, data);
    this.container = container;
  }

  // Show "not found" badge (minimal UI)
  injectNotFound() {
    this.cleanup();
  }

  buildHTML(data) {
    const { leader, company, companyId, companyName, priority } = data;
    const priorityBadge = this.getPriorityBadge(priority);
    const categoryLabel = company?.category ? this.formatCategory(company.category) : '';

    return `
      <div class="eiq-header">
        <div class="eiq-title-row">
          <span class="eiq-logo">EventIQ</span>
          <button class="eiq-minimize" title="Minimize">_</button>
          <button class="eiq-close" title="Close">&times;</button>
        </div>
      </div>

      <div class="eiq-body">
        <!-- Company Header -->
        <div class="eiq-section eiq-company">
          <div class="eiq-company-name">
            ${this.escapeHtml(companyName)} ${priorityBadge}
          </div>
          ${categoryLabel ? `<div class="eiq-category">${this.escapeHtml(categoryLabel)}</div>` : ''}
          ${company?.desc ? `<div class="eiq-desc">${this.escapeHtml(this.truncate(company.desc, 120))}</div>` : ''}
        </div>

        <!-- Leader Info -->
        ${leader ? this.renderLeader(leader) : ''}

        <!-- Hooks -->
        ${leader?.hooks?.length ? this.renderHooks(leader.hooks) : ''}

        <!-- Talking Points -->
        ${company?.tp?.length ? this.renderTalkingPoints(company.tp) : ''}

        <!-- Icebreaker -->
        ${company?.ice ? this.renderIcebreaker(company.ice, company.icebreakers) : ''}

        <!-- News -->
        ${company?.news?.length ? this.renderNews(company.news) : ''}

        <!-- The Ask -->
        ${company?.ask ? this.renderAsk(company.ask) : ''}

        <!-- Actions -->
        <div class="eiq-section eiq-actions">
          <button class="eiq-btn eiq-btn-log" data-company-id="${companyId}" data-leader="${this.escapeAttr(leader?.n || '')}">
            Log Engagement
          </button>
          <a class="eiq-btn eiq-btn-open" href="https://us.hyperverge.space/?company=${companyId}" target="_blank">
            Open in EventIQ
          </a>
        </div>
      </div>
    `;
  }

  renderLeader(leader) {
    const parts = [];
    if (leader.t) parts.push(this.escapeHtml(leader.t));
    if (leader.bg) parts.push(`<div class="eiq-leader-bg">${this.escapeHtml(leader.bg)}</div>`);
    if (leader.personal) parts.push(`<div class="eiq-leader-personal">${this.escapeHtml(leader.personal)}</div>`);

    return `
      <div class="eiq-section eiq-leader">
        <div class="eiq-section-title">Leader</div>
        <div class="eiq-leader-name">${this.escapeHtml(leader.n || '')}</div>
        ${parts.join('')}
      </div>
    `;
  }

  renderHooks(hooks) {
    const items = hooks.map(h => `
      <div class="eiq-hook-item">
        <span class="eiq-hook-text">${this.escapeHtml(h)}</span>
        <button class="eiq-copy" data-copy="${this.escapeAttr(h)}" title="Copy">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    `).join('');

    return `
      <div class="eiq-section">
        <div class="eiq-section-title">Hooks</div>
        ${items}
      </div>
    `;
  }

  renderTalkingPoints(tp) {
    const items = tp.slice(0, 3).map((point, i) => `
      <div class="eiq-tp-item">
        <span class="eiq-tp-num">${i + 1}</span>
        <span>${this.escapeHtml(point)}</span>
      </div>
    `).join('');

    return `
      <div class="eiq-section">
        <div class="eiq-section-title">Talking Points</div>
        ${items}
      </div>
    `;
  }

  renderIcebreaker(ice, variants) {
    let html = `
      <div class="eiq-section">
        <div class="eiq-section-title">Icebreaker</div>
        <div class="eiq-ice-primary">"${this.escapeHtml(ice)}"</div>
    `;

    if (variants?.length) {
      html += `<div class="eiq-ice-variants">`;
      variants.slice(0, 3).forEach(v => {
        html += `<div class="eiq-ice-variant">"${this.escapeHtml(v)}"</div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  renderNews(news) {
    const items = news.slice(0, 3).map(n => `
      <div class="eiq-news-item">
        ${n.url ? `<a href="${this.escapeAttr(n.url)}" target="_blank">${this.escapeHtml(n.title || n.headline || 'News')}</a>` : this.escapeHtml(n.title || n.headline || '')}
        ${n.date ? `<span class="eiq-news-date">${this.escapeHtml(n.date)}</span>` : ''}
      </div>
    `).join('');

    return `
      <div class="eiq-section">
        <div class="eiq-section-title">Recent News</div>
        ${items}
      </div>
    `;
  }

  renderAsk(ask) {
    return `
      <div class="eiq-section">
        <div class="eiq-section-title">The Ask</div>
        <div class="eiq-ask">${this.escapeHtml(ask)}</div>
      </div>
    `;
  }

  applyStyles(container) {
    container.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      width: 320px;
      max-height: calc(100vh - 100px);
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: #333;
    `;

    const style = document.createElement('style');
    style.textContent = `
      #eventiq-sidebar .eiq-header {
        padding: 12px 16px 8px;
        border-bottom: 1px solid #f0f0f0;
        position: sticky;
        top: 0;
        background: #fff;
        border-radius: 12px 12px 0 0;
      }
      #eventiq-sidebar .eiq-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #eventiq-sidebar .eiq-logo {
        font-weight: 700;
        font-size: 14px;
        color: #0a66c2;
        flex: 1;
      }
      #eventiq-sidebar .eiq-minimize,
      #eventiq-sidebar .eiq-close {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: #666;
        padding: 2px 6px;
        border-radius: 4px;
      }
      #eventiq-sidebar .eiq-minimize:hover,
      #eventiq-sidebar .eiq-close:hover {
        background: #f0f0f0;
      }
      #eventiq-sidebar .eiq-body {
        padding: 8px 0;
      }
      #eventiq-sidebar .eiq-section {
        padding: 8px 16px;
        border-bottom: 1px solid #f5f5f5;
      }
      #eventiq-sidebar .eiq-section:last-child {
        border-bottom: none;
      }
      #eventiq-sidebar .eiq-section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #888;
        margin-bottom: 6px;
        letter-spacing: 0.5px;
      }
      #eventiq-sidebar .eiq-company-name {
        font-size: 16px;
        font-weight: 700;
        color: #111;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #eventiq-sidebar .eiq-priority {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        color: #fff;
      }
      #eventiq-sidebar .eiq-priority-0 { background: #dc2626; }
      #eventiq-sidebar .eiq-priority-1 { background: #f59e0b; }
      #eventiq-sidebar .eiq-priority-2 { background: #6b7280; }
      #eventiq-sidebar .eiq-category {
        font-size: 12px;
        color: #666;
        margin-top: 2px;
      }
      #eventiq-sidebar .eiq-desc {
        font-size: 12px;
        color: #555;
        margin-top: 4px;
        line-height: 1.4;
      }
      #eventiq-sidebar .eiq-leader-name {
        font-weight: 600;
        font-size: 14px;
        color: #222;
      }
      #eventiq-sidebar .eiq-leader-bg,
      #eventiq-sidebar .eiq-leader-personal {
        font-size: 12px;
        color: #555;
        margin-top: 4px;
        line-height: 1.4;
      }
      #eventiq-sidebar .eiq-hook-item {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        padding: 4px 0;
      }
      #eventiq-sidebar .eiq-hook-text {
        flex: 1;
        font-size: 12px;
        line-height: 1.4;
      }
      #eventiq-sidebar .eiq-copy {
        background: none;
        border: none;
        cursor: pointer;
        color: #999;
        padding: 2px;
        border-radius: 3px;
        flex-shrink: 0;
      }
      #eventiq-sidebar .eiq-copy:hover { color: #0a66c2; background: #f0f7ff; }
      #eventiq-sidebar .eiq-tp-item {
        display: flex;
        gap: 8px;
        padding: 4px 0;
        font-size: 12px;
        line-height: 1.4;
      }
      #eventiq-sidebar .eiq-tp-num {
        font-weight: 700;
        color: #0a66c2;
        flex-shrink: 0;
      }
      #eventiq-sidebar .eiq-ice-primary {
        font-style: italic;
        color: #444;
        font-size: 12px;
        line-height: 1.5;
        padding: 6px 10px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #0a66c2;
      }
      #eventiq-sidebar .eiq-ice-variants {
        margin-top: 6px;
      }
      #eventiq-sidebar .eiq-ice-variant {
        font-size: 11px;
        color: #666;
        font-style: italic;
        padding: 2px 0;
      }
      #eventiq-sidebar .eiq-news-item {
        padding: 3px 0;
        font-size: 12px;
      }
      #eventiq-sidebar .eiq-news-item a {
        color: #0a66c2;
        text-decoration: none;
      }
      #eventiq-sidebar .eiq-news-item a:hover { text-decoration: underline; }
      #eventiq-sidebar .eiq-news-date {
        font-size: 10px;
        color: #999;
        margin-left: 4px;
      }
      #eventiq-sidebar .eiq-ask {
        font-size: 12px;
        color: #444;
        line-height: 1.5;
        padding: 6px 10px;
        background: #fff7ed;
        border-radius: 6px;
        border-left: 3px solid #f59e0b;
      }
      #eventiq-sidebar .eiq-actions {
        display: flex;
        gap: 8px;
        padding: 12px 16px;
      }
      #eventiq-sidebar .eiq-btn {
        flex: 1;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        cursor: pointer;
        text-decoration: none;
        border: none;
      }
      #eventiq-sidebar .eiq-btn-log {
        background: #0a66c2;
        color: #fff;
      }
      #eventiq-sidebar .eiq-btn-log:hover { background: #004182; }
      #eventiq-sidebar .eiq-btn-open {
        background: #f0f0f0;
        color: #333;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #eventiq-sidebar .eiq-btn-open:hover { background: #e0e0e0; }
      #eventiq-sidebar.eiq-minimized .eiq-body {
        display: none;
      }
      #eventiq-sidebar.eiq-minimized {
        width: auto;
        max-height: none;
      }

      /* Dark theme support */
      .theme--dark #eventiq-sidebar {
        background: #1d2226;
        border-color: #38434f;
        color: #e0e0e0;
      }
      .theme--dark #eventiq-sidebar .eiq-header {
        background: #1d2226;
        border-color: #38434f;
      }
      .theme--dark #eventiq-sidebar .eiq-section {
        border-color: #38434f;
      }
      .theme--dark #eventiq-sidebar .eiq-company-name { color: #fff; }
      .theme--dark #eventiq-sidebar .eiq-leader-name { color: #e0e0e0; }
      .theme--dark #eventiq-sidebar .eiq-section-title { color: #999; }
      .theme--dark #eventiq-sidebar .eiq-desc,
      .theme--dark #eventiq-sidebar .eiq-leader-bg,
      .theme--dark #eventiq-sidebar .eiq-leader-personal { color: #b0b0b0; }
      .theme--dark #eventiq-sidebar .eiq-ice-primary {
        background: #2d3239;
        color: #ccc;
      }
      .theme--dark #eventiq-sidebar .eiq-ask {
        background: #2d2a22;
        color: #ccc;
      }
      .theme--dark #eventiq-sidebar .eiq-btn-open {
        background: #38434f;
        color: #e0e0e0;
      }
    `;
    document.head.appendChild(style);
  }

  attachToPage(container) {
    // Try to place next to the profile section, fall back to body
    const main = document.querySelector('main');
    if (main) {
      main.style.position = main.style.position || 'relative';
    }
    document.body.appendChild(container);
  }

  bindEvents(container, data) {
    // Close button
    container.querySelector('.eiq-close')?.addEventListener('click', () => {
      container.remove();
    });

    // Minimize button
    container.querySelector('.eiq-minimize')?.addEventListener('click', () => {
      this.isMinimized = !this.isMinimized;
      container.classList.toggle('eiq-minimized', this.isMinimized);
    });

    // Copy buttons
    container.querySelectorAll('.eiq-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(() => {
          btn.style.color = '#22c55e';
          setTimeout(() => { btn.style.color = ''; }, 1000);
        });
      });
    });

    // Log engagement button
    container.querySelector('.eiq-btn-log')?.addEventListener('click', async (e) => {
      const btn = e.target;
      const companyId = btn.getAttribute('data-company-id');
      const leaderName = btn.getAttribute('data-leader');
      btn.textContent = 'Logging...';
      btn.disabled = true;
      try {
        await this.client.logEngagement(companyId, leaderName, 'linkedin_view', 'Profile viewed via LinkAgent');
        btn.textContent = 'Logged!';
        btn.style.background = '#22c55e';
        setTimeout(() => {
          btn.textContent = 'Log Engagement';
          btn.style.background = '';
          btn.disabled = false;
        }, 2000);
      } catch (err) {
        btn.textContent = 'Error';
        btn.style.background = '#dc2626';
        setTimeout(() => {
          btn.textContent = 'Log Engagement';
          btn.style.background = '';
          btn.disabled = false;
        }, 2000);
      }
    });
  }

  // Helpers
  getPriorityBadge(priority) {
    if (priority === undefined || priority === null) return '';
    const labels = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3' };
    return `<span class="eiq-priority eiq-priority-${priority}">${labels[priority] || `P${priority}`}</span>`;
  }

  formatCategory(cat) {
    if (!cat) return '';
    return cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
  }

  truncate(str, max) {
    if (!str || str.length <= max) return str;
    return str.substring(0, max) + '...';
  }
};

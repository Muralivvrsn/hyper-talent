# LinkAgent + EventIQ Bridge — Roadmap

## Current State (v1.6.6 + EventIQ Bridge)
- Chrome Extension (Manifest V3) on linkedin.com
- Side panel React app: labels, notes, templates, sheets sync, shortcuts
- **NEW:** EventIQ bridge — sidebar overlay showing company intelligence on LinkedIn profiles
- **NEW:** EventIQ settings page in side panel

---

## Phase 1: EventIQ Bridge Polish (Current Sprint)

### LA-001: EventIQ Settings Page in Side Panel
- Priority: `P0`
- Status: `done`
- Settings page with API key input, connection test, enable/disable toggle
- Key stored in `chrome.storage.sync` (never hardcoded)

### LA-002: EventIQ Sidebar on LinkedIn Profile Pages
- Priority: `P0`
- Status: `done`
- Shows: company header + priority badge, leader info + hooks + personal, talking points, icebreakers, news, the ask, engagement logging button
- Dark theme support
- Minimize/close controls

### LA-003: EventIQ Sidebar on LinkedIn Messaging Pages
- Priority: `P0`
- Status: `done`
- When messaging a known EventIQ leader, shows the same sidebar
- Auto-detects message send button clicks for engagement logging

### LA-004: leader-match API Endpoint
- Priority: `P0`
- Status: `done`
- `GET /api/tools/leader-match?name=...&li=...`
- Single call returns full company + leader data
- LinkedIn URL exact match first, then fuzzy name match

---

## Phase 2: Engagement Intelligence (Next)

### LA-005: Auto-Log Profile Views
- Priority: `P1`
- Category: Engagement Tracking
- When a user views a LinkedIn profile that matches an EventIQ leader, auto-log as `linkedin_view` engagement
- Lightweight — no user interaction needed
- Shows view count in sidebar ("Viewed 3 times this week")

### LA-006: Connection Request Detection
- Priority: `P1`
- Category: Engagement Tracking
- Detect "Connect" button clicks on profile pages
- Log as `linkedin_connect` engagement
- Detect InMail sends similarly

### LA-007: Engagement History in Sidebar
- Priority: `P1`
- Category: UX
- Show recent engagement log entries in sidebar (last 5 interactions)
- Timestamp + action type + who performed it
- Requires new API: `GET /api/tools/engagement-history?companyId=X&contact=Y`

### LA-008: Quick Note from Sidebar
- Priority: `P1`
- Category: Productivity
- Add inline note input in sidebar that posts to EventIQ company notes
- Pre-filled with context: "LinkedIn profile view — [date]"
- Integrates with existing LinkAgent notes system

---

## Phase 3: Smart Outreach Assist

### LA-009: Template Injection with EventIQ Context
- Priority: `P1`
- Category: Outreach Quality
- When composing a LinkedIn message to an EventIQ leader, offer "smart templates"
- Templates auto-populated with hooks, icebreakers, and talking points from EventIQ
- Integrates with existing LinkAgent templates system (adds EventIQ as a template source)

### LA-010: Copy-Ready Message Generator
- Priority: `P2`
- Category: Productivity
- "Generate message" button in sidebar calls EventIQ brief API
- Returns a ready-to-paste LinkedIn message personalized with leader's hooks + company context
- Requires: `GET /api/tools/brief/<companyId>?format=linkedin_message&leaderName=X`

### LA-011: Sequence Step Awareness
- Priority: `P2`
- Category: Workflow
- If the EventIQ company has an active sequence, show current step in sidebar
- "Step 3 of 5: LinkedIn follow-up — due tomorrow"
- Links to EventIQ sequence panel

---

## Phase 4: Pre-Meeting Intelligence

### LA-012: Calendar-Aware Briefing Panel
- Priority: `P2`
- Category: Meeting Prep
- If Google Calendar integration is added: detect upcoming meetings with LinkedIn profiles
- Show pre-call briefing 30 min before
- Pulls from `/api/tools/brief/<id>?format=full`

### LA-013: Smart Chrome Notifications
- Priority: `P2`
- Category: Attention Management
- Notify when:
  - A P0/P1 leader posts on LinkedIn (via enrichment pipeline)
  - Meeting with EventIQ company in 30 minutes
  - Follow-up reminder due for a LinkedIn contact
- Opt-in via settings page

---

## Phase 5: Team Collaboration

### LA-014: Multi-User EventIQ Access
- Priority: `P2`
- Category: Team
- Replace X-Tool-Key with user JWT
- Each team member sees their own engagement log
- Shared view of all team engagements per company

### LA-015: Team Activity Feed in Sidebar
- Priority: `P2`
- Category: Collaboration
- "Your team" section in sidebar showing recent engagements by others
- "Kiket viewed this profile 2 days ago", "Satish sent InMail yesterday"
- Prevents duplicate outreach

---

## EventIQ Backend Improvements (Needed for Bridge)

These items from EventIQ's `improvements.md` directly impact the bridge experience:

| EventIQ IMP | Impact on Bridge |
|-------------|-----------------|
| IMP-017: Contact Waterfall | Show email/phone confidence in sidebar |
| IMP-019: Intent Scoring V2 | Show score + reasons in sidebar header |
| IMP-025: RICP Coverage | Highlight missing roles in sidebar |
| IMP-032: Signal Freshness | Show fresh signals with recency badges |
| IMP-041: Role-Specific Messaging | Feed generated messages into LA-010 |

---

## Technical Debt

### LA-T01: Error Boundary for Sidebar
- Sidebar injection should never crash the LinkedIn page
- Wrap all sidebar rendering in try/catch
- Log errors to console only, never show error UI to LinkedIn page

### LA-T02: Cache Invalidation Strategy
- Current 30-min TTL may be too long after data updates
- Add manual refresh button in sidebar header
- Listen for chrome.storage events for config changes

### LA-T03: Performance Profiling
- Measure sidebar injection time
- Ensure no visible layout shift on LinkedIn
- Lazy-load sidebar only after LinkedIn page is fully rendered

### LA-T04: Content Security Policy Compliance
- Verify sidebar CSS doesn't conflict with LinkedIn's CSP
- Use inline styles where needed (already done)
- Test on LinkedIn's production CSP headers

---

## Implementation Priority

1. **Now:** LA-001 through LA-004 (done) — core bridge working
2. **Next sprint:** LA-005, LA-006, LA-007 — engagement tracking
3. **Following sprint:** LA-008, LA-009 — productivity features
4. **Future:** LA-010 through LA-015 — advanced features

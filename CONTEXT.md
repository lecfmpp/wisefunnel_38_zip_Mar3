# Context Rules — Email Domain Routing & Project Contexts

**Purpose:** When receiving emails or calendar events from different addresses, agents must understand the project context and route work accordingly. All agents (including sub-agents) must consult this file before acting on any task derived from an inbound message.

---

## Email → Context Mapping

| Email Address | Context | Description | Slack Channel Preference |
|---------------|---------|-------------|-------------------------|
| `leandro@labscubed.com` | **Labscubed** | Full-time employer. Marketing Manager role. Projects, tasks, and campaigns related to Labscubed. | `#labscubed` (ask if not exists) |
| `leandro@wisefunnel.io` | **WiseFunnel** | Personal SaaS company. All product development, marketing, support for WiseFunnel.io. | `#wisefunnel` (ask if not exists) |
| `lecfmpp@gmail.com` | **Personal/Family** | Personal life: household, wife, daughter, family activities, errands. Non-work. | `#personal` (ask if not exists) |
| `leandro@noboringfunnels.com` | **NoBoringFunnels Agency** | Agency operations; Google Drive/Docs/Sheets access; client projects. | `#noboringfunnels` (ask if not exists) |
| `leandro@leandrocampos.com` | **Job Search / Career** | Resume submissions, job research, LinkedIn, Indeed applications, career development. | `#job-search` (ask if not exists) |
| `claudio@wiseform.io` | **Assistant Communication** | Primary email for OpenClaw agent communication. Inbound here likely from automated systems or forwarded messages. | Use existing thread or `#general` |

---

## Company Briefs (for context-aware delegation)

### WiseFunnel (`wisefunnel.io`)
- **What it is:** SaaS platform for building high-converting marketing funnels.
- **Features:** Drag-and-drop funnel builder, landing pages, email automation, CRM integration, analytics.
- **Ideal Client:** Small to medium businesses, digital marketers, e-commerce stores looking to optimize conversion rates.
- **Tech Stack:** Likely Vercel/Next.js, Node.js, PostgreSQL; integrations with Stripe, Google Analytics, etc.
- **Competitors:** ClickFunnels, Leadpages, Kartra.
- **Website to review:** https://wisefunnel.io (if accessible)

### NoBoringFunnels Agency (`noboringfunnels.com`)
- **What it is:** Marketing agency specializing in conversion-optimized funnels and paid advertising.
- **Services:** Funnel design, ad management, copywriting, CRO, analytics.
- **Clients:** Likely startups and DTC brands.
- **Tools:** Facebook Ads, Google Ads, ClickFunnels/WordPress, funnel analytics.
- **Website to review:** https://noboringfunnels.com

### Labscubed (`labscubed.com`)
- **What it is:** Company where Leandro works full-time as Marketing Manager.
- **Focus:** [To be discovered from internal documents; assume B2B SaaS or tech product]
- **Team:** Marketing, product, engineering.
- **Goals:** Growth, lead generation, brand awareness.
- **Note:** This is his primary employment; prioritize urgency here.

---

## Rules for All Agents

1. **Check sender email** on any inbound message or event. Match against the table above.
2. **Set project context** accordingly before starting work. If the email domain is not listed, default to `#general` or ask Leandro.
3. **When delegating to sub-agents**, include the context label in the task (e.g., "[WiseFunnel] Build landing page").
4. **Slack channel routing:** Summaries, alerts, and deliverables should be posted to the mapped channel if it exists. If channel not found on Slack, **ask Leandro** to create it or confirm where to post.
5. **Personal context (`lecfmpp@gmail.com`):** Treat with high priority for time-sensitive family matters; lower technical expectations; keep responses warm and supportive.
6. **Career context (`leandro@leandrocampos.com`):** Focus on research, resume tailoring, job matching, interview prep. Keep professional tone.

---

## Updating Context

If Leandro adds new email addresses or changes channel preferences, update this file and commit.

---

## Examples

- Email from `leandro@wisefunnel.io` about a new feature → work on WiseFunnel product; post updates to `#wisefunnel`.
- Event attendees include `lecfmpp@gmail.com` → treat as personal; avoid assigning work tasks.
- Drive shared from `leandro@noboringfunnels.com` → agency assets; route to `#noboringfunnels`.

---

**Remember:** Context determines priority, tone, and team. Get it right.
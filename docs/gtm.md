# Velo — Go-to-Market Plan

> **Note:** Velo is currently a personal tool built by and for Dominic. This GTM plan is intentionally lightweight — it covers how to validate the tool through personal use and lays groundwork in case Velo is eventually shared with other freelancers.

---

## 1. Market Context

### Landscape

The project management space is crowded at the enterprise level (Jira, Asana, Monday) and the consumer/team level (Trello, Notion, Linear). But a gap exists for **solo technical freelancers** who need PM + time tracking + billing in one tool without per-seat pricing or enterprise complexity.

**Existing tools fall into two camps:**
- **PM tools** (Jira, Linear, Trello) — good at task management, poor at time tracking and billing
- **Time tracking tools** (Toggl, Clockify, Harvest) — good at timers, poor at project management

Nobody does both well for a solo user.

### Opportunity

The freelancer market is large and growing. Technical freelancers (developers, designers, DevOps engineers) are underserved by tools that assume you're part of a team. A tool that nails the solo workflow — tasks, time, billing — has a natural audience.

### Why Now

- Freelancing is growing, especially in tech
- Existing tools keep adding enterprise features, making them heavier
- Convex and modern tooling make it possible for one developer to build a competitive app
- "Build your own tools" is a growing movement in the developer community

---

## 2. Launch Strategy

Since Velo is a personal tool, "launch" means **daily personal use.** If it proves valuable, the path to sharing is clear.

### Phase 1: Dog-fooding (Weeks 1–4)
- Use Velo exclusively for all project management and time tracking
- Track all client work and personal projects (including Aura)
- Note friction points, missing features, and bugs in a dedicated "Velo Feedback" project within Velo itself
- Generate first real billing summary from actual tracked hours

### Phase 2: Validation (Weeks 5–8)
- Compare month-end billing time: old method vs. Velo
- Measure: do I actually track time consistently? Or do I skip it?
- Decide: is this solving a real problem, or is it a solution looking for one?

### Phase 3: Share Decision (Week 8+)
- If Velo meaningfully improves the workflow, consider sharing:
  - Open source the repo on GitHub
  - Write a blog post or Twitter thread about building it
  - Share in freelancer communities (Reddit, Discord, Hacker News)
- If it doesn't — learn from the experience and either iterate or archive

---

## 3. Pre-Launch Playbook (Personal Use)

| Week | Action |
|------|--------|
| Week 1 | Complete Phase 0–1 (foundation + project management). Create all active projects in Velo. |
| Week 2 | Complete Phase 2 (Kanban board). Move all task management to Velo. Stop using notes/gut feeling. |
| Week 3 | Complete Phase 3 (time tracking). Start tracking time for every client task. |
| Week 4 | Complete Phase 4 (billing + dashboard). Generate first billing summary. Compare with previous method. |
| Week 5–6 | Complete Phase 5 (polish). Use Velo daily. Collect feedback in a Velo project. |
| Week 7–8 | Full validation: Is billing faster? Is time tracking consistent? Am I actually using it every day? |

---

## 4. If You Decide to Share (Future)

### Channels (ranked by expected ROI for a developer audience)

1. **Hacker News / Show HN** — Technical audience, appreciates "I built this for myself." High visibility if it resonates.
2. **Twitter/X developer community** — Build-in-public thread: why you built it, what you learned, demo GIF. Tag #buildinpublic.
3. **Reddit (r/freelance, r/webdev, r/SideProject)** — "I was tired of Jira for my freelance work, so I built my own PM tool." Genuine stories do well.
4. **Dev.to / Hashnode blog post** — Technical deep-dive on the stack (Next.js + Convex), lessons learned. Drives SEO traffic.
5. **Indie Hackers** — Community of builders. Post in the "Show IH" section.

### Messaging

**For developers:** "I built a Jira alternative in my spare time because I was tired of paying $10/month to manage 3 projects. It tracks my time and generates billing summaries. Here's the code."

**For freelancers:** "I kept forgetting to track my time and undercharging clients. So I built a tool that tracks time automatically as I move tasks across my board. Month-end billing went from 1 hour to 2 minutes."

---

## 5. Key Metrics (Personal Use)

| Metric | Target | Week 4 Check |
|--------|--------|--------------|
| Daily usage | Open Velo every working day | ≥ 80% of working days |
| Time tracking | Track time on every client task | ≥ 90% of tasks have time entries |
| Billing efficiency | Month-end billing under 5 min | Measure actual time |
| Tool consolidation | Stop using other tools for PM | No more notes/spreadsheets |
| Satisfaction | Would I recommend this to a friend? | Gut check: yes/no |

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Build it but don't use it | High — wasted effort | Commit to 30 days of exclusive use before evaluating |
| Over-engineer before validating | Medium — time wasted on unused features | Strict MVP scope. No features beyond the roadmap until Phase 5 is complete and validated. |
| Existing tool becomes good enough | Low — unlikely for solo users | Keep monitoring Linear and ClickUp, but don't let comparison paralysis stop progress |
| Motivation drops mid-build | Medium — project abandoned | Keep phases small and celebrate each one. Use Velo to track building Velo. |

---

## 7. Budget

| Item | Cost | Notes |
|------|------|-------|
| Hosting (Vercel) | $0 | Free tier |
| Backend (Convex) | $0 | Free tier |
| Domain (optional) | ~$12/year | velo.app or similar, only if sharing publicly |
| Design tools | $0 | Tailwind + Lucide (open source) |
| **Total** | **$0** | Until/unless sharing publicly |

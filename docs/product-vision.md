# Velo — Product Vision

## 1. Vision & Mission

### Vision Statement
Every freelancer deserves a tool that works as hard as they do — one that tracks projects, time, and billing without getting in the way.

### Mission Statement
Velo gives technical freelancers a single, fast, focused place to manage their client work — from task to timesheet to invoice — so they can spend less time on admin and more time on the work that matters.

### Founder's Why
Dominic is a DevOps freelancer who works across multiple client projects and personal side projects. Like many freelancers, he has no integrated tool for project management and time tracking. He relies on notes and gut feeling, which means hours go untracked and billing is a monthly headache. Velo exists because the tools that do exist — Jira, ClickUp, Asana — are built for enterprises, not for a single freelancer who just wants to get things done and get paid fairly.

### Core Values

- **Speed over features.** Every interaction should feel instant. If adding a feature makes the app slower, the feature doesn't ship.
- **Opinionated simplicity.** Fewer options, better defaults. Velo makes decisions so the user doesn't have to.
- **Time is money — literally.** Time tracking isn't a secondary feature. It's woven into the core workflow because that's how freelancers get paid.
- **Build for one, design for many.** Velo is built for Dominic first. If it solves his problems well, it'll solve them for other freelancers too.

---

## 2. User Research

### Primary Persona: "The Technical Freelancer"

**Name:** Alex
**Role:** Freelance full-stack developer / DevOps engineer
**Age:** 28–40
**Context:** Works with 2–4 clients simultaneously. Juggles project work, meetings, and personal side projects. Bills clients monthly based on tracked hours.

**Goals:**
- Know exactly how many hours were spent on each client this month
- Keep tasks organized without spending 30 minutes a day managing a tool
- Move fast between contexts (Client A → Client B → Personal project)

**Frustrations:**
- Jira is overkill — too many settings, too slow, too expensive for one person
- Toggl/Clockify track time but don't connect to project management
- At month-end, manually piecing together timesheets from memory and git logs

**Tech comfort:** High. Prefers keyboard shortcuts, dark mode, fast UIs. Will self-host if it means better control.

### Secondary Persona: "The Small Agency Lead"

**Name:** Maria
**Role:** Runs a 3-person design/dev agency
**Context:** Needs shared visibility across team members' tasks and billable hours. Currently uses a spreadsheet + Notion combo.

**Goals:**
- See what everyone's working on at a glance
- Generate client reports without manual data entry

*Note: Maria is a future persona. Velo's MVP is built for Alex (solo freelancer). Multi-user features come later.*

### Jobs to Be Done

1. **When** I start working on a client task, **I want to** start a timer with one click, **so that** my hours are automatically captured.
2. **When** I need to see what's on my plate, **I want to** open a Kanban board filtered by project, **so that** I can prioritize my day in seconds.
3. **When** it's the end of the month, **I want to** generate a billing summary per client, **so that** I can invoice accurately without manual calculation.
4. **When** I switch between client projects, **I want to** quickly change context, **so that** time is tracked against the correct project.
5. **When** I work on a personal project like Aura, **I want to** use the same tool without billing overhead, **so that** all my work lives in one place.

### Pain Points (Ranked)

1. **No single tool combines PM + time tracking + billing** — forces tool-hopping
2. **Existing PM tools are enterprise-first** — complex setup, per-seat pricing, features nobody asked for
3. **Time tracking is an afterthought** — separate apps, manual entries, forgotten hours
4. **Month-end billing is manual** — exporting, cross-referencing, calculating in spreadsheets
5. **Context switching between tools wastes time** — every extra click is friction

### Current Alternatives & Why They Fall Short

| Tool | Strength | Why it fails for freelancers |
|------|----------|------------------------------|
| Jira | Comprehensive PM | Too complex, too expensive, time tracking is a plugin |
| Linear | Fast, beautiful | No built-in time tracking, no billing |
| Trello | Simple Kanban | Too simple for real PM, no time tracking |
| Toggl | Great time tracking | No project management, just a timer |
| Notion | Flexible | Jack of all trades, master of none. No real time tracking |
| ClickUp | Everything tool | Slow, bloated, overwhelming UI |

### Key Assumptions to Validate

1. A solo freelancer will actually use a time tracker if it's seamlessly integrated into the task workflow
2. A Kanban board + time tracking is sufficient for freelancer PM (no Gantt charts, no sprint planning needed)
3. Monthly billing summaries are the most important reporting feature
4. Freelancers prefer a clean, focused tool over a customizable one

### User Journey Map

```
Discovery → First Project → Daily Use → Month-End → Retention
    │              │              │            │           │
    ▼              ▼              ▼            ▼           ▼
 Finds Velo    Creates first   Moves tasks   Generates   "I can't go
 (or builds    project, adds   on Kanban,    billing     back to my
  it himself)  first tasks     starts/stops  summary     old way"
                               timers        per client
                    │                              │
                    ▼                              ▼
              ✨ Magic Moment 1:           ✨ Magic Moment 2:
              Timer runs as task           Clean billing overview
              moves across board           with one click
```

---

## 3. Product Strategy

### Product Principles

1. **One tool, not three.** PM + time tracking + billing in a single app. No integrations needed.
2. **Fast by default.** Page loads under 200ms. Interactions feel instant. No loading spinners for basic operations.
3. **Convention over configuration.** Sensible defaults for task types, board columns, and workflows. Customization is possible but not required.
4. **Timer-first workflow.** Starting a timer is as easy as clicking play. Stopping it is automatic when the task moves to "Done."
5. **Billing is a first-class feature.** Not a report buried in settings — it's a top-level view that answers "how much do I bill this client?"

### Market Differentiation

Velo sits in the intersection that no existing tool occupies well:

- **Simpler than Jira** — no admin panels, no workflow engines, no 200-field issue types
- **More structured than Notion** — real task types, real statuses, real time tracking
- **More integrated than Toggl + Trello** — one tool instead of two, data flows naturally
- **Faster than ClickUp** — because it does less, it does it faster

### Magic Moment Design

**Magic Moment 1: The Flow**
User creates a task, drags it from "To Do" to "In Progress" on the Kanban board. A timer starts automatically. They work. When they drag the task to "Done," the timer stops. They never clicked a separate "Start Timer" button — it just worked.

**Magic Moment 2: The Payoff**
End of month. User opens the Billing view, selects a client and date range. Velo shows a clean breakdown: total hours, hours per epic, hours per task type. One click to export. The user thinks: "That would have taken me an hour in a spreadsheet."

### MVP Definition

**In Scope (MVP):**
- User authentication (Convex Auth)
- Create/edit/delete projects with client assignment
- Create/edit/delete epics within projects
- Create/edit/delete tasks with types: Story, Task, Bug, Incident
- Optional epic assignment for tasks
- Kanban board view with drag & drop (columns: To Do, In Progress, In Review, Done)
- Integrated time tracker per task (start/stop/manual entry)
- Billing summary view: hours per project, per epic, per task type, filterable by date range
- Basic export (CSV) for billing data

**Explicitly Out of Scope (MVP):**
- Multi-user / team features
- Sprint planning / velocity tracking
- Gantt charts or timeline views
- Notifications / email alerts
- Mobile app / PWA
- Integrations (GitHub, Slack, etc.)
- Custom workflows / status configurations
- Recurring tasks
- File attachments
- Comments on tasks
- Dark mode (nice-to-have, post-MVP)
- API access

### Feature Priority (MoSCoW)

**Must Have:**
- Project CRUD with client name
- Epic CRUD within projects
- Task CRUD with types (Story, Task, Bug, Incident)
- Kanban board with drag & drop
- Time tracker (start/stop per task)
- Billing summary view with date range filter

**Should Have:**
- Manual time entry (for retroactive logging)
- CSV export for billing data
- Task detail view with description, time log history
- Dashboard / overview page

**Could Have:**
- Task filtering and search
- Keyboard shortcuts
- Board column customization
- Time tracking reminders
- Dark mode

**Won't Have (MVP):**
- Multi-user support
- Sprint management
- Integrations
- Mobile app
- Custom task types beyond the four defaults

### Core User Flows

**Flow 1: Create a Project**
Dashboard → "New Project" → Enter name, client name → Project created → Redirect to empty Kanban board

**Flow 2: Add Tasks and Work**
Project Kanban → "New Task" → Select type, title, (optional) epic → Task appears in "To Do" → Drag to "In Progress" → Timer starts → Work → Drag to "Done" → Timer stops

**Flow 3: Track Time Manually**
Task detail → "Add Time" → Enter hours, date, note → Time entry saved → Reflected in billing

**Flow 4: Generate Billing Summary**
Navigation → "Billing" → Select client/project → Select date range → View summary (total hours, breakdown by epic/task type) → Export CSV

### Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Daily active use | Dominic uses Velo every working day | Login frequency |
| Time tracking adoption | 90%+ of tasks have tracked time | Tasks with time entries / total tasks |
| Billing accuracy | Month-end billing takes < 5 minutes | Self-reported |
| Task throughput | All client tasks managed in Velo, not elsewhere | Self-reported |
| Page load time | < 200ms for all primary views | Performance monitoring |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Convex limitations discovered mid-build | High — may require backend migration | Prototype core data model early, validate reactive queries work for Kanban |
| Scope creep — "just one more feature" | Medium — delays MVP | Strict MoSCoW adherence, build MVP first |
| Time tracking friction too high | High — feature goes unused | Make timer automatic with board transitions, minimize clicks |
| Solo project loses momentum | Medium — abandoned | Keep phases small, celebrate shipped increments |

---

## 4. Brand Strategy

### Positioning Statement

For technical freelancers who need to track their client work and billable hours, **Velo** is a project management tool that combines Kanban boards, time tracking, and billing in one fast, focused app. Unlike Jira or ClickUp, Velo is built for individuals — not enterprises — with zero bloat and zero per-seat pricing.

### Brand Personality

Velo is the colleague who keeps their desk clean, responds quickly, and never overcomplicates things. It's professional but approachable, technical but not intimidating, fast but not rushed.

**Brand traits:**
- **Fast** — in performance and in getting things done
- **Focused** — does three things well instead of thirty things poorly
- **Honest** — no dark patterns, no upgrade nags, no hidden complexity
- **Competent** — feels like it was built by someone who understands the problem

### Voice & Tone Guide

| Context | Tone | Example |
|---------|------|---------|
| Empty states | Encouraging, direct | "No tasks yet. Create one to get started." |
| Success | Brief, confirmatory | "Task created." / "Timer stopped. 2h 15m logged." |
| Errors | Helpful, specific | "Couldn't save — check your connection and try again." |
| Onboarding | Warm, efficient | "Welcome to Velo. Let's set up your first project." |

**DO:**
- Use short, clear sentences
- Be specific ("2h 15m logged" not "Time saved successfully!")
- Use the user's language (tasks, bugs, hours — not "items," "entities," "units")
- Get out of the way — the UI should speak for itself

**DON'T:**
- Use exclamation marks excessively
- Be overly casual or use slang ("Awesome sauce! You crushed it!")
- Use enterprise jargon ("workflow orchestration," "resource allocation")
- Explain things the user already knows

### Messaging Framework

**Tagline:** "Track work. Track time. Get paid."

**Elevator Pitches:**

- **5 seconds:** "Velo is project management with built-in time tracking for freelancers."
- **30 seconds:** "Velo combines Kanban boards, time tracking, and billing summaries in one fast web app. It's built for freelancers who want to manage their client work and bill accurately — without the complexity of Jira or the cost of enterprise tools."
- **2 minutes:** "As a freelancer, you're juggling multiple clients, tracking tasks in your head, and piecing together timesheets at month-end. Velo fixes that. You create projects for each client, organize work with epics and tasks on a Kanban board, and time tracking is built right in — start a timer when you begin work, stop it when you're done. At the end of the month, Velo gives you a clean breakdown of hours per client, per project, per task type. Export it, send your invoice, get paid. No spreadsheets, no guessing, no switching between three different apps."

### Brand Anti-Patterns

- Never use "AI-powered" or "smart" — Velo is a straightforward tool, not a buzzword machine
- Never use gamification language ("streak," "achievement," "level up")
- Never compare to enterprise tools positively ("enterprise-grade") — Velo is deliberately not enterprise
- Never use dark patterns to drive engagement (no notification badges, no "you haven't logged in" emails)

---

## 5. Design Direction

### Design Philosophy

Velo's design follows three rules: show only what matters, make interactions feel instant, and let content breathe. Every pixel of UI should earn its place — if it's not helping the user manage tasks, track time, or see their billing, it shouldn't be there.

### Visual Mood

Clean, bright, professional. Inspired by Notion's whitespace and Linear's crispness, but warmer. The app should feel like a well-organized desk — everything in its place, nothing cluttered, pleasant to sit at all day.

### Color Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Indigo | `#4F46E5` | Buttons, active states, links |
| Primary Hover | Indigo Dark | `#4338CA` | Button hover, active links |
| Background | White | `#FFFFFF` | Main background |
| Surface | Gray 50 | `#F9FAFB` | Cards, side panels, secondary backgrounds |
| Border | Gray 200 | `#E5E7EB` | Dividers, card borders, input borders |
| Text Primary | Gray 900 | `#111827` | Headings, body text |
| Text Secondary | Gray 500 | `#6B7280` | Labels, metadata, timestamps |
| Success | Emerald | `#10B981` | Timer running, completed states |
| Warning | Amber | `#F59E0B` | Overdue tasks, attention needed |
| Error | Red | `#EF4444` | Errors, destructive actions |
| Bug | Red Light | `#FEE2E2` | Bug task type badge background |
| Story | Blue Light | `#DBEAFE` | Story task type badge background |
| Task | Gray Light | `#F3F4F6` | Task type badge background |
| Incident | Orange Light | `#FFEDD5` | Incident task type badge background |

### Typography

| Role | Typeface | Weight | Size | Line Height |
|------|----------|--------|------|-------------|
| Headings | Inter | 600 (Semibold) | 24px / 20px / 16px (h1/h2/h3) | 1.3 |
| Body | Inter | 400 (Regular) | 14px | 1.5 |
| Labels | Inter | 500 (Medium) | 12px | 1.4 |
| Monospace (time) | JetBrains Mono | 500 (Medium) | 14px | 1.4 |

Inter is free, widely available, and optimized for UI. JetBrains Mono for time displays adds a professional, technical feel that resonates with the developer audience.

### Spacing & Layout System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight spacing (between icon and label) |
| `--space-2` | 8px | Related elements (badge padding, input padding) |
| `--space-3` | 12px | Group spacing (between form fields) |
| `--space-4` | 16px | Section padding (card padding) |
| `--space-6` | 24px | Between sections |
| `--space-8` | 32px | Major section breaks |
| `--space-12` | 48px | Page padding |

**Layout:**
- Sidebar navigation: 240px fixed width
- Main content: fluid, max-width 1280px
- Kanban columns: equal width, minimum 280px
- Cards: full column width with 12px padding

### Component Philosophy

Components should be small, composable, and consistent. Every interactive element should have four states: default, hover, active/focused, and disabled. No custom components where a standard HTML element works.

**Key components:**
- **TaskCard** — the core unit. Shows title, type badge, epic tag, timer status. Compact enough for a Kanban column, informative enough to scan.
- **TimerControl** — play/pause/stop. Always visible on active tasks. Shows elapsed time in monospace font.
- **ProjectSwitcher** — top-level navigation between projects. Fast, keyboard-navigable.
- **BillingSummary** — table/card layout showing hours per grouping. Clean enough to screenshot and send to a client.

### Iconography

Use **Lucide Icons** — open source, consistent style, good coverage. 20px default size, 1.5px stroke width. Icons should supplement text, not replace it — always pair an icon with a label in navigation.

### Accessibility Commitments

- WCAG 2.1 AA compliance as a baseline
- All interactive elements keyboard-accessible
- Color contrast ratio minimum 4.5:1 for text, 3:1 for large text
- Focus indicators visible and clear (2px indigo outline)
- Timer state communicated through text, not just color (e.g., "Running" label + green dot)
- Screen reader support for Kanban drag & drop (aria-live regions for board state changes)

### Motion & Interaction Principles

- **Drag & drop** on Kanban: smooth, 200ms transition, subtle shadow elevation on dragged card
- **Timer start/stop:** immediate visual feedback, no animation delay
- **Page transitions:** none — instant swap, no fade/slide
- **Hover states:** 100ms transition for color changes
- **Toasts/notifications:** slide in from top-right, auto-dismiss after 3 seconds

Rule: Never use animation to make something look like it's working. If it's fast, show it instantly. Animation is only for spatial orientation (where did this card go?) and state changes (is this timer running?).

### Design Tokens (CSS Variables & Tailwind)

```css
:root {
  /* Colors */
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-bg: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-border: #E5E7EB;
  --color-text: #111827;
  --color-text-secondary: #6B7280;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Layout */
  --sidebar-width: 240px;
  --content-max-width: 1280px;
  --kanban-column-min-width: 280px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-drag: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

```js
// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', hover: '#4338CA' },
        surface: '#F9FAFB',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        'badge-bug': '#FEE2E2',
        'badge-story': '#DBEAFE',
        'badge-task': '#F3F4F6',
        'badge-incident': '#FFEDD5',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      spacing: {
        'sidebar': '240px',
      },
      maxWidth: {
        'content': '1280px',
      },
      minWidth: {
        'kanban-col': '280px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
        drag: '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
    },
  },
};
```

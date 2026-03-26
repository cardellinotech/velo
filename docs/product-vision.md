# Velo — Product Vision

## 1. Vision & Mission

### Vision Statement
Every freelancer deserves a tool that works as hard as they do — one that tracks projects, time, and billing without getting in the way.

### Mission Statement
Velo gives technical freelancers a single, fast, focused place to manage their client work — from task to timesheet to invoice to payment — so they can spend less time on admin and more time on the work that matters.

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
3. **When** it's the end of the month, **I want to** generate a billing summary and professional invoice per client, **so that** I can bill accurately and get paid without manual calculation or a separate invoicing tool.
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
Discovery → First Project → Daily Use → Month-End → Invoice → Retention
    │              │              │            │          │          │
    ▼              ▼              ▼            ▼          ▼          ▼
 Finds Velo    Creates first   Moves tasks   Generates  Creates    "I can't go
 (or builds    project, adds   on Kanban,    billing    invoice,   back to my
  it himself)  first tasks     starts/stops  summary    exports    old way"
                               timers        per client PDF, sends
                    │                              │          │
                    ▼                              ▼          ▼
              ✨ Magic Moment 1:           ✨ Magic Moment 2:
              Timer runs as task           Billing → Invoice → PDF
              moves across board           in under 2 minutes
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
End of month. User opens the Billing view, selects a client and date range. Velo shows a clean breakdown: total hours, hours per epic, hours per task type. One click to generate a professional invoice — complete with line items, tax, payment details. Export as PDF, send to client. The user thinks: "That would have taken me an hour in a spreadsheet plus another tool for invoicing."

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
- Multi-currency support (EUR, USD, CHF, GBP) with global default and per-project override
- Invoice generation from tracked hours with PDF export
- Business settings (company details, VAT, bank info, invoice numbering)
- Invoice lifecycle management (draft → sent → paid → overdue)

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
- Multi-currency support (EUR, USD, CHF, GBP)
- Invoice generation with PDF export
- Business settings for invoice details

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

**Flow 5: Create and Send Invoice**
Billing view → "Create Invoice" → Select project → Review pre-populated line items → Adjust if needed → Create → Review invoice detail → "Export PDF" → Send to client → "Mark as Sent" → Later: "Mark as Paid"

**Flow 6: Set Up Business Details**
Navigation → "Settings" → Fill in business name, address, VAT ID → Set default currency → Add bank details → Set tax rate → Configure invoice prefix → Save

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

Velo's design follows four rules: show only what matters, make interactions feel instant, let content breathe, and **reward the eye.** Every pixel of UI should earn its place — but "earning its place" includes making the user feel good about opening the tool every day. A premium feel isn't vanity; it's retention.

### Visual Mood

**Premium, polished, warm.** Inspired by Linear's spatial clarity, Raycast's depth and focus, and Arc Browser's playful confidence. The app should feel like a precision instrument — everything in its place, visually layered, satisfying to interact with.

**Key visual principles:**
- **Depth through layering:** Use subtle backdrop-blur, layered shadows, and slight transparency to create visual hierarchy. Sidebar and header feel like they sit on top of the content.
- **Gradient accents:** Subtle gradients (not flat colors) for primary buttons, active states, and the sidebar. Indigo-to-violet gives Velo a distinctive identity.
- **Warm neutrals:** Replace pure grays with warm-tinted neutrals (slate family) for a more inviting feel.
- **Microinteractions everywhere:** Hover states, focus rings, transitions that feel responsive and alive. Nothing should feel static.
- **Generous whitespace with intentional density:** Kanban cards are compact but breathing. Billing tables are scannable. Dashboard feels spacious.

### Color Palette

**Core palette — warm slate base with vibrant indigo-violet accents:**

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary | Indigo | `#4F46E5` | Buttons, active states, links |
| Primary Hover | Indigo Dark | `#4338CA` | Button hover, active links |
| Primary Gradient Start | Indigo | `#4F46E5` | Gradient buttons and accents |
| Primary Gradient End | Violet | `#7C3AED` | Gradient buttons and accents |
| Background | White | `#FFFFFF` | Main content background |
| Surface | Slate 50 | `#F8FAFC` | Cards, side panels, secondary backgrounds |
| Surface Elevated | White | `#FFFFFF` | Elevated cards with shadow |
| Sidebar BG | Slate 900 | `#0F172A` | Sidebar background (dark) |
| Sidebar Text | Slate 300 | `#CBD5E1` | Sidebar text (light on dark) |
| Sidebar Active | Indigo 500/20% | `rgba(99, 102, 241, 0.2)` | Sidebar active nav item background |
| Border | Slate 200 | `#E2E8F0` | Dividers, card borders |
| Border Subtle | Slate 100 | `#F1F5F9` | Subtle inner borders |
| Text Primary | Slate 900 | `#0F172A` | Headings, body text |
| Text Secondary | Slate 500 | `#64748B` | Labels, metadata, timestamps |
| Text Muted | Slate 400 | `#94A3B8` | Placeholder text, disabled |
| Success | Emerald 500 | `#10B981` | Timer running, completed states |
| Success BG | Emerald 50 | `#ECFDF5` | Success backgrounds |
| Warning | Amber 500 | `#F59E0B` | Overdue tasks, attention needed |
| Warning BG | Amber 50 | `#FFFBEB` | Warning backgrounds |
| Error | Red 500 | `#EF4444` | Errors, destructive actions |
| Error BG | Red 50 | `#FEF2F2` | Error backgrounds |
| Bug Badge | Red | `#FEE2E2` bg / `#991B1B` text | Bug task type |
| Story Badge | Blue | `#DBEAFE` bg / `#1E40AF` text | Story task type |
| Task Badge | Slate | `#F1F5F9` bg / `#334155` text | Task type |
| Incident Badge | Orange | `#FFEDD5` bg / `#9A3412` text | Incident task type |

**Sidebar gradient overlay (optional, for premium feel):**
```css
background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
```

**Primary button gradient:**
```css
background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
```

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

Components should be small, composable, and feel alive. Every interactive element should have four states: default, hover, active/focused, and disabled — each with a deliberate visual transition. The difference between "functional" and "polished" is in these transitions.

**Key components:**
- **TaskCard** — the core unit. Subtle shadow elevation, smooth hover lift (`translateY(-1px)`), type badge with soft color fills, timer indicator that pulses gently. Compact enough for a Kanban column, satisfying to drag.
- **TimerControl** — play/stop with gradient accent when active. Shows elapsed time in monospace font with a subtle glow when running.
- **Sidebar** — Dark (slate-900) with frosted glass effect. Active nav items have indigo glow. Project list with subtle hover reveals.
- **StatCards** — Elevated white cards with colored accent borders (left border or top gradient stripe). Numbers in large weight for scannability.
- **BillingSummary** — Clean table with expandable rows, subtle row striping, and a prominent total row. Hourly rates show calculated amounts inline.

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

- **Drag & drop** on Kanban: smooth 200ms transition, shadow elevation + subtle scale on dragged card, column highlights when hovered as drop target
- **Timer start/stop:** immediate visual feedback + brief color pulse on the timer badge
- **Card hover:** subtle `translateY(-1px)` lift with shadow increase over 150ms
- **Button hover:** smooth 150ms background transition, gradient shift on primary buttons
- **Sidebar nav hover:** soft indigo/white glow behind the active item
- **Page transitions:** instant content swap, no blocking animations
- **Toasts/notifications:** slide in from top-right with spring-like easing, auto-dismiss after 3 seconds
- **Modal/dialog open:** backdrop fade-in (150ms) + content scale-up from 95% to 100% (200ms, ease-out)
- **Focus rings:** 2px indigo ring with 2px offset, smooth 100ms transition

Rule: Animation exists to provide spatial context and make the app feel responsive — never to delay the user. Every animation should be under 250ms. If you can't tell what happened without the animation, the animation is essential. If you can, it's polish — and polish matters.

### Design Tokens (CSS Variables & Tailwind)

```css
:root {
  /* Colors — warm slate palette */
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-primary-light: #EEF2FF;
  --color-violet: #7C3AED;
  --color-bg: #FFFFFF;
  --color-surface: #F8FAFC;
  --color-surface-elevated: #FFFFFF;
  --color-border: #E2E8F0;
  --color-border-subtle: #F1F5F9;
  --color-text: #0F172A;
  --color-text-secondary: #64748B;
  --color-text-muted: #94A3B8;
  --color-success: #10B981;
  --color-success-bg: #ECFDF5;
  --color-warning: #F59E0B;
  --color-warning-bg: #FFFBEB;
  --color-error: #EF4444;
  --color-error-bg: #FEF2F2;

  /* Sidebar (dark) */
  --color-sidebar-bg: #0F172A;
  --color-sidebar-bg-end: #1E293B;
  --color-sidebar-text: #CBD5E1;
  --color-sidebar-text-active: #FFFFFF;
  --color-sidebar-active-bg: rgba(99, 102, 241, 0.2);
  --color-sidebar-hover-bg: rgba(255, 255, 255, 0.05);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  --gradient-sidebar: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);

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
  --sidebar-width: 260px;
  --content-max-width: 1280px;
  --kanban-column-min-width: 280px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* Shadows — layered for depth */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-elevated: 0 8px 30px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  --shadow-drag: 0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-modal: 0 24px 64px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08);

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-normal: 150ms ease;
  --transition-smooth: 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

```js
// tailwind.config.ts extension
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#4F46E5', hover: '#4338CA', light: '#EEF2FF' },
        violet: '#7C3AED',
        surface: { DEFAULT: '#F8FAFC', elevated: '#FFFFFF' },
        sidebar: {
          DEFAULT: '#0F172A',
          end: '#1E293B',
          text: '#CBD5E1',
          'text-active': '#FFFFFF',
          'active-bg': 'rgba(99, 102, 241, 0.2)',
          'hover-bg': 'rgba(255, 255, 255, 0.05)',
        },
        border: { DEFAULT: '#E2E8F0', subtle: '#F1F5F9' },
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'text-muted': '#94A3B8',
        success: { DEFAULT: '#10B981', bg: '#ECFDF5' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB' },
        error: { DEFAULT: '#EF4444', bg: '#FEF2F2' },
        'badge-bug': '#FEE2E2',
        'badge-story': '#DBEAFE',
        'badge-task': '#F1F5F9',
        'badge-incident': '#FFEDD5',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      spacing: {
        'sidebar': '260px',
      },
      maxWidth: {
        'content': '1280px',
      },
      minWidth: {
        'kanban-col': '280px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        elevated: '0 8px 30px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
        drag: '0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
        modal: '0 24px 64px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.08)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'slide-in': 'slide-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
};
```

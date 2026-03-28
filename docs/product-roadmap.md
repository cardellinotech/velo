# Velo — Product Roadmap

## Build Philosophy

1. **Ship working increments.** Every phase ends with a demoable product. No phase leaves the app in a broken state.
2. **Foundation first.** Get the boring stuff right (auth, data model, layout) before building features.
3. **Core loop early.** The Kanban board + timer combo is the heart of Velo — get it working as soon as possible.
4. **Iterate, don't polish.** Get features functional, then refine. Pixel-perfect comes in the final phase.
5. **Test with real data.** Use actual projects (client work, Aura) to validate the tool works for real workflows.

---

## Phase 0: Foundation & Setup

**Goal:** Set up the project, configure the tech stack, establish the design system, and implement authentication. At the end of this phase, you have a running Next.js app with Convex backend, auth, and the app shell (sidebar, layout).

**Reference sections:** PRD §2 (Technical Architecture), PRD §9 (Design System), PRD §10 (Auth Implementation), Vision §5 (Design Direction)

**Agent prompt:** "Set up a new Next.js project with Convex as the backend. Install all dependencies, configure Tailwind CSS with the Velo design tokens, set up Convex Auth with email/password authentication, and create the app shell with sidebar navigation and a responsive layout. The sidebar should show navigation links for Dashboard, Projects, and Billing. Use Inter and JetBrains Mono fonts. Create a login page and protect all routes behind authentication."

- [x] **TASK-001** — Initialize Next.js project with TypeScript
  Files: `package.json`, `tsconfig.json`, `next.config.ts`
  Notes: Use `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router, and src/ directory.

- [x] **TASK-002** — Install and configure Convex
  Files: `convex/`, `convex.json`, `.env.local`
  Notes: Run `npx convex dev` to initialize. Set up environment variables for Convex deployment URL.

- [x] **TASK-003** — Configure Tailwind with Velo design tokens
  Files: `tailwind.config.ts`, `src/app/globals.css`
  Notes: Extend Tailwind theme with colors (primary #4F46E5, surface #F9FAFB, etc.), fonts (Inter, JetBrains Mono), spacing, shadows, and border radius from PRD §9 and Vision §5.

- [x] **TASK-004** — Set up fonts (Inter + JetBrains Mono)
  Files: `src/app/layout.tsx`
  Notes: Use `next/font/google` to load Inter (400, 500, 600) and JetBrains Mono (500). Apply Inter as default, JetBrains Mono available via `font-mono` class.

- [x] **TASK-005** — Implement Convex Auth with email/password
  Files: `convex/auth.ts`, `convex/schema.ts`
  Notes: Install `@convex-dev/auth`. Configure Password provider. Set up auth tables in schema. Follow Convex Auth documentation for setup.

- [x] **TASK-006** — Create login page
  Files: `src/app/login/page.tsx`
  Notes: Centered card layout. Email input, password input, sign in button, sign up toggle. Handle loading and error states. Redirect to `/` on success.

- [x] **TASK-007** — Create auth middleware and protected layout
  Files: `src/app/layout.tsx`, `src/components/layout/ConvexClientProvider.tsx`
  Notes: Set up ConvexProviderWithAuth. Redirect unauthenticated users to `/login`. Show loading state while checking auth.

- [x] **TASK-008** — Create app shell with sidebar navigation
  Files: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/app/(dashboard)/layout.tsx`
  Notes: Sidebar (240px fixed) with navigation: Dashboard, Projects, Billing. Use Lucide icons. Active state styling. Header with user info and logout button. Use route groups for authenticated layout.

- [x] **TASK-009** — Create base UI components
  Files: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Dialog.tsx`, `src/components/ui/Toast.tsx`
  Notes: Build minimal, reusable components with Tailwind. Button variants: primary, secondary, ghost, destructive. Input with label and error state. Badge with color variants for task types. Card component for project cards. Dialog for confirmations. Toast for notifications.

- [x] **TASK-010** — Create utility functions and constants
  Files: `src/lib/utils.ts`, `src/lib/constants.ts`, `src/lib/formatTime.ts`
  Notes: `cn()` helper for clsx + tailwind-merge. Constants for task types, statuses, priorities with labels and colors. `formatDuration()` for time display (HH:MM:SS), `formatDate()` helpers.

---

## Phase 1: Data Model & Project Management

**Goal:** Implement the Convex database schema and build project and epic CRUD. At the end of this phase, users can create, view, edit, and archive projects with client names, and create epics within projects.

**Reference sections:** PRD §3 (Data Model), PRD §4 (API Specification — Projects, Epics), PRD §6 (FR-002, FR-003), PRD §8 (Projects List, Project Settings)

**Agent prompt:** "Implement the Convex database schema for projects, epics, tasks, and time entries. Then build the project management features: projects list page with cards, create/edit/archive projects, project settings page. Also build epic CRUD within projects. All queries and mutations must verify the authenticated user."

- [x] **TASK-011** — Define full Convex schema
  Files: `convex/schema.ts`
  Notes: Define all tables (projects, epics, tasks, timeEntries) with fields and indexes as specified in PRD §3. Include all indexes for efficient querying.

- [x] **TASK-012** — Implement project queries and mutations
  Files: `convex/projects.ts`
  Notes: Queries: `list` (all user projects), `get` (single project). Mutations: `create`, `update`, `archive`. All gated by auth — validate userId on every operation.

- [x] **TASK-013** — Implement epic queries and mutations
  Files: `convex/epics.ts`
  Notes: Queries: `listByProject`, `get`. Mutations: `create`, `update`, `close`. Validate that epic's project belongs to the authenticated user.

- [x] **TASK-014** — Build projects list page
  Files: `src/app/(dashboard)/projects/page.tsx`
  Notes: Grid of project cards. Each card shows: project name, client name, task count (can be 0 initially), status. "New Project" button opens create dialog. Empty state when no projects exist.

- [x] **TASK-015** — Build project create/edit dialog
  Files: `src/components/projects/ProjectForm.tsx`
  Notes: Dialog with form: project name (required), client name (optional), description (optional). Used for both create and edit. Form validation — name is required.

- [x] **TASK-016** — Build project settings page
  Files: `src/app/(dashboard)/projects/[projectId]/settings/page.tsx`
  Notes: Form to edit project name, client name, description. Archive button with confirmation dialog: "Archiving will hide this project. You can unarchive it later."

- [x] **TASK-017** — Build epic management within projects
  Files: `src/app/(dashboard)/projects/[projectId]/epics/page.tsx`, `src/components/epics/EpicForm.tsx`, `src/components/epics/EpicList.tsx`
  Notes: List of epics for a project. Create/edit epics with name, description, optional color. Close/reopen epics. Show epic status (open/closed) and linked task count.

- [x] **TASK-018** — Add project navigation and sidebar integration
  Files: `src/components/layout/Sidebar.tsx`, `src/components/layout/ProjectSwitcher.tsx`
  Notes: Update sidebar to list active projects below the main navigation. Clicking a project goes to its Kanban board. Add a ProjectSwitcher dropdown in the header for quick switching.

---

## Phase 2: Tasks & Kanban Board

**Goal:** Implement task CRUD and the Kanban board with drag & drop. At the end of this phase, users can create tasks with types, assign them to epics, and manage them on a visual Kanban board.

**Reference sections:** PRD §4 (API — Tasks), PRD §5 (US-003, US-004), PRD §6 (FR-004, FR-005), PRD §8 (Kanban Board, Task Detail), PRD §12 (Kanban Edge Cases)

**Agent prompt:** "Implement task CRUD with Convex mutations and build the Kanban board view for projects. The board should have four columns (To Do, In Progress, In Review, Done) with drag & drop using @hello-pangea/dnd. Task cards should show title, type badge (colored), epic tag, and priority indicator. Include a task detail view and task creation form. Handle edge cases for drag & drop."

- [x] **TASK-019** — Implement task queries and mutations
  Files: `convex/tasks.ts`
  Notes: Queries: `listByProject`, `listByEpic`, `get`. Mutations: `create` (default status "todo", auto-assign order), `update`, `moveToColumn` (update status + order), `reorder`, `delete`. Auth-gated.

- [x] **TASK-020** — Build TaskCard component
  Files: `src/components/kanban/TaskCard.tsx`, `src/components/tasks/TaskTypeBadge.tsx`
  Notes: Compact card showing: title (truncate at 2 lines), type badge (colored: Bug=red, Story=blue, Task=gray, Incident=orange), epic tag if assigned, priority dot (color-coded). Drag handle. Hover state with shadow elevation.

- [x] **TASK-021** — Build KanbanColumn component
  Files: `src/components/kanban/KanbanColumn.tsx`
  Notes: Column with header (title + task count), droppable area, task cards. "Add Task" button at bottom. Empty state: muted "No tasks" text. Column header colors match status.

- [x] **TASK-022** — Build KanbanBoard component with drag & drop
  Files: `src/components/kanban/KanbanBoard.tsx`
  Notes: Install @hello-pangea/dnd. Four columns side by side. Handle `onDragEnd`: move between columns (update status + order), reorder within column. Optimistic updates — move the card immediately, sync with Convex in background. Handle drag-to-same-position as no-op.

- [x] **TASK-023** — Build Kanban board page
  Files: `src/app/(dashboard)/projects/[projectId]/page.tsx`
  Notes: Project Kanban board as the main project view. Project name as page title. Filter bar: filter by task type, epic, priority. Integrate KanbanBoard component with Convex data.

- [x] **TASK-024** — Build task creation form
  Files: `src/components/tasks/TaskForm.tsx`
  Notes: Dialog form: title (required), task type (dropdown: Story, Task, Bug, Incident), epic (optional dropdown), priority (dropdown: low, medium, high, urgent), description (optional textarea). Default type: "task", default priority: "medium".

- [x] **TASK-025** — Build task detail view
  Files: `src/app/(dashboard)/tasks/[taskId]/page.tsx`, `src/components/tasks/TaskDetail.tsx`
  Notes: Full task view. Editable title (inline), type/status/priority badges, epic selector, description textarea. Placeholder for time entries section (built in Phase 3). Total tracked time display.

- [x] **TASK-026** — Add task filtering on Kanban board
  Files: `src/components/kanban/KanbanFilters.tsx`
  Notes: Filter bar above the board. Filter by: task type (multi-select chips), epic (dropdown), priority (multi-select chips). Filters applied client-side on the task list. Clear all filters button.

---

## Phase 3: Time Tracking

**Goal:** Implement the core time tracking system — timers, manual entry, and the active timer indicator. At the end of this phase, users can start/stop timers on tasks, see a global timer indicator, and add manual time entries. The magic moment (timer + Kanban) is achieved.

**Reference sections:** PRD §4 (API — Time Entries), PRD §5 (US-005, US-006, US-007), PRD §6 (FR-006, FR-007, FR-008, FR-014), PRD §12 (Timer Edge Cases)

**Agent prompt:** "Build the time tracking system for Velo. Implement Convex mutations for time entries (start, stop, manual create). Build the TimerControl component (play/pause/stop with live elapsed time display). Add automatic timer behavior when tasks move to 'In Progress' on the Kanban board. Build a global active timer indicator in the header. Handle edge cases: only one timer at a time, browser close with running timer, stopping timer when moving task away from In Progress."

- [x] **TASK-027** — Implement time entry queries and mutations
  Files: `convex/timeEntries.ts`
  Notes: Queries: `listByTask`, `getActive` (running timer for user), `listByDateRange`. Mutations: `start` (auto-stop any running timer first), `stop` (compute duration), `createManual`, `update`, `delete`. Validate no negative durations. Store `projectId` denormalized for billing.

- [x] **TASK-028** — Build TimerControl component
  Files: `src/components/timer/TimerControl.tsx`, `src/components/timer/TimerDisplay.tsx`
  Notes: Play/stop buttons. TimerDisplay shows elapsed time in HH:MM:SS format using JetBrains Mono font. Updates every second via `setInterval` (client-side, computed from startTime). Green pulsing dot when running. Compact variant for task cards, full variant for task detail.

- [x] **TASK-029** — Build useTimer and useActiveTimer hooks
  Files: `src/hooks/useTimer.ts`, `src/hooks/useActiveTimer.ts`
  Notes: `useTimer(taskId)`: manages timer state for a specific task (start, stop, current duration). `useActiveTimer()`: subscribes to the globally active timer via `timeEntries.getActive` query. Returns active timer info or null.

- [x] **TASK-030** — Integrate timer with task cards and detail view
  Files: `src/components/kanban/TaskCard.tsx`, `src/components/tasks/TaskDetail.tsx`
  Notes: TaskCard: show small timer indicator if this task has a running timer. TaskDetail: show full TimerControl with time entries list below it. Each time entry shows: date, duration, description, edit/delete buttons.

- [x] **TASK-031** — Add automatic timer on Kanban drag
  Files: `src/components/kanban/KanbanBoard.tsx`, `convex/tasks.ts`
  Notes: When task moves to "In Progress": call `timeEntries.start`. When task moves away from "In Progress": call `timeEntries.stop` (if timer running for that task). Show toast: "Timer started for [task]" / "Timer stopped. [duration] logged." Handle case where another timer is already running.

- [x] **TASK-032** — Build global active timer indicator
  Files: `src/components/layout/Header.tsx`, `src/components/timer/ActiveTimerBar.tsx`
  Notes: In the header: if a timer is running, show a compact bar with task name, project name, elapsed time, and stop button. Click task name to navigate to task detail. Green accent. Always visible across all pages.

- [x] **TASK-033** — Build manual time entry form
  Files: `src/components/timer/ManualTimeEntry.tsx`
  Notes: Dialog form: date picker, start time, end time (or duration), optional description. Validate end > start. Used from task detail view. Show warning if entry overlaps with existing entries (but allow it).

- [x] **TASK-034** — Handle timer edge cases
  Files: `convex/timeEntries.ts`, `src/components/kanban/KanbanBoard.tsx`
  Notes: Implement: only one active timer at a time (auto-stop previous), cross-midnight timers, delete task with running timer (stop first, then confirm), browser reconnection (timer state is server-side, client computes display from startTime).

---

## Phase 4: Billing & Dashboard

**Goal:** Build the billing summary view with aggregated hours and CSV export, and the dashboard overview page. At the end of this phase, the second magic moment is achieved — clean billing summaries at month-end.

**Reference sections:** PRD §4 (API — Billing), PRD §5 (US-008, US-009), PRD §6 (FR-009, FR-010, FR-011), PRD §8 (Billing Summary, Dashboard), PRD §12 (Billing Edge Cases)

**Agent prompt:** "Build the billing summary view and dashboard for Velo. The billing view should show aggregated tracked hours grouped by project, epic, and task type, with a date range filter and CSV export. The dashboard should show an overview: active projects, running timer, recent tasks, and today's tracked hours. Build the Convex queries for billing aggregation."

- [x] **TASK-035** — Implement billing aggregation queries
  Files: `convex/billing.ts`
  Notes: Queries: `summary` (total hours for date range, optional project filter), `summaryByProject` (hours grouped by project), `summaryByEpic` (hours grouped by epic within project), `summaryByTaskType` (hours grouped by task type). All queries filter by userId and date range. Convert millisecond durations to hours. Exclude running timers from totals (or show separately).

- [x] **TASK-036** — Build BillingSummary page
  Files: `src/app/(dashboard)/billing/page.tsx`, `src/components/billing/BillingSummary.tsx`
  Notes: Date range picker with presets: "This month", "Last month", "This quarter", "Custom". Project filter dropdown. Summary cards at top: total hours, number of projects, number of tasks. Below: breakdown table.

- [x] **TASK-037** — Build BillingTable component
  Files: `src/components/billing/BillingTable.tsx`
  Notes: Expandable table. Top level: projects with total hours and client name. Expand to see: epics within project with hours. Expand further: task type breakdown. Clean, scannable layout. Alternating row backgrounds.

- [x] **TASK-038** — Build CSV export
  Files: `src/components/billing/BillingExport.tsx`
  Notes: "Export CSV" button. Uses papaparse to generate CSV from current billing data. Columns: Project, Client, Epic, Task, Task Type, Date, Hours, Description. Filename: `velo-billing-{startDate}-{endDate}.csv`. Triggers browser download.

- [x] **TASK-039** — Build Dashboard page
  Files: `src/app/(dashboard)/page.tsx`
  Notes: Welcome message: "Hey Dominic" (user name). Active timer widget if running. Stats row: active projects count, tasks in progress, today's tracked hours. Recent tasks list (last 10 updated, showing task name, project, type, time ago). Empty state for new users.

- [x] **TASK-040** — Add dashboard stats queries
  Files: `convex/dashboard.ts`
  Notes: Queries: `stats` (returns active project count, in-progress task count, today's total hours), `recentTasks` (last 10 updated tasks with project info). Single efficient query where possible.

---

## Phase 5: Polish & Launch

**Goal:** Refine the UI, fix rough edges, improve performance, add keyboard shortcuts, and ensure accessibility. At the end of this phase, Velo is a polished, daily-driver tool.

**Reference sections:** PRD §7 (Non-Functional Requirements), PRD §8 (all screens — states), Vision §5 (Accessibility, Motion & Interaction), PRD §12 (General Error Handling)

**Agent prompt:** "Polish Velo for daily use. Add keyboard shortcuts for common actions. Implement proper loading states, empty states, and error handling across all pages. Ensure accessibility (WCAG AA): keyboard navigation, focus indicators, screen reader support for Kanban. Add toast notifications for all actions. Optimize performance. Fix any visual inconsistencies and ensure the design system is consistently applied."

- [x] **TASK-041** — Add loading states and skeletons
  Files: All page components
  Notes: Add skeleton loading states for: Kanban board (skeleton columns with card placeholders), project list (skeleton cards), billing table (skeleton rows), dashboard (skeleton stat cards). Use Tailwind `animate-pulse` on gray blocks.

- [x] **TASK-042** — Add empty states
  Files: All page and list components
  Notes: Empty states for: no projects ("Create your first project to get started"), empty Kanban board, empty column, no epics, no time entries, no billing data for period. Each with an icon, message, and CTA where appropriate.

- [x] **TASK-043** — Add error handling and toast notifications
  Files: `src/components/ui/Toast.tsx`, all mutation call sites
  Notes: Toast system: success (green), error (red), info (blue). Show toasts for: task created, timer started/stopped, project created, errors. Auto-dismiss after 3 seconds. Stack multiple toasts.

- [x] **TASK-044** — Add keyboard shortcuts
  Files: `src/hooks/useKeyboardShortcuts.ts`
  Notes: Global shortcuts: `N` = new task (when on Kanban), `P` = new project, `T` = toggle timer on current task, `/` = focus search/filter, `Esc` = close dialogs. Show shortcut hints in tooltips. Keyboard shortcut help dialog (`?`).

- [x] **TASK-045** — Accessibility audit and fixes
  Files: All components
  Notes: Ensure: all buttons have aria-labels, focus indicators (2px indigo outline) visible on all interactive elements, Kanban drag & drop has keyboard alternative and aria-live announcements, color contrast meets WCAG AA (4.5:1), form inputs have associated labels, timer state announced to screen readers.

- [x] **TASK-046** — Performance optimization
  Files: Various
  Notes: Audit: ensure Convex queries use indexes efficiently, add `React.memo` where needed (TaskCard, KanbanColumn), lazy load non-critical components (billing, settings). Verify all primary views load under 200ms. Use React DevTools profiler.

- [x] **TASK-047** — Visual polish and consistency
  Files: All components
  Notes: Review all screens against design system. Ensure consistent spacing, typography, colors. Check hover states, transitions (100ms for color, 200ms for movement). Ensure all shadows, border radiuses match design tokens. Test in Chrome, Firefox, Safari.

- [x] **TASK-048** — Final integration test with real data
  Files: N/A
  Notes: Create real projects: client projects (with client names) and personal projects (Aura). Create epics and tasks. Use the timer for a full work session. Generate a billing summary. Export CSV. Verify everything works end-to-end. Document any issues found.

---

## Phase 6: Visual Redesign & Hourly Rate Feature

**Goal:** Transform Velo from functional to premium. Complete visual redesign of all components — dark sidebar, gradient accents, layered shadows, microinteractions. Add hourly rate per project with automatic billing calculations. At the end of this phase, Velo feels like a polished, modern tool on par with Linear/Raycast — and billing shows calculated amounts.

**Reference sections:** Vision §5 (Design Direction — UPDATED), PRD §3 (Data Model — hourlyRate field), PRD §4 (API — updated mutations/queries), PRD §8 (UI/UX Requirements)

**Agent prompt:** "Perform a complete visual redesign of Velo. The current UI is functional but bland. Transform it into a premium, polished experience. Key changes: (1) Dark sidebar with gradient background (slate-900 → slate-800), active nav items with indigo glow, light text. (2) Update Tailwind config and globals.css with new design tokens — warm slate palette, layered shadows, larger border radius, gradient accents. (3) Redesign TaskCards with hover lift, better type badges, refined spacing. (4) Redesign Dashboard with elevated stat cards with colored accent borders. (5) Redesign Login page with gradient accent. (6) Add gradient primary buttons. (7) Add smooth microinteractions (hover lifts, scale-in modals, toast slide-in). (8) Add hourlyRate field to projects schema, update project form, update billing queries to calculate amounts, show amounts in billing view. Read the UPDATED Vision §5 Design Direction for the full spec."

- [x] **TASK-049** — Update Tailwind config and globals.css with new design tokens
  Files: `tailwind.config.ts`, `src/app/globals.css`
  Notes: Replace the entire color palette with warm slate-based colors. Add sidebar color tokens. Add gradient backgrounds (`gradient-primary`, `gradient-sidebar`). Update shadows to layered system (xs, card, card-hover, elevated, drag, modal). Increase border radius (sm=6px, md=10px, lg=14px). Add keyframe animations (slide-in, scale-in, pulse-soft). Add transition utilities. Update CSS variables to match new Vision §5 tokens. Keep existing Tailwind class names working — this is a token swap, not a class rename.

- [x] **TASK-050** — Redesign Sidebar with dark theme
  Files: `src/components/layout/Sidebar.tsx`
  Notes: Dark sidebar: `bg-gradient-sidebar` (slate-900 → slate-800). Velo logo/text in white with optional indigo accent. Nav items: light text (slate-300), hover reveals soft white bg (rgba(255,255,255,0.05)), active item has indigo background glow (rgba(99,102,241,0.2)) with white text. Project list section: subtle divider, project names in slate-300, hover in slate-200. Logout button at bottom in muted style. Add subtle border-right with `border-slate-700/50`. Width: 260px (slightly wider for breathing room).

- [x] **TASK-051** — Redesign Header
  Files: `src/components/layout/Header.tsx`
  Notes: Clean white header with subtle bottom border (slate-200). Remove any heavy styling. The header should feel lightweight — just breadcrumb/page title on left, active timer + user on right. Consider a very subtle `backdrop-blur` and slight transparency if the content scrolls behind it.

- [x] **TASK-052** — Redesign Button component with gradient primary
  Files: `src/components/ui/Button.tsx`
  Notes: Primary variant: `bg-gradient-primary` (indigo → violet gradient), white text, hover shifts gradient slightly darker. Add subtle shadow on primary buttons (`shadow-xs`). Secondary: clean white with slate-200 border, hover border-slate-300. Ghost: transparent, hover bg-slate-50. All variants: update border-radius to new `rounded-md` (10px). Smooth 150ms transitions.

- [x] **TASK-053** — Redesign Card, Input, Badge, Dialog components
  Files: `src/components/ui/Card.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Dialog.tsx`
  Notes: Card: updated shadow-card, rounded-lg (14px), hover state with shadow-card-hover + translateY(-1px). Input: border-slate-200, focus ring indigo with bg-white, rounded-md. Badge: softer fills with better text contrast (see Vision §5 badge colors). Dialog: modal shadow, scale-in animation on open, backdrop with blur.

- [x] **TASK-054** — Redesign Toast component
  Files: `src/components/ui/Toast.tsx`
  Notes: Slide-in animation from right. Rounded-lg with elevated shadow. Success: emerald-50 bg with emerald-600 text and left accent border. Error: red-50 bg with red-600 text. Info: slate-50 bg. Close button on hover. Auto-dismiss with progress bar (optional subtle animation at bottom of toast).

- [x] **TASK-055** — Redesign TaskCard with hover lift and refined layout
  Files: `src/components/kanban/TaskCard.tsx`, `src/components/tasks/TaskTypeBadge.tsx`
  Notes: Card: white bg, shadow-card, rounded-lg. Hover: shadow-card-hover + `transform: translateY(-1px)` over 150ms. Drag: shadow-drag + slight scale(1.02). Type badge: softer fills with rounded-md, better spacing. Priority indicator: colored left border strip instead of dot (4px wide, full height, rounded). Epic tag: subtle pill with color dot. Timer indicator: compact, green accent with pulse-soft animation. Overall more spacious padding (p-3.5 instead of p-3).

- [x] **TASK-056** — Redesign KanbanColumn with better visual hierarchy
  Files: `src/components/kanban/KanbanColumn.tsx`
  Notes: Column header: bigger task count badge, status-colored indicator dot (not just text color). Column background: very subtle surface color (slate-50/50) with rounded-xl container. Drop target state: soft indigo-50 background with dashed indigo border. Add subtle column header underline that matches status color. Minimum height for empty columns.

- [x] **TASK-057** — Redesign Dashboard with elevated stat cards
  Files: `src/app/(dashboard)/page.tsx`
  Notes: Welcome section: larger heading, today's date in text-secondary. Stat cards: white bg, elevated shadow, colored LEFT accent border (3px, rounded). Projects count = indigo accent, Tasks in progress = blue, Today's hours = emerald. Numbers in text-2xl font-semibold for scannability. Active timer widget: more prominent, full-width, emerald gradient border. Recent tasks: clean list with task type colored dot, hover state, timestamp.

- [x] **TASK-058** — Redesign Projects page
  Files: `src/app/(dashboard)/projects/page.tsx`
  Notes: Project cards: elevated shadow, rounded-xl, hover lift. Client name as subtle badge. Task count and total hours as small stats at bottom. Active status: green dot indicator. Archived: muted opacity. "New Project" button: gradient primary. Empty state: larger icon, warmer messaging.

- [x] **TASK-059** — Redesign Login page
  Files: `src/app/login/page.tsx`
  Notes: Centered card on a subtle gradient background (slate-50 → white gradient or a very soft radial gradient). Card: elevated shadow, rounded-xl. "Velo" heading with gradient text (indigo → violet) or bold with an icon accent. Clean, spacious form. Primary button full-width with gradient. Sign up/sign in toggle as subtle link below.

- [x] **TASK-060** — Redesign Billing page and table
  Files: `src/app/(dashboard)/billing/page.tsx`, `src/components/billing/BillingSummary.tsx`, `src/components/billing/BillingTable.tsx`, `src/components/billing/BillingExport.tsx`
  Notes: Summary cards: same elevated style as dashboard stat cards. Total hours = indigo accent, Total amount = emerald accent (new — calculated from hourly rates). Table: cleaner row styling, subtle row dividers instead of alternating backgrounds. Expandable rows with smooth animation. Amount column showing "12h × €85 = €1,020" inline. Projects without hourlyRate show "–" in amount column. Export button: secondary style with download icon.

- [x] **TASK-061** — Redesign ActiveTimerBar
  Files: `src/components/timer/ActiveTimerBar.tsx`
  Notes: More prominent: slightly taller, better contrast. White bg with emerald left border accent (instead of full green background). Task name as bold link. Timer display in JetBrains Mono with emerald color. Stop button as a small square icon button. Subtle pulse animation on the timer when running. Cleaner layout with better spacing.

- [x] **TASK-062** — Add hourlyRate field to Convex schema and project mutations
  Files: `convex/schema.ts`, `convex/projects.ts`
  Notes: Add `hourlyRate: v.optional(v.number())` to projects table. Update `create` and `update` mutations to accept hourlyRate. No migration needed — field is optional, existing projects will have undefined (treated as no rate set).

- [x] **TASK-063** — Update ProjectForm with hourly rate input
  Files: `src/components/projects/ProjectForm.tsx`, `src/app/(dashboard)/projects/[projectId]/settings/page.tsx`
  Notes: Add "Hourly Rate (€)" number input field to project form, below client name. Optional — placeholder "e.g. 85". Show in both create and edit modes. Also add to project settings page. Use type="number" with min="0" step="0.01".

- [x] **TASK-064** — Update billing queries to calculate amounts
  Files: `convex/billing.ts`
  Notes: Update `summaryByProject` query to join with projects table and include hourlyRate. Calculate `amount = hours × hourlyRate` per project. Return both hours and amount (amount is null if no hourlyRate set). Update `summary` query to include total amount across all projects that have rates.

- [x] **TASK-065** — Update Billing UI to show calculated amounts
  Files: `src/components/billing/BillingSummary.tsx`, `src/components/billing/BillingTable.tsx`, `src/components/billing/BillingExport.tsx`
  Notes: Add "Amount" column to billing table. Show calculated amount where hourlyRate exists, "–" where it doesn't. Summary card: add "Total Amount" card next to "Total Hours" (only visible if any projects have rates). Show rate inline: "12.5h × €85/h = €1,062.50". CSV export: add "Rate" and "Amount" columns. Format amounts with 2 decimal places and € symbol.

- [x] **TASK-066** — Add microinteractions and transition polish
  Files: Various components
  Notes: Ensure all interactive elements have smooth transitions: buttons (150ms bg transition), cards (150ms shadow + transform), sidebar nav items (100ms bg), dialogs (scale-in animation + backdrop fade), toasts (slide-in), dropdown menus (scale-in from top). Add `will-change: transform` to frequently animated elements (task cards). Ensure no janky transitions — all should use `cubic-bezier(0.4, 0, 0.2, 1)` or similar smooth easing.

- [x] **TASK-067** — Final visual QA and consistency pass
  Files: All components
  Notes: Review every screen: Login, Dashboard, Projects, Kanban, Task Detail, Epics, Billing, Settings. Verify: all shadows use new layered system, all borders use slate-200, all radius values match new tokens, all text colors use slate palette, sidebar is consistently dark, buttons use gradient where appropriate, all hover/focus states feel smooth. Test in Chrome and Firefox. Check that the dark sidebar doesn't clash with any page content.

---

## Phase 7: Multi-Currency & Invoice Generation

**Goal:** Add multi-currency support (EUR, USD, CHF, GBP) with a global default and per-project override. Build a complete invoice generation system — create professional invoices from tracked hours, with sender/client details, line items, tax calculations, payment info, and PDF export. Add business settings for storing reusable sender data. At the end of this phase, Velo covers the full freelancer workflow: track → bill → invoice → get paid.

**Reference sections:** PRD §3 (Data Model — userSettings, invoices tables), PRD §4 (API — userSettings, invoices), PRD §6 (FR-015 through FR-019), PRD §8 (Invoices List, Invoice Detail, Business Settings, updated Project Settings), PRD §12 (Invoice Edge Cases)

**Agent prompt:** "Add multi-currency support and invoice generation to Velo. (1) Add a userSettings table with business details (name, address, VAT ID, tax rate, bank details, payment terms, invoice numbering, default currency). Build a Settings page at /settings. (2) Add currency field to projects schema (optional, falls back to global default). Update project form and settings to show currency dropdown. (3) Update all billing/currency displays to use the correct symbol (€/$/ £/CHF). (4) Add invoices table with full invoice data model. Build invoice CRUD mutations. (5) Build Invoices list page at /invoices with status filters. (6) Build Invoice detail/editor page — form with sender/client blocks, editable line items table, tax calculation, payment details, notes. (7) Add 'Create Invoice' flow from Billing page — pre-populate line items from tracked hours. (8) Build PDF export using @react-pdf/renderer with professional layout. (9) Add invoice status management (draft→sent→paid, overdue detection). Read PRD §12 Invoice Edge Cases carefully."

- [x] **TASK-068** — Add userSettings table to Convex schema
  Files: `convex/schema.ts`, `convex/userSettings.ts`
  Notes: Add `userSettings` table with all fields from PRD. Create `get` query (returns settings or sensible defaults if none exist). Create `upsert` mutation (create if not exists, update if exists). Index by userId (unique per user). Default currency: "EUR". Default invoicePrefix: "RE". Default nextInvoiceNumber: 1.

- [x] **TASK-069** — Build Business Settings page
  Files: `src/app/(dashboard)/settings/page.tsx`, `src/components/settings/BusinessSettingsForm.tsx`
  Notes: Form sections: General (default currency dropdown), Business Details (name, address textarea, VAT ID), Tax (rate % input), Payment (bank name, IBAN, BIC, payment term days), Invoice Numbering (prefix, next number preview showing formatted example). Save button. Success toast on save. Add "Settings" link to sidebar navigation.

- [x] **TASK-070** — Add currency field to projects and update forms
  Files: `convex/schema.ts`, `convex/projects.ts`, `src/components/projects/ProjectForm.tsx`, `src/app/(dashboard)/projects/[projectId]/settings/page.tsx`
  Notes: Add `currency: v.optional(v.string())` to projects table. Update create/update mutations. Add currency dropdown to project form and settings page — shows "Default (EUR)" option plus EUR, USD, CHF, GBP. If not set, falls back to user's defaultCurrency from settings. Show dynamic currency symbol next to hourly rate input.

- [x] **TASK-071** — Create currency utility helpers
  Files: `src/lib/currency.ts`
  Notes: Create helper functions: `getCurrencySymbol(code: string): string` (EUR→"€", USD→"$", GBP→"£", CHF→"CHF"), `formatAmount(amount: number, currency: string): string` (proper symbol placement + 2 decimal places), `SUPPORTED_CURRENCIES` constant array with code + label + symbol. Used across billing, invoices, and project views.

- [x] **TASK-072** — Update billing views with multi-currency support
  Files: `src/components/billing/BillingSummary.tsx`, `src/components/billing/BillingTable.tsx`, `src/components/billing/BillingExport.tsx`, `convex/billing.ts`
  Notes: Update billing queries to return project currency alongside amounts. Update UI to show correct currency symbol per project. Summary cards show amounts per currency if mixed (e.g. "€1,200 + $850"). CSV export includes currency column. BillingTable shows currency symbol per project row.

- [x] **TASK-073** — Add invoices table to Convex schema and implement mutations
  Files: `convex/schema.ts`, `convex/invoices.ts`
  Notes: Add `invoices` table with all fields from PRD. Implement mutations: `create` (auto-generate invoice number from settings prefix + year + padded sequence, auto-increment nextInvoiceNumber, snapshot sender details from userSettings), `update` (only drafts), `updateStatus` (draft→sent→paid, or draft→sent→overdue→paid), `delete` (only drafts). Implement queries: `list` (with optional status/project filter), `get` (single invoice). All auth-gated.

- [x] **TASK-074** — Build "Create Invoice" flow from Billing page
  Files: `src/components/billing/BillingSummary.tsx`, `src/components/invoices/CreateInvoiceDialog.tsx`
  Notes: Add "Create Invoice" button next to "Export CSV" on billing page. When clicked: show dialog to select project (required for invoices — one invoice per project). Pre-populate line items from billing data for the selected date range: group by epic → task type, calculate hours × rate per line. User can review and adjust before creating. On confirm: create invoice via mutation, redirect to invoice detail page.

- [x] **TASK-075** — Build Invoices list page
  Files: `src/app/(dashboard)/invoices/page.tsx`, `src/components/invoices/InvoiceList.tsx`
  Notes: Page with filter tabs: All, Draft, Sent, Paid, Overdue. Invoice rows showing: invoice number, client name, project name, issue date, total amount with currency, status badge (draft=slate, sent=blue, paid=emerald, overdue=red). Click to open invoice detail. "New Invoice" button (opens create flow). Empty state per filter. Add "Invoices" link to sidebar navigation between Billing and Settings.

- [x] **TASK-076** — Build Invoice detail/editor page
  Files: `src/app/(dashboard)/invoices/[invoiceId]/page.tsx`, `src/components/invoices/InvoiceForm.tsx`
  Notes: Two-column or stacked layout. Sender block (business name, address, VAT ID — pre-filled from snapshot, editable in draft). Recipient block (client name, address — editable). Line items table: each row has description, hours (number), rate (number), amount (calculated). Add/remove rows. Below table: subtotal, tax rate %, tax amount, total. Payment details section (bank, IBAN, BIC, terms). Notes textarea. Action buttons based on status: Draft → "Save", "Mark as Sent", "Export PDF", "Delete". Sent → "Mark as Paid", "Export PDF". Paid → "Export PDF" only.

- [x] **TASK-077** — Build Invoice PDF export
  Files: `src/components/invoices/InvoicePdfExport.tsx`
  Notes: Use @react-pdf/renderer to generate a professional invoice PDF. Layout: sender info top-left, recipient top-right, invoice number + dates below, line items table with headers (Description, Hours, Rate, Amount), totals section right-aligned (Subtotal, Tax, Total), payment details at bottom, optional notes. Clean typography (Helvetica), proper spacing. "Export PDF" button triggers browser download. Filename: `{invoiceNumber}.pdf`.

- [x] **TASK-078** — Add invoice status management and overdue detection
  Files: `convex/invoices.ts`, `src/components/invoices/InvoiceList.tsx`
  Notes: Status transitions: draft→sent (sets issueDate if not already), sent→paid, sent→overdue (manual or based on dueDate). Add a visual indicator for overdue invoices (red badge, past-due days count). Consider a Convex scheduled function or cron job to auto-mark overdue invoices (optional — can also be manual for MVP).

- [x] **TASK-079** — Update project cards and billing to show currency
  Files: `src/app/(dashboard)/projects/page.tsx`, `src/components/kanban/TaskCard.tsx`, `src/app/(dashboard)/page.tsx`
  Notes: Project cards: show hourly rate with correct currency symbol (€85/h or $120/h). Dashboard stat cards: show amounts with currency. Ensure currency flows through from project → billing → invoice consistently. Use the `formatAmount` helper everywhere.

- [x] **TASK-080** — Update sidebar navigation with new routes
  Files: `src/components/layout/Sidebar.tsx`
  Notes: Add "Invoices" nav item (Receipt icon) between Billing and a new "Settings" item (Settings icon). Both follow the existing dark sidebar nav item pattern with active states.

- [x] **TASK-081** — Final integration test and polish
  Files: All new files
  Notes: End-to-end test: set up business settings with EUR → create project with USD override → track hours → generate invoice from billing → edit line items → export PDF → mark as sent → mark as paid. Verify: currency symbols correct throughout, invoice numbers increment properly, PDF looks professional, all status transitions work, settings are properly snapshotted on invoice creation. Visual polish pass on all new screens.

---

## Phase 8: Recurring Tasks

**Goal:** Add recurring task templates with flexible intervals (daily, weekly, monthly). Tasks are automatically created as normal task instances on the Kanban board via a Convex cron job. Each instance has independent time tracking. At the end of this phase, routine work like monthly maintenance, weekly check-ins, or daily standups automatically appears on the board.

**Reference sections:** PRD §3 (Data Model — recurringTaskTemplates, updated tasks table), PRD §4 (API — recurringTasks queries/mutations), PRD §6 (FR-020, FR-021, FR-022), PRD §12 (Recurring Task Edge Cases)

**Agent prompt:** "Add recurring task support to Velo. (1) Add `recurringTaskTemplates` table to Convex schema with fields: projectId, epicId (optional), title, description, taskType, priority, recurrence (daily/weekly/monthly), dayOfWeek, dayOfMonth, nextDueDate, lastCreatedAt, isActive. Add `recurringTemplateId` optional field to the existing tasks table. (2) Implement CRUD mutations for recurring templates. (3) Implement a Convex cron job that runs daily, checks for templates where nextDueDate <= now, creates task instances, and advances nextDueDate. (4) Build the recurring task template management UI — accessible from project settings or a dedicated section. Create/edit/pause/delete templates. (5) Add a visual indicator (repeat icon) on task cards created from a recurring template. (6) Handle edge cases: archived projects pause templates, deleted epics clear epicId, pausing/resuming recalculates nextDueDate. Read convex/_generated/ai/guidelines.md and PRD §12 Recurring Task Edge Cases carefully."

- [x] **TASK-082** — Add recurringTaskTemplates table and update tasks schema
  Files: `convex/schema.ts`
  Notes: Add `recurringTaskTemplates` table with all fields from PRD. Add `recurringTemplateId: v.optional(v.id("recurringTaskTemplates"))` to tasks table. Add indexes: `by_userId`, `by_projectId`, `by_userId_isActive`, `by_nextDueDate` on templates. Add `by_recurringTemplateId` index on tasks.

- [x] **TASK-083** — Implement recurring task template CRUD mutations
  Files: `convex/recurringTasks.ts`
  Notes: Queries: `list` (by user, optional project filter), `get` (single template). Mutations: `create` (compute initial nextDueDate based on recurrence + today), `update` (recompute nextDueDate if schedule changed), `toggleActive` (pause/resume, recalculate nextDueDate on resume from today), `delete`. All auth-gated. On `create`: for daily → tomorrow, for weekly → next occurrence of dayOfWeek, for monthly → next occurrence of dayOfMonth.

- [x] **TASK-084** — Implement nextDueDate calculation utility
  Files: `convex/recurringTasks.ts` (or `convex/lib/recurrence.ts`)
  Notes: Helper function `computeNextDueDate(recurrence, dayOfWeek?, dayOfMonth?, fromDate?)` that returns the next timestamp. For daily: next day at 00:00. For weekly: next dayOfWeek (0=Sun..6=Sat) at 00:00. For monthly: next dayOfMonth (1-28, capped) at 00:00. If dayOfMonth is past in current month, go to next month. Used by both create/update mutations and the cron job.

- [x] **TASK-085** — Implement Convex cron job for automatic task creation
  Files: `convex/crons.ts`, `convex/recurringTasks.ts`
  Notes: Register a Convex cron job that runs daily (e.g. `crons.daily("createRecurringTasks", ...)`). The job queries all active templates where `nextDueDate <= Date.now()`. For each: create a new task with the template's fields (title, description, taskType, priority, projectId, epicId, recurringTemplateId), set status to "todo", compute order. Then advance `nextDueDate` and update `lastCreatedAt`. Handle edge case: if project is archived, skip and pause the template.

- [x] **TASK-086** — Build RecurringTaskForm dialog
  Files: `src/components/recurring/RecurringTaskForm.tsx`
  Notes: Dialog form: title (required), task type dropdown, priority dropdown, project dropdown (required), epic dropdown (optional, filtered by project), recurrence selector (daily/weekly/monthly radio buttons or segmented control). Conditional fields: if weekly → day of week picker (Mon-Sun), if monthly → day of month input (1-28). Preview text showing next occurrence: "Next task will be created on [date]". Used for both create and edit.

- [x] **TASK-087** — Build RecurringTaskList component
  Files: `src/components/recurring/RecurringTaskList.tsx`
  Notes: List of recurring templates for a project. Each row shows: title, recurrence badge (e.g. "Monthly on the 1st", "Weekly on Monday", "Daily"), next due date, task type badge, active/paused toggle. Edit and delete buttons. Empty state: "No recurring tasks set up. Create one to automate routine work."

- [x] **TASK-088** — Add Recurring Tasks section to project settings
  Files: `src/app/(dashboard)/projects/[projectId]/settings/page.tsx`
  Notes: Add new section "Recurring Tasks" below the existing project settings. Shows RecurringTaskList for this project. "New Recurring Task" button opens RecurringTaskForm with projectId pre-filled. Section header with Repeat icon and task count badge.

- [x] **TASK-089** — Add recurring indicator to TaskCard and TaskDetail
  Files: `src/components/kanban/TaskCard.tsx`, `src/components/tasks/TaskDetail.tsx`
  Notes: If a task has `recurringTemplateId`, show a small Repeat icon (from Lucide) on the task card, next to the epic tag. On task detail: show "Created from recurring template: [template title]" info line with link to project settings. If template was deleted, show "(template deleted)".

- [x] **TASK-090** — Handle edge cases and auto-pause on archive
  Files: `convex/projects.ts`, `convex/recurringTasks.ts`, `convex/epics.ts`
  Notes: When a project is archived (`projects.archive`): find all active recurring templates for that project and set `isActive: false`. When an epic is deleted: find all templates referencing it and clear their `epicId`. When project is un-archived: do NOT auto-resume templates (user should manually resume to avoid surprise task creation). Add appropriate error handling for all edge cases from PRD §12.

- [x] **TASK-091** — Final integration test and polish
  Files: All new files
  Notes: End-to-end test: create a monthly recurring template on the 1st → verify nextDueDate is correct → manually trigger cron job or wait → verify task instance appears on Kanban board → verify task has recurringTemplateId and repeat icon → verify time tracking works independently → pause template → verify no new instances → resume → verify nextDueDate recalculated → archive project → verify template auto-paused. Visual polish: recurring badge styling, form layout, consistency with existing design system.

---

## Agent Session Guide

### How to Structure Coding Sessions

Each phase is designed to be completed in 1–3 coding sessions. Here's how to approach each session:

1. **Read the phase summary and agent prompt first.** This gives the coding agent context.
2. **Read the referenced PRD/Vision sections.** Only the sections listed — don't read the full docs every time.
3. **Work through tasks sequentially.** Tasks are ordered for a reason — later tasks depend on earlier ones.
4. **Mark tasks complete as you go.** Change `- [ ]` to `- [x]` immediately after finishing each task.
5. **Test each task before moving on.** Verify the feature works before checking the box.
6. **At the end of a session**, commit all changes and note which task you stopped at.

### Session Size Guidelines

- **Phase 0:** 1–2 sessions (setup is mostly configuration)
- **Phase 1:** 1–2 sessions (CRUD is straightforward)
- **Phase 2:** 2–3 sessions (Kanban drag & drop needs careful implementation)
- **Phase 3:** 2–3 sessions (timer logic has many edge cases)
- **Phase 4:** 1–2 sessions (mostly queries and UI)
- **Phase 5:** 1–2 sessions (polish and testing)
- **Phase 6:** 3–4 sessions (full visual redesign + hourly rate feature)
- **Phase 7:** 4–6 sessions (multi-currency + invoice generation + PDF export + business settings)
- **Phase 8:** 2–3 sessions (recurring task templates + cron job + management UI)

**Total estimated sessions: 17–27**

### When You Hit a Problem

1. Check the Edge Cases section in the PRD (§12) — it may already have a prescribed solution.
2. If it's a Convex-specific issue, check the Convex documentation.
3. If it's a design question, refer to the Vision document's Design Direction section.
4. If it's a scope question, check PRD §14 (Out of Scope) — if it's listed there, don't build it.

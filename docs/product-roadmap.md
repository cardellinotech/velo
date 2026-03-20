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

- [ ] **TASK-001** — Initialize Next.js project with TypeScript
  Files: `package.json`, `tsconfig.json`, `next.config.ts`
  Notes: Use `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router, and src/ directory.

- [ ] **TASK-002** — Install and configure Convex
  Files: `convex/`, `convex.json`, `.env.local`
  Notes: Run `npx convex dev` to initialize. Set up environment variables for Convex deployment URL.

- [ ] **TASK-003** — Configure Tailwind with Velo design tokens
  Files: `tailwind.config.ts`, `src/app/globals.css`
  Notes: Extend Tailwind theme with colors (primary #4F46E5, surface #F9FAFB, etc.), fonts (Inter, JetBrains Mono), spacing, shadows, and border radius from PRD §9 and Vision §5.

- [ ] **TASK-004** — Set up fonts (Inter + JetBrains Mono)
  Files: `src/app/layout.tsx`
  Notes: Use `next/font/google` to load Inter (400, 500, 600) and JetBrains Mono (500). Apply Inter as default, JetBrains Mono available via `font-mono` class.

- [ ] **TASK-005** — Implement Convex Auth with email/password
  Files: `convex/auth.ts`, `convex/schema.ts`
  Notes: Install `@convex-dev/auth`. Configure Password provider. Set up auth tables in schema. Follow Convex Auth documentation for setup.

- [ ] **TASK-006** — Create login page
  Files: `src/app/login/page.tsx`
  Notes: Centered card layout. Email input, password input, sign in button, sign up toggle. Handle loading and error states. Redirect to `/` on success.

- [ ] **TASK-007** — Create auth middleware and protected layout
  Files: `src/app/layout.tsx`, `src/components/layout/ConvexClientProvider.tsx`
  Notes: Set up ConvexProviderWithAuth. Redirect unauthenticated users to `/login`. Show loading state while checking auth.

- [ ] **TASK-008** — Create app shell with sidebar navigation
  Files: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/app/(dashboard)/layout.tsx`
  Notes: Sidebar (240px fixed) with navigation: Dashboard, Projects, Billing. Use Lucide icons. Active state styling. Header with user info and logout button. Use route groups for authenticated layout.

- [ ] **TASK-009** — Create base UI components
  Files: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Dialog.tsx`, `src/components/ui/Toast.tsx`
  Notes: Build minimal, reusable components with Tailwind. Button variants: primary, secondary, ghost, destructive. Input with label and error state. Badge with color variants for task types. Card component for project cards. Dialog for confirmations. Toast for notifications.

- [ ] **TASK-010** — Create utility functions and constants
  Files: `src/lib/utils.ts`, `src/lib/constants.ts`, `src/lib/formatTime.ts`
  Notes: `cn()` helper for clsx + tailwind-merge. Constants for task types, statuses, priorities with labels and colors. `formatDuration()` for time display (HH:MM:SS), `formatDate()` helpers.

---

## Phase 1: Data Model & Project Management

**Goal:** Implement the Convex database schema and build project and epic CRUD. At the end of this phase, users can create, view, edit, and archive projects with client names, and create epics within projects.

**Reference sections:** PRD §3 (Data Model), PRD §4 (API Specification — Projects, Epics), PRD §6 (FR-002, FR-003), PRD §8 (Projects List, Project Settings)

**Agent prompt:** "Implement the Convex database schema for projects, epics, tasks, and time entries. Then build the project management features: projects list page with cards, create/edit/archive projects, project settings page. Also build epic CRUD within projects. All queries and mutations must verify the authenticated user."

- [ ] **TASK-011** — Define full Convex schema
  Files: `convex/schema.ts`
  Notes: Define all tables (projects, epics, tasks, timeEntries) with fields and indexes as specified in PRD §3. Include all indexes for efficient querying.

- [ ] **TASK-012** — Implement project queries and mutations
  Files: `convex/projects.ts`
  Notes: Queries: `list` (all user projects), `get` (single project). Mutations: `create`, `update`, `archive`. All gated by auth — validate userId on every operation.

- [ ] **TASK-013** — Implement epic queries and mutations
  Files: `convex/epics.ts`
  Notes: Queries: `listByProject`, `get`. Mutations: `create`, `update`, `close`. Validate that epic's project belongs to the authenticated user.

- [ ] **TASK-014** — Build projects list page
  Files: `src/app/(dashboard)/projects/page.tsx`
  Notes: Grid of project cards. Each card shows: project name, client name, task count (can be 0 initially), status. "New Project" button opens create dialog. Empty state when no projects exist.

- [ ] **TASK-015** — Build project create/edit dialog
  Files: `src/components/projects/ProjectForm.tsx`
  Notes: Dialog with form: project name (required), client name (optional), description (optional). Used for both create and edit. Form validation — name is required.

- [ ] **TASK-016** — Build project settings page
  Files: `src/app/(dashboard)/projects/[projectId]/settings/page.tsx`
  Notes: Form to edit project name, client name, description. Archive button with confirmation dialog: "Archiving will hide this project. You can unarchive it later."

- [ ] **TASK-017** — Build epic management within projects
  Files: `src/app/(dashboard)/projects/[projectId]/epics/page.tsx`, `src/components/epics/EpicForm.tsx`, `src/components/epics/EpicList.tsx`
  Notes: List of epics for a project. Create/edit epics with name, description, optional color. Close/reopen epics. Show epic status (open/closed) and linked task count.

- [ ] **TASK-018** — Add project navigation and sidebar integration
  Files: `src/components/layout/Sidebar.tsx`, `src/components/layout/ProjectSwitcher.tsx`
  Notes: Update sidebar to list active projects below the main navigation. Clicking a project goes to its Kanban board. Add a ProjectSwitcher dropdown in the header for quick switching.

---

## Phase 2: Tasks & Kanban Board

**Goal:** Implement task CRUD and the Kanban board with drag & drop. At the end of this phase, users can create tasks with types, assign them to epics, and manage them on a visual Kanban board.

**Reference sections:** PRD §4 (API — Tasks), PRD §5 (US-003, US-004), PRD §6 (FR-004, FR-005), PRD §8 (Kanban Board, Task Detail), PRD §12 (Kanban Edge Cases)

**Agent prompt:** "Implement task CRUD with Convex mutations and build the Kanban board view for projects. The board should have four columns (To Do, In Progress, In Review, Done) with drag & drop using @hello-pangea/dnd. Task cards should show title, type badge (colored), epic tag, and priority indicator. Include a task detail view and task creation form. Handle edge cases for drag & drop."

- [ ] **TASK-019** — Implement task queries and mutations
  Files: `convex/tasks.ts`
  Notes: Queries: `listByProject`, `listByEpic`, `get`. Mutations: `create` (default status "todo", auto-assign order), `update`, `moveToColumn` (update status + order), `reorder`, `delete`. Auth-gated.

- [ ] **TASK-020** — Build TaskCard component
  Files: `src/components/kanban/TaskCard.tsx`, `src/components/tasks/TaskTypeBadge.tsx`
  Notes: Compact card showing: title (truncate at 2 lines), type badge (colored: Bug=red, Story=blue, Task=gray, Incident=orange), epic tag if assigned, priority dot (color-coded). Drag handle. Hover state with shadow elevation.

- [ ] **TASK-021** — Build KanbanColumn component
  Files: `src/components/kanban/KanbanColumn.tsx`
  Notes: Column with header (title + task count), droppable area, task cards. "Add Task" button at bottom. Empty state: muted "No tasks" text. Column header colors match status.

- [ ] **TASK-022** — Build KanbanBoard component with drag & drop
  Files: `src/components/kanban/KanbanBoard.tsx`
  Notes: Install @hello-pangea/dnd. Four columns side by side. Handle `onDragEnd`: move between columns (update status + order), reorder within column. Optimistic updates — move the card immediately, sync with Convex in background. Handle drag-to-same-position as no-op.

- [ ] **TASK-023** — Build Kanban board page
  Files: `src/app/(dashboard)/projects/[projectId]/page.tsx`
  Notes: Project Kanban board as the main project view. Project name as page title. Filter bar: filter by task type, epic, priority. Integrate KanbanBoard component with Convex data.

- [ ] **TASK-024** — Build task creation form
  Files: `src/components/tasks/TaskForm.tsx`
  Notes: Dialog form: title (required), task type (dropdown: Story, Task, Bug, Incident), epic (optional dropdown), priority (dropdown: low, medium, high, urgent), description (optional textarea). Default type: "task", default priority: "medium".

- [ ] **TASK-025** — Build task detail view
  Files: `src/app/(dashboard)/tasks/[taskId]/page.tsx`, `src/components/tasks/TaskDetail.tsx`
  Notes: Full task view. Editable title (inline), type/status/priority badges, epic selector, description textarea. Placeholder for time entries section (built in Phase 3). Total tracked time display.

- [ ] **TASK-026** — Add task filtering on Kanban board
  Files: `src/components/kanban/KanbanFilters.tsx`
  Notes: Filter bar above the board. Filter by: task type (multi-select chips), epic (dropdown), priority (multi-select chips). Filters applied client-side on the task list. Clear all filters button.

---

## Phase 3: Time Tracking

**Goal:** Implement the core time tracking system — timers, manual entry, and the active timer indicator. At the end of this phase, users can start/stop timers on tasks, see a global timer indicator, and add manual time entries. The magic moment (timer + Kanban) is achieved.

**Reference sections:** PRD §4 (API — Time Entries), PRD §5 (US-005, US-006, US-007), PRD §6 (FR-006, FR-007, FR-008, FR-014), PRD §12 (Timer Edge Cases)

**Agent prompt:** "Build the time tracking system for Velo. Implement Convex mutations for time entries (start, stop, manual create). Build the TimerControl component (play/pause/stop with live elapsed time display). Add automatic timer behavior when tasks move to 'In Progress' on the Kanban board. Build a global active timer indicator in the header. Handle edge cases: only one timer at a time, browser close with running timer, stopping timer when moving task away from In Progress."

- [ ] **TASK-027** — Implement time entry queries and mutations
  Files: `convex/timeEntries.ts`
  Notes: Queries: `listByTask`, `getActive` (running timer for user), `listByDateRange`. Mutations: `start` (auto-stop any running timer first), `stop` (compute duration), `createManual`, `update`, `delete`. Validate no negative durations. Store `projectId` denormalized for billing.

- [ ] **TASK-028** — Build TimerControl component
  Files: `src/components/timer/TimerControl.tsx`, `src/components/timer/TimerDisplay.tsx`
  Notes: Play/stop buttons. TimerDisplay shows elapsed time in HH:MM:SS format using JetBrains Mono font. Updates every second via `setInterval` (client-side, computed from startTime). Green pulsing dot when running. Compact variant for task cards, full variant for task detail.

- [ ] **TASK-029** — Build useTimer and useActiveTimer hooks
  Files: `src/hooks/useTimer.ts`, `src/hooks/useActiveTimer.ts`
  Notes: `useTimer(taskId)`: manages timer state for a specific task (start, stop, current duration). `useActiveTimer()`: subscribes to the globally active timer via `timeEntries.getActive` query. Returns active timer info or null.

- [ ] **TASK-030** — Integrate timer with task cards and detail view
  Files: `src/components/kanban/TaskCard.tsx`, `src/components/tasks/TaskDetail.tsx`
  Notes: TaskCard: show small timer indicator if this task has a running timer. TaskDetail: show full TimerControl with time entries list below it. Each time entry shows: date, duration, description, edit/delete buttons.

- [ ] **TASK-031** — Add automatic timer on Kanban drag
  Files: `src/components/kanban/KanbanBoard.tsx`, `convex/tasks.ts`
  Notes: When task moves to "In Progress": call `timeEntries.start`. When task moves away from "In Progress": call `timeEntries.stop` (if timer running for that task). Show toast: "Timer started for [task]" / "Timer stopped. [duration] logged." Handle case where another timer is already running.

- [ ] **TASK-032** — Build global active timer indicator
  Files: `src/components/layout/Header.tsx`, `src/components/timer/ActiveTimerBar.tsx`
  Notes: In the header: if a timer is running, show a compact bar with task name, project name, elapsed time, and stop button. Click task name to navigate to task detail. Green accent. Always visible across all pages.

- [ ] **TASK-033** — Build manual time entry form
  Files: `src/components/timer/ManualTimeEntry.tsx`
  Notes: Dialog form: date picker, start time, end time (or duration), optional description. Validate end > start. Used from task detail view. Show warning if entry overlaps with existing entries (but allow it).

- [ ] **TASK-034** — Handle timer edge cases
  Files: `convex/timeEntries.ts`, `src/components/kanban/KanbanBoard.tsx`
  Notes: Implement: only one active timer at a time (auto-stop previous), cross-midnight timers, delete task with running timer (stop first, then confirm), browser reconnection (timer state is server-side, client computes display from startTime).

---

## Phase 4: Billing & Dashboard

**Goal:** Build the billing summary view with aggregated hours and CSV export, and the dashboard overview page. At the end of this phase, the second magic moment is achieved — clean billing summaries at month-end.

**Reference sections:** PRD §4 (API — Billing), PRD §5 (US-008, US-009), PRD §6 (FR-009, FR-010, FR-011), PRD §8 (Billing Summary, Dashboard), PRD §12 (Billing Edge Cases)

**Agent prompt:** "Build the billing summary view and dashboard for Velo. The billing view should show aggregated tracked hours grouped by project, epic, and task type, with a date range filter and CSV export. The dashboard should show an overview: active projects, running timer, recent tasks, and today's tracked hours. Build the Convex queries for billing aggregation."

- [ ] **TASK-035** — Implement billing aggregation queries
  Files: `convex/billing.ts`
  Notes: Queries: `summary` (total hours for date range, optional project filter), `summaryByProject` (hours grouped by project), `summaryByEpic` (hours grouped by epic within project), `summaryByTaskType` (hours grouped by task type). All queries filter by userId and date range. Convert millisecond durations to hours. Exclude running timers from totals (or show separately).

- [ ] **TASK-036** — Build BillingSummary page
  Files: `src/app/(dashboard)/billing/page.tsx`, `src/components/billing/BillingSummary.tsx`
  Notes: Date range picker with presets: "This month", "Last month", "This quarter", "Custom". Project filter dropdown. Summary cards at top: total hours, number of projects, number of tasks. Below: breakdown table.

- [ ] **TASK-037** — Build BillingTable component
  Files: `src/components/billing/BillingTable.tsx`
  Notes: Expandable table. Top level: projects with total hours and client name. Expand to see: epics within project with hours. Expand further: task type breakdown. Clean, scannable layout. Alternating row backgrounds.

- [ ] **TASK-038** — Build CSV export
  Files: `src/components/billing/BillingExport.tsx`
  Notes: "Export CSV" button. Uses papaparse to generate CSV from current billing data. Columns: Project, Client, Epic, Task, Task Type, Date, Hours, Description. Filename: `velo-billing-{startDate}-{endDate}.csv`. Triggers browser download.

- [ ] **TASK-039** — Build Dashboard page
  Files: `src/app/(dashboard)/page.tsx`
  Notes: Welcome message: "Hey Dominic" (user name). Active timer widget if running. Stats row: active projects count, tasks in progress, today's tracked hours. Recent tasks list (last 10 updated, showing task name, project, type, time ago). Empty state for new users.

- [ ] **TASK-040** — Add dashboard stats queries
  Files: `convex/dashboard.ts`
  Notes: Queries: `stats` (returns active project count, in-progress task count, today's total hours), `recentTasks` (last 10 updated tasks with project info). Single efficient query where possible.

---

## Phase 5: Polish & Launch

**Goal:** Refine the UI, fix rough edges, improve performance, add keyboard shortcuts, and ensure accessibility. At the end of this phase, Velo is a polished, daily-driver tool.

**Reference sections:** PRD §7 (Non-Functional Requirements), PRD §8 (all screens — states), Vision §5 (Accessibility, Motion & Interaction), PRD §12 (General Error Handling)

**Agent prompt:** "Polish Velo for daily use. Add keyboard shortcuts for common actions. Implement proper loading states, empty states, and error handling across all pages. Ensure accessibility (WCAG AA): keyboard navigation, focus indicators, screen reader support for Kanban. Add toast notifications for all actions. Optimize performance. Fix any visual inconsistencies and ensure the design system is consistently applied."

- [ ] **TASK-041** — Add loading states and skeletons
  Files: All page components
  Notes: Add skeleton loading states for: Kanban board (skeleton columns with card placeholders), project list (skeleton cards), billing table (skeleton rows), dashboard (skeleton stat cards). Use Tailwind `animate-pulse` on gray blocks.

- [ ] **TASK-042** — Add empty states
  Files: All page and list components
  Notes: Empty states for: no projects ("Create your first project to get started"), empty Kanban board, empty column, no epics, no time entries, no billing data for period. Each with an icon, message, and CTA where appropriate.

- [ ] **TASK-043** — Add error handling and toast notifications
  Files: `src/components/ui/Toast.tsx`, all mutation call sites
  Notes: Toast system: success (green), error (red), info (blue). Show toasts for: task created, timer started/stopped, project created, errors. Auto-dismiss after 3 seconds. Stack multiple toasts.

- [ ] **TASK-044** — Add keyboard shortcuts
  Files: `src/hooks/useKeyboardShortcuts.ts`
  Notes: Global shortcuts: `N` = new task (when on Kanban), `P` = new project, `T` = toggle timer on current task, `/` = focus search/filter, `Esc` = close dialogs. Show shortcut hints in tooltips. Keyboard shortcut help dialog (`?`).

- [ ] **TASK-045** — Accessibility audit and fixes
  Files: All components
  Notes: Ensure: all buttons have aria-labels, focus indicators (2px indigo outline) visible on all interactive elements, Kanban drag & drop has keyboard alternative and aria-live announcements, color contrast meets WCAG AA (4.5:1), form inputs have associated labels, timer state announced to screen readers.

- [ ] **TASK-046** — Performance optimization
  Files: Various
  Notes: Audit: ensure Convex queries use indexes efficiently, add `React.memo` where needed (TaskCard, KanbanColumn), lazy load non-critical components (billing, settings). Verify all primary views load under 200ms. Use React DevTools profiler.

- [ ] **TASK-047** — Visual polish and consistency
  Files: All components
  Notes: Review all screens against design system. Ensure consistent spacing, typography, colors. Check hover states, transitions (100ms for color, 200ms for movement). Ensure all shadows, border radiuses match design tokens. Test in Chrome, Firefox, Safari.

- [ ] **TASK-048** — Final integration test with real data
  Files: N/A
  Notes: Create real projects: client projects (with client names) and personal projects (Aura). Create epics and tasks. Use the timer for a full work session. Generate a billing summary. Export CSV. Verify everything works end-to-end. Document any issues found.

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

**Total estimated sessions: 8–14**

### When You Hit a Problem

1. Check the Edge Cases section in the PRD (§12) — it may already have a prescribed solution.
2. If it's a Convex-specific issue, check the Convex documentation.
3. If it's a design question, refer to the Vision document's Design Direction section.
4. If it's a scope question, check PRD §14 (Out of Scope) — if it's listed there, don't build it.

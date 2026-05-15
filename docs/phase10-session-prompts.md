# Phase 10: Daily Planning (My Day) — Claude Code Session Prompts

## Session 1: Schema, Backend & Sidebar (TASK-103, TASK-104, TASK-109)

```
Read AGENTS.md and convex/_generated/ai/guidelines.md first.

Implement the backend for Velo's new "My Day" daily planning feature and add the sidebar link.

1. **TASK-103 — Schema**: Add a `dailyPlanItems` table to `convex/schema.ts` with fields: userId (Id<"users">), date (string, "YYYY-MM-DD"), taskId (optional Id<"tasks">), title (string), projectName (optional string), isCompleted (boolean, default false), order (number), createdAt (number). Add index `by_userId_date` on ["userId", "date"]. Read `convex/_generated/ai/guidelines.md` to ensure correct Convex patterns.

2. **TASK-104 — Queries & Mutations**: Create `convex/dailyPlan.ts` with:
   - Query `get`: takes date string, returns items for authenticated user sorted by order
   - Mutation `addTask`: takes taskId + date, looks up task title + project name from tasks/projects tables, checks for duplicates on same date (same taskId), appends with order = max existing order + 1
   - Mutation `addFreeText`: takes title + date, creates item without taskId, appends with order = max + 1
   - Mutation `toggleComplete`: takes itemId, flips isCompleted boolean
   - Mutation `reorder`: takes itemId + newOrder (or array of {id, order} pairs), updates order fields
   - Mutation `remove`: takes itemId, deletes the plan item (does NOT delete linked task)
   - Mutation `copyToDate`: takes fromDate + toDate, copies incomplete items from fromDate to toDate, skips items where taskId already exists on toDate
   - All mutations auth-gated (get userId from auth, verify item ownership)

3. **TASK-109 — Sidebar**: Add "My Day" to `src/components/layout/Sidebar.tsx` with Calendar icon (from Lucide). Place it between Dashboard and Projects. Active state styling same as other nav items. Link to `/my-day`.

After implementation, run `npx convex dev` to verify schema pushes cleanly and `npx tsc --noEmit` for type checking. Mark TASK-103, TASK-104, TASK-109 as [x] in docs/product-roadmap.md.
```

---

## Session 2: My Day Page, List, Quick-Add & Task Picker (TASK-105, TASK-106, TASK-107, TASK-108)

```
Read AGENTS.md first. This session builds the full My Day frontend.

The backend (convex/dailyPlan.ts) and sidebar link are already in place from Session 1.

1. **TASK-105 — My Day Page**: Create `src/app/(dashboard)/my-day/page.tsx`.
   - Date header showing formatted date like "Montag, 6. April 2026" (German locale, consistent with rest of app)
   - Left/right arrow buttons (ChevronLeft/ChevronRight from Lucide) for prev/next day
   - "Heute" pill button to jump to today
   - Default to today's date, date managed via React state (not URL param)
   - Use `date-fns` for date formatting and add/subtract days
   - Page layout: max-w-2xl, centered, consistent with app design

2. **TASK-106 — Daily Plan List with Drag & Drop**: Create `src/components/daily-plan/DailyPlanList.tsx`.
   - Uses @hello-pangea/dnd (already installed for Kanban board)
   - Each item row: drag handle (GripVertical icon), checkbox, title text, project badge (small pill if linked to task)
   - Checked items: strikethrough text, muted opacity (opacity-50), keep in their position (don't auto-sort to bottom)
   - On drag end: call `reorder` mutation with new order values
   - Empty state: "Keine Einträge für diesen Tag. Füge Tasks oder Notizen hinzu."
   - Use existing design tokens/colors from the app

3. **TASK-107 — Free-Text Quick-Add Input**: Add to DailyPlanList or create `src/components/daily-plan/QuickAddInput.tsx`.
   - Input at bottom of the list with placeholder "+ Notiz hinzufügen..."
   - Enter key submits, calls `addFreeText` mutation with current date
   - Input clears after adding, focus stays in input for rapid entry
   - Subtle styling: no heavy border, clean look

4. **TASK-108 — TaskPickerDialog**: Create `src/components/daily-plan/TaskPickerDialog.tsx`.
   - Opened by "Task hinzufügen" button (Plus icon + text)
   - Search input at top, filters all user tasks where status != "done" across all active projects
   - Each result: task title, project name badge, task type colored dot
   - Click a task → calls `addTask` mutation → toast "Zum Plan hinzugefügt"
   - Already-added tasks (for current date) shown as disabled/grayed with checkmark
   - Dialog stays open for multi-add, close via X button or Escape
   - Use existing Dialog component pattern from the app

Run `npx tsc --noEmit` to verify no TypeScript errors. Test the full flow in the browser. Mark TASK-105, TASK-106, TASK-107, TASK-108 as [x] in docs/product-roadmap.md.
```

---

## Session 3: Carry-Over, Edge Cases & Integration Test (TASK-110, TASK-111, TASK-112)

```
Read AGENTS.md first. This session adds carry-over, handles edge cases, and does a final polish pass.

The My Day page, list, quick-add, and task picker are already built from Sessions 1-2.

1. **TASK-110 — Carry-Over**: Add carry-over functionality.
   - In `src/components/daily-plan/DailyPlanList.tsx`: when viewing a day with incomplete items and it's a past date (or today with items from yesterday), show a "Auf heute übertragen" button
   - If viewing today, offer "Auf morgen übertragen" instead
   - Button calls `copyToDate` mutation from `convex/dailyPlan.ts`
   - After carry-over, show toast: "X Einträge übertragen"
   - Button disappears if no incomplete items remain or after successful carry-over
   - Handle edge case: items that already exist on target date are skipped (duplicate prevention in mutation)

2. **TASK-111 — Edge Cases & Reactive Updates**:
   - In `convex/dailyPlan.ts`: if a linked task is deleted, the plan item should show "(gelöschter Task)" — the `get` query should join with tasks table and check if taskId still exists
   - If a linked task moves to "done" on the Kanban board, the plan item should reactively show as completed — the `get` query can check the task's status field
   - When a plan item is checked and it has a taskId, optionally show a confirmation toast: "Task auch auf dem Board als erledigt markieren?" with action button
   - Duplicate prevention: `addTask` mutation must check if taskId already exists for that userId+date before inserting
   - Reorder after remove: when an item is removed, remaining items should maintain correct order (no gaps needed, just relative order matters)

3. **TASK-112 — Integration Test & Polish**:
   - Test the full flow: navigate to My Day → add free-text items → add tasks via picker → reorder via drag & drop → check items off → navigate to tomorrow → carry over incomplete items → verify items appear → go to Kanban board, complete a linked task → return to My Day, verify it shows as done
   - Visual polish: consistent spacing, colors, and typography with existing Velo design
   - Responsive check: verify My Day page works on mobile (single column, touch drag should work via @hello-pangea/dnd)
   - Run `npx tsc --noEmit` to verify no TypeScript errors
   - Mark TASK-110, TASK-111, TASK-112 as [x] in docs/product-roadmap.md
```

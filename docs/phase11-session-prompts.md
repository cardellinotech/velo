# Phase 11: Coda Time Sync — Claude Code Session Prompts

## Session 1: Schema, Backend & Coda API Integration (TASK-113, TASK-114, TASK-115, TASK-116)

```
Read AGENTS.md and convex/_generated/ai/guidelines.md first.

Implement the backend for Velo's Coda time entry sync feature.

1. **TASK-113 — Schema**: Add two tables to `convex/schema.ts`:
   - `codaSyncConfigs`: userId (Id<"users">), codaApiToken (string), codaDocId (string), codaTableId (string), columnMapping (v.object with task/notes/duration/logDate/user as v.string()), projectMappings (v.array of v.object({codaValue: v.string(), projectId: v.id("projects")})), taskMappings (v.array of v.object({codaValue: v.string(), taskId: v.id("tasks")})), lastSyncAt (v.optional(v.number())), lastSyncCount (v.optional(v.number())), createdAt (v.number()), updatedAt (v.number()). Index: `by_userId` on ["userId"].
   - `codaSyncLog`: userId (Id<"users">), configId (v.id("codaSyncConfigs")), syncedAt (v.number()), entriesImported (v.number()), entriesSkipped (v.number()), errors (v.optional(v.array(v.object({row: v.number(), message: v.string()})))), status (v.union(v.literal("success"), v.literal("partial"), v.literal("failed"))). Indexes: `by_userId`, `by_configId`, `by_configId_syncedAt`.

2. **TASK-114 — Config Queries & Mutations**: Create `convex/codaSync.ts`:
   - Query `getConfig`: returns codaSyncConfig for authenticated user (or null)
   - Query `getSyncHistory`: takes optional limit (default 10), returns codaSyncLog entries for user's configId, ordered by syncedAt desc
   - Mutation `saveConfig`: upserts config — if exists, patch it; if not, create. Auth-gated.
   - Mutation `deleteConfig`: deletes config + all related codaSyncLog entries. Auth-gated.

3. **TASK-115 — testConnection Action**: In `convex/codaSync.ts`:
   - Convex action (uses Node.js runtime for HTTP calls)
   - Takes codaApiToken, codaDocId, codaTableId
   - Calls Coda API: `GET https://coda.io/apis/v1/docs/{docId}/tables/{tableId}/columns` with `Authorization: Bearer {token}`
   - On success: returns { success: true, columns: string[] } (column names)
   - On error: returns { success: false, error: string } with specific message

4. **TASK-116 — runSync Action**: In `convex/codaSync.ts`:
   - Convex action. Loads user's config via internal query.
   - Fetches rows: `GET https://coda.io/apis/v1/docs/{docId}/tables/{tableId}/rows?useColumnNames=true` (handle pagination with pageToken)
   - For each row: extract fields using columnMapping, parse duration (handle "1.5" as 1.5h, "1:30" as 1h30m, plain number as hours), convert logDate string to timestamp, look up taskId from taskMappings by matching the Task column value
   - Duplicate detection: before creating, check if timeEntry exists with same taskId + matching date + matching duration
   - Create valid entries via internal mutation (ctx.runMutation)
   - Handle errors per-row: missing fields → skip + log, unmapped task → skip + log, deleted task → skip + log
   - After all rows: write codaSyncLog entry, update config's lastSyncAt + lastSyncCount
   - Return { imported, skipped, errors }
   - Handle Coda 429 rate limit: retry with backoff (max 3 retries)

Run `npx convex dev` to verify schema pushes. Run `npx tsc --noEmit` for type checking. Mark TASK-113, TASK-114, TASK-115, TASK-116 as [x] in docs/product-roadmap.md.
```

---

## Session 2: Settings UI, Mapping UI & Sync Execution (TASK-117, TASK-118, TASK-119)

```
Read AGENTS.md first. This session builds the full Coda Sync frontend.

The backend (convex/codaSync.ts with all queries, mutations, and actions) is already in place from Session 1.

1. **TASK-117 — Coda Sync Settings UI**: Create `src/components/settings/CodaSyncSettings.tsx` and add it as a section on the existing Settings page (`src/app/(dashboard)/settings/page.tsx`).
   - Section title: "Coda Zeiterfassung" with a Link2 icon (from Lucide)
   - Connection form: API Token (password input with eye toggle), Document ID (text input), Table ID (text input)
   - "Verbindung testen" button — calls testConnection action. On success: green checkmark + stores column names in local state. On error: red error message.
   - Column Mapping (visible after successful test): four dropdowns — "Task-Spalte", "Dauer-Spalte", "Datum-Spalte", "Notizen-Spalte" — each populated with column names from the test result
   - "Konfiguration speichern" button calls saveConfig mutation
   - If config already exists: show "Verbunden" badge + last sync info. "Konfiguration löschen" button with confirmation dialog.
   - Empty state: "Verbinde deine Coda-Zeiterfassungstabelle, um Einträge in Velo zu importieren."
   - Style consistent with existing Business Settings section

2. **TASK-118 — Project/Task Mapping UI**: Create `src/components/settings/CodaSyncMappings.tsx`.
   - Shown below the config section when a config is saved
   - "Coda-Werte laden" button — calls a helper action that fetches unique values from the Coda Task column (via Coda API rows, extract unique Task values)
   - Two-column mapping table: left column shows each unique Coda task value, right column has cascading dropdowns: first select a Velo project, then a task within that project
   - Unmapped rows highlighted with amber/yellow background
   - "Mappings speichern" button updates config's projectMappings and taskMappings
   - Helpful text: "Ordne jeden Coda-Eintrag einem Velo-Projekt und Task zu. Nicht zugeordnete Einträge werden beim Sync übersprungen."

3. **TASK-119 — Sync Execution & History**: Add to `CodaSyncSettings.tsx`:
   - "Jetzt synchronisieren" primary button (only visible when config + mappings exist)
   - While syncing: button disabled with spinner, text "Synchronisiere..."
   - On complete: toast with summary "12 Einträge importiert, 3 übersprungen"
   - Sync history below button: collapsible list from getSyncHistory query
   - Each history entry: date/time, imported count (green badge), skipped count (amber badge), error count (red badge if >0), status badge. Click to expand error details.
   - If no syncs yet: "Noch keine Synchronisierungen durchgeführt."

Run `npx tsc --noEmit` to verify no TypeScript errors. Test the full flow in the browser with a real Coda table if possible. Mark TASK-117, TASK-118, TASK-119 as [x] in docs/product-roadmap.md.
```

---

## Session 3: Edge Cases, Duplicate Detection & Integration Test (TASK-120, TASK-121)

```
Read AGENTS.md first. This session hardens the sync, handles edge cases, and does a final polish pass.

The Coda Sync backend and UI are already built from Sessions 1-2.

1. **TASK-120 — Edge Cases & Hardening**:
   - **Duplicate detection** in `convex/codaSync.ts` runSync: before creating a timeEntry, query existing entries matching taskId + date (same day) + durationMs. If found, count as skipped.
   - **Archived projects**: in runSync, check if the mapped project still exists and is not archived. If archived, skip + log "Projekt [name] ist archiviert."
   - **Deleted tasks**: check if mapped taskId still exists. If not, skip + log "Task [title] existiert nicht mehr in Velo."
   - **Coda API rate limits**: if fetch returns 429, implement retry with exponential backoff (wait 1s, 2s, 4s, max 3 retries). If still failing after retries, abort and return partial results.
   - **Missing fields**: if a Coda row is missing Task, Duration, or Log Date, skip it and log "Zeile [N]: [Feld] fehlt."
   - **Concurrent sync prevention**: add `isSyncing` flag check — the runSync action should verify no sync is currently running. If already syncing, return error "Sync läuft bereits." Reset flag on completion or error (use try/finally).
   - **Duration parsing robustness**: test with formats "1.5", "1:30", "90", "0.25", "2h", "30m". Document expected format in the settings UI help text.

2. **TASK-121 — Integration Test & Polish**:
   - Test full flow: Settings → configure Coda connection → test connection → map columns → save → fetch Coda values → map to Velo projects/tasks → save mappings → click "Sync Now" → verify time entries appear in Billing view → re-sync same data → verify no duplicates created → check sync history shows both runs
   - Test error scenarios: invalid API token → clear error message. Missing mappings → entries skipped with count. Delete config → all settings cleared.
   - Visual polish: consistent spacing, colors, badges with existing settings page design
   - Responsive check: verify settings section works on mobile (single column, inputs full width)
   - Run `npx tsc --noEmit` to verify no TypeScript errors
   - Mark TASK-120, TASK-121 as [x] in docs/product-roadmap.md
```

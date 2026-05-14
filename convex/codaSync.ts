import {
  query,
  mutation,
  action,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Shared validators
// ---------------------------------------------------------------------------

const columnMappingValidator = v.object({
  task: v.string(),
  notes: v.string(),
  duration: v.string(),
  logDate: v.string(),
  user: v.string(),
});

const taskMappingValidator = v.array(
  v.object({ codaValue: v.string(), taskId: v.id("tasks") })
);

// ---------------------------------------------------------------------------
// TASK-114 — Public queries & mutations
// ---------------------------------------------------------------------------

export const getConfig = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return (
      (await ctx.db
        .query("codaSyncConfigs")
        .withIndex("by_userId_projectId", (q) =>
          q.eq("userId", userId).eq("projectId", args.projectId)
        )
        .unique()) ?? null
    );
  },
});

export const getSyncHistory = query({
  args: { projectId: v.id("projects"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const config = await ctx.db
      .query("codaSyncConfigs")
      .withIndex("by_userId_projectId", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .unique();
    if (!config) return [];

    return ctx.db
      .query("codaSyncLog")
      .withIndex("by_configId_syncedAt", (q) =>
        q.eq("configId", config._id)
      )
      .order("desc")
      .take(args.limit ?? 10);
  },
});

export const saveConfig = mutation({
  args: {
    projectId: v.id("projects"),
    codaApiToken: v.string(),
    codaDocId: v.string(),
    codaTableId: v.string(),
    columnMapping: columnMappingValidator,
    taskMappings: taskMappingValidator,
    codaUserValue: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const existing = await ctx.db
      .query("codaSyncConfigs")
      .withIndex("by_userId_projectId", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return ctx.db.insert("codaSyncConfigs", {
      userId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteConfig = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const config = await ctx.db
      .query("codaSyncConfigs")
      .withIndex("by_userId_projectId", (q) =>
        q.eq("userId", userId).eq("projectId", args.projectId)
      )
      .unique();
    if (!config) return;

    // Delete all related sync logs
    const logs = await ctx.db
      .query("codaSyncLog")
      .withIndex("by_configId", (q) => q.eq("configId", config._id))
      .take(500);
    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(config._id);
  },
});

// ---------------------------------------------------------------------------
// TASK-115 — testConnection action
// ---------------------------------------------------------------------------

export const testConnection = action({
  args: {
    codaApiToken: v.string(),
    codaDocId: v.string(),
    codaTableId: v.string(),
  },
  handler: async (_ctx, args) => {
    const url = `https://coda.io/apis/v1/docs/${encodeURIComponent(args.codaDocId)}/tables/${encodeURIComponent(args.codaTableId)}/columns`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${args.codaApiToken}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return { success: false as const, error: "Invalid API token or insufficient permissions" };
        }
        if (res.status === 404) {
          return { success: false as const, error: "Document or table not found" };
        }
        return { success: false as const, error: `Coda API error: ${res.status}` };
      }

      const data = (await res.json()) as { items: { name: string }[] };
      const columns = data.items.map((col) => col.name);
      return { success: true as const, columns };
    } catch (err) {
      return {
        success: false as const,
        error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});

// ---------------------------------------------------------------------------
// TASK-118 — fetchUniqueCodaValues action (for mapping UI)
// ---------------------------------------------------------------------------

export const fetchUniqueCodaValues = action({
  args: {
    codaApiToken: v.string(),
    codaDocId: v.string(),
    codaTableId: v.string(),
    columnName: v.string(),
  },
  handler: async (_ctx, args) => {
    const { rows, error } = await fetchCodaRows(
      args.codaApiToken,
      args.codaDocId,
      args.codaTableId
    );
    if (error && rows.length === 0) {
      return { success: false as const, error };
    }
    const values = [
      ...new Set(
        rows
          .map((r) => String(r[args.columnName] ?? "").trim())
          .filter(Boolean)
      ),
    ].sort();
    return { success: true as const, values };
  },
});

// ---------------------------------------------------------------------------
// TASK-116 — runSync action + internal helpers
// ---------------------------------------------------------------------------

// --- Pure helpers ---

function parseDuration(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Handle "H:MM" or "HH:MM" format
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length !== 2) return null;
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return (hours * 60 + minutes) * 60 * 1000; // → ms
  }

  // Handle "Nh" format (e.g. "2h", "1.5h")
  const hMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (hMatch) {
    const hours = parseFloat(hMatch[1]);
    if (isNaN(hours) || hours < 0) return null;
    return hours * 3600000;
  }

  // Handle "Nm" format (e.g. "30m", "90m")
  const mMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*m$/i);
  if (mMatch) {
    const minutes = parseFloat(mMatch[1]);
    if (isNaN(minutes) || minutes < 0) return null;
    return minutes * 60000;
  }

  // Plain number: < 24 → hours, >= 24 → minutes
  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return null;
  return num < 24 ? num * 3600000 : num * 60000;
}

function parseLogDate(
  raw: string
): { dayStartMs: number; dayEndMs: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;

  // Normalise to start of day UTC
  const dayStart = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { dayStartMs: dayStart.getTime(), dayEndMs: dayEnd.getTime() };
}

// --- Internal queries / mutations ---

export const internalGetConfig = internalQuery({
  args: { userId: v.id("users"), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return (
      (await ctx.db
        .query("codaSyncConfigs")
        .withIndex("by_userId_projectId", (q) =>
          q.eq("userId", args.userId).eq("projectId", args.projectId)
        )
        .unique()) ?? null
    );
  },
});

export const internalGetTaskWithProject = internalQuery({
  args: { taskId: v.id("tasks"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== args.userId) return null;
    const project = await ctx.db.get(task.projectId);
    if (!project) return null;
    return {
      taskId: task._id,
      projectId: task.projectId,
      projectStatus: project.status,
      projectName: project.name,
    };
  },
});

export const internalCheckDuplicate = internalQuery({
  args: {
    userId: v.id("users"),
    taskId: v.id("tasks"),
    dayStartMs: v.number(),
    dayEndMs: v.number(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId_startTime", (q) =>
        q
          .eq("userId", args.userId)
          .gte("startTime", args.dayStartMs)
          .lte("startTime", args.dayEndMs)
      )
      .take(200);
    return entries.some(
      (e) => e.taskId === args.taskId && e.duration === args.durationMs
    );
  },
});

export const internalCreateTimeEntry = internalMutation({
  args: {
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("timeEntries", {
      taskId: args.taskId,
      projectId: args.projectId,
      userId: args.userId,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.duration,
      description: args.description,
      isManual: true,
      createdAt: Date.now(),
    });
  },
});

export const internalWriteSyncLog = internalMutation({
  args: {
    configId: v.id("codaSyncConfigs"),
    userId: v.id("users"),
    entriesImported: v.number(),
    entriesSkipped: v.number(),
    errors: v.optional(
      v.array(v.object({ row: v.number(), message: v.string() }))
    ),
    status: v.union(
      v.literal("success"),
      v.literal("partial"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("codaSyncLog", {
      userId: args.userId,
      configId: args.configId,
      syncedAt: now,
      entriesImported: args.entriesImported,
      entriesSkipped: args.entriesSkipped,
      errors: args.errors,
      status: args.status,
    });
    await ctx.db.patch(args.configId, {
      lastSyncAt: now,
      lastSyncCount: args.entriesImported,
      updatedAt: now,
    });
  },
});

// --- Concurrent sync guard ---

export const internalStartSync = internalMutation({
  args: { configId: v.id("codaSyncConfigs") },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Config not found");
    if (config.isSyncing) {
      throw new Error("Sync already in progress");
    }
    await ctx.db.patch(args.configId, { isSyncing: true });
  },
});

export const internalStopSync = internalMutation({
  args: { configId: v.id("codaSyncConfigs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, { isSyncing: false });
  },
});

// --- Main sync action ---

async function fetchCodaRows(
  token: string,
  docId: string,
  tableId: string
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  const allRows: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  const maxPages = 10;

  for (let page = 0; page < maxPages; page++) {
    let url = `https://coda.io/apis/v1/docs/${encodeURIComponent(docId)}/tables/${encodeURIComponent(tableId)}/rows?useColumnNames=true`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

    let res: Response | undefined;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 429) {
        if (retries === maxRetries) {
          return { rows: allRows, error: "Coda API Rate-Limit nach Wiederholungen überschritten" };
        }
        const retryAfterHeader = res.headers.get("Retry-After");
        const waitMs = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : Math.pow(2, retries) * 1000; // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, waitMs));
        retries++;
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      return {
        rows: allRows,
        error: `Coda API error fetching rows: ${res?.status ?? "unknown"}`,
      };
    }

    const data = (await res.json()) as {
      items: { values: Record<string, unknown> }[];
      nextPageToken?: string;
    };

    for (const item of data.items) {
      allRows.push(item.values);
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return { rows: allRows };
}

export const runSync = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Load config
    const config = await ctx.runQuery(
      internal.codaSync.internalGetConfig,
      { userId, projectId: args.projectId }
    );
    if (!config) throw new Error("No Coda sync configuration found");

    // Prevent concurrent syncs (atomic check-and-set)
    try {
      await ctx.runMutation(internal.codaSync.internalStartSync, {
        configId: config._id,
      });
    } catch {
      return {
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, message: "Synchronisierung läuft bereits." }],
      };
    }

    try {
      // Build task lookup map
      const taskMap = new Map<string, Id<"tasks">>();
      for (const mapping of config.taskMappings) {
        taskMap.set(mapping.codaValue, mapping.taskId);
      }

      // Fetch rows from Coda
      const { rows, error: fetchError } = await fetchCodaRows(
        config.codaApiToken,
        config.codaDocId,
        config.codaTableId
      );

      if (fetchError && rows.length === 0) {
        // Total failure — no rows at all
        await ctx.runMutation(internal.codaSync.internalWriteSyncLog, {
          configId: config._id,
          userId,
          entriesImported: 0,
          entriesSkipped: 0,
          errors: [{ row: 0, message: fetchError }],
          status: "failed",
        });
        return { imported: 0, skipped: 0, errors: [{ row: 0, message: fetchError }] };
      }

      let imported = 0;
      let skipped = 0;
      const errors: { row: number; message: string }[] = [];

      if (fetchError) {
        errors.push({ row: 0, message: `Partial fetch: ${fetchError}` });
      }

      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 1;
        const row = rows[i];

        // Extract values using column mapping
        const taskValue = row[config.columnMapping.task];
        const durationRaw = row[config.columnMapping.duration];
        const logDateRaw = row[config.columnMapping.logDate];
        const notes = row[config.columnMapping.notes];
        const userValue = row[config.columnMapping.user];

        // Filter by selected Coda user
        if (config.codaUserValue) {
          const userStr = typeof userValue === "string" ? userValue.trim() : "";
          if (userStr !== config.codaUserValue) {
            skipped++;
            continue;
          }
        }

        // Validate required fields
        if (!taskValue || typeof taskValue !== "string") {
          errors.push({ row: rowNum, message: "Task-Wert fehlt" });
          skipped++;
          continue;
        }
        if (
          durationRaw === undefined ||
          durationRaw === null ||
          durationRaw === ""
        ) {
          errors.push({ row: rowNum, message: "Dauer fehlt" });
          skipped++;
          continue;
        }
        if (
          logDateRaw === undefined ||
          logDateRaw === null ||
          logDateRaw === ""
        ) {
          errors.push({ row: rowNum, message: "Datum fehlt" });
          skipped++;
          continue;
        }

        // Look up task from mappings
        const taskId = taskMap.get(taskValue);
        if (!taskId) {
          errors.push({
            row: rowNum,
            message: `Nicht zugeordneter Task-Wert: "${taskValue}"`,
          });
          skipped++;
          continue;
        }

        // Verify task exists and get projectId
        const taskInfo = await ctx.runQuery(
          internal.codaSync.internalGetTaskWithProject,
          { taskId, userId }
        );
        if (!taskInfo) {
          errors.push({
            row: rowNum,
            message: `Task "${taskValue}" existiert nicht mehr in Velo.`,
          });
          skipped++;
          continue;
        }

        // Check if project is archived
        if (taskInfo.projectStatus === "archived") {
          errors.push({
            row: rowNum,
            message: `Projekt "${taskInfo.projectName}" ist archiviert.`,
          });
          skipped++;
          continue;
        }

        // Parse duration
        const durationMs = parseDuration(String(durationRaw));
        if (durationMs === null || durationMs === 0) {
          errors.push({
            row: rowNum,
            message: `Ungültiges Dauer-Format: "${durationRaw}"`,
          });
          skipped++;
          continue;
        }

        // Parse log date
        const dateInfo = parseLogDate(String(logDateRaw));
        if (!dateInfo) {
          errors.push({
            row: rowNum,
            message: `Ungültiges Datumsformat: "${logDateRaw}"`,
          });
          skipped++;
          continue;
        }

        // Check for duplicates
        const isDuplicate = await ctx.runQuery(
          internal.codaSync.internalCheckDuplicate,
          {
            userId,
            taskId,
            dayStartMs: dateInfo.dayStartMs,
            dayEndMs: dateInfo.dayEndMs,
            durationMs,
          }
        );
        if (isDuplicate) {
          skipped++;
          continue;
        }

        // Create time entry
        await ctx.runMutation(internal.codaSync.internalCreateTimeEntry, {
          taskId,
          projectId: taskInfo.projectId,
          userId,
          startTime: dateInfo.dayStartMs,
          endTime: dateInfo.dayStartMs + durationMs,
          duration: durationMs,
          description:
            notes && typeof notes === "string" ? notes : undefined,
        });
        imported++;
      }

      // Determine status
      const status: "success" | "partial" | "failed" =
        errors.length === 0
          ? "success"
          : imported > 0
            ? "partial"
            : "failed";

      // Write sync log
      await ctx.runMutation(internal.codaSync.internalWriteSyncLog, {
        configId: config._id,
        userId,
        entriesImported: imported,
        entriesSkipped: skipped,
        errors: errors.length > 0 ? errors : undefined,
        status,
      });

      return { imported, skipped, errors };
    } finally {
      await ctx.runMutation(internal.codaSync.internalStopSync, {
        configId: config._id,
      });
    }
  },
});

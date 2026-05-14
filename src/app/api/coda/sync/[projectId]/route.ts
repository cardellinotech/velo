import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { codaSyncConfigs, codaSyncLog, tasks, projects, timeEntries } from "@/lib/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { fetchCodaRows, parseDuration, parseLogDate } from "@/lib/coda-sync";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (e instanceof Error && e.message === "NOT_FOUND") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { projectId } = await params;

    // Load config
    const [config] = await db.select().from(codaSyncConfigs)
      .where(and(eq(codaSyncConfigs.userId, userId), eq(codaSyncConfigs.projectId, projectId)))
      .limit(1);

    if (!config) {
      return NextResponse.json({ error: "No Coda sync configuration found" }, { status: 404 });
    }

    // Concurrent sync guard — SELECT FOR UPDATE acquires a row lock before check-then-set
    let syncStarted = false;
    try {
      // Mutex: set isSyncing=true atomically
      try {
        await db.transaction(async (tx) => {
          const rows = await tx.execute(
            sql`SELECT is_syncing FROM coda_sync_configs WHERE id = ${config.id} FOR UPDATE`
          );
          const row = rows[0] as { is_syncing: boolean } | undefined;
          if (row?.is_syncing) throw new Error("ALREADY_SYNCING");
          await tx.update(codaSyncConfigs).set({ isSyncing: true }).where(eq(codaSyncConfigs.id, config.id));
        });
        syncStarted = true;
      } catch (e) {
        if (e instanceof Error && e.message === "ALREADY_SYNCING") {
          return NextResponse.json({
            imported: 0,
            skipped: 0,
            errors: [{ row: 0, message: "Synchronisierung läuft bereits." }],
          });
        }
        throw e;
      }

      // Build task map
      const taskMappings = (config.taskMappings as { codaValue: string; taskId: string }[]) ?? [];
      const taskMap = new Map<string, string>(taskMappings.map((m) => [m.codaValue, m.taskId]));

      // Fetch rows from Coda
      const { rows, error: fetchError } = await fetchCodaRows(
        config.codaApiToken,
        config.codaDocId,
        config.codaTableId
      );

      if (fetchError && rows.length === 0) {
        const now = Date.now();
        await db.insert(codaSyncLog).values({
          userId,
          configId: config.id,
          syncedAt: now,
          entriesImported: 0,
          entriesSkipped: 0,
          errors: [{ row: 0, message: fetchError }],
          status: "failed",
        });
        await db.update(codaSyncConfigs)
          .set({ lastSyncAt: now, lastSyncCount: 0, updatedAt: now })
          .where(eq(codaSyncConfigs.id, config.id));
        return NextResponse.json({ imported: 0, skipped: 0, errors: [{ row: 0, message: fetchError }] });
      }

      let imported = 0;
      let skipped = 0;
      const errors: { row: number; message: string }[] = [];
      if (fetchError) errors.push({ row: 0, message: `Partial fetch: ${fetchError}` });

      const columnMapping = config.columnMapping as {
        task: string;
        notes: string;
        duration: string;
        logDate: string;
        user: string;
      };

      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 1;
        const row = rows[i];

        const taskValue = row[columnMapping.task];
        const durationRaw = row[columnMapping.duration];
        const logDateRaw = row[columnMapping.logDate];
        const notes = row[columnMapping.notes];
        const userValue = row[columnMapping.user];

        // Filter by Coda user
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
        if (durationRaw === undefined || durationRaw === null || durationRaw === "") {
          errors.push({ row: rowNum, message: "Dauer fehlt" });
          skipped++;
          continue;
        }
        if (logDateRaw === undefined || logDateRaw === null || logDateRaw === "") {
          errors.push({ row: rowNum, message: "Datum fehlt" });
          skipped++;
          continue;
        }

        const taskId = taskMap.get(taskValue);
        if (!taskId) {
          errors.push({ row: rowNum, message: `Nicht zugeordneter Task-Wert: "${taskValue}"` });
          skipped++;
          continue;
        }

        // Verify task exists and belongs to user
        const [taskInfo] = await db
          .select({ taskId: tasks.id, projectId: tasks.projectId })
          .from(tasks)
          .innerJoin(projects, eq(tasks.projectId, projects.id))
          .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
          .limit(1);

        if (!taskInfo) {
          errors.push({ row: rowNum, message: `Task "${taskValue}" existiert nicht mehr in Velo.` });
          skipped++;
          continue;
        }

        // Check project status
        const [proj] = await db
          .select({ status: projects.status, name: projects.name })
          .from(projects)
          .where(eq(projects.id, taskInfo.projectId))
          .limit(1);

        if (proj?.status === "archived") {
          errors.push({ row: rowNum, message: `Projekt "${proj.name}" ist archiviert.` });
          skipped++;
          continue;
        }

        // Parse duration
        const durationMs = parseDuration(String(durationRaw));
        if (durationMs === null || durationMs === 0) {
          errors.push({ row: rowNum, message: `Ungültiges Dauer-Format: "${durationRaw}"` });
          skipped++;
          continue;
        }

        // Parse log date
        const dateInfo = parseLogDate(String(logDateRaw));
        if (!dateInfo) {
          errors.push({ row: rowNum, message: `Ungültiges Datumsformat: "${logDateRaw}"` });
          skipped++;
          continue;
        }

        // Check for duplicate (same user, task, day, and duration)
        const dupCheck = await db
          .select({ id: timeEntries.id })
          .from(timeEntries)
          .where(
            and(
              eq(timeEntries.userId, userId),
              eq(timeEntries.taskId, taskId),
              gte(timeEntries.startTime, dateInfo.dayStartMs),
              lte(timeEntries.startTime, dateInfo.dayEndMs),
              eq(timeEntries.duration, durationMs)
            )
          )
          .limit(1);

        if (dupCheck.length > 0) {
          skipped++;
          continue;
        }

        // Create time entry
        const now = Date.now();
        await db.insert(timeEntries).values({
          taskId,
          projectId: taskInfo.projectId,
          userId,
          startTime: dateInfo.dayStartMs,
          endTime: dateInfo.dayStartMs + durationMs,
          duration: durationMs,
          description: notes && typeof notes === "string" ? notes : null,
          isManual: true,
          createdAt: now,
        });
        imported++;
      }

      const status: "success" | "partial" | "failed" =
        errors.length === 0 ? "success" : imported > 0 ? "partial" : "failed";

      const syncNow = Date.now();
      await db.insert(codaSyncLog).values({
        userId,
        configId: config.id,
        syncedAt: syncNow,
        entriesImported: imported,
        entriesSkipped: skipped,
        errors: errors.length > 0 ? errors : null,
        status,
      });
      await db.update(codaSyncConfigs)
        .set({ lastSyncAt: syncNow, lastSyncCount: imported, updatedAt: syncNow })
        .where(eq(codaSyncConfigs.id, config.id));

      return NextResponse.json({ imported, skipped, errors });
    } finally {
      // Always clear isSyncing flag if we set it
      if (syncStarted) {
        await db.update(codaSyncConfigs).set({ isSyncing: false }).where(eq(codaSyncConfigs.id, config.id));
      }
    }
  } catch (e) {
    return handleError(e);
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeEntries, projects } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq, and, gte, lte } from "drizzle-orm";

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

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();

    const url = new URL(req.url);
    const startDate = Number(url.searchParams.get("startDate"));
    const endDate = Number(url.searchParams.get("endDate"));
    const filterProjectId = url.searchParams.get("projectId") ?? undefined;

    const conditions = [
      eq(timeEntries.userId, userId),
      gte(timeEntries.startTime, startDate),
      lte(timeEntries.startTime, endDate),
    ];
    if (filterProjectId) conditions.push(eq(timeEntries.projectId, filterProjectId));

    const entries = await db
      .select({
        id: timeEntries.id,
        taskId: timeEntries.taskId,
        projectId: timeEntries.projectId,
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
        duration: timeEntries.duration,
        hourlyRate: projects.hourlyRate,
        currency: projects.currency,
      })
      .from(timeEntries)
      .leftJoin(projects, eq(timeEntries.projectId, projects.id))
      .where(and(...conditions));

    const running = entries.find((e) => e.endTime === null);
    const completed = entries.filter((e) => e.endTime !== null);
    const totalDurationMs = completed.reduce(
      (sum, e) => sum + (e.duration ?? 0),
      0
    );
    const projectCount = new Set(completed.map((e) => e.projectId)).size;
    const taskCount = new Set(completed.map((e) => e.taskId)).size;

    const amountsByCurrency: Record<string, number> = {};
    for (const e of completed) {
      if (e.hourlyRate) {
        const hours = (e.duration ?? 0) / 3_600_000;
        const currency = e.currency ?? "EUR";
        amountsByCurrency[currency] =
          (amountsByCurrency[currency] ?? 0) + hours * Number(e.hourlyRate);
      }
    }
    const currencyKeys = Object.keys(amountsByCurrency);
    const totalAmount =
      currencyKeys.length === 1 ? amountsByCurrency[currencyKeys[0]] : null;
    const runningEntry = running
      ? {
          taskId: running.taskId,
          projectId: running.projectId,
          startTime: running.startTime,
          accumulatedMs: Date.now() - running.startTime,
        }
      : null;

    return NextResponse.json({
      totalDurationMs,
      totalAmount,
      amountsByCurrency,
      runningEntry,
      projectCount,
      taskCount,
    });
  } catch (e) {
    return handleError(e);
  }
}

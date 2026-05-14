import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { timeEntries, tasks, projects, epics } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq, and, gte, lte, isNotNull, asc } from "drizzle-orm";

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
      isNotNull(timeEntries.endTime),
    ];
    if (filterProjectId) conditions.push(eq(timeEntries.projectId, filterProjectId));

    const result = await db
      .select({
        id: timeEntries.id,
        taskId: timeEntries.taskId,
        taskTitle: tasks.title,
        taskType: tasks.taskType,
        epicId: tasks.epicId,
        epicName: epics.name,
        projectId: timeEntries.projectId,
        projectName: projects.name,
        clientName: projects.clientName,
        hourlyRate: projects.hourlyRate,
        currency: projects.currency,
        startTime: timeEntries.startTime,
        durationMs: timeEntries.duration,
        description: timeEntries.description,
      })
      .from(timeEntries)
      .innerJoin(tasks, eq(timeEntries.taskId, tasks.id))
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .leftJoin(epics, eq(tasks.epicId, epics.id))
      .where(and(...conditions))
      .orderBy(asc(timeEntries.startTime))
      .limit(500);

    // Return result with _id for backwards compat with existing frontend
    return NextResponse.json(result.map((e) => ({ ...e, _id: e.id })));
  } catch (e) {
    return handleError(e);
  }
}

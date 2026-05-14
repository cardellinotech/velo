import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, tasks, timeEntries } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq, and, gte, lte, isNull } from "drizzle-orm";

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

export async function GET() {
  try {
    const userId = await requireAuth();

    // Active projects count
    const activeProjects = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "active")));
    const activeProjectCount = activeProjects.length;

    // In-progress tasks count across all active projects
    let inProgressTaskCount = 0;
    for (const project of activeProjects) {
      const inProgressTasks = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(eq(tasks.projectId, project.id), eq(tasks.status, "in_progress"))
        );
      inProgressTaskCount += inProgressTasks.length;
    }

    // Today's tracked hours
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEntries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          gte(timeEntries.startTime, todayStart.getTime()),
          lte(timeEntries.startTime, todayEnd.getTime())
        )
      );

    const todayTotalDuration = todayEntries
      .filter((e) => e.endTime !== null)
      .reduce((sum, e) => sum + (e.duration ?? 0), 0);

    const hasRunningTimer =
      todayEntries.some((e) => e.endTime === null) ||
      (
        await db
          .select({ id: timeEntries.id })
          .from(timeEntries)
          .where(
            and(eq(timeEntries.userId, userId), isNull(timeEntries.endTime))
          )
          .limit(1)
      ).length > 0;

    return NextResponse.json({
      activeProjectCount,
      inProgressTaskCount,
      todayTotalDuration,
      hasRunningTimer,
    });
  } catch (e) {
    return handleError(e);
  }
}

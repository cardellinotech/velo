import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { dailyPlanItems, tasks, projects } from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";

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

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();

    const url = new URL(req.url);
    const search = url.searchParams.get("search") ?? undefined;
    const date = url.searchParams.get("date") ?? "";

    // Get all non-done tasks from active projects — single JOIN query, no N+1
    const allTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        taskType: tasks.taskType,
        projectId: tasks.projectId,
        projectName: projects.name,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(tasks.userId, userId),
          eq(projects.status, "active"),
          ne(tasks.status, "done"),
        )
      )
      .limit(500);

    // Filter by search term
    let filtered = allTasks;
    if (search && search.trim()) {
      const term = search.toLowerCase();
      filtered = allTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.projectName.toLowerCase().includes(term)
      );
    }

    // Get already-added task IDs for this date
    const planItems = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.userId, userId), eq(dailyPlanItems.date, date)))
      .limit(200);

    const addedTaskIds = new Set(
      planItems.filter((i) => i.taskId).map((i) => i.taskId!)
    );

    return NextResponse.json(
      filtered.map((t) => ({
        ...t,
        alreadyAdded: addedTaskIds.has(t.id),
      }))
    );
  } catch (e) {
    return handleError(e);
  }
}

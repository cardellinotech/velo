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

    // Get all active projects for user
    const activeProjects = await db.select().from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "active")))
      .limit(100);

    // Get all non-done tasks from those projects
    const allTasks: Array<{
      id: string;
      title: string;
      taskType: string;
      projectName: string;
      projectId: string;
    }> = [];

    for (const project of activeProjects) {
      const projectTasks = await db.select().from(tasks)
        .where(and(eq(tasks.projectId, project.id), ne(tasks.status, "done")))
        .limit(500);

      for (const task of projectTasks) {
        allTasks.push({
          id: task.id,
          title: task.title,
          taskType: task.taskType,
          projectName: project.name,
          projectId: task.projectId,
        });
      }
    }

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

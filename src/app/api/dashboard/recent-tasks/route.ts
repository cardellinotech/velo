import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq, desc } from "drizzle-orm";

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

    const recentTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        taskType: tasks.taskType,
        status: tasks.status,
        projectId: tasks.projectId,
        projectName: projects.name,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.updatedAt))
      .limit(10);

    return NextResponse.json(recentTasks);
  } catch (e) {
    return handleError(e);
  }
}

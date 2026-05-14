import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq, desc } from "drizzle-orm";

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

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();

    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, body.projectId), eq(projects.userId, userId)))
      .limit(1);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const targetStatus = body.status ?? "todo";
    const existingTasks = await db.select({ order: tasks.order })
      .from(tasks)
      .where(and(eq(tasks.projectId, body.projectId), eq(tasks.status, targetStatus)))
      .orderBy(desc(tasks.order))
      .limit(1);
    const maxOrder = existingTasks.length > 0 ? existingTasks[0].order + 1 : 0;

    const now = Date.now();
    const [task] = await db.insert(tasks).values({
      projectId: body.projectId,
      epicId: body.epicId ?? null,
      userId,
      title: body.title,
      description: body.description ?? null,
      taskType: body.taskType ?? "task",
      status: targetStatus,
      priority: body.priority ?? "medium",
      order: maxOrder,
      recurringTemplateId: body.recurringTemplateId ?? null,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return NextResponse.json(task, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

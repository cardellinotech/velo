import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { dailyPlanItems, tasks, projects } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";

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
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date query param required" }, { status: 400 });
    }

    const items = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.userId, userId), eq(dailyPlanItems.date, date)))
      .orderBy(asc(dailyPlanItems.order))
      .limit(200);

    // Enrich with task data
    const enriched = await Promise.all(
      items.map(async (item) => {
        if (item.taskId) {
          const [task] = await db
            .select({ status: tasks.status, taskType: tasks.taskType, title: tasks.title })
            .from(tasks)
            .where(eq(tasks.id, item.taskId))
            .limit(1);
          if (!task) {
            return { ...item, taskDeleted: true, taskStatus: null, taskType: null };
          }
          return {
            ...item,
            taskDeleted: false,
            taskStatus: task.status,
            taskType: task.taskType,
            title: task.title,
          };
        }
        return { ...item, taskDeleted: false, taskStatus: null, taskType: null };
      })
    );

    return NextResponse.json(enriched);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const { date, type, taskId, title: freeTitle } = body as {
      date: string;
      type: "task" | "freetext";
      taskId?: string;
      title?: string;
    };

    const now = Date.now();

    // Get existing items for order calculation
    const existing = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.userId, userId), eq(dailyPlanItems.date, date)))
      .limit(200);

    const maxOrder = existing.reduce((max, item) => Math.max(max, item.order), 0);

    if (type === "task") {
      if (!taskId) {
        return NextResponse.json({ error: "taskId required for task type" }, { status: 400 });
      }

      // Check for duplicate
      const duplicate = existing.find((item) => item.taskId === taskId);
      if (duplicate) {
        return NextResponse.json({ error: "Task already in today's plan." }, { status: 409 });
      }

      // Look up task
      const [task] = await db.select().from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .limit(1);

      if (!task) {
        throw new Error("NOT_FOUND");
      }

      // Get project name
      const [project] = await db.select({ name: projects.name }).from(projects)
        .where(eq(projects.id, task.projectId))
        .limit(1);

      const [item] = await db.insert(dailyPlanItems).values({
        userId,
        date,
        taskId,
        title: task.title,
        projectName: project?.name,
        isCompleted: task.status === "done",
        order: maxOrder + 1,
        createdAt: now,
      }).returning();

      return NextResponse.json(item);
    } else {
      // freetext
      if (!freeTitle) {
        return NextResponse.json({ error: "title required for freetext type" }, { status: 400 });
      }

      const [item] = await db.insert(dailyPlanItems).values({
        userId,
        date,
        title: freeTitle.trim(),
        isCompleted: false,
        order: maxOrder + 1,
        createdAt: now,
      }).returning();

      return NextResponse.json(item);
    }
  } catch (e) {
    return handleError(e);
  }
}

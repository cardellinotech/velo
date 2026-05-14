import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq, asc } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { taskId } = await params;
    const { sourceIndex: _sourceIndex, destinationIndex } = await req.json();

    await db.transaction(async (tx) => {
      const [task] = await tx.select().from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .limit(1);
      if (!task) throw new Error("NOT_FOUND");

      const now = Date.now();

      const columnTasks = await tx.select().from(tasks)
        .where(and(eq(tasks.projectId, task.projectId), eq(tasks.status, task.status)))
        .orderBy(asc(tasks.order));

      const filteredTasks = columnTasks.filter(t => t.id !== taskId);
      const clampedIndex = Math.max(0, Math.min(destinationIndex, filteredTasks.length));
      const reordered = [
        ...filteredTasks.slice(0, clampedIndex),
        task,
        ...filteredTasks.slice(clampedIndex),
      ];

      for (let i = 0; i < reordered.length; i++) {
        await tx.update(tasks)
          .set({ order: i, updatedAt: now })
          .where(eq(tasks.id, reordered[i].id));
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return handleError(e);
  }
}

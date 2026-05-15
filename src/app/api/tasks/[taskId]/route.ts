import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, timeEntries } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq, isNull, sql } from "drizzle-orm";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { taskId } = await params;
    const [task] = await db.select().from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    if (!task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { taskId } = await params;

    const [existing] = await db.select().from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.taskType !== undefined) patch.taskType = body.taskType;
    if (body.epicId !== undefined) patch.epicId = body.epicId;
    if (body.priority !== undefined) patch.priority = body.priority;
    if (body.status !== undefined) patch.status = body.status;

    const [updated] = await db.update(tasks)
      .set(patch)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { taskId } = await params;

    const [existing] = await db.select().from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = Date.now();
    await db.update(timeEntries)
      .set({ endTime: now, duration: sql`${now} - start_time` })
      .where(and(eq(timeEntries.taskId, taskId), isNull(timeEntries.endTime)));

    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

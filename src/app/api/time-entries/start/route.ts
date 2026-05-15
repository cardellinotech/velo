import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { tasks, timeEntries } from "@/lib/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

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

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const { taskId } = body as { taskId: string };

    // Verify task ownership
    const [task] = await db.select().from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      throw new Error("NOT_FOUND");
    }

    const now = Date.now();

    // Stop any currently running timer
    await db.update(timeEntries)
      .set({
        endTime: now,
        duration: sql`${now} - ${timeEntries.startTime}`,
      })
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endTime)));

    // Create new time entry
    const [entry] = await db.insert(timeEntries).values({
      taskId,
      projectId: task.projectId,
      userId,
      startTime: now,
      isManual: false,
      createdAt: now,
    }).returning();

    return NextResponse.json(entry);
  } catch (e) {
    return handleError(e);
  }
}

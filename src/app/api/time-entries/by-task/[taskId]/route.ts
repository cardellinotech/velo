import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { tasks, timeEntries } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";

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
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { taskId } = await params;

    // Verify user owns the task
    const [task] = await db.select().from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      return NextResponse.json([]);
    }

    const entries = await db.select().from(timeEntries)
      .where(eq(timeEntries.taskId, taskId))
      .orderBy(desc(timeEntries.startTime))
      .limit(200);

    return NextResponse.json(entries);
  } catch (e) {
    return handleError(e);
  }
}

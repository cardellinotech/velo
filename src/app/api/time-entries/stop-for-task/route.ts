import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { timeEntries } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";

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

    // Find running timer for this task
    const [activeEntry] = await db.select().from(timeEntries)
      .where(
        and(
          eq(timeEntries.taskId, taskId),
          eq(timeEntries.userId, userId),
          isNull(timeEntries.endTime)
        )
      )
      .limit(1);

    if (!activeEntry) {
      return NextResponse.json({ stopped: false });
    }

    const now = Date.now();
    const [updated] = await db.update(timeEntries)
      .set({
        endTime: now,
        duration: now - activeEntry.startTime,
      })
      .where(eq(timeEntries.id, activeEntry.id))
      .returning();

    return NextResponse.json({ stopped: true, entry: updated });
  } catch (e) {
    return handleError(e);
  }
}

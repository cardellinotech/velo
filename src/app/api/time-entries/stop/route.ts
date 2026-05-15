import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { timeEntries } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

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
    const { timeEntryId } = body as { timeEntryId: string };

    // Verify user owns the entry
    const [entry] = await db.select().from(timeEntries)
      .where(and(eq(timeEntries.id, timeEntryId), eq(timeEntries.userId, userId)))
      .limit(1);

    if (!entry) {
      throw new Error("NOT_FOUND");
    }

    if (entry.endTime !== null && entry.endTime !== undefined) {
      return NextResponse.json({ error: "Timer already stopped" }, { status: 400 });
    }

    const now = Date.now();
    const [updated] = await db.update(timeEntries)
      .set({
        endTime: now,
        duration: now - entry.startTime,
      })
      .where(eq(timeEntries.id, timeEntryId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

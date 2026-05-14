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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { entryId } = await params;

    const [entry] = await db.select().from(timeEntries)
      .where(and(eq(timeEntries.id, entryId), eq(timeEntries.userId, userId)))
      .limit(1);

    if (!entry) {
      throw new Error("NOT_FOUND");
    }

    const body = await req.json();
    const { startTime, endTime, description } = body as {
      startTime?: number;
      endTime?: number;
      description?: string;
    };

    const patch: {
      startTime?: number;
      endTime?: number;
      duration?: number;
      description?: string;
    } = {};

    if (startTime !== undefined) patch.startTime = startTime;
    if (endTime !== undefined) patch.endTime = endTime;
    if (description !== undefined) patch.description = description;

    // Recalculate duration if startTime or endTime changes
    const newStart = startTime ?? entry.startTime;
    const newEnd = endTime ?? entry.endTime;
    if (newEnd !== null && newEnd !== undefined) {
      patch.duration = newEnd - newStart;
    }

    const [updated] = await db.update(timeEntries)
      .set(patch)
      .where(eq(timeEntries.id, entryId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { entryId } = await params;

    const [entry] = await db.select().from(timeEntries)
      .where(and(eq(timeEntries.id, entryId), eq(timeEntries.userId, userId)))
      .limit(1);

    if (!entry) {
      throw new Error("NOT_FOUND");
    }

    await db.delete(timeEntries).where(eq(timeEntries.id, entryId));

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

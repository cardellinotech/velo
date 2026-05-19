import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { timeBlocks, projects } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { updateGoogleEvent, deleteGoogleEvent } from "@/lib/googleCalendar";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(timeBlocks)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    const body = await req.json() as Partial<{
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      projectId: string | null;
      taskId: string | null;
      color: string | null;
      notes: string | null;
    }>;

    const effectiveStartTime = body.startTime ?? existing.startTime;
    const effectiveEndTime = body.endTime ?? existing.endTime;

    if (effectiveStartTime >= effectiveEndTime) {
      return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
    }

    const now = Date.now();

    const updateData: Partial<typeof timeBlocks.$inferInsert> = { updatedAt: now };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.startTime !== undefined) updateData.startTime = body.startTime;
    if (body.endTime !== undefined) updateData.endTime = body.endTime;
    if ("projectId" in body) updateData.projectId = body.projectId ?? null;
    if ("taskId" in body) updateData.taskId = body.taskId ?? null;
    if ("color" in body) updateData.color = body.color ?? null;
    if ("notes" in body) updateData.notes = body.notes ?? null;

    const [updated] = await db
      .update(timeBlocks)
      .set(updateData)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .returning();

    // Sync to Google Calendar if the block has a googleEventId
    if (updated.googleEventId) {
      try {
        await updateGoogleEvent(userId, updated.googleEventId, {
          title: updated.title,
          date: updated.date,
          startTime: updated.startTime,
          endTime: updated.endTime,
        });
      } catch (calErr) {
        console.error("[time-blocks PUT] Google Calendar sync failed:", calErr);
      }
    }

    // Enrich with project name
    let projectName: string | null = null;
    if (updated.projectId) {
      const [proj] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, updated.projectId))
        .limit(1);
      projectName = proj?.name ?? null;
    }

    return NextResponse.json({ ...updated, projectName });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(timeBlocks)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)))
      .limit(1);

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    // Sync deletion to Google Calendar if the block has a googleEventId
    if (existing.googleEventId) {
      try {
        await deleteGoogleEvent(userId, existing.googleEventId);
      } catch (calErr) {
        console.error("[time-blocks DELETE] Google Calendar sync failed:", calErr);
      }
    }

    await db
      .delete(timeBlocks)
      .where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId)));

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleError(e);
  }
}

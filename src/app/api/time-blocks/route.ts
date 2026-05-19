import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { timeBlocks, projects } from "@/lib/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { createGoogleEvent } from "@/lib/googleCalendar";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const url = new URL(req.url);
    const weekStart = url.searchParams.get("weekStart");

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart query param required" }, { status: 400 });
    }

    // Calculate weekEnd: weekStart + 7 days
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    const weekEnd = endDate.toISOString().slice(0, 10);

    const blocks = await db
      .select({
        id: timeBlocks.id,
        userId: timeBlocks.userId,
        title: timeBlocks.title,
        date: timeBlocks.date,
        startTime: timeBlocks.startTime,
        endTime: timeBlocks.endTime,
        projectId: timeBlocks.projectId,
        taskId: timeBlocks.taskId,
        color: timeBlocks.color,
        googleEventId: timeBlocks.googleEventId,
        notes: timeBlocks.notes,
        createdAt: timeBlocks.createdAt,
        updatedAt: timeBlocks.updatedAt,
        projectName: projects.name,
      })
      .from(timeBlocks)
      .leftJoin(projects, eq(timeBlocks.projectId, projects.id))
      .where(
        and(
          eq(timeBlocks.userId, userId),
          gte(timeBlocks.date, weekStart),
          lt(timeBlocks.date, weekEnd)
        )
      );

    return NextResponse.json(blocks);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json() as {
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      projectId?: string;
      taskId?: string;
      color?: string;
      notes?: string;
      syncToCalendar?: boolean;
    };

    const { title, date, startTime, endTime, projectId, taskId, color, notes, syncToCalendar } = body;

    if (!title || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "title, date, startTime, endTime are required" }, { status: 400 });
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: "startTime must be before endTime" }, { status: 400 });
    }

    const now = Date.now();

    const [block] = await db
      .insert(timeBlocks)
      .values({
        userId,
        title,
        date,
        startTime,
        endTime,
        projectId: projectId ?? null,
        taskId: taskId ?? null,
        color: color ?? null,
        googleEventId: null,
        notes: notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Sync to Google Calendar if requested
    if (syncToCalendar === true) {
      try {
        const googleEventId = await createGoogleEvent(userId, { title, date, startTime, endTime, notes });
        if (googleEventId) {
          await db
            .update(timeBlocks)
            .set({ googleEventId, updatedAt: Date.now() })
            .where(eq(timeBlocks.id, block.id));
          block.googleEventId = googleEventId;
        }
      } catch (calErr) {
        // Log but don't fail the request — calendar sync is optional
        console.error("[time-blocks POST] Google Calendar sync failed:", calErr);
      }
    }

    // Enrich with project name
    let projectName: string | null = null;
    if (block.projectId) {
      const [proj] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, block.projectId))
        .limit(1);
      projectName = proj?.name ?? null;
    }

    return NextResponse.json({ ...block, projectName });
  } catch (e) {
    return handleError(e);
  }
}

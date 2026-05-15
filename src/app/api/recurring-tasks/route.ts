import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { projects, recurringTaskTemplates } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { computeNextDueDate } from "@/lib/recurrence";

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
    const projectId = url.searchParams.get("projectId") ?? undefined;

    if (projectId) {
      // Verify user owns the project
      const [project] = await db.select().from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
        .limit(1);

      if (!project) {
        return NextResponse.json([]);
      }

      const templates = await db.select().from(recurringTaskTemplates)
        .where(eq(recurringTaskTemplates.projectId, projectId))
        .limit(500);

      return NextResponse.json(templates);
    }

    const templates = await db.select().from(recurringTaskTemplates)
      .where(eq(recurringTaskTemplates.userId, userId))
      .limit(500);

    return NextResponse.json(templates);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const {
      projectId,
      epicId,
      title,
      description,
      taskType,
      priority,
      recurrence,
      dayOfWeek,
      dayOfMonth,
    } = body as {
      projectId: string;
      epicId?: string;
      title: string;
      description?: string;
      taskType: "story" | "task" | "bug" | "incident";
      priority: "low" | "medium" | "high" | "urgent";
      recurrence: "daily" | "weekly" | "monthly";
      dayOfWeek?: number;
      dayOfMonth?: number;
    };

    // Verify project ownership
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (!project) {
      throw new Error("NOT_FOUND");
    }

    if (recurrence === "monthly" && dayOfMonth !== undefined && dayOfMonth > 28) {
      return NextResponse.json(
        { error: "dayOfMonth must be 28 or less to avoid month-length issues." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const nextDueDate = computeNextDueDate(recurrence, dayOfWeek, dayOfMonth);

    const [template] = await db.insert(recurringTaskTemplates).values({
      userId,
      projectId,
      epicId,
      title,
      description,
      taskType,
      priority,
      recurrence,
      dayOfWeek,
      dayOfMonth,
      nextDueDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json(template);
  } catch (e) {
    return handleError(e);
  }
}

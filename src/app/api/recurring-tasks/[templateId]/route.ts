import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { recurringTaskTemplates } from "@/lib/schema";
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { templateId } = await params;

    const [template] = await db.select().from(recurringTaskTemplates)
      .where(
        and(
          eq(recurringTaskTemplates.id, templateId),
          eq(recurringTaskTemplates.userId, userId)
        )
      )
      .limit(1);

    if (!template) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json(template);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { templateId } = await params;

    const [template] = await db.select().from(recurringTaskTemplates)
      .where(
        and(
          eq(recurringTaskTemplates.id, templateId),
          eq(recurringTaskTemplates.userId, userId)
        )
      )
      .limit(1);

    if (!template) {
      throw new Error("NOT_FOUND");
    }

    const body = await req.json();
    const { title, description, taskType, priority, epicId, recurrence, dayOfWeek, dayOfMonth } =
      body as {
        title?: string;
        description?: string | null;
        taskType?: "story" | "task" | "bug" | "incident";
        priority?: "low" | "medium" | "high" | "urgent";
        epicId?: string;
        recurrence?: "daily" | "weekly" | "monthly";
        dayOfWeek?: number;
        dayOfMonth?: number;
      };

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description ?? null;
    if (taskType !== undefined) updates.taskType = taskType;
    if (priority !== undefined) updates.priority = priority;
    if (epicId !== undefined) updates.epicId = epicId;
    if (recurrence !== undefined) updates.recurrence = recurrence;
    if (dayOfWeek !== undefined) updates.dayOfWeek = dayOfWeek;
    if (dayOfMonth !== undefined) updates.dayOfMonth = dayOfMonth;

    const scheduleChanged =
      recurrence !== undefined ||
      dayOfWeek !== undefined ||
      dayOfMonth !== undefined;

    if (scheduleChanged) {
      updates.nextDueDate = computeNextDueDate(
        (recurrence ?? template.recurrence) as "daily" | "weekly" | "monthly",
        dayOfWeek ?? template.dayOfWeek ?? undefined,
        dayOfMonth ?? template.dayOfMonth ?? undefined
      );
    }

    const [updated] = await db.update(recurringTaskTemplates)
      .set(updates)
      .where(and(eq(recurringTaskTemplates.id, templateId), eq(recurringTaskTemplates.userId, userId)))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { templateId } = await params;

    const [template] = await db.select().from(recurringTaskTemplates)
      .where(
        and(
          eq(recurringTaskTemplates.id, templateId),
          eq(recurringTaskTemplates.userId, userId)
        )
      )
      .limit(1);

    if (!template) {
      throw new Error("NOT_FOUND");
    }

    await db.delete(recurringTaskTemplates).where(and(eq(recurringTaskTemplates.id, templateId), eq(recurringTaskTemplates.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

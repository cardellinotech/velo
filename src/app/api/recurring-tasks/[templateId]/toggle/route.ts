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

export async function POST(
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

    const resuming = !template.isActive;
    const updates: Record<string, unknown> = {
      isActive: resuming,
      updatedAt: Date.now(),
    };

    if (resuming) {
      updates.nextDueDate = computeNextDueDate(
        template.recurrence,
        template.dayOfWeek ?? undefined,
        template.dayOfMonth ?? undefined
      );
    }

    const [updated] = await db.update(recurringTaskTemplates)
      .set(updates)
      .where(eq(recurringTaskTemplates.id, templateId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

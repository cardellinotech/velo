import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { dailyPlanItems } from "@/lib/schema";
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { itemId } = await params;

    const [item] = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.id, itemId), eq(dailyPlanItems.userId, userId)))
      .limit(1);

    if (!item) {
      throw new Error("NOT_FOUND");
    }

    const newIsCompleted = !item.isCompleted;

    await db.update(dailyPlanItems)
      .set({ isCompleted: newIsCompleted })
      .where(eq(dailyPlanItems.id, itemId));

    return NextResponse.json({ taskId: item.taskId, isCompleted: newIsCompleted });
  } catch (e) {
    return handleError(e);
  }
}

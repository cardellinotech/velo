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

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const { fromDate, toDate } = body as { fromDate: string; toDate: string };

    // Get incomplete items from source date
    const sourceItems = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.userId, userId), eq(dailyPlanItems.date, fromDate)))
      .limit(200);

    const incompleteItems = sourceItems.filter((item) => !item.isCompleted);

    // Get existing items on target date (for duplicate check and order)
    const targetItems = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.userId, userId), eq(dailyPlanItems.date, toDate)))
      .limit(200);

    const existingTaskIds = new Set(
      targetItems.filter((i) => i.taskId).map((i) => i.taskId!)
    );

    let maxOrder = targetItems.reduce((max, item) => Math.max(max, item.order), 0);
    let copiedCount = 0;
    const now = Date.now();

    for (const item of incompleteItems) {
      // Skip if task already exists on target date
      if (item.taskId && existingTaskIds.has(item.taskId)) {
        continue;
      }

      maxOrder += 1;
      await db.insert(dailyPlanItems).values({
        userId,
        date: toDate,
        taskId: item.taskId,
        title: item.title,
        projectName: item.projectName,
        isCompleted: false,
        order: maxOrder,
        createdAt: now,
      });
      copiedCount++;
    }

    return NextResponse.json({ copiedCount });
  } catch (e) {
    return handleError(e);
  }
}

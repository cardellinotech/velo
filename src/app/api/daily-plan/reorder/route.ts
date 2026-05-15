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
    const { itemId, newOrder } = body as { itemId: string; newOrder: number };

    const [item] = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.id, itemId), eq(dailyPlanItems.userId, userId)))
      .limit(1);

    if (!item) {
      throw new Error("NOT_FOUND");
    }

    // Get all items for this date
    const items = await db.select().from(dailyPlanItems)
      .where(and(eq(dailyPlanItems.userId, userId), eq(dailyPlanItems.date, item.date)))
      .limit(200);

    const sorted = [...items].sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((i) => i.id === itemId);
    const newIndex = newOrder;

    if (oldIndex === -1 || newIndex < 0 || newIndex >= sorted.length) {
      return NextResponse.json({ success: false });
    }

    // Remove item from old position and insert at new
    const reordered = [...sorted];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update all orders
    await Promise.all(
      reordered.map((planItem, index) =>
        db.update(dailyPlanItems)
          .set({ order: index })
          .where(eq(dailyPlanItems.id, planItem.id))
      )
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { habitLogs, habits } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (e instanceof Error && e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json() as {
      habitId: string;
      date: string;
      isCompleted: boolean;
    };

    if (!body.habitId || !body.date) {
      return NextResponse.json({ error: "habitId and date are required" }, { status: 400 });
    }

    // Ownership check
    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, body.habitId), eq(habits.userId, userId)))
      .limit(1);

    if (!habit) throw new Error("NOT_FOUND");

    const [log] = await db
      .insert(habitLogs)
      .values({
        userId,
        habitId: body.habitId,
        date: body.date,
        isCompleted: body.isCompleted,
        createdAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: [habitLogs.habitId, habitLogs.date],
        set: { isCompleted: sql`excluded.is_completed` },
      })
      .returning();

    return NextResponse.json(log);
  } catch (e) {
    return handleError(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { weeklyGoals } from "@/lib/schema";
import type { WeeklyGoal } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

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

    const [record] = await db
      .select()
      .from(weeklyGoals)
      .where(and(eq(weeklyGoals.userId, userId), eq(weeklyGoals.weekStart, weekStart)))
      .limit(1);

    return NextResponse.json(record ?? null);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json() as {
      weekStart: string;
      goals?: WeeklyGoal[];
      weekReview?: string;
    };

    const { weekStart, goals, weekReview } = body;

    if (!weekStart) {
      return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
    }

    const now = Date.now();

    // Fetch existing record to preserve fields not being updated
    const [existing] = await db
      .select()
      .from(weeklyGoals)
      .where(and(eq(weeklyGoals.userId, userId), eq(weeklyGoals.weekStart, weekStart)))
      .limit(1);

    const mergedGoals = goals !== undefined ? goals : (existing?.goals ?? []);
    const mergedReview = weekReview !== undefined ? weekReview : (existing?.weekReview ?? null);
    const reviewedAt = weekReview !== undefined ? now : (existing?.reviewedAt ?? null);

    const [result] = await db
      .insert(weeklyGoals)
      .values({
        userId,
        weekStart,
        goals: mergedGoals,
        weekReview: mergedReview,
        reviewedAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [weeklyGoals.userId, weeklyGoals.weekStart],
        set: {
          goals: mergedGoals,
          weekReview: mergedReview,
          reviewedAt,
          updatedAt: now,
        },
      })
      .returning();

    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

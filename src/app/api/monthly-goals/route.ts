import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { monthlyGoals } from "@/lib/schema";
import type { MonthlyGoal } from "@/lib/schema";
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

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const url = new URL(req.url);
    const month = url.searchParams.get("month");

    if (!month) {
      return NextResponse.json({ error: "month query param required" }, { status: 400 });
    }

    const [record] = await db
      .select()
      .from(monthlyGoals)
      .where(and(eq(monthlyGoals.userId, userId), eq(monthlyGoals.month, month)))
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
      month: string;
      goals?: MonthlyGoal[];
      monthReview?: string;
    };

    const { month, goals, monthReview } = body;

    if (!month) {
      return NextResponse.json({ error: "month is required" }, { status: 400 });
    }

    const now = Date.now();

    // Fetch existing record to preserve fields not being updated
    const [existing] = await db
      .select()
      .from(monthlyGoals)
      .where(and(eq(monthlyGoals.userId, userId), eq(monthlyGoals.month, month)))
      .limit(1);

    const mergedGoals = goals !== undefined ? goals : (existing?.goals ?? []);
    const mergedReview = monthReview !== undefined ? monthReview : (existing?.monthReview ?? null);
    const reviewedAt = monthReview !== undefined ? now : (existing?.reviewedAt ?? null);

    const [result] = await db
      .insert(monthlyGoals)
      .values({
        userId,
        month,
        goals: mergedGoals,
        monthReview: mergedReview,
        reviewedAt,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [monthlyGoals.userId, monthlyGoals.month],
        set: {
          goals: mergedGoals,
          monthReview: mergedReview,
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

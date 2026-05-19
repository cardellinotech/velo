import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { habits, habitLogs } from "@/lib/schema";
import { eq, and, asc, desc, gte, lte, sql } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (e instanceof Error && e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const allHabits = await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
      .orderBy(asc(habits.order));

    // Compute streak and todayCompleted for each habit
    // Get all logs for the last 90 days for all habits
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const allLogs = allHabits.length > 0
      ? await db
          .select()
          .from(habitLogs)
          .where(
            and(
              eq(habitLogs.userId, userId),
              gte(habitLogs.date, ninetyDaysAgo),
              lte(habitLogs.date, date)
            )
          )
          .orderBy(desc(habitLogs.date))
      : [];

    // Build a map: habitId -> logs sorted by date DESC
    const logsByHabit = new Map<string, typeof allLogs>();
    for (const log of allLogs) {
      const existing = logsByHabit.get(log.habitId) ?? [];
      existing.push(log);
      logsByHabit.set(log.habitId, existing);
    }

    // Yesterday
    const yesterday = new Date(new Date(date).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const result = allHabits.map((habit) => {
      const logs = logsByHabit.get(habit.id) ?? [];

      // todayCompleted: find log for the given date
      const todayLog = logs.find((l) => l.date === date);
      const todayCompleted = todayLog?.isCompleted ?? false;

      // streak: consecutive isCompleted=true days backwards from yesterday
      // Sort logs DESC by date (already sorted)
      const logsBeforeToday = logs.filter((l) => l.date <= yesterday).sort((a, b) => b.date.localeCompare(a.date));

      let streak = 0;
      // We walk day by day from yesterday backwards
      // Use log lookup for simplicity: just count consecutive completed logs
      let currentDate = yesterday;
      for (const log of logsBeforeToday) {
        if (log.date === currentDate && log.isCompleted) {
          streak++;
          // Step back one day
          const d = new Date(currentDate);
          d.setDate(d.getDate() - 1);
          currentDate = d.toISOString().slice(0, 10);
        } else if (log.date === currentDate && !log.isCompleted) {
          break;
        }
        // If no log for that date, streak is broken
        if (log.date < currentDate) break;
      }

      return {
        ...habit,
        todayCompleted,
        streak,
      };
    });

    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json() as {
      name: string;
      description?: string;
      color?: string;
      targetFrequency?: string;
      customDays?: number[];
    };

    if (!body.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Compute max order
    const existing = await db
      .select({ order: habits.order })
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(desc(habits.order))
      .limit(1);

    const maxOrder = existing[0]?.order ?? -1;

    const [created] = await db
      .insert(habits)
      .values({
        userId,
        name: body.name,
        description: body.description ?? null,
        color: body.color ?? "#6366F1",
        targetFrequency: body.targetFrequency ?? "daily",
        customDays: body.customDays ?? null,
        isActive: true,
        order: maxOrder + 1,
        createdAt: Date.now(),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

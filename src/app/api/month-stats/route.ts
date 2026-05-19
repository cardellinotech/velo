import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { timeEntries, invoices, tasks } from "@/lib/schema";
import { eq, and, gte, lte, isNotNull, countDistinct, count, sql } from "drizzle-orm";

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

    // Compute Unix ms range for the month
    const startMs = new Date(month + "-01").getTime();
    const [year, mon] = month.split("-").map(Number);
    const nextMonthDate = mon === 12
      ? new Date(year + 1, 0, 1)
      : new Date(year, mon, 1);
    const endMs = nextMonthDate.getTime() - 1;

    // Query time entries in range
    const timeEntriesInMonth = await db
      .select({
        startTime: timeEntries.startTime,
        endTime: timeEntries.endTime,
      })
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          gte(timeEntries.startTime, startMs),
          lte(timeEntries.startTime, endMs),
          isNotNull(timeEntries.endTime),
        )
      );

    const totalHours = timeEntriesInMonth.reduce((sum, entry) => {
      if (entry.endTime == null) return sum;
      return sum + (entry.endTime - entry.startTime) / 3_600_000;
    }, 0);

    // Query paid invoices in range
    const paidInvoices = await db
      .select({ total: invoices.total })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, "paid"),
          gte(invoices.createdAt, startMs),
          lte(invoices.createdAt, endMs),
        )
      );

    const totalRevenue = paidInvoices.reduce((sum, inv) => {
      return sum + parseFloat(inv.total ?? "0");
    }, 0);

    // Query tasks in range
    const tasksInMonth = await db
      .select({
        status: tasks.status,
        projectId: tasks.projectId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.createdAt, startMs),
          lte(tasks.createdAt, endMs),
        )
      );

    const totalTasks = tasksInMonth.length;
    const completedTasks = tasksInMonth.filter((t) => t.status === "done").length;
    const activeProjects = new Set(tasksInMonth.map((t) => t.projectId)).size;

    return NextResponse.json({
      totalHours: Math.round(totalHours * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTasks,
      completedTasks,
      activeProjects,
    });
  } catch (e) {
    return handleError(e);
  }
}

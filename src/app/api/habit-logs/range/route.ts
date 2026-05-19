import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { habitLogs } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";

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
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
    }

    const logs = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.userId, userId),
          gte(habitLogs.date, startDate),
          lte(habitLogs.date, endDate)
        )
      );

    return NextResponse.json(logs);
  } catch (e) {
    return handleError(e);
  }
}

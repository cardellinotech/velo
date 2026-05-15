import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { timeEntries } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";

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
    const startDate = Number(url.searchParams.get("startDate"));
    const endDate = Number(url.searchParams.get("endDate"));
    const projectId = url.searchParams.get("projectId") ?? undefined;

    const conditions = [
      eq(timeEntries.userId, userId),
      gte(timeEntries.startTime, startDate),
      lte(timeEntries.startTime, endDate),
    ];

    if (projectId) {
      conditions.push(eq(timeEntries.projectId, projectId));
    }

    const entries = await db.select().from(timeEntries)
      .where(and(...conditions))
      .limit(500);

    return NextResponse.json(entries);
  } catch (e) {
    return handleError(e);
  }
}

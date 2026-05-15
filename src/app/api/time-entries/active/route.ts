import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { timeEntries } from "@/lib/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

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

export async function GET() {
  try {
    const userId = await requireAuth();

    const recentEntries = await db.select().from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endTime)))
      .orderBy(desc(timeEntries.startTime))
      .limit(1);

    return NextResponse.json(recentEntries[0] ?? null);
  } catch (e) {
    return handleError(e);
  }
}

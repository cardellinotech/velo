import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq, desc } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET() {
  try {
    const userId = await requireAuth();
    const result = await db.select().from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, "active")))
      .orderBy(desc(projects.createdAt))
      .limit(200);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

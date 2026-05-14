import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, epics } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ epicId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { epicId } = await params;

    const [epic] = await db.select().from(epics)
      .where(and(eq(epics.id, epicId), eq(epics.userId, userId)))
      .limit(1);
    if (!epic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await db.select().from(tasks)
      .where(eq(tasks.epicId, epicId))
      .limit(500);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, recurringTaskTemplates } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq } from "drizzle-orm";

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

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { projectId } = await params;

    const [existing] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = Date.now();
    const [updated] = await db.update(projects)
      .set({ status: "archived", updatedAt: now })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();

    await db.update(recurringTaskTemplates)
      .set({ isActive: false, updatedAt: now })
      .where(and(eq(recurringTaskTemplates.projectId, projectId), eq(recurringTaskTemplates.isActive, true)));

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

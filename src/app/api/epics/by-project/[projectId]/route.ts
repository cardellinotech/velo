import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { epics, projects } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq, desc } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { projectId } = await params;

    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await db.select().from(epics)
      .where(eq(epics.projectId, projectId))
      .orderBy(desc(epics.createdAt))
      .limit(200);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
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
    return NextResponse.json(project);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: Request,
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

    const body = await req.json();
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.clientName !== undefined) patch.clientName = body.clientName;
    if (body.description !== undefined) patch.description = body.description;
    if (body.hourlyRate !== undefined) patch.hourlyRate = body.hourlyRate;
    if (body.currency !== undefined) patch.currency = body.currency;
    if (body.status !== undefined) patch.status = body.status;

    const [updated] = await db.update(projects)
      .set(patch)
      .where(eq(projects.id, projectId))
      .returning();
    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

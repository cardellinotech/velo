import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { epics } from "@/lib/schema";
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
    return NextResponse.json(epic);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ epicId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { epicId } = await params;

    const [existing] = await db.select().from(epics)
      .where(and(eq(epics.id, epicId), eq(epics.userId, userId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.color !== undefined) patch.color = body.color;
    if (body.status !== undefined) patch.status = body.status;

    const [updated] = await db.update(epics)
      .set(patch)
      .where(eq(epics.id, epicId))
      .returning();
    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

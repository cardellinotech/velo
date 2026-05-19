import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { habits } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (e instanceof Error && e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .limit(1);

    if (!existing) throw new Error("NOT_FOUND");

    const body = await req.json() as {
      name?: string;
      description?: string;
      color?: string;
      targetFrequency?: string;
      customDays?: number[] | null;
      isActive?: boolean;
      order?: number;
    };

    const updates: Partial<typeof habits.$inferInsert> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.color !== undefined) updates.color = body.color;
    if (body.targetFrequency !== undefined) updates.targetFrequency = body.targetFrequency;
    if (body.customDays !== undefined) updates.customDays = body.customDays;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.order !== undefined) updates.order = body.order;

    const [updated] = await db
      .update(habits)
      .set(updates)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .limit(1);

    if (!existing) throw new Error("NOT_FOUND");

    await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)));

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleError(e);
  }
}

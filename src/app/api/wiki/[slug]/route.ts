import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { wikiPages } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

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
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await requireAuth();
    const { slug } = await params;

    const [page] = await db
      .select()
      .from(wikiPages)
      .where(and(eq(wikiPages.userId, userId), eq(wikiPages.slug, slug)))
      .limit(1);

    if (!page) {
      throw new Error("NOT_FOUND");
    }

    return NextResponse.json(page);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await requireAuth();
    const { slug } = await params;

    const [existing] = await db
      .select()
      .from(wikiPages)
      .where(and(eq(wikiPages.userId, userId), eq(wikiPages.slug, slug)))
      .limit(1);

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    const body = await req.json() as {
      title?: string;
      content?: string;
      tags?: string[];
      parentPageId?: string;
    };

    if (body.title !== undefined && !String(body.title).trim()) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }

    const updates: Partial<typeof existing> = {
      updatedAt: Date.now(),
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;
    if (body.tags !== undefined) updates.tags = body.tags;
    if ("parentPageId" in body) updates.parentPageId = body.parentPageId ?? null;

    const [updated] = await db
      .update(wikiPages)
      .set(updates)
      .where(and(eq(wikiPages.userId, userId), eq(wikiPages.slug, slug)))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await requireAuth();
    const { slug } = await params;

    const [existing] = await db
      .select()
      .from(wikiPages)
      .where(and(eq(wikiPages.userId, userId), eq(wikiPages.slug, slug)))
      .limit(1);

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    await db
      .delete(wikiPages)
      .where(and(eq(wikiPages.userId, userId), eq(wikiPages.slug, slug)));

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return handleError(e);
  }
}

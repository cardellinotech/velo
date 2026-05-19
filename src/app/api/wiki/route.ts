import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { wikiPages } from "@/lib/schema";
import { eq, and, desc, ilike, or } from "drizzle-orm";

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();

    const url = new URL(req.url);
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");

    let query = db.select().from(wikiPages).where(eq(wikiPages.userId, userId)).$dynamic();

    if (search) {
      query = query.where(
        and(
          eq(wikiPages.userId, userId),
          or(
            ilike(wikiPages.title, `%${search}%`),
            ilike(wikiPages.content, `%${search}%`)
          )
        )
      );
    }

    const pages = await query.orderBy(desc(wikiPages.updatedAt)).limit(500);

    // Tag filtering done client-side to avoid complex array SQL
    const filtered = tag
      ? pages.filter((p) => p.tags.includes(tag))
      : pages;

    return NextResponse.json(filtered);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = await req.json() as {
      title: string;
      content?: string;
      tags?: string[];
      parentPageId?: string;
    };

    const { title, content = "", tags = [], parentPageId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const baseSlug = generateSlug(title.trim());

    // Check slug uniqueness iteratively — one query per attempt, no full table load
    let slug = baseSlug;
    let counter = 2;
    while (true) {
      const [existing] = await db
        .select({ id: wikiPages.id })
        .from(wikiPages)
        .where(and(eq(wikiPages.userId, userId), eq(wikiPages.slug, slug)))
        .limit(1);
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
      if (counter > 100) { slug = `${baseSlug}-${Date.now()}`; break; } // safety valve
    }

    const now = Date.now();

    const [page] = await db
      .insert(wikiPages)
      .values({
        userId,
        title: title.trim(),
        slug,
        content,
        tags,
        parentPageId: parentPageId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(page, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

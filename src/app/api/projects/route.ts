import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq, desc } from "drizzle-orm";

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
    const result = await db.select().from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt))
      .limit(200);
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();
    const now = Date.now();
    const [project] = await db.insert(projects).values({
      userId,
      name: body.name,
      clientName: body.clientName ?? null,
      description: body.description ?? null,
      hourlyRate: body.hourlyRate ?? null,
      currency: body.currency ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    }).returning();
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

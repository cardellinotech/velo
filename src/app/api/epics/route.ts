import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { epics, projects } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { and, eq } from "drizzle-orm";

function handleError(e: unknown) {
  if (e instanceof Error && e.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const body = await req.json();

    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, body.projectId), eq(projects.userId, userId)))
      .limit(1);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = Date.now();
    const [epic] = await db.insert(epics).values({
      projectId: body.projectId,
      userId,
      name: body.name,
      description: body.description ?? null,
      color: body.color ?? null,
      status: "open",
      createdAt: now,
      updatedAt: now,
    }).returning();
    return NextResponse.json(epic, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

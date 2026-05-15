import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { codaSyncConfigs, codaSyncLog } from "@/lib/schema";
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
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { projectId } = await params;

    const [config] = await db.select().from(codaSyncConfigs)
      .where(and(eq(codaSyncConfigs.userId, userId), eq(codaSyncConfigs.projectId, projectId)))
      .limit(1);

    return NextResponse.json(config ?? null);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { projectId } = await params;

    const body = await req.json() as {
      codaApiToken: string;
      codaDocId: string;
      codaTableId: string;
      columnMapping: { task: string; notes: string; duration: string; logDate: string; user: string };
      taskMappings: { codaValue: string; taskId: string }[];
      codaUserValue?: string;
    };

    const { codaApiToken, codaDocId, codaTableId, columnMapping, taskMappings, codaUserValue } = body;

    const now = Date.now();

    const [existing] = await db.select().from(codaSyncConfigs)
      .where(and(eq(codaSyncConfigs.userId, userId), eq(codaSyncConfigs.projectId, projectId)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(codaSyncConfigs)
        .set({
          codaApiToken,
          codaDocId,
          codaTableId,
          columnMapping,
          taskMappings,
          codaUserValue: codaUserValue ?? null,
          updatedAt: now,
        })
        .where(eq(codaSyncConfigs.id, existing.id))
        .returning();
      return NextResponse.json(updated);
    }

    const [created] = await db.insert(codaSyncConfigs).values({
      userId,
      projectId,
      codaApiToken,
      codaDocId,
      codaTableId,
      columnMapping,
      taskMappings,
      codaUserValue: codaUserValue ?? null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return NextResponse.json(created);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { projectId } = await params;

    const [config] = await db.select().from(codaSyncConfigs)
      .where(and(eq(codaSyncConfigs.userId, userId), eq(codaSyncConfigs.projectId, projectId)))
      .limit(1);

    if (!config) return NextResponse.json({ success: true });

    await db.delete(codaSyncLog).where(eq(codaSyncLog.configId, config.id));
    await db.delete(codaSyncConfigs).where(eq(codaSyncConfigs.id, config.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

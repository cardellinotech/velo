import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { codaSyncConfigs, codaSyncLog } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

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
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { projectId } = await params;

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    const [config] = await db.select().from(codaSyncConfigs)
      .where(and(eq(codaSyncConfigs.userId, userId), eq(codaSyncConfigs.projectId, projectId)))
      .limit(1);

    if (!config) return NextResponse.json([]);

    const history = await db.select().from(codaSyncLog)
      .where(eq(codaSyncLog.configId, config.id))
      .orderBy(desc(codaSyncLog.syncedAt))
      .limit(limit);

    return NextResponse.json(history);
  } catch (e) {
    return handleError(e);
  }
}

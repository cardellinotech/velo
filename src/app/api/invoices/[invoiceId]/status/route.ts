import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { invoiceId } = await params;
    const body = await req.json();
    const { status: newStatus } = body;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
      .limit(1);

    if (!invoice) throw new Error("NOT_FOUND");

    const allowedTransitions: Record<string, string[]> = {
      draft: ["sent"],
      sent: ["paid", "overdue"],
      overdue: ["paid"],
    };

    const allowed = allowedTransitions[invoice.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from "${invoice.status}" to "${newStatus}"`,
        },
        { status: 400 }
      );
    }

    const updateFields: Record<string, unknown> = {
      status: newStatus,
      updatedAt: Date.now(),
    };

    if (newStatus === "sent") {
      updateFields.issueDate = Date.now();
    }

    const [updated] = await db
      .update(invoices)
      .set(updateFields)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

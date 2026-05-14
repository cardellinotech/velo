import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, projects, userSettings } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq, and, desc } from "drizzle-orm";
import type { LineItem } from "@/lib/schema";

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

function calcTotals(
  lineItems: { hours: number; rate: number; amount: number }[],
  taxRate: number | string | null | undefined
) {
  const rate =
    taxRate !== null && taxRate !== undefined ? Number(taxRate) : undefined;
  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
  const taxAmount = rate ? subtotal * (rate / 100) : undefined;
  const total = subtotal + (taxAmount ?? 0);
  return { subtotal, taxAmount, total };
}

export async function GET(req: Request) {
  try {
    const userId = await requireAuth();

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status") ?? undefined;
    const filterProjectId = url.searchParams.get("projectId") ?? undefined;

    const conditions = [eq(invoices.userId, userId)];
    if (statusParam) {
      conditions.push(
        eq(
          invoices.status,
          statusParam as "draft" | "sent" | "paid" | "overdue"
        )
      );
    }
    if (filterProjectId) {
      conditions.push(eq(invoices.projectId, filterProjectId));
    }

    const result = await db
      .select({
        id: invoices.id,
        userId: invoices.userId,
        projectId: invoices.projectId,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        currency: invoices.currency,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        clientName: invoices.clientName,
        clientAddress: invoices.clientAddress,
        senderName: invoices.senderName,
        senderAddress: invoices.senderAddress,
        vatId: invoices.vatId,
        taxRate: invoices.taxRate,
        bankName: invoices.bankName,
        iban: invoices.iban,
        bic: invoices.bic,
        paymentTermDays: invoices.paymentTermDays,
        lineItems: invoices.lineItems,
        subtotal: invoices.subtotal,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        notes: invoices.notes,
        periodStart: invoices.periodStart,
        periodEnd: invoices.periodEnd,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        projectName: projects.name,
      })
      .from(invoices)
      .innerJoin(projects, eq(invoices.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt))
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
    const {
      projectId,
      periodStart,
      periodEnd,
      clientAddress,
      notes,
      lineItems: bodyLineItems,
      paymentTermDays: bodyPaymentTermDays,
    } = body;

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);
    if (!project) throw new Error("NOT_FOUND");

    // Get user settings
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const prefix = settings?.invoicePrefix ?? "RE";
    const nextNum = settings?.nextInvoiceNumber ?? 1;
    const year = new Date().getFullYear();
    const paddedNum = String(nextNum).padStart(3, "0");
    const invoiceNumber = `${prefix}-${year}-${paddedNum}`;

    const lineItems: LineItem[] = bodyLineItems ?? [];
    const { subtotal, taxAmount, total } = calcTotals(
      lineItems,
      settings?.taxRate
    );

    const issueDate = Date.now();
    const paymentTermDays =
      bodyPaymentTermDays ?? settings?.paymentTermDays ?? 30;
    const dueDate = issueDate + paymentTermDays * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let createdInvoice: typeof invoices.$inferSelect;

    await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(invoices)
        .values({
          userId,
          projectId,
          invoiceNumber,
          status: "draft",
          currency: project.currency ?? settings?.defaultCurrency ?? "EUR",
          issueDate,
          dueDate,
          clientName: project.clientName ?? project.name,
          clientAddress: clientAddress ?? null,
          senderName: settings?.businessName ?? "",
          senderAddress: settings?.businessAddress ?? null,
          vatId: settings?.vatId ?? null,
          taxRate: settings?.taxRate ?? null,
          bankName: settings?.bankName ?? null,
          iban: settings?.iban ?? null,
          bic: settings?.bic ?? null,
          paymentTermDays,
          lineItems,
          subtotal: String(subtotal),
          taxAmount: taxAmount !== undefined ? String(taxAmount) : null,
          total: String(total),
          notes: notes ?? null,
          periodStart,
          periodEnd,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      createdInvoice = inserted;

      if (settings) {
        await tx
          .update(userSettings)
          .set({ nextInvoiceNumber: nextNum + 1 })
          .where(eq(userSettings.userId, userId));
      } else {
        await tx.insert(userSettings).values({
          userId,
          defaultCurrency: "EUR",
          invoicePrefix: "RE",
          nextInvoiceNumber: 2,
        });
      }
    });

    return NextResponse.json(createdInvoice!, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

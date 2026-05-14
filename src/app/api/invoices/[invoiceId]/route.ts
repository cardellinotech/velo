import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, projects, userSettings, timeEntries, tasks } from "@/lib/schema";
import { requireAuth } from "@/lib/session";
import { eq, and, gte, lte, isNotNull, asc } from "drizzle-orm";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { invoiceId } = await params;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
      .limit(1);

    if (!invoice) throw new Error("NOT_FOUND");

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, invoice.projectId))
      .limit(1);

    if (invoice.status !== "draft") {
      return NextResponse.json({
        ...invoice,
        projectName: project?.name ?? null,
      });
    }

    // Draft invoices: always reflect current settings and dynamically compute line items
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    const settingsOverrides = {
      senderName: invoice.senderName || settings?.businessName || "",
      senderAddress: invoice.senderAddress ?? settings?.businessAddress ?? null,
      vatId: settings?.vatId ?? null,
      taxRate: settings?.taxRate ?? null,
      bankName: settings?.bankName ?? null,
      iban: settings?.iban ?? null,
      bic: settings?.bic ?? null,
      paymentTermDays:
        invoice.paymentTermDays ?? settings?.paymentTermDays ?? null,
    };

    if (!project?.hourlyRate) {
      return NextResponse.json({
        ...invoice,
        ...settingsOverrides,
        projectName: project?.name ?? null,
      });
    }

    // Draft invoice dynamic line items computation
    const timeEntriesInPeriod = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, userId),
          gte(timeEntries.startTime, invoice.periodStart),
          lte(timeEntries.startTime, invoice.periodEnd),
          eq(timeEntries.projectId, invoice.projectId),
          isNotNull(timeEntries.endTime)
        )
      )
      .orderBy(asc(timeEntries.startTime));

    // Get task titles
    const taskIds = [...new Set(timeEntriesInPeriod.map((e) => e.taskId))];
    const taskTitles = new Map<string, string>();
    for (const taskId of taskIds) {
      const [task] = await db
        .select({ title: tasks.title })
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);
      if (task) taskTitles.set(taskId, task.title);
    }

    // Group by task
    const grouped = new Map<
      string,
      { hours: number; title: string; earliestDate: number }
    >();
    for (const e of timeEntriesInPeriod) {
      const hours = (e.duration ?? 0) / 3_600_000;
      const existing = grouped.get(e.taskId);
      if (existing) {
        existing.hours += hours;
        existing.earliestDate = Math.min(existing.earliestDate, e.startTime);
      } else {
        grouped.set(e.taskId, {
          hours,
          title: taskTitles.get(e.taskId) ?? "General",
          earliestDate: e.startTime,
        });
      }
    }

    const hourlyRate = Number(project.hourlyRate);
    const lineItems = Array.from(grouped.values())
      .sort((a, b) => a.earliestDate - b.earliestDate)
      .map(({ hours, title, earliestDate }) => {
        const roundedHours = Math.round(hours * 100) / 100;
        return {
          date: earliestDate,
          description: title,
          hours: roundedHours,
          rate: hourlyRate,
          amount: Math.round(roundedHours * hourlyRate * 100) / 100,
        };
      });

    const { subtotal, taxAmount, total } = calcTotals(
      lineItems,
      settingsOverrides.taxRate
    );

    return NextResponse.json({
      ...invoice,
      ...settingsOverrides,
      lineItems,
      subtotal,
      taxAmount,
      total,
      projectName: project.name,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { invoiceId } = await params;
    const body = await req.json();

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
      .limit(1);

    if (!invoice) throw new Error("NOT_FOUND");
    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be edited" },
        { status: 400 }
      );
    }

    const {
      clientAddress,
      clientName,
      senderName,
      senderAddress,
      notes,
      lineItems: newLineItemsRaw,
      taxRate: newTaxRateRaw,
      dueDate,
      periodStart,
      periodEnd,
      paymentTermDays,
    } = body;

    const newLineItems =
      newLineItemsRaw !== undefined ? newLineItemsRaw : invoice.lineItems;
    const newTaxRate =
      newTaxRateRaw !== undefined ? newTaxRateRaw : invoice.taxRate;
    const needsRecalc =
      newLineItemsRaw !== undefined || newTaxRateRaw !== undefined;
    const { subtotal, taxAmount, total } = needsRecalc
      ? calcTotals(newLineItems, newTaxRate)
      : {
          subtotal: Number(invoice.subtotal),
          taxAmount:
            invoice.taxAmount !== null ? Number(invoice.taxAmount) : undefined,
          total: Number(invoice.total),
        };

    // Recalculate dueDate when paymentTermDays changes
    const resolvedDueDate =
      paymentTermDays !== undefined
        ? invoice.issueDate + paymentTermDays * 24 * 60 * 60 * 1000
        : dueDate;

    const updateFields: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    if (clientAddress !== undefined) updateFields.clientAddress = clientAddress;
    if (clientName !== undefined) updateFields.clientName = clientName;
    if (senderName !== undefined) updateFields.senderName = senderName;
    if (senderAddress !== undefined) updateFields.senderAddress = senderAddress;
    if (notes !== undefined) updateFields.notes = notes;
    if (resolvedDueDate !== undefined) updateFields.dueDate = resolvedDueDate;
    if (paymentTermDays !== undefined)
      updateFields.paymentTermDays = paymentTermDays;
    if (periodStart !== undefined) updateFields.periodStart = periodStart;
    if (periodEnd !== undefined) updateFields.periodEnd = periodEnd;
    if (needsRecalc) {
      updateFields.lineItems = newLineItems;
      updateFields.taxRate =
        newTaxRate !== null && newTaxRate !== undefined
          ? String(newTaxRate)
          : null;
      updateFields.subtotal = String(subtotal);
      updateFields.taxAmount =
        taxAmount !== undefined ? String(taxAmount) : null;
      updateFields.total = String(total);
    }

    const [updated] = await db
      .update(invoices)
      .set(updateFields)
      .where(eq(invoices.id, invoiceId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const userId = await requireAuth();
    const { invoiceId } = await params;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId)))
      .limit(1);

    if (!invoice) throw new Error("NOT_FOUND");
    if (invoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted" },
        { status: 400 }
      );
    }

    await db.delete(invoices).where(eq(invoices.id, invoiceId));

    return NextResponse.json({ success: true });
  } catch (e) {
    return handleError(e);
  }
}

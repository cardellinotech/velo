import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

const lineItemValidator = v.object({
  date: v.optional(v.number()),
  description: v.string(),
  hours: v.number(),
  rate: v.number(),
  amount: v.number(),
});

function calcTotals(
  lineItems: { hours: number; rate: number; amount: number }[],
  taxRate: number | undefined
) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
  const taxAmount = taxRate ? subtotal * (taxRate / 100) : undefined;
  const total = subtotal + (taxAmount ?? 0);
  return { subtotal, taxAmount, total };
}

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("sent"),
        v.literal("paid"),
        v.literal("overdue")
      )
    ),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let invoices;
    if (args.status) {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_userId_status", (q) =>
          q.eq("userId", userId).eq("status", args.status!)
        )
        .order("desc")
        .take(200);
    } else {
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .order("desc")
        .take(200);
    }

    if (args.projectId) {
      invoices = invoices.filter((inv) => inv.projectId === args.projectId);
    }

    // Enrich with project name
    const projectIds = [...new Set(invoices.map((inv) => inv.projectId))];
    const projectMap = new Map<Id<"projects">, string>();
    for (const projectId of projectIds) {
      const project = await ctx.db.get(projectId);
      if (project) projectMap.set(projectId, project.name);
    }

    return invoices.map((inv) => ({
      ...inv,
      projectName: projectMap.get(inv.projectId) ?? null,
    }));
  },
});

export const get = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.userId !== userId) throw new Error("Unauthorized");

    const project = await ctx.db.get(invoice.projectId);

    if (invoice.status !== "draft") {
      return { ...invoice, projectName: project?.name ?? null };
    }

    // Draft invoices: always reflect current settings (IBAN, BIC, sender details, etc.)
    // and dynamically compute line items from time entries.
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const settingsOverrides = {
      senderName: invoice.senderName || settings?.businessName || "",
      senderAddress: invoice.senderAddress ?? settings?.businessAddress,
      vatId: settings?.vatId,
      taxRate: settings?.taxRate,
      bankName: settings?.bankName,
      iban: settings?.iban,
      bic: settings?.bic,
      paymentTermDays: invoice.paymentTermDays ?? settings?.paymentTermDays,
    };

    if (!project?.hourlyRate) {
      return {
        ...invoice,
        ...settingsOverrides,
        projectName: project?.name ?? null,
      };
    }

    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId_startTime", (q) =>
        q
          .eq("userId", userId)
          .gte("startTime", invoice.periodStart)
          .lte("startTime", invoice.periodEnd)
      )
      .order("asc")
      .take(500);

    const completed = timeEntries.filter(
      (e) => e.endTime !== undefined && e.projectId === invoice.projectId
    );

    const taskIds = [...new Set(completed.map((e) => e.taskId))];
    const taskMap = new Map<Id<"tasks">, string>();
    for (const taskId of taskIds) {
      const task = await ctx.db.get(taskId);
      if (task) taskMap.set(taskId, task.title);
    }

    const grouped = new Map<
      string,
      { hours: number; title: string; earliestDate: number }
    >();
    for (const e of completed) {
      const hours = (e.duration ?? 0) / 3_600_000;
      const existing = grouped.get(e.taskId);
      if (existing) {
        existing.hours += hours;
        existing.earliestDate = Math.min(existing.earliestDate, e.startTime);
      } else {
        grouped.set(e.taskId, {
          hours,
          title: taskMap.get(e.taskId) ?? "General",
          earliestDate: e.startTime,
        });
      }
    }

    const hourlyRate = project.hourlyRate;
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

    const { subtotal, taxAmount, total } = calcTotals(lineItems, settingsOverrides.taxRate);

    return {
      ...invoice,
      ...settingsOverrides,
      lineItems,
      subtotal,
      taxAmount,
      total,
      projectName: project.name,
    };
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    periodStart: v.number(),
    periodEnd: v.number(),
    clientAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
    lineItems: v.optional(v.array(lineItemValidator)),
    paymentTermDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (project.userId !== userId) throw new Error("Unauthorized");

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const prefix = settings?.invoicePrefix ?? "RE";
    const nextNum = settings?.nextInvoiceNumber ?? 1;
    const year = new Date().getFullYear();
    const paddedNum = String(nextNum).padStart(3, "0");
    const invoiceNumber = `${prefix}-${year}-${paddedNum}`;

    const lineItems = args.lineItems ?? [];
    const { subtotal, taxAmount, total } = calcTotals(
      lineItems,
      settings?.taxRate
    );

    const issueDate = Date.now();
    const paymentTermDays = args.paymentTermDays ?? settings?.paymentTermDays ?? 30;
    const dueDate = issueDate + paymentTermDays * 24 * 60 * 60 * 1000;

    const now = Date.now();
    const invoiceId = await ctx.db.insert("invoices", {
      userId,
      projectId: args.projectId,
      invoiceNumber,
      status: "draft",
      currency: project.currency ?? settings?.defaultCurrency ?? "EUR",
      issueDate,
      dueDate,
      clientName: project.clientName ?? project.name,
      clientAddress: args.clientAddress,
      senderName: settings?.businessName ?? "",
      senderAddress: settings?.businessAddress,
      vatId: settings?.vatId,
      taxRate: settings?.taxRate,
      bankName: settings?.bankName,
      iban: settings?.iban,
      bic: settings?.bic,
      paymentTermDays,
      lineItems,
      subtotal,
      taxAmount,
      total,
      notes: args.notes,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-increment nextInvoiceNumber
    if (settings) {
      await ctx.db.patch(settings._id, {
        nextInvoiceNumber: nextNum + 1,
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        defaultCurrency: "EUR",
        invoicePrefix: "RE",
        nextInvoiceNumber: 2,
      });
    }

    return invoiceId;
  },
});

export const update = mutation({
  args: {
    invoiceId: v.id("invoices"),
    clientAddress: v.optional(v.string()),
    clientName: v.optional(v.string()),
    senderName: v.optional(v.string()),
    senderAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
    lineItems: v.optional(v.array(lineItemValidator)),
    taxRate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
    paymentTermDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.userId !== userId) throw new Error("Unauthorized");
    if (invoice.status !== "draft") throw new Error("Only draft invoices can be edited");

    const { invoiceId: _id, ...fields } = args;

    const newLineItems = fields.lineItems !== undefined ? fields.lineItems : invoice.lineItems;
    const newTaxRate = fields.taxRate !== undefined ? fields.taxRate : invoice.taxRate;
    const needsRecalc = fields.lineItems !== undefined || fields.taxRate !== undefined;
    const { subtotal, taxAmount, total } = needsRecalc
      ? calcTotals(newLineItems, newTaxRate)
      : { subtotal: invoice.subtotal, taxAmount: invoice.taxAmount, total: invoice.total };

    // Recalculate dueDate when paymentTermDays changes
    const newDueDate =
      fields.paymentTermDays !== undefined
        ? invoice.issueDate + fields.paymentTermDays * 24 * 60 * 60 * 1000
        : fields.dueDate;

    await ctx.db.patch(args.invoiceId, {
      updatedAt: Date.now(),
      ...(fields.clientAddress !== undefined ? { clientAddress: fields.clientAddress } : {}),
      ...(fields.clientName !== undefined ? { clientName: fields.clientName } : {}),
      ...(fields.senderName !== undefined ? { senderName: fields.senderName } : {}),
      ...(fields.senderAddress !== undefined ? { senderAddress: fields.senderAddress } : {}),
      ...(fields.notes !== undefined ? { notes: fields.notes } : {}),
      ...(newDueDate !== undefined ? { dueDate: newDueDate } : {}),
      ...(fields.paymentTermDays !== undefined ? { paymentTermDays: fields.paymentTermDays } : {}),
      ...(fields.periodStart !== undefined ? { periodStart: fields.periodStart } : {}),
      ...(fields.periodEnd !== undefined ? { periodEnd: fields.periodEnd } : {}),
      ...(needsRecalc ? { lineItems: newLineItems, taxRate: newTaxRate, subtotal, taxAmount, total } : {}),
    });
  },
});

export const updateStatus = mutation({
  args: {
    invoiceId: v.id("invoices"),
    status: v.union(
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.userId !== userId) throw new Error("Unauthorized");

    const allowedTransitions: Record<string, string[]> = {
      draft: ["sent"],
      sent: ["paid", "overdue"],
      overdue: ["paid"],
    };

    const allowed = allowedTransitions[invoice.status] ?? [];
    if (!allowed.includes(args.status)) {
      throw new Error(
        `Cannot transition from "${invoice.status}" to "${args.status}"`
      );
    }

    if (args.status === "sent") {
      await ctx.db.patch(args.invoiceId, {
        status: args.status,
        updatedAt: Date.now(),
        issueDate: Date.now(),
      });
    } else {
      await ctx.db.patch(args.invoiceId, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    if (invoice.userId !== userId) throw new Error("Unauthorized");
    if (invoice.status !== "draft") throw new Error("Only draft invoices can be deleted");

    await ctx.db.delete(args.invoiceId);
  },
});

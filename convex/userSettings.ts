import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULTS = {
  defaultCurrency: "EUR",
  invoicePrefix: "RE",
  nextInvoiceNumber: 1,
  businessName: undefined,
  businessAddress: undefined,
  vatId: undefined,
  taxRate: undefined,
  bankName: undefined,
  iban: undefined,
  bic: undefined,
  paymentTermDays: undefined,
} as const;

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!settings) {
      return {
        ...DEFAULTS,
        userId,
        _id: null,
        _creationTime: null,
      };
    }

    return settings;
  },
});

export const upsert = mutation({
  args: {
    defaultCurrency: v.optional(v.string()),
    businessName: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    vatId: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    bankName: v.optional(v.string()),
    iban: v.optional(v.string()),
    bic: v.optional(v.string()),
    paymentTermDays: v.optional(v.number()),
    invoicePrefix: v.optional(v.string()),
    nextInvoiceNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        defaultCurrency: args.defaultCurrency ?? "EUR",
        businessName: args.businessName,
        businessAddress: args.businessAddress,
        vatId: args.vatId,
        taxRate: args.taxRate,
        bankName: args.bankName,
        iban: args.iban,
        bic: args.bic,
        paymentTermDays: args.paymentTermDays,
        invoicePrefix: args.invoicePrefix ?? "RE",
        nextInvoiceNumber: args.nextInvoiceNumber ?? 1,
      });
    }
  },
});

import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // App tables — populated in Phase 1
  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    clientName: v.optional(v.string()),
    description: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  epics: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("closed")),
    color: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_projectId", ["projectId"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    epicId: v.optional(v.id("epics")),
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.union(
      v.literal("story"),
      v.literal("task"),
      v.literal("bug"),
      v.literal("incident")
    ),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_projectId_status", ["projectId", "status"])
    .index("by_epicId", ["epicId"])
    .index("by_userId_updatedAt", ["userId", "updatedAt"]),

  timeEntries: defineTable({
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
    userId: v.id("users"),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    description: v.optional(v.string()),
    isManual: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_taskId", ["taskId"])
    .index("by_projectId", ["projectId"])
    .index("by_userId", ["userId"])
    .index("by_userId_startTime", ["userId", "startTime"]),

  userSettings: defineTable({
    userId: v.id("users"),
    defaultCurrency: v.string(),
    businessName: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    vatId: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    bankName: v.optional(v.string()),
    iban: v.optional(v.string()),
    bic: v.optional(v.string()),
    paymentTermDays: v.optional(v.number()),
    invoicePrefix: v.optional(v.string()),
    nextInvoiceNumber: v.number(),
  }).index("by_userId", ["userId"]),

  invoices: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    invoiceNumber: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    currency: v.string(),
    issueDate: v.number(),
    dueDate: v.number(),
    clientName: v.string(),
    clientAddress: v.optional(v.string()),
    senderName: v.string(),
    senderAddress: v.optional(v.string()),
    vatId: v.optional(v.string()),
    taxRate: v.optional(v.number()),
    bankName: v.optional(v.string()),
    iban: v.optional(v.string()),
    bic: v.optional(v.string()),
    paymentTermDays: v.optional(v.number()),
    lineItems: v.array(
      v.object({
        date: v.optional(v.number()),
        description: v.string(),
        hours: v.number(),
        rate: v.number(),
        amount: v.number(),
      })
    ),
    subtotal: v.number(),
    taxAmount: v.optional(v.number()),
    total: v.number(),
    notes: v.optional(v.string()),
    periodStart: v.number(),
    periodEnd: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_projectId", ["projectId"])
    .index("by_userId_status", ["userId", "status"]),
});

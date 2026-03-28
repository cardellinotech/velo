import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db
      .query("projects")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .order("desc")
      .take(200);
  },
});

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return ctx.db
      .query("projects")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", userId).eq("status", "archived")
      )
      .order("desc")
      .take(200);
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    clientName: v.optional(v.string()),
    description: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return ctx.db.insert("projects", {
      userId,
      name: args.name,
      clientName: args.clientName,
      description: args.description,
      hourlyRate: args.hourlyRate,
      currency: args.currency,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    clientName: v.optional(v.string()),
    description: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");
    const { projectId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.clientName !== undefined) updates.clientName = fields.clientName;
    if (fields.description !== undefined) updates.description = fields.description;
    if (fields.hourlyRate !== undefined) updates.hourlyRate = fields.hourlyRate;
    if (fields.currency !== undefined) updates.currency = fields.currency;
    if (fields.status !== undefined) updates.status = fields.status;
    await ctx.db.patch(args.projectId, updates);
  },
});

export const archive = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");
    const now = Date.now();
    await ctx.db.patch(args.projectId, { status: "archived", updatedAt: now });

    // Pause all active recurring templates for this project
    const templates = await ctx.db
      .query("recurringTaskTemplates")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .take(500);
    for (const template of templates) {
      if (template.isActive) {
        await ctx.db.patch(template._id, { isActive: false, updatedAt: now });
      }
    }
  },
});

export const unarchive = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.projectId, { status: "active", updatedAt: Date.now() });
  },
});

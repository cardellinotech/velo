import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");
    return ctx.db
      .query("epics")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(200);
  },
});

export const get = query({
  args: { epicId: v.id("epics") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const epic = await ctx.db.get(args.epicId);
    if (!epic || epic.userId !== userId) return null;
    return epic;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");
    const now = Date.now();
    return ctx.db.insert("epics", {
      projectId: args.projectId,
      userId,
      name: args.name,
      description: args.description,
      color: args.color,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    epicId: v.id("epics"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    status: v.optional(v.union(v.literal("open"), v.literal("closed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const epic = await ctx.db.get(args.epicId);
    if (!epic || epic.userId !== userId) throw new Error("Not found");
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.color !== undefined) updates.color = args.color;
    if (args.status !== undefined) updates.status = args.status;
    await ctx.db.patch(args.epicId, updates);
  },
});

export const close = mutation({
  args: { epicId: v.id("epics") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const epic = await ctx.db.get(args.epicId);
    if (!epic || epic.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.epicId, { status: "closed", updatedAt: Date.now() });
  },
});

export const reopen = mutation({
  args: { epicId: v.id("epics") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const epic = await ctx.db.get(args.epicId);
    if (!epic || epic.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.epicId, { status: "open", updatedAt: Date.now() });
  },
});

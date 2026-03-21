import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return [];
    return ctx.db
      .query("timeEntries")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .take(200);
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const recent = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return recent.find((e) => e.endTime === undefined) ?? null;
  },
});

export const listByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId_startTime", (q) =>
        q.eq("userId", userId).gte("startTime", args.startDate).lte("startTime", args.endDate)
      )
      .order("asc")
      .take(500);
    if (args.projectId) {
      return entries.filter((e) => e.projectId === args.projectId);
    }
    return entries;
  },
});

export const start = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");

    const now = Date.now();

    // Auto-stop any currently running timer (inline to keep in one transaction)
    const recent = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    const active = recent.find((e) => e.endTime === undefined);
    if (active) {
      await ctx.db.patch(active._id, {
        endTime: now,
        duration: now - active.startTime,
      });
    }

    return ctx.db.insert("timeEntries", {
      taskId: args.taskId,
      projectId: task.projectId,
      userId,
      startTime: now,
      isManual: false,
      createdAt: now,
    });
  },
});

export const stop = mutation({
  args: { timeEntryId: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const entry = await ctx.db.get(args.timeEntryId);
    if (!entry || entry.userId !== userId) throw new Error("Not found");
    if (entry.endTime !== undefined) throw new Error("Timer already stopped");

    const now = Date.now();
    await ctx.db.patch(args.timeEntryId, {
      endTime: now,
      duration: now - entry.startTime,
    });
  },
});

export const stopForTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .take(20);
    const active = entries.find((e) => e.endTime === undefined && e.userId === userId);
    if (active) {
      await ctx.db.patch(active._id, {
        endTime: now,
        duration: now - active.startTime,
      });
    }
  },
});

export const createManual = mutation({
  args: {
    taskId: v.id("tasks"),
    startTime: v.number(),
    endTime: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");
    if (args.endTime <= args.startTime) {
      throw new Error("End time must be after start time");
    }

    const now = Date.now();
    return ctx.db.insert("timeEntries", {
      taskId: args.taskId,
      projectId: task.projectId,
      userId,
      startTime: args.startTime,
      endTime: args.endTime,
      duration: args.endTime - args.startTime,
      description: args.description,
      isManual: true,
      createdAt: now,
    });
  },
});

export const update = mutation({
  args: {
    timeEntryId: v.id("timeEntries"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const entry = await ctx.db.get(args.timeEntryId);
    if (!entry || entry.userId !== userId) throw new Error("Not found");

    const patch: {
      startTime?: number;
      endTime?: number;
      duration?: number;
      description?: string;
    } = {};
    if (args.startTime !== undefined) patch.startTime = args.startTime;
    if (args.endTime !== undefined) patch.endTime = args.endTime;
    if (args.description !== undefined) patch.description = args.description;

    const newStart = args.startTime ?? entry.startTime;
    const newEnd = args.endTime ?? entry.endTime;
    if (newEnd !== undefined) patch.duration = newEnd - newStart;

    await ctx.db.patch(args.timeEntryId, patch);
  },
});

export const remove = mutation({
  args: { timeEntryId: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const entry = await ctx.db.get(args.timeEntryId);
    if (!entry || entry.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.timeEntryId);
  },
});

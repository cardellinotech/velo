import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const taskStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done")
);

const taskTypeValidator = v.union(
  v.literal("story"),
  v.literal("task"),
  v.literal("bug"),
  v.literal("incident")
);

const priorityValidator = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("urgent")
);

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) return [];
    return ctx.db
      .query("tasks")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .take(500);
  },
});

export const listByEpic = query({
  args: { epicId: v.id("epics") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const epic = await ctx.db.get(args.epicId);
    if (!epic || epic.userId !== userId) return [];
    return ctx.db
      .query("tasks")
      .withIndex("by_epicId", (q) => q.eq("epicId", args.epicId))
      .take(500);
  },
});

export const get = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return null;
    return task;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    epicId: v.optional(v.id("epics")),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: taskTypeValidator,
    priority: v.optional(priorityValidator),
    status: v.optional(taskStatusValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    const targetStatus = args.status ?? "todo";

    // Auto-assign order: get max order in target column + 1
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_projectId_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", targetStatus)
      )
      .order("desc")
      .take(1);
    const maxOrder = existingTasks.length > 0 ? existingTasks[0].order + 1 : 0;

    const now = Date.now();
    return ctx.db.insert("tasks", {
      userId,
      projectId: args.projectId,
      epicId: args.epicId,
      title: args.title,
      description: args.description,
      taskType: args.taskType,
      status: targetStatus,
      priority: args.priority ?? "medium",
      order: maxOrder,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    taskType: v.optional(taskTypeValidator),
    epicId: v.optional(v.id("epics")),
    priority: v.optional(priorityValidator),
    status: v.optional(taskStatusValidator),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");

    const { taskId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.title !== undefined) updates.title = fields.title;
    if (fields.description !== undefined) updates.description = fields.description;
    if (fields.taskType !== undefined) updates.taskType = fields.taskType;
    if (fields.epicId !== undefined) updates.epicId = fields.epicId;
    if (fields.priority !== undefined) updates.priority = fields.priority;
    if (fields.status !== undefined) updates.status = fields.status;

    await ctx.db.patch(taskId, updates);
  },
});

export const moveToColumn = mutation({
  args: {
    taskId: v.id("tasks"),
    newStatus: taskStatusValidator,
    destinationIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");

    const oldStatus = task.status;
    const projectId = task.projectId;
    const now = Date.now();

    // Get all tasks in destination column (sorted by order)
    const destTasks = await ctx.db
      .query("tasks")
      .withIndex("by_projectId_status", (q) =>
        q.eq("projectId", projectId).eq("status", args.newStatus)
      )
      .order("asc")
      .take(500);

    // Remove the moved task from the destination list (if already there)
    const filteredDest = destTasks.filter((t) => t._id !== args.taskId);

    // Insert at destination index
    const clampedIndex = Math.max(0, Math.min(args.destinationIndex, filteredDest.length));
    const newDestOrder = [
      ...filteredDest.slice(0, clampedIndex),
      task,
      ...filteredDest.slice(clampedIndex),
    ];

    // Update all tasks in destination column with new orders
    for (let i = 0; i < newDestOrder.length; i++) {
      const patch: { order: number; updatedAt: number; status?: string } = { order: i, updatedAt: now };
      if (newDestOrder[i]._id === args.taskId) {
        patch.status = args.newStatus;
      }
      await ctx.db.patch(newDestOrder[i]._id, patch);
    }

    // If moving between columns, renormalize source column
    if (oldStatus !== args.newStatus) {
      const srcTasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId_status", (q) =>
          q.eq("projectId", projectId).eq("status", oldStatus)
        )
        .order("asc")
        .take(500);
      for (let i = 0; i < srcTasks.length; i++) {
        await ctx.db.patch(srcTasks[i]._id, { order: i, updatedAt: now });
      }
    }
  },
});

export const reorder = mutation({
  args: {
    taskId: v.id("tasks"),
    sourceIndex: v.number(),
    destinationIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");

    if (args.sourceIndex === args.destinationIndex) return;

    const now = Date.now();
    const columnTasks = await ctx.db
      .query("tasks")
      .withIndex("by_projectId_status", (q) =>
        q.eq("projectId", task.projectId).eq("status", task.status)
      )
      .order("asc")
      .take(500);

    // Remove task from source, insert at destination
    const withoutTask = columnTasks.filter((t) => t._id !== args.taskId);
    const clampedDest = Math.max(0, Math.min(args.destinationIndex, withoutTask.length));
    const reordered = [
      ...withoutTask.slice(0, clampedDest),
      task,
      ...withoutTask.slice(clampedDest),
    ];

    for (let i = 0; i < reordered.length; i++) {
      await ctx.db.patch(reordered[i]._id, { order: i, updatedAt: now });
    }
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Not found");

    // Stop running timer and delete all time entries for this task
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_taskId", (q) => q.eq("taskId", args.taskId))
      .take(500);
    const now = Date.now();
    for (const entry of entries) {
      if (entry.endTime === undefined) {
        await ctx.db.patch(entry._id, {
          endTime: now,
          duration: now - entry.startTime,
        });
      }
      await ctx.db.delete(entry._id);
    }

    await ctx.db.delete(args.taskId);
  },
});

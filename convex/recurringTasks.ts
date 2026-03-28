import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { computeNextDueDate } from "./lib/recurrence";

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

const recurrenceValidator = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly")
);

export const list = query({
  args: { projectId: v.optional(v.id("projects")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.projectId !== undefined) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.userId !== userId) return [];
      return ctx.db
        .query("recurringTaskTemplates")
        .withIndex("by_projectId", (q) =>
          q.eq("projectId", args.projectId!)
        )
        .take(500);
    }

    return ctx.db
      .query("recurringTaskTemplates")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(500);
  },
});

export const get = query({
  args: { templateId: v.id("recurringTaskTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== userId) return null;
    return template;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    epicId: v.optional(v.id("epics")),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: taskTypeValidator,
    priority: priorityValidator,
    recurrence: recurrenceValidator,
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    if (
      args.recurrence === "monthly" &&
      args.dayOfMonth !== undefined &&
      args.dayOfMonth > 28
    ) {
      throw new Error("dayOfMonth must be 28 or less to avoid month-length issues.");
    }

    const now = Date.now();
    const nextDueDate = computeNextDueDate(
      args.recurrence,
      args.dayOfWeek,
      args.dayOfMonth
    );

    return ctx.db.insert("recurringTaskTemplates", {
      userId,
      projectId: args.projectId,
      epicId: args.epicId,
      title: args.title,
      description: args.description,
      taskType: args.taskType,
      priority: args.priority,
      recurrence: args.recurrence,
      dayOfWeek: args.dayOfWeek,
      dayOfMonth: args.dayOfMonth,
      nextDueDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    templateId: v.id("recurringTaskTemplates"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    taskType: v.optional(taskTypeValidator),
    priority: v.optional(priorityValidator),
    epicId: v.optional(v.id("epics")),
    recurrence: v.optional(recurrenceValidator),
    dayOfWeek: v.optional(v.number()),
    dayOfMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== userId) throw new Error("Not found");

    const { templateId, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (fields.title !== undefined) updates.title = fields.title;
    if (fields.description !== undefined) updates.description = fields.description ?? undefined;
    if (fields.taskType !== undefined) updates.taskType = fields.taskType;
    if (fields.priority !== undefined) updates.priority = fields.priority;
    if (fields.epicId !== undefined) updates.epicId = fields.epicId;
    if (fields.recurrence !== undefined) updates.recurrence = fields.recurrence;
    if (fields.dayOfWeek !== undefined) updates.dayOfWeek = fields.dayOfWeek;
    if (fields.dayOfMonth !== undefined) updates.dayOfMonth = fields.dayOfMonth;

    const scheduleChanged =
      fields.recurrence !== undefined ||
      fields.dayOfWeek !== undefined ||
      fields.dayOfMonth !== undefined;

    if (scheduleChanged) {
      updates.nextDueDate = computeNextDueDate(
        (fields.recurrence ?? template.recurrence) as "daily" | "weekly" | "monthly",
        fields.dayOfWeek ?? template.dayOfWeek,
        fields.dayOfMonth ?? template.dayOfMonth
      );
    }

    await ctx.db.patch(templateId, updates);
  },
});

export const toggleActive = mutation({
  args: { templateId: v.id("recurringTaskTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== userId) throw new Error("Not found");

    const resuming = !template.isActive;
    const updates: Record<string, unknown> = {
      isActive: resuming,
      updatedAt: Date.now(),
    };

    if (resuming) {
      updates.nextDueDate = computeNextDueDate(
        template.recurrence,
        template.dayOfWeek,
        template.dayOfMonth
      );
    }

    await ctx.db.patch(args.templateId, updates);
  },
});

export const remove = mutation({
  args: { templateId: v.id("recurringTaskTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const template = await ctx.db.get(args.templateId);
    if (!template || template.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.templateId);
  },
});

export const processRecurringTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const dueTemplates = await ctx.db
      .query("recurringTaskTemplates")
      .withIndex("by_nextDueDate", (q) => q.lte("nextDueDate", now))
      .take(500);

    for (const template of dueTemplates) {
      if (!template.isActive) continue;

      const project = await ctx.db.get(template.projectId);
      if (!project) continue;

      if (project.status === "archived") {
        await ctx.db.patch(template._id, { isActive: false, updatedAt: now });
        continue;
      }

      // Resolve epic — if deleted, create task without epic
      let epicId: typeof template.epicId = undefined;
      if (template.epicId !== undefined) {
        const epic = await ctx.db.get(template.epicId);
        if (epic) epicId = template.epicId;
      }

      // Compute order: append to end of todo column
      const lastTodoTasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId_status", (q) =>
          q.eq("projectId", template.projectId).eq("status", "todo")
        )
        .order("desc")
        .take(1);
      const order = lastTodoTasks.length > 0 ? lastTodoTasks[0].order + 1 : 0;

      await ctx.db.insert("tasks", {
        userId: template.userId,
        projectId: template.projectId,
        epicId,
        title: template.title,
        description: template.description,
        taskType: template.taskType,
        priority: template.priority,
        status: "todo",
        order,
        recurringTemplateId: template._id,
        createdAt: now,
        updatedAt: now,
      });

      const nextDueDate = computeNextDueDate(
        template.recurrence,
        template.dayOfWeek,
        template.dayOfMonth,
        now
      );

      await ctx.db.patch(template._id, {
        nextDueDate,
        lastCreatedAt: now,
        updatedAt: now,
      });
    }
  },
});

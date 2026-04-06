import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("dailyPlanItems")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .take(200);

    // Join with tasks table to get live status
    const enriched = await Promise.all(
      items.map(async (item) => {
        if (item.taskId) {
          const task = await ctx.db.get(item.taskId);
          if (!task) {
            return { ...item, taskDeleted: true, taskStatus: null, taskType: null };
          }
          return {
            ...item,
            taskDeleted: false,
            taskStatus: task.status,
            taskType: task.taskType,
            // Keep title in sync with task
            title: task.title,
          };
        }
        return { ...item, taskDeleted: false, taskStatus: null, taskType: null };
      })
    );

    return enriched.sort((a, b) => a.order - b.order);
  },
});

export const addTask = mutation({
  args: { date: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check for duplicate
    const existing = await ctx.db
      .query("dailyPlanItems")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .take(200);

    const duplicate = existing.find((item) => item.taskId?.toString() === args.taskId.toString());
    if (duplicate) {
      throw new Error("Task already in today's plan.");
    }

    // Look up task
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) throw new Error("Task not found");

    // Get project name
    const project = await ctx.db.get(task.projectId);
    const projectName = project?.name;

    // Determine next order
    const maxOrder = existing.reduce((max, item) => Math.max(max, item.order), 0);

    return await ctx.db.insert("dailyPlanItems", {
      userId,
      date: args.date,
      taskId: args.taskId,
      title: task.title,
      projectName,
      isCompleted: task.status === "done",
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const addFreeText = mutation({
  args: { date: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("dailyPlanItems")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .take(200);

    const maxOrder = existing.reduce((max, item) => Math.max(max, item.order), 0);

    return await ctx.db.insert("dailyPlanItems", {
      userId,
      date: args.date,
      title: args.title.trim(),
      isCompleted: false,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  },
});

export const toggleComplete = mutation({
  args: { itemId: v.id("dailyPlanItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    await ctx.db.patch(args.itemId, { isCompleted: !item.isCompleted });

    return { taskId: item.taskId, isCompleted: !item.isCompleted };
  },
});

export const reorder = mutation({
  args: {
    itemId: v.id("dailyPlanItems"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    // Get all items for this date
    const items = await ctx.db
      .query("dailyPlanItems")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", item.date)
      )
      .take(200);

    const sorted = items.sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((i) => i._id === args.itemId);
    const newIndex = args.newOrder;

    if (oldIndex === -1 || newIndex < 0 || newIndex >= sorted.length) return;

    // Remove item from old position and insert at new
    const reordered = [...sorted];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Update all orders
    await Promise.all(
      reordered.map((item, index) =>
        ctx.db.patch(item._id, { order: index })
      )
    );
  },
});

export const remove = mutation({
  args: { itemId: v.id("dailyPlanItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== userId) throw new Error("Item not found");

    await ctx.db.delete(args.itemId);
  },
});

export const copyToDate = mutation({
  args: { fromDate: v.string(), toDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get incomplete items from source date
    const sourceItems = await ctx.db
      .query("dailyPlanItems")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.fromDate)
      )
      .take(200);

    const incompleteItems = sourceItems.filter((item) => !item.isCompleted);

    // Get existing items on target date (for duplicate check and order)
    const targetItems = await ctx.db
      .query("dailyPlanItems")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.toDate)
      )
      .take(200);

    const existingTaskIds = new Set(
      targetItems.filter((i) => i.taskId).map((i) => i.taskId!.toString())
    );

    let maxOrder = targetItems.reduce((max, item) => Math.max(max, item.order), 0);
    let copiedCount = 0;

    for (const item of incompleteItems) {
      // Skip if task already exists on target date
      if (item.taskId && existingTaskIds.has(item.taskId.toString())) {
        continue;
      }

      maxOrder += 1;
      await ctx.db.insert("dailyPlanItems", {
        userId,
        date: args.toDate,
        taskId: item.taskId,
        title: item.title,
        projectName: item.projectName,
        isCompleted: false,
        order: maxOrder,
        createdAt: Date.now(),
      });
      copiedCount++;
    }

    return copiedCount;
  },
});

// Query all active tasks for task picker
export const searchActiveTasks = query({
  args: { search: v.optional(v.string()), date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get all user's active projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", userId).eq("status", "active")
      )
      .take(100);

    // Get tasks from all active projects (not done)
    const allTasks: Array<{
      _id: Id<"tasks">;
      title: string;
      taskType: string;
      projectName: string;
      projectId: Id<"projects">;
    }> = [];

    for (const project of projects) {
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
        .take(500);

      for (const task of tasks) {
        if (task.status === "done") continue;
        allTasks.push({
          _id: task._id,
          title: task.title,
          taskType: task.taskType,
          projectName: project.name,
          projectId: task.projectId,
        });
      }
    }

    // Filter by search term
    let filtered = allTasks;
    if (args.search && args.search.trim()) {
      const term = args.search.toLowerCase();
      filtered = allTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.projectName.toLowerCase().includes(term)
      );
    }

    // Get already-added task IDs for this date
    const planItems = await ctx.db
      .query("dailyPlanItems")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .take(200);

    const addedTaskIds = new Set(
      planItems.filter((i) => i.taskId).map((i) => i.taskId!.toString())
    );

    return filtered.map((t) => ({
      ...t,
      alreadyAdded: addedTaskIds.has(t._id.toString()),
    }));
  },
});

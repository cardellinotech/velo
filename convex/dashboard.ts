import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Active projects
    const activeProjects = await ctx.db
      .query("projects")
      .withIndex("by_userId_status", (q) => q.eq("userId", userId).eq("status", "active"))
      .take(200);
    const activeProjectCount = activeProjects.length;

    // In-progress task count across all active projects
    let inProgressTaskCount = 0;
    for (const project of activeProjects) {
      const inProgressTasks = await ctx.db
        .query("tasks")
        .withIndex("by_projectId_status", (q) =>
          q.eq("projectId", project._id).eq("status", "in_progress")
        )
        .take(500);
      inProgressTaskCount += inProgressTasks.length;
    }

    // Today's tracked hours
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId_startTime", (q) =>
        q.eq("userId", userId).gte("startTime", todayStart.getTime()).lte("startTime", todayEnd.getTime())
      )
      .take(500);

    const todayTotalDuration = todayEntries
      .filter((e) => e.endTime !== undefined)
      .reduce((sum, e) => sum + (e.duration ?? 0), 0);

    // Running timer check
    const recentEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    const hasRunningTimer = recentEntries.some((e) => e.endTime === undefined);

    return { activeProjectCount, inProgressTaskCount, todayTotalDuration, hasRunningTimer };
  },
});

export const recentTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId_updatedAt", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);

    const results = [];
    for (const task of tasks) {
      const project = await ctx.db.get(task.projectId);
      if (!project) continue;
      results.push({
        _id: task._id,
        title: task.title,
        taskType: task.taskType,
        status: task.status,
        projectId: task.projectId,
        projectName: project.name,
        updatedAt: task.updatedAt,
      });
    }
    return results;
  },
});

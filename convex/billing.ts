import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export type BillingEntry = {
  _id: Id<"timeEntries">;
  taskId: Id<"tasks">;
  taskTitle: string;
  taskType: "story" | "task" | "bug" | "incident";
  epicId: Id<"epics"> | null;
  epicName: string | null;
  projectId: Id<"projects">;
  projectName: string;
  clientName: string | null;
  hourlyRate: number | null;
  currency: string | null;
  startTime: number;
  durationMs: number;
  description: string | null;
};

export const entries = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args): Promise<BillingEntry[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rawEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId_startTime", (q) =>
        q.eq("userId", userId).gte("startTime", args.startDate).lte("startTime", args.endDate)
      )
      .order("asc")
      .take(500);

    // Exclude running timers; optionally filter by project
    const completed = rawEntries.filter(
      (e) => e.endTime !== undefined && (args.projectId === undefined || e.projectId === args.projectId)
    );

    // Deduplicated task lookups
    const taskIds = [...new Set(completed.map((e) => e.taskId))];
    const taskMap = new Map<Id<"tasks">, { title: string; taskType: "story" | "task" | "bug" | "incident"; epicId: Id<"epics"> | undefined }>();
    for (const taskId of taskIds) {
      const task = await ctx.db.get(taskId);
      if (task) {
        taskMap.set(taskId, { title: task.title, taskType: task.taskType, epicId: task.epicId });
      }
    }

    // Deduplicated epic lookups
    const epicIds = [...new Set(taskIds.map((id) => taskMap.get(id)?.epicId).filter(Boolean) as Id<"epics">[])];
    const epicMap = new Map<Id<"epics">, string>();
    for (const epicId of epicIds) {
      const epic = await ctx.db.get(epicId);
      if (epic) epicMap.set(epicId, epic.name);
    }

    // Deduplicated project lookups
    const projectIds = [...new Set(completed.map((e) => e.projectId))];
    const projectMap = new Map<Id<"projects">, { name: string; clientName: string | undefined; hourlyRate: number | undefined; currency: string | undefined }>();
    for (const projectId of projectIds) {
      const project = await ctx.db.get(projectId);
      if (project) projectMap.set(projectId, { name: project.name, clientName: project.clientName, hourlyRate: project.hourlyRate, currency: project.currency });
    }

    return completed
      .map((e) => {
        const task = taskMap.get(e.taskId);
        if (!task) return null;
        const project = projectMap.get(e.projectId);
        if (!project) return null;
        return {
          _id: e._id,
          taskId: e.taskId,
          taskTitle: task.title,
          taskType: task.taskType,
          epicId: task.epicId ?? null,
          epicName: task.epicId ? (epicMap.get(task.epicId) ?? null) : null,
          projectId: e.projectId,
          projectName: project.name,
          clientName: project.clientName ?? null,
          hourlyRate: project.hourlyRate ?? null,
          currency: project.currency ?? null,
          startTime: e.startTime,
          durationMs: e.duration ?? 0,
          description: e.description ?? null,
        };
      })
      .filter(Boolean) as BillingEntry[];
  },
});

export const summary = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const rawEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId_startTime", (q) =>
        q.eq("userId", userId).gte("startTime", args.startDate).lte("startTime", args.endDate)
      )
      .order("asc")
      .take(500);

    const filtered = args.projectId
      ? rawEntries.filter((e) => e.projectId === args.projectId)
      : rawEntries;

    const running = filtered.find((e) => e.endTime === undefined);
    const completed = filtered.filter((e) => e.endTime !== undefined);

    const totalDurationMs = completed.reduce((sum, e) => sum + (e.duration ?? 0), 0);
    const projectCount = new Set(completed.map((e) => e.projectId)).size;
    const taskCount = new Set(completed.map((e) => e.taskId)).size;

    // Calculate amounts per currency for projects with hourly rates
    const projectIds = [...new Set(completed.map((e) => e.projectId))];
    const projectMap = new Map<Id<"projects">, { hourlyRate: number | undefined; currency: string | undefined }>();
    for (const projectId of projectIds) {
      const project = await ctx.db.get(projectId);
      if (project) projectMap.set(projectId, { hourlyRate: project.hourlyRate, currency: project.currency });
    }

    const amountsByCurrency: Record<string, number> = {};
    for (const e of completed) {
      const project = projectMap.get(e.projectId);
      if (project?.hourlyRate) {
        const hours = (e.duration ?? 0) / 3_600_000;
        const currency = project.currency ?? "EUR";
        amountsByCurrency[currency] = (amountsByCurrency[currency] ?? 0) + hours * project.hourlyRate;
      }
    }

    // totalAmount: single value if one currency, null if mixed or none
    const currencyKeys = Object.keys(amountsByCurrency);
    const totalAmount: number | null =
      currencyKeys.length === 1 ? amountsByCurrency[currencyKeys[0]] : null;

    const runningEntry = running
      ? {
          taskId: running.taskId,
          projectId: running.projectId,
          startTime: running.startTime,
          accumulatedMs: Date.now() - running.startTime,
        }
      : null;

    return { totalDurationMs, totalAmount, amountsByCurrency, runningEntry, projectCount, taskCount };
  },
});

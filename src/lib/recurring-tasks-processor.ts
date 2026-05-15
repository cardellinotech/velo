import { db } from "./db";
import { recurringTaskTemplates, tasks } from "./schema";
import { eq, and, lte } from "drizzle-orm";
import { computeNextDueDate } from "./recurrence";

export async function processRecurringTasks(): Promise<void> {
  const now = Date.now();

  // Find all active templates that are due
  const dueTemplates = await db.select()
    .from(recurringTaskTemplates)
    .where(and(
      eq(recurringTaskTemplates.isActive, true),
      lte(recurringTaskTemplates.nextDueDate, now)
    ));

  for (const template of dueTemplates) {
    // Create the task
    await db.insert(tasks).values({
      userId: template.userId,
      projectId: template.projectId,
      epicId: template.epicId ?? null,
      title: template.title,
      description: template.description ?? null,
      taskType: template.taskType,
      status: "todo",
      priority: template.priority,
      order: now, // use timestamp as initial order
      createdAt: now,
      updatedAt: now,
    });

    // Compute next due date
    const nextDue = computeNextDueDate(
      template.recurrence,
      template.dayOfWeek ?? undefined,
      template.dayOfMonth ?? undefined
    );

    await db.update(recurringTaskTemplates)
      .set({ nextDueDate: nextDue, updatedAt: now })
      .where(eq(recurringTaskTemplates.id, template.id));
  }

  if (dueTemplates.length > 0) {
    console.log(`[cron] Processed ${dueTemplates.length} recurring task(s)`);
  }
}

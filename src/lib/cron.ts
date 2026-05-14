import cron from "node-cron";
import { processRecurringTasks } from "./recurring-tasks-processor";

let started = false;

export function startCronJobs(): void {
  if (started) return;
  started = true;

  // Run daily at 00:05 UTC — same schedule as original Convex cron
  cron.schedule("5 0 * * *", async () => {
    console.log("[cron] Running recurring tasks processor...");
    try {
      await processRecurringTasks();
    } catch (err) {
      console.error("[cron] Error in recurring tasks processor:", err);
    }
  }, {
    timezone: "UTC",
  });

  console.log("[cron] Cron jobs registered (recurring tasks: 00:05 UTC daily)");
}

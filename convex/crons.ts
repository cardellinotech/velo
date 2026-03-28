import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 00:05 UTC
crons.cron(
  "process recurring tasks",
  "5 0 * * *",
  internal.recurringTasks.processRecurringTasks,
  {}
);

export default crons;

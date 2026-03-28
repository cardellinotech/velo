/**
 * Computes the next due date timestamp (00:00 UTC) for a recurring task.
 *
 * @param recurrence - "daily" | "weekly" | "monthly"
 * @param dayOfWeek  - 0=Sun..6=Sat, required for weekly
 * @param dayOfMonth - 1–28, required for monthly
 * @param fromDate   - base timestamp (defaults to Date.now())
 * @returns Unix timestamp at 00:00 UTC on the next occurrence
 */
export function computeNextDueDate(
  recurrence: "daily" | "weekly" | "monthly",
  dayOfWeek?: number,
  dayOfMonth?: number,
  fromDate?: number
): number {
  const base = fromDate ?? Date.now();

  // Start of the base day at 00:00 UTC
  const d = new Date(base);
  const startOfDay = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate()
  );

  if (recurrence === "daily") {
    return startOfDay + 86_400_000;
  }

  if (recurrence === "weekly") {
    const targetDay = dayOfWeek ?? 0;
    const currentDay = d.getUTCDay();
    // Days until next occurrence — always at least 1 (never today)
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) {
      daysAhead += 7;
    }
    return startOfDay + daysAhead * 86_400_000;
  }

  // monthly
  const target = Math.min(dayOfMonth ?? 1, 28);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const todayDom = d.getUTCDate();

  if (target > todayDom) {
    // Target day is still ahead this month
    return Date.UTC(year, month, target);
  } else {
    // Target day already passed (or is today) — use next month
    return Date.UTC(year, month + 1, target);
  }
}

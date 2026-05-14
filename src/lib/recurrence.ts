/**
 * Computes the next due date timestamp (00:00 UTC) for a recurring task.
 */
export function computeNextDueDate(
  recurrence: "daily" | "weekly" | "monthly",
  dayOfWeek?: number,
  dayOfMonth?: number,
  fromDate?: number
): number {
  const base = fromDate ?? Date.now();
  const d = new Date(base);
  const startOfDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

  if (recurrence === "daily") {
    return startOfDay + 86_400_000;
  }

  if (recurrence === "weekly") {
    const targetDay = dayOfWeek ?? 0;
    const currentDay = d.getUTCDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    return startOfDay + daysAhead * 86_400_000;
  }

  // monthly
  const target = Math.min(dayOfMonth ?? 1, 28);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const todayDom = d.getUTCDate();

  if (target > todayDom) {
    return Date.UTC(year, month, target);
  } else {
    return Date.UTC(year, month + 1, target);
  }
}

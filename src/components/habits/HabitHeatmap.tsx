"use client";

import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay } from "date-fns";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

interface HabitHeatmapProps {
  habitId: string;
  habitColor: string;
}

const WEEK_COUNT = 12;
const DAY_COUNT = WEEK_COUNT * 7; // 84 days

export function HabitHeatmap({ habitId, habitColor }: HabitHeatmapProps) {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const startDate = format(subDays(now, DAY_COUNT - 1), "yyyy-MM-dd");

  const { data: logs, isLoading } = useQuery({
    queryKey: queryKeys.habitLogs.range(startDate, today),
    queryFn: () => api.habits.logsRange(startDate, today),
  });

  // Build a set of completed dates for this habit
  const completedDates = new Set<string>();
  if (logs) {
    for (const log of logs) {
      if (log.habitId === habitId && log.isCompleted) {
        completedDates.add(log.date);
      }
    }
  }

  // Build 12 weeks x 7 days grid (oldest first)
  // Start from the earliest date
  const cells: { date: string; completed: boolean }[] = [];
  for (let i = DAY_COUNT - 1; i >= 0; i--) {
    const date = format(subDays(startOfDay(now), i), "yyyy-MM-dd");
    cells.push({ date, completed: completedDates.has(date) });
  }

  // Split into weeks (7 days each)
  const weeks: typeof cells[] = [];
  for (let w = 0; w < WEEK_COUNT; w++) {
    weeks.push(cells.slice(w * 7, (w + 1) * 7));
  }

  if (isLoading) {
    return (
      <div className="mt-3 ml-11">
        <div className="flex gap-1">
          {Array.from({ length: WEEK_COUNT }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, d) => (
                <div key={d} className="w-3.5 h-3.5 rounded-sm bg-slate-700 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 ml-11">
      <div className="flex gap-1">
        {weeks.map((week, w) => (
          <div key={w} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                className="w-3.5 h-3.5 rounded-sm transition-opacity"
                style={{
                  backgroundColor: cell.completed ? habitColor : undefined,
                }}
                title={cell.date}
                aria-label={`${cell.date}: ${cell.completed ? "erledigt" : "nicht erledigt"}`}
              >
                {!cell.completed && (
                  <div className="w-full h-full rounded-sm bg-slate-700" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1.5">Letzte 12 Wochen</p>
    </div>
  );
}

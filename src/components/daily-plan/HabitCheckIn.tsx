"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDay } from "date-fns";
import Link from "next/link";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/hooks/useToast";
import type { Habit } from "@/types";

interface HabitCheckInProps {
  date: string;
}

function isHabitScheduledForDate(habit: Habit, date: string): boolean {
  const dayOfWeek = getDay(new Date(date + "T00:00:00")); // 0=Sunday
  if (habit.targetFrequency === "daily") return true;
  if (habit.targetFrequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (habit.targetFrequency === "custom") {
    return (habit.customDays ?? []).includes(dayOfWeek);
  }
  return true;
}

export function HabitCheckIn({ date }: HabitCheckInProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: habits, isLoading } = useQuery({
    queryKey: queryKeys.habits.list(date),
    queryFn: () => api.habits.list(date),
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { habitId: string; date: string; isCompleted: boolean }) =>
      api.habits.toggle(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(date) });
      void queryClient.invalidateQueries({ queryKey: ["habit-logs", "range"] });
    },
    onError: () => toast.error("Fehler beim Aktualisieren der Gewohnheit"),
  });

  const scheduledHabits = habits?.filter((h) => isHabitScheduledForDate(h, date)) ?? [];

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Heute — Gewohnheiten
        </h2>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Heute — Gewohnheiten
      </h2>

      {scheduledHabits.length === 0 ? (
        <div className="text-sm text-slate-500">
          Keine Gewohnheiten für heute.{" "}
          <Link href="/habits" className="text-indigo-400 hover:text-indigo-300 underline">
            Gewohnheiten verwalten
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {scheduledHabits.map((habit) => (
            <button
              key={habit.id}
              onClick={() =>
                toggleMutation.mutate({
                  habitId: habit.id,
                  date,
                  isCompleted: !habit.todayCompleted,
                })
              }
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-left"
            >
              {/* Color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: habit.color }}
              />

              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                  habit.todayCompleted ? "border-transparent" : "border-slate-500"
                }`}
                style={habit.todayCompleted ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
              >
                {habit.todayCompleted && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Name */}
              <span
                className={`flex-1 text-sm ${
                  habit.todayCompleted ? "text-slate-500 line-through" : "text-slate-200"
                }`}
              >
                {habit.name}
              </span>

              {/* Streak */}
              {(habit.streak ?? 0) > 0 && (
                <span className="text-xs text-orange-400 shrink-0">
                  🔥 {habit.streak}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

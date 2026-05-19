"use client";

import { addWeeks, subWeeks, startOfWeek, format, getISOWeek } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface WeekNavigationProps {
  currentWeekStart: string;
  onWeekChange: (weekStart: string) => void;
}

function toDate(s: string) {
  return new Date(s + "T00:00:00");
}

function formatWeekStart(weekStart: string): string {
  const monday = toDate(weekStart);
  const sunday = addWeeks(monday, 1);
  sunday.setDate(sunday.getDate() - 1);
  const kw = getISOWeek(monday);
  const from = format(monday, "dd. MMM", { locale: de });
  const to = format(sunday, "dd. MMM yyyy", { locale: de });
  return `KW ${kw} · ${from} – ${to}`;
}

export function WeekNavigation({ currentWeekStart, onWeekChange }: WeekNavigationProps) {
  function go(direction: "prev" | "next" | "today") {
    if (direction === "today") {
      const today = new Date();
      const monday = startOfWeek(today, { weekStartsOn: 1 });
      onWeekChange(format(monday, "yyyy-MM-dd"));
      return;
    }
    const current = toDate(currentWeekStart);
    const next = direction === "next" ? addWeeks(current, 1) : subWeeks(current, 1);
    onWeekChange(format(next, "yyyy-MM-dd"));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => go("prev")}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        aria-label="Vorherige Woche"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <h2 className="text-sm font-medium text-slate-200 min-w-[220px] text-center">
        {formatWeekStart(currentWeekStart)}
      </h2>

      <button
        onClick={() => go("next")}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        aria-label="Nächste Woche"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <button
        onClick={() => go("today")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-all"
      >
        <CalendarDays className="w-3.5 h-3.5" />
        Heute
      </button>
    </div>
  );
}

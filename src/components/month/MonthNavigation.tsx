"use client";

import { format, addMonths, subMonths } from "date-fns";
import { de } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigationProps {
  month: string; // "YYYY-MM"
  onMonthChange: (month: string) => void;
}

export function MonthNavigation({ month, onMonthChange }: MonthNavigationProps) {
  const date = new Date(month + "-01");

  const label = format(date, "MMMM yyyy", { locale: de });

  function goToPrev() {
    const prev = subMonths(date, 1);
    onMonthChange(format(prev, "yyyy-MM"));
  }

  function goToNext() {
    const next = addMonths(date, 1);
    onMonthChange(format(next, "yyyy-MM"));
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={goToPrev}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        aria-label="Vorheriger Monat"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <h1 className="text-base font-semibold text-white capitalize">{label}</h1>
      <button
        onClick={goToNext}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        aria-label="Nächster Monat"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

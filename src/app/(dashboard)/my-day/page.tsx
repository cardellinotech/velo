"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { DailyPlanList } from "@/components/daily-plan/DailyPlanList";
import { QuickAddInput } from "@/components/daily-plan/QuickAddInput";
import { TaskPickerDialog } from "@/components/daily-plan/TaskPickerDialog";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { useState } from "react";

export default function MyDayPage() {
  const [date, setDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  const dateStr = format(date, "yyyy-MM-dd");
  const items = useQuery(api.dailyPlan.get, { date: dateStr });

  const goToPrev = () => setDate((d) => subDays(d, 1));
  const goToNext = () => setDate((d) => addDays(d, 1));
  const goToToday = () => setDate(new Date());

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Date header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={goToPrev}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">
              {format(date, "EEEE, MMMM d, yyyy")}
            </h1>
            {!isToday(date) && (
              <button
                onClick={goToToday}
                className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={goToNext}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick add + Add Task button */}
        <div className="flex items-start gap-2 mb-4">
          <div className="flex-1">
            <QuickAddInput dateStr={dateStr} />
          </div>
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Items list */}
        {items === undefined ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : (
          <DailyPlanList items={items} date={date} dateStr={dateStr} />
        )}

        {/* Task picker dialog */}
        <TaskPickerDialog
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          dateStr={dateStr}
        />
      </div>
    </div>
  );
}

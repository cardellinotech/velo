"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek } from "date-fns";
import { Plus } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import type { TimeBlock } from "@/types";
import { WeekNavigation } from "@/components/week/WeekNavigation";
import { WeekCalendar } from "@/components/week/WeekCalendar";
import { TimeBlockForm } from "@/components/week/TimeBlockForm";

function getCurrentWeekStart(): string {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekStart);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | undefined>(undefined);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);
  const [initialTime, setInitialTime] = useState<string | undefined>(undefined);

  const { data: timeBlocks = [] } = useQuery({
    queryKey: queryKeys.timeBlocks.byWeek(weekStart),
    queryFn: () => api.timeBlocks.listByWeek(weekStart),
  });

  const { data: googleEvents = [] } = useQuery({
    queryKey: ["google-calendar", "events", weekStart],
    queryFn: () => api.googleCalendar.events(weekStart),
    // Don't throw on error — calendar is optional
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects.active(),
    queryFn: () => api.projects.listActive(),
  });

  function openCreateForm(date?: string, time?: string) {
    setSelectedBlock(undefined);
    setInitialDate(date);
    setInitialTime(time);
    setFormOpen(true);
  }

  function openEditForm(block: TimeBlock) {
    setSelectedBlock(block);
    setInitialDate(undefined);
    setInitialTime(undefined);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setSelectedBlock(undefined);
    setInitialDate(undefined);
    setInitialTime(undefined);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-base font-semibold text-white">Wochenübersicht</h1>
            <p className="text-xs text-slate-500 mt-0.5">Planung & Zeitblöcke</p>
          </div>
          <WeekNavigation
            currentWeekStart={weekStart}
            onWeekChange={setWeekStart}
          />
        </div>
        <button
          onClick={() => openCreateForm()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Neuer Block
        </button>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden px-4 py-2">
        <WeekCalendar
          weekStart={weekStart}
          timeBlocks={timeBlocks}
          googleEvents={googleEvents}
          onBlockClick={openEditForm}
          onSlotClick={(date, time) => openCreateForm(date, time)}
        />
      </div>

      {/* Form dialog */}
      <TimeBlockForm
        open={formOpen}
        onClose={closeForm}
        projects={projects}
        initialDate={initialDate}
        initialTime={initialTime}
        block={selectedBlock}
        weekStart={weekStart}
      />
    </div>
  );
}

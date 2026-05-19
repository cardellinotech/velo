"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/hooks/useToast";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitForm } from "@/components/habits/HabitForm";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import type { Habit } from "@/types";

export default function HabitsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const queryClient = useQueryClient();
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  const { data: habits, isLoading } = useQuery({
    queryKey: queryKeys.habits.list(today),
    queryFn: () => api.habits.list(today),
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { habitId: string; date: string; isCompleted: boolean }) =>
      api.habits.toggle(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(today) });
      void queryClient.invalidateQueries({ queryKey: ["habit-logs", "range"] });
    },
    onError: () => toast.error("Fehler beim Aktualisieren der Gewohnheit"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.habits.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(today) });
      toast.success("Gewohnheit gelöscht");
    },
    onError: () => toast.error("Fehler beim Löschen der Gewohnheit"),
  });

  const handleToggle = (habit: Habit) => {
    toggleMutation.mutate({
      habitId: habit.id,
      date: today,
      isCompleted: !habit.todayCompleted,
    });
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Gewohnheit wirklich löschen? Alle Einträge werden ebenfalls gelöscht.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingHabit(undefined);
  };

  const handleExpand = (habitId: string) => {
    setExpandedHabit((prev) => (prev === habitId ? null : habitId));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Gewohnheiten</h1>
            <p className="text-sm text-slate-400 mt-1">
              {format(new Date(), "EEEE, d. MMMM yyyy")}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingHabit(undefined);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Gewohnheit
          </button>
        </div>

        {/* Habit list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : !habits || habits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">Noch keine Gewohnheiten</h3>
            <p className="text-sm text-slate-500 mb-6">
              Erstelle deine erste Gewohnheit und starte deinen Streak.
            </p>
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Neue Gewohnheit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {habits.map((habit) => (
              <div key={habit.id}>
                <HabitCard
                  habit={habit}
                  today={today}
                  onToggle={() => handleToggle(habit)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  expanded={expandedHabit === habit.id}
                  onExpand={() => handleExpand(habit.id)}
                />
                {expandedHabit === habit.id && (
                  <div className="bg-slate-800 border border-t-0 border-slate-700 rounded-b-xl px-4 pb-4">
                    <HabitHeatmap habitId={habit.id} habitColor={habit.color} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress summary */}
        {habits && habits.length > 0 && (
          <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-xl">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-200">
                {habits.filter((h) => h.todayCompleted).length}
              </span>
              {" / "}
              <span className="font-semibold text-slate-200">{habits.length}</span>
              {" Gewohnheiten heute erledigt"}
            </p>
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{
                  width: `${Math.round((habits.filter((h) => h.todayCompleted).length / habits.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Form dialog */}
      <HabitForm
        open={formOpen}
        onClose={handleFormClose}
        habit={editingHabit}
      />
    </div>
  );
}

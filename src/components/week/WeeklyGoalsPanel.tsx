"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Plus, X, CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import type { WeeklyGoalsRecord } from "@/types";

interface WeeklyGoalsPanelProps {
  weekStart: string;
  onReviewClick: () => void;
}

export function WeeklyGoalsPanel({ weekStart, onReviewClick }: WeeklyGoalsPanelProps) {
  const queryClient = useQueryClient();
  const [newGoalText, setNewGoalText] = useState("");
  const [addingGoal, setAddingGoal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWeekEnd = [0, 5, 6].includes(new Date().getDay());

  const { data: record } = useQuery({
    queryKey: queryKeys.weeklyGoals.byWeek(weekStart),
    queryFn: () => api.weeklyGoals.get(weekStart),
  });

  const goals = record?.goals ?? [];

  const weekLabel = (() => {
    try {
      return format(parseISO(weekStart), "'KW' w – MMM yyyy", { locale: de });
    } catch {
      return weekStart;
    }
  })();

  async function saveGoals(updatedGoals: WeeklyGoalsRecord["goals"]) {
    setSaving(true);
    try {
      await api.weeklyGoals.upsert({ weekStart, goals: updatedGoals });
      await queryClient.invalidateQueries({ queryKey: queryKeys.weeklyGoals.byWeek(weekStart) });
    } finally {
      setSaving(false);
    }
  }

  async function toggleGoal(id: string) {
    const updated = goals.map((g) =>
      g.id === id ? { ...g, isCompleted: !g.isCompleted } : g
    );
    await saveGoals(updated);
  }

  async function addGoal() {
    const text = newGoalText.trim();
    if (!text) return;

    const newGoal = {
      id: crypto.randomUUID(),
      text,
      isCompleted: false,
      order: goals.length,
    };
    await saveGoals([...goals, newGoal]);
    setNewGoalText("");
    setAddingGoal(false);
  }

  async function deleteGoal(id: string) {
    const updated = goals
      .filter((g) => g.id !== id)
      .map((g, i) => ({ ...g, order: i }));
    await saveGoals(updated);
  }

  async function saveEditedGoal(id: string) {
    const text = editingText.trim();
    if (!text) {
      setEditingId(null);
      return;
    }
    const updated = goals.map((g) => (g.id === id ? { ...g, text } : g));
    await saveGoals(updated);
    setEditingId(null);
  }

  function startEdit(id: string, currentText: string) {
    setEditingId(id);
    setEditingText(currentText);
  }

  const canAddMore = goals.length < 5;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <h2 className="text-sm font-semibold text-white">Wochenziele</h2>
        <p className="text-xs text-slate-500 mt-0.5">{weekLabel}</p>
      </div>

      {/* Goals list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {goals.length === 0 && !addingGoal && (
          <p className="text-xs text-slate-500 text-center py-6 leading-relaxed px-2">
            Noch keine Wochenziele.{" "}
            <span className="block mt-1">Was willst du diese Woche erreichen?</span>
          </p>
        )}

        {goals.map((goal) => (
          <div
            key={goal.id}
            className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-800/50 transition-colors"
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleGoal(goal.id)}
              className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-400 transition-colors"
              aria-label={goal.isCompleted ? "Als unerledigt markieren" : "Als erledigt markieren"}
            >
              {goal.isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
            </button>

            {/* Text / inline edit */}
            {editingId === goal.id ? (
              <input
                autoFocus
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => saveEditedGoal(goal.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditedGoal(goal.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="flex-1 text-xs bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-white outline-none focus:border-indigo-500"
              />
            ) : (
              <span
                onClick={() => startEdit(goal.id, goal.text)}
                className={`flex-1 text-xs cursor-text leading-relaxed ${
                  goal.isCompleted
                    ? "line-through text-slate-500"
                    : "text-slate-200"
                }`}
              >
                {goal.text}
              </span>
            )}

            {/* Delete button — visible on hover */}
            <button
              onClick={() => deleteGoal(goal.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all mt-0.5"
              aria-label="Ziel entfernen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Inline add form */}
        {addingGoal && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Circle className="w-4 h-4 text-slate-600 shrink-0" />
            <input
              ref={inputRef}
              autoFocus
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addGoal();
                if (e.key === "Escape") {
                  setAddingGoal(false);
                  setNewGoalText("");
                }
              }}
              onBlur={() => {
                if (!newGoalText.trim()) {
                  setAddingGoal(false);
                  setNewGoalText("");
                } else {
                  addGoal();
                }
              }}
              placeholder="Neues Ziel eingeben…"
              className="flex-1 text-xs bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-white outline-none focus:border-indigo-500 placeholder-slate-500"
            />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-3 py-3 border-t border-slate-800 shrink-0 space-y-2">
        {/* Add goal button */}
        {canAddMore && !addingGoal && (
          <button
            onClick={() => setAddingGoal(true)}
            className="flex items-center gap-1.5 w-full text-xs text-slate-400 hover:text-indigo-400 transition-colors py-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Ziel hinzufügen
            {saving && <span className="ml-auto text-slate-600 text-[10px]">Speichern…</span>}
          </button>
        )}
        {!canAddMore && (
          <p className="text-[10px] text-slate-600 text-center">
            Maximal 5 Wochenziele
          </p>
        )}

        {/* Weekly review button */}
        <button
          onClick={onReviewClick}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs transition-all ${
            isWeekEnd
              ? "bg-amber-900/30 border border-amber-700/50 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Wochenrückblick</span>
          {record?.weekReview && (
            <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 shrink-0" title="Rückblick vorhanden" />
          )}
        </button>
      </div>
    </div>
  );
}

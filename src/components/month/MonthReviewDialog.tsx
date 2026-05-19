"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X, CheckCircle2, Circle } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import type { MonthlyGoalsRecord } from "@/types";

interface MonthReviewDialogProps {
  open: boolean;
  onClose: () => void;
  month: string; // "YYYY-MM"
  record: MonthlyGoalsRecord | null;
}

export function MonthReviewDialog({ open, onClose, month, record }: MonthReviewDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [reviewText, setReviewText] = useState(record?.monthReview ?? "");
  const [saving, setSaving] = useState(false);

  // Sync reviewText when the stored review text changes
  useEffect(() => {
    setReviewText(record?.monthReview ?? "");
  }, [record?.monthReview]);

  if (!open) return null;

  const goals = record?.goals ?? [];

  const monthLabel = (() => {
    try {
      return format(new Date(month + "-01"), "MMMM yyyy", { locale: de });
    } catch {
      return month;
    }
  })();

  const completedCount = goals.filter((g) => g.isCompleted).length;

  async function handleSave() {
    setSaving(true);
    try {
      await api.monthlyGoals.upsert({ month, monthReview: reviewText });
      await queryClient.invalidateQueries({ queryKey: queryKeys.monthlyGoals.byMonth(month) });
      onClose();
    } catch (error) {
      console.error("Error saving month review:", error);
      toast.error("Rückblick konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Monatsrückblick</h2>
            <p className="text-xs text-slate-500 mt-0.5 capitalize">{monthLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Goal summary */}
          {goals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Monatsziele
                </h3>
                <span className="text-xs text-slate-500">
                  {completedCount}/{goals.length} erledigt
                </span>
              </div>
              <div className="space-y-1.5">
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-2">
                    {goal.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                    )}
                    <span
                      className={`text-xs leading-relaxed ${
                        goal.isCompleted ? "line-through text-slate-500" : "text-slate-300"
                      }`}
                    >
                      {goal.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <p className="text-xs text-slate-600 italic">Keine Monatsziele gesetzt.</p>
          )}

          {/* Review textarea */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              Wie war der Monat?
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Reflexion, Learnings, was gut lief, was besser sein könnte…"
              rows={6}
              className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-600 outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

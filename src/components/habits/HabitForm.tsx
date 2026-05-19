"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/hooks/useToast";
import type { Habit } from "@/types";

const PRESET_COLORS = [
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // emerald
];

const DAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

interface HabitFormProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit;
}

export function HabitForm({ open, onClose, habit }: HabitFormProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [targetFrequency, setTargetFrequency] = useState("daily");
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description ?? "");
      setColor(habit.color);
      setTargetFrequency(habit.targetFrequency);
      setCustomDays(habit.customDays ?? [1, 2, 3, 4, 5]);
    } else {
      setName("");
      setDescription("");
      setColor(PRESET_COLORS[0]);
      setTargetFrequency("daily");
      setCustomDays([1, 2, 3, 4, 5]);
    }
  }, [habit, open]);

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.habits.create>[0]) => api.habits.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(today) });
      toast.success("Gewohnheit erstellt");
      onClose();
    },
    onError: () => toast.error("Fehler beim Erstellen der Gewohnheit"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Habit> }) => api.habits.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.habits.list(today) });
      toast.success("Gewohnheit aktualisiert");
      onClose();
    },
    onError: () => toast.error("Fehler beim Aktualisieren der Gewohnheit"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      targetFrequency,
      customDays: targetFrequency === "custom" ? customDays : undefined,
    };

    if (habit) {
      updateMutation.mutate({ id: habit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">
            {habit ? "Gewohnheit bearbeiten" : "Neue Gewohnheit"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Täglich meditieren"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Beschreibung (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung..."
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Farbe</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Farbe ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Target frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Häufigkeit</label>
            <select
              value={targetFrequency}
              onChange={(e) => setTargetFrequency(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="daily">Täglich</option>
              <option value="weekdays">Werktags (Mo–Fr)</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
          </div>

          {/* Custom days */}
          {targetFrequency === "custom" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tage auswählen</label>
              <div className="flex gap-2">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleCustomDay(idx)}
                    className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${
                      customDays.includes(idx)
                        ? "text-white"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                    style={customDays.includes(idx) ? { backgroundColor: color } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
            >
              {isPending ? "Speichern..." : habit ? "Aktualisieren" : "Erstellen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

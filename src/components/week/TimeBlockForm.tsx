"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import type { Project, TimeBlock } from "@/types";
import { X, Trash2 } from "lucide-react";

interface TimeBlockFormProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  initialDate?: string;
  initialTime?: string;
  block?: TimeBlock;
  weekStart: string;
}

const DEFAULT_COLOR = "#6366F1";

export function TimeBlockForm({ open, onClose, projects, initialDate, initialTime, block, weekStart }: TimeBlockFormProps) {
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [projectId, setProjectId] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (block) {
      setTitle(block.title);
      setDate(block.date);
      setStartTime(block.startTime);
      setEndTime(block.endTime);
      setProjectId(block.projectId ?? "");
      setColor(block.color ?? DEFAULT_COLOR);
      setNotes(block.notes ?? "");
    } else {
      setTitle("");
      setDate(initialDate ?? "");
      setStartTime(initialTime ?? "09:00");
      // Default end = start + 1h
      if (initialTime) {
        const [h, m] = initialTime.split(":").map(Number);
        const endH = Math.min(h + 1, 20);
        setEndTime(`${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      } else {
        setEndTime("10:00");
      }
      setProjectId("");
      setColor(DEFAULT_COLOR);
      setNotes("");
    }
    setError(null);
  }, [open, block, initialDate, initialTime]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime) {
      setError("Titel, Datum, Start- und Endzeit sind erforderlich.");
      return;
    }
    if (startTime >= endTime) {
      setError("Startzeit muss vor Endzeit liegen.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (block) {
        await api.timeBlocks.update(block.id, {
          title: title.trim(),
          date,
          startTime,
          endTime,
          projectId: projectId || null,
          color: color || null,
          notes: notes.trim() || null,
        });
      } else {
        await api.timeBlocks.create({
          title: title.trim(),
          date,
          startTime,
          endTime,
          projectId: projectId || undefined,
          color: color || undefined,
          notes: notes.trim() || undefined,
        });
      }
      await qc.invalidateQueries({ queryKey: queryKeys.timeBlocks.byWeek(weekStart) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!block) return;
    if (!confirm("Zeitblock wirklich löschen?")) return;
    setDeleting(true);
    try {
      await api.timeBlocks.delete(block.id);
      await qc.invalidateQueries({ queryKey: queryKeys.timeBlocks.byWeek(weekStart) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Löschen.");
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">
            {block ? "Zeitblock bearbeiten" : "Neuer Zeitblock"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Deep Work: Feature X"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Datum *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Start *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min="08:00"
                max="20:00"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Ende *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                min="08:00"
                max="20:00"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Projekt</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
            >
              <option value="">Kein Projekt</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Farbe</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-md cursor-pointer border border-white/[0.08] bg-transparent"
              />
              <span className="text-xs text-slate-500">{color}</span>
              {["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-5 h-5 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "white" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optionale Notizen..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {block ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Löschen..." : "Löschen"}
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

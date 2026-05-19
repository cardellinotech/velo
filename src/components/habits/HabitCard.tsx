"use client";

import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { Habit } from "@/types";

interface HabitCardProps {
  habit: Habit;
  today: string;
  onToggle: () => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  expanded?: boolean;
  onExpand?: () => void;
}

export function HabitCard({ habit, onToggle, onEdit, onDelete, expanded, onExpand }: HabitCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 group">
      <div className="flex items-center gap-3">
        {/* Color dot */}
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: habit.color }}
        />

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
            habit.todayCompleted
              ? "border-transparent"
              : "border-slate-500 hover:border-slate-400"
          }`}
          style={habit.todayCompleted ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
          aria-label={habit.todayCompleted ? "Als unerledigt markieren" : "Als erledigt markieren"}
        >
          {habit.todayCompleted && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Name */}
        <span
          className={`flex-1 text-sm font-medium cursor-pointer ${
            habit.todayCompleted ? "text-slate-400 line-through" : "text-slate-100"
          }`}
          onClick={onExpand}
        >
          {habit.name}
        </span>

        {/* Streak */}
        {(habit.streak ?? 0) > 0 && (
          <span className="text-xs text-orange-400 font-medium shrink-0">
            🔥 {habit.streak} {habit.streak === 1 ? "Tag" : "Tage"}
          </span>
        )}

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(habit);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Gewohnheit bearbeiten"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(habit.id);
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Gewohnheit löschen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {onExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExpand();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label={expanded ? "Heatmap ausblenden" : "Heatmap anzeigen"}
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {habit.description && (
        <p className="text-xs text-slate-400 mt-2 ml-11">{habit.description}</p>
      )}
    </div>
  );
}

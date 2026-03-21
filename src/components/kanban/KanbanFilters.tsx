"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TASK_TYPES, PRIORITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface KanbanFilterState {
  taskTypes: string[];
  epicId: string | null;
  priorities: string[];
}

interface KanbanFiltersProps {
  projectId: Id<"projects">;
  filters: KanbanFilterState;
  onChange: (filters: KanbanFilterState) => void;
}

export function KanbanFilters({ projectId, filters, onChange }: KanbanFiltersProps) {
  const epics = useQuery(api.epics.listByProject, { projectId });
  const openEpics = epics?.filter((e) => e.status === "open") ?? [];

  const hasActiveFilters =
    filters.taskTypes.length > 0 ||
    filters.epicId !== null ||
    filters.priorities.length > 0;

  function toggleTaskType(type: string) {
    const next = filters.taskTypes.includes(type)
      ? filters.taskTypes.filter((t) => t !== type)
      : [...filters.taskTypes, type];
    onChange({ ...filters, taskTypes: next });
  }

  function togglePriority(priority: string) {
    const next = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    onChange({ ...filters, priorities: next });
  }

  function setEpic(epicId: string) {
    onChange({ ...filters, epicId: epicId || null });
  }

  function clearAll() {
    onChange({ taskTypes: [], epicId: null, priorities: [] });
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Task type chips */}
      <div className="flex items-center gap-1.5">
        {Object.entries(TASK_TYPES).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => toggleTaskType(key)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              filters.taskTypes.includes(key)
                ? "bg-primary text-white border-primary"
                : "bg-white text-text-secondary border-border hover:border-primary hover:text-text-primary"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Epic filter */}
      {openEpics.length > 0 && (
        <select
          value={filters.epicId ?? ""}
          onChange={(e) => setEpic(e.target.value)}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border transition-colors bg-white",
            filters.epicId
              ? "border-primary text-primary"
              : "border-border text-text-secondary hover:border-primary hover:text-text-primary"
          )}
        >
          <option value="">All epics</option>
          {openEpics.map((epic) => (
            <option key={epic._id} value={epic._id}>
              {epic.name}
            </option>
          ))}
        </select>
      )}

      {/* Priority chips */}
      <div className="flex items-center gap-1.5">
        {Object.entries(PRIORITIES).map(([key, { label, color }]) => (
          <button
            key={key}
            onClick={() => togglePriority(key)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1",
              filters.priorities.includes(key)
                ? "bg-primary text-white border-primary"
                : "bg-white text-text-secondary border-border hover:border-primary hover:text-text-primary"
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: filters.priorities.includes(key) ? "white" : color }}
              aria-hidden="true"
            />
            {label}
          </button>
        ))}
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}

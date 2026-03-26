"use client";

import { useState } from "react";
import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDurationShort } from "@/lib/formatTime";
import { TASK_TYPES, type TaskType } from "@/lib/constants";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import type { BillingEntry } from "../../../convex/billing";

type TaskTypeRow = {
  taskType: TaskType;
  durationMs: number;
  taskCount: number;
};

type EpicRow = {
  epicId: string | null;
  epicName: string;
  durationMs: number;
  taskTypes: TaskTypeRow[];
};

type ProjectRow = {
  projectId: string;
  projectName: string;
  clientName: string | null;
  durationMs: number;
  epics: EpicRow[];
};

function groupEntries(entries: BillingEntry[]): ProjectRow[] {
  const projectMap = new Map<string, { name: string; clientName: string | null; entries: BillingEntry[] }>();

  for (const entry of entries) {
    const key = entry.projectId;
    if (!projectMap.has(key)) {
      projectMap.set(key, { name: entry.projectName, clientName: entry.clientName, entries: [] });
    }
    projectMap.get(key)!.entries.push(entry);
  }

  const projects: ProjectRow[] = [];

  for (const [projectId, { name, clientName, entries: projectEntries }] of projectMap) {
    const epicMap = new Map<string, { name: string; epicId: string | null; entries: BillingEntry[] }>();

    for (const entry of projectEntries) {
      const key = entry.epicId ?? "none";
      if (!epicMap.has(key)) {
        epicMap.set(key, { name: entry.epicName ?? "No Epic", epicId: entry.epicId, entries: [] });
      }
      epicMap.get(key)!.entries.push(entry);
    }

    const epics: EpicRow[] = [];
    for (const [, { name: epicName, epicId, entries: epicEntries }] of epicMap) {
      const typeMap = new Map<TaskType, { durationMs: number; tasks: Set<string> }>();
      for (const entry of epicEntries) {
        const t = entry.taskType;
        if (!typeMap.has(t)) typeMap.set(t, { durationMs: 0, tasks: new Set() });
        const row = typeMap.get(t)!;
        row.durationMs += entry.durationMs;
        row.tasks.add(entry.taskId);
      }

      const taskTypes: TaskTypeRow[] = [...typeMap.entries()].map(([taskType, { durationMs, tasks }]) => ({
        taskType,
        durationMs,
        taskCount: tasks.size,
      }));

      epics.push({
        epicId,
        epicName,
        durationMs: epicEntries.reduce((s, e) => s + e.durationMs, 0),
        taskTypes,
      });
    }

    epics.sort((a, b) => b.durationMs - a.durationMs);

    projects.push({
      projectId,
      projectName: name,
      clientName,
      durationMs: projectEntries.reduce((s, e) => s + e.durationMs, 0),
      epics,
    });
  }

  projects.sort((a, b) => b.durationMs - a.durationMs);
  return projects;
}

interface BillingTableProps {
  entries: BillingEntry[];
}

export function BillingTable({ entries }: BillingTableProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-secondary">
        <Clock className="w-10 h-10 opacity-30" />
        <p className="text-sm">No time entries for this period.</p>
      </div>
    );
  }

  const projects = groupEntries(entries);

  function toggleProject(projectId: string) {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  function toggleEpic(key: string) {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-2 bg-surface border-b border-border text-xs font-medium text-text-secondary">
        <span className="flex-1">Project / Epic / Type</span>
        <span className="w-24 text-right">Hours</span>
      </div>

      {projects.map((project) => {
        const isProjectExpanded = expandedProjects.has(project.projectId);
        return (
          <div key={project.projectId}>
            {/* Project row */}
            <button
              onClick={() => toggleProject(project.projectId)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-white hover:bg-surface transition-colors border-b border-border/50 text-left"
            >
              <ChevronRight
                className={cn("w-4 h-4 text-text-secondary shrink-0 transition-transform duration-150", isProjectExpanded && "rotate-90")}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-text-primary">{project.projectName}</span>
                {project.clientName && (
                  <span className="ml-2 text-xs text-text-secondary">{project.clientName}</span>
                )}
              </div>
              <span className="w-24 text-right text-sm font-medium text-text-primary shrink-0">
                {formatDurationShort(project.durationMs)}
              </span>
            </button>

            {/* Epic rows */}
            {isProjectExpanded &&
              project.epics.map((epic) => {
                const epicKey = `${project.projectId}:${epic.epicId ?? "none"}`;
                const isEpicExpanded = expandedEpics.has(epicKey);
                return (
                  <div key={epicKey}>
                    <button
                      onClick={() => toggleEpic(epicKey)}
                      className="w-full flex items-center gap-2 pl-8 pr-4 py-2.5 bg-surface/50 hover:bg-surface transition-colors border-b border-border/30 text-left"
                    >
                      <ChevronRight
                        className={cn("w-3.5 h-3.5 text-text-secondary shrink-0 transition-transform duration-150", isEpicExpanded && "rotate-90")}
                      />
                      <span
                        className={cn(
                          "flex-1 text-sm truncate",
                          epic.epicId ? "text-text-primary" : "text-text-secondary italic"
                        )}
                      >
                        {epic.epicName}
                      </span>
                      <span className="w-24 text-right text-sm text-text-primary shrink-0">
                        {formatDurationShort(epic.durationMs)}
                      </span>
                    </button>

                    {/* Task type rows */}
                    {isEpicExpanded &&
                      epic.taskTypes.map((typeRow) => (
                        <div
                          key={typeRow.taskType}
                          className="flex items-center gap-2 pl-14 pr-4 py-2 bg-surface border-b border-border/20"
                        >
                          <TaskTypeBadge taskType={typeRow.taskType} />
                          <span className="flex-1 text-xs text-text-secondary">
                            {typeRow.taskCount} {typeRow.taskCount === 1 ? "task" : "tasks"}
                          </span>
                          <span className="w-24 text-right text-sm text-text-secondary shrink-0">
                            {formatDurationShort(typeRow.durationMs)}
                          </span>
                        </div>
                      ))}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

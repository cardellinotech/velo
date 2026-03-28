"use client";

import { useState } from "react";
import { ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDurationShort } from "@/lib/formatTime";
import { formatAmount } from "@/lib/currency";
import { type TaskType } from "@/lib/constants";
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
  hourlyRate: number | null;
  currency: string | null;
  durationMs: number;
  epics: EpicRow[];
};

function groupEntries(entries: BillingEntry[]): ProjectRow[] {
  const projectMap = new Map<string, { name: string; clientName: string | null; hourlyRate: number | null; currency: string | null; entries: BillingEntry[] }>();

  for (const entry of entries) {
    const key = entry.projectId;
    if (!projectMap.has(key)) {
      projectMap.set(key, { name: entry.projectName, clientName: entry.clientName, hourlyRate: entry.hourlyRate, currency: entry.currency, entries: [] });
    }
    projectMap.get(key)!.entries.push(entry);
  }

  const projects: ProjectRow[] = [];

  for (const [projectId, { name, clientName, hourlyRate, currency, entries: projectEntries }] of projectMap) {
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
      hourlyRate,
      currency,
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
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Clock className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm text-text-muted">No time entries for this period.</p>
      </div>
    );
  }

  const projects = groupEntries(entries);
  const hasAnyRate = projects.some((p) => p.hourlyRate !== null);

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
    <div className="rounded-xl border border-border/60 overflow-hidden bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center px-5 py-3 bg-slate-50/80 border-b border-border/40 text-[11px] font-semibold text-text-muted uppercase tracking-wide">
        <span className="flex-1">Project / Epic / Type</span>
        <span className="w-24 text-right">Hours</span>
        {hasAnyRate && <span className="w-32 text-right">Amount</span>}
      </div>

      {projects.map((project, projectIndex) => {
        const isProjectExpanded = expandedProjects.has(project.projectId);
        const projectHours = project.durationMs / 3_600_000;
        const projectAmount = project.hourlyRate ? projectHours * project.hourlyRate : null;
        return (
          <div key={project.projectId}>
            {/* Project row */}
            <button
              onClick={() => toggleProject(project.projectId)}
              className={cn(
                "w-full flex items-center gap-2.5 px-5 py-3.5 bg-white hover:bg-surface/70 transition-colors duration-100 text-left",
                projectIndex < projects.length - 1 || isProjectExpanded
                  ? "border-b border-border/40"
                  : ""
              )}
            >
              <ChevronRight
                className={cn("w-4 h-4 text-text-muted shrink-0 transition-transform duration-200", isProjectExpanded && "rotate-90")}
              />
              <div className="flex-1 min-w-0 flex items-center gap-2.5">
                <span className="text-sm font-semibold text-text-primary">{project.projectName}</span>
                {project.clientName && (
                  <span className="text-[11px] text-text-secondary bg-surface px-2 py-0.5 rounded-md border border-border/50">
                    {project.clientName}
                  </span>
                )}
                {project.hourlyRate && (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    {formatAmount(project.hourlyRate, project.currency ?? "EUR")}/h
                  </span>
                )}
              </div>
              <span className="w-24 text-right text-sm font-semibold text-text-primary tabular-nums shrink-0">
                {formatDurationShort(project.durationMs)}
              </span>
              {hasAnyRate && (
                <span className="w-32 text-right text-sm font-bold shrink-0 text-emerald-600 tabular-nums">
                  {projectAmount !== null ? formatAmount(projectAmount, project.currency ?? "EUR") : "–"}
                </span>
              )}
            </button>

            {/* Epic rows */}
            {isProjectExpanded &&
              project.epics.map((epic, epicIndex) => {
                const epicKey = `${project.projectId}:${epic.epicId ?? "none"}`;
                const isEpicExpanded = expandedEpics.has(epicKey);
                return (
                  <div key={epicKey}>
                    <button
                      onClick={() => toggleEpic(epicKey)}
                      className={cn(
                        "w-full flex items-center gap-2 pl-10 pr-5 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors duration-100 text-left",
                        epicIndex < project.epics.length - 1 || isEpicExpanded
                          ? "border-b border-border/30"
                          : "border-b border-border/40"
                      )}
                    >
                      <ChevronRight
                        className={cn("w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200", isEpicExpanded && "rotate-90")}
                      />
                      <span
                        className={cn(
                          "flex-1 text-[13px] truncate",
                          epic.epicId ? "text-text-primary font-medium" : "text-text-muted italic"
                        )}
                      >
                        {epic.epicName}
                      </span>
                      <span className="w-24 text-right text-[13px] text-text-secondary tabular-nums shrink-0">
                        {formatDurationShort(epic.durationMs)}
                      </span>
                      {hasAnyRate && <span className="w-32 shrink-0" />}
                    </button>

                    {/* Task type rows */}
                    {isEpicExpanded &&
                      epic.taskTypes.map((typeRow) => (
                        <div
                          key={typeRow.taskType}
                          className="flex items-center gap-2.5 pl-16 pr-5 py-2.5 bg-slate-50/30 border-b border-border/20"
                        >
                          <TaskTypeBadge taskType={typeRow.taskType} />
                          <span className="flex-1 text-xs text-text-muted">
                            {typeRow.taskCount} {typeRow.taskCount === 1 ? "task" : "tasks"}
                          </span>
                          <span className="w-24 text-right text-xs text-text-secondary tabular-nums shrink-0">
                            {formatDurationShort(typeRow.durationMs)}
                          </span>
                          {hasAnyRate && <span className="w-32 shrink-0" />}
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

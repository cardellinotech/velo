"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { Settings, Layers } from "lucide-react";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanFilters } from "@/components/kanban/KanbanFilters";
import type { KanbanFilterState } from "@/components/kanban/KanbanFilters";
import { TaskForm } from "@/components/tasks/TaskForm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCreateTask } from "@/contexts/CreateTaskContext";

const DEFAULT_FILTERS: KanbanFilterState = {
  taskTypes: [],
  epicId: null,
  priorities: [],
};

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const project = useQuery(api.projects.get, { projectId });
  const { registerProject, unregisterProject } = useCreateTask();

  const [filters, setFilters] = useState<KanbanFilterState>(DEFAULT_FILTERS);
  const [taskFormOpen, setTaskFormOpen] = useState(false);

  const openTaskForm = useCallback(() => {
    setTaskFormOpen(true);
  }, []);

  // Register this project with the global create context
  useEffect(() => {
    if (project) {
      registerProject(projectId, openTaskForm);
    }
    return () => unregisterProject();
  }, [projectId, project, registerProject, unregisterProject, openTaskForm]);

  useKeyboardShortcuts({
    n: () => setTaskFormOpen(true),
    N: () => setTaskFormOpen(true),
  }, project !== undefined && project !== null);

  if (project === undefined) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-surface rounded-lg" />
            <div className="h-4 w-24 bg-surface rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-20 bg-surface rounded-lg" />
            <div className="h-9 w-24 bg-surface rounded-lg" />
          </div>
        </div>
        <div className="flex gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[272px] shrink-0 h-64 bg-surface/50 rounded-xl border border-border/40" />
          ))}
        </div>
      </div>
    );
  }

  if (project === null) {
    return <div className="text-sm text-text-secondary">Project not found.</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{project.name}</h1>
            {project.clientName && (
              <p className="text-sm text-text-secondary mt-0.5">{project.clientName}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/projects/${projectId}/epics`}
              className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary font-medium px-3 py-2 rounded-lg hover:bg-surface transition-all duration-150"
            >
              <Layers className="w-4 h-4" />
              Epics
            </Link>
            <Link
              href={`/projects/${projectId}/settings`}
              className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary font-medium px-3 py-2 rounded-lg hover:bg-surface transition-all duration-150"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>

        {/* Filters */}
        <KanbanFilters
          projectId={projectId}
          filters={filters}
          onChange={setFilters}
        />

        {/* Board */}
        <KanbanBoard
          projectId={projectId}
          filters={filters}
        />
      </div>

      <TaskForm
        open={taskFormOpen}
        onClose={() => setTaskFormOpen(false)}
        projectId={projectId}
        initialStatus="todo"
      />
    </>
  );
}

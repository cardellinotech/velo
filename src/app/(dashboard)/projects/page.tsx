"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { FolderKanban, Plus, ArrowRight, Zap, DollarSign } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";

const statusConfig = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  },
  archived: {
    label: "Archived",
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-500 border border-slate-200/50",
  },
} as const;

function ProjectCard({ project }: { project: Doc<"projects"> }) {
  const [editOpen, setEditOpen] = useState(false);
  const status = statusConfig[project.status as keyof typeof statusConfig] ?? statusConfig.active;

  return (
    <>
      <div className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/projects/${project._id}`}
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors truncate block"
            >
              {project.name}
            </Link>
            {project.clientName && (
              <span className="inline-flex items-center mt-1.5 text-[11px] text-text-secondary bg-surface px-2 py-0.5 rounded-md border border-border/50">
                {project.clientName}
              </span>
            )}
          </div>
          <span className={cn("shrink-0 flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium", status.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        </div>

        {project.description && (
          <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{project.description}</p>
        )}

        {/* Rate badge */}
        {project.hourlyRate && (
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
            <DollarSign className="w-3 h-3" />
            <span>{getCurrencySymbol(project.currency ?? "EUR")}{project.hourlyRate}/h</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
          <Link
            href={`/projects/${project._id}`}
            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:text-primary-hover transition-colors"
          >
            Open board
            <ArrowRight className="w-3 h-3" />
          </Link>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={() => setEditOpen(true)}
              className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1 rounded-lg hover:bg-surface transition-colors"
            >
              Edit
            </button>
            <Link
              href={`/projects/${project._id}/settings`}
              className="text-[11px] text-text-muted hover:text-text-primary px-2 py-1 rounded-lg hover:bg-surface transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>

      <ProjectForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
      />
    </>
  );
}

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const projects = useQuery(api.projects.list);

  useKeyboardShortcuts({
    p: () => setCreateOpen(true),
    P: () => setCreateOpen(true),
  });

  const activeCount = projects?.filter((p) => p.status === "active").length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Projects</h1>
          <p className="text-sm text-text-secondary mt-1">
            {projects === undefined
              ? "Loading…"
              : `${activeCount} active project${activeCount !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          New project
        </Button>
      </div>

      {projects === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-border/60 bg-white animate-pulse">
              <div className="h-[3px] bg-surface rounded-t-xl" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-32 bg-surface rounded" />
                <div className="h-3 w-20 bg-surface rounded" />
                <div className="h-3 w-full bg-surface rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center border border-indigo-100">
              <FolderKanban className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">No projects yet</p>
            <p className="text-sm text-text-secondary mt-1 max-w-xs">
              Create your first project to start tracking your work and time.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      <ProjectForm open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Doc } from "../../../../../convex/_generated/dataModel";
import { Archive, ArrowLeft, RotateCcw, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/currency";

function ArchivedProjectCard({ project }: { project: Doc<"projects"> }) {
  const unarchive = useMutation(api.projects.unarchive);

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden opacity-75 hover:opacity-100">
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
        <span className={cn("shrink-0 flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium", "bg-slate-50 text-slate-500 border border-slate-200/50")}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Archived
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">{project.description}</p>
      )}

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
        <button
          onClick={() => unarchive({ projectId: project._id })}
          className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary px-2 py-1 rounded-lg hover:bg-surface transition-all duration-150"
        >
          <RotateCcw className="w-3 h-3" />
          Restore
        </button>
      </div>
    </div>
  );
}

export default function ArchivedProjectsPage() {
  const projects = useQuery(api.projects.listArchived);
  const count = projects?.length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Projects
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Archived Projects</h1>
          <p className="text-sm text-text-secondary mt-1">
            {projects === undefined
              ? "Loading…"
              : `${count} archived project${count !== 1 ? "s" : ""}`}
          </p>
        </div>
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
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200">
            <Archive className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">No archived projects</p>
            <p className="text-sm text-text-secondary mt-1 max-w-xs">
              Projects you archive will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ArchivedProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

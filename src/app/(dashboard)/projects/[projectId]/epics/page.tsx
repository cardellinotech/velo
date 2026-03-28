"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { EpicList } from "@/components/epics/EpicList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EpicsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;

  const project = useQuery(api.projects.get, { projectId });
  const epics = useQuery(api.epics.listByProject, { projectId });

  if (project === undefined || epics === undefined) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-surface rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-24 bg-surface rounded" />
            <div className="h-3 w-32 bg-surface rounded" />
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded-xl border border-border/40" />
        ))}
      </div>
    );
  }

  if (project === null) {
    return <div className="text-sm text-text-secondary">Project not found.</div>;
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center justify-center w-11 h-11 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all duration-150"
          aria-label="Back to board"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Epics</h1>
          <p className="text-sm text-text-secondary mt-0.5">{project.name}</p>
        </div>
      </div>

      <EpicList epics={epics} projectId={projectId} />
    </div>
  );
}

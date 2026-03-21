"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { Settings, Layers } from "lucide-react";

export default function ProjectBoardPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const project = useQuery(api.projects.get, { projectId });

  if (project === undefined) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-6 w-48 bg-border rounded" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-1 h-64 bg-border rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (project === null) {
    return <div className="text-sm text-text-secondary">Project not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
          {project.clientName && (
            <p className="text-sm text-text-secondary mt-0.5">{project.clientName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}/epics`}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md hover:bg-surface transition-colors"
          >
            <Layers className="w-4 h-4" />
            Epics
          </Link>
          <Link
            href={`/projects/${projectId}/settings`}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md hover:bg-surface transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>

      <p className="text-sm text-text-secondary">
        Kanban board coming in Phase 2.
      </p>
    </div>
  );
}

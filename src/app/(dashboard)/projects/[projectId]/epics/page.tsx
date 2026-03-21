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
      <div className="flex flex-col gap-4 max-w-2xl animate-pulse">
        <div className="h-4 w-32 bg-border rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-border rounded-md" />
        ))}
      </div>
    );
  }

  if (project === null) {
    return <div className="text-sm text-text-secondary">Project not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Back to board"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Epics</h1>
          <p className="text-sm text-text-secondary mt-0.5">{project.name}</p>
        </div>
      </div>

      <EpicList epics={epics} projectId={projectId} />
    </div>
  );
}

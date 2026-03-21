"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";

function ProjectCard({ project }: { project: Doc<"projects"> }) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="group flex flex-col gap-3 rounded-lg border border-border bg-white p-4 shadow-card hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/projects/${project._id}`}
              className="text-sm font-semibold text-text-primary hover:text-primary transition-colors truncate block"
            >
              {project.name}
            </Link>
            {project.clientName && (
              <p className="text-xs text-text-secondary mt-0.5 truncate">{project.clientName}</p>
            )}
          </div>
          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
            project.status === "active"
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}>
            {project.status}
          </span>
        </div>

        {project.description && (
          <p className="text-xs text-text-secondary line-clamp-2">{project.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/60">
          <Link
            href={`/projects/${project._id}`}
            className="text-xs text-primary font-medium hover:underline"
          >
            Open board
          </Link>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface transition-colors"
            >
              Edit
            </button>
            <Link
              href={`/projects/${project._id}/settings`}
              className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface transition-colors"
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {projects === undefined
              ? "Loading…"
              : `${projects.filter((p) => p.status === "active").length} active project${
                  projects.filter((p) => p.status === "active").length !== 1 ? "s" : ""
                }`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New project
        </Button>
      </div>

      {projects === undefined ? (
        // Loading skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg border border-border bg-white animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="w-10 h-10 text-text-secondary mb-3" />
          <p className="text-sm font-medium text-text-primary">No projects yet</p>
          <p className="text-sm text-text-secondary mt-1 mb-4">
            Create your first project to start tracking your work.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            New project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      <ProjectForm open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

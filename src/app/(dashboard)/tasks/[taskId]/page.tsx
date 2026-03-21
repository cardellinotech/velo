"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { TaskDetail } from "@/components/tasks/TaskDetail";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as Id<"tasks">;
  const task = useQuery(api.tasks.get, { taskId });

  if (task === undefined) {
    return (
      <div className="max-w-2xl animate-pulse flex flex-col gap-4">
        <div className="h-4 w-24 bg-border rounded" />
        <div className="h-8 w-3/4 bg-border rounded" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-border rounded" />
          <div className="h-5 w-20 bg-border rounded" />
          <div className="h-5 w-16 bg-border rounded" />
        </div>
        <div className="h-32 bg-border rounded" />
      </div>
    );
  }

  if (task === null) {
    return (
      <div className="text-sm text-text-secondary">Task not found.</div>
    );
  }

  return <TaskDetailLoader task={task} />;
}

function TaskDetailLoader({ task }: { task: NonNullable<ReturnType<typeof useQuery<typeof api.tasks.get>>> }) {
  const project = useQuery(api.projects.get, { projectId: task.projectId });

  if (project === undefined) {
    return (
      <div className="max-w-2xl animate-pulse flex flex-col gap-4">
        <div className="h-4 w-24 bg-border rounded" />
        <div className="h-8 w-3/4 bg-border rounded" />
      </div>
    );
  }

  if (project === null) {
    return <div className="text-sm text-text-secondary">Project not found.</div>;
  }

  return (
    <div className="flex flex-col h-full -m-6">
      <TaskDetail task={task} project={project} />
    </div>
  );
}

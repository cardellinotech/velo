"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { TaskDetail } from "@/components/tasks/TaskDetail";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;

  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => api.tasks.get(taskId),
    enabled: !!taskId,
  });

  if (taskLoading) {
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

  if (!task) {
    return (
      <div className="text-sm text-text-secondary">Task not found.</div>
    );
  }

  return <TaskDetailLoader task={task} />;
}

function TaskDetailLoader({ task }: { task: NonNullable<Awaited<ReturnType<typeof api.tasks.get>>> }) {
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: queryKeys.projects.detail(task.projectId),
    queryFn: () => api.projects.get(task.projectId),
    enabled: !!task.projectId,
  });

  if (projectLoading) {
    return (
      <div className="max-w-2xl animate-pulse flex flex-col gap-4">
        <div className="h-4 w-24 bg-border rounded" />
        <div className="h-8 w-3/4 bg-border rounded" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-sm text-text-secondary">Project not found.</div>;
  }

  return (
    <div className="flex flex-col h-full -m-6">
      <TaskDetail task={task} project={project} />
    </div>
  );
}

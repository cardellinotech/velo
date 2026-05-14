"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import { Dialog } from "@/components/ui/Dialog";
import { TaskDetail } from "./TaskDetail";

interface TaskDetailModalProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  return (
    <Dialog open={taskId !== null} onClose={onClose} className="sm:max-w-4xl sm:h-[80vh]" noPadding fullScreenMobile>
      {taskId && <TaskDetailModalContent taskId={taskId} onClose={onClose} />}
    </Dialog>
  );
}

function TaskDetailModalContent({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => api.tasks.get(taskId),
    enabled: !!taskId,
  });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: queryKeys.projects.detail(task?.projectId ?? ""),
    queryFn: () => api.projects.get(task!.projectId),
    enabled: !!task?.projectId,
  });

  if (taskLoading || projectLoading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-7 w-3/4 bg-border rounded" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-border rounded" />
          <div className="h-5 w-20 bg-border rounded" />
        </div>
        <div className="h-32 bg-border rounded" />
      </div>
    );
  }

  if (!task) {
    return <p className="text-sm text-text-secondary">Task not found.</p>;
  }

  if (!project) {
    return <p className="text-sm text-text-secondary">Project not found.</p>;
  }

  return <TaskDetail task={task} project={project} onClose={onClose} />;
}

"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { TaskDetail } from "./TaskDetail";

interface TaskDetailModalProps {
  taskId: Id<"tasks"> | null;
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
  taskId: Id<"tasks">;
  onClose: () => void;
}) {
  const task = useQuery(api.tasks.get, { taskId });
  const project = useQuery(
    api.projects.get,
    task ? { projectId: task.projectId } : "skip"
  );

  if (task === undefined || project === undefined) {
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

  if (task === null) {
    return <p className="text-sm text-text-secondary">Task not found.</p>;
  }

  if (project === null) {
    return <p className="text-sm text-text-secondary">Project not found.</p>;
  }

  return <TaskDetail task={task} project={project} onClose={onClose} />;
}

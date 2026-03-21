import { Badge } from "@/components/ui/Badge";
import { TASK_TYPES } from "@/lib/constants";
import type { TaskType } from "@/lib/constants";

interface TaskTypeBadgeProps {
  taskType: TaskType;
  className?: string;
}

export function TaskTypeBadge({ taskType, className }: TaskTypeBadgeProps) {
  return (
    <Badge variant={taskType} className={className}>
      {TASK_TYPES[taskType].label}
    </Badge>
  );
}

"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { PRIORITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Doc<"tasks">;
  index: number;
  epicName?: string;
  epicColor?: string;
  onTaskClick?: (taskId: Id<"tasks">) => void;
}

export function TaskCard({ task, index, epicName, epicColor, onTaskClick }: TaskCardProps) {
  const priority = PRIORITIES[task.priority];

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => !snapshot.isDragging && onTaskClick?.(task._id)}
          className={cn(
            "rounded-md border border-border bg-white p-3 transition-shadow cursor-grab active:cursor-grabbing",
            snapshot.isDragging
              ? "shadow-lg rotate-1"
              : "shadow-sm hover:shadow-md"
          )}
        >
          <div>
            {/* Title */}
            <p className="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
              {task.title}
            </p>

            {/* Meta row */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <TaskTypeBadge taskType={task.taskType} />

              {epicName && (
                <span
                  className="inline-flex items-center gap-1 text-xs text-text-secondary"
                >
                  {epicColor && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: epicColor }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate max-w-[100px]">{epicName}</span>
                </span>
              )}

              {/* Priority dot */}
              <span
                className="ml-auto w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: priority.color }}
                title={priority.label}
                aria-label={`Priority: ${priority.label}`}
              />
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

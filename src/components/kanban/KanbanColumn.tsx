"use client";

import { memo } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";
import type { TaskStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Doc<"tasks">[];
  epicsMap: Record<string, { name: string; color?: string }>;
  onTaskClick?: (taskId: Id<"tasks">) => void;
}

const columnConfig: Record<TaskStatus, {
  textColor: string;
  dotColor: string;
  headerBorder: string;
  dropBg: string;
}> = {
  todo: {
    textColor: "text-slate-600",
    dotColor: "bg-slate-400",
    headerBorder: "border-b-slate-300",
    dropBg: "bg-slate-100/60",
  },
  in_progress: {
    textColor: "text-blue-700",
    dotColor: "bg-blue-500",
    headerBorder: "border-b-blue-400",
    dropBg: "bg-blue-50/60",
  },
  in_review: {
    textColor: "text-amber-700",
    dotColor: "bg-amber-500",
    headerBorder: "border-b-amber-400",
    dropBg: "bg-amber-50/60",
  },
  done: {
    textColor: "text-emerald-700",
    dotColor: "bg-emerald-500",
    headerBorder: "border-b-emerald-400",
    dropBg: "bg-emerald-50/60",
  },
};

export const KanbanColumn = memo(function KanbanColumn({
  status,
  title,
  tasks,
  epicsMap,
  onTaskClick,
}: KanbanColumnProps) {
  const config = columnConfig[status];

  return (
    <div className="flex flex-col w-[272px] shrink-0">
      {/* Column header */}
      <div className={cn(
        "flex items-center justify-between mb-3 px-1.5 pb-3 border-b-2",
        config.headerBorder
      )}>
        <div className="flex items-center gap-2.5">
          <span
            className={cn("w-2.5 h-2.5 rounded-full shrink-0", config.dotColor)}
            aria-hidden="true"
          />
          <h3 className={cn("text-[13px] font-semibold", config.textColor)}>
            {title}
          </h3>
          <span className="text-[11px] text-text-secondary bg-slate-100 px-2 py-0.5 rounded-full font-semibold min-w-[24px] text-center">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            role="list"
            aria-label={`${title} tasks`}
            className={cn(
              "flex flex-col gap-2.5 flex-1 min-h-28 rounded-xl p-2 transition-all duration-200",
              snapshot.isDraggingOver
                ? cn(config.dropBg, "border-2 border-dashed border-indigo-300/50 scale-[1.01]")
                : "bg-slate-50/30 border-2 border-transparent"
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-xs text-text-muted">No tasks</p>
              </div>
            )}

            {tasks.map((task, index) => {
              const epic = task.epicId ? epicsMap[task.epicId] : undefined;
              return (
                <TaskCard
                  key={task._id}
                  task={task}
                  index={index}
                  epicName={epic?.name}
                  epicColor={epic?.color}
                  onTaskClick={onTaskClick}
                />
              );
            })}

            {provided.placeholder}
          </div>
        )}
      </Droppable>

    </div>
  );
});

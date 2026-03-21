"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { TaskCard } from "./TaskCard";
import type { TaskStatus } from "@/lib/constants";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Doc<"tasks">[];
  epicsMap: Record<string, { name: string; color?: string }>;
  onAddTask: (status: TaskStatus) => void;
  onTaskClick?: (taskId: Id<"tasks">) => void;
}

const columnHeaderColors: Record<TaskStatus, string> = {
  todo: "text-text-secondary",
  in_progress: "text-blue-600",
  in_review: "text-amber-600",
  done: "text-green-600",
};

export function KanbanColumn({
  status,
  title,
  tasks,
  epicsMap,
  onAddTask,
  onTaskClick,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-64 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm font-semibold ${columnHeaderColors[status]}`}
          >
            {title}
          </h3>
          <span className="text-xs text-text-secondary bg-surface px-1.5 py-0.5 rounded-sm font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface rounded transition-colors"
          aria-label={`Add task to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 flex-1 min-h-20 rounded-lg p-1.5 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-primary/5 border border-dashed border-primary/30"
                : "bg-surface/50"
            }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-text-secondary text-center py-4">
                No tasks
              </p>
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

      {/* Add task button at bottom */}
      <button
        onClick={() => onAddTask(status)}
        className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-2 py-1.5 rounded-md hover:bg-surface transition-colors w-full"
      >
        <Plus className="w-3.5 h-3.5" />
        Add task
      </button>
    </div>
  );
}

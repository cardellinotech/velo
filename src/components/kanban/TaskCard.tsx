"use client";

import { memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { TimerControl } from "@/components/timer/TimerControl";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { useTimer } from "@/hooks/useTimer";
import { PRIORITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Doc<"tasks">;
  index: number;
  epicName?: string;
  epicColor?: string;
  onTaskClick?: (taskId: Id<"tasks">) => void;
}

const priorityBorderColors: Record<string, string> = {
  low: "border-l-slate-300",
  medium: "border-l-blue-400",
  high: "border-l-amber-400",
  urgent: "border-l-red-500",
};

const priorityTextColors: Record<string, string> = {
  low: "text-slate-400",
  medium: "text-blue-500",
  high: "text-amber-500",
  urgent: "text-red-500",
};

export const TaskCard = memo(function TaskCard({ task, index, epicName, epicColor, onTaskClick }: TaskCardProps) {
  const priority = PRIORITIES[task.priority];
  const { isRunning, activeEntry } = useTimer(task._id);

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="listitem"
          onClick={() => !snapshot.isDragging && onTaskClick?.(task._id)}
          aria-label={`${task.title} — ${task.taskType}, ${priority.label} priority`}
          style={{ willChange: "transform", ...provided.draggableProps.style }}
          className={cn(
            "relative rounded-xl border-l-[3px] bg-white p-4 transition-all duration-150 cursor-grab active:cursor-grabbing group",
            priorityBorderColors[task.priority] ?? "border-l-slate-300",
            snapshot.isDragging
              ? "shadow-drag scale-[1.02] rotate-1 border border-border/50 z-50"
              : "shadow-card border border-border/60 hover:shadow-card-hover hover:-translate-y-0.5",
            isRunning && "ring-1 ring-emerald-200 border-l-emerald-500"
          )}
        >
          {/* Timer glow effect */}
          {isRunning && (
            <div className="absolute inset-0 rounded-xl bg-emerald-50/30 pointer-events-none" />
          )}

          <div className="relative">
            {/* Title */}
            <p className="text-[13px] font-medium text-text-primary line-clamp-2 leading-relaxed group-hover:text-slate-900">
              {task.title}
            </p>

            {/* Meta row */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <TaskTypeBadge taskType={task.taskType} />

              {epicName && (
                <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary bg-surface px-2 py-0.5 rounded-md border border-border/50">
                  {epicColor && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: epicColor }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate max-w-[80px]">{epicName}</span>
                </span>
              )}

              <span className={cn(
                "ml-auto text-[11px] font-medium",
                priorityTextColors[task.priority] ?? "text-slate-400"
              )}>
                {priority.label}
              </span>
            </div>

            {/* Timer row */}
            <div className="mt-2 flex items-center justify-between">
              {isRunning && activeEntry ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
                  <TimerDisplay startTime={activeEntry.startTime} className="text-[11px] text-emerald-600 tabular-nums" />
                </span>
              ) : (
                <span />
              )}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <TimerControl taskId={task._id} variant="compact" />
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

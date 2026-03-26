"use client";

import { Play, Square } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useTimer } from "@/hooks/useTimer";
import { TimerDisplay } from "./TimerDisplay";
import { cn } from "@/lib/utils";

interface TimerControlProps {
  taskId: Id<"tasks">;
  variant?: "compact" | "full";
  className?: string;
}

export function TimerControl({ taskId, variant = "full", className }: TimerControlProps) {
  const { isRunning, activeEntry, start, stop, isPending } = useTimer(taskId);

  if (variant === "compact") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          isRunning ? stop() : start();
        }}
        disabled={isPending}
        className={cn(
          "flex items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors disabled:opacity-50",
          isRunning
            ? "text-green-600 hover:text-green-700"
            : "text-text-secondary hover:text-text-primary",
          className
        )}
        aria-label={isRunning ? "Stop timer" : "Start timer"}
      >
        {isRunning ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <Square className="w-3 h-3" />
          </>
        ) : (
          <Play className="w-3 h-3" />
        )}
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isRunning && activeEntry ? (
        <>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <TimerDisplay startTime={activeEntry.startTime} className="text-sm text-green-700" />
          <button
            onClick={stop}
            disabled={isPending}
            aria-label="Stop timer"
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        </>
      ) : (
        <button
          onClick={start}
          disabled={isPending}
          aria-label="Start timer"
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          Start timer
        </button>
      )}
    </div>
  );
}

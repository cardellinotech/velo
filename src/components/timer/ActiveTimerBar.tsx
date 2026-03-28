"use client";

import Link from "next/link";
import { Square } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useActiveTimer } from "@/hooks/useActiveTimer";
import { TimerDisplay } from "./TimerDisplay";
import { useToast } from "@/hooks/useToast";

export function ActiveTimerBar() {
  const toast = useToast();
  const activeEntry = useActiveTimer();
  const stopMutation = useMutation(api.timeEntries.stop);

  const task = useQuery(
    api.tasks.get,
    activeEntry ? { taskId: activeEntry.taskId } : "skip"
  );
  const project = useQuery(
    api.projects.get,
    task ? { projectId: task.projectId } : "skip"
  );

  if (!activeEntry) return null;

  async function handleStop() {
    if (!activeEntry) return;
    try {
      await stopMutation({ timeEntryId: activeEntry._id });
      toast.success("Timer stopped");
    } catch {
      toast.error("Failed to stop timer");
    }
  }

  return (
    <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/60 rounded-xl px-3.5 py-2 text-sm shadow-xs">
      <span className="relative flex items-center justify-center w-5 h-5">
        <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-soft" />
        <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
      </span>
      {task ? (
        <Link
          href={`/tasks/${activeEntry.taskId}`}
          className="hidden sm:inline font-semibold text-text-primary hover:text-primary transition-colors truncate max-w-[140px] text-[13px]"
        >
          {task.title}
        </Link>
      ) : null}
      {project && (
        <span className="text-text-muted text-[11px] truncate max-w-[100px] hidden sm:inline">
          {project.name}
        </span>
      )}
      <TimerDisplay
        startTime={activeEntry.startTime}
        className="text-emerald-700 text-xs font-mono font-semibold tabular-nums bg-emerald-100/60 px-2 py-0.5 rounded-md"
      />
      <button
        onClick={handleStop}
        className="flex items-center justify-center w-11 h-11 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all duration-150"
        aria-label="Stop timer"
      >
        <Square className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

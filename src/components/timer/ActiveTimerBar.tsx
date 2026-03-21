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
    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-3 py-1.5 text-sm">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
      {task ? (
        <Link
          href={`/tasks/${activeEntry.taskId}`}
          className="font-medium text-green-800 hover:underline truncate max-w-[140px]"
        >
          {task.title}
        </Link>
      ) : (
        <span className="font-medium text-green-800 text-xs">Loading…</span>
      )}
      {project && (
        <span className="text-green-600 text-xs truncate max-w-[100px]">
          {project.name}
        </span>
      )}
      <TimerDisplay startTime={activeEntry.startTime} className="text-green-700 text-xs" />
      <button
        onClick={handleStop}
        className="text-green-700 hover:text-red-600 transition-colors ml-1"
        aria-label="Stop timer"
      >
        <Square className="w-4 h-4" />
      </button>
    </div>
  );
}

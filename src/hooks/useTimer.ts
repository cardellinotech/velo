"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id, Doc } from "../../convex/_generated/dataModel";
import { useActiveTimer } from "./useActiveTimer";
import { useToast } from "./useToast";

interface UseTimerReturn {
  isRunning: boolean;
  activeEntry: Doc<"timeEntries"> | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isPending: boolean;
}

export function useTimer(taskId: Id<"tasks">): UseTimerReturn {
  const toast = useToast();
  const activeEntry = useActiveTimer();
  const startMutation = useMutation(api.timeEntries.start);
  const stopMutation = useMutation(api.timeEntries.stop);
  const [isPending, setIsPending] = useState(false);

  // activeEntry is undefined while loading, null if none running, Doc if running
  const currentEntry =
    activeEntry != null && activeEntry.taskId === taskId ? activeEntry : null;
  const isRunning = currentEntry !== null;

  const start = useCallback(async () => {
    setIsPending(true);
    try {
      await startMutation({ taskId });
      toast.success("Timer started");
    } catch {
      toast.error("Failed to start timer");
    } finally {
      setIsPending(false);
    }
  }, [taskId, startMutation, toast]);

  const stop = useCallback(async () => {
    if (!currentEntry) return;
    setIsPending(true);
    try {
      await stopMutation({ timeEntryId: currentEntry._id });
      toast.success("Timer stopped");
    } catch {
      toast.error("Failed to stop timer");
    } finally {
      setIsPending(false);
    }
  }, [currentEntry, stopMutation, toast]);

  return {
    isRunning,
    activeEntry: currentEntry,
    start,
    stop,
    isPending,
  };
}

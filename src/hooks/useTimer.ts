"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import { useActiveTimer } from "./useActiveTimer";
import { useToast } from "./useToast";
import type { TimeEntry } from "@/types";

interface UseTimerReturn {
  isRunning: boolean;
  activeEntry: TimeEntry | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isPending: boolean;
}

export function useTimer(taskId: string): UseTimerReturn {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useActiveTimer();

  const currentEntry =
    data != null && data.taskId === taskId ? data : null;
  const isRunning = currentEntry !== null;

  const startMutation = useMutation({
    mutationFn: () => api.timeEntries.start({ taskId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.active() });
    },
  });

  const stopMutation = useMutation({
    mutationFn: () => api.timeEntries.stop(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.active() });
    },
  });

  const start = useCallback(async () => {
    try {
      await startMutation.mutateAsync();
      toast.success("Timer started");
    } catch {
      toast.error("Failed to start timer");
    }
  }, [startMutation, toast]);

  const stop = useCallback(async () => {
    if (!currentEntry) return;
    try {
      await stopMutation.mutateAsync();
      toast.success("Timer stopped");
    } catch {
      toast.error("Failed to stop timer");
    }
  }, [currentEntry, stopMutation, toast]);

  return {
    isRunning,
    activeEntry: currentEntry,
    start,
    stop,
    isPending: startMutation.isPending || stopMutation.isPending || isLoading,
  };
}

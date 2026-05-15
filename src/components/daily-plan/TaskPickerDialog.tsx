"use client";

import { cn } from "@/lib/utils";
import { TASK_TYPES, type TaskType } from "@/lib/constants";
import { Dialog } from "@/components/ui/Dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchTask {
  id: string;
  title: string;
  taskType: string;
  projectId: string;
  projectName: string;
  alreadyAdded: boolean;
}

interface TaskPickerDialogProps {
  open: boolean;
  onClose: () => void;
  dateStr: string;
}

async function searchActiveTasks(search: string, date: string): Promise<SearchTask[]> {
  const params = new URLSearchParams({ date });
  if (search.trim()) params.set("search", search.trim());
  const res = await fetch(`/api/daily-plan/search-tasks?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to search tasks");
  return res.json() as Promise<SearchTask[]>;
}

export function TaskPickerDialog({ open, onClose, dateStr }: TaskPickerDialogProps) {
  const [search, setSearch] = useState("");
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: [...queryKeys.dailyPlan.byDate(dateStr), "search", search],
    queryFn: () => searchActiveTasks(search, dateStr),
    enabled: open,
  });

  const addTask = useMutation({
    mutationFn: async (task: SearchTask) => {
      return api.dailyPlan.create({ date: dateStr, taskId: task.id, title: task.title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyPlan.byDate(dateStr) });
      toast.success("Added to plan");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to add task";
      if (message.includes("already")) {
        toast.info("Task already in today's plan.");
      } else {
        toast.error(message);
      }
    },
  });

  const handleAdd = (task: SearchTask) => {
    if (!task.alreadyAdded) {
      addTask.mutate(task);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Add Task" className="sm:max-w-lg" fullScreenMobile>
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border/40 bg-surface mb-4 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
        <Search className="w-4 h-4 text-text-muted shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
          autoFocus
        />
      </div>

      {/* Task list */}
      <div className="max-h-[400px] overflow-y-auto -mx-5 px-5">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-surface animate-pulse" />
            ))}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">
            {search ? "No tasks match your search." : "No active tasks found."}
          </p>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleAdd(task)}
                disabled={task.alreadyAdded}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all",
                  task.alreadyAdded
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-surface cursor-pointer"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{task.title}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium",
                      TASK_TYPES[task.taskType as TaskType]?.badgeBg,
                      TASK_TYPES[task.taskType as TaskType]?.badgeText
                    )}
                  >
                    {TASK_TYPES[task.taskType as TaskType]?.label}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-elevated text-[10px] font-medium text-text-secondary">
                    {task.projectName}
                  </span>
                </div>
                {task.alreadyAdded && (
                  <span className="text-[10px] text-text-muted font-medium">Added</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

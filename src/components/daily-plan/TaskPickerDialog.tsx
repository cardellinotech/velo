"use client";

import { cn } from "@/lib/utils";
import { TASK_TYPES, type TaskType } from "@/lib/constants";
import { Dialog } from "@/components/ui/Dialog";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "@/hooks/useToast";
import { Search } from "lucide-react";
import { useState } from "react";

interface TaskPickerDialogProps {
  open: boolean;
  onClose: () => void;
  dateStr: string;
}

export function TaskPickerDialog({ open, onClose, dateStr }: TaskPickerDialogProps) {
  const [search, setSearch] = useState("");
  const toast = useToast();
  const addTask = useMutation(api.dailyPlan.addTask);

  const tasks = useQuery(
    api.dailyPlan.searchActiveTasks,
    open ? { search: search || undefined, date: dateStr } : "skip"
  );

  const handleAdd = async (taskId: Id<"tasks">) => {
    try {
      await addTask({ date: dateStr, taskId });
      toast.success("Added to plan");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add task";
      if (message.includes("already")) {
        toast.info("Task already in today's plan.");
      } else {
        toast.error(message);
      }
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
        {!tasks ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-surface animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8">
            {search ? "No tasks match your search." : "No active tasks found."}
          </p>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <button
                key={task._id}
                onClick={() => !task.alreadyAdded && handleAdd(task._id)}
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

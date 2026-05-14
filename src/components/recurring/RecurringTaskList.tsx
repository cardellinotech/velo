"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { RecurringTaskTemplate } from "@/types";
import { RecurringTaskForm } from "./RecurringTaskForm";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { Pencil, Trash2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurringTaskListProps {
  projectId: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const recurrenceBadgeClass: Record<string, string> = {
  daily: "text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5",
  weekly: "text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5",
  monthly: "text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md px-2 py-0.5",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function recurrenceLabel(template: RecurringTaskTemplate): string {
  if (template.recurrence === "daily") return "Daily";
  if (template.recurrence === "weekly") {
    return `Weekly on ${DAY_LABELS[template.dayOfWeek ?? 0]}`;
  }
  return `Monthly on the ${ordinal(template.dayOfMonth ?? 1)}`;
}

export function RecurringTaskList({ projectId }: RecurringTaskListProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: queryKeys.recurringTasks.all(),
    queryFn: () => api.recurringTasks.list(),
  });

  const toggleActive = useMutation({
    mutationFn: (id: string) => api.recurringTasks.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringTasks.all() });
    },
    onError: () => {
      toast.error("Failed to update.");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.recurringTasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringTasks.all() });
      toast.success("Recurring task deleted.");
      setDeleteTemplateId(null);
    },
    onError: () => {
      toast.error("Failed to delete.");
    },
  });

  const [editTemplate, setEditTemplate] = useState<RecurringTaskTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  // Filter templates by project
  const projectTemplates = templates?.filter((t) => t.projectId === projectId) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-surface rounded-xl" />
        ))}
      </div>
    );
  }

  if (projectTemplates.length === 0) {
    return (
      <p className="text-sm text-text-secondary text-center py-6">
        No recurring tasks. Create one to automate routine work.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {projectTemplates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/60 bg-white px-4 py-3 shadow-card",
              !template.isActive && "opacity-60"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-text-primary truncate">
                  {template.title}
                </span>
                <TaskTypeBadge taskType={template.taskType} />
                <span className={recurrenceBadgeClass[template.recurrence]}>
                  {recurrenceLabel(template)}
                </span>
                {!template.isActive && (
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                    Paused
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Next: {format(new Date(template.nextDueDate), "MMM d, yyyy")}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleActive.mutate(template.id)}
                title={template.isActive ? "Pause" : "Resume"}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all duration-150"
              >
                {template.isActive ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setEditTemplate(template)}
                title="Edit"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all duration-150"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeleteTemplateId(template.id)}
                title="Delete"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/5 transition-all duration-150"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editTemplate && (
        <RecurringTaskForm
          open={!!editTemplate}
          onClose={() => setEditTemplate(null)}
          projectId={projectId}
          template={editTemplate}
        />
      )}

      <Dialog
        open={!!deleteTemplateId}
        onClose={() => setDeleteTemplateId(null)}
        title="Delete recurring task?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            This will permanently delete the recurring task template. Tasks already created will not be affected.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteTemplateId(null)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={() => deleteTemplateId && remove.mutate(deleteTemplateId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

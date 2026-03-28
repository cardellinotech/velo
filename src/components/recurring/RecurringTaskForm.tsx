"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { TASK_TYPES, PRIORITIES } from "@/lib/constants";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { computeNextDueDate } from "../../../convex/lib/recurrence";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RecurringTaskFormProps {
  open: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  template?: Doc<"recurringTaskTemplates">;
}

const DAYS_OF_WEEK = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

export function RecurringTaskForm({
  open,
  onClose,
  projectId,
  template,
}: RecurringTaskFormProps) {
  const toast = useToast();
  const createTemplate = useMutation(api.recurringTasks.create);
  const updateTemplate = useMutation(api.recurringTasks.update);
  const epics = useQuery(api.epics.listByProject, { projectId });

  const isEdit = !!template;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("task");
  const [priority, setPriority] = useState("medium");
  const [epicId, setEpicId] = useState("");
  const [recurrence, setRecurrence] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [titleError, setTitleError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (template) {
        setTitle(template.title);
        setDescription(template.description ?? "");
        setTaskType(template.taskType);
        setPriority(template.priority);
        setEpicId(template.epicId ?? "");
        setRecurrence(template.recurrence);
        setDayOfWeek(template.dayOfWeek ?? 1);
        setDayOfMonth(template.dayOfMonth ?? 1);
      } else {
        setTitle("");
        setDescription("");
        setTaskType("task");
        setPriority("medium");
        setEpicId("");
        setRecurrence("weekly");
        setDayOfWeek(1);
        setDayOfMonth(1);
      }
      setTitleError("");
    }
  }, [open, template]);

  const openEpics = epics?.filter((e) => e.status === "open") ?? [];

  const nextDueDate = computeNextDueDate(
    recurrence,
    recurrence === "weekly" ? dayOfWeek : undefined,
    recurrence === "monthly" ? dayOfMonth : undefined
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await updateTemplate({
          templateId: template._id,
          title: title.trim(),
          description: description.trim() || null,
          taskType: taskType as Doc<"recurringTaskTemplates">["taskType"],
          priority: priority as Doc<"recurringTaskTemplates">["priority"],
          epicId: epicId ? (epicId as Id<"epics">) : undefined,
          recurrence,
          dayOfWeek: recurrence === "weekly" ? dayOfWeek : undefined,
          dayOfMonth: recurrence === "monthly" ? dayOfMonth : undefined,
        });
        toast.success("Recurring task updated.");
      } else {
        await createTemplate({
          projectId,
          title: title.trim(),
          description: description.trim() || undefined,
          taskType: taskType as Doc<"recurringTaskTemplates">["taskType"],
          priority: priority as Doc<"recurringTaskTemplates">["priority"],
          epicId: epicId ? (epicId as Id<"epics">) : undefined,
          recurrence,
          dayOfWeek: recurrence === "weekly" ? dayOfWeek : undefined,
          dayOfMonth: recurrence === "monthly" ? dayOfMonth : undefined,
        });
        toast.success("Recurring task created.");
      }
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit recurring task" : "New recurring task"}
      noPadding
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Title */}
        <div className="px-6 pt-5 pb-4">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError("");
            }}
            placeholder="Task title"
            autoFocus
            className="text-xl font-semibold text-text-primary bg-transparent border-0 border-b-2 border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors w-full py-1 placeholder:text-text-secondary/40 placeholder:font-normal"
          />
          {titleError && (
            <p className="text-xs text-red-600 mt-1.5">{titleError}</p>
          )}
        </div>

        {/* Description */}
        <div className="px-6 pt-4 pb-4 border-b border-border">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
            Description <span className="normal-case font-normal">(optional)</span>
          </p>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Add more details…"
          />
        </div>

        {/* Details */}
        <div className="px-6 pb-4 border-b border-border">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-1">Details</p>
          <div className="flex flex-col gap-0.5">
            <DetailRow label="Type">
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="text-sm bg-transparent border-0 text-text-primary focus:outline-none cursor-pointer hover:text-primary py-2.5 sm:py-0"
              >
                {Object.entries(TASK_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="text-sm bg-transparent border-0 text-text-primary focus:outline-none cursor-pointer hover:text-primary py-2.5 sm:py-0"
                style={{ color: PRIORITIES[priority as keyof typeof PRIORITIES]?.color }}
              >
                {Object.entries(PRIORITIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </DetailRow>

            <DetailRow label="Epic">
              <select
                value={epicId}
                onChange={(e) => setEpicId(e.target.value)}
                className="text-sm bg-transparent border-0 text-text-primary focus:outline-none cursor-pointer hover:text-primary py-2.5 sm:py-0"
              >
                <option value="">No epic</option>
                {openEpics.map((epic) => (
                  <option key={epic._id} value={epic._id}>{epic.name}</option>
                ))}
              </select>
            </DetailRow>
          </div>
        </div>

        {/* Recurrence */}
        <div className="px-6 pt-4 pb-4 border-b border-border flex flex-col gap-3">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-wide">Recurrence</p>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  recurrence === r
                    ? "bg-primary text-white"
                    : "bg-surface text-text-secondary hover:text-text-primary border border-border"
                )}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {recurrence === "weekly" && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-text-secondary">Day of week</p>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDayOfWeek(value)}
                    className={cn(
                      "flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150",
                      dayOfWeek === value
                        ? "bg-indigo-600 text-white"
                        : "bg-surface text-text-secondary hover:text-text-primary border border-border"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrence === "monthly" && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-text-secondary">Day of month (1–28)</p>
              <input
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(28, parseInt(e.target.value) || 1));
                  setDayOfMonth(v);
                }}
                className="h-9 w-24 rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-slate-300 transition-all duration-150"
              />
            </div>
          )}

          <p className="text-xs text-text-secondary bg-surface rounded-lg px-3 py-2 border border-border/50">
            Next task will be created on{" "}
            <span className="font-medium text-text-primary">
              {format(new Date(nextDueDate), "EEEE, MMMM d, yyyy")}
            </span>
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-text-secondary w-20 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

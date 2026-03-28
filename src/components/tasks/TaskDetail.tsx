"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Clock, Trash2, User, Repeat } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { TimerControl } from "@/components/timer/TimerControl";
import { ManualTimeEntry } from "@/components/timer/ManualTimeEntry";
import { TaskTypeBadge } from "./TaskTypeBadge";
import { useToast } from "@/hooks/useToast";
import { TASK_STATUSES, TASK_TYPES, PRIORITIES } from "@/lib/constants";
import { formatDuration, formatDate } from "@/lib/formatTime";

interface TaskDetailProps {
  task: Doc<"tasks">;
  project: Doc<"projects">;
  onClose?: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  in_progress: "bg-blue-600 text-white hover:bg-blue-700",
  in_review: "bg-amber-500 text-white hover:bg-amber-600",
  done: "bg-green-600 text-white hover:bg-green-700",
};

export function TaskDetail({ task, project, onClose }: TaskDetailProps) {
  const toast = useToast();
  const router = useRouter();
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const epics = useQuery(api.epics.listByProject, { projectId: task.projectId });

  const timeEntries = useQuery(api.timeEntries.listByTask, { taskId: task._id });
  const removeEntry = useMutation(api.timeEntries.remove);

  const recurringTemplate = useQuery(
    api.recurringTasks.get,
    task.recurringTemplateId ? { templateId: task.recurringTemplateId } : "skip"
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [descEditing, setDescEditing] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const titleDirty = title.trim() !== task.title;
  const descriptionDirty = description.trim() !== (task.description ?? "");

  async function saveField(field: string, value: unknown) {
    try {
      await updateTask({ taskId: task._id, [field]: value });
    } catch {
      toast.error("Failed to save.");
    }
  }

  async function handleTitleBlur() {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
      return;
    }
    if (titleDirty) {
      await saveField("title", trimmed);
    }
  }

  async function handleDescSave() {
    if (descriptionDirty) {
      await saveField("description", description.trim() || undefined);
    }
    setDescEditing(false);
  }

  const openEpics = epics?.filter((e) => e.status === "open") ?? [];
  const allEpics = epics ?? [];
  const currentEpic = task.epicId ? allEpics.find((e) => e._id === task.epicId) : null;

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeTask({ taskId: task._id });
      toast.success("Task deleted.");
      if (onClose) {
        onClose();
      } else {
        router.push(`/projects/${task.projectId}`);
      }
    } catch {
      toast.error("Failed to delete task.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-6 pt-5 pb-3 text-xs text-text-secondary shrink-0">
        {onClose ? (
          <button onClick={onClose} className="hover:text-text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            {project.name}
          </button>
        ) : (
          <Link
            href={`/projects/${task.projectId}`}
            className="hover:text-text-primary transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {project.name}
          </Link>
        )}
        <span>/</span>
        <TaskTypeBadge taskType={task.taskType} className="text-[10px]" />
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Title + Description */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-5 min-w-0">
          {/* Title */}
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === "Enter" && titleRef.current?.blur()}
            className="text-2xl font-semibold text-text-primary bg-transparent border-0 border-b-2 border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors w-full py-1"
            aria-label="Task title"
          />

          {/* Recurring template indicator */}
          {task.recurringTemplateId && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Repeat className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {recurringTemplate === undefined ? null : recurringTemplate === null ? (
                <span>↻ Created from recurring template <span className="italic">(deleted template)</span></span>
              ) : (
                <span>↻ Created from recurring template</span>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Description</p>
            {descEditing ? (
              <div>
                <RichTextEditor
                  content={description}
                  onChange={setDescription}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleDescSave}>Save</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDescription(task.description ?? "");
                      setDescEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDescEditing(true)}
                onKeyDown={(e) => e.key === "Enter" && setDescEditing(true)}
                className="min-h-[100px] rounded-md border border-border px-3 py-2 text-sm cursor-text hover:border-primary transition-colors"
              >
                {description ? (
                  <div
                    className="tiptap-content"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                ) : (
                  <span className="text-text-secondary">Add a description…</span>
                )}
              </div>
            )}
          </div>

          {/* Time Tracking */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                Time Tracking
              </p>
              <button
                onClick={() => setManualEntryOpen(true)}
                className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
              >
                <Clock className="w-3 h-3" />
                Add manual
              </button>
            </div>

            <TimerControl taskId={task._id} variant="full" />

            {timeEntries && timeEntries.length > 0 && (
              <p className="text-xs text-text-secondary">
                Total:{" "}
                <span className="font-medium text-text-primary font-mono">
                  {formatDuration(timeEntries.reduce((sum, e) => sum + (e.duration ?? 0), 0))}
                </span>
              </p>
            )}

            {timeEntries === undefined && (
              <div className="animate-pulse space-y-1">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-9 bg-border rounded" />
                ))}
              </div>
            )}
            {timeEntries && timeEntries.length === 0 && (
              <p className="text-xs text-text-secondary">No time logged yet.</p>
            )}
            {timeEntries && timeEntries.map((entry) => (
              <TimeEntryRow
                key={entry._id}
                entry={entry}
                onRemove={() => removeEntry({ timeEntryId: entry._id })}
              />
            ))}
          </div>

          <ManualTimeEntry
            open={manualEntryOpen}
            onClose={() => setManualEntryOpen(false)}
            taskId={task._id}
          />

          {/* Delete */}
          <div className="pt-4 border-t border-border mt-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete task
            </Button>
          </div>
        </div>

        {/* RIGHT — Status + Details */}
        <div className="w-64 shrink-0 border-l border-border overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Status button */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${STATUS_STYLES[task.status]}`}
            >
              {TASK_STATUSES[task.status]}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-md shadow-md z-10 min-w-[140px]">
                {Object.entries(TASK_STATUSES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      saveField("status", key);
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface transition-colors ${task.status === key ? "font-medium text-primary" : "text-text-primary"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details section */}
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-2">Details</p>

            {/* Assignee placeholder */}
            <DetailRow label="Assignee">
              <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                <User className="w-4 h-4" />
                Unassigned
              </span>
            </DetailRow>

            {/* Priority */}
            <DetailRow label="Priority">
              <select
                value={task.priority}
                onChange={(e) => saveField("priority", e.target.value)}
                className="text-sm bg-transparent border-0 text-text-primary focus:outline-none cursor-pointer hover:text-primary"
                style={{ color: PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color }}
              >
                {Object.entries(PRIORITIES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </DetailRow>

            {/* Type */}
            <DetailRow label="Type">
              <select
                value={task.taskType}
                onChange={(e) => saveField("taskType", e.target.value)}
                className="text-sm bg-transparent border-0 text-text-primary focus:outline-none cursor-pointer hover:text-primary"
              >
                {Object.entries(TASK_TYPES).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </DetailRow>

            {/* Epic */}
            <DetailRow label="Epic">
              <select
                value={task.epicId ?? ""}
                onChange={(e) => saveField("epicId", e.target.value || undefined)}
                className="text-sm bg-transparent border-0 text-text-primary focus:outline-none cursor-pointer hover:text-primary max-w-[120px] truncate"
              >
                <option value="">None</option>
                {openEpics.map((epic) => (
                  <option key={epic._id} value={epic._id}>{epic.name}</option>
                ))}
                {currentEpic && currentEpic.status === "closed" && (
                  <option value={currentEpic._id}>{currentEpic.name} (closed)</option>
                )}
              </select>
            </DetailRow>

            {/* Labels placeholder */}
            <DetailRow label="Labels">
              <span className="text-sm text-text-secondary">None</span>
            </DetailRow>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete task">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete{" "}
            <span className="font-medium text-text-primary">{task.title}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function TimeEntryRow({
  entry,
  onRemove,
}: {
  entry: Doc<"timeEntries">;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0 text-sm group">
      <span className="text-text-secondary text-xs w-20 shrink-0">
        {formatDate(entry.startTime)}
      </span>
      <span className="font-mono text-xs tabular-nums text-text-primary">
        {entry.duration !== undefined ? formatDuration(entry.duration) : "—"}
      </span>
      {entry.description && (
        <span className="text-text-secondary text-xs truncate flex-1">
          {entry.description}
        </span>
      )}
      {entry.isManual && !entry.description && (
        <span className="text-xs text-text-secondary italic flex-1">manual</span>
      )}
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-600 transition-colors rounded shrink-0"
        aria-label="Delete time entry"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
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

"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useToast } from "@/hooks/useToast";
import { TASK_TYPES, PRIORITIES } from "@/lib/constants";
import type { TaskStatus } from "@/lib/constants";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  initialStatus?: TaskStatus;
}

export function TaskForm({
  open,
  onClose,
  projectId,
  initialStatus = "todo",
}: TaskFormProps) {
  const toast = useToast();
  const createTask = useMutation(api.tasks.create);
  const epics = useQuery(api.epics.listByProject, { projectId });

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<string>("task");
  const [epicId, setEpicId] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setTaskType("task");
      setEpicId("");
      setPriority("medium");
      setDescription("");
      setTitleError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Title is required.");
      titleRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await createTask({
        projectId,
        title: title.trim(),
        taskType: taskType as Doc<"tasks">["taskType"],
        epicId: epicId ? (epicId as Id<"epics">) : undefined,
        priority: priority as Doc<"tasks">["priority"],
        description: description.trim() || undefined,
        status: initialStatus,
      });
      toast.success("Task created.");
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const openEpics = epics?.filter((e) => e.status === "open") ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New task"
      noPadding
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Title */}
        <div className="px-6 pt-5 pb-4">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError("");
            }}
            placeholder="What needs to be done?"
            autoFocus
            className="text-2xl font-semibold text-text-primary bg-transparent border-0 border-b-2 border-transparent hover:border-border focus:border-primary focus:outline-none focus-visible:outline-none transition-colors w-full py-1 placeholder:text-text-secondary/40 placeholder:font-normal"
          />
          {titleError && (
            <p className="text-xs text-red-600 mt-1.5">{titleError}</p>
          )}
        </div>

        {/* Details section */}
        <div className="px-6 pb-4 border-b border-border">
          <p className="text-xs font-semibold text-text-primary uppercase tracking-wide mb-1">
            Details
          </p>
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

        {/* Description */}
        <div className="px-6 pt-4 pb-4">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
            Description <span className="normal-case font-normal">(optional)</span>
          </p>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Add more details…"
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Create task
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

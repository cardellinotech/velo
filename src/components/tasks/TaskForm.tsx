"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { TASK_TYPES, PRIORITIES } from "@/lib/constants";
import type { TaskStatus } from "@/lib/constants";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  task?: Doc<"tasks">;
  initialStatus?: TaskStatus;
}

export function TaskForm({
  open,
  onClose,
  projectId,
  task,
  initialStatus = "todo",
}: TaskFormProps) {
  const toast = useToast();
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const epics = useQuery(api.epics.listByProject, { projectId });

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<string>("task");
  const [epicId, setEpicId] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState("");

  const isEdit = !!task;

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTaskType(task.taskType);
      setEpicId(task.epicId ?? "");
      setPriority(task.priority);
      setDescription(task.description ?? "");
    } else {
      setTitle("");
      setTaskType("task");
      setEpicId("");
      setPriority("medium");
      setDescription("");
    }
    setTitleError("");
  }, [task, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateTask({
          taskId: task._id,
          title: title.trim(),
          taskType: taskType as Doc<"tasks">["taskType"],
          epicId: epicId ? (epicId as Id<"epics">) : undefined,
          priority: priority as Doc<"tasks">["priority"],
          description: description.trim() || undefined,
        });
        toast.success("Task updated.");
      } else {
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
      }
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
      title={isEdit ? "Edit task" : "New task"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <Input
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) setTitleError("");
          }}
          placeholder="What needs to be done?"
          error={titleError}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          {/* Task type */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">
              Type
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(TASK_TYPES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(PRIORITIES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Epic */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">
            Epic <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <select
            value={epicId}
            onChange={(e) => setEpicId(e.target.value)}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">No epic</option>
            {openEpics.map((epic) => (
              <option key={epic._id} value={epic._id}>
                {epic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-primary">
            Description <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            className="block w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

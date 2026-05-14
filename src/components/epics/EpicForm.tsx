"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

const EPIC_COLORS = [
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
];

interface EpicFormProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  epic?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
  };
}

export function EpicForm({ open, onClose, projectId, epic }: EpicFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(epic?.name ?? "");
  const [description, setDescription] = useState(epic?.description ?? "");
  const [color, setColor] = useState(epic?.color ?? EPIC_COLORS[0]);
  const [nameError, setNameError] = useState("");

  const createEpic = useMutation({
    mutationFn: (data: { projectId: string; name: string; description?: string; color?: string }) =>
      api.epics.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.byProject(projectId) });
      toast.success("Epic created.");
      setName("");
      setDescription("");
      setColor(EPIC_COLORS[0]);
      onClose();
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const updateEpic = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; color?: string } }) =>
      api.epics.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.epics.byProject(projectId) });
      toast.success("Epic updated.");
      onClose();
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const loading = createEpic.isPending || updateEpic.isPending;

  function handleClose() {
    setName(epic?.name ?? "");
    setDescription(epic?.description ?? "");
    setColor(epic?.color ?? EPIC_COLORS[0]);
    setNameError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Epic name is required.");
      return;
    }
    setNameError("");
    if (epic) {
      updateEpic.mutate({
        id: epic.id,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        },
      });
    } else {
      createEpic.mutate({
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={epic ? "Edit Epic" : "New Epic"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Epic name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          placeholder="e.g. Authentication & Onboarding"
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="epic-description" className="text-xs font-medium text-text-primary">
            Description (optional)
          </label>
          <textarea
            id="epic-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this epic cover?"
            rows={2}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-100 resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-primary">Color</span>
          <div className="flex gap-2 flex-wrap">
            {EPIC_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              >
                {color === c && (
                  <span className="flex items-center justify-center w-full h-full text-white text-xs font-bold">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {epic ? "Save changes" : "Create epic"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

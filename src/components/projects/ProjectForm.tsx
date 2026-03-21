"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  // If provided, edit mode; otherwise create mode
  project?: {
    _id: Id<"projects">;
    name: string;
    clientName?: string;
    description?: string;
  };
}

export function ProjectForm({ open, onClose, project }: ProjectFormProps) {
  const toast = useToast();
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);

  const [name, setName] = useState(project?.name ?? "");
  const [clientName, setClientName] = useState(project?.clientName ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setName(project?.name ?? "");
    setClientName(project?.clientName ?? "");
    setDescription(project?.description ?? "");
    setNameError("");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setNameError("");
    setLoading(true);
    try {
      if (project) {
        await updateProject({
          projectId: project._id,
          name: name.trim(),
          clientName: clientName.trim() || undefined,
          description: description.trim() || undefined,
        });
        toast.success("Project updated.");
      } else {
        await createProject({
          name: name.trim(),
          clientName: clientName.trim() || undefined,
          description: description.trim() || undefined,
        });
        toast.success("Project created.");
        setName("");
        setClientName("");
        setDescription("");
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
      onClose={handleClose}
      title={project ? "Edit Project" : "New Project"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          placeholder="e.g. Acme Corp Website"
          autoFocus
        />
        <Input
          label="Client name (optional)"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="e.g. Acme Corp"
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-xs font-medium text-text-primary">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of the project"
            rows={3}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-100 resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {project ? "Save changes" : "Create project"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

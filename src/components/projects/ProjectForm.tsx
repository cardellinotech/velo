"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  // If provided, edit mode; otherwise create mode
  project?: {
    _id: Id<"projects">;
    name: string;
    clientName?: string;
    description?: string;
    hourlyRate?: number;
    currency?: string;
  };
}

export function ProjectForm({ open, onClose, project }: ProjectFormProps) {
  const toast = useToast();
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);

  const [name, setName] = useState(project?.name ?? "");
  const [clientName, setClientName] = useState(project?.clientName ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [hourlyRate, setHourlyRate] = useState(project?.hourlyRate?.toString() ?? "");
  const [currency, setCurrency] = useState(project?.currency ?? "");
  const [nameError, setNameError] = useState("");
  const [loading, setLoading] = useState(false);

  const rateSymbol = currency ? getCurrencySymbol(currency) : "€";

  function handleClose() {
    setName(project?.name ?? "");
    setClientName(project?.clientName ?? "");
    setDescription(project?.description ?? "");
    setHourlyRate(project?.hourlyRate?.toString() ?? "");
    setCurrency(project?.currency ?? "");
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
    const parsedRate = hourlyRate.trim() ? parseFloat(hourlyRate.trim()) : undefined;
    try {
      if (project) {
        await updateProject({
          projectId: project._id,
          name: name.trim(),
          clientName: clientName.trim() || undefined,
          description: description.trim() || undefined,
          hourlyRate: parsedRate,
          currency: currency || undefined,
        });
        toast.success("Project updated.");
      } else {
        await createProject({
          name: name.trim(),
          clientName: clientName.trim() || undefined,
          description: description.trim() || undefined,
          hourlyRate: parsedRate,
          currency: currency || undefined,
        });
        toast.success("Project created.");
        setName("");
        setClientName("");
        setDescription("");
        setHourlyRate("");
        setCurrency("");
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
          <label className="text-xs font-medium text-text-primary">Currency (optional)</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={cn(
              "h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
              "transition-colors duration-100"
            )}
          >
            <option value="">Default (EUR)</option>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-primary">
            Hourly rate (optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none select-none">
              {rateSymbol}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="85"
              className={cn(
                "h-9 w-full rounded-md border border-border bg-white pr-3 text-sm text-text-primary",
                "placeholder:text-text-secondary",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "transition-colors duration-100",
                rateSymbol.length > 1 ? "pl-12" : "pl-7"
              )}
            />
          </div>
        </div>
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
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {project ? "Save changes" : "Create project"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

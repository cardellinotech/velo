"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/hooks/useToast";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";
import { ArrowLeft, AlertTriangle, Repeat } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { RecurringTaskList } from "@/components/recurring/RecurringTaskList";
import { RecurringTaskForm } from "@/components/recurring/RecurringTaskForm";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const projectId = params.projectId as Id<"projects">;

  const project = useQuery(api.projects.get, { projectId });
  const userSettings = useQuery(api.userSettings.get);
  const updateProject = useMutation(api.projects.update);
  const archiveProject = useMutation(api.projects.archive);
  const unarchiveProject = useMutation(api.projects.unarchive);

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [currency, setCurrency] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [recurringFormOpen, setRecurringFormOpen] = useState(false);

  const recurringTemplates = useQuery(api.recurringTasks.list, { projectId });

  // Initialize form when project loads
  const [initialized, setInitialized] = useState(false);
  if (project && !initialized) {
    setName(project.name);
    setClientName(project.clientName ?? "");
    setDescription(project.description ?? "");
    setHourlyRate(project.hourlyRate?.toString() ?? "");
    setCurrency(project.currency ?? "");
    setInitialized(true);
  }

  const defaultCurrency = userSettings?.defaultCurrency ?? "EUR";
  const rateSymbol = currency ? getCurrencySymbol(currency) : getCurrencySymbol(defaultCurrency);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setNameError("");
    setSaving(true);
    const parsedRate = hourlyRate.trim() ? parseFloat(hourlyRate.trim()) : undefined;
    try {
      await updateProject({
        projectId,
        name: name.trim(),
        clientName: clientName.trim() || undefined,
        description: description.trim() || undefined,
        hourlyRate: parsedRate,
        currency: currency || undefined,
      });
      toast.success("Project updated.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    setArchiving(true);
    try {
      await archiveProject({ projectId });
      toast.success("Project archived.");
      router.push("/projects");
    } catch {
      toast.error("Something went wrong. Please try again.");
      setArchiving(false);
    }
  }

  async function handleUnarchive() {
    try {
      await unarchiveProject({ projectId });
      toast.success("Project restored.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (project === undefined) {
    return (
      <div className="flex flex-col gap-5 max-w-lg animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-surface rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-surface rounded" />
            <div className="h-3 w-24 bg-surface rounded" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-10 bg-surface rounded-lg" />
          <div className="h-10 bg-surface rounded-lg" />
          <div className="h-24 bg-surface rounded-lg" />
        </div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="text-sm text-text-secondary">Project not found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="flex items-center justify-center w-11 h-11 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-all duration-150"
          aria-label="Back to board"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Project Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">{project.name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <Input
          label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          placeholder="e.g. Acme Corp Website"
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
              "h-9 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "hover:border-slate-300 transition-all duration-150"
            )}
          >
            <option value="">Default ({defaultCurrency})</option>
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
                "h-9 w-full rounded-lg border border-border/60 bg-white pr-3.5 text-sm text-text-primary",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                "hover:border-slate-300 transition-all duration-150",
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
            className={cn(
              "w-full rounded-lg border border-border/60 bg-white px-3.5 py-2.5 text-sm text-text-primary",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "hover:border-slate-300",
              "transition-all duration-150 resize-none"
            )}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      <hr className="border-border/40" />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-text-secondary" />
            <h2 className="text-sm font-semibold text-text-primary">Recurring Tasks</h2>
            {recurringTemplates !== undefined && recurringTemplates.length > 0 && (
              <span className="text-xs font-medium text-text-secondary bg-surface border border-border/50 rounded-full px-2 py-0.5">
                {recurringTemplates.length}
              </span>
            )}
          </div>
          <Button size="sm" variant="secondary" onClick={() => setRecurringFormOpen(true)}>
            New recurring task
          </Button>
        </div>
        <RecurringTaskList projectId={projectId} />
        <RecurringTaskForm
          open={recurringFormOpen}
          onClose={() => setRecurringFormOpen(false)}
          projectId={projectId}
        />
      </div>

      <hr className="border-border/40" />

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-text-primary">Danger zone</h2>
        {project.status === "active" ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-error/20 bg-error/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-error/10 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-error" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Archive project</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Archiving will hide this project. You can unarchive it later.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setArchiveOpen(true)}
            >
              Archive
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/60 bg-surface/50 p-5">
            <div>
              <p className="text-sm font-medium text-text-primary">Restore project</p>
              <p className="text-xs text-text-secondary mt-0.5">
                This project is archived. Restore it to make it active again.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleUnarchive}>
              Unarchive
            </Button>
          </div>
        )}
      </div>

      {/* Archive confirmation dialog */}
      <Dialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive project?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            Archiving will hide <strong className="text-text-primary">{project.name}</strong> from
            your projects list. You can unarchive it later from project settings.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setArchiveOpen(false)}
              disabled={archiving}
            >
              Cancel
            </Button>
            <Button variant="destructive" loading={archiving} onClick={handleArchive}>
              Archive project
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

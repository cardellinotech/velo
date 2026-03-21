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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const projectId = params.projectId as Id<"projects">;

  const project = useQuery(api.projects.get, { projectId });
  const updateProject = useMutation(api.projects.update);
  const archiveProject = useMutation(api.projects.archive);
  const unarchiveProject = useMutation(api.projects.unarchive);

  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Initialize form when project loads
  const [initialized, setInitialized] = useState(false);
  if (project && !initialized) {
    setName(project.name);
    setClientName(project.clientName ?? "");
    setDescription(project.description ?? "");
    setInitialized(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setNameError("");
    setSaving(true);
    try {
      await updateProject({
        projectId,
        name: name.trim(),
        clientName: clientName.trim() || undefined,
        description: description.trim() || undefined,
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
      <div className="flex flex-col gap-4 max-w-lg animate-pulse">
        <div className="h-4 w-32 bg-border rounded" />
        <div className="h-9 bg-border rounded-md" />
        <div className="h-9 bg-border rounded-md" />
        <div className="h-20 bg-border rounded-md" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="text-sm text-text-secondary">Project not found.</div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Back to board"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Project Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">{project.name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
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
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      <hr className="border-border" />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Danger zone</h2>
        {project.status === "active" ? (
          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="text-sm font-medium text-text-primary">Archive project</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Archiving will hide this project. You can unarchive it later.
              </p>
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
          <div className="flex items-center justify-between rounded-md border border-border p-4">
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
          <p className="text-sm text-text-secondary">
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

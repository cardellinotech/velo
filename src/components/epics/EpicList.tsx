"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { EpicForm } from "./EpicForm";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { Edit2, Lock, Unlock } from "lucide-react";

interface EpicListProps {
  epics: Doc<"epics">[];
  projectId: Id<"projects">;
}

function EpicRow({ epic, projectId }: { epic: Doc<"epics">; projectId: Id<"projects"> }) {
  const toast = useToast();
  const closeEpic = useMutation(api.epics.close);
  const reopenEpic = useMutation(api.epics.reopen);
  const [editOpen, setEditOpen] = useState(false);

  async function handleToggleStatus() {
    try {
      if (epic.status === "open") {
        await closeEpic({ epicId: epic._id });
        toast.success("Epic closed.");
      } else {
        await reopenEpic({ epicId: epic._id });
        toast.success("Epic reopened.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-4 py-3 hover:bg-surface transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          {epic.color && (
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: epic.color }}
              aria-hidden="true"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{epic.name}</p>
            {epic.description && (
              <p className="text-xs text-text-secondary mt-0.5 truncate">{epic.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-sm ${
            epic.status === "open"
              ? "bg-green-50 text-green-700"
              : "bg-surface text-text-secondary"
          }`}>
            {epic.status}
          </span>
          <button
            onClick={() => setEditOpen(true)}
            className="p-1 text-text-secondary hover:text-text-primary rounded transition-colors"
            aria-label="Edit epic"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleStatus}
            className="p-1 text-text-secondary hover:text-text-primary rounded transition-colors"
            aria-label={epic.status === "open" ? "Close epic" : "Reopen epic"}
          >
            {epic.status === "open" ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <EpicForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        projectId={projectId}
        epic={epic}
      />
    </>
  );
}

export function EpicList({ epics, projectId }: EpicListProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const open = epics.filter((e) => e.status === "open");
  const closed = epics.filter((e) => e.status === "closed");

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {open.length} open · {closed.length} closed
          </p>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            New epic
          </Button>
        </div>

        {epics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-md bg-surface">
            <p className="text-sm font-medium text-text-primary">No epics yet</p>
            <p className="text-sm text-text-secondary mt-1 mb-4">
              Group related tasks into epics to track larger pieces of work.
            </p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              Create first epic
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {open.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Open</p>
                {open.map((epic) => (
                  <EpicRow key={epic._id} epic={epic} projectId={projectId} />
                ))}
              </div>
            )}
            {closed.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-2">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Closed</p>
                {closed.map((epic) => (
                  <EpicRow key={epic._id} epic={epic} projectId={projectId} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <EpicForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
      />
    </>
  );
}

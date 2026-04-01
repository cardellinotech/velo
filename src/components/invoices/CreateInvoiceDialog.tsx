"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { getPresetRange } from "@/lib/dateRanges";
import { FileText } from "lucide-react";

interface ProjectOption {
  _id: Id<"projects">;
  name: string;
  clientName?: string;
  hourlyRate?: number;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  projects: ProjectOption[];
}

function tsToDateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dateStrToTs(s: string): number {
  return new Date(s + "T00:00:00").getTime();
}

const defaultRange = getPresetRange("this_month");

export function CreateInvoiceDialog({
  open,
  onClose,
  projects,
}: CreateInvoiceDialogProps) {
  const router = useRouter();
  const createInvoice = useMutation(api.invoices.create);

  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | "">("");
  const [periodStart, setPeriodStart] = useState(defaultRange.startDate);
  const [periodEnd, setPeriodEnd] = useState(defaultRange.endDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  const entries = useQuery(
    api.billing.entries,
    selectedProjectId
      ? { startDate: periodStart, endDate: periodEnd, projectId: selectedProjectId as Id<"projects"> }
      : "skip"
  );

  async function handleCreate() {
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const hourlyRate = selectedProject?.hourlyRate ?? 0;
      let lineItems: { date?: number; description: string; hours: number; rate: number; amount: number }[] | undefined;

      if (hourlyRate > 0 && entries && entries.length > 0) {
        const taskMap = new Map<string, { hours: number; taskTitle: string; earliestDate: number }>();
        for (const entry of entries) {
          const hours = entry.durationMs / 3_600_000;
          const existing = taskMap.get(entry.taskId);
          if (existing) {
            existing.hours += hours;
            existing.earliestDate = Math.min(existing.earliestDate, entry.startTime);
          } else {
            taskMap.set(entry.taskId, { hours, taskTitle: entry.taskTitle, earliestDate: entry.startTime });
          }
        }
        lineItems = Array.from(taskMap.values())
          .sort((a, b) => a.earliestDate - b.earliestDate)
          .map(({ hours, taskTitle, earliestDate }) => {
            const roundedHours = Math.round(hours * 100) / 100;
            return {
              date: earliestDate,
              description: taskTitle || "General",
              hours: roundedHours,
              rate: hourlyRate,
              amount: Math.round(roundedHours * hourlyRate * 100) / 100,
            };
          });
      }

      const invoiceId = await createInvoice({
        projectId: selectedProjectId as Id<"projects">,
        periodStart,
        periodEnd,
        lineItems: lineItems && lineItems.length > 0 ? lineItems : undefined,
      });
      onClose();
      router.push(`/invoices/${invoiceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setSelectedProjectId("");
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create Invoice" className="max-w-sm">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-primary">
            Project <span className="text-error">*</span>
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value as Id<"projects"> | "")}
            className="h-10 w-full rounded-lg border border-border/60 bg-white px-3.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}{p.clientName ? ` — ${p.clientName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-primary">Period start</label>
            <input
              type="date"
              value={tsToDateStr(periodStart)}
              onChange={(e) => e.target.value && setPeriodStart(dateStrToTs(e.target.value))}
              className="h-10 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-primary">Period end</label>
            <input
              type="date"
              value={tsToDateStr(periodEnd)}
              onChange={(e) => e.target.value && setPeriodEnd(dateStrToTs(e.target.value))}
              className="h-10 w-full rounded-lg border border-border/60 bg-white px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-error bg-error-bg px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="secondary" size="md" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreate}
            disabled={!selectedProjectId || isSubmitting}
            loading={isSubmitting}
          >
            <FileText className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

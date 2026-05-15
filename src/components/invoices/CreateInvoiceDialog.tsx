"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { getPresetRange } from "@/lib/dateRanges";
import { FileText } from "lucide-react";
import type { Project } from "@/types";

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
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
  const queryClient = useQueryClient();

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState(defaultRange.startDate);
  const [periodEnd, setPeriodEnd] = useState(defaultRange.endDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const billingParams = selectedProjectId
    ? { startDate: periodStart, endDate: periodEnd, projectId: selectedProjectId }
    : undefined;

  const { data: entries } = useQuery({
    queryKey: queryKeys.billing.entries(billingParams),
    queryFn: () => api.billing.entries(billingParams),
    enabled: !!selectedProjectId,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: unknown) => api.invoices.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() });
    },
  });

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
          // The billing entries API returns durationMs (aliased from duration)
          const rawEntry = entry as unknown as { durationMs?: number; duration?: number };
          const hours = (rawEntry.durationMs ?? rawEntry.duration ?? 0) / 3_600_000;
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

      const invoice = await createInvoiceMutation.mutateAsync({
        projectId: selectedProjectId,
        periodStart,
        periodEnd,
        lineItems: lineItems && lineItems.length > 0 ? lineItems : undefined,
      });
      onClose();
      router.push(`/invoices/${invoice.id}`);
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
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-10 w-full rounded-lg border border-border/60 bg-white px-3.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150"
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
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

"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { formatAmount } from "@/lib/currency";
import type { BillingEntry } from "../../../convex/billing";
import { FileText } from "lucide-react";

interface LineItemPreview {
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

interface ProjectOption {
  _id: Id<"projects">;
  name: string;
  clientName?: string;
  hourlyRate?: number;
  currency?: string;
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  entries: BillingEntry[];
  periodStart: number;
  periodEnd: number;
  projects: ProjectOption[];
}

function groupEntriesByEpic(
  entries: BillingEntry[],
  hourlyRate: number
): LineItemPreview[] {
  const epicMap = new Map<string, { hours: number; epicName: string | null }>();

  for (const entry of entries) {
    const key = entry.epicName ?? "__none__";
    const existing = epicMap.get(key);
    const hours = entry.durationMs / 3_600_000;
    if (existing) {
      existing.hours += hours;
    } else {
      epicMap.set(key, { hours, epicName: entry.epicName });
    }
  }

  return Array.from(epicMap.entries()).map(([, { hours, epicName }]) => {
    const roundedHours = Math.round(hours * 100) / 100;
    const amount = Math.round(roundedHours * hourlyRate * 100) / 100;
    return {
      description: epicName ?? "General",
      hours: roundedHours,
      rate: hourlyRate,
      amount,
    };
  });
}

export function CreateInvoiceDialog({
  open,
  onClose,
  entries,
  periodStart,
  periodEnd,
  projects,
}: CreateInvoiceDialogProps) {
  const router = useRouter();
  const createInvoice = useMutation(api.invoices.create);

  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  // Filter entries for selected project that have time tracked
  const projectEntries = selectedProjectId
    ? entries.filter((e) => e.projectId === selectedProjectId)
    : [];

  // Projects that actually have tracked time
  const projectIdsWithTime = new Set(entries.map((e) => e.projectId));
  const eligibleProjects = projects.filter((p) => projectIdsWithTime.has(p._id));

  const hourlyRate = selectedProject?.hourlyRate ?? 0;
  const currency = selectedProject?.currency ?? "EUR";

  const lineItems: LineItemPreview[] =
    selectedProject && hourlyRate > 0
      ? groupEntriesByEpic(projectEntries, hourlyRate)
      : [];

  const subtotal = lineItems.reduce((s, li) => s + li.amount, 0);

  async function handleCreate() {
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const invoiceId = await createInvoice({
        projectId: selectedProjectId as Id<"projects">,
        periodStart,
        periodEnd,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
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
    <Dialog open={open} onClose={handleClose} title="Create Invoice" className="max-w-lg">
      <div className="flex flex-col gap-5">
        {/* Project selector */}
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
            {eligibleProjects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}{p.clientName ? ` — ${p.clientName}` : ""}
              </option>
            ))}
          </select>
          {eligibleProjects.length === 0 && (
            <p className="text-xs text-text-muted">No projects have tracked time in this period.</p>
          )}
        </div>

        {/* Line items preview */}
        {selectedProject && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-primary uppercase tracking-wide">
                Line items preview
              </p>
              {!selectedProject.hourlyRate && (
                <span className="text-xs text-warning bg-warning-bg px-2 py-0.5 rounded-md">
                  No hourly rate set
                </span>
              )}
            </div>

            {lineItems.length > 0 ? (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface border-b border-border/40">
                      <th className="px-3 py-2.5 text-left font-medium text-text-secondary">Description</th>
                      <th className="px-3 py-2.5 text-right font-medium text-text-secondary">Hours</th>
                      <th className="px-3 py-2.5 text-right font-medium text-text-secondary">Rate</th>
                      <th className="px-3 py-2.5 text-right font-medium text-text-secondary">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/30 last:border-0 hover:bg-surface/50"
                      >
                        <td className="px-3 py-2.5 text-text-primary">{li.description}</td>
                        <td className="px-3 py-2.5 text-right text-text-secondary font-mono">
                          {li.hours.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-text-secondary font-mono">
                          {formatAmount(li.rate, currency)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-text-primary font-semibold font-mono">
                          {formatAmount(li.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface border-t border-border/60">
                      <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-semibold text-text-primary">
                        Subtotal
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-bold text-text-primary font-mono">
                        {formatAmount(subtotal, currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-surface py-8">
                <FileText className="w-8 h-8 text-text-muted" />
                <p className="text-sm text-text-secondary text-center">
                  {selectedProject.hourlyRate
                    ? "No tracked time for this project in the selected period."
                    : "Set an hourly rate on this project to auto-generate line items."}
                </p>
                <p className="text-xs text-text-muted">
                  You can add line items manually after creating the invoice.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs text-error bg-error-bg px-3 py-2 rounded-lg">{error}</p>
        )}

        {/* Actions */}
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

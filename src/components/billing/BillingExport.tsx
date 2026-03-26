"use client";

import Papa from "papaparse";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TASK_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/formatTime";
import { formatRangeForFilename } from "@/lib/dateRanges";
import type { BillingEntry } from "../../../convex/billing";

interface BillingExportProps {
  entries: BillingEntry[];
  startDate: number;
  endDate: number;
}

export function BillingExport({ entries, startDate, endDate }: BillingExportProps) {
  function handleExport() {
    const rows = entries.map((entry) => {
      const hours = entry.durationMs / 3_600_000;
      const amount = entry.hourlyRate ? hours * entry.hourlyRate : null;
      return {
        Project: entry.projectName,
        Client: entry.clientName ?? "",
        Epic: entry.epicName ?? "",
        Task: entry.taskTitle,
        "Task Type": TASK_TYPES[entry.taskType].label,
        Date: formatDate(entry.startTime),
        Hours: hours.toFixed(2),
        "Rate (€/h)": entry.hourlyRate ?? "",
        "Amount (€)": amount !== null ? amount.toFixed(2) : "",
        Description: entry.description ?? "",
      };
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `velo-billing-${formatRangeForFilename(startDate, endDate)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={entries.length === 0}>
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  );
}

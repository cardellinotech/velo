"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DateRangePicker } from "./DateRangePicker";
import { BillingTable } from "./BillingTable";
import { BillingExport } from "./BillingExport";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDurationShort } from "@/lib/formatTime";
import { getPresetRange, type DateRange, type DateRangePreset } from "@/lib/dateRanges";
import { Clock, FolderOpen, CheckSquare, Square, StopCircle } from "lucide-react";

const defaultRange = getPresetRange("this_month");

export function BillingSummary() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | undefined>(undefined);

  const stopTimer = useMutation(api.timeEntries.stop);

  const projects = useQuery(api.projects.listActive);
  const summaryData = useQuery(api.billing.summary, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    projectId: selectedProjectId,
  });
  const entriesData = useQuery(api.billing.entries, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    projectId: selectedProjectId,
  });

  // Also fetch running timer task info if there is one
  const activeTimer = useQuery(api.timeEntries.getActive);

  const isLoading = entriesData === undefined || summaryData === undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker
          preset={dateRange.preset}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
        <select
          value={selectedProjectId ?? ""}
          onChange={(e) => setSelectedProjectId(e.target.value ? (e.target.value as Id<"projects">) : undefined)}
          className="h-8 rounded-md border border-border bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">All projects</option>
          {projects?.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}{p.clientName ? ` — ${p.clientName}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Running timer banner */}
      {activeTimer && (
        <div className="flex items-center gap-3 rounded-md border border-success/30 bg-success/5 px-4 py-3">
          <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
          <div className="flex-1 text-sm text-text-primary">
            Timer running — not included in totals
          </div>
          <TimerDisplay startTime={activeTimer.startTime} className="text-sm text-success" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => stopTimer({ timeEntryId: activeTimer._id })}
            className="text-text-secondary hover:text-error shrink-0"
          >
            <StopCircle className="w-4 h-4" />
            Stop
          </Button>
        </div>
      )}

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-border p-4 animate-pulse">
              <div className="h-7 w-16 bg-surface rounded mb-1" />
              <div className="h-3 w-24 bg-surface rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold text-text-primary">
                  {formatDurationShort(summaryData.totalDurationMs)}
                </p>
                <p className="text-xs text-text-secondary">Total hours</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FolderOpen className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold text-text-primary">{summaryData.projectCount}</p>
                <p className="text-xs text-text-secondary">Projects</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <CheckSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-semibold text-text-primary">{summaryData.taskCount}</p>
                <p className="text-xs text-text-secondary">Tasks</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Table + Export */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-primary">Breakdown</h2>
          {entriesData && (
            <BillingExport
              entries={entriesData}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          )}
        </div>
        {isLoading ? (
          <div className="rounded-md border border-border overflow-hidden animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center px-4 py-3 border-b border-border/50 last:border-0">
                <div className="h-4 w-4 bg-surface rounded mr-2" />
                <div className="h-4 flex-1 bg-surface rounded" />
                <div className="h-4 w-16 bg-surface rounded ml-2" />
              </div>
            ))}
          </div>
        ) : (
          <BillingTable entries={entriesData} />
        )}
      </div>
    </div>
  );
}

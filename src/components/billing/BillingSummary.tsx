"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DateRangePicker } from "./DateRangePicker";
import { BillingTable } from "./BillingTable";
import { BillingExport } from "./BillingExport";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { Button } from "@/components/ui/Button";
import { formatDurationShort } from "@/lib/formatTime";
import { getPresetRange, type DateRange } from "@/lib/dateRanges";
import { Clock, Layers, FolderOpen, Banknote, Square } from "lucide-react";
import { cn } from "@/lib/utils";

const defaultRange = getPresetRange("this_month");

const summaryConfigs = [
  {
    key: "hours",
    label: "Total hours",
    icon: Clock,
    gradient: "from-indigo-500 to-violet-500",
    iconBg: "bg-indigo-500/10 text-indigo-600",
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderOpen,
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    key: "tasks",
    label: "Tasks tracked",
    icon: Layers,
    gradient: "from-violet-500 to-purple-500",
    iconBg: "bg-violet-500/10 text-violet-600",
  },
  {
    key: "amount",
    label: "Total amount",
    icon: Banknote,
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
] as const;

function SummaryCard({
  label,
  value,
  icon: Icon,
  gradient,
  iconBg,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className="relative group bg-white rounded-xl border border-border/60 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-px overflow-hidden">
      <div className={cn("absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r", gradient)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-text-primary tracking-tight">{value}</p>
          <p className="text-xs font-medium text-text-secondary mt-1">{label}</p>
        </div>
        <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

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

  const activeTimer = useQuery(api.timeEntries.getActive);

  const isLoading = entriesData === undefined || summaryData === undefined;

  const hasAmount = summaryData?.totalAmount !== null && summaryData?.totalAmount !== undefined;

  return (
    <div className="flex flex-col gap-6">
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
          className="h-9 rounded-lg border border-border/60 bg-white px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
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
        <div className="relative flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50/50 px-5 py-3.5 shadow-xs overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
          <div className="relative flex items-center gap-3 flex-1">
            <span className="relative flex items-center justify-center w-5 h-5">
              <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse-soft" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
            </span>
            <span className="text-sm font-medium text-text-primary">
              Timer running — not included in totals
            </span>
          </div>
          <TimerDisplay startTime={activeTimer.startTime} className="relative text-sm text-emerald-700 font-mono font-semibold tabular-nums" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => stopTimer({ timeEntryId: activeTimer._id })}
            className="relative text-text-secondary hover:text-error hover:bg-error/5 shrink-0"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </Button>
        </div>
      )}

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/60 p-5 animate-pulse overflow-hidden">
              <div className="h-[3px] bg-surface rounded -mt-5 -mx-5 mb-5" />
              <div className="h-8 w-16 bg-surface rounded-md mb-2" />
              <div className="h-3 w-24 bg-surface rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("grid gap-5", hasAmount ? "grid-cols-4" : "grid-cols-3")}>
          <SummaryCard
            label={summaryConfigs[0].label}
            value={formatDurationShort(summaryData.totalDurationMs)}
            icon={summaryConfigs[0].icon}
            gradient={summaryConfigs[0].gradient}
            iconBg={summaryConfigs[0].iconBg}
          />
          <SummaryCard
            label={summaryConfigs[1].label}
            value={summaryData.projectCount}
            icon={summaryConfigs[1].icon}
            gradient={summaryConfigs[1].gradient}
            iconBg={summaryConfigs[1].iconBg}
          />
          <SummaryCard
            label={summaryConfigs[2].label}
            value={summaryData.taskCount}
            icon={summaryConfigs[2].icon}
            gradient={summaryConfigs[2].gradient}
            iconBg={summaryConfigs[2].iconBg}
          />
          {hasAmount && (
            <SummaryCard
              label={summaryConfigs[3].label}
              value={`€${(summaryData.totalAmount as number).toFixed(2)}`}
              icon={summaryConfigs[3].icon}
              gradient={summaryConfigs[3].gradient}
              iconBg={summaryConfigs[3].iconBg}
            />
          )}
        </div>
      )}

      {/* Table + Export */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">Breakdown</h2>
          {entriesData && (
            <BillingExport
              entries={entriesData}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          )}
        </div>
        {isLoading ? (
          <div className="rounded-xl border border-border/60 overflow-hidden animate-pulse">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center px-5 py-3.5 border-b border-border/40 last:border-0">
                <div className="h-4 w-4 bg-surface rounded mr-3" />
                <div className="h-4 flex-1 bg-surface rounded" />
                <div className="h-4 w-16 bg-surface rounded ml-3" />
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

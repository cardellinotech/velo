"use client";

import { cn } from "@/lib/utils";
import { DateRange, DateRangePreset, getPresetRange } from "@/lib/dateRanges";
import { format, parse } from "date-fns";

interface DateRangePickerProps {
  preset: DateRangePreset;
  startDate: number;
  endDate: number;
  onChange: (range: DateRange) => void;
}

const PRESETS: { value: Exclude<DateRangePreset, "custom">; label: string }[] = [
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
];

export function DateRangePicker({ preset, startDate, endDate, onChange }: DateRangePickerProps) {
  function handlePreset(p: Exclude<DateRangePreset, "custom">) {
    onChange(getPresetRange(p));
  }

  function handleCustom() {
    onChange({ startDate, endDate, preset: "custom", label: "Custom" });
  }

  function handleStartDate(value: string) {
    if (!value) return;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    parsed.setHours(0, 0, 0, 0);
    onChange({ startDate: parsed.getTime(), endDate, preset: "custom", label: "Custom" });
  }

  function handleEndDate(value: string) {
    if (!value) return;
    const parsed = parse(value, "yyyy-MM-dd", new Date());
    parsed.setHours(23, 59, 59, 999);
    onChange({ startDate, endDate: parsed.getTime(), preset: "custom", label: "Custom" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className={cn(
            "h-8 px-3 text-xs font-medium rounded-md border transition-colors duration-100",
            preset === p.value
              ? "bg-primary text-white border-primary"
              : "bg-white text-text-primary border-border hover:bg-surface"
          )}
        >
          {p.label}
        </button>
      ))}
      <button
        onClick={handleCustom}
        className={cn(
          "h-8 px-3 text-xs font-medium rounded-md border transition-colors duration-100",
          preset === "custom"
            ? "bg-primary text-white border-primary"
            : "bg-white text-text-primary border-border hover:bg-surface"
        )}
      >
        Custom
      </button>

      {preset === "custom" && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={format(new Date(startDate), "yyyy-MM-dd")}
            onChange={(e) => handleStartDate(e.target.value)}
            className="h-8 rounded-md border border-border bg-white px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <span className="text-xs text-text-secondary">to</span>
          <input
            type="date"
            value={format(new Date(endDate), "yyyy-MM-dd")}
            onChange={(e) => handleEndDate(e.target.value)}
            className="h-8 rounded-md border border-border bg-white px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      )}
    </div>
  );
}

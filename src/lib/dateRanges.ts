import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  format,
} from "date-fns";

export type DateRangePreset = "this_month" | "last_month" | "this_quarter" | "custom";

export type DateRange = {
  startDate: number;
  endDate: number;
  preset: DateRangePreset;
  label: string;
};

export function getPresetRange(preset: Exclude<DateRangePreset, "custom">): DateRange {
  const now = new Date();
  switch (preset) {
    case "this_month": {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return {
        startDate: start.getTime(),
        endDate: end.getTime(),
        preset,
        label: "This Month",
      };
    }
    case "last_month": {
      const lastMonth = subMonths(now, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      return {
        startDate: start.getTime(),
        endDate: end.getTime(),
        preset,
        label: "Last Month",
      };
    }
    case "this_quarter": {
      const start = startOfQuarter(now);
      const end = endOfQuarter(now);
      return {
        startDate: start.getTime(),
        endDate: end.getTime(),
        preset,
        label: "This Quarter",
      };
    }
  }
}

export function formatRangeForFilename(startDate: number, endDate: number): string {
  return `${format(new Date(startDate), "yyyy-MM-dd")}_${format(new Date(endDate), "yyyy-MM-dd")}`;
}

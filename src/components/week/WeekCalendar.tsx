"use client";

import { addDays, format } from "date-fns";
import { de } from "date-fns/locale";
import type { TimeBlock } from "@/types";
import { TimeBlockItem } from "./TimeBlockItem";

const HOUR_START = 8;
const HOUR_END = 20;
const TOTAL_HOURS = HOUR_END - HOUR_START; // 12
const PX_PER_MINUTE = 1; // 60px per hour
const TOTAL_HEIGHT = TOTAL_HOURS * 60 * PX_PER_MINUTE;

const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i);
const halfHours = Array.from({ length: TOTAL_HOURS * 2 }, (_, i) => i);

interface WeekCalendarProps {
  weekStart: string;
  timeBlocks: TimeBlock[];
  onBlockClick: (block: TimeBlock) => void;
  onSlotClick: (date: string, time: string) => void;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - HOUR_START) * 60 + m;
}

function snapTime(px: number): string {
  const totalMinutes = Math.round(px / 30) * 30;
  const hour = Math.floor(totalMinutes / 60) + HOUR_START;
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function WeekCalendar({ weekStart, timeBlocks, onBlockClick, onSlotClick }: WeekCalendarProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(weekStart + "T00:00:00"), i);
    return {
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE dd.", { locale: de }),
    };
  });

  function blocksForDay(date: string) {
    return timeBlocks.filter((b) => b.date === date);
  }

  function handleDayClick(e: React.MouseEvent<HTMLDivElement>, date: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const time = snapTime(y);
    // Clamp to valid range
    const h = parseInt(time.split(":")[0]);
    if (h < HOUR_START || h >= HOUR_END) return;
    onSlotClick(date, time);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Day headers */}
      <div className="flex shrink-0 border-b border-slate-800">
        <div className="w-14 shrink-0" />
        {days.map(({ date, label }) => (
          <div key={date} className="flex-1 text-center py-2 text-xs font-medium text-slate-400 border-l border-slate-800 capitalize">
            {label}
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="flex overflow-y-auto flex-1">
        {/* Time axis */}
        <div className="w-14 shrink-0 relative" style={{ height: TOTAL_HEIGHT }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 text-[10px] text-slate-500 select-none"
              style={{ top: (h - HOUR_START) * 60 - 7 }}
            >
              {h < HOUR_END ? `${h}:00` : ""}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(({ date }) => (
          <div
            key={date}
            className="flex-1 relative border-l border-slate-800 cursor-pointer"
            style={{ height: TOTAL_HEIGHT }}
            onClick={(e) => handleDayClick(e, date)}
          >
            {/* 30-min grid lines */}
            {halfHours.map((i) => (
              <div
                key={i}
                className={`absolute left-0 right-0 border-t ${i % 2 === 0 ? "border-slate-800" : "border-slate-800/40"}`}
                style={{ top: i * 30 }}
              />
            ))}

            {/* Time blocks */}
            {blocksForDay(date).map((block) => {
              const startMin = toMinutes(block.startTime);
              const endMin = toMinutes(block.endTime);
              const top = Math.max(0, startMin) * PX_PER_MINUTE;
              const height = Math.max(15, (endMin - startMin)) * PX_PER_MINUTE;
              return (
                <div
                  key={block.id}
                  className="absolute left-0 right-0"
                  style={{ top, height }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <TimeBlockItem block={block} onClick={() => onBlockClick(block)} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

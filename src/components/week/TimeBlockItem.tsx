"use client";

import type { TimeBlock } from "@/types";

interface TimeBlockItemProps {
  block: TimeBlock;
  onClick: () => void;
}

export function TimeBlockItem({ block, onClick }: TimeBlockItemProps) {
  const color = block.color ?? block.projectColor ?? "#6366F1";

  return (
    <button
      onClick={onClick}
      className="absolute left-1 right-1 rounded-md px-2 py-1 text-left overflow-hidden shadow-sm hover:brightness-110 transition-all duration-100 cursor-pointer"
      style={{ backgroundColor: color + "33", borderLeft: `3px solid ${color}` }}
    >
      <p className="text-[11px] font-semibold leading-tight truncate" style={{ color }}>
        {block.title}
      </p>
      {block.projectName && (
        <p className="text-[10px] leading-tight truncate mt-0.5 opacity-80" style={{ color }}>
          {block.projectName}
        </p>
      )}
      <p className="text-[10px] leading-tight mt-0.5 opacity-70" style={{ color }}>
        {block.startTime}–{block.endTime}
      </p>
    </button>
  );
}

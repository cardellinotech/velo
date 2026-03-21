"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/formatTime";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  startTime: number;
  className?: string;
}

export function TimerDisplay({ startTime, className }: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startTime);

  useEffect(() => {
    setElapsed(Date.now() - startTime);
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatDuration(elapsed)}
    </span>
  );
}

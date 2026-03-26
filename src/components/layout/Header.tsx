"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ActiveTimerBar } from "@/components/timer/ActiveTimerBar";
import { cn } from "@/lib/utils";

export function Header() {
  const user = useQuery(api.users.current);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-white/80 backdrop-blur-sm px-6">
      {/* Left: placeholder for page title (set by individual pages) */}
      <div />

      {/* Right: active timer + user info */}
      <div className="flex items-center gap-3">
        <ActiveTimerBar />
        <div className="flex items-center gap-2.5">
          {initials && (
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold",
              "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-xs"
            )}>
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-text-secondary">
            {user?.name ?? user?.email ?? ""}
          </span>
        </div>
      </div>
    </header>
  );
}

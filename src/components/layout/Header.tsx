"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ActiveTimerBar } from "@/components/timer/ActiveTimerBar";

export function Header() {
  const user = useQuery(api.users.current);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-6">
      {/* Left: placeholder for page title (set by individual pages) */}
      <div />

      {/* Right: active timer + user info */}
      <div className="flex items-center gap-3">
        <ActiveTimerBar />
        <div className="text-sm text-text-secondary">
          {user?.name ?? user?.email ?? ""}
        </div>
      </div>
    </header>
  );
}

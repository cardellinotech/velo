"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ActiveTimerBar } from "@/components/timer/ActiveTimerBar";
import { useCreateTask } from "@/contexts/CreateTaskContext";
import { cn } from "@/lib/utils";
import { Plus, Menu } from "lucide-react";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useQuery(api.users.current);
  const { projectId, openCreateTask } = useCreateTask();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-white/80 backdrop-blur-sm px-4 sm:px-6">
      {/* Left: hamburger (mobile) + Create button (visible when on a project page) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {projectId && (
          <button
            onClick={openCreateTask}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold",
              "bg-gradient-to-r from-indigo-500 to-violet-500 text-white",
              "hover:from-indigo-600 hover:to-violet-600",
              "shadow-xs hover:shadow-sm transition-all duration-150"
            )}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Create</span>
          </button>
        )}
      </div>

      {/* Right: active timer + user info */}
      <div className="flex items-center gap-2 sm:gap-3">
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
          <span className="hidden sm:inline text-sm font-medium text-text-secondary">
            {user?.name ?? user?.email ?? ""}
          </span>
        </div>
      </div>
    </header>
  );
}

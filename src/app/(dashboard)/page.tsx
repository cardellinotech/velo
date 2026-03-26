"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { formatDurationShort, formatTimeAgo } from "@/lib/formatTime";
import {
  FolderOpen,
  LayoutDashboard,
  Clock,
  Zap,
  Square,
  ArrowRight,
  Timer,
  Layers,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const statConfigs = [
  {
    key: "projects",
    label: "Active Projects",
    icon: FolderOpen,
    gradient: "from-indigo-500 to-violet-500",
    bgGlow: "bg-indigo-500/5",
    iconBg: "bg-indigo-500/10 text-indigo-600",
  },
  {
    key: "tasks",
    label: "In Progress",
    icon: Layers,
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/5",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  {
    key: "hours",
    label: "Today's Hours",
    icon: Timer,
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/5",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
] as const;

function StatCard({
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
  bgGlow: string;
  iconBg: string;
}) {
  return (
    <div className="relative group bg-white rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-px overflow-hidden">
      {/* Top gradient line */}
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

export default function DashboardPage() {
  const toast = useToast();
  const user = useQuery(api.users.current);
  const activeTimer = useQuery(api.timeEntries.getActive);
  const statsData = useQuery(api.dashboard.stats);
  const recentTasksData = useQuery(api.dashboard.recentTasks);

  const stopMutation = useMutation(api.timeEntries.stop);

  const activeTimerTask = useQuery(
    api.tasks.get,
    activeTimer ? { taskId: activeTimer.taskId } : "skip"
  );
  const activeTimerProject = useQuery(
    api.projects.get,
    activeTimerTask ? { projectId: activeTimerTask.projectId } : "skip"
  );

  async function handleStopTimer() {
    if (!activeTimer) return;
    try {
      await stopMutation({ timeEntryId: activeTimer._id });
      toast.success("Timer stopped");
    } catch {
      toast.error("Failed to stop timer");
    }
  }

  const isLoading = statsData === undefined || recentTasksData === undefined;
  const isEmpty = !isLoading && recentTasksData.length === 0 && statsData.activeProjectCount === 0;

  const statValues = isLoading ? [] : [
    { ...statConfigs[0], value: statsData.activeProjectCount },
    { ...statConfigs[1], value: statsData.inProgressTaskCount },
    { ...statConfigs[2], value: formatDurationShort(statsData.todayTotalDuration) },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome section */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Hey {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Link href="/projects">
          <Button variant="secondary" size="sm" className="gap-1.5">
            View all projects
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Active timer widget */}
      {activeTimer && (
        <div className="relative rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50/50 px-5 py-4 shadow-xs overflow-hidden">
          {/* Subtle animated gradient shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
          <div className="relative flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
              <div className="relative">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {activeTimerTask ? (
                <Link
                  href={`/tasks/${activeTimer.taskId}`}
                  className="text-sm font-semibold text-text-primary hover:text-primary transition-colors truncate block"
                >
                  {activeTimerTask.title}
                </Link>
              ) : (
                <span className="text-sm text-text-secondary">Loading…</span>
              )}
              {activeTimerProject && (
                <span className="text-xs text-text-secondary">{activeTimerProject.name}</span>
              )}
            </div>
            <TimerDisplay
              startTime={activeTimer.startTime}
              className="text-lg font-semibold text-emerald-700 font-mono tabular-nums"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStopTimer}
              className="text-text-secondary hover:text-error hover:bg-error/5 shrink-0"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border p-5 animate-pulse">
              <div className="h-8 w-16 bg-surface rounded-md mb-2" />
              <div className="h-3 w-24 bg-surface rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {statValues.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              gradient={stat.gradient}
              bgGlow={stat.bgGlow}
              iconBg={stat.iconBg}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center border border-indigo-100">
              <LayoutDashboard className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-text-primary">Welcome to Velo</p>
            <p className="text-sm text-text-secondary mt-1 max-w-xs">
              Create your first project and start tracking time. Your dashboard will come alive.
            </p>
          </div>
          <Link href="/projects">
            <Button className="gap-2">
              Create a project
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        /* Recent activity */
        !isLoading && recentTasksData.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Recent Activity</h2>
              <span className="text-xs text-text-muted">{recentTasksData.length} tasks</span>
            </div>
            <div className="bg-white rounded-xl shadow-card border border-border overflow-hidden divide-y divide-border">
              {recentTasksData.map((task) => (
                <Link
                  key={task._id}
                  href={`/tasks/${task._id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface/70 transition-colors duration-100 group"
                >
                  <TaskTypeBadge taskType={task.taskType} />
                  <span className="flex-1 text-sm text-text-primary truncate group-hover:text-primary transition-colors duration-100">
                    {task.title}
                  </span>
                  <span className="text-xs text-text-secondary shrink-0 bg-surface px-2 py-0.5 rounded-md">
                    {task.projectName}
                  </span>
                  <span className="text-xs text-text-muted shrink-0 ml-1">
                    {formatTimeAgo(task.updatedAt)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

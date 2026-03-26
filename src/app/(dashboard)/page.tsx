"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TaskTypeBadge } from "@/components/tasks/TaskTypeBadge";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { formatDurationShort, formatTimeAgo } from "@/lib/formatTime";
import { FolderOpen, LayoutDashboard, Clock, Zap, Square } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { TASK_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xl font-semibold text-text-primary">{value}</p>
          <p className="text-xs text-text-secondary">{label}</p>
        </div>
      </div>
    </Card>
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

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Hey {user?.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Active timer widget */}
      {activeTimer && (
        <div className="flex items-center gap-3 rounded-md border border-success/30 bg-success/5 px-4 py-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-success animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            {activeTimerTask ? (
              <Link
                href={`/tasks/${activeTimer.taskId}`}
                className="text-sm font-medium text-text-primary hover:underline truncate block"
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
          <TimerDisplay startTime={activeTimer.startTime} className="text-sm font-medium text-success" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStopTimer}
            className="text-text-secondary hover:text-error shrink-0"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        </div>
      )}

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-md border border-border p-4 animate-pulse">
              <div className="h-7 w-16 bg-surface rounded mb-1" />
              <div className="h-3 w-24 bg-surface rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Active projects" value={statsData.activeProjectCount} icon={FolderOpen} />
          <StatCard label="In progress" value={statsData.inProgressTaskCount} icon={Zap} />
          <StatCard label="Today's hours" value={formatDurationShort(statsData.todayTotalDuration)} icon={Clock} />
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6 text-text-secondary opacity-50" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Welcome to Velo</p>
            <p className="text-sm text-text-secondary mt-1">
              Create your first project to start tracking time.
            </p>
          </div>
          <Link href="/projects">
            <Button>Create a project</Button>
          </Link>
        </div>
      ) : (
        /* Recent activity */
        !isLoading && recentTasksData.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-text-primary">Recent Activity</h2>
            <Card>
              {recentTasksData.map((task, i) => (
                <Link
                  key={task._id}
                  href={`/tasks/${task._id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors",
                    i < recentTasksData.length - 1 && "border-b border-border/50"
                  )}
                >
                  <TaskTypeBadge taskType={task.taskType} />
                  <span className="flex-1 text-sm text-text-primary truncate">{task.title}</span>
                  <span className="text-xs text-text-secondary shrink-0">{task.projectName}</span>
                  <span className="text-xs text-text-secondary shrink-0 ml-3">
                    {formatTimeAgo(task.updatedAt)}
                  </span>
                </Link>
              ))}
            </Card>
          </div>
        )
      )}
    </div>
  );
}

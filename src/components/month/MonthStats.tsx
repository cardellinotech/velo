"use client";

import { Clock, TrendingUp, CheckSquare, Briefcase } from "lucide-react";
import type { MonthStats } from "@/types";

interface MonthStatsProps {
  stats: MonthStats | undefined;
  isLoading: boolean;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  isLoading: boolean;
}

function StatCard({ label, value, icon, isLoading }: StatCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
      <div className="p-2.5 rounded-lg bg-slate-700/50 text-indigo-400 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        {isLoading ? (
          <div className="h-5 w-16 bg-slate-700 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-lg font-semibold text-white">{value}</p>
        )}
      </div>
    </div>
  );
}

export function MonthStats({ stats, isLoading }: MonthStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Stunden"
        value={stats ? `${stats.totalHours.toFixed(1)}h` : "–"}
        icon={<Clock className="w-4 h-4" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Einnahmen"
        value={stats ? `€${stats.totalRevenue.toFixed(2)}` : "–"}
        icon={<TrendingUp className="w-4 h-4" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Tasks erledigt"
        value={stats ? `${stats.completedTasks}/${stats.totalTasks}` : "–"}
        icon={<CheckSquare className="w-4 h-4" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Projekte"
        value={stats ? `${stats.activeProjects}` : "–"}
        icon={<Briefcase className="w-4 h-4" />}
        isLoading={isLoading}
      />
    </div>
  );
}

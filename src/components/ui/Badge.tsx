import { cn } from "@/lib/utils";
import type { TaskType } from "@/lib/constants";

interface BadgeProps {
  children: React.ReactNode;
  variant?: TaskType | "default";
  className?: string;
}

const variantClasses: Record<string, string> = {
  bug: "bg-badge-bug text-badge-bug-text",
  story: "bg-badge-story text-badge-story-text",
  task: "bg-badge-task text-badge-task-text",
  incident: "bg-badge-incident text-badge-incident-text",
  default: "bg-surface text-text-secondary",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium",
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
    >
      {children}
    </span>
  );
}

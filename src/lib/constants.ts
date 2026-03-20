export const TASK_TYPES = {
  story: { label: "Story", badgeBg: "bg-badge-story", badgeText: "text-badge-story-text" },
  task: { label: "Task", badgeBg: "bg-badge-task", badgeText: "text-badge-task-text" },
  bug: { label: "Bug", badgeBg: "bg-badge-bug", badgeText: "text-badge-bug-text" },
  incident: { label: "Incident", badgeBg: "bg-badge-incident", badgeText: "text-badge-incident-text" },
} as const;

export const TASK_STATUSES = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
} as const;

export const PRIORITIES = {
  low: { label: "Low", color: "#6B7280" },
  medium: { label: "Medium", color: "#F59E0B" },
  high: { label: "High", color: "#EF4444" },
  urgent: { label: "Urgent", color: "#7C3AED" },
} as const;

export type TaskType = keyof typeof TASK_TYPES;
export type TaskStatus = keyof typeof TASK_STATUSES;
export type Priority = keyof typeof PRIORITIES;

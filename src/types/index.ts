import type { Id } from "../../convex/_generated/dataModel";
import type { TaskType, TaskStatus, Priority } from "@/lib/constants";

export type { TaskType, TaskStatus, Priority };

export interface Project {
  _id: Id<"projects">;
  userId: Id<"users">;
  name: string;
  clientName?: string;
  description?: string;
  status: "active" | "archived";
  createdAt: number;
  updatedAt: number;
}

export interface Epic {
  _id: Id<"epics">;
  projectId: Id<"projects">;
  userId: Id<"users">;
  name: string;
  description?: string;
  status: "open" | "closed";
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  _id: Id<"tasks">;
  projectId: Id<"projects">;
  epicId?: Id<"epics">;
  userId: Id<"users">;
  title: string;
  description?: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: Priority;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TimeEntry {
  _id: Id<"timeEntries">;
  taskId: Id<"tasks">;
  projectId: Id<"projects">;
  userId: Id<"users">;
  startTime: number;
  endTime?: number;
  duration?: number;
  description?: string;
  isManual: boolean;
  createdAt: number;
}

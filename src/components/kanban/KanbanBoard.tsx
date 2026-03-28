"use client";

import { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { KanbanColumn } from "./KanbanColumn";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { useToast } from "@/hooks/useToast";
import { TASK_STATUSES } from "@/lib/constants";
import type { TaskStatus } from "@/lib/constants";

const COLUMN_ORDER: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];

interface KanbanBoardProps {
  projectId: Id<"projects">;
  filters: {
    taskTypes: string[];
    epicId: string | null;
    priorities: string[];
  };
}

export function KanbanBoard({ projectId, filters }: KanbanBoardProps) {
  const toast = useToast();
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const tasks = useQuery(api.tasks.listByProject, { projectId });
  const epics = useQuery(api.epics.listByProject, { projectId });
  const moveToColumn = useMutation(api.tasks.moveToColumn);
  const reorder = useMutation(api.tasks.reorder);
  const startTimer = useMutation(api.timeEntries.start);
  const stopForTask = useMutation(api.timeEntries.stopForTask);

  if (tasks === undefined || epics === undefined) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_ORDER.map((status) => (
          <div key={status} className="flex flex-col w-[272px] shrink-0 gap-3 animate-pulse">
            <div className="h-5 w-32 bg-border rounded" />
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-border rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Build epics map for lookup
  const epicsMap: Record<string, { name: string; color?: string }> = {};
  for (const epic of epics) {
    epicsMap[epic._id] = { name: epic.name, color: epic.color };
  }

  // Apply filters
  let filteredTasks = tasks as Doc<"tasks">[];
  if (filters.taskTypes.length > 0) {
    filteredTasks = filteredTasks.filter((t) =>
      filters.taskTypes.includes(t.taskType)
    );
  }
  if (filters.epicId) {
    filteredTasks = filteredTasks.filter((t) => t.epicId === filters.epicId);
  }
  if (filters.priorities.length > 0) {
    filteredTasks = filteredTasks.filter((t) =>
      filters.priorities.includes(t.priority)
    );
  }

  // Group by status, sorted by order
  const columns: Record<TaskStatus, Doc<"tasks">[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };
  for (const task of filteredTasks) {
    if (columns[task.status as TaskStatus]) {
      columns[task.status as TaskStatus].push(task);
    }
  }
  for (const status of COLUMN_ORDER) {
    columns[status].sort((a, b) => a.order - b.order);
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as TaskStatus;
    const destStatus = result.destination.droppableId as TaskStatus;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    // No-op if dropped in the same position
    if (sourceStatus === destStatus && sourceIndex === destIndex) return;

    const taskId = result.draggableId as Id<"tasks">;

    try {
      if (sourceStatus === destStatus) {
        await reorder({ taskId, sourceIndex, destinationIndex: destIndex });
      } else {
        await moveToColumn({
          taskId,
          newStatus: destStatus,
          destinationIndex: destIndex,
        });
        toast.success(`Task moved to ${TASK_STATUSES[destStatus]}`);
        setAnnouncement(`Task moved to ${TASK_STATUSES[destStatus]}`);

        // Auto-timer: start when entering in_progress
        if (destStatus === "in_progress") {
          try {
            await startTimer({ taskId });
            toast.info("Timer started automatically");
          } catch {
            // Non-fatal — don't surface timer errors over the move success
          }
        }

        // Auto-timer: stop when leaving in_progress
        if (sourceStatus === "in_progress" && destStatus !== "in_progress") {
          try {
            await stopForTask({ taskId });
          } catch {
            // Non-fatal
          }
        }
      }
    } catch {
      toast.error("Failed to move task. Please try again.");
    }
  }

  return (
    <>
      {/* Screen reader announcements for drag & drop */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          role="region"
          aria-label="Kanban board"
          style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}
        >
          {COLUMN_ORDER.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              title={TASK_STATUSES[status]}
              tasks={columns[status]}
              epicsMap={epicsMap}
              onTaskClick={setSelectedTaskId}
            />
          ))}
        </div>
      </DragDropContext>

      <TaskDetailModal
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </>
  );
}

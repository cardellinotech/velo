"use client";

import { cn } from "@/lib/utils";
import { TASK_TYPES, type TaskType } from "@/lib/constants";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useToast } from "@/hooks/useToast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  GripVertical,
  Trash2,
  ArrowRight,
  ClipboardList,
  FolderKanban,
  StickyNote,
} from "lucide-react";
import { format, isToday, isBefore, startOfDay, addDays } from "date-fns";
import { useCallback, useMemo } from "react";

type PlanItem = {
  _id: Id<"dailyPlanItems">;
  title: string;
  isCompleted: boolean;
  order: number;
  taskId?: Id<"tasks"> | null;
  projectName?: string | null;
  taskDeleted?: boolean;
  taskStatus?: string | null;
  taskType?: string | null;
};

interface DailyPlanListProps {
  items: PlanItem[];
  date: Date;
  dateStr: string;
}

const NOTES_GROUP = "__notes__";

export function DailyPlanList({ items, date, dateStr }: DailyPlanListProps) {
  const toast = useToast();
  const toggleComplete = useMutation(api.dailyPlan.toggleComplete);
  const reorder = useMutation(api.dailyPlan.reorder);
  const remove = useMutation(api.dailyPlan.remove);
  const copyToDate = useMutation(api.dailyPlan.copyToDate);

  const incompleteItems = items.filter((i) => !i.isCompleted && !i.taskDeleted);
  const allComplete = items.length > 0 && incompleteItems.length === 0;
  const showCarryOver =
    incompleteItems.length > 0 &&
    isBefore(startOfDay(date), startOfDay(new Date()));

  // Group items by project
  const groups = useMemo(() => {
    const map = new Map<string, PlanItem[]>();

    // Sort: incomplete first (by order), then completed (by order)
    const sorted = [...items].sort((a, b) => {
      const aCompleted = a.isCompleted || a.taskDeleted;
      const bCompleted = b.isCompleted || b.taskDeleted;
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      return a.order - b.order;
    });

    for (const item of sorted) {
      const key = item.taskId ? (item.projectName ?? "Unknown Project") : NOTES_GROUP;
      const group = map.get(key);
      if (group) {
        group.push(item);
      } else {
        map.set(key, [item]);
      }
    }

    // Project groups first, notes last
    const entries = [...map.entries()];
    const projectGroups = entries.filter(([key]) => key !== NOTES_GROUP);
    const notesGroup = entries.find(([key]) => key === NOTES_GROUP);
    return [...projectGroups, ...(notesGroup ? [notesGroup] : [])];
  }, [items]);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const { source, destination } = result;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      )
        return;

      // Find the item that was dragged
      const groupKey = source.droppableId;
      const group = groups.find(([key]) => key === groupKey);
      if (!group) return;
      const groupItems = group[1];
      const item = groupItems[source.index];
      if (!item) return;

      // If same group, compute new order relative to group
      if (source.droppableId === destination.droppableId) {
        const reordered = [...groupItems];
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);

        // Find global indices for the reordered items
        const allSorted = [...items].sort((a, b) => a.order - b.order);
        const globalIndex = allSorted.findIndex((i) => i._id === item._id);
        const targetItem = reordered[destination.index === 0 ? 1 : destination.index - 1];
        const targetGlobalIndex = targetItem
          ? allSorted.findIndex((i) => i._id === targetItem._id)
          : 0;

        reorder({
          itemId: item._id,
          newOrder: destination.index > source.index ? targetGlobalIndex : targetGlobalIndex + 1,
        }).catch(() => toast.error("Failed to reorder"));
      }
    },
    [groups, items, reorder, toast]
  );

  const handleToggle = async (itemId: Id<"dailyPlanItems">) => {
    try {
      const result = await toggleComplete({ itemId });
      if (result.taskId && result.isCompleted) {
        toast.info("Plan item checked. Move task to Done on the board to sync.");
      }
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleRemove = async (itemId: Id<"dailyPlanItems">) => {
    try {
      await remove({ itemId });
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleCarryOver = async () => {
    const targetDate = isToday(date)
      ? format(addDays(new Date(), 1), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");
    try {
      const count = await copyToDate({ fromDate: dateStr, toDate: targetDate });
      if (count === 0) {
        toast.info("All items already exist on the target date.");
      } else {
        toast.success(`${count} item${count > 1 ? "s" : ""} carried over.`);
      }
    } catch {
      toast.error("Failed to carry over items");
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
          <ClipboardList className="w-7 h-7 text-text-muted" />
        </div>
        <p className="text-text-secondary text-sm font-medium mb-1">
          Nothing planned for this day.
        </p>
        <p className="text-text-muted text-xs">
          Add tasks or notes to get started.
        </p>
      </div>
    );
  }

  if (allComplete) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold text-text-primary mb-1">All done!</p>
        <p className="text-text-muted text-sm">Great work today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        {groups.map(([groupKey, groupItems]) => {
          const isNotes = groupKey === NOTES_GROUP;
          return (
            <div key={groupKey}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                {isNotes ? (
                  <StickyNote className="w-3.5 h-3.5 text-text-muted" />
                ) : (
                  <FolderKanban className="w-3.5 h-3.5 text-text-muted" />
                )}
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {isNotes ? "Notes" : groupKey}
                </span>
                <span className="text-[10px] text-text-muted">
                  {groupItems.filter((i) => !i.isCompleted && !i.taskDeleted).length}/{groupItems.length}
                </span>
              </div>

              {/* Group items */}
              <Droppable droppableId={groupKey}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "rounded-xl border border-border/40 divide-y divide-border/30 transition-colors",
                      snapshot.isDraggingOver && "bg-indigo-50/30 border-indigo-200/50"
                    )}
                  >
                    {groupItems.map((item, index) => (
                      <Draggable
                        key={item._id}
                        draggableId={item._id}
                        index={index}
                        isDragDisabled={item.isCompleted || !!item.taskDeleted}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 bg-white group transition-all",
                              index === 0 && "rounded-t-xl",
                              index === groupItems.length - 1 && "rounded-b-xl",
                              snapshot.isDragging &&
                                "shadow-lg rounded-xl border border-indigo-200 z-10",
                              (item.isCompleted || item.taskDeleted) && "opacity-50"
                            )}
                          >
                            {/* Drag handle */}
                            <div
                              {...provided.dragHandleProps}
                              className={cn(
                                "flex items-center justify-center w-6 h-6 shrink-0 text-text-muted/40 hover:text-text-muted transition-colors cursor-grab active:cursor-grabbing",
                                (item.isCompleted || item.taskDeleted) &&
                                  "pointer-events-none"
                              )}
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Checkbox */}
                            <button
                              onClick={() => handleToggle(item._id)}
                              disabled={!!item.taskDeleted}
                              className={cn(
                                "flex items-center justify-center w-5 h-5 shrink-0 rounded-md border-2 transition-all",
                                item.isCompleted
                                  ? "bg-indigo-500 border-indigo-500 text-white"
                                  : "border-border hover:border-indigo-400"
                              )}
                              aria-label={
                                item.isCompleted ? "Mark incomplete" : "Mark complete"
                              }
                            >
                              {item.isCompleted && (
                                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M2.5 6L5 8.5L9.5 4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  "text-sm",
                                  item.isCompleted && "line-through text-text-muted",
                                  item.taskDeleted && "line-through text-text-muted",
                                  !item.isCompleted &&
                                    !item.taskDeleted &&
                                    "text-text-primary"
                                )}
                              >
                                {item.taskDeleted ? "(deleted task)" : item.title}
                              </span>
                            </div>

                            {/* Type badge (only for linked tasks) */}
                            {item.taskType && !item.taskDeleted && (
                              <span
                                className={cn(
                                  "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0",
                                  TASK_TYPES[item.taskType as TaskType]?.badgeBg,
                                  TASK_TYPES[item.taskType as TaskType]?.badgeText
                                )}
                              >
                                {TASK_TYPES[item.taskType as TaskType]?.label}
                              </span>
                            )}

                            {/* Remove button */}
                            <button
                              onClick={() => handleRemove(item._id)}
                              className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 shrink-0 text-text-muted/40 hover:text-red-500 transition-all"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </DragDropContext>

      {showCarryOver && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleCarryOver}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Carry over to today
          </button>
        </div>
      )}
    </div>
  );
}

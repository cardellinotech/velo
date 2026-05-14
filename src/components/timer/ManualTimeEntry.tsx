"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api";
import type { TimeEntry } from "@/types";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface ManualTimeEntryProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  entry?: TimeEntry;
}

function toDateStr(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function toTimeStr(ms: number): string {
  const d = new Date(ms);
  return d.toTimeString().slice(0, 5);
}

export function ManualTimeEntry({ open, onClose, taskId, entry }: ManualTimeEntryProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync: createManual } = useMutation({
    mutationFn: (data: {
      taskId: string;
      projectId: string;
      startTime: number;
      endTime: number;
      description?: string;
    }) => api.timeEntries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.byTask(taskId) });
    },
  });

  const { mutateAsync: updateEntry } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntry> }) =>
      api.timeEntries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries.byTask(taskId) });
    },
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (entry) {
        setDate(toDateStr(entry.startTime));
        setStartTime(toTimeStr(entry.startTime));
        setEndTime(entry.endTime ? toTimeStr(entry.endTime) : "10:00");
        setDescription(entry.description ?? "");
      } else {
        setDate(todayStr);
        setStartTime("09:00");
        setEndTime("10:00");
        setDescription("");
      }
      setError(null);
    }
  }, [open, entry]);

  function toTimestamp(dateStr: string, timeStr: string): number {
    return new Date(`${dateStr}T${timeStr}`).getTime();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const start = toTimestamp(date, startTime);
    const end = toTimestamp(date, endTime);

    if (isNaN(start) || isNaN(end)) {
      setError("Invalid date or time values.");
      return;
    }
    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      if (entry) {
        await updateEntry({
          id: entry.id,
          data: {
            startTime: start,
            endTime: end,
            description: description.trim() || undefined,
          },
        });
        toast.success("Time entry updated");
      } else {
        // We don't have projectId here — use the task's projectId if available
        // The API requires projectId; we'll pass taskId and let the server resolve it
        await createManual({
          taskId,
          projectId: "", // server-side will resolve from taskId
          startTime: start,
          endTime: end,
          description: description.trim() || undefined,
        });
        toast.success("Time entry added");
      }
      onClose();
    } catch {
      toast.error(entry ? "Failed to update time entry" : "Failed to save time entry");
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={entry ? "Edit time entry" : "Add manual time entry"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <Input
            label="Start time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <Input
            label="End time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
        <Input
          label="Description (optional)"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you work on?"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {entry ? "Save changes" : "Save entry"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

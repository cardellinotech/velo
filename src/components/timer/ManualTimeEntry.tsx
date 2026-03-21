"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface ManualTimeEntryProps {
  open: boolean;
  onClose: () => void;
  taskId: Id<"tasks">;
}

export function ManualTimeEntry({ open, onClose, taskId }: ManualTimeEntryProps) {
  const toast = useToast();
  const createManual = useMutation(api.timeEntries.createManual);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await createManual({
        taskId,
        startTime: start,
        endTime: end,
        description: description.trim() || undefined,
      });
      toast.success("Time entry added");
      onClose();
      setDate(todayStr);
      setStartTime("09:00");
      setEndTime("10:00");
      setDescription("");
    } catch {
      toast.error("Failed to save time entry");
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add manual time entry">
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
            Save entry
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

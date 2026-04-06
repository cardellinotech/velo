"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/useToast";
import { Plus } from "lucide-react";
import { useState, useRef } from "react";

interface QuickAddInputProps {
  dateStr: string;
}

export function QuickAddInput({ dateStr }: QuickAddInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const addFreeText = useMutation(api.dailyPlan.addFreeText);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    try {
      await addFreeText({ date: dateStr, title: trimmed });
      setValue("");
      inputRef.current?.focus();
    } catch {
      toast.error("Failed to add note");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/40 bg-white hover:border-indigo-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
      <Plus className="w-4 h-4 text-text-muted shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a note..."
        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
      />
    </div>
  );
}

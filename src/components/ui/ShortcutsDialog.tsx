"use client";

import { Dialog } from "./Dialog";

interface ShortcutEntry {
  key: string;
  description: string;
  context?: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { key: "N", description: "New task", context: "Kanban board" },
  { key: "P", description: "New project", context: "Projects list" },
  { key: "T", description: "Start / stop timer", context: "Task detail" },
  { key: "Esc", description: "Close dialog / panel" },
  { key: "?", description: "Show keyboard shortcuts" },
];

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts">
      <div className="flex flex-col gap-1">
        {SHORTCUTS.map(({ key, description, context }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0"
          >
            <div>
              <p className="text-sm text-text-primary">{description}</p>
              {context && (
                <p className="text-xs text-text-secondary mt-0.5">{context}</p>
              )}
            </div>
            <kbd className="shrink-0 inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded border border-border bg-surface font-mono text-xs text-text-secondary shadow-sm">
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

"use client";

import { useEffect } from "react";

type ShortcutMap = Record<string, () => void>;

function isInputActive(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
}

/**
 * Registers keyboard shortcuts. Handlers are skipped when the user is
 * typing in an input, textarea, select, or contenteditable element, and
 * when modifier keys (Ctrl, Meta, Alt) are held.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isInputActive()) return;

      const handler = shortcuts[e.key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
